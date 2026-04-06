import { alibabaModels } from "./models/alibaba.js";
import { anthropicModels } from "./models/anthropic.js";
import { bytedanceModels } from "./models/bytedance.js";
import {
	chataiProxyModels,
	chataiProxyProviderAugments,
} from "./models/chatai-proxy.js";
import {
	completionsMeModels,
	completionsMeProviderAugments,
} from "./models/completions-me.js";
import { deepseekModels } from "./models/deepseek.js";
import {
	freecfmodelsModels,
	freecfmodelsProviderAugments,
} from "./models/freecfmodels.js";
import { googleModels } from "./models/google.js";
import {
	groqWorkerModels,
	groqWorkerProviderAugments,
} from "./models/groq-worker.js";
import {
	ishChatProxyModels,
	ishChatProxyProviderAugments,
} from "./models/ish-chat-proxy.js";
import {
	literouterProxyModels,
	literouterProxyProviderAugments,
} from "./models/literouter-proxy.js";
import { llmgatewayModels } from "./models/llmgateway.js";
import { metaModels } from "./models/meta.js";
import { microsoftModels } from "./models/microsoft.js";
import { minimaxModels } from "./models/minimax.js";
import { mistralModels } from "./models/mistral.js";
import { moonshotModels } from "./models/moonshot.js";
import { nousresearchModels } from "./models/nousresearch.js";
import {
	nvidiaWorkerModels,
	nvidiaWorkerProviderAugments,
} from "./models/nvidia-worker.js";
import { getOfficialProxyPricing } from "./models/official-proxy-pricing.js";
import { openaiModels } from "./models/openai.js";
import {
	openrouterAiHubModels,
	openrouterAiHubProviderAugments,
} from "./models/openrouter-ai-hub.js";
import { perplexityModels } from "./models/perplexity.js";
import {
	svelteAiEnhancedModels,
	svelteAiEnhancedProviderAugments,
} from "./models/svelte-ai-enhanced.js";
import { swiftSoraVideoModels } from "./models/swift-sora-video.js";
import { xaiModels } from "./models/xai.js";
import { zaiModels } from "./models/zai.js";

import type { providers } from "./providers.js";

export type Provider = (typeof providers)[number]["id"];

export type Model = (typeof models)[number]["providers"][number]["modelName"];

/**
 * Pricing tier for models with context-length based pricing
 */
export interface PricingTier {
	/**
	 * Name of the pricing tier (e.g., "128K", "1M")
	 */
	name: string;
	/**
	 * Maximum number of tokens for this tier (use Infinity for the highest tier)
	 */
	upToTokens: number;
	/**
	 * Price per input token in USD for this tier
	 */
	inputPrice: number;
	/**
	 * Price per output token in USD for this tier
	 */
	outputPrice: number;
	/**
	 * Price per cached input token in USD for this tier
	 */
	cachedInputPrice?: number;
}

export interface ProviderModelMapping {
	providerId: (typeof providers)[number]["id"];
	modelName: string;
	/**
	 * Price per input token in USD
	 */
	inputPrice?: number;
	/**
	 * Price per output token in USD
	 */
	outputPrice?: number;
	/**
	 * Price per image output token in USD (for models with separate text/image output pricing)
	 */
	imageOutputPrice?: number;
	/**
	 * Price per cached input token in USD
	 */
	cachedInputPrice?: number;
	/**
	 * Minimum number of tokens required for a segment to be cacheable.
	 * Prompts smaller than this threshold won't be cached even with cache_control set.
	 * Model-specific: Claude 3 Haiku requires 2048, Claude Opus 4.5 requires 4096, most others require 1024.
	 */
	minCacheableTokens?: number;
	/**
	 * Price per image input in USD
	 */
	imageInputPrice?: number;
	/**
	 * Resolution-based token counts for image output.
	 * Maps resolution keys (e.g., "1K", "2K", "4K", "default") to tokens per image.
	 * The per-token price comes from imageOutputPrice.
	 * Use "default" key as a fallback when no imageSize is specified.
	 */
	imageOutputTokensByResolution?: Record<string, number>;
	/**
	 * Resolution-based token counts for image input.
	 * Maps resolution keys (e.g., "1K", "2K", "4K", "default") to tokens per image.
	 * The per-token price comes from imageInputPrice.
	 * Use "default" key as a fallback when no imageSize is specified.
	 */
	imageInputTokensByResolution?: Record<string, number>;
	/**
	 * Price per request in USD
	 */
	requestPrice?: number;
	/**
	 * Discount multiplier (0-1), where 0.5 = 50% off
	 */
	discount?: number;
	/**
	 * Pricing tiers for models with context-length based pricing.
	 * When set, inputPrice and outputPrice represent the base tier.
	 * Tiers should be sorted by upToTokens in ascending order.
	 */
	pricingTiers?: PricingTier[];
	/**
	 * Maximum context window size in tokens
	 */
	contextSize?: number;
	/**
	 * Maximum output size in tokens
	 */
	maxOutput?: number;
	/**
	 * Whether this specific model supports streaming for this provider
	 */
	streaming: boolean;
	/**
	 * Whether this specific model supports vision (image inputs) for this provider
	 */
	vision?: boolean;
	/**
	 * Whether this model supports reasoning mode
	 */
	reasoning?: boolean;
	/**
	 * Whether this model supports the OpenAI responses API (defaults to true if reasoning is true)
	 */
	supportsResponsesApi?: boolean;
	/**
	 * Controls whether reasoning output is expected from the model.
	 * - undefined: Expect reasoning output if reasoning is true (default behavior)
	 * - "omit": Don't expect reasoning output even if reasoning is true (for models like o1 that don't return reasoning content)
	 */
	reasoningOutput?: "omit";
	/**
	 * Whether this model supports explicit reasoning.max_tokens parameter.
	 * When true, users can specify the exact token budget for reasoning instead of using reasoning_effort levels.
	 * Supported by Anthropic and Google thinking models.
	 */
	reasoningMaxTokens?: boolean;
	/**
	 * Whether this specific model supports tool calling for this provider
	 */
	tools?: boolean;
	/**
	 * Whether this model supports parallel tool calls
	 */
	parallelToolCalls?: boolean;
	/**
	 * Whether this specific model supports JSON output mode for this provider
	 */
	jsonOutput?: boolean;
	/**
	 * Whether this provider supports JSON schema output mode (json_schema response format)
	 */
	jsonOutputSchema?: boolean;
	/**
	 * Whether this model supports web search/grounding capabilities
	 */
	webSearch?: boolean;
	/**
	 * Price per web search query in USD (charged when web search is used)
	 */
	webSearchPrice?: number;
	/**
	 * List of supported API parameters for this model/provider combination
	 */
	supportedParameters?: string[];
	/**
	 * Test skip/only functionality
	 */
	test?: "skip" | "only";
	/**
	 * Stability level of the model for this specific provider (defaults to model-level stability if not specified)
	 * - stable: Fully tested and production ready
	 * - beta: Generally stable but may have minor issues
	 * - unstable: May have significant issues or frequent changes
	 * - experimental: Early stage, use with caution
	 */
	stability?: StabilityLevel;
	/**
	 * Date when the model mapping will be deprecated (still usable but filtered from selection algorithms)
	 */
	deprecatedAt?: Date;
	/**
	 * Date when the model mapping will be deactivated (returns error when requested)
	 */
	deactivatedAt?: Date;
	/**
	 * Whether this model uses a dedicated image generation API.
	 * When true, requests are routed to a provider-specific image generation endpoint.
	 */
	imageGenerations?: boolean;
}

export type StabilityLevel = "stable" | "beta" | "unstable" | "experimental";

export interface ModelDefinition {
	/**
	 * Unique identifier for the model
	 */
	id: string;
	/**
	 * Human-readable display name for the model
	 */
	name?: string;
	/**
	 * Alternative names or search terms for the model
	 */
	aliases?: string[];
	/**
	 * Model family (e.g., 'openai', 'deepseek', 'anthropic')
	 */
	family: string;
	/**
	 * Mappings to provider models
	 */
	providers: ProviderModelMapping[];
	/**
	 * Whether this model is free to use
	 */
	free?: boolean;
	/**
	 * Rate limit tier for free models (defaults to 'low' if not specified)
	 * - low: Standard rate limits for free models
	 * - high: More generous rate limits for free models
	 * Only applies when free is true
	 */
	rateLimitKind?: "low" | "high";
	/**
	 * Output formats supported by the model (defaults to ['text'] if not specified)
	 */
	output?: ("text" | "image" | "audio" | "video")[];
	/**
	 * Whether this model requires an image input to function (e.g. image editing models).
	 */
	imageInputRequired?: boolean;
	/**
	 * Stability level of the model (defaults to 'stable' if not specified)
	 * - stable: Fully tested and production ready
	 * - beta: Generally stable but may have minor issues
	 * - unstable: May have significant issues or frequent changes
	 * - experimental: Early stage, use with caution
	 */
	stability?: StabilityLevel;
	/**
	 * Whether this model supports system role messages (defaults to true if not specified)
	 */
	supportsSystemRole?: boolean;
	/**
	 * Description of the model
	 */
	description?: string;
	/**
	 * Date when the model was released by the provider
	 */
	releasedAt?: Date;
}

const baseModels: ModelDefinition[] = [
	...llmgatewayModels,
	...openaiModels,
	...anthropicModels,
	...googleModels,
	...perplexityModels,
	...xaiModels,
	...metaModels,
	...deepseekModels,
	...mistralModels,
	...microsoftModels,
	...minimaxModels,
	...moonshotModels,
	...alibabaModels,
	...bytedanceModels,
	...nousresearchModels,
	...zaiModels,
] as const;

export const freeTierModelIds = new Set<string>([
	"gpt-4o-mini",
	"gpt-4.1-mini",
	"gpt-4.1-nano",
	"gpt-3.5-turbo",
	"gpt-oss-20b",
	"gemini-2.5-flash",
	"gemini-2.0-flash",
	"gemini-2.0-flash-lite",
	"gemini-1.5-flash",
	"gemini-1.5-flash-8b",
	"gemma-2-2b-it",
	"gemma-2-9b-it",
	"gemma-3-4b-it",
	"gemma-3-12b-it",
	"llama-3.1-8b-instant",
	"llama-3.1-8b-instruct",
	"llama-3.2-1b-instruct",
	"llama-3.2-3b-instruct",
	"llama-3.2-11b-instruct",
	"llama3-8b-instruct",
	"qwen-2.5-7b-instruct",
	"qwen2.5-coder-7b-instruct",
	"qwen2-7b-instruct",
	"qwen3-32b",
	"qwen3-coder-flash",
	"qwen-flash",
	"qwen-turbo",
	"deepseek-chat",
	"deepseek-v3",
	"deepseek-v3.1",
	"deepseek-r1-distill-llama-8b",
	"deepseek-r1-0528",
	"phi-4-mini-instruct",
	"phi-4-mini-flash-reasoning",
	"phi-3.5-mini-instruct",
	"phi-3-mini-4k-instruct",
	"phi-3-mini-128k-instruct",
	"phi-3-small-8k-instruct",
	"phi-3-small-128k-instruct",
	"mistral-small",
	"mistral-nemo",
	"mistral-7b-instruct-v0.3",
	"ministral-3b-2512",
	"ministral-8b-2512",
	"jamba-1.5-mini-instruct",
	"granite-guardian-3.0-8b",
	"solar-10.7b-instruct",
	"eurollm-9b-instruct",
	"falcon3-7b-instruct",
	"baichuan2-13b-chat",
]);

export const starterOnlyTierModelIds = new Set<string>([
	"claude-3-5-haiku",
	"claude-haiku-4.5",
	"grok-4-1-fast",
	"sonar",
	"kimi-k2.5",
	"minimax-m1",
	"llama-3.3-70b-versatile",
	"llama-3.2-11b-vision-instruct",
	"qwen2.5-coder-32b-instruct",
	"qwen3-14b",
	"qwen3-30b-a3b",
	"deepseek-r1-distill-llama-70b",
	"deepseek-v3.5",
	"phi-4",
	"phi-4-multimodal-instruct",
	"mistral-large-2",
	"mixtral-8x7b-instruct-together",
	"command-r",
	"command-r-08-2024",
	"command-a",
	"gemini-3-flash-preview",
	"gemini-3-pro-preview",
	"gemini-3.1-flash-lite-preview",
	"gemini-2.5-flash-image",
	"gemini-2.5-flash-image-preview",
	"qwen3-vl-8b-instruct",
	"whisper-large-v3-turbo",
	"chatglm3-6b",
	"rakutenai-7b-instruct",
	"sarvam-m",
	"bielik-11b-v2.6-instruct",
	"stockmark-2-100b-instruct",
	"gpt-4o",
	"gpt-4.1",
	"gpt-5.2",
	"o1-mini",
	"o3-mini",
	"claude-3-5-sonnet",
	"claude-3-7-sonnet",
	"claude-sonnet-4",
	"gemini-1.5-pro",
	"gemini-2.5-pro",
	"gemini-3-pro",
	"grok-3",
	"grok-4-fast",
	"sonar-pro",
	"kimi-k2",
	"minimax-m2.1-lightning",
	"qwen-max",
	"qwen-plus",
	"qwen3-next-80b-a3b-instruct",
	"qwen3-coder-30b-a3b-instruct",
	"qwen3-coder",
	"qwen3-thinking-2507",
	"llama-3.1-70b-instruct",
	"llama-3.1-405b-instruct",
	"llama-3.3-70b-instruct",
	"llama-4-scout",
	"llama-4-maverick",
	"deepseek-reasoner",
	"deepseek-r1",
	"mistral-large",
	"codestral-2508",
	"devstral-2512",
	"command-r-plus",
	"nova-pro",
	"glm-4.5",
	"glm4.7",
	"step-3.5-flash",
	"magistral-small-2506",
	"mixtral-8x22b-instruct-v0.1",
	"dbrx-instruct",
	"wizardlm-2-8x22b",
	"nemotron",
	"dracarys-llama-3.1-70b-instruct",
	"mistral-small-2506",
	"gpt-5-mini",
	"gemini-3.1-pro-preview",
	"claude-4-sonnet",
	"qwen3-max",
	"gemini-3-flash",
	"mistral-small-24b-instruct",
	"llama-4-maverick-17b-instruct",
]);

export const proOnlyTierModelIds = new Set<string>([
	"claude-3-haiku",
	"claude-3-haiku-20240307",
	"claude-3-5-haiku-20241022",
	"claude-haiku-4-5",
	"grok-3-mini",
	"grok-3-mini-fast",
	"kimi-k2-thinking-turbo",
	"minimax-text-01",
	"gemini-3-flash-preview",
	"gemini-3.1-flash-lite-preview",
	"gemini-3.1-flash-image-preview",
	"qwen3-vl-8b-instruct",
	"qwen3-vl-flash",
	"qwen3-4b-fp8",
	"qwen3-32b-fp8",
	"qwen3-30b-a3b-fp8",
	"mistral-small-24b-instruct-2501",
	"mistral-small-3.1",
	"ministral-14b-2512",
	"llama-4-scout-17b-instruct",
	"rakutenai-7b-chat",
	"breeze-7b-instruct",
	"marin-8b-instruct",
	"teuken-7b-instruct-commercial-v0.4",
	"llama-3.1-nemotron-nano-8b-v1",
	"nvidia-nemotron-nano-9b-v2",
	"nemotron-mini-4b-instruct",
	"nemotron-nano-12b-v2-vl",
	"llama-3.1-nemotron-nano-vl-8b-v1",
	"llama3-chatqa-1.5-8b",
	"gliner-pii",
	"gpt-5",
	"gpt-5.1",
	"gpt-5-pro",
	"gpt-5.2-pro",
	"gpt-5.4-pro",
	"o3",
	"claude-4-opus",
	"claude-opus-4.5",
	"claude-opus-4.6",
	"claude-sonnet-4.5",
	"claude-sonnet-4.6",
	"gemini-3-pro-preview",
	"gemini-3-pro-image-preview",
	"grok-4",
	"grok-4-fast-reasoning",
	"grok-4-20-beta-0309-reasoning",
	"grok-4-20-multi-agent-beta-0309",
	"grok-code-fast-1",
	"sonar-reasoning-pro",
	"kimi-k2-thinking",
	"minimax-m2.5",
	"qwen3-235b-a22b-thinking-2507",
	"qwen3-coder-480b-a35b-instruct",
	"qwen3-next-80b-a3b-thinking",
	"qwen3-vl-235b-a22b-thinking",
	"llama-4-maverick-17b-128e-instruct",
	"mistral-large-3-675b-instruct-2512",
	"glm-5",
	"whisper-large-v3",
]);

export const payAsYouGoOnlyTierModelIds = new Set<string>([
	"claude-4-opus",
	"claude-opus-4.5",
	"claude-opus-4.6",
	"claude-sonnet-4.5",
	"claude-sonnet-4.6",
	"claude-4-sonnet",
	"gemini-2.5-pro",
	"gemini-3-pro-preview",
	"gemini-3-pro-image-preview",
	"gemini-3.1-pro-preview",
	"gemini-2.5-pro-preview-06-05",
	"grok-4",
	"grok-4-fast-reasoning",
	"grok-4-20-beta-0309-reasoning",
	"grok-4-20-multi-agent-beta-0309",
	"grok-code-fast-1",
	"gpt-5",
	"gpt-5.1",
	"gpt-5.2",
	"gpt-5-pro",
	"gpt-5.2-pro",
	"gpt-5.4-pro",
	"gpt-5-codex",
	"o3",
	"o4-mini-deep-research",
	"qwen3-235b-a22b-thinking-2507",
	"qwen3-coder-480b-a35b-instruct",
	"qwen3-next-80b-a3b-thinking",
	"qwen3-vl-235b-a22b-thinking",
	"qwen3-max",
	"qwen3-max-2026-01-23",
	"qwen3.5-plus",
	"qwen35-397b-a17b",
	"kimi-k2-thinking",
	"kimi-k2-thinking-turbo",
	"minimax-m2.5",
	"sonar-reasoning-pro",
	"glm-5",
	"mistral-large-3-675b-instruct-2512",
	"gpt-5-image",
	"gpt-5-image-mini",
	"sora-video",
	"stable-diffusion-xl",
	"flux-1-schnell",
	"grok-imagine-image",
	"grok-imagine-image-pro",
	"glm-image",
	"cogview-4",
	"seedream-4-0",
	"seedream-4-5",
	"qwen-image",
	"qwen-image-max",
	"qwen-image-plus",
	"qwen-image-edit-max",
	"qwen-image-edit-plus",
	"qwen-image-max-2025-12-30",
]);

function hasExplicitPricing(provider: Partial<ProviderModelMapping>): boolean {
	return (
		(provider.inputPrice ?? 0) > 0 ||
		(provider.outputPrice ?? 0) > 0 ||
		(provider.requestPrice ?? 0) > 0 ||
		(provider.pricingTiers?.length ?? 0) > 0 ||
		(provider.imageInputPrice ?? 0) > 0 ||
		(provider.imageOutputPrice ?? 0) > 0
	);
}

function applyOfficialProxyPricing(model: ModelDefinition): ModelDefinition {
	return {
		...model,
		providers: model.providers.map((provider) => {
			if (!provider.providerId.startsWith("kiwillm-")) {
				return provider;
			}
			if (hasExplicitPricing(provider)) {
				return provider;
			}

			const officialPricing = getOfficialProxyPricing(
				model.id,
				provider.modelName,
			);
			if (!hasExplicitPricing(officialPricing)) {
				return provider;
			}

			return {
				...provider,
				inputPrice: officialPricing.inputPrice ?? provider.inputPrice,
				outputPrice: officialPricing.outputPrice ?? provider.outputPrice,
				cachedInputPrice:
					officialPricing.cachedInputPrice ?? provider.cachedInputPrice,
				minCacheableTokens:
					officialPricing.minCacheableTokens ?? provider.minCacheableTokens,
				imageInputPrice:
					officialPricing.imageInputPrice ?? provider.imageInputPrice,
				imageOutputPrice:
					officialPricing.imageOutputPrice ?? provider.imageOutputPrice,
				imageOutputTokensByResolution:
					officialPricing.imageOutputTokensByResolution ??
					provider.imageOutputTokensByResolution,
				imageInputTokensByResolution:
					officialPricing.imageInputTokensByResolution ??
					provider.imageInputTokensByResolution,
				requestPrice: officialPricing.requestPrice ?? provider.requestPrice,
				discount: officialPricing.discount ?? provider.discount,
				pricingTiers: officialPricing.pricingTiers ?? provider.pricingTiers,
				webSearchPrice:
					officialPricing.webSearchPrice ?? provider.webSearchPrice,
			};
		}),
	};
}

export const models: ModelDefinition[] = [
	...[
		...baseModels,
		...chataiProxyModels,
		...completionsMeModels,
		...ishChatProxyModels,
		...literouterProxyModels,
		...freecfmodelsModels,
		...groqWorkerModels,
		...nvidiaWorkerModels,
		...openrouterAiHubModels,
		...svelteAiEnhancedModels,
		...swiftSoraVideoModels,
	].map((model) => {
		const chataiProviders = chataiProxyProviderAugments[model.id] ?? [];
		const completionsMeProviders =
			completionsMeProviderAugments[model.id] ?? [];
		const ishChatProxyProviders = ishChatProxyProviderAugments[model.id] ?? [];
		const literouterProviders = literouterProxyProviderAugments[model.id] ?? [];
		const freecfmodelsProviders = freecfmodelsProviderAugments[model.id] ?? [];
		const groqWorkerProviders = groqWorkerProviderAugments[model.id] ?? [];
		const nvidiaWorkerProviders = nvidiaWorkerProviderAugments[model.id] ?? [];
		const openrouterAiHubProviders =
			openrouterAiHubProviderAugments[model.id] ?? [];
		const svelteAiEnhancedProviders =
			svelteAiEnhancedProviderAugments[model.id] ?? [];
		if (
			chataiProviders.length === 0 &&
			completionsMeProviders.length === 0 &&
			ishChatProxyProviders.length === 0 &&
			literouterProviders.length === 0 &&
			freecfmodelsProviders.length === 0 &&
			groqWorkerProviders.length === 0 &&
			nvidiaWorkerProviders.length === 0 &&
			openrouterAiHubProviders.length === 0 &&
			svelteAiEnhancedProviders.length === 0
		) {
			return applyOfficialProxyPricing({
				...model,
				free:
					freeTierModelIds.has(model.id) ||
					("free" in model && model.free === true),
			});
		}
		return applyOfficialProxyPricing({
			...model,
			free:
				freeTierModelIds.has(model.id) ||
				("free" in model && model.free === true),
			providers: [
				...model.providers,
				...chataiProviders,
				...completionsMeProviders,
				...ishChatProxyProviders,
				...literouterProviders,
				...freecfmodelsProviders,
				...groqWorkerProviders,
				...nvidiaWorkerProviders,
				...openrouterAiHubProviders,
				...svelteAiEnhancedProviders,
			],
		});
	}),
];

const tierExcludedModelIds = new Set<string>(["auto", "custom"]);

const assignableModelIds = new Set<string>(
	models
		.map((model) => model.id)
		.filter((modelId) => !tierExcludedModelIds.has(modelId)),
);

export const starterTierModelIds = new Set<string>(
	[...assignableModelIds].filter(
		(modelId) =>
			(freeTierModelIds.has(modelId) || starterOnlyTierModelIds.has(modelId)) &&
			!payAsYouGoOnlyTierModelIds.has(modelId),
	),
);

export const proTierModelIds = new Set<string>([
	"baichuan2-13b-chat",
	"bielik-11b-v2.3-instruct",
	"bielik-11b-v2.6-instruct",
	"breeze-7b-instruct",
	"chatglm3-6b",
	"chatgpt-4o-latest",
	"claude-2",
	"claude-2.1",
	"claude-3-5-haiku",
	"claude-3-5-haiku-20241022",
	"claude-3-5-sonnet",
	"claude-3-5-sonnet-20240620",
	"claude-3-5-sonnet-20241022",
	"claude-3-5-sonnet-reasoning",
	"claude-3-7-sonnet",
	"claude-3-7-sonnet-20250219",
	"claude-3-haiku",
	"claude-3-haiku-20240307",
	"claude-3-opus",
	"claude-3-sonnet",
	"claude-3-sonnet-20240229",
	"claude-3.5-opus",
	"claude-3.5-sonnet",
	"claude-3.7-sonnet",
	"claude-4",
	"claude-4.5",
	"claude-haiku-4-5",
	"claude-haiku-4-5-20251001",
	"claude-haiku-4.5",
	"claude-instant",
	"claude-opus-4-1-20250805",
	"claude-opus-4-20250514",
	"claude-opus-4-5-20251101",
	"claude-opus-4-6",
	"claude-opus-4.6-fast",
	"claude-sonnet-4",
	"claude-sonnet-4-20250514",
	"claude-sonnet-4-5",
	"claude-sonnet-4-5-20250929",
	"claude-sonnet-4-6",
	"codestral-2508",
	"command-a",
	"command-r",
	"command-r-08-2024",
	"command-r-plus",
	"dbrx-instruct",
	"deepseek",
	"deepseek-33b",
	"deepseek-67b",
	"deepseek-chat",
	"deepseek-chat-v3-0324",
	"deepseek-coder",
	"deepseek-instruct",
	"deepseek-llm",
	"deepseek-math",
	"deepseek-moe",
	"deepseek-r1",
	"deepseek-r1-0528",
	"deepseek-r1-distill-llama-70b",
	"deepseek-r1-distill-llama-8b",
	"deepseek-reasoner",
	"deepseek-v2",
	"deepseek-v2.5",
	"deepseek-v3",
	"deepseek-v3-0324",
	"deepseek-v3.1",
	"deepseek-v3.1-terminus",
	"deepseek-v3.2",
	"deepseek-v3.2-exp",
	"deepseek-v3.5",
	"deepseek-vl",
	"devstral",
	"devstral-2-123b-instruct-2512",
	"devstral-2512",
	"devstral-small-2507",
	"dracarys-llama-3.1-70b-instruct",
	"ernie-4.5-21b-a3b-thinking",
	"eurollm-9b-instruct",
	"falcon3-7b-instruct",
	"gemini",
	"gemini-1.5-flash",
	"gemini-1.5-flash-8b",
	"gemini-1.5-pro",
	"gemini-2.0-flash",
	"gemini-2.0-flash-lite",
	"gemini-2.0-pro",
	"gemini-2.5-flash",
	"gemini-2.5-flash-image",
	"gemini-2.5-flash-image-preview",
	"gemini-2.5-flash-lite",
	"gemini-2.5-flash-lite-preview-09-2025",
	"gemini-2.5-flash-preview-04-17",
	"gemini-2.5-flash-preview-04-17-thinking",
	"gemini-2.5-flash-preview-05-20",
	"gemini-2.5-flash-preview-09-2025",
	"gemini-2.5-pro-preview-05-06",
	"gemini-3-flash",
	"gemini-3-flash-preview",
	"gemini-3-pro",
	"gemini-3.1-flash-image-preview",
	"gemini-3.1-flash-lite-preview",
	"gemini-advanced",
	"gemini-pro",
	"gemini-pro-vision",
	"gemini-ultra",
	"gemma",
	"gemma-2-27b-it-together",
	"gemma-2-2b-it",
	"gemma-2-9b-cpt-sahabatai-instruct",
	"gemma-2-9b-it",
	"gemma-2b",
	"gemma-3-12b",
	"gemma-3-12b-it",
	"gemma-3-1b-it",
	"gemma-3-27b",
	"gemma-3-27b-it",
	"gemma-3-4b-it",
	"gemma-3n-e2b-it",
	"gemma-3n-e4b-it",
	"gemma-4-31b-it",
	"gemma-7b",
	"gemma2-9b-it",
	"gliner-pii",
	"glm-4-32b-0414-128k",
	"glm-4.5",
	"glm-4.5-air",
	"glm-4.5-airx",
	"glm-4.5-flash",
	"glm-4.5-x",
	"glm-4.5v",
	"glm-4.6",
	"glm-4.6v",
	"glm-4.6v-flash",
	"glm-4.6v-flashx",
	"glm-4.7",
	"glm-4.7-flash",
	"glm-4.7-flashx",
	"glm4.7",
	"gpt",
	"gpt-3.5-turbo",
	"gpt-3.5-turbo-0125",
	"gpt-3.5-turbo-16k",
	"gpt-4",
	"gpt-4-32k",
	"gpt-4-mini",
	"gpt-4-nano",
	"gpt-4-plus",
	"gpt-4-turbo",
	"gpt-4-turbo-preview",
	"gpt-4-vision-preview",
	"gpt-4.1",
	"gpt-4.1-mini",
	"gpt-4.1-nano",
	"gpt-4o",
	"gpt-4o-mini",
	"gpt-4o-mini-search-preview",
	"gpt-4o-search-preview",
	"gpt-5-chat-latest",
	"gpt-5-mini",
	"gpt-5-nano",
	"gpt-5.1-codex",
	"gpt-5.1-codex-max",
	"gpt-5.1-codex-mini",
	"gpt-5.2-chat-latest",
	"gpt-5.2-codex",
	"gpt-5.2-high",
	"gpt-5.3-chat-latest",
	"gpt-5.3-codex",
	"gpt-5.4",
	"gpt-5.4-mini",
	"gpt-5.4-nano",
	"gpt-oss-120b",
	"gpt-oss-20b",
	"gpt-oss-safeguard-20b",
	"granite-guardian-3.0-8b",
	"grok",
	"grok-2",
	"grok-2-1212",
	"grok-2-vision-1212",
	"grok-3",
	"grok-3-fast",
	"grok-3-mini",
	"grok-3-mini-fast",
	"grok-4-0709",
	"grok-4-1-fast",
	"grok-4-1-fast-non-reasoning",
	"grok-4-1-fast-reasoning",
	"grok-4-20-beta-0309-non-reasoning",
	"grok-4-fast",
	"grok-4-fast-non-reasoning",
	"groq-compound",
	"groq-compound-mini",
	"hermes-2-pro-llama-3-8b",
	"hermes-3-llama-405b",
	"italia_10b_instruct_16k",
	"jamba-1.5-mini-instruct",
	"kat-coder-pro",
	"kimi-k2",
	"kimi-k2-instruct-0905",
	"kimi-k2.5",
	"l3-8b-lunaris",
	"l3-8b-stheno-v3.2",
	"l3.1-euryale-70b",
	"llama",
	"llama-2-7b",
	"llama-3-70b-instruct",
	"llama-3-8b",
	"llama-3-8b-awq",
	"llama-3-8b-instruct",
	"llama-3-meta",
	"llama-3-sonar-large-32k-online",
	"llama-3-sonar-small-32k-online",
	"llama-3-swallow-70b-instruct-v0.1",
	"llama-3-taiwan-70b-instruct",
	"llama-3.1",
	"llama-3.1-405b-instruct",
	"llama-3.1-70b-instruct",
	"llama-3.1-8b",
	"llama-3.1-8b-awq",
	"llama-3.1-8b-fp8",
	"llama-3.1-8b-instant",
	"llama-3.1-8b-instruct",
	"llama-3.1-8b-instruct-turbo",
	"llama-3.1-nemoguard-8b-content-safety",
	"llama-3.1-nemoguard-8b-topic-control",
	"llama-3.1-nemotron-70b-instruct",
	"llama-3.1-nemotron-70b-reward",
	"llama-3.1-nemotron-nano-8b-v1",
	"llama-3.1-nemotron-nano-vl-8b-v1",
	"llama-3.1-nemotron-safety-guard-8b-v3",
	"llama-3.1-nemotron-ultra-253b",
	"llama-3.1-nemotron-ultra-253b-v1",
	"llama-3.1-swallow-70b-instruct-v0.1",
	"llama-3.1-swallow-8b-instruct-v0.1",
	"llama-3.2",
	"llama-3.2-11b-instruct",
	"llama-3.2-11b-vision",
	"llama-3.2-11b-vision-instruct",
	"llama-3.2-1b",
	"llama-3.2-1b-instruct",
	"llama-3.2-3b",
	"llama-3.2-3b-instruct",
	"llama-3.2-90b-vision-instruct",
	"llama-3.3",
	"llama-3.3-70b-fp8",
	"llama-3.3-70b-instruct",
	"llama-3.3-70b-versatile",
	"llama-3.3-nemotron-super-49b-v1",
	"llama-3.3-nemotron-super-49b-v1.5",
	"llama-4-maverick",
	"llama-4-maverick-17b-128e-instruct",
	"llama-4-maverick-17b-instruct",
	"llama-4-scout",
	"llama-4-scout-17b-instruct",
	"llama-guard-3",
	"llama-guard-4-12b",
	"llama-prompt-guard-2-22m",
	"llama-prompt-guard-2-86m",
	"llama3-70b-instruct",
	"llama3-8b-instruct",
	"llama3-chatqa-1.5-8b",
	"magistral-small-2506",
	"mamba-codestral-7b-v0.1",
	"marin-8b-instruct",
	"mathstral-7b-v0.1",
	"mimo-v2-flash",
	"minimax-m1",
	"minimax-m2",
	"minimax-m2.1",
	"minimax-m2.1-lightning",
	"minimax-text-01",
	"ministral",
	"ministral-14b-2512",
	"ministral-14b-instruct-2512",
	"ministral-3b-2512",
	"ministral-8b-2512",
	"mistral-7b-instruct",
	"mistral-7b-instruct-together",
	"mistral-7b-instruct-v0.2",
	"mistral-7b-instruct-v0.3",
	"mistral-large",
	"mistral-large-2",
	"mistral-large-2512",
	"mistral-large-latest",
	"mistral-nemo",
	"mistral-nemotron",
	"mistral-small",
	"mistral-small-24b-instruct",
	"mistral-small-24b-instruct-2501",
	"mistral-small-2506",
	"mistral-small-3.1",
	"mistral-small-4-119b-2603",
	"mixtral-8x22b-instruct-v0.1",
	"mixtral-8x7b-instruct-together",
	"nemotron",
	"nemotron-120b",
	"nemotron-3-nano-30b-a3b",
	"nemotron-3-super-120b-a12b",
	"nemotron-4-mini-hindi-4b-instruct",
	"nemotron-content-safety-reasoning-4b",
	"nemotron-mini-4b-instruct",
	"nemotron-nano-12b-v2-vl",
	"nova-pro",
	"nvidia-nemotron-nano-9b-v2",
	"o1",
	"o1-mini",
	"o1-preview",
	"o3-mini",
	"o4-mini",
	"orpheus-arabic-saudi",
	"orpheus-v1-english",
	"oswe-vscode-prime",
	"oswe-vscode-secondary",
	"perplexity-pro",
	"phi-2",
	"phi-3-medium-128k-instruct",
	"phi-3-medium-4k-instruct",
	"phi-3-mini-128k-instruct",
	"phi-3-mini-4k-instruct",
	"phi-3-small-128k-instruct",
	"phi-3-small-8k-instruct",
	"phi-3.5-mini-instruct",
	"phi-3.5-vision-instruct",
	"phi-4",
	"phi-4-mini-flash-reasoning",
	"phi-4-mini-instruct",
	"phi-4-multimodal-instruct",
	"pixtral-large-latest",
	"qwen",
	"qwen-2.5-72b-instruct",
	"qwen-2.5-7b-instruct",
	"qwen-2.5-coder",
	"qwen-3-235b-a22b",
	"qwen-3-30b",
	"qwen-3-32b",
	"qwen-coder-plus",
	"qwen-flash",
	"qwen-max",
	"qwen-max-latest",
	"qwen-omni-turbo",
	"qwen-plus",
	"qwen-plus-latest",
	"qwen-qwq-32b",
	"qwen-turbo",
	"qwen-vl-max",
	"qwen-vl-plus",
	"qwen2-5-vl-32b-instruct",
	"qwen2-5-vl-72b-instruct",
	"qwen2-7b-instruct",
	"qwen2-vl-72b-instruct",
	"qwen2.5-7b-instruct",
	"qwen2.5-coder-32b-instruct",
	"qwen2.5-coder-7b-instruct",
	"qwen25-32b-instruct",
	"qwen25-72b-instruct",
	"qwen25-coder-7b",
	"qwen3-14b",
	"qwen3-235b-a22b-fp8",
	"qwen3-235b-a22b-instruct-2507",
	"qwen3-30b-a3b",
	"qwen3-30b-a3b-fp8",
	"qwen3-30b-a3b-instruct-2507",
	"qwen3-30b-a3b-thinking-2507",
	"qwen3-32b",
	"qwen3-32b-fp8",
	"qwen3-4b-fp8",
	"qwen3-coder",
	"qwen3-coder-30b-a3b-instruct",
	"qwen3-coder-flash",
	"qwen3-coder-plus",
	"qwen3-next-80b-a3b-instruct",
	"qwen3-thinking-2507",
	"qwen3-vl-235b-a22b-instruct",
	"qwen3-vl-30b-a3b-instruct",
	"qwen3-vl-30b-a3b-thinking",
	"qwen3-vl-8b-instruct",
	"qwen3-vl-flash",
	"qwen3-vl-plus",
	"qwen3.5",
	"qwq-32b",
	"qwq-plus",
	"rakutenai-7b-chat",
	"rakutenai-7b-instruct",
	"reka-core",
	"riva-translate-4b-instruct-v1.1",
	"rocinante-12b",
	"sarvam-m",
	"seed-1-6-250615",
	"seed-1-6-250915",
	"seed-1-6-flash-250715",
	"seed-1-8-251228",
	"shieldgemma-9b",
	"solar-10.7b-instruct",
	"sonar",
	"sonar-pro",
	"step-3.5-flash",
	"stockmark-2-100b-instruct",
	"teuken-7b-instruct-commercial-v0.4",
	"trinity",
	"trinity-large-preview",
	"una-cybertron",
	"whisper-large-v3",
	"whisper-large-v3-turbo",
	"wizardlm-2-8x22b",
]);
