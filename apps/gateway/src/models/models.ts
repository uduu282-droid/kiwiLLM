import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";

import { getProviderEndpoint } from "@llmgateway/actions";
import { logger } from "@llmgateway/logger";
import {
	getProviderEnvConfig,
	getPreferredPublicProviders,
	getPublicProviderId,
	hasProviderEnvironmentToken,
	isKiwiHostedProviderId,
	models as modelsList,
	providers,
	type Provider,
	type ProviderModelMapping,
	type ModelDefinition,
} from "@llmgateway/models";

import type { ServerTypes } from "@/vars.js";

export const modelsApi = new OpenAPIHono<ServerTypes>();

function providerCanUseHostedRouteWithoutKey(providerId: Provider): boolean {
	return !getProviderEnvConfig(providerId)?.required.apiKey;
}

function canPubliclyRouteProviderMapping(
	provider: ProviderModelMapping,
): boolean {
	const providerId = provider.providerId as Provider;
	if (
		!providerCanUseHostedRouteWithoutKey(providerId) &&
		!hasProviderEnvironmentToken(providerId)
	) {
		return false;
	}

	try {
		return Boolean(
			getProviderEndpoint(
				providerId,
				undefined,
				provider.modelName,
				undefined,
				false,
				provider.reasoning === true,
				false,
				undefined,
				0,
				provider.imageGenerations === true,
			),
		);
	} catch {
		return false;
	}
}

function dedupePublicProviders(
	model: ModelDefinition,
	providersToDedupe: ProviderModelMapping[],
): ProviderModelMapping[] {
	const seen = new Set<string>();

	return providersToDedupe.filter((provider) => {
		const publicProviderId = getPublicProviderId(model, provider.providerId);
		const publicModelName = isKiwiHostedProviderId(provider.providerId)
			? model.id
			: provider.modelName;
		const key = `${publicProviderId}:${publicModelName}`;

		if (seen.has(key)) {
			return false;
		}

		seen.add(key);
		return true;
	});
}
const modelSchema = z.object({
	id: z.string(),
	name: z.string(),
	aliases: z.array(z.string()).optional(),
	created: z.number(),
	description: z.string().optional(),
	family: z.string(),
	architecture: z.object({
		input_modalities: z.array(z.enum(["text", "image", "video"])),
		output_modalities: z.array(z.enum(["text", "image", "video"])),
		tokenizer: z.string().optional(),
	}),
	top_provider: z.object({
		is_moderated: z.boolean(),
	}),
	providers: z.array(
		z.object({
			providerId: z.string(),
			modelName: z.string(),
			supportedVideoSizes: z.array(z.string()).optional(),
			supportsVideoAudio: z.boolean().optional(),
			supportsVideoWithoutAudio: z.boolean().optional(),
			pricing: z
				.object({
					prompt: z.string(),
					completion: z.string(),
					image: z.string().optional(),
					per_second: z.record(z.string()).optional(),
				})
				.optional(),
			streaming: z.union([z.boolean(), z.literal("only")]),
			vision: z.boolean(),
			cancellation: z.boolean(),
			tools: z.boolean(),
			parallelToolCalls: z.boolean(),
			reasoning: z.boolean(),
			stability: z
				.enum(["stable", "beta", "unstable", "experimental"])
				.optional(),
		}),
	),
	pricing: z.object({
		prompt: z.string(),
		completion: z.string(),
		image: z.string().optional(),
		per_second: z.record(z.string()).optional(),
		request: z.string().optional(),
		input_cache_read: z.string().optional(),
		input_cache_write: z.string().optional(),
		web_search: z.string().optional(),
		internal_reasoning: z.string().optional(),
	}),
	context_length: z.number().optional(),
	per_request_limits: z.record(z.string()).optional(),
	supported_parameters: z.array(z.string()).optional(),
	json_output: z.boolean(),
	structured_outputs: z.boolean(),
	free: z.boolean().optional(),
	deprecated_at: z.string().optional(),
	deactivated_at: z.string().optional(),
	stability: z.enum(["stable", "beta", "unstable", "experimental"]).optional(),
});

const listModelsResponseSchema = z.object({
	data: z.array(modelSchema),
});

const listModels = createRoute({
	operationId: "v1_models",
	summary: "Models",
	description: "List all available models",
	method: "get",
	path: "/",
	request: {
		query: z.object({
			include_deactivated: z
				.string()
				.optional()
				.transform((val) => val === "true")
				.describe("Include deactivated models in the response")
				.openapi({ example: "false" }),
			exclude_deprecated: z
				.string()
				.optional()
				.transform((val) => val === "true")
				.describe("Exclude deprecated models from the response")
				.openapi({ example: "false" }),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: listModelsResponseSchema,
				},
			},
			description: "List of available models",
		},
	},
});

modelsApi.openapi(listModels, async (c) => {
	try {
		const query = c.req.valid("query");
		const includeDeactivated = query.include_deactivated || false;
		const excludeDeprecated = query.exclude_deprecated || false;
		const currentDate = new Date();

		const filteredModels = modelsList
			.map((model: ModelDefinition) => {
				const publicProviders = getPreferredPublicProviders(model);
				const routeableProviders = dedupePublicProviders(
					model,
					publicProviders.filter((provider) => {
						const providerMapping = provider as ProviderModelMapping;

						if (
							!includeDeactivated &&
							providerMapping.deactivatedAt &&
							currentDate > providerMapping.deactivatedAt
						) {
							return false;
						}

						if (
							excludeDeprecated &&
							providerMapping.deprecatedAt &&
							currentDate > providerMapping.deprecatedAt
						) {
							return false;
						}

						return canPubliclyRouteProviderMapping(providerMapping);
					}),
				);
				if (routeableProviders.length === 0) {
					return null;
				}

				return {
					...model,
					providers: routeableProviders,
				};
			})
			.filter((model): model is ModelDefinition => model !== null);

		const modelData = filteredModels.map((model: ModelDefinition) => {
			// Determine input modalities (if model supports images)
			const inputModalities: ("text" | "image" | "video")[] = ["text"];

			// Check if any provider has vision support
			if (model.providers.some((p) => p.vision)) {
				inputModalities.push("image");
			}

			// Determine output modalities from model definition or default to text only
			const outputModalities: ("text" | "image" | "video")[] = model.output ?? [
				"text",
			];

			const firstProviderWithPricing = model.providers.find(
				(p: ProviderModelMapping) =>
					p.inputPrice !== undefined ||
					p.outputPrice !== undefined ||
					p.imageInputPrice !== undefined ||
					p.perSecondPrice !== undefined,
			);

			const inputPrice =
				firstProviderWithPricing?.inputPrice?.toString() ?? "0";
			const outputPrice =
				firstProviderWithPricing?.outputPrice?.toString() ?? "0";
			const imagePrice =
				firstProviderWithPricing?.imageInputPrice?.toString() ?? "0";

			return {
				id: model.id,
				name: model.name ?? model.id,
				aliases: model.aliases,
				created: Math.floor(Date.now() / 1000), // Current timestamp in seconds
				description: model.description,
				family: model.family,
				architecture: {
					input_modalities: inputModalities,
					output_modalities: outputModalities,
					tokenizer: "GPT", // TODO: Should come from model definitions when available
				},
				top_provider: {
					is_moderated: true,
				},
				providers: model.providers.map((provider: ProviderModelMapping) => {
					// Find the provider definition to get cancellation support
					const providerDef = providers.find(
						(p) => p.id === provider.providerId,
					);

					return {
						providerId: getPublicProviderId(model, provider.providerId),
						modelName: isKiwiHostedProviderId(provider.providerId)
							? model.id
							: provider.modelName,
						supportedVideoSizes: provider.supportedVideoSizes,
						supportsVideoAudio: provider.supportsVideoAudio,
						supportsVideoWithoutAudio: provider.supportsVideoWithoutAudio,
						pricing:
							provider.inputPrice !== undefined ||
							provider.outputPrice !== undefined ||
							provider.imageInputPrice !== undefined ||
							provider.perSecondPrice !== undefined
								? {
										prompt: provider.inputPrice?.toString() ?? "0",
										completion: provider.outputPrice?.toString() ?? "0",
										image: provider.imageInputPrice?.toString() ?? "0",
										per_second: provider.perSecondPrice
											? Object.fromEntries(
													Object.entries(provider.perSecondPrice).map(
														([resolution, price]) => [
															resolution,
															price.toString(),
														],
													),
												)
											: undefined,
									}
								: undefined,
						streaming: provider.streaming,
						vision: provider.vision ?? false,
						cancellation: providerDef?.cancellation ?? false,
						tools: provider.tools ?? false,
						parallelToolCalls: provider.parallelToolCalls ?? false,
						reasoning: provider.reasoning ?? false,
						stability: provider.stability ?? model.stability,
					};
				}),
				pricing: {
					prompt: inputPrice,
					completion: outputPrice,
					image: imagePrice,
					per_second: firstProviderWithPricing?.perSecondPrice
						? Object.fromEntries(
								Object.entries(firstProviderWithPricing.perSecondPrice).map(
									([resolution, price]) => [resolution, price.toString()],
								),
							)
						: undefined,
					request: firstProviderWithPricing?.requestPrice?.toString() ?? "0",
					input_cache_read:
						firstProviderWithPricing?.cachedInputPrice?.toString() ?? "0",
					input_cache_write: "0", // Not defined in model definitions yet
					web_search: "0", // Not defined in model definitions yet
					internal_reasoning: "0", // Not defined in model definitions yet
				},
				// Use context length from model definition (take the largest from all providers)
				context_length:
					Math.max(...model.providers.map((p) => p.contextSize ?? 0)) ??
					undefined,
				per_request_limits: getPerRequestLimits(model),
				// Get supported parameters from model definitions with fallback to defaults
				supported_parameters: getSupportedParametersFromModel(model),
				// Add model-level capabilities
				json_output:
					model.providers.some(
						(p) => (p as ProviderModelMapping).jsonOutput === true,
					) || false,
				structured_outputs:
					model.providers.some(
						(p) => (p as ProviderModelMapping).jsonOutputSchema === true,
					) || false,
				free: model.free ?? false,
				// Calculate earliest deprecatedAt from all provider mappings
				deprecated_at: model.providers
					.map((p) => (p as ProviderModelMapping).deprecatedAt)
					.filter((d): d is Date => d !== undefined)
					.sort((a, b) => a.getTime() - b.getTime())[0]
					?.toISOString(),
				// Calculate earliest deactivatedAt from all provider mappings
				deactivated_at: model.providers
					.map((p) => (p as ProviderModelMapping).deactivatedAt)
					.filter((d): d is Date => d !== undefined)
					.sort((a, b) => a.getTime() - b.getTime())[0]
					?.toISOString(),
				stability: model.stability,
			};
		});

		return c.json({ data: modelData });
	} catch (error) {
		logger.error(
			"Error in models endpoint",
			error instanceof Error ? error : new Error(String(error)),
		);
		throw new HTTPException(500, { message: "Internal server error" });
	}
});

function getPerRequestLimits(
	model: ModelDefinition,
): Record<string, string> | undefined {
	const limits: Record<string, string> = {};

	if (model.maxVideoDurationSeconds !== undefined) {
		limits.max_video_duration_seconds =
			model.maxVideoDurationSeconds.toString();
	}

	return Object.keys(limits).length > 0 ? limits : undefined;
}

// Helper function to determine supported parameters from model definitions
// Falls back to common default parameters if not explicitly defined
function getSupportedParametersFromModel(model: ModelDefinition): string[] {
	// Start with explicit supported parameters if any provider defines them
	for (const provider of model.providers) {
		const supportedParameters = provider.supportedParameters;
		if (supportedParameters && supportedParameters.length > 0) {
			const params = [...supportedParameters];
			// If any provider supports reasoning, expose the reasoning parameter
			if (model.providers.some((p) => p?.reasoning)) {
				if (!params.includes("reasoning")) {
					params.push("reasoning");
				}
			}
			return params;
		}
	}

	// Check if model is in the Anthropic family (which doesn't support frequency/presence penalty)
	const isAnthropicModel = model.family === "anthropic";

	// Default common parameters that most models support
	// Note: frequency_penalty and presence_penalty are NOT supported by Anthropic's Messages API
	const defaultCommonParams = isAnthropicModel
		? [
				"temperature",
				"max_tokens",
				"top_p",
				"response_format",
				"tools",
				"tool_choice",
			]
		: [
				"temperature",
				"max_tokens",
				"top_p",
				"frequency_penalty",
				"presence_penalty",
				"response_format",
				"tools",
				"tool_choice",
			];

	// If no provider has explicit supported parameters, return defaults
	const params = [...defaultCommonParams];
	if (model.providers.some((p) => p?.reasoning)) {
		params.push("reasoning");
	}
	return params;
}
