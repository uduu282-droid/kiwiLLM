import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "zod";

import { db, sql } from "@llmgateway/db";

import type { ServerTypes } from "@/vars.js";

const rankingWindowSchema = z.enum(["7d", "30d", "90d"]).default("7d");

const rankingEntrySchema = z.object({
	modelId: z.string(),
	providerId: z.string(),
	requestCount: z.number(),
	totalTokens: z.number(),
	totalCost: z.number(),
	changePercent: z.number().nullable(),
	isNew: z.boolean(),
});

const chartPointSchema = z.object({
	weekStart: z.string(),
	totalTokens: z.number(),
	segments: z.array(
		z.object({
			modelId: z.string(),
			tokens: z.number(),
		}),
	),
});

const fastestEntrySchema = z.object({
	modelId: z.string(),
	providerId: z.string(),
	requestCount: z.number(),
	totalTokens: z.number(),
	avgLatencyMs: z.number(),
	throughputTokensPerSecond: z.number(),
	pricePerMillion: z.number().nullable(),
});

const appEntrySchema = z.object({
	appName: z.string(),
	subtitle: z.string().nullable(),
	requestCount: z.number(),
	totalTokens: z.number(),
});

const responseSchema = z.object({
	window: rankingWindowSchema,
	generatedAt: z.string(),
	totalRequests: z.number(),
	totalTokens: z.number(),
	totalModels: z.number(),
	leaderboard: z.array(rankingEntrySchema),
	chart: z.array(chartPointSchema),
	fastest: z.array(fastestEntrySchema),
	apps: z.array(appEntrySchema),
});

interface AggregateRow {
	modelId: string | null;
	providerId: string | null;
	requestCount: number | string;
	totalTokens: number | string;
	totalCost: number | string;
}

interface WeeklyAggregateRow {
	weekStart: string | Date;
	modelId: string | null;
	totalTokens: number | string;
}

interface FastestAggregateRow {
	modelId: string | null;
	providerId: string | null;
	requestCount: number | string;
	totalTokens: number | string;
	totalCost: number | string;
	avgLatencyMs: number | string;
	durationSeconds: number | string;
}

interface AppAggregateRow {
	appName: string | null;
	subtitle: string | null;
	requestCount: number | string;
	totalTokens: number | string;
}

const publicRankings = new OpenAPIHono<ServerTypes>();

function getWindowDays(window: z.infer<typeof rankingWindowSchema>): number {
	switch (window) {
		case "30d":
			return 30;
		case "90d":
			return 90;
		case "7d":
		default:
			return 7;
	}
}

function startOfUtcDay(date: Date): Date {
	return new Date(
		Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
	);
}

function addUtcDays(date: Date, days: number): Date {
	const next = new Date(date);
	next.setUTCDate(next.getUTCDate() + days);
	return next;
}

function startOfUtcWeek(date: Date): Date {
	const day = date.getUTCDay();
	const diff = (day + 6) % 7;
	return startOfUtcDay(addUtcDays(date, -diff));
}

function toNumber(value: number | string | null | undefined): number {
	if (typeof value === "number") {
		return value;
	}
	if (typeof value === "string") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}

const getPublicRankings = createRoute({
	method: "get",
	path: "/",
	request: {
		query: z.object({
			window: rankingWindowSchema.optional(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: responseSchema,
				},
			},
			description: "Public KiwiLLM model rankings.",
		},
	},
});

publicRankings.openapi(getPublicRankings, async (c) => {
	const window = c.req.valid("query").window ?? "7d";
	const now = new Date();
	const periodDays = getWindowDays(window);
	const currentStart = addUtcDays(startOfUtcDay(now), -(periodDays - 1));
	const previousStart = addUtcDays(currentStart, -periodDays);
	const previousEnd = addUtcDays(currentStart, -1);
	const chartStart = addUtcDays(startOfUtcWeek(now), -7 * 11);

	const [
		currentRowsResult,
		previousRowsResult,
		chartRowsResult,
		fastestRowsResult,
		appRowsResult,
	] =
		await Promise.all([
			db.execute(sql`
				SELECT
					used_model AS "modelId",
					used_provider AS "providerId",
					COUNT(*)::int AS "requestCount",
					COALESCE(SUM(CAST(total_tokens AS NUMERIC)), 0)::float AS "totalTokens",
					COALESCE(SUM(cost), 0)::float AS "totalCost"
				FROM log
				WHERE created_at >= ${currentStart}
					AND created_at <= ${now}
					AND used_model IS NOT NULL
					AND used_provider IS NOT NULL
					AND has_error IS NOT TRUE
				GROUP BY used_model, used_provider
				ORDER BY COALESCE(SUM(CAST(total_tokens AS NUMERIC)), 0) DESC
			`),
			db.execute(sql`
				SELECT
					used_model AS "modelId",
					used_provider AS "providerId",
					COUNT(*)::int AS "requestCount",
					COALESCE(SUM(CAST(total_tokens AS NUMERIC)), 0)::float AS "totalTokens",
					COALESCE(SUM(cost), 0)::float AS "totalCost"
				FROM log
				WHERE created_at >= ${previousStart}
					AND created_at <= ${previousEnd}
					AND used_model IS NOT NULL
					AND used_provider IS NOT NULL
					AND has_error IS NOT TRUE
				GROUP BY used_model, used_provider
			`),
			db.execute(sql`
				SELECT
					DATE_TRUNC('week', created_at AT TIME ZONE 'UTC')::date AS "weekStart",
					used_model AS "modelId",
					COALESCE(SUM(CAST(total_tokens AS NUMERIC)), 0)::float AS "totalTokens"
				FROM log
				WHERE created_at >= ${chartStart}
					AND created_at <= ${now}
					AND used_model IS NOT NULL
					AND used_provider IS NOT NULL
					AND has_error IS NOT TRUE
				GROUP BY DATE_TRUNC('week', created_at AT TIME ZONE 'UTC')::date, used_model
				ORDER BY "weekStart" ASC
			`),
			db.execute(sql`
				SELECT
					used_model AS "modelId",
					used_provider AS "providerId",
					COUNT(*)::int AS "requestCount",
					COALESCE(SUM(CAST(total_tokens AS NUMERIC)), 0)::float AS "totalTokens",
					COALESCE(SUM(cost), 0)::float AS "totalCost",
					COALESCE(AVG(duration), 0)::float AS "avgLatencyMs",
					COALESCE(SUM(duration), 0)::float / 1000.0 AS "durationSeconds"
				FROM log
				WHERE created_at >= ${currentStart}
					AND created_at <= ${now}
					AND used_model IS NOT NULL
					AND used_provider IS NOT NULL
					AND has_error IS NOT TRUE
					AND duration > 0
					AND COALESCE(CAST(completion_tokens AS NUMERIC), CAST(total_tokens AS NUMERIC), 0) > 0
				GROUP BY used_model, used_provider
				HAVING COUNT(*) >= 3
				ORDER BY COALESCE(SUM(CAST(total_tokens AS NUMERIC)), 0) DESC
			`),
			db.execute(sql`
				SELECT
					COALESCE(
						NULLIF(custom_headers->>'title', ''),
						NULLIF(custom_headers->>'app', ''),
						NULLIF(custom_headers->>'app-name', ''),
						NULLIF(custom_headers->>'client', ''),
						NULLIF(custom_headers->>'client-name', ''),
						NULLIF(source, ''),
						NULLIF(user_agent, ''),
						'Unknown'
					) AS "appName",
					COALESCE(
						NULLIF(source, ''),
						NULLIF(user_agent, '')
					) AS "subtitle",
					COUNT(*)::int AS "requestCount",
					COALESCE(SUM(CAST(total_tokens AS NUMERIC)), 0)::float AS "totalTokens"
				FROM log
				WHERE created_at >= ${currentStart}
					AND created_at <= ${now}
					AND has_error IS NOT TRUE
				GROUP BY 1, 2
				HAVING COUNT(*) >= 2
				ORDER BY COALESCE(SUM(CAST(total_tokens AS NUMERIC)), 0) DESC
			`),
		]);

	const currentRows = currentRowsResult.rows as unknown as AggregateRow[];
	const previousRows = previousRowsResult.rows as unknown as AggregateRow[];
	const chartRows = chartRowsResult.rows as unknown as WeeklyAggregateRow[];
	const fastestRows =
		fastestRowsResult.rows as unknown as FastestAggregateRow[];
	const appRows = appRowsResult.rows as unknown as AppAggregateRow[];

	const previousMap = new Map(
		previousRows.map((row) => [
			`${row.providerId ?? "unknown"}:${row.modelId ?? "unknown"}`,
			toNumber(row.totalTokens),
		]),
	);

	const leaderboard = currentRows.slice(0, 10).map((row) => {
		const key = `${row.providerId ?? "unknown"}:${row.modelId ?? "unknown"}`;
		const previousTokens = previousMap.get(key) ?? 0;
		const currentTokens = toNumber(row.totalTokens);

		return {
			modelId: row.modelId ?? "unknown",
			providerId: row.providerId ?? "unknown",
			requestCount: toNumber(row.requestCount),
			totalTokens: currentTokens,
			totalCost: toNumber(row.totalCost),
			changePercent:
				previousTokens > 0
					? Number(
							(
								((currentTokens - previousTokens) / previousTokens) *
								100
							).toFixed(1),
						)
					: null,
			isNew: previousTokens <= 0,
		};
	});

	const topChartModels = new Set(
		leaderboard.slice(0, 8).map((entry) => entry.modelId),
	);
	const chartMap = new Map<
		string,
		{
			weekStart: string;
			totalTokens: number;
			segments: Map<string, number>;
		}
	>();

	for (let i = 0; i < 12; i++) {
		const weekStart = addUtcDays(chartStart, i * 7)
			.toISOString()
			.slice(0, 10);
		chartMap.set(weekStart, {
			weekStart,
			totalTokens: 0,
			segments: new Map(),
		});
	}

	for (const row of chartRows) {
		const weekStart =
			row.weekStart instanceof Date
				? row.weekStart.toISOString().slice(0, 10)
				: String(row.weekStart).slice(0, 10);
		const point = chartMap.get(weekStart);
		if (!point) {
			continue;
		}
		const tokenCount = toNumber(row.totalTokens);
		const modelId = row.modelId ?? "unknown";
		const segmentKey = topChartModels.has(modelId) ? modelId : "Other";
		point.totalTokens += tokenCount;
		point.segments.set(
			segmentKey,
			(point.segments.get(segmentKey) ?? 0) + tokenCount,
		);
	}

	const fastest = fastestRows
		.map((row) => {
			const totalTokens = toNumber(row.totalTokens);
			const durationSeconds = toNumber(row.durationSeconds);
			const totalCost = toNumber(row.totalCost);

			return {
				modelId: row.modelId ?? "unknown",
				providerId: row.providerId ?? "unknown",
				requestCount: toNumber(row.requestCount),
				totalTokens,
				avgLatencyMs: Number(toNumber(row.avgLatencyMs).toFixed(0)),
				throughputTokensPerSecond:
					durationSeconds > 0
						? Number((totalTokens / durationSeconds).toFixed(1))
						: 0,
				pricePerMillion:
					totalTokens > 0
						? Number(((totalCost / totalTokens) * 1_000_000).toFixed(2))
						: null,
			};
		})
		.filter((row) => row.throughputTokensPerSecond > 0)
		.sort((a, b) => b.throughputTokensPerSecond - a.throughputTokensPerSecond)
		.slice(0, 10);

	const apps = appRows
		.filter((row) => (row.appName ?? "").trim().length > 0)
		.slice(0, 10)
		.map((row) => ({
			appName: row.appName ?? "Unknown",
			subtitle: row.subtitle,
			requestCount: toNumber(row.requestCount),
			totalTokens: toNumber(row.totalTokens),
		}));

	return c.json({
		window,
		generatedAt: now.toISOString(),
		totalRequests: currentRows.reduce(
			(sum, row) => sum + toNumber(row.requestCount),
			0,
		),
		totalTokens: currentRows.reduce(
			(sum, row) => sum + toNumber(row.totalTokens),
			0,
		),
		totalModels: currentRows.length,
		leaderboard,
		chart: Array.from(chartMap.values()).map((point) => ({
			weekStart: point.weekStart,
			totalTokens: point.totalTokens,
			segments: Array.from(point.segments.entries()).map(
				([modelId, tokens]) => ({
					modelId,
					tokens,
				}),
			),
		})),
		fastest,
		apps,
	});
});

export { publicRankings };
