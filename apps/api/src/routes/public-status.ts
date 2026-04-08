import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

import { desc, db, modelStatusCheck, sql } from "@llmgateway/db";
import { logger } from "@llmgateway/logger";

import type { ServerTypes } from "@/vars.js";

const STATUS_WINDOW_DAYS = Number(
	process.env.MODEL_STATUS_CHECK_WINDOW_DAYS ?? "30",
);
const STATUS_CHECK_INTERVAL_HOURS = Number(
	process.env.MODEL_STATUS_CHECK_INTERVAL_HOURS ?? "12",
);
const STATUS_RUN_TIMEOUT_MS = Number(
	process.env.STATUS_MONITOR_TIMEOUT_MS ?? "8000",
);
const STATUS_RUN_CONCURRENCY = Math.max(
	1,
	Number(process.env.STATUS_MONITOR_RUN_CONCURRENCY ?? "16"),
);

const statusEntrySchema = z.object({
	modelId: z.string(),
	name: z.string(),
	family: z.string(),
	uptimePercent: z.number().nullable(),
	checkCount: z.number(),
	lastCheckedAt: z.string().nullable(),
	lastSuccessfulAt: z.string().nullable(),
	lastFailureAt: z.string().nullable(),
	lastResponseTimeMs: z.number().nullable(),
	lastStatusCode: z.number().nullable(),
	lastErrorMessage: z.string().nullable(),
	status: z.enum(["operational", "degraded", "down", "unknown"]),
});

const responseSchema = z.object({
	generatedAt: z.string(),
	checkedEveryHours: z.number(),
	windowDays: z.number(),
	summary: z.object({
		totalModels: z.number(),
		operational: z.number(),
		degraded: z.number(),
		down: z.number(),
		unknown: z.number(),
	}),
	models: z.array(statusEntrySchema),
});

const runResponseSchema = responseSchema.extend({
	triggeredAt: z.string(),
});

const publicStatus = new OpenAPIHono<ServerTypes>();

interface StatusCheckRow {
	modelId: string;
	checkedAt: Date;
	success: boolean;
	responseTimeMs: number | null;
	statusCode: number | null;
	errorMessage: string | null;
}

interface MonitoredModel {
	id: string;
	name: string;
	family: string;
}

function isChatModelOutput(output: string[] | null | undefined): boolean {
	return Array.isArray(output) && output.includes("text");
}

function toIsoString(value: Date | null | undefined): string | null {
	return value ? value.toISOString() : null;
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
		return "test-token";
	}

	return null;
}

async function getPublicChatModels(): Promise<MonitoredModel[]> {
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

async function getStatusChecks(windowStart: Date): Promise<StatusCheckRow[]> {
	try {
		return await db
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
			.orderBy(desc(modelStatusCheck.checkedAt));
	} catch (error) {
		logger.warn("Public status route is falling back to unknown checks", {
			error: error instanceof Error ? error.message : String(error),
		});
		return [];
	}
}

function buildStatusResponse(models: MonitoredModel[], checks: StatusCheckRow[]) {
	const checksByModel = new Map<string, StatusCheckRow[]>();

	for (const check of checks) {
		const existing = checksByModel.get(check.modelId) ?? [];
		existing.push(check);
		checksByModel.set(check.modelId, existing);
	}

	const modelStatuses = models.map((model) => {
		const modelChecks = checksByModel.get(model.id) ?? [];
		const latestCheck = modelChecks[0] ?? null;
		const successCount = modelChecks.filter((check) => check.success).length;
		const failureChecks = modelChecks.filter((check) => !check.success);
		const lastSuccessfulAt =
			modelChecks.find((check) => check.success)?.checkedAt ?? null;
		const lastFailureAt = failureChecks[0]?.checkedAt ?? null;
		const uptimePercent =
			modelChecks.length > 0 ? (successCount / modelChecks.length) * 100 : null;

		let status: "operational" | "degraded" | "down" | "unknown" = "unknown";
		if (latestCheck) {
			if (latestCheck.success) {
				status = "operational";
			} else if (successCount > 0) {
				status = "degraded";
			} else {
				status = "down";
			}
		}

		return {
			modelId: model.id,
			name: model.name,
			family: model.family,
			uptimePercent,
			checkCount: modelChecks.length,
			lastCheckedAt: toIsoString(latestCheck?.checkedAt),
			lastSuccessfulAt: toIsoString(lastSuccessfulAt),
			lastFailureAt: toIsoString(lastFailureAt),
			lastResponseTimeMs: latestCheck?.responseTimeMs ?? null,
			lastStatusCode: latestCheck?.statusCode ?? null,
			lastErrorMessage: latestCheck?.errorMessage ?? null,
			status,
		};
	});

	const summary = {
		totalModels: modelStatuses.length,
		operational: modelStatuses.filter((model) => model.status === "operational")
			.length,
		degraded: modelStatuses.filter((model) => model.status === "degraded").length,
		down: modelStatuses.filter((model) => model.status === "down").length,
		unknown: modelStatuses.filter((model) => model.status === "unknown").length,
	};

	return {
		generatedAt: new Date().toISOString(),
		checkedEveryHours: STATUS_CHECK_INTERVAL_HOURS,
		windowDays: STATUS_WINDOW_DAYS,
		summary,
		models: modelStatuses,
	};
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

async function probeModel(model: MonitoredModel): Promise<StatusCheckRow> {
	const apiKey = getStatusMonitorApiKey();
	const startedAt = Date.now();

	if (!apiKey) {
		return {
			modelId: model.id,
			checkedAt: new Date(),
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
				signal: AbortSignal.timeout(STATUS_RUN_TIMEOUT_MS),
			},
		);

		let payload: unknown = null;
		try {
			payload = await response.json();
		} catch {
			payload = null;
		}

		return {
			modelId: model.id,
			checkedAt: new Date(),
			success: response.ok,
			responseTimeMs: Date.now() - startedAt,
			statusCode: response.status,
			errorMessage: response.ok
				? null
				: extractErrorMessage(payload) ??
					`Probe failed with HTTP ${response.status}`,
		};
	} catch (error) {
		return {
			modelId: model.id,
			checkedAt: new Date(),
			success: false,
			responseTimeMs: Date.now() - startedAt,
			statusCode: null,
			errorMessage:
				error instanceof Error
					? error.message.slice(0, 500)
					: "Unknown probe error",
		};
	}
}

async function persistStatusChecks(checks: StatusCheckRow[]): Promise<void> {
	if (checks.length === 0) {
		return;
	}

	try {
		await db.insert(modelStatusCheck).values(
			checks.map((check) => ({
				modelId: check.modelId,
				checkedAt: check.checkedAt,
				success: check.success,
				responseTimeMs: check.responseTimeMs,
				statusCode: check.statusCode,
				errorMessage: check.errorMessage,
			})),
		);
	} catch (error) {
		logger.warn("Public status route could not persist checks", {
			error: error instanceof Error ? error.message : String(error),
		});
	}
}

async function runStatusChecksNow(models: MonitoredModel[]): Promise<StatusCheckRow[]> {
	const results: StatusCheckRow[] = [];

	for (let index = 0; index < models.length; index += STATUS_RUN_CONCURRENCY) {
		const batch = models.slice(index, index + STATUS_RUN_CONCURRENCY);
		const batchResults = await Promise.all(batch.map((model) => probeModel(model)));
		results.push(...batchResults);
	}

	await persistStatusChecks(results);
	return results;
}

const getPublicStatusRoute = createRoute({
	method: "get",
	path: "/",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: responseSchema,
				},
			},
			description: "Public KiwiLLM model status and uptime summary.",
		},
	},
});

const runPublicStatusRoute = createRoute({
	method: "post",
	path: "/run",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: runResponseSchema,
				},
			},
			description: "Run status probes now and return the refreshed status board.",
		},
	},
});

publicStatus.openapi(getPublicStatusRoute, async (c) => {
	const windowStart = new Date(
		Date.now() - STATUS_WINDOW_DAYS * 24 * 60 * 60 * 1000,
	);
	const [models, checks] = await Promise.all([
		getPublicChatModels(),
		getStatusChecks(windowStart),
	]);

	return c.json(buildStatusResponse(models, checks));
});

publicStatus.openapi(runPublicStatusRoute, async (c) => {
	const windowStart = new Date(
		Date.now() - STATUS_WINDOW_DAYS * 24 * 60 * 60 * 1000,
	);
	const models = await getPublicChatModels();
	const checks = await runStatusChecksNow(models);
	const allChecks = [...checks, ...(await getStatusChecks(windowStart))];
	const latestByModel = new Map<string, StatusCheckRow>();

	for (const check of allChecks) {
		const existing = latestByModel.get(check.modelId);
		if (!existing || existing.checkedAt < check.checkedAt) {
			latestByModel.set(check.modelId, check);
		}
	}

	const mergedChecks = Array.from(latestByModel.values());
	return c.json({
		...buildStatusResponse(models, mergedChecks),
		triggeredAt: new Date().toISOString(),
	});
});

export { publicStatus };
