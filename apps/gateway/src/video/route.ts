import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";

import { logger } from "@llmgateway/logger";

import type { ServerTypes } from "@/vars.js";

export const videoRoute = new Hono<ServerTypes>();
const unifiedWorkerBaseUrl =
	process.env.LLM_KIWILLM_UNIFIED_BASE_URL ??
	"https://unified-ai-worker.rutv.workers.dev";

videoRoute.post("/generations", async (c) => {
	try {
		const body = await c.req.json();
		const authorization = c.req.header("Authorization");
		const apiKey = c.req.header("x-api-key");

		const upstreamHeaders = new Headers({
			"Content-Type": "application/json",
		});

		if (authorization) {
			upstreamHeaders.set("Authorization", authorization);
		}
		if (apiKey) {
			upstreamHeaders.set("x-api-key", apiKey);
		}

		const response = await fetch(
			`${unifiedWorkerBaseUrl}/v1/video/generations`,
			{
				method: "POST",
				headers: upstreamHeaders,
				body: JSON.stringify(body),
				signal: AbortSignal.timeout(90000),
			},
		);

		const responseText = await response.text();
		const contentType =
			response.headers.get("content-type") ?? "application/json";

		return new Response(responseText, {
			status: response.status,
			headers: {
				"content-type": contentType,
			},
		});
	} catch (error) {
		logger.error(
			"Video generation proxy failed",
			error instanceof Error ? error : new Error(String(error)),
		);
		throw new HTTPException(502, {
			message: "Video generation upstream request failed",
		});
	}
});
