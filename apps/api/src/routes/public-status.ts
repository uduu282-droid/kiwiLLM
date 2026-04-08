import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

import { scheduleStatusChecksNow } from "@/lib/model-status-monitor.js";

import { desc, db, modelStatusCheck, sql } from "@llmgateway/db";
import { logger } from "@llmgateway/logger";

import type { ServerTypes } from "@/vars.js";

const STATUS_WINDOW_DAYS = Number(
	process.env.MODEL_STATUS_CHECK_WINDOW_DAYS ?? "30",
);
const STATUS_CHECK_INTERVAL_HOURS = Number(
	process.env.MODEL_STATUS_CHECK_INTERVAL_HOURS ?? "12",
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

publicStatus.openapi(getPublicStatusRoute, async (c) => {
	const windowStart = new Date(
		Date.now() - (STATUS_WINDOW_DAYS * 24 * 60 * 60 * 1000),
	);
	const [models, checks] = await Promise.all([
		getPublicChatModels(),
		getStatusChecks(windowStart),
	]);

	const response = buildStatusResponse(models, checks);
	const allUnknown =
		response.summary.totalModels > 0 &&
		response.summary.unknown === response.summary.totalModels;

	if (allUnknown) {
		scheduleStatusChecksNow("public-status-bootstrap");
	}

	return c.json(response);
});

export { publicStatus };
