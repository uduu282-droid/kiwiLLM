import { desc, db, modelStatusCheck, sql } from "@llmgateway/db";
import { logger } from "@llmgateway/logger";

const DEFAULT_STATUS_MONITOR_INTERVAL_HOURS = 12;
const DEFAULT_STATUS_MONITOR_TIMEOUT_MS = 45_000;
const DEFAULT_STATUS_MONITOR_CONCURRENCY = 4;
const DEFAULT_STATUS_MONITOR_WINDOW_DAYS = 30;
const DEV_MONITOR_API_KEY = "test-token";

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

interface MonitorLoopOptions {
	shouldStop: () => boolean;
	acquireLock: (key: string) => Promise<boolean>;
	releaseLock: (key: string) => Promise<void>;
	interruptibleSleep: (ms: number) => Promise<void>;
	registerLoop: () => void;
	unregisterLoop: () => void;
}

const STATUS_MONITOR_LOCK_KEY = "model_status_monitor";

function getStatusMonitorIntervalHours(): number {
	return Number(
		process.env.MODEL_STATUS_CHECK_INTERVAL_HOURS ??
			DEFAULT_STATUS_MONITOR_INTERVAL_HOURS,
	);
}

function getStatusMonitorWindowDays(): number {
	return Number(
		process.env.MODEL_STATUS_CHECK_WINDOW_DAYS ??
			DEFAULT_STATUS_MONITOR_WINDOW_DAYS,
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

async function getLatestStatusCheckTime(): Promise<Date | null> {
	const latestCheck = await db
		.select({
			checkedAt: modelStatusCheck.checkedAt,
		})
		.from(modelStatusCheck)
		.orderBy(desc(modelStatusCheck.checkedAt))
		.limit(1)
		.then((rows) => rows[0] ?? null);

	return latestCheck?.checkedAt ?? null;
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

	const requestBody = {
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
	};

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
				body: JSON.stringify(requestBody),
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
}

async function runStatusChecksOnce(): Promise<void> {
	const models = await getMonitoredModels();
	if (models.length === 0) {
		logger.warn("Model status monitoring found no Kiwi-backed chat models.");
		return;
	}

	logger.info(`Running model status checks for ${models.length} chat models...`);

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

async function runStatusChecksIfDue(): Promise<void> {
	const latestCheckAt = await getLatestStatusCheckTime();
	const intervalMs = getStatusMonitorIntervalHours() * 60 * 60 * 1000;

	if (
		latestCheckAt &&
		Date.now() - latestCheckAt.getTime() < intervalMs
	) {
		return;
	}

	await runStatusChecksOnce();
}

export async function getStatusMonitoringSummary() {
	const now = new Date();
	const windowStart = new Date(
		now.getTime() - getStatusMonitorWindowDays() * 24 * 60 * 60 * 1000,
	);

	const [models, checks] = await Promise.all([
		getMonitoredModels(),
		db
			.select({
				modelId: modelStatusCheck.modelId,
				checkedAt: modelStatusCheck.checkedAt,
				success: modelStatusCheck.success,
				responseTimeMs: modelStatusCheck.responseTimeMs,
				statusCode: modelStatusCheck.statusCode,
				errorMessage: modelStatusCheck.errorMessage,
			})
			.from(modelStatusCheck)
			.where(sql`${modelStatusCheck.checkedAt} >= ${windowStart}`)
			.orderBy(desc(modelStatusCheck.checkedAt)),
	]);

	const checksByModel = new Map<
		string,
		Array<{
			checkedAt: Date;
			success: boolean;
			responseTimeMs: number | null;
			statusCode: number | null;
			errorMessage: string | null;
		}>
	>();

	for (const check of checks) {
		const existing = checksByModel.get(check.modelId) ?? [];
		existing.push(check);
		checksByModel.set(check.modelId, existing);
	}

	return {
		checkedEveryHours: getStatusMonitorIntervalHours(),
		windowDays: getStatusMonitorWindowDays(),
		models,
		checksByModel,
	};
}

export async function runModelStatusMonitorLoop({
	shouldStop,
	acquireLock,
	releaseLock,
	interruptibleSleep,
	registerLoop,
	unregisterLoop,
}: MonitorLoopOptions): Promise<void> {
	registerLoop();
	logger.info(
		`Starting model status monitor loop (interval: ${getStatusMonitorIntervalHours()} hours)...`,
	);

	try {
		while (!shouldStop()) {
			const lockAcquired = await acquireLock(STATUS_MONITOR_LOCK_KEY);

			if (lockAcquired) {
				try {
					await runStatusChecksIfDue();
				} catch (error) {
					logger.error(
						"Error while running model status checks",
						error instanceof Error ? error : new Error(String(error)),
					);
				} finally {
					await releaseLock(STATUS_MONITOR_LOCK_KEY);
				}
			}

			if (shouldStop()) {
				break;
			}

			await interruptibleSleep(15 * 60 * 1000);
		}
	} finally {
		unregisterLoop();
		logger.info("Model status monitor loop stopped");
	}
}
