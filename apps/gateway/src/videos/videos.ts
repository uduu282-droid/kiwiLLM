import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";

import type { ServerTypes } from "@/vars.js";

const unsupportedJsonSchema = z.object({
	error: z.boolean(),
	status: z.number(),
	message: z.string(),
});

const generationsRoute = createRoute({
	operationId: "v1_videos_generations",
	summary: "Create video",
	description:
		"Video generation is not currently supported by the live KiwiLLM provider stack.",
	method: "post",
	path: "/generations",
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						model: z.string().optional(),
						prompt: z.string().optional(),
					}),
				},
			},
		},
	},
	responses: {
		501: {
			content: {
				"application/json": {
					schema: unsupportedJsonSchema,
				},
			},
			description: "Video generation is not supported yet.",
		},
	},
});

export const videos = new OpenAPIHono<ServerTypes>();

videos.openapi(generationsRoute, async () => {
	throw new HTTPException(501, {
		message:
			"Video generation is not supported yet on the current KiwiLLM provider stack.",
	});
});
