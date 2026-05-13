// eslint-disable-next-line import/order
import "dotenv/config";

import { swaggerUI } from "@hono/swagger-ui";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { redisClient } from "@llmgateway/cache";
import { db } from "@llmgateway/db";
import {
	createHonoRequestLogger,
	createRequestLifecycleMiddleware,
	getMetrics,
	getMetricsContentType,
} from "@llmgateway/instrumentation";
import { logger } from "@llmgateway/logger";
import { HealthChecker } from "@llmgateway/shared";

import { anthropic } from "./anthropic/anthropic.js";
import { audioRoute } from "./audio/route.js";
import { chat } from "./chat/chat.js";
import { imagesRoute } from "./images/route.js";
import { mcpHandler, registerMcpOAuthRoutes } from "./mcp/mcp.js";
import { tracingMiddleware } from "./middleware/tracing.js";
import { models } from "./models/route.js";
import { responses } from "./responses/responses.js";
import { videosRoute } from "./videos/route.js";

import type { Context } from "hono";
import type { ServerTypes } from "./vars.js";

const isHosted = process.env.HOSTED === "true";
const brandName = process.env.BRAND_NAME ?? "KiwiLLM";
const gatewayServiceName =
	process.env.GATEWAY_SERVICE_NAME ??
	process.env.OTEL_SERVICE_NAME ??
	"kiwillm-gateway";
const docsUrl =
	process.env.DOCS_URL ?? process.env.SITE_URL ?? "https://kiwillm.in";
const gatewayUrl =
	process.env.GATEWAY_URL ??
	process.env.PUBLIC_GATEWAY_URL ??
	(isHosted ? "https://api.kiwillm.in" : "http://localhost:4001");
const apiBackendUrl =
	process.env.API_BACKEND_URL ??
	process.env.INTERNAL_API_URL ??
	process.env.BACKEND_API_URL;
const defaultHostedOrigins = [
	"https://kiwillm.in",
	"https://www.kiwillm.in",
	"https://app.kiwillm.in",
	"https://chat.kiwillm.in",
	"https://api.kiwillm.in",
];
const defaultLocalOrigins = [
	"http://localhost:3002",
	"http://localhost:3003",
	"http://localhost:3004",
	"http://localhost:4001",
	"http://localhost:4002",
	"http://localhost:3006",
];
const hopByHopHeaders = new Set([
	"connection",
	"keep-alive",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailer",
	"transfer-encoding",
	"upgrade",
	"host",
]);
const upstreamCorsHeaders = new Set([
	"access-control-allow-credentials",
	"access-control-allow-headers",
	"access-control-allow-methods",
	"access-control-allow-origin",
	"access-control-expose-headers",
	"access-control-max-age",
]);

function splitOrigins(value: string | undefined) {
	return (value ?? "")
		.split(",")
		.map((origin) => origin.trim())
		.filter(Boolean);
}

function normalizeAllowedOrigin(origin: string): string | null {
	const trimmedOrigin = origin.trim().replace(/\/+$/, "");
	if (!trimmedOrigin || trimmedOrigin === "*") {
		return null;
	}

	try {
		return new URL(trimmedOrigin).origin;
	} catch {
		return trimmedOrigin;
	}
}

const allowedOrigins = Array.from(
	new Set(
		[
			...(isHosted ? defaultHostedOrigins : defaultLocalOrigins),
			...splitOrigins(process.env.ORIGIN_URLS),
			...splitOrigins(process.env.UI_URL),
			...splitOrigins(process.env.APP_URL),
			...splitOrigins(process.env.PLAYGROUND_URL),
			...splitOrigins(process.env.CHAT_URL),
			...splitOrigins(process.env.ADMIN_URL),
			...splitOrigins(process.env.API_URL),
		]
			.map(normalizeAllowedOrigin)
			.filter((origin): origin is string => Boolean(origin)),
	),
);
const allowAnyOrigin = splitOrigins(process.env.ORIGIN_URLS).includes("*");

const resolveCorsOrigin = (origin: string) => {
	if (!origin) {
		return "*";
	}

	if (allowedOrigins.includes(origin) || allowAnyOrigin) {
		return origin;
	}

	return "*";
};

function getOrigin(value: string | undefined): string | null {
	if (!value) {
		return null;
	}

	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

const apiProxyPrefixes = [
	"/activity",
	"/admin",
	"/auth",
	"/audit-logs",
	"/chat",
	"/chats",
	"/dev-plans",
	"/guardrails",
	"/internal",
	"/keys",
	"/logs",
	"/orgs",
	"/payments",
	"/playground",
	"/projects",
	"/public",
	"/referral",
	"/subscriptions",
	"/team",
	"/user",
];

function shouldProxyToApi(path: string) {
	return apiProxyPrefixes.some(
		(prefix) => path === prefix || path.startsWith(`${prefix}/`),
	);
}

async function proxyApiRequest(c: Context<ServerTypes>) {
	const gatewayOrigin = getOrigin(gatewayUrl);
	const apiOrigin = getOrigin(apiBackendUrl);

	if (!apiBackendUrl || !apiOrigin || apiOrigin === gatewayOrigin) {
		return jsonResponse(
			{
				message:
					"API backend upstream is not configured. Set API_BACKEND_URL on the gateway service to the API service URL.",
			},
			503,
		);
	}

	const requestUrl = new URL(c.req.url);
	const upstreamUrl = new URL(c.req.path, apiBackendUrl);
	upstreamUrl.search = requestUrl.search;

	const upstreamHeaders = new Headers();
	for (const [key, value] of c.req.raw.headers.entries()) {
		const normalizedKey = key.toLowerCase();
		if (
			!hopByHopHeaders.has(normalizedKey) &&
			!upstreamCorsHeaders.has(normalizedKey)
		) {
			upstreamHeaders.set(key, value);
		}
	}

	const method = c.req.method.toUpperCase();
	const hasBody = method !== "GET" && method !== "HEAD";
	const body = hasBody ? await c.req.raw.arrayBuffer() : undefined;
	const upstreamResponse = await fetch(upstreamUrl, {
		method,
		headers: upstreamHeaders,
		body,
		redirect: "manual",
	});

	const responseHeaders = new Headers(upstreamResponse.headers);
	for (const header of [...hopByHopHeaders, ...upstreamCorsHeaders]) {
		responseHeaders.delete(header);
	}
	responseHeaders.delete("content-encoding");
	responseHeaders.delete("content-length");

	const responseBody = await upstreamResponse.arrayBuffer();
	return new Response(responseBody, {
		status: upstreamResponse.status,
		statusText: upstreamResponse.statusText,
		headers: responseHeaders,
	});
}

function jsonResponse(
	data: unknown,
	status: number,
	headers?: Record<string, string>,
): Response {
	const body = JSON.stringify(data, (_key, value) => {
		if (typeof value === "bigint") {
			return value.toString();
		}
		if (typeof value === "number" && !Number.isFinite(value)) {
			return null;
		}
		return value;
	});

	return new Response(body, {
		status,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			"Cache-Control": "no-store, no-transform",
			"Content-Length": Buffer.byteLength(body).toString(),
			...(headers ?? {}),
		},
	});
}

export const config = {
	servers: [
		{
			url: gatewayUrl,
		},
	],
	openapi: "3.0.0",
	info: {
		version: "1.0.0",
		title: `${brandName} API`,
	},
	externalDocs: {
		url: docsUrl,
		description: `${brandName} Documentation`,
	},
	components: {
		securitySchemes: {
			bearerAuth: {
				type: "http",
				scheme: "bearer",
				description: "Bearer token authentication using API keys",
			},
		},
	},
};

export const app = new OpenAPIHono<ServerTypes>();

const honoRequestLogger = createHonoRequestLogger({ service: "gateway" });

const requestLifecycleMiddleware = createRequestLifecycleMiddleware({
	serviceName: `${gatewayServiceName}-lifecycle`,
});

// Add tracing middleware first so instrumentation stays active for downstream handlers
app.use("*", tracingMiddleware);
app.use("*", requestLifecycleMiddleware);
app.use("*", honoRequestLogger);

app.use(
	"*",
	cors({
		origin: resolveCorsOrigin,
		allowHeaders: [
			"Content-Type",
			"Authorization",
			"Cache-Control",
			"x-api-key",
			"apikey",
			"x-client-info",
			"x-supabase-api-version",
			"sentry-trace",
			"baggage",
			"mcp-session-id",
		],
		allowMethods: ["POST", "GET", "OPTIONS", "PUT", "PATCH", "DELETE"],
		exposeHeaders: ["Content-Length", "mcp-session-id"],
		maxAge: 600,
		credentials: true,
	}),
);

app.use("*", async (c, next) => {
	if (shouldProxyToApi(c.req.path)) {
		return await proxyApiRequest(c);
	}

	return await next();
});

// Middleware to check for application/json content type on POST requests
// Excludes /mcp endpoint which handles its own content type validation
// Excludes /oauth endpoints which accept form-urlencoded or JSON
// Excludes /v1/images endpoints which accept multipart/form-data for file uploads
app.use("*", async (c, next) => {
	if (
		c.req.method === "POST" &&
		!c.req.path.startsWith("/mcp") &&
		!c.req.path.startsWith("/oauth") &&
		!c.req.path.startsWith("/v1/images") &&
		!c.req.path.startsWith("/v1/audio")
	) {
		const contentType = c.req.header("Content-Type");
		if (!contentType || !contentType.includes("application/json")) {
			throw new HTTPException(415, {
				message:
					"Unsupported Media Type: Content-Type must be application/json",
			});
		}
	}
	return await next();
});

app.onError((error, c) => {
	if (error instanceof HTTPException) {
		const status = error.status;

		if (status >= 500) {
			logger.error("HTTP 500 exception", error);
		} else {
			logger.warn("HTTP client error", { status, message: error.message });
		}

		return jsonResponse(
			{
				error: true,
				status,
				message: error.message || "An error occurred",
				...(error.res ? { details: error.res } : {}),
			},
			status,
		);
	}

	// Handle timeout errors (from AbortSignal.timeout) - these are expected
	// operational errors when upstream providers are slow, not application bugs
	if (error instanceof Error && error.name === "TimeoutError") {
		logger.warn("Request timeout", {
			message: error.message,
			path: c.req.path,
			method: c.req.method,
		});
		return jsonResponse(
			{
				error: true,
				status: 504,
				message: "Gateway Timeout",
			},
			504,
		);
	}

	// Handle client disconnection (AbortError) - the client closed the
	// connection before the response was sent. Not an application error.
	if (error instanceof Error && error.name === "AbortError") {
		logger.info("Request aborted by client", {
			message: error.message,
			path: c.req.path,
			method: c.req.method,
		});
		return jsonResponse(
			{
				error: true,
				status: 499,
				message: "Client Closed Request",
			},
			499 as any,
		);
	}

	// For any other errors (non-HTTPException), return 500 Internal Server Error
	logger.error(
		"Unhandled error",
		error instanceof Error ? error : new Error(String(error)),
	);
	return jsonResponse(
		{
			error: true,
			status: 500,
			message: "Internal Server Error",
		},
		500,
	);
});

const root = createRoute({
	summary: "Health check",
	description: "Health check endpoint.",
	operationId: "health",
	method: "get",
	path: "/",
	request: {
		query: z.object({
			skip: z.string().optional().openapi({
				description:
					"Comma-separated list of health checks to skip. Options: redis, database",
				example: "redis,database",
			}),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z
						.object({
							message: z.string(),
							version: z.string(),
							health: z.object({
								status: z.string(),
								redis: z.object({
									connected: z.boolean(),
									error: z.string().optional(),
								}),
								database: z.object({
									connected: z.boolean(),
									error: z.string().optional(),
								}),
							}),
						})
						.openapi({}),
				},
			},
			description: "Health check response.",
		},
		503: {
			content: {
				"application/json": {
					schema: z
						.object({
							message: z.string(),
							version: z.string(),
							health: z.object({
								status: z.string(),
								redis: z.object({
									connected: z.boolean(),
									error: z.string().optional(),
								}),
								database: z.object({
									connected: z.boolean(),
									error: z.string().optional(),
								}),
							}),
						})
						.openapi({}),
				},
			},
			description: "Service unavailable - Redis or database connection failed.",
		},
	},
});

app.openapi(root, async (c) => {
	const { skip } = c.req.valid("query");
	const skipChecks = skip
		? skip.split(",").map((s) => s.trim().toLowerCase())
		: [];

	// By default, skip database health check for gateway since it uses cached db client
	// and can operate without direct Postgres connectivity as long as Redis is available
	const skipDatabase = process.env.HEALTH_CHECK_SKIP_DATABASE !== "false";
	if (skipDatabase && !skipChecks.includes("database")) {
		skipChecks.push("database");
	}

	// Health check timeout - allow more time under load for DB/Redis connections
	// 15 seconds default to prevent false failures during traffic spikes
	const TIMEOUT_MS = Number(process.env.HEALTH_CHECK_TIMEOUT_MS) || 15000;

	const healthChecker = new HealthChecker({
		redisClient,
		db,
		logger,
	});

	const health = await healthChecker.performHealthChecks({
		skipChecks,
		timeoutMs: TIMEOUT_MS,
	});

	const { response, statusCode } = healthChecker.createHealthResponse(health);

	return c.json(response, statusCode as 200 | 503);
});

// Prometheus metrics endpoint
const metricsRoute = createRoute({
	summary: "Prometheus metrics",
	description: "Prometheus metrics endpoint for scraping.",
	operationId: "metrics",
	method: "get",
	path: "/metrics",
	responses: {
		200: {
			content: {
				"text/plain": {
					schema: z.string(),
				},
			},
			description: "Prometheus metrics in exposition format.",
		},
	},
});

app.openapi(metricsRoute, async (c) => {
	const metrics = await getMetrics();
	return c.text(metrics, 200, {
		"Content-Type": getMetricsContentType(),
	});
});

const v1 = new OpenAPIHono<ServerTypes>();

v1.route("/chat", chat);
v1.route("/images", imagesRoute);
v1.route("/models", models);
v1.route("/messages", anthropic);
v1.route("/responses", responses);
v1.route("/audio", audioRoute);
v1.route("/videos", videosRoute);

app.route("/v1", v1);

// MCP endpoint - Model Context Protocol server
app.all("/mcp", mcpHandler);

// Register MCP OAuth routes for Claude Code authentication workaround
// This adds OAuth endpoints at /.well-known/oauth-authorization-server and /oauth/*
registerMcpOAuthRoutes(app);

app.doc("/json", config);

app.get("/docs", swaggerUI({ url: "/json" }));
