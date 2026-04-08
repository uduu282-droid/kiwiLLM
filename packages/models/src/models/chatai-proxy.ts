import { getOfficialProxyPricing } from "./official-proxy-pricing.js";

import type { ModelDefinition, ProviderModelMapping } from "@/models.js";

const chataiProxyProviderId = "kiwillm-chatai-proxy" as const;

function createProxyMapping(
	modelName: string,
	overrides: Partial<ProviderModelMapping> = {},
): ProviderModelMapping {
	const officialPricing = getOfficialProxyPricing(modelName, modelName);

	return {
		test: "skip",
		providerId: chataiProxyProviderId,
		modelName,
		inputPrice: officialPricing.inputPrice ?? 0,
		outputPrice: officialPricing.outputPrice ?? 0,
		cachedInputPrice: officialPricing.cachedInputPrice,
		minCacheableTokens: officialPricing.minCacheableTokens,
		imageInputPrice: officialPricing.imageInputPrice,
		imageOutputPrice: officialPricing.imageOutputPrice,
		imageOutputTokensByResolution:
			officialPricing.imageOutputTokensByResolution,
		imageInputTokensByResolution: officialPricing.imageInputTokensByResolution,
		requestPrice: officialPricing.requestPrice ?? 0,
		discount: officialPricing.discount,
		pricingTiers: officialPricing.pricingTiers,
		webSearchPrice: officialPricing.webSearchPrice,
		contextSize: 128000,
		maxOutput: 16384,
		streaming: true,
		vision: false,
		tools: true,
		jsonOutput: true,
		jsonOutputSchema: true,
		...overrides,
	};
}

function createProxyModel(
	id: string,
	family: ModelDefinition["family"],
	overrides: Partial<ModelDefinition> = {},
	mappingOverrides: Partial<ProviderModelMapping> = {},
): ModelDefinition {
	return {
		id,
		name: overrides.name,
		description: overrides.description,
		family,
		releasedAt: overrides.releasedAt,
		aliases: overrides.aliases,
		free: overrides.free,
		rateLimitKind: overrides.rateLimitKind,
		output: overrides.output,
		imageInputRequired: overrides.imageInputRequired,
		stability: overrides.stability,
		supportsSystemRole: overrides.supportsSystemRole,
		providers: [createProxyMapping(id, mappingOverrides)],
	};
}

export const chataiProxyProviderAugments: Record<
	string,
	ProviderModelMapping[]
> = {
	"gpt-5.2": [
		createProxyMapping("gpt-5.2", {
			contextSize: 400000,
			maxOutput: 128000,
			vision: true,
			reasoning: true,
			webSearch: true,
		}),
	],
	"gpt-5.1": [
		createProxyMapping("gpt-5.1", {
			contextSize: 400000,
			maxOutput: 128000,
			vision: true,
			reasoning: true,
			webSearch: true,
		}),
	],
	"gpt-4o": [
		createProxyMapping("gpt-4o", {
			vision: true,
			webSearch: true,
		}),
	],
	"gpt-4-turbo": [
		createProxyMapping("gpt-4-turbo", {
			vision: true,
		}),
	],
	"o4-mini": [
		createProxyMapping("o4-mini", {
			contextSize: 200000,
			reasoning: true,
			vision: true,
		}),
	],
	"claude-3-haiku": [
		createProxyMapping("claude-3-haiku", {
			contextSize: 200000,
			vision: true,
		}),
	],
	"gemini-2.5-pro": [
		createProxyMapping("gemini-2.5-pro", {
			contextSize: 1048576,
			maxOutput: 65536,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gemini-2.5-flash": [
		createProxyMapping("gemini-2.5-flash", {
			contextSize: 1048576,
			maxOutput: 65536,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gemini-2.0-flash": [
		createProxyMapping("gemini-2.0-flash", {
			contextSize: 1048576,
			vision: true,
		}),
	],
	"llama-4-scout": [
		createProxyMapping("llama-4-scout", {
			contextSize: 131072,
		}),
	],
	"qwen3-max": [
		createProxyMapping("qwen3-max", {
			contextSize: 256000,
			maxOutput: 32800,
			reasoning: true,
			vision: true,
		}),
	],
	"deepseek-v3.2": [
		createProxyMapping("deepseek-v3.2", {
			contextSize: 163840,
			vision: true,
		}),
	],
	"kimi-k2": [
		createProxyMapping("kimi-k2", {
			contextSize: 131072,
		}),
	],
};

export const chataiProxyModels = [
	createProxyModel(
		"gpt-5.2-high",
		"openai",
		{
			name: "GPT-5.2 High",
			description:
				"High-reasoning GPT-5.2 variant exposed by the ChatAI proxy.",
		},
		{
			contextSize: 400000,
			maxOutput: 128000,
			reasoning: true,
			vision: true,
			webSearch: true,
		},
	),
	createProxyModel(
		"gpt-4-plus",
		"openai",
		{
			name: "GPT-4 Plus",
			description: "GPT-4 Plus exposed by the ChatAI proxy.",
		},
		{
			vision: true,
		},
	),
	createProxyModel(
		"gpt-4-mini",
		"openai",
		{
			name: "GPT-4 Mini",
			description: "Compact GPT-4 variant exposed by the ChatAI proxy.",
		},
		{
			vision: true,
		},
	),
	createProxyModel("gpt-4-nano", "openai", {
		name: "GPT-4 Nano",
		description: "Small GPT-4 variant exposed by the ChatAI proxy.",
	}),
	createProxyModel(
		"o4-mini-deep-research",
		"openai",
		{
			name: "o4 Mini Deep Research",
			description:
				"Research-tuned o4-mini variant exposed by the ChatAI proxy.",
		},
		{
			contextSize: 200000,
			reasoning: true,
			vision: true,
			webSearch: true,
		},
	),
	createProxyModel(
		"claude-4-opus",
		"anthropic",
		{
			name: "Claude 4 Opus",
			description: "Claude 4 Opus exposed by the ChatAI proxy.",
		},
		{
			contextSize: 200000,
			vision: true,
		},
	),
	createProxyModel(
		"claude-4-sonnet",
		"anthropic",
		{
			name: "Claude 4 Sonnet",
			description: "Claude 4 Sonnet exposed by the ChatAI proxy.",
		},
		{
			contextSize: 200000,
			vision: true,
		},
	),
	createProxyModel(
		"claude-3.5-opus",
		"anthropic",
		{
			name: "Claude 3.5 Opus",
			description: "Claude 3.5 Opus exposed by the ChatAI proxy.",
		},
		{
			contextSize: 200000,
			vision: true,
		},
	),
	createProxyModel(
		"claude-3.5-sonnet",
		"anthropic",
		{
			name: "Claude 3.5 Sonnet",
			description: "Claude 3.5 Sonnet exposed by the ChatAI proxy.",
		},
		{
			contextSize: 200000,
			vision: true,
		},
	),
	createProxyModel(
		"claude-3.7-sonnet",
		"anthropic",
		{
			name: "Claude 3.7 Sonnet",
			description: "Claude 3.7 Sonnet exposed by the ChatAI proxy.",
		},
		{
			contextSize: 200000,
			vision: true,
		},
	),
	createProxyModel(
		"gemini-2.0-pro",
		"google",
		{
			name: "Gemini 2.0 Pro",
			description: "Gemini 2.0 Pro exposed by the ChatAI proxy.",
		},
		{
			contextSize: 1048576,
			vision: true,
			tools: true,
		},
	),
	createProxyModel(
		"gemini-advanced",
		"google",
		{
			name: "Gemini Advanced",
			description: "Gemini Advanced exposed by the ChatAI proxy.",
		},
		{
			contextSize: 1048576,
			vision: true,
			tools: true,
		},
	),
	createProxyModel(
		"gemini-ultra",
		"google",
		{
			name: "Gemini Ultra",
			description: "Gemini Ultra exposed by the ChatAI proxy.",
		},
		{
			contextSize: 1048576,
			vision: true,
			tools: true,
		},
	),
	createProxyModel("llama-4-maverick", "meta", {
		name: "Llama 4 Maverick",
		description: "Llama 4 Maverick exposed by the ChatAI proxy.",
	}),
	createProxyModel("llama-3.3", "meta", {
		name: "Llama 3.3",
		description: "Llama 3.3 exposed by the ChatAI proxy.",
	}),
	createProxyModel("llama-3.2", "meta", {
		name: "Llama 3.2",
		description: "Llama 3.2 exposed by the ChatAI proxy.",
	}),
	createProxyModel("llama-3.1", "meta", {
		name: "Llama 3.1",
		description: "Llama 3.1 exposed by the ChatAI proxy.",
	}),
	createProxyModel(
		"llama-guard-3",
		"meta",
		{
			name: "Llama Guard 3",
			description: "Llama Guard 3 exposed by the ChatAI proxy.",
		},
		{
			tools: false,
		},
	),
	createProxyModel(
		"qwen3-thinking-2507",
		"alibaba",
		{
			name: "Qwen3 Thinking 2507",
			description: "Qwen3 Thinking 2507 exposed by the ChatAI proxy.",
		},
		{
			reasoning: true,
		},
	),
	createProxyModel("qwen3.5", "alibaba", {
		name: "Qwen3.5",
		description: "Qwen3.5 exposed by the ChatAI proxy.",
	}),
	createProxyModel("qwen3.5-plus", "alibaba", {
		name: "Qwen3.5 Plus",
		description: "Qwen3.5 Plus exposed by the ChatAI proxy.",
	}),
	createProxyModel("deepseek", "deepseek", {
		name: "DeepSeek",
		description: "DeepSeek exposed by the ChatAI proxy.",
	}),
	createProxyModel("mistral-small-3.1", "mistral", {
		name: "Mistral Small 3.1",
		description: "Mistral Small 3.1 exposed by the ChatAI proxy.",
	}),
	createProxyModel("mistral-large", "mistral", {
		name: "Mistral Large",
		description: "Mistral Large exposed by the ChatAI proxy.",
	}),
	createProxyModel("grok", "xai", {
		name: "Grok",
		description: "Grok exposed by the ChatAI proxy.",
	}),
	createProxyModel(
		"perplexity-pro",
		"perplexity",
		{
			name: "Perplexity Pro",
			description: "Perplexity Pro exposed by the ChatAI proxy.",
		},
		{
			tools: false,
			webSearch: true,
		},
	),
] as const satisfies ModelDefinition[];
