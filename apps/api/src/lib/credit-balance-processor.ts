import {
	and,
	apiKey,
	db,
	eq,
	inArray,
	log,
	lt,
	organization,
	sql,
	tables,
} from "@llmgateway/db";
import { logger } from "@llmgateway/logger";
import { hasErrorCode } from "@llmgateway/models";

const CREDIT_PROCESSING_LOCK_KEY = "credit_processing";
const LOCK_DURATION_MINUTES = 5;
const DEFAULT_CREDIT_BATCH_SIZE = 100;
const DEFAULT_CREDIT_LOOP_INTERVAL_MS = 5_000;

let isRunning = false;
let shouldStop = false;
let currentLoop: Promise<void> | null = null;
let currentSleepTimer: NodeJS.Timeout | null = null;

function getBatchSize(): number {
	return Math.max(
		1,
		Number(process.env.CREDIT_BATCH_SIZE ?? DEFAULT_CREDIT_BATCH_SIZE),
	);
}

function getLoopIntervalMs(): number {
	const configuredIntervalMs =
		process.env.CREDIT_BATCH_INTERVAL_MS !== undefined
			? Number(process.env.CREDIT_BATCH_INTERVAL_MS)
			: Number(process.env.CREDIT_BATCH_INTERVAL ?? "5") * 1000;

	return Math.max(
		1_000,
		Number.isFinite(configuredIntervalMs)
			? configuredIntervalMs
			: DEFAULT_CREDIT_LOOP_INTERVAL_MS,
	);
}

async function acquireLock(key: string): Promise<boolean> {
	const lockDurationMs = LOCK_DURATION_MINUTES * 60 * 1000;
	const lockExpiry = new Date(Date.now() - lockDurationMs);

	try {
		await db.transaction(async (tx) => {
			await tx
				.delete(tables.lock)
				.where(
					and(eq(tables.lock.key, key), lt(tables.lock.updatedAt, lockExpiry)),
				);

			try {
				await tx.insert(tables.lock).values({
					key,
				});
			} catch (insertError) {
				const actualError =
					insertError instanceof Error && "cause" in insertError
						? insertError.cause
						: insertError;

				if (hasErrorCode(actualError) && actualError.code === "23505") {
					throw new Error("LOCK_EXISTS");
				}

				throw insertError;
			}
		});

		return true;
	} catch (error) {
		if (error instanceof Error && error.message === "LOCK_EXISTS") {
			return false;
		}

		throw error;
	}
}

async function releaseLock(key: string): Promise<void> {
	await db.delete(tables.lock).where(eq(tables.lock.key, key));
}

async function sleep(ms: number): Promise<void> {
	if (shouldStop) {
		return;
	}

	await new Promise<void>((resolve) => {
		currentSleepTimer = setTimeout(() => {
			currentSleepTimer = null;
			resolve();
		}, ms);
	});
}

export async function processCreditBalanceBatch(): Promise<void> {
	const lockAcquired = await acquireLock(CREDIT_PROCESSING_LOCK_KEY);
	if (!lockAcquired) {
		return;
	}

	try {
		await db.transaction(async (tx) => {
			const rows = await tx
				.select({
					id: log.id,
					requestId: log.requestId,
					organizationId: log.organizationId,
					apiKeyId: log.apiKeyId,
					cost: log.cost,
					cached: log.cached,
					usedMode: log.usedMode,
					usedModel: log.usedModel,
					dataStorageCost: log.dataStorageCost,
				})
				.from(log)
				.where(sql`${log.processedAt} IS NULL`)
				.orderBy(sql`${log.createdAt} ASC`)
				.limit(getBatchSize())
				.for("update", { of: [log], skipLocked: true });

			if (rows.length === 0) {
				return;
			}

			const orgCosts = new Map<string, number>();
			const apiKeyCosts = new Map<string, number>();
			const logIds: string[] = [];
			const usageDebitActions: Array<{
				organizationId: string;
				amount: string;
				description: string;
			}> = [];

			for (const row of rows) {
				logIds.push(row.id);

				if (!row.cost || row.cost <= 0 || row.cached) {
					continue;
				}

				const currentApiKeyCost = apiKeyCosts.get(row.apiKeyId) ?? 0;
				apiKeyCosts.set(row.apiKeyId, currentApiKeyCost + row.cost);

				if (row.usedMode === "credits") {
					const usageCost = row.cost;
					const currentOrgCost = orgCosts.get(row.organizationId) ?? 0;
					orgCosts.set(row.organizationId, currentOrgCost + usageCost);
					usageDebitActions.push({
						organizationId: row.organizationId,
						amount: usageCost.toString(),
						description: `Usage debit for request ${row.requestId} (${row.usedModel})`,
					});
					continue;
				}

				if (!row.dataStorageCost) {
					continue;
				}

				const storageCost = Number(row.dataStorageCost);
				if (storageCost <= 0) {
					continue;
				}

				const currentOrgCost = orgCosts.get(row.organizationId) ?? 0;
				orgCosts.set(row.organizationId, currentOrgCost + storageCost);
				usageDebitActions.push({
					organizationId: row.organizationId,
					amount: storageCost.toString(),
					description: `Data retention debit for request ${row.requestId} (${row.usedModel})`,
				});
			}

			if (usageDebitActions.length > 0) {
				await tx.insert(tables.organizationAction).values(
					usageDebitActions.map((action) => ({
						organizationId: action.organizationId,
						type: "debit" as const,
						amount: action.amount,
						description: action.description,
					})),
				);
			}

			for (const [orgId, totalCost] of orgCosts.entries()) {
				if (totalCost <= 0) {
					continue;
				}

				let remainingCost = totalCost;
				const org = await tx.query.organization.findFirst({
					where: { id: { eq: orgId } },
				});

				if (!org) {
					continue;
				}

				if (org.devPlan !== "none") {
					const devPlanCreditsLimit = Number(org.devPlanCreditsLimit || "0");
					const devPlanCreditsUsed = Number(org.devPlanCreditsUsed || "0");
					const devPlanRemaining = Math.max(
						0,
						devPlanCreditsLimit - devPlanCreditsUsed,
					);

					if (devPlanRemaining > 0) {
						const deductFromDevPlan = Math.min(remainingCost, devPlanRemaining);
						if (deductFromDevPlan > 0) {
							await tx
								.update(organization)
								.set({
									devPlanCreditsUsed: sql`${organization.devPlanCreditsUsed} + ${deductFromDevPlan}`,
								})
								.where(eq(organization.id, orgId));

							remainingCost -= deductFromDevPlan;
						}
					}
				}

				if (remainingCost > 0) {
					const regularCredits = Math.max(0, Number(org.credits || "0"));
					const deductFromRegular = Math.min(remainingCost, regularCredits);

					if (deductFromRegular > 0) {
						await tx
							.update(organization)
							.set({
								credits: sql`${organization.credits} - ${deductFromRegular}`,
							})
							.where(eq(organization.id, orgId));
					}
				}
			}

			for (const [apiKeyId, totalCost] of apiKeyCosts.entries()) {
				if (totalCost <= 0) {
					continue;
				}

				await tx
					.update(apiKey)
					.set({
						usage: sql`${apiKey.usage} + ${totalCost}`,
					})
					.where(eq(apiKey.id, apiKeyId));
			}

			await tx
				.update(log)
				.set({
					processedAt: new Date(),
				})
				.where(inArray(log.id, logIds));

			logger.info("Processed API credit settlement batch", {
				logCount: logIds.length,
				organizationCount: orgCosts.size,
				apiKeyCount: apiKeyCosts.size,
			});
		});
	} catch (error) {
		logger.error(
			"Error processing API credit settlement batch",
			error instanceof Error ? error : new Error(String(error)),
		);
	} finally {
		await releaseLock(CREDIT_PROCESSING_LOCK_KEY);
	}
}

async function runLoop(): Promise<void> {
	while (!shouldStop) {
		await processCreditBalanceBatch();

		if (!shouldStop) {
			await sleep(getLoopIntervalMs());
		}
	}
}

export function startCreditBalanceProcessor(): void {
	if (isRunning) {
		return;
	}

	isRunning = true;
	shouldStop = false;
	logger.info("Starting API credit balance processor");
	currentLoop = runLoop().finally(() => {
		currentLoop = null;
		isRunning = false;
	});
}

export async function stopCreditBalanceProcessor(): Promise<void> {
	shouldStop = true;

	if (currentSleepTimer) {
		clearTimeout(currentSleepTimer);
		currentSleepTimer = null;
	}

	if (currentLoop) {
		await currentLoop;
	}
}
