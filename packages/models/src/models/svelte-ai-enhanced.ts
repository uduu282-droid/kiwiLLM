import { getOfficialProxyPricing } from "./official-proxy-pricing.js";

import type { ModelDefinition, ProviderModelMapping } from "@/models.js";

const svelteAiEnhancedProviderId = "kiwillm-svelte-ai-enhanced" as const;

function createProxyMapping(
	pricingId: string,
	modelName: string,
	overrides: Partial<ProviderModelMapping> = {},
): ProviderModelMapping {
	const officialPricing = getOfficialProxyPricing(pricingId, modelName);

	return {
		test: "skip",
		providerId: svelteAiEnhancedProviderId,
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
		contextSize: 200000,
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
	modelName: string,
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
		providers: [createProxyMapping(id, modelName, mappingOverrides)],
	};
}

function formatModelName(id: string): string {
	return id
		.replace(/[/.]/g, " ")
		.split(/[\s-]+/)
		.filter(Boolean)
		.map((part) => {
			const lower = part.toLowerCase();
			switch (lower) {
				case "gpt":
					return "GPT";
				case "o1":
					return "o1";
				case "o3":
					return "o3";
				case "qwen":
					return "Qwen";
				case "claude":
					return "Claude";
				case "gemini":
					return "Gemini";
				case "gemma":
					return "Gemma";
				case "llama":
					return "Llama";
				case "grok":
					return "Grok";
				case "phi":
					return "Phi";
				case "dbrx":
					return "DBRX";
				case "nova":
					return "Nova";
				case "reka":
					return "Reka";
				case "mistral":
					return "Mistral";
				case "command":
					return "Command";
				case "sonar":
					return "Sonar";
				default:
					if (/^\d/.test(part)) {
						return part;
					}
					return part.charAt(0).toUpperCase() + part.slice(1);
			}
		})
		.join(" ");
}

const svelteExistingMappings: Array<
	readonly [string, string, Partial<ProviderModelMapping> | undefined]
> = [
	["claude-3-haiku", "anthropic/claude-3-haiku", { maxOutput: 8192 }],
	["claude-3-opus", "anthropic/claude-3-opus", { reasoning: true }],
	["claude-sonnet-4", "anthropic/claude-sonnet-4", { reasoning: true }],
	["deepseek-chat", "deepseek/deepseek-chat", undefined],
	["deepseek-coder", "deepseek/deepseek-coder", undefined],
	[
		"gemini-3-pro-preview",
		"google/gemini-3-pro-preview",
		{
			reasoning: true,
			vision: true,
			webSearch: true,
			maxOutput: 65536,
			contextSize: 1048576,
		},
	],
	[
		"gemini-3.1-pro-preview",
		"google/gemini-3.1-pro-preview",
		{
			reasoning: true,
			vision: true,
			webSearch: true,
			maxOutput: 65536,
			contextSize: 1048576,
		},
	],
	["gemma-3-12b-it", "google/gemma-3-12b-it", { contextSize: 131072 }],
	["gemma-3-4b-it", "google/gemma-3-4b-it", { contextSize: 131072 }],
	["llama-3-70b-instruct", "meta-llama/llama-3-70b-instruct", undefined],
	["llama-3-8b-instruct", "meta-llama/llama-3-8b-instruct", undefined],
	["llama-3.1-70b-instruct", "meta-llama/llama-3.1-70b-instruct", undefined],
	["llama-3.1-8b-instruct", "meta-llama/llama-3.1-8b-instruct", undefined],
	["llama-3.2-11b-instruct", "meta-llama/llama-3.2-11b-instruct", undefined],
	["llama-3.2-3b-instruct", "meta-llama/llama-3.2-3b-instruct", undefined],
	["llama-3.3-70b-instruct", "meta-llama/llama-3.3-70b-instruct", undefined],
	["llama-4-scout", "meta-llama/llama-4-scout", undefined],
	["llama-guard-3-8b", "meta-llama/llama-guard-3-8b", undefined],
	["gpt-3.5-turbo", "openai/gpt-3.5-turbo", undefined],
	["gpt-3.5-turbo-16k", "openai/gpt-3.5-turbo-16k", undefined],
	["gpt-4", "openai/gpt-4", undefined],
	["gpt-4o", "openai/gpt-4o", { vision: true }],
	["gpt-4o-mini", "openai/gpt-4o-mini", { vision: true }],
	[
		"gpt-5",
		"openai/gpt-5",
		{
			reasoning: true,
			vision: true,
			webSearch: true,
			maxOutput: 128000,
			contextSize: 400000,
		},
	],
	[
		"gpt-5.1",
		"openai/gpt-5.1",
		{
			reasoning: true,
			vision: true,
			webSearch: true,
			maxOutput: 128000,
			contextSize: 400000,
		},
	],
	[
		"gpt-5.2",
		"openai/gpt-5.2",
		{
			reasoning: true,
			vision: true,
			webSearch: true,
			maxOutput: 128000,
			contextSize: 400000,
		},
	],
	["o1-mini", "openai/o1-mini", { reasoning: true }],
	["o3-mini", "openai/o3-mini", { reasoning: true }],
	["grok-3", "xai/grok-3", { reasoning: true, vision: true }],
];

interface NewProxySpec {
	id: string;
	family: ModelDefinition["family"];
	modelName: string;
	mapping?: Partial<ProviderModelMapping>;
}

const svelteNewProxySpecs: NewProxySpec[] = [
	{
		id: "qwen-2.5-72b-instruct",
		family: "alibaba",
		modelName: "qwen/qwen-2.5-72b-instruct",
	},
	{
		id: "qwen-2.5-7b-instruct",
		family: "alibaba",
		modelName: "qwen/qwen-2.5-7b-instruct",
	},
	{
		id: "qwen-3-235b-a22b",
		family: "alibaba",
		modelName: "qwen/qwen-3-235b-a22b",
		mapping: { reasoning: true },
	},
	{
		id: "qwen-3-32b",
		family: "alibaba",
		modelName: "qwen/qwen-3-32b",
		mapping: { reasoning: true },
	},
	{ id: "nova-pro", family: "amazon", modelName: "amazon/nova-pro" },
	{
		id: "claude-3-sonnet",
		family: "anthropic",
		modelName: "anthropic/claude-3-sonnet",
	},
	{
		id: "claude-3.5-sonnet",
		family: "anthropic",
		modelName: "anthropic/claude-3.5-sonnet",
		mapping: { reasoning: true },
	},
	{
		id: "claude-4",
		family: "anthropic",
		modelName: "anthropic/claude-4",
		mapping: { reasoning: true },
	},
	{
		id: "claude-4.5",
		family: "anthropic",
		modelName: "anthropic/claude-4.5",
		mapping: { reasoning: true },
	},
	{
		id: "claude-sonnet-4.5",
		family: "anthropic",
		modelName: "anthropic/claude-sonnet-4.5",
		mapping: { reasoning: true },
	},
	{
		id: "claude-sonnet-4.6",
		family: "anthropic",
		modelName: "anthropic/claude-sonnet-4.6",
		mapping: { reasoning: true },
	},
	{ id: "command-a", family: "cohere", modelName: "cohere/command-a" },
	{ id: "command-r", family: "cohere", modelName: "cohere/command-r" },
	{
		id: "command-r-08-2024",
		family: "cohere",
		modelName: "cohere/command-r-08-2024",
	},
	{
		id: "command-r-plus",
		family: "cohere",
		modelName: "cohere/command-r-plus",
	},
	{
		id: "dbrx-instruct",
		family: "databricks",
		modelName: "databricks/dbrx-instruct",
	},
	{
		id: "deepseek-v3.5",
		family: "deepseek",
		modelName: "deepseek/deepseek-v3.5",
		mapping: { reasoning: true },
	},
	{ id: "gemini-pro", family: "google", modelName: "google/gemini-pro" },
	{
		id: "gemini-pro-vision",
		family: "google",
		modelName: "google/gemini-pro-vision",
		mapping: { vision: true },
	},
	{
		id: "gemma-2-9b-it",
		family: "google",
		modelName: "google/gemma-2-9b-it",
		mapping: { contextSize: 8192 },
	},
	{
		id: "llama-3.2-11b-vision-instruct",
		family: "meta",
		modelName: "meta-llama/llama-3.2-11b-vision-instruct",
		mapping: { vision: true },
	},
	{
		id: "llama-3.2-1b-instruct",
		family: "meta",
		modelName: "meta-llama/llama-3.2-1b-instruct",
	},
	{
		id: "llama-4-maverick",
		family: "meta",
		modelName: "meta-llama/llama-4-maverick",
	},
	{ id: "phi-4", family: "microsoft", modelName: "microsoft/phi-4" },
	{
		id: "wizardlm-2-8x22b",
		family: "microsoft",
		modelName: "microsoft/wizardlm-2-8x22b",
	},
	{
		id: "mistral-nemo",
		family: "mistral",
		modelName: "mistralai/mistral-nemo",
	},
	{
		id: "mistral-small-24b-instruct-2501",
		family: "mistral",
		modelName: "mistralai/mistral-small-24b-instruct-2501",
	},
	{
		id: "mistral-7b-instruct",
		family: "mistral",
		modelName: "mistralai/mistral-7b-instruct",
	},
	{
		id: "mistral-large",
		family: "mistral",
		modelName: "mistralai/mistral-large",
	},
	{
		id: "mistral-large-2",
		family: "mistral",
		modelName: "mistralai/mistral-large-2",
	},
	{
		id: "mistral-small",
		family: "mistral",
		modelName: "mistralai/mistral-small",
	},
	{
		id: "llama-3.1-nemotron-70b-instruct",
		family: "nvidia",
		modelName: "nvidia/llama-3.1-nemotron-70b-instruct",
	},
	{
		id: "llama-3-sonar-large-32k-online",
		family: "perplexity",
		modelName: "perplexity/llama-3-sonar-large-32k-online",
		mapping: { webSearch: true },
	},
	{
		id: "llama-3-sonar-small-32k-online",
		family: "perplexity",
		modelName: "perplexity/llama-3-sonar-small-32k-online",
		mapping: { webSearch: true },
	},
	{ id: "reka-core", family: "reka", modelName: "rekaai/reka-core" },
	{
		id: "l3.1-euryale-70b",
		family: "sao10k",
		modelName: "sao10k/l3.1-euryale-70b",
	},
	{
		id: "rocinante-12b",
		family: "thedrummer",
		modelName: "thedrummer/rocinante-12b",
	},
	{
		id: "grok-2",
		family: "xai",
		modelName: "xai/grok-2",
		mapping: { vision: true },
	},
];

export const svelteAiEnhancedProviderAugments: Record<
	string,
	ProviderModelMapping[]
> = Object.fromEntries(
	svelteExistingMappings.map(([id, modelName, mappingOverrides]) => [
		id,
		[createProxyMapping(id, modelName, mappingOverrides ?? {})],
	]),
);

export const svelteAiEnhancedModels = svelteNewProxySpecs.map((spec) =>
	createProxyModel(
		spec.id,
		spec.family,
		spec.modelName,
		{
			name: formatModelName(spec.id),
			description: `${formatModelName(spec.id)} exposed by the Svelte AI Enhanced KiwiLLM worker.`,
		},
		spec.mapping,
	),
);
