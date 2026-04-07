import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { getUserOrganizationIds } from "@/utils/authorization.js";

import { db, sql, inArray, and, gte, lte, eq, log } from "@llmgateway/db";

import type { ServerTypes } from "@/vars.js";

export const activity = new OpenAPIHono<ServerTypes>();

const FREE_USER_REQUEST_LIMITS = {
	PER_MINUTE: {
		limit: 10,
		windowMs: 60 * 1000,
	},
	PER_DAY: {
		limit: 200,
		windowMs: 86_400 * 1000,
	},
} as const;

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
	requestedModel: string | null;
	requestedProvider: string | null;
	requestCount: number;
	inputTokens: number;
	outputTokens: number;
	totalTokens: number;
	cost: number;
}

const publicRequestedModelSql = sql<string>`
	CASE
		WHEN ${log.requestedModel} IS NOT NULL THEN ${log.requestedModel}
		WHEN ${log.usedProvider} LIKE 'kiwillm-%' THEN NULLIF(SPLIT_PART(${log.usedModel}, '/', 2), '')
		ELSE ${log.usedModel}
	END
`;

const publicRequestedProviderSql = sql<string>`
	CASE
		WHEN ${log.requestedProvider} IS NOT NULL THEN ${log.requestedProvider}
		WHEN ${log.usedProvider} LIKE 'kiwillm-%' THEN NULL
		ELSE ${log.usedProvider}
	END
`;

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
		const modelId = row.requestedModel || "unknown";
		const providerId = row.requestedProvider || "";
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
				requestedModel: publicRequestedModelSql.as("requestedModel"),
				requestedProvider: publicRequestedProviderSql.as("requestedProvider"),
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
			.groupBy(
				sql`DATE(${log.createdAt})`,
				log.requestedModel,
				log.requestedProvider,
				log.usedModel,
				log.usedProvider,
			)
			.orderBy(sql`DATE(${log.createdAt}) ASC`, publicRequestedModelSql),
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

const freeRequestLimitSchema = z.object({
	minute: z.object({
		used: z.number(),
		remaining: z.number(),
		limit: z.number(),
	}),
	day: z.object({
		used: z.number(),
		remaining: z.number(),
		limit: z.number(),
	}),
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

	const liveActivity = await queryLiveActivityRows(
		projectIds,
		startDate,
		endDate,
		apiKeyId,
	);

	return c.json({
		activity: mergeActivityRows(liveActivity.rows, liveActivity.modelRows),
	});
});

const getFreeRequestLimit = createRoute({
	method: "get",
	path: "/free-request-limit",
	request: {
		query: z.object({
			organizationId: z.string(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: freeRequestLimitSchema,
				},
			},
			description: "Current rolling free request usage",
		},
	},
});

activity.openapi(getFreeRequestLimit, async (c) => {
	const user = c.get("user");

	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { organizationId } = c.req.valid("query");
	const organizationIds = await getUserOrganizationIds(user.id);

	if (!organizationIds.includes(organizationId)) {
		throw new HTTPException(403, {
			message: "You don't have access to this organization",
		});
	}

	const now = Date.now();
	const minuteWindowStart = new Date(
		now - FREE_USER_REQUEST_LIMITS.PER_MINUTE.windowMs,
	);
	const dayWindowStart = new Date(now - FREE_USER_REQUEST_LIMITS.PER_DAY.windowMs);

	const [minuteRows, dayRows] = await Promise.all([
		db
			.select({
				count: sql<number>`count(*)::int`.as("count"),
			})
			.from(log)
			.where(
				and(
					eq(log.organizationId, organizationId),
					eq(log.usedMode, "credits"),
					eq(log.requestCost, 0),
					gte(log.createdAt, minuteWindowStart),
				),
			),
		db
			.select({
				count: sql<number>`count(*)::int`.as("count"),
			})
			.from(log)
			.where(
				and(
					eq(log.organizationId, organizationId),
					eq(log.usedMode, "credits"),
					eq(log.requestCost, 0),
					gte(log.createdAt, dayWindowStart),
				),
			),
	]);

	const minuteUsed = minuteRows[0]?.count ?? 0;
	const dayUsed = dayRows[0]?.count ?? 0;

	return c.json({
		minute: {
			used: minuteUsed,
			remaining: Math.max(
				0,
				FREE_USER_REQUEST_LIMITS.PER_MINUTE.limit - minuteUsed,
			),
			limit: FREE_USER_REQUEST_LIMITS.PER_MINUTE.limit,
		},
		day: {
			used: dayUsed,
			remaining: Math.max(0, FREE_USER_REQUEST_LIMITS.PER_DAY.limit - dayUsed),
			limit: FREE_USER_REQUEST_LIMITS.PER_DAY.limit,
		},
	});
});
