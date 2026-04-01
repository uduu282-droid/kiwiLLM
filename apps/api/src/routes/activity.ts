import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { getUserOrganizationIds } from "@/utils/authorization.js";

import {
	db,
	sql,
	inArray,
	and,
	gte,
	lt,
	lte,
	eq,
	log,
	projectHourlyStats,
	projectHourlyModelStats,
	apiKeyHourlyStats,
	apiKeyHourlyModelStats,
} from "@llmgateway/db";

import type { ServerTypes } from "@/vars.js";

export const activity = new OpenAPIHono<ServerTypes>();

interface ActivityRow {
	date: string;
	requestCount: number;
	inputTokens: number;
	outputTokens: number;
	cachedTokens: number;
	totalTokens: number;
	cost: number;
	inputCost: number;
	outputCost: number;
	requestCost: number;
	dataStorageCost: number;
	imageInputCost: number;
	imageOutputCost: number;
	cachedInputCost: number;
	errorCount: number;
	cacheCount: number;
	discountSavings: number;
	creditsRequestCount: number;
	apiKeysRequestCount: number;
	creditsCost: number;
	apiKeysCost: number;
	creditsDataStorageCost: number;
	apiKeysDataStorageCost: number;
}

interface ModelBreakdownRow {
	date: string;
	usedModel: string | null;
	usedProvider: string | null;
	requestCount: number;
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	cost: number;
}

function getCurrentHourStart(): Date {
	const now = new Date();
	now.setMinutes(0, 0, 0);
	return now;
}

function createEmptyActivityRow(date: string): ActivityRow {
	return {
		date,
		requestCount: 0,
		inputTokens: 0,
		outputTokens: 0,
		cachedTokens: 0,
		totalTokens: 0,
		cost: 0,
		inputCost: 0,
		outputCost: 0,
		requestCost: 0,
		dataStorageCost: 0,
		imageInputCost: 0,
		imageOutputCost: 0,
		cachedInputCost: 0,
		errorCount: 0,
		cacheCount: 0,
		discountSavings: 0,
		creditsRequestCount: 0,
		apiKeysRequestCount: 0,
		creditsCost: 0,
		apiKeysCost: 0,
		creditsDataStorageCost: 0,
		apiKeysDataStorageCost: 0,
	};
}

function mergeActivityRows(
	rows: ActivityRow[],
	modelRows: ModelBreakdownRow[],
): z.infer<typeof dailyActivitySchema>[] {
	const activityByDate = new Map<string, ActivityRow>();

	for (const row of rows) {
		const existing =
			activityByDate.get(row.date) ?? createEmptyActivityRow(row.date);
		existing.requestCount += Number(row.requestCount);
		existing.inputTokens += Number(row.inputTokens);
		existing.outputTokens += Number(row.outputTokens);
		existing.cachedTokens += Number(row.cachedTokens);
		existing.totalTokens += Number(row.totalTokens);
		existing.cost += Number(row.cost);
		existing.inputCost += Number(row.inputCost);
		existing.outputCost += Number(row.outputCost);
		existing.requestCost += Number(row.requestCost);
		existing.dataStorageCost += Number(row.dataStorageCost);
		existing.imageInputCost += Number(row.imageInputCost);
		existing.imageOutputCost += Number(row.imageOutputCost);
		existing.cachedInputCost += Number(row.cachedInputCost);
		existing.errorCount += Number(row.errorCount);
		existing.cacheCount += Number(row.cacheCount);
		existing.discountSavings += Number(row.discountSavings);
		existing.creditsRequestCount += Number(row.creditsRequestCount);
		existing.apiKeysRequestCount += Number(row.apiKeysRequestCount);
		existing.creditsCost += Number(row.creditsCost);
		existing.apiKeysCost += Number(row.apiKeysCost);
		existing.creditsDataStorageCost += Number(row.creditsDataStorageCost);
		existing.apiKeysDataStorageCost += Number(row.apiKeysDataStorageCost);
		activityByDate.set(row.date, existing);
	}

	const modelBreakdownByDate = new Map<
		string,
		Map<string, z.infer<typeof modelUsageSchema>>
	>();

	for (const row of modelRows) {
		const dateMap =
			modelBreakdownByDate.get(row.date) ??
			new Map<string, z.infer<typeof modelUsageSchema>>();
		const modelId = row.usedModel || "unknown";
		const providerId = row.usedProvider || "unknown";
		const key = `${providerId}:${modelId}`;
		const existing = dateMap.get(key) ?? {
			id: modelId,
			provider: providerId,
			requestCount: 0,
			inputTokens: 0,
			outputTokens: 0,
			totalTokens: 0,
			cost: 0,
		};
		existing.requestCount += Number(row.requestCount);
		existing.inputTokens += Number(row.inputTokens);
		existing.outputTokens += Number(row.outputTokens);
		existing.totalTokens += Number(row.totalTokens);
		existing.cost += Number(row.cost);
		dateMap.set(key, existing);
		modelBreakdownByDate.set(row.date, dateMap);
	}

	return Array.from(activityByDate.values())
		.sort((a, b) => a.date.localeCompare(b.date))
		.map((day) => ({
			...day,
			errorRate:
				day.requestCount > 0 ? (day.errorCount / day.requestCount) * 100 : 0,
			cacheRate:
				day.requestCount > 0 ? (day.cacheCount / day.requestCount) * 100 : 0,
			modelBreakdown: Array.from(
				(modelBreakdownByDate.get(day.date) ?? new Map()).values(),
			).sort((a, b) => a.id.localeCompare(b.id)),
		}));
}

async function queryLiveActivityRows(
	projectIds: string[],
	startDate: Date,
	endDate: Date,
	apiKeyId?: string,
): Promise<{ rows: ActivityRow[]; modelRows: ModelBreakdownRow[] }> {
	const conditions = [
		inArray(log.projectId, projectIds),
		gte(log.createdAt, startDate),
		lte(log.createdAt, endDate),
	];

	if (apiKeyId) {
		conditions.push(eq(log.apiKeyId, apiKeyId));
	}

	const whereClause = and(...conditions);

	const [rows, modelRows] = await Promise.all([
		db
			.select({
				date: sql<string>`DATE(${log.createdAt})`.as("date"),
				requestCount: sql<number>`count(*)::int`.as("requestCount"),
				inputTokens:
					sql<number>`COALESCE(SUM(CAST(${log.promptTokens} AS NUMERIC)), 0)`.as(
						"inputTokens",
					),
				outputTokens:
					sql<number>`COALESCE(SUM(CAST(${log.completionTokens} AS NUMERIC)), 0)`.as(
						"outputTokens",
					),
				cachedTokens:
					sql<number>`COALESCE(SUM(CAST(${log.cachedTokens} AS NUMERIC)), 0)`.as(
						"cachedTokens",
					),
				totalTokens:
					sql<number>`COALESCE(SUM(CAST(${log.totalTokens} AS NUMERIC)), 0)`.as(
						"totalTokens",
					),
				cost: sql<number>`COALESCE(SUM(${log.cost}), 0)`.as("cost"),
				inputCost: sql<number>`COALESCE(SUM(${log.inputCost}), 0)`.as(
					"inputCost",
				),
				outputCost: sql<number>`COALESCE(SUM(${log.outputCost}), 0)`.as(
					"outputCost",
				),
				requestCost: sql<number>`COALESCE(SUM(${log.requestCost}), 0)`.as(
					"requestCost",
				),
				dataStorageCost:
					sql<number>`COALESCE(SUM(CAST(${log.dataStorageCost} AS REAL)), 0)`.as(
						"dataStorageCost",
					),
				imageInputCost: sql<number>`COALESCE(SUM(${log.imageInputCost}), 0)`.as(
					"imageInputCost",
				),
				imageOutputCost:
					sql<number>`COALESCE(SUM(${log.imageOutputCost}), 0)`.as(
						"imageOutputCost",
					),
				cachedInputCost:
					sql<number>`COALESCE(SUM(${log.cachedInputCost}), 0)`.as(
						"cachedInputCost",
					),
				errorCount:
					sql<number>`SUM(CASE WHEN ${log.hasError} = true THEN 1 ELSE 0 END)::int`.as(
						"errorCount",
					),
				cacheCount:
					sql<number>`SUM(CASE WHEN ${log.cached} = true THEN 1 ELSE 0 END)::int`.as(
						"cacheCount",
					),
				discountSavings: sql<number>`COALESCE(
					SUM(
						CASE
							WHEN ${log.discount} > 0 AND ${log.discount} < 1
							THEN ${log.cost} * ${log.discount} / (1 - ${log.discount})
							ELSE 0
						END
					),
					0
				)`.as("discountSavings"),
				creditsRequestCount:
					sql<number>`SUM(CASE WHEN ${log.usedMode} = 'credits' THEN 1 ELSE 0 END)::int`.as(
						"creditsRequestCount",
					),
				apiKeysRequestCount:
					sql<number>`SUM(CASE WHEN ${log.usedMode} = 'api-keys' THEN 1 ELSE 0 END)::int`.as(
						"apiKeysRequestCount",
					),
				creditsCost:
					sql<number>`COALESCE(SUM(CASE WHEN ${log.usedMode} = 'credits' THEN ${log.cost} ELSE 0 END), 0)`.as(
						"creditsCost",
					),
				apiKeysCost:
					sql<number>`COALESCE(SUM(CASE WHEN ${log.usedMode} = 'api-keys' THEN ${log.cost} ELSE 0 END), 0)`.as(
						"apiKeysCost",
					),
				creditsDataStorageCost:
					sql<number>`COALESCE(SUM(CASE WHEN ${log.usedMode} = 'credits' THEN CAST(${log.dataStorageCost} AS REAL) ELSE 0 END), 0)`.as(
						"creditsDataStorageCost",
					),
				apiKeysDataStorageCost:
					sql<number>`COALESCE(SUM(CASE WHEN ${log.usedMode} = 'api-keys' THEN CAST(${log.dataStorageCost} AS REAL) ELSE 0 END), 0)`.as(
						"apiKeysDataStorageCost",
					),
			})
			.from(log)
			.where(whereClause)
			.groupBy(sql`DATE(${log.createdAt})`)
			.orderBy(sql`DATE(${log.createdAt}) ASC`),
		db
			.select({
				date: sql<string>`DATE(${log.createdAt})`.as("date"),
				usedModel: log.usedModel,
				usedProvider: log.usedProvider,
				requestCount: sql<number>`count(*)::int`.as("requestCount"),
				inputTokens:
					sql<number>`COALESCE(SUM(CAST(${log.promptTokens} AS NUMERIC)), 0)`.as(
						"inputTokens",
					),
				outputTokens:
					sql<number>`COALESCE(SUM(CAST(${log.completionTokens} AS NUMERIC)), 0)`.as(
						"outputTokens",
					),
				totalTokens:
					sql<number>`COALESCE(SUM(CAST(${log.totalTokens} AS NUMERIC)), 0)`.as(
						"totalTokens",
					),
				cost: sql<number>`COALESCE(SUM(${log.cost}), 0)`.as("cost"),
			})
			.from(log)
			.where(whereClause)
			.groupBy(sql`DATE(${log.createdAt})`, log.usedModel, log.usedProvider)
			.orderBy(sql`DATE(${log.createdAt}) ASC`, log.usedModel),
	]);

	return { rows, modelRows };
}

// Define the response schema for model-specific usage
const modelUsageSchema = z.object({
	id: z.string(),
	provider: z.string(),
	requestCount: z.number(),
	inputTokens: z.number(),
	outputTokens: z.number(),
	totalTokens: z.number(),
	cost: z.number(),
});

// Define the response schema for daily activity
const dailyActivitySchema = z.object({
	date: z.string(),
	requestCount: z.number(),
	inputTokens: z.number(),
	outputTokens: z.number(),
	cachedTokens: z.number(),
	totalTokens: z.number(),
	cost: z.number(),
	inputCost: z.number(),
	outputCost: z.number(),
	requestCost: z.number(),
	dataStorageCost: z.number(),
	imageInputCost: z.number(),
	imageOutputCost: z.number(),
	cachedInputCost: z.number(),
	errorCount: z.number(),
	errorRate: z.number(),
	cacheCount: z.number(),
	cacheRate: z.number(),
	discountSavings: z.number(),
	creditsRequestCount: z.number(),
	apiKeysRequestCount: z.number(),
	creditsCost: z.number(),
	apiKeysCost: z.number(),
	creditsDataStorageCost: z.number(),
	apiKeysDataStorageCost: z.number(),
	modelBreakdown: z.array(modelUsageSchema),
});

// Define the route for getting activity data
const getActivity = createRoute({
	method: "get",
	path: "/",
	request: {
		query: z.object({
			days: z
				.string()
				.transform((val) => parseInt(val, 10))
				.pipe(z.number().int().positive())
				.optional(),
			from: z.string().optional(),
			to: z.string().optional(),
			projectId: z.string().optional(),
			apiKeyId: z.string().optional(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						activity: z.array(dailyActivitySchema),
					}),
				},
			},
			description: "Activity data grouped by day",
		},
	},
});

activity.openapi(getActivity, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	// Get the query parameters
	const { days, from, to, projectId, apiKeyId } = c.req.valid("query");

	// Calculate the date range
	let startDate: Date;
	let endDate: Date;

	if (from && to) {
		startDate = new Date(from + "T00:00:00");
		endDate = new Date(to + "T23:59:59.999");
	} else {
		const effectiveDays = days ?? 7;
		endDate = new Date();
		startDate = new Date();
		startDate.setDate(startDate.getDate() - effectiveDays);
	}

	// Get all organizations the user is a member of
	const organizationIds = await getUserOrganizationIds(user.id);

	if (!organizationIds.length) {
		return c.json({
			activity: [],
		});
	}

	// Get all projects associated with the user's organizations
	const projects = await db.query.project.findMany({
		where: {
			organizationId: {
				in: organizationIds,
			},
			status: {
				ne: "deleted",
			},
			...(projectId ? { id: projectId } : {}),
		},
	});

	if (!projects.length) {
		return c.json({
			activity: [],
		});
	}

	const projectIds = projects.map((project) => project.id);

	if (projectId && !projectIds.includes(projectId)) {
		throw new HTTPException(403, {
			message: "You don't have access to this project",
		});
	}

	const currentHourStart = getCurrentHourStart();
	const liveStartDate =
		endDate >= currentHourStart
			? new Date(Math.max(startDate.getTime(), currentHourStart.getTime()))
			: null;

	// If filtering by apiKeyId, use the apiKeyHourlyStats aggregation table
	if (apiKeyId) {
		// Query daily aggregated data from apiKeyHourlyStats table
		const hourlyAggregates = await db
			.select({
				date: sql<string>`DATE(${apiKeyHourlyStats.hourTimestamp})`.as("date"),
				requestCount:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.requestCount}), 0)`.as(
						"requestCount",
					),
				inputTokens:
					sql<number>`COALESCE(SUM(CAST(${apiKeyHourlyStats.inputTokens} AS NUMERIC)), 0)`.as(
						"inputTokens",
					),
				outputTokens:
					sql<number>`COALESCE(SUM(CAST(${apiKeyHourlyStats.outputTokens} AS NUMERIC)), 0)`.as(
						"outputTokens",
					),
				totalTokens:
					sql<number>`COALESCE(SUM(CAST(${apiKeyHourlyStats.totalTokens} AS NUMERIC)), 0)`.as(
						"totalTokens",
					),
				cost: sql<number>`COALESCE(SUM(${apiKeyHourlyStats.cost}), 0)`.as(
					"cost",
				),
				inputCost:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.inputCost}), 0)`.as(
						"inputCost",
					),
				outputCost:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.outputCost}), 0)`.as(
						"outputCost",
					),
				requestCost:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.requestCost}), 0)`.as(
						"requestCost",
					),
				dataStorageCost:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.dataStorageCost}), 0)`.as(
						"dataStorageCost",
					),
				errorCount:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.errorCount}), 0)`.as(
						"errorCount",
					),
				cacheCount:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.cacheCount}), 0)`.as(
						"cacheCount",
					),
				discountSavings:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.discountSavings}), 0)`.as(
						"discountSavings",
					),
				imageInputCost:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.imageInputCost}), 0)`.as(
						"imageInputCost",
					),
				imageOutputCost:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.imageOutputCost}), 0)`.as(
						"imageOutputCost",
					),
				cachedTokens:
					sql<number>`COALESCE(SUM(CAST(${apiKeyHourlyStats.cachedTokens} AS NUMERIC)), 0)`.as(
						"cachedTokens",
					),
				cachedInputCost:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.cachedInputCost}), 0)`.as(
						"cachedInputCost",
					),
				creditsRequestCount:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.creditsRequestCount}), 0)`.as(
						"creditsRequestCount",
					),
				apiKeysRequestCount:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.apiKeysRequestCount}), 0)`.as(
						"apiKeysRequestCount",
					),
				creditsCost:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.creditsCost}), 0)`.as(
						"creditsCost",
					),
				apiKeysCost:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.apiKeysCost}), 0)`.as(
						"apiKeysCost",
					),
				creditsDataStorageCost:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.creditsDataStorageCost}), 0)`.as(
						"creditsDataStorageCost",
					),
				apiKeysDataStorageCost:
					sql<number>`COALESCE(SUM(${apiKeyHourlyStats.apiKeysDataStorageCost}), 0)`.as(
						"apiKeysDataStorageCost",
					),
			})
			.from(apiKeyHourlyStats)
			.where(
				and(
					eq(apiKeyHourlyStats.apiKeyId, apiKeyId),
					inArray(apiKeyHourlyStats.projectId, projectIds),
					gte(apiKeyHourlyStats.hourTimestamp, startDate),
					lte(apiKeyHourlyStats.hourTimestamp, endDate),
					lt(apiKeyHourlyStats.hourTimestamp, currentHourStart),
				),
			)
			.groupBy(sql`DATE(${apiKeyHourlyStats.hourTimestamp})`)
			.orderBy(sql`DATE(${apiKeyHourlyStats.hourTimestamp}) ASC`);

		// Query model breakdown from apiKeyHourlyModelStats table
		const modelBreakdowns = await db
			.select({
				date: sql<string>`DATE(${apiKeyHourlyModelStats.hourTimestamp})`.as(
					"date",
				),
				usedModel: apiKeyHourlyModelStats.usedModel,
				usedProvider: apiKeyHourlyModelStats.usedProvider,
				requestCount:
					sql<number>`COALESCE(SUM(${apiKeyHourlyModelStats.requestCount}), 0)`.as(
						"requestCount",
					),
				inputTokens:
					sql<number>`COALESCE(SUM(CAST(${apiKeyHourlyModelStats.inputTokens} AS NUMERIC)), 0)`.as(
						"inputTokens",
					),
				outputTokens:
					sql<number>`COALESCE(SUM(CAST(${apiKeyHourlyModelStats.outputTokens} AS NUMERIC)), 0)`.as(
						"outputTokens",
					),
				totalTokens:
					sql<number>`COALESCE(SUM(CAST(${apiKeyHourlyModelStats.totalTokens} AS NUMERIC)), 0)`.as(
						"totalTokens",
					),
				cost: sql<number>`COALESCE(SUM(${apiKeyHourlyModelStats.cost}), 0)`.as(
					"cost",
				),
			})
			.from(apiKeyHourlyModelStats)
			.where(
				and(
					eq(apiKeyHourlyModelStats.apiKeyId, apiKeyId),
					inArray(apiKeyHourlyModelStats.projectId, projectIds),
					gte(apiKeyHourlyModelStats.hourTimestamp, startDate),
					lte(apiKeyHourlyModelStats.hourTimestamp, endDate),
					lt(apiKeyHourlyModelStats.hourTimestamp, currentHourStart),
				),
			)
			.groupBy(
				sql`DATE(${apiKeyHourlyModelStats.hourTimestamp}), ${apiKeyHourlyModelStats.usedModel}, ${apiKeyHourlyModelStats.usedProvider}`,
			)
			.orderBy(
				sql`DATE(${apiKeyHourlyModelStats.hourTimestamp}) ASC, ${apiKeyHourlyModelStats.usedModel} ASC`,
			);

		const liveActivity = liveStartDate
			? await queryLiveActivityRows(
					projectIds,
					liveStartDate,
					endDate,
					apiKeyId,
				)
			: { rows: [], modelRows: [] };

		const activityData = mergeActivityRows(
			[
				...hourlyAggregates.map((day) => ({
					date: day.date,
					requestCount: Number(day.requestCount),
					inputTokens: Number(day.inputTokens),
					outputTokens: Number(day.outputTokens),
					cachedTokens: Number(day.cachedTokens),
					totalTokens: Number(day.totalTokens),
					cost: Number(day.cost),
					inputCost: Number(day.inputCost),
					outputCost: Number(day.outputCost),
					requestCost: Number(day.requestCost),
					dataStorageCost: Number(day.dataStorageCost),
					imageInputCost: Number(day.imageInputCost),
					imageOutputCost: Number(day.imageOutputCost),
					cachedInputCost: Number(day.cachedInputCost),
					errorCount: Number(day.errorCount),
					cacheCount: Number(day.cacheCount),
					discountSavings: Number(day.discountSavings),
					creditsRequestCount: Number(day.creditsRequestCount),
					apiKeysRequestCount: Number(day.apiKeysRequestCount),
					creditsCost: Number(day.creditsCost),
					apiKeysCost: Number(day.apiKeysCost),
					creditsDataStorageCost: Number(day.creditsDataStorageCost),
					apiKeysDataStorageCost: Number(day.apiKeysDataStorageCost),
				})),
				...liveActivity.rows,
			],
			[
				...modelBreakdowns.map((breakdown) => ({
					date: breakdown.date,
					usedModel: breakdown.usedModel,
					usedProvider: breakdown.usedProvider,
					requestCount: Number(breakdown.requestCount),
					inputTokens: Number(breakdown.inputTokens),
					outputTokens: Number(breakdown.outputTokens),
					totalTokens: Number(breakdown.totalTokens),
					cost: Number(breakdown.cost),
				})),
				...liveActivity.modelRows,
			],
		);

		return c.json({
			activity: activityData,
		});
	}

	// Use aggregation tables for fast queries (when not filtering by apiKeyId)
	// Query hourly aggregated data from projectHourlyStats table
	const hourlyAggregates = await db
		.select({
			date: sql<string>`DATE(${projectHourlyStats.hourTimestamp})`.as("date"),
			requestCount:
				sql<number>`COALESCE(SUM(${projectHourlyStats.requestCount}), 0)`.as(
					"requestCount",
				),
			inputTokens:
				sql<number>`COALESCE(SUM(CAST(${projectHourlyStats.inputTokens} AS NUMERIC)), 0)`.as(
					"inputTokens",
				),
			outputTokens:
				sql<number>`COALESCE(SUM(CAST(${projectHourlyStats.outputTokens} AS NUMERIC)), 0)`.as(
					"outputTokens",
				),
			cachedTokens:
				sql<number>`COALESCE(SUM(CAST(${projectHourlyStats.cachedTokens} AS NUMERIC)), 0)`.as(
					"cachedTokens",
				),
			totalTokens:
				sql<number>`COALESCE(SUM(CAST(${projectHourlyStats.totalTokens} AS NUMERIC)), 0)`.as(
					"totalTokens",
				),
			cost: sql<number>`COALESCE(SUM(${projectHourlyStats.cost}), 0)`.as(
				"cost",
			),
			inputCost:
				sql<number>`COALESCE(SUM(${projectHourlyStats.inputCost}), 0)`.as(
					"inputCost",
				),
			outputCost:
				sql<number>`COALESCE(SUM(${projectHourlyStats.outputCost}), 0)`.as(
					"outputCost",
				),
			requestCost:
				sql<number>`COALESCE(SUM(${projectHourlyStats.requestCost}), 0)`.as(
					"requestCost",
				),
			dataStorageCost:
				sql<number>`COALESCE(SUM(${projectHourlyStats.dataStorageCost}), 0)`.as(
					"dataStorageCost",
				),
			imageInputCost:
				sql<number>`COALESCE(SUM(${projectHourlyStats.imageInputCost}), 0)`.as(
					"imageInputCost",
				),
			imageOutputCost:
				sql<number>`COALESCE(SUM(${projectHourlyStats.imageOutputCost}), 0)`.as(
					"imageOutputCost",
				),
			cachedInputCost:
				sql<number>`COALESCE(SUM(${projectHourlyStats.cachedInputCost}), 0)`.as(
					"cachedInputCost",
				),
			errorCount:
				sql<number>`COALESCE(SUM(${projectHourlyStats.errorCount}), 0)`.as(
					"errorCount",
				),
			cacheCount:
				sql<number>`COALESCE(SUM(${projectHourlyStats.cacheCount}), 0)`.as(
					"cacheCount",
				),
			discountSavings:
				sql<number>`COALESCE(SUM(${projectHourlyStats.discountSavings}), 0)`.as(
					"discountSavings",
				),
			creditsRequestCount:
				sql<number>`COALESCE(SUM(${projectHourlyStats.creditsRequestCount}), 0)`.as(
					"creditsRequestCount",
				),
			apiKeysRequestCount:
				sql<number>`COALESCE(SUM(${projectHourlyStats.apiKeysRequestCount}), 0)`.as(
					"apiKeysRequestCount",
				),
			creditsCost:
				sql<number>`COALESCE(SUM(${projectHourlyStats.creditsCost}), 0)`.as(
					"creditsCost",
				),
			apiKeysCost:
				sql<number>`COALESCE(SUM(${projectHourlyStats.apiKeysCost}), 0)`.as(
					"apiKeysCost",
				),
			creditsDataStorageCost:
				sql<number>`COALESCE(SUM(${projectHourlyStats.creditsDataStorageCost}), 0)`.as(
					"creditsDataStorageCost",
				),
			apiKeysDataStorageCost:
				sql<number>`COALESCE(SUM(${projectHourlyStats.apiKeysDataStorageCost}), 0)`.as(
					"apiKeysDataStorageCost",
				),
		})
		.from(projectHourlyStats)
		.where(
			and(
				inArray(projectHourlyStats.projectId, projectIds),
				gte(projectHourlyStats.hourTimestamp, startDate),
				lte(projectHourlyStats.hourTimestamp, endDate),
				lt(projectHourlyStats.hourTimestamp, currentHourStart),
			),
		)
		.groupBy(sql`DATE(${projectHourlyStats.hourTimestamp})`)
		.orderBy(sql`DATE(${projectHourlyStats.hourTimestamp}) ASC`);

	// Query model breakdown from projectHourlyModelStats table
	const modelBreakdowns = await db
		.select({
			date: sql<string>`DATE(${projectHourlyModelStats.hourTimestamp})`.as(
				"date",
			),
			usedModel: projectHourlyModelStats.usedModel,
			usedProvider: projectHourlyModelStats.usedProvider,
			requestCount:
				sql<number>`COALESCE(SUM(${projectHourlyModelStats.requestCount}), 0)`.as(
					"requestCount",
				),
			inputTokens:
				sql<number>`COALESCE(SUM(CAST(${projectHourlyModelStats.inputTokens} AS NUMERIC)), 0)`.as(
					"inputTokens",
				),
			outputTokens:
				sql<number>`COALESCE(SUM(CAST(${projectHourlyModelStats.outputTokens} AS NUMERIC)), 0)`.as(
					"outputTokens",
				),
			totalTokens:
				sql<number>`COALESCE(SUM(CAST(${projectHourlyModelStats.totalTokens} AS NUMERIC)), 0)`.as(
					"totalTokens",
				),
			cost: sql<number>`COALESCE(SUM(${projectHourlyModelStats.cost}), 0)`.as(
				"cost",
			),
		})
		.from(projectHourlyModelStats)
		.where(
			and(
				inArray(projectHourlyModelStats.projectId, projectIds),
				gte(projectHourlyModelStats.hourTimestamp, startDate),
				lte(projectHourlyModelStats.hourTimestamp, endDate),
				lt(projectHourlyModelStats.hourTimestamp, currentHourStart),
			),
		)
		.groupBy(
			sql`DATE(${projectHourlyModelStats.hourTimestamp}), ${projectHourlyModelStats.usedModel}, ${projectHourlyModelStats.usedProvider}`,
		)
		.orderBy(
			sql`DATE(${projectHourlyModelStats.hourTimestamp}) ASC, ${projectHourlyModelStats.usedModel} ASC`,
		);

	const liveActivity = liveStartDate
		? await queryLiveActivityRows(projectIds, liveStartDate, endDate)
		: { rows: [], modelRows: [] };

	const activityData = mergeActivityRows(
		[
			...hourlyAggregates.map((day) => ({
				date: day.date,
				requestCount: Number(day.requestCount),
				inputTokens: Number(day.inputTokens),
				outputTokens: Number(day.outputTokens),
				cachedTokens: Number(day.cachedTokens),
				totalTokens: Number(day.totalTokens),
				cost: Number(day.cost),
				inputCost: Number(day.inputCost),
				outputCost: Number(day.outputCost),
				requestCost: Number(day.requestCost),
				dataStorageCost: Number(day.dataStorageCost),
				imageInputCost: Number(day.imageInputCost),
				imageOutputCost: Number(day.imageOutputCost),
				cachedInputCost: Number(day.cachedInputCost),
				errorCount: Number(day.errorCount),
				cacheCount: Number(day.cacheCount),
				discountSavings: Number(day.discountSavings),
				creditsRequestCount: Number(day.creditsRequestCount),
				apiKeysRequestCount: Number(day.apiKeysRequestCount),
				creditsCost: Number(day.creditsCost),
				apiKeysCost: Number(day.apiKeysCost),
				creditsDataStorageCost: Number(day.creditsDataStorageCost),
				apiKeysDataStorageCost: Number(day.apiKeysDataStorageCost),
			})),
			...liveActivity.rows,
		],
		[
			...modelBreakdowns.map((breakdown) => ({
				date: breakdown.date,
				usedModel: breakdown.usedModel,
				usedProvider: breakdown.usedProvider,
				requestCount: Number(breakdown.requestCount),
				inputTokens: Number(breakdown.inputTokens),
				outputTokens: Number(breakdown.outputTokens),
				totalTokens: Number(breakdown.totalTokens),
				cost: Number(breakdown.cost),
			})),
			...liveActivity.modelRows,
		],
	);

	return c.json({
		activity: activityData,
	});
});
