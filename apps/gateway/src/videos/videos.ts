import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";

import {
	findApiKeyByToken,
	findOrganizationById,
	findProjectById,
} from "@/lib/cached-queries.js";

import { getProviderEnvValue } from "@llmgateway/models";

import { logger } from "@llmgateway/logger";

import type { ServerTypes } from "@/vars.js";
import type { Context } from "hono";

const brandName = process.env.BRAND_NAME ?? "KiwiLLM";

const videoGenerationRequestSchema = z.object({
	model: z.string().optional().default("sora-video").openapi({
		example: "sora-video",
	}),
	prompt: z.string().min(1).openapi({
		example: "A cinematic shot of a dancing kangaroo in Tokyo snow",
	}),
	aspect_ratio: z
		.enum(["1:1", "16:9", "9:16", "4:3"])
		.optional()
		.default("16:9"),
	style: z
		.enum(["none", "cinematic", "anime", "realistic"])
		.optional()
		.default("none"),
	type: z.enum(["txt"]).optional().default("txt"),
});

const videoGenerationResponseSchema = z.object({
	id: z.string().optional(),
	url: z.string().url(),
	prompt: z.string().optional(),
	fps: z.string().optional(),
	author: z.string().optional(),
	author_img: z.string().optional(),
	thumbnail_url: z.string().optional(),
	created_at: z.string().optional(),
	aspect_ratio: z.string().optional(),
	height: z.string().optional(),
	width: z.string().optional(),
	keywords: z.array(z.string()).optional(),
});

const generationsRoute = createRoute({
	operationId: "v1_videos_generations",
	summary: "Create video",
	description:
		"Creates a video given a prompt using the Swift Sora KiwiLLM video worker.",
	method: "post",
	path: "/generations",
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: videoGenerationRequestSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: videoGenerationResponseSchema,
				},
			},
			description: "Video generation response.",
		},
	},
});

function getApiToken(c: Context): string {
	const auth = c.req.header("Authorization");
	const xApiKey = c.req.header("x-api-key");

	if (auth) {
		const split = auth.split("Bearer ");
		if (split.length === 2 && split[1]) {
			return split[1];
		}
	}

	if (xApiKey) {
		return xApiKey;
	}

	throw new HTTPException(401, {
		message:
			"Unauthorized: No API key provided. Expected 'Authorization: Bearer your-api-token' header or 'x-api-key: your-api-token' header",
	});
}

async function validateApiAccess(c: Context) {
	const token = getApiToken(c);
	const apiKey = await findApiKeyByToken(token);

	if (!apiKey || apiKey.status !== "active") {
		throw new HTTPException(401, {
			message: `Unauthorized: Invalid ${brandName} API token. Please make sure the token is not deleted or disabled.`,
		});
	}

	if (apiKey.usageLimit && Number(apiKey.usage) >= Number(apiKey.usageLimit)) {
		throw new HTTPException(401, {
			message: `Unauthorized: ${brandName} API key reached its usage limit.`,
		});
	}

	const project = await findProjectById(apiKey.projectId);
	if (!project) {
		throw new HTTPException(500, {
			message: "Could not find project",
		});
	}

	if (project.status === "deleted") {
		throw new HTTPException(410, {
			message: "Project has been archived and is no longer accessible",
		});
	}

	const organization = await findOrganizationById(project.organizationId);
	if (!organization) {
		throw new HTTPException(500, {
			message: "Could not find organization",
		});
	}
}

export const videos = new OpenAPIHono<ServerTypes>();

videos.openapi(generationsRoute, async (c) => {
	await validateApiAccess(c);

	const request = c.req.valid("json");
	if (request.model !== "sora-video") {
		throw new HTTPException(400, {
			message:
				"Only the sora-video model is currently supported for video generation.",
		});
	}

	const baseUrl =
		getProviderEnvValue(
			"kiwillm-swift-sora-video",
			"baseUrl",
			undefined,
			"https://swift-sora-video.revai.workers.dev",
		) ?? "https://swift-sora-video.revai.workers.dev";

	const response = await fetch(`${baseUrl}/api/generate`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			prompt: request.prompt,
			aspect_ratio: request.aspect_ratio,
			style: request.style,
			type: request.type,
		}),
	});

	const responseText = await response.text();

	if (!response.ok) {
		logger.warn("Video generation upstream request failed", {
			status: response.status,
			model: request.model,
			baseUrl,
			responseText: responseText.slice(0, 500),
		});

		throw new HTTPException(response.status as 400 | 401 | 403 | 404 | 429 | 500, {
			message: responseText || `Video generation failed with status ${response.status}`,
		});
	}

	try {
		const parsed = JSON.parse(responseText) as z.infer<
			typeof videoGenerationResponseSchema
		>;
		return c.json(parsed);
	} catch (error) {
		logger.error("Video generation response parse failed", {
			err: error instanceof Error ? error : new Error(String(error)),
		});
		throw new HTTPException(500, {
			message: "Failed to parse video generation response",
		});
	}
});
