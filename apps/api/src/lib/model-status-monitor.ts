import {
	and,
	desc,
	db,
	eq,
	lt,
	modelStatusCheck,
	tables,
} from "@llmgateway/db";
import { logger } from "@llmgateway/logger";
import { hasErrorCode } from "@llmgateway/models";

const DEFAULT_STATUS_MONITOR_INTERVAL_HOURS = 12;
const DEFAULT_STATUS_MONITOR_TIMEOUT_MS = 45_000;
const DEFAULT_STATUS_MONITOR_CONCURRENCY = 4;
const DEFAULT_STATUS_MONITOR_BATCH_SIZE = 10;
const DEFAULT_STATUS_MONITOR_LOOP_INTERVAL_MS = 60_000;
const LOCK_DURATION_MINUTES = 5;
const DEV_MONITOR_API_KEY = "test-token";
const STATUS_MONITOR_LOCK_KEY = "model_status_monitor";
const MIN_TRIGGER_SPACING_MS = 30_000;

interface MonitoredModel {
	id: string;
	name: string;
	family: string;
}

interface StatusCheckResult {
	modelId: string;
	success: boolean;
	responseTimeMs: number;
	statusCode: number | null;
	errorMessage: string | null;
}

let isRunning = false;
let shouldStop = false;
let currentSleepTimer: NodeJS.Timeout | null = null;
let currentLoop: Promise<void> | null = null;
let currentTriggerPromise: Promise<boolean> | null = null;
let lastTriggerStartedAt = 0;

function getStatusMonitorIntervalHours(): number {
	return Number(
		process.env.MODEL_STATUS_CHECK_INTERVAL_HOURS ??
			DEFAULT_STATUS_MONITOR_INTERVAL_HOURS,
	);
}

function getStatusMonitorTimeoutMs(): number {
	return Number(
		process.env.MODEL_STATUS_CHECK_TIMEOUT_MS ??
			DEFAULT_STATUS_MONITOR_TIMEOUT_MS,
	);
}

function getStatusMonitorConcurrency(): number {
	return Math.max(
		1,
		Number(
			process.env.MODEL_STATUS_CHECK_CONCURRENCY ??
				DEFAULT_STATUS_MONITOR_CONCURRENCY,
		),
	);
}

function getStatusMonitorBatchSize(): number {
	return Math.max(
		1,
		Number(
			process.env.MODEL_STATUS_CHECK_BATCH_SIZE ??
				DEFAULT_STATUS_MONITOR_BATCH_SIZE,
		),
	);
}

function getStatusMonitorGatewayUrl(): string {
	if (process.env.STATUS_MONITOR_GATEWAY_URL) {
		return process.env.STATUS_MONITOR_GATEWAY_URL;
	}

	if (process.env.GATEWAY_URL) {
		return process.env.GATEWAY_URL;
	}

	return process.env.HOSTED === "true"
		? "https://api.kiwillm.in"
		: "http://localhost:4001";
}

function getStatusMonitorApiKey(): string | null {
	if (process.env.STATUS_MONITOR_API_KEY) {
		return process.env.STATUS_MONITOR_API_KEY;
	}

	if (process.env.NODE_ENV !== "production") {
		return DEV_MONITOR_API_KEY;
	}

	return null;
}

function isChatModelOutput(output: string[] | null | undefined): boolean {
	return Array.isArray(output) && output.includes("text");
}

async function acquireLock(key: string): Promise<boolean> {
	const lockExpiry = new Date(
		Date.now() - (LOCK_DURATION_MINUTES * 60 * 1000),
	);

	try {
		await db.transaction(async (tx) => {
			await tx
				.delete(tables.lock)
				.where(and(eq(tables.lock.key, key), lt(tables.lock.updatedAt, lockExpiry)));

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

async function getMonitoredModels(): Promise<MonitoredModel[]> {
	const models = await db.query.model.findMany({
		where: {
			status: { eq: "active" },
		},
		with: {
			modelProviderMappings: {
				where: {
					status: { eq: "active" },
				},
			},
		},
		orderBy: {
			name: "asc",
		},
	});

	return models
		.filter(
			(model) =>
				model.id !== "auto" &&
				model.id !== "custom" &&
				isChatModelOutput(model.output) &&
				model.modelProviderMappings.some((mapping) =>
					mapping.providerId.startsWith("kiwillm-"),
				),
		)
		.map((model) => ({
			id: model.id,
			name: model.name,
			family: model.family,
		}));
}

async function getLatestStatusChecks() {
	try {
		const rows = await db
			.select({
				modelId: modelStatusCheck.modelId,
				checkedAt: modelStatusCheck.checkedAt,
				success: modelStatusCheck.success,
			})
			.from(modelStatusCheck)
			.orderBy(desc(modelStatusCheck.checkedAt));

		const latestByModel = new Map<string, Date>();
		for (const row of rows) {
			if (!latestByModel.has(row.modelId)) {
				latestByModel.set(row.modelId, row.checkedAt);
			}
		}

		return latestByModel;
	} catch (error) {
		logger.warn("Model status monitor could not load latest model checks", {
			error: error instanceof Error ? error.message : String(error),
		});
		return new Map<string, Date>();
	}
}

function extractErrorMessage(payload: unknown): string | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}

	if (
		"message" in payload &&
		typeof payload.message === "string" &&
		payload.message.trim().length > 0
	) {
		return payload.message.slice(0, 500);
	}

	if (
		"error" in payload &&
		payload.error &&
		typeof payload.error === "object" &&
		"message" in payload.error &&
		typeof payload.error.message === "string"
	) {
		return payload.error.message.slice(0, 500);
	}

	return null;
}

async function probeModel(model: MonitoredModel): Promise<StatusCheckResult> {
	const apiKey = getStatusMonitorApiKey();
	const startedAt = Date.now();

	if (!apiKey) {
		return {
			modelId: model.id,
			success: false,
			responseTimeMs: 0,
			statusCode: null,
			errorMessage:
				"STATUS_MONITOR_API_KEY is not configured for production monitoring.",
		};
	}

	try {
		const response = await fetch(
			`${getStatusMonitorGatewayUrl()}/v1/chat/completions`,
			{
				method: "POST",
				headers: {
					authorization: `Bearer ${apiKey}`,
					"content-type": "application/json",
					"x-kiwillm-status-monitor": "true",
				},
				body: JSON.stringify({
					model: model.id,
					messages: [
						{
							role: "user",
							content: "Reply with exactly OK.",
						},
					],
					max_tokens: 8,
					temperature: 0,
					stream: false,
				}),
				signal: AbortSignal.timeout(getStatusMonitorTimeoutMs()),
			},
		);

		const responseTimeMs = Date.now() - startedAt;
		let payload: unknown = null;

		try {
			payload = await response.json();
		} catch {
			payload = null;
		}

		if (!response.ok) {
			return {
				modelId: model.id,
				success: false,
				responseTimeMs,
				statusCode: response.status,
				errorMessage:
					extractErrorMessage(payload) ??
					`Probe failed with HTTP ${response.status}`,
			};
		}

		return {
			modelId: model.id,
			success: true,
			responseTimeMs,
			statusCode: response.status,
			errorMessage: null,
		};
	} catch (error) {
		return {
			modelId: model.id,
			success: false,
			responseTimeMs: Date.now() - startedAt,
			statusCode: null,
			errorMessage:
				error instanceof Error
					? error.message.slice(0, 500)
					: "Unknown monitor probe error",
		};
	}
}

async function persistStatusChecks(results: StatusCheckResult[]): Promise<void> {
	if (results.length === 0) {
		return;
	}

	try {
		await db.insert(modelStatusCheck).values(
			results.map((result) => ({
				modelId: result.modelId,
				checkedAt: new Date(),
				success: result.success,
				responseTimeMs: result.responseTimeMs,
				statusCode: result.statusCode,
				errorMessage: result.errorMessage,
			})),
		);
	} catch (error) {
		logger.warn("Model status monitor could not persist status history", {
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

async function getModelsDueForCheck(limit: number): Promise<MonitoredModel[]> {
	const models = await getMonitoredModels();
	if (models.length === 0) {
		return [];
	}

	const latestChecks = await getLatestStatusChecks();
	const dueBefore = new Date(
		Date.now() - (getStatusMonitorIntervalHours() * 60 * 60 * 1000),
	);

	return models
		.map((model) => ({
			model,
			lastCheckedAt: latestChecks.get(model.id) ?? null,
		}))
		.filter(
			({ lastCheckedAt }) =>
				lastCheckedAt === null || lastCheckedAt.getTime() <= dueBefore.getTime(),
		)
		.sort((a, b) => {
			if (a.lastCheckedAt === null && b.lastCheckedAt === null) {
				return a.model.name.localeCompare(b.model.name);
			}

			if (a.lastCheckedAt === null) {
				return -1;
			}

			if (b.lastCheckedAt === null) {
				return 1;
			}

			return a.lastCheckedAt.getTime() - b.lastCheckedAt.getTime();
		})
		.slice(0, limit)
		.map(({ model }) => model);
}

async function runStatusChecksOnce(): Promise<void> {
	const models = await getModelsDueForCheck(getStatusMonitorBatchSize());
	if (models.length === 0) {
		return;
	}

	logger.info(`Running model status checks for ${models.length} due chat models...`);

	const concurrency = getStatusMonitorConcurrency();
	const results: StatusCheckResult[] = [];

	for (let index = 0; index < models.length; index += concurrency) {
		const batch = models.slice(index, index + concurrency);
		const batchResults = await Promise.all(batch.map((model) => probeModel(model)));
		results.push(...batchResults);
	}

	await persistStatusChecks(results);

	const successCount = results.filter((result) => result.success).length;
	const failureCount = results.length - successCount;

	logger.info("Model status checks completed", {
		totalModels: results.length,
		successCount,
		failureCount,
	});
}

async function triggerStatusChecksNow(reason: string): Promise<boolean> {
	const now = Date.now();

	if (currentTriggerPromise) {
		return false;
	}

	if (now - lastTriggerStartedAt < MIN_TRIGGER_SPACING_MS) {
		return false;
	}

	lastTriggerStartedAt = now;
	currentTriggerPromise = (async () => {
		let lockAcquired = false;

		try {
			lockAcquired = await acquireLock(STATUS_MONITOR_LOCK_KEY);
			if (!lockAcquired) {
				return false;
			}

			logger.info("Triggering model status checks on demand", { reason });
			await runStatusChecksOnce();
			return true;
		} catch (error) {
			logger.error(
				"On-demand model status checks failed",
				error instanceof Error ? error : new Error(String(error)),
			);
			return false;
		} finally {
			if (lockAcquired) {
				try {
					await releaseLock(STATUS_MONITOR_LOCK_KEY);
				} catch (error) {
					logger.warn("Failed to release model status monitor lock", {
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}
		}
	})().finally(() => {
		currentTriggerPromise = null;
	});

	return await currentTriggerPromise;
}

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => {
		currentSleepTimer = setTimeout(() => {
			currentSleepTimer = null;
			resolve();
		}, ms);
	});
}

async function runLoop(): Promise<void> {
	logger.info(
		`Starting API model status monitor (${getStatusMonitorBatchSize()} models per minute, refresh threshold ${getStatusMonitorIntervalHours()} hours)...`,
	);

	while (!shouldStop) {
		let lockAcquired = false;

		try {
			lockAcquired = await acquireLock(STATUS_MONITOR_LOCK_KEY);

			if (lockAcquired) {
				await runStatusChecksOnce();
			}
		} catch (error) {
			logger.error(
				"Error while running API model status checks",
				error instanceof Error ? error : new Error(String(error)),
			);
		} finally {
			if (lockAcquired) {
				try {
					await releaseLock(STATUS_MONITOR_LOCK_KEY);
				} catch (error) {
					logger.warn("Failed to release model status monitor lock", {
						error: error instanceof Error ? error.message : String(error),
					});
				}
			}
		}

		if (shouldStop) {
			break;
		}

		await sleep(DEFAULT_STATUS_MONITOR_LOOP_INTERVAL_MS);
	}

	logger.info("API model status monitor stopped");
}

export function startModelStatusMonitor(): void {
	if (process.env.ENABLE_MODEL_STATUS_MONITOR === "false") {
		logger.info("API model status monitor is disabled by environment");
		return;
	}

	if (isRunning) {
		return;
	}

	shouldStop = false;
	isRunning = true;
	currentLoop = runLoop()
		.catch((error) => {
			logger.error(
				"API model status monitor crashed",
				error instanceof Error ? error : new Error(String(error)),
			);
		})
		.finally(() => {
			isRunning = false;
			currentLoop = null;
			currentSleepTimer = null;
		});
}

export async function stopModelStatusMonitor(): Promise<void> {
	shouldStop = true;

	if (currentSleepTimer) {
		clearTimeout(currentSleepTimer);
		currentSleepTimer = null;
	}

	if (currentLoop) {
		await currentLoop;
	}
}

export function scheduleStatusChecksNow(reason: string): void {
	void triggerStatusChecksNow(reason);
}
