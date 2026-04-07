import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";

import { createLogEntry } from "@/chat/tools/create-log-entry.js";
import {
	findApiKeyByToken,
	findOrganizationById,
	findProjectById,
} from "@/lib/cached-queries.js";
import { calculateCosts } from "@/lib/costs.js";
import { insertLog } from "@/lib/logs.js";
import { assertHostedCreditsAvailable } from "@/lib/model-access.js";

import { shortid } from "@llmgateway/db";
import { logger } from "@llmgateway/logger";
import {
	getProviderEnvValue,
	models,
	type ModelDefinition,
	type Provider,
	type ProviderModelMapping,
} from "@llmgateway/models";


import type { ServerTypes } from "@/vars.js";
import type { Context } from "hono";

const brandName = process.env.BRAND_NAME ?? "KiwiLLM";

const transcriptionResponseSchema = z.object({
	text: z.string().optional(),
});

const unsupportedJsonSchema = z.object({
	error: z.boolean(),
	status: z.number(),
	message: z.string(),
});

const unsupportedMessage =
	"This endpoint is not supported yet on the current KiwiLLM provider stack.";

const speechRoute = createRoute({
	operationId: "v1_audio_speech",
	summary: "Audio speech",
	description:
		"Text-to-speech generation is not currently supported by the live KiwiLLM provider stack.",
	method: "post",
	path: "/speech",
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"application/json": {
					schema: z.object({
						model: z.string(),
						input: z.string(),
						voice: z.string().optional(),
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
			description: "Text-to-speech is not supported yet.",
		},
	},
});

const translationsRoute = createRoute({
	operationId: "v1_audio_translations",
	summary: "Audio translations",
	description:
		"Audio translation is not currently supported by the live KiwiLLM provider stack.",
	method: "post",
	path: "/translations",
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			content: {
				"multipart/form-data": {
					schema: z.object({
						model: z.string().optional(),
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
			description: "Audio translation is not supported yet.",
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

	return { apiKey, project, organization };
}

function isAudioModel(model: ModelDefinition): boolean {
	return (model.output as readonly string[] | undefined)?.includes("audio") === true;
}

function resolveTranscriptionProviderMapping(
	requestedModel: string,
): { model: ModelDefinition; provider: ProviderModelMapping } {
	const model = models.find((candidate) => candidate.id === requestedModel);

	if (!model || !isAudioModel(model)) {
		throw new HTTPException(400, {
			message: `Model ${requestedModel} is not available for audio transcription.`,
		});
	}

	const preferredProviders = model.providers.filter(
		(provider): provider is ProviderModelMapping =>
			provider.providerId === "kiwillm-groq-worker",
	);

	const provider = preferredProviders[0];

	if (!provider) {
		throw new HTTPException(501, {
			message: `Model ${requestedModel} does not have a transcription provider configured yet.`,
		});
	}

	return { model, provider };
}

function getAudioTranscriptionEndpoint(providerId: Provider): string {
	switch (providerId) {
		case "kiwillm-groq-worker": {
			const baseUrl =
				getProviderEnvValue(
					"kiwillm-groq-worker",
					"baseUrl",
					undefined,
					"https://groq-worker.revai.workers.dev",
				) ?? "https://groq-worker.revai.workers.dev";

			return `${baseUrl}/v1/audio/transcriptions`;
		}
		default:
			throw new HTTPException(501, {
				message: `Provider ${providerId} does not support audio transcription routing yet.`,
			});
	}
}

function appendStringField(
	formData: FormData,
	key: string,
	value: FormDataEntryValue | undefined,
) {
	if (typeof value === "string" && value.length > 0) {
		formData.append(key, value);
	}
}

function buildUpstreamTranscriptionFormData(
	body: Record<string, FormDataEntryValue | FormDataEntryValue[]>,
	providerModelName: string,
): FormData {
	const fileField = body.file;
	const fileValue = Array.isArray(fileField) ? fileField[0] : fileField;

	if (!(fileValue instanceof File)) {
		throw new HTTPException(400, {
			message: "file is required and must be an uploaded audio file",
		});
	}

	const upstreamBody = new FormData();
	upstreamBody.append("file", fileValue, fileValue.name);
	upstreamBody.append("model", providerModelName);

	appendStringField(
		upstreamBody,
		"language",
		Array.isArray(body.language) ? body.language[0] : body.language,
	);
	appendStringField(
		upstreamBody,
		"prompt",
		Array.isArray(body.prompt) ? body.prompt[0] : body.prompt,
	);
	appendStringField(
		upstreamBody,
		"response_format",
		Array.isArray(body.response_format)
			? body.response_format[0]
			: body.response_format,
	);
	appendStringField(
		upstreamBody,
		"temperature",
		Array.isArray(body.temperature) ? body.temperature[0] : body.temperature,
	);

	const timestampGranularities = body["timestamp_granularities[]"];
	if (Array.isArray(timestampGranularities)) {
		for (const entry of timestampGranularities) {
			appendStringField(
				upstreamBody,
				"timestamp_granularities[]",
				entry,
			);
		}
	} else {
		appendStringField(
			upstreamBody,
			"timestamp_granularities[]",
			timestampGranularities,
		);
	}

	return upstreamBody;
}

async function proxyTranscriptionRequest(c: Context) {
	const { apiKey, project, organization } = await validateApiAccess(c);

	const contentType = c.req.header("Content-Type") ?? "";
	if (!contentType.includes("multipart/form-data")) {
		throw new HTTPException(415, {
			message:
				"Unsupported Media Type: Content-Type must be multipart/form-data",
		});
	}

	const body = (await c.req.parseBody({
		all: true,
	})) as Record<string, FormDataEntryValue | FormDataEntryValue[]>;

	const requestedModelField = body.model;
	const requestedModelValue = Array.isArray(requestedModelField)
		? requestedModelField[0]
		: requestedModelField;
	const requestedModel =
		typeof requestedModelValue === "string" && requestedModelValue.length > 0
			? requestedModelValue
			: "whisper-large-v3-turbo";

	const { model, provider } = resolveTranscriptionProviderMapping(requestedModel);
	const requestId = shortid();
	const promptField = body.prompt;
	const transcriptionPrompt = Array.isArray(promptField)
		? promptField[0]
		: promptField;
	const promptText =
		typeof transcriptionPrompt === "string" && transcriptionPrompt.length > 0
			? transcriptionPrompt
			: "[audio transcription]";

	await assertHostedCreditsAvailable({
		organization,
		model,
		provider: provider.providerId as Provider,
		providerIsZeroCost: false,
		promptTokens: 1,
		completionTokens: 0,
		fullOutput: {
			prompt: promptText,
		},
	});

	const endpoint = getAudioTranscriptionEndpoint(provider.providerId as Provider);
	const upstreamBody = buildUpstreamTranscriptionFormData(
		body,
		provider.modelName,
	);

	const response = await fetch(endpoint, {
		method: "POST",
		body: upstreamBody,
	});

	const responseText = await response.text();

	if (!response.ok) {
		logger.warn("Audio transcription upstream request failed", {
			status: response.status,
			providerId: provider.providerId,
			model: requestedModel,
			endpoint,
			responseText: responseText.slice(0, 500),
		});

		throw new HTTPException(response.status as 400 | 401 | 403 | 404 | 429 | 500, {
			message:
				responseText ||
				`Audio transcription failed with status ${response.status}`,
		});
	}

	const upstreamContentType =
		response.headers.get("content-type") ?? "application/json";

	if (upstreamContentType.includes("application/json")) {
		const parsed = JSON.parse(responseText) as z.infer<
			typeof transcriptionResponseSchema
		>;

		const baseLogEntry = createLogEntry(
			requestId,
			project,
			apiKey,
			undefined,
			`${provider.providerId}/${model.id}`,
			provider.modelName,
			provider.providerId,
			requestedModel,
			provider.providerId,
			[
				{
					role: "user",
					content: promptText,
				},
			],
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			undefined,
			c.req.header("x-source") ?? undefined,
			{},
			false,
			c.req.header("User-Agent") ?? undefined,
		);
		const costs = await calculateCosts(
			model.id,
			provider.providerId,
			1,
			0,
			null,
			{
				prompt: promptText,
				completion: parsed.text,
			},
			null,
			0,
			undefined,
			0,
			null,
			project.organizationId,
		);

		await insertLog({
			...baseLogEntry,
			duration: 0,
			timeToFirstToken: null,
			timeToFirstReasoningToken: null,
			responseSize: responseText.length,
			content: parsed.text ?? null,
			reasoningContent: null,
			finishReason: "stop",
			promptTokens: (costs.promptTokens ?? 1).toString(),
			completionTokens: (costs.completionTokens ?? 0).toString(),
			totalTokens: (
				(costs.promptTokens ?? 1) + (costs.completionTokens ?? 0)
			).toString(),
			reasoningTokens: null,
			cachedTokens: null,
			hasError: false,
			streamed: false,
			canceled: false,
			errorDetails: null,
			inputCost: costs.inputCost,
			outputCost: costs.outputCost,
			cachedInputCost: costs.cachedInputCost,
			requestCost: costs.requestCost,
			webSearchCost: costs.webSearchCost,
			imageInputTokens: null,
			imageOutputTokens: null,
			imageInputCost: costs.imageInputCost,
			imageOutputCost: costs.imageOutputCost,
			cost: costs.totalCost,
			estimatedCost: true,
			discount: costs.discount,
			pricingTier: costs.pricingTier,
			dataStorageCost: "0",
			cached: false,
		});

		return c.json(parsed);
	}

	const baseLogEntry = createLogEntry(
		requestId,
		project,
		apiKey,
		undefined,
		`${provider.providerId}/${model.id}`,
		provider.modelName,
		provider.providerId,
		requestedModel,
		provider.providerId,
		[
			{
				role: "user",
				content: promptText,
			},
		],
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		undefined,
		c.req.header("x-source") ?? undefined,
		{},
		false,
		c.req.header("User-Agent") ?? undefined,
	);
	const costs = await calculateCosts(
		model.id,
		provider.providerId,
		1,
		0,
		null,
		{
			prompt: promptText,
			completion: responseText,
		},
		null,
		0,
		undefined,
		0,
		null,
		project.organizationId,
	);

	await insertLog({
		...baseLogEntry,
		duration: 0,
		timeToFirstToken: null,
		timeToFirstReasoningToken: null,
		responseSize: responseText.length,
		content: responseText,
		reasoningContent: null,
		finishReason: "stop",
		promptTokens: (costs.promptTokens ?? 1).toString(),
		completionTokens: (costs.completionTokens ?? 0).toString(),
		totalTokens: ((costs.promptTokens ?? 1) + (costs.completionTokens ?? 0)).toString(),
		reasoningTokens: null,
		cachedTokens: null,
		hasError: false,
		streamed: false,
		canceled: false,
		errorDetails: null,
		inputCost: costs.inputCost,
		outputCost: costs.outputCost,
		cachedInputCost: costs.cachedInputCost,
		requestCost: costs.requestCost,
		webSearchCost: costs.webSearchCost,
		imageInputTokens: null,
		imageOutputTokens: null,
		imageInputCost: costs.imageInputCost,
		imageOutputCost: costs.imageOutputCost,
		cost: costs.totalCost,
		estimatedCost: true,
		discount: costs.discount,
		pricingTier: costs.pricingTier,
		dataStorageCost: "0",
		cached: false,
	});

	return new Response(responseText, {
		status: 200,
		headers: {
			"Content-Type": upstreamContentType,
		},
	});
}

export const audio = new OpenAPIHono<ServerTypes>();

audio.post("/transcriptions", proxyTranscriptionRequest);

audio.openapi(translationsRoute, async () => {
	throw new HTTPException(501, {
		message: unsupportedMessage,
	});
});

audio.openapi(speechRoute, async () => {
	throw new HTTPException(501, {
		message: unsupportedMessage,
	});
});
