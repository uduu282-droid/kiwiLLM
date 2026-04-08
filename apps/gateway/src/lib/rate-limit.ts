import { randomUUID } from "node:crypto";

import { findOrganizationById } from "@/lib/cached-queries.js";

import { redisClient } from "@llmgateway/cache";
import { logger } from "@llmgateway/logger";

import type { ModelDefinition } from "@llmgateway/models";

/**
 * Rate limiting configuration for free models
 */
const FREE_MODEL_RATE_LIMITS = {
	LOW: {
		// 5 request per 10 minutes for orgs with 0 credits
		BASE_LIMIT: 5,
		BASE_WINDOW: 600, // 10 minutes in seconds

		// 20 requests per minute for orgs with > 0 credits
		ELEVATED_LIMIT: 20,
		ELEVATED_WINDOW: 60, // seconds
	},
	HIGH: {
		// More generous limits for high-tier free models
		// 50 requests per 10 minutes for orgs with 0 credits
		BASE_LIMIT: 50,
		BASE_WINDOW: 600, // 10 minutes in seconds

		// 100 requests per minute for orgs with > 0 credits
		ELEVATED_LIMIT: 100,
		ELEVATED_WINDOW: 60, // seconds
	},
};

const FREE_USER_REQUEST_LIMITS = {
	PER_MINUTE: {
		limit: 10,
		window: 60,
	},
	PER_DAY: {
		limit: 200,
		window: 86_400,
	},
} as const;

interface OrganizationRateLimitInfo {
	plan?: string | null;
	devPlan?: string | null;
}

/**
 * Check if a model is free based on model definition
 */
export function isFreeModel(
	modelDefinition: Partial<ModelDefinition> | null | undefined,
): boolean {
	return modelDefinition?.free === true;
}

/**
 * Generate Redis key for rate limiting
 */
function getRateLimitKey(organizationId: string, model: string): string {
	return `rate_limit:free_model:${organizationId}:${model}`;
}

function getFreeUserRateLimitKey(
	organizationId: string,
	period: "minute" | "day",
): string {
	return `rate_limit:free_user:${organizationId}:${period}`;
}

export function isFreeUserOrganization(
	org: OrganizationRateLimitInfo | null | undefined,
): boolean {
	return org?.plan === "free" && (org.devPlan ?? "none") === "none";
}

/**
 * Check if organization has elevated rate limits (credits > 0)
 */
async function hasElevatedLimits(organizationId: string): Promise<boolean> {
	try {
		const org = await findOrganizationById(organizationId);
		return Boolean(org && parseFloat(org.credits ?? "0") > 0);
	} catch (error) {
		logger.error(
			"Error checking organization credits for rate limiting:",
			error as Error,
		);
		// Default to base limits on error
		return false;
	}
}

/**
 * Check rate limit for free models
 * Returns true if request is allowed, false if rate limited
 */
export async function checkFreeModelRateLimit(
	organizationId: string,
	model: string,
	modelDefinition: Partial<ModelDefinition> | null | undefined,
): Promise<{
	allowed: boolean;
	retryAfter?: number;
	remaining: number;
	limit: number;
}> {
	// Only apply rate limiting to free models
	if (!isFreeModel(modelDefinition)) {
		return { allowed: true, remaining: 0, limit: 0 };
	}

	try {
		const hasElevated = await hasElevatedLimits(organizationId);
		const rateLimitKind = modelDefinition?.rateLimitKind ?? "low";
		const limits =
			FREE_MODEL_RATE_LIMITS[rateLimitKind.toUpperCase() as "LOW" | "HIGH"];

		const limit = hasElevated ? limits.ELEVATED_LIMIT : limits.BASE_LIMIT;
		const window = hasElevated ? limits.ELEVATED_WINDOW : limits.BASE_WINDOW;

		const key = getRateLimitKey(organizationId, model);

		// Use sliding window approach with Redis
		const now = Date.now();
		// eslint-disable-next-line no-mixed-operators
		const windowStart = now - window * 1000;

		// Remove old entries and count current requests in window
		await redisClient.zremrangebyscore(key, "-inf", windowStart);
		const currentCount = await redisClient.zcard(key);

		if (currentCount >= limit) {
			// Rate limited - calculate retry after
			const oldestEntry = await redisClient.zrange(key, 0, 0, "WITHSCORES");
			const retryAfter =
				oldestEntry.length > 1
					? Math.ceil(
							// eslint-disable-next-line no-mixed-operators
							(parseInt(oldestEntry[1], 10) + window * 1000 - now) / 1000,
						)
					: window;

			logger.info(`Rate limit exceeded for free model`, {
				organizationId,
				model,
				currentCount,
				limit,
				hasElevated,
				rateLimitKind: modelDefinition?.rateLimitKind ?? "low",
				retryAfter,
			});

			return { allowed: false, retryAfter, remaining: 0, limit };
		}

		// Add current request to sliding window with a unique member.
		// Using only `now` as member can collide under same-millisecond concurrency.
		const member = `${now}:${randomUUID()}`;
		await redisClient.zadd(key, now, member);
		await redisClient.expire(key, window * 2); // Set expiry to 2x window for cleanup

		logger.debug(`Free model rate limit check passed`, {
			organizationId,
			model,
			currentCount: currentCount + 1,
			limit,
			hasElevated,
			rateLimitKind: modelDefinition?.rateLimitKind ?? "low",
		});

		return {
			allowed: true,
			remaining: Math.max(0, limit - currentCount - 1),
			limit,
		};
	} catch (error) {
		logger.error("Error checking free model rate limit:", error as Error);
		// Allow request on error to avoid blocking users due to Redis issues
		return { allowed: true, remaining: 0, limit: 0 };
	}
}

export async function checkFreeUserRequestRateLimit(
	organizationId: string,
): Promise<{
	allowed: boolean;
	retryAfter?: number;
	minute: { remaining: number; limit: number };
	day: { remaining: number; limit: number };
}> {
	try {
		const now = Date.now();
		const minuteKey = getFreeUserRateLimitKey(organizationId, "minute");
		const dayKey = getFreeUserRateLimitKey(organizationId, "day");
		const minuteWindowStart =
			now - FREE_USER_REQUEST_LIMITS.PER_MINUTE.window * 1000;
		const dayWindowStart = now - FREE_USER_REQUEST_LIMITS.PER_DAY.window * 1000;

		await Promise.all([
			redisClient.zremrangebyscore(minuteKey, "-inf", minuteWindowStart),
			redisClient.zremrangebyscore(dayKey, "-inf", dayWindowStart),
		]);

		const [minuteCount, dayCount] = await Promise.all([
			redisClient.zcard(minuteKey),
			redisClient.zcard(dayKey),
		]);

		const minuteExceeded =
			minuteCount >= FREE_USER_REQUEST_LIMITS.PER_MINUTE.limit;
		const dayExceeded = dayCount >= FREE_USER_REQUEST_LIMITS.PER_DAY.limit;

		if (minuteExceeded || dayExceeded) {
			const blockedPeriod = minuteExceeded ? "minute" : "day";
			const blockedKey = blockedPeriod === "minute" ? minuteKey : dayKey;
			const blockedWindow =
				blockedPeriod === "minute"
					? FREE_USER_REQUEST_LIMITS.PER_MINUTE.window
					: FREE_USER_REQUEST_LIMITS.PER_DAY.window;
			const oldestEntry = await redisClient.zrange(
				blockedKey,
				0,
				0,
				"WITHSCORES",
			);
			const retryAfter =
				oldestEntry.length > 1
					? Math.ceil(
							(parseInt(oldestEntry[1], 10) + blockedWindow * 1000 - now) /
								1000,
						)
					: blockedWindow;

			return {
				allowed: false,
				retryAfter,
				minute: {
					remaining: Math.max(
						0,
						FREE_USER_REQUEST_LIMITS.PER_MINUTE.limit - minuteCount,
					),
					limit: FREE_USER_REQUEST_LIMITS.PER_MINUTE.limit,
				},
				day: {
					remaining: Math.max(
						0,
						FREE_USER_REQUEST_LIMITS.PER_DAY.limit - dayCount,
					),
					limit: FREE_USER_REQUEST_LIMITS.PER_DAY.limit,
				},
			};
		}

		const member = `${now}:${randomUUID()}`;
		await Promise.all([
			redisClient.zadd(minuteKey, now, member),
			redisClient.zadd(dayKey, now, member),
			redisClient.expire(
				minuteKey,
				FREE_USER_REQUEST_LIMITS.PER_MINUTE.window * 2,
			),
			redisClient.expire(dayKey, FREE_USER_REQUEST_LIMITS.PER_DAY.window * 2),
		]);

		return {
			allowed: true,
			minute: {
				remaining: Math.max(
					0,
					FREE_USER_REQUEST_LIMITS.PER_MINUTE.limit - minuteCount - 1,
				),
				limit: FREE_USER_REQUEST_LIMITS.PER_MINUTE.limit,
			},
			day: {
				remaining: Math.max(
					0,
					FREE_USER_REQUEST_LIMITS.PER_DAY.limit - dayCount - 1,
				),
				limit: FREE_USER_REQUEST_LIMITS.PER_DAY.limit,
			},
		};
	} catch (error) {
		logger.error(
			"Error checking free user request rate limit:",
			error as Error,
		);
		return {
			allowed: true,
			minute: {
				remaining: FREE_USER_REQUEST_LIMITS.PER_MINUTE.limit,
				limit: FREE_USER_REQUEST_LIMITS.PER_MINUTE.limit,
			},
			day: {
				remaining: FREE_USER_REQUEST_LIMITS.PER_DAY.limit,
				limit: FREE_USER_REQUEST_LIMITS.PER_DAY.limit,
			},
		};
	}
}
