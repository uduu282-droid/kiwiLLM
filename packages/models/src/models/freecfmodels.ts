import { getOfficialProxyPricing } from "./official-proxy-pricing.js";

import type { ModelDefinition, ProviderModelMapping } from "@/models.js";

const freecfmodelsProviderId = "kiwillm-freecfmodels" as const;

function createProxyMapping(
	modelName: string,
	overrides: Partial<ProviderModelMapping> = {},
): ProviderModelMapping {
	const officialPricing = getOfficialProxyPricing(modelName, modelName);

	return {
		test: "skip",
		providerId: freecfmodelsProviderId,
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
		contextSize: 131072,
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

export const freecfmodelsProviderAugments: Record<
	string,
	ProviderModelMapping[]
> = {
	"llama-4-scout": [
		createProxyMapping("llama-4-scout", {
			vision: true,
		}),
	],
	"kimi-k2.5": [
		createProxyMapping("kimi-k2.5", {
			contextSize: 262144,
			vision: true,
			reasoning: true,
		}),
	],
	"gpt-oss-20b": [
		createProxyMapping("gpt-oss-20b", {
			reasoning: true,
		}),
	],
	"gpt-oss-120b": [
		createProxyMapping("gpt-oss-120b", {
			reasoning: true,
		}),
	],
};

export const freecfmodelsModels = [
	createProxyModel("llama-3.2-1b", "meta", {
		name: "Llama 3.2 1B",
		description: "Llama 3.2 1B exposed by the Free CF Models worker.",
	}),
	createProxyModel("llama-3.2-3b", "meta", {
		name: "Llama 3.2 3B",
		description: "Llama 3.2 3B exposed by the Free CF Models worker.",
	}),
	createProxyModel("llama-3.1-8b", "meta", {
		name: "Llama 3.1 8B",
		description: "Llama 3.1 8B exposed by the Free CF Models worker.",
	}),
	createProxyModel("llama-3.1-8b-awq", "meta", {
		name: "Llama 3.1 8B AWQ",
		description: "Llama 3.1 8B AWQ exposed by the Free CF Models worker.",
	}),
	createProxyModel("llama-3.1-8b-fp8", "meta", {
		name: "Llama 3.1 8B FP8",
		description: "Llama 3.1 8B FP8 exposed by the Free CF Models worker.",
	}),
	createProxyModel(
		"llama-3.2-11b-vision",
		"meta",
		{
			name: "Llama 3.2 11B Vision",
			description: "Llama 3.2 11B Vision exposed by the Free CF Models worker.",
		},
		{
			vision: true,
		},
	),
	createProxyModel("llama-3.3-70b-fp8", "meta", {
		name: "Llama 3.3 70B FP8",
		description: "Llama 3.3 70B FP8 exposed by the Free CF Models worker.",
	}),
	createProxyModel("llama-3-8b", "meta", {
		name: "Llama 3 8B",
		description: "Llama 3 8B exposed by the Free CF Models worker.",
	}),
	createProxyModel("llama-3-8b-awq", "meta", {
		name: "Llama 3 8B AWQ",
		description: "Llama 3 8B AWQ exposed by the Free CF Models worker.",
	}),
	createProxyModel("llama-3-meta", "meta", {
		name: "Llama 3 Meta",
		description: "Llama 3 Meta exposed by the Free CF Models worker.",
	}),
	createProxyModel("llama-2-7b", "meta", {
		name: "Llama 2 7B",
		description: "Llama 2 7B exposed by the Free CF Models worker.",
	}),
	createProxyModel(
		"llama-guard-3",
		"meta",
		{
			name: "Llama Guard 3",
			description: "Llama Guard 3 exposed by the Free CF Models worker.",
		},
		{
			tools: false,
		},
	),
	createProxyModel(
		"qwq-32b",
		"alibaba",
		{
			name: "QwQ 32B",
			description: "QwQ 32B exposed by the Free CF Models worker.",
		},
		{
			reasoning: true,
		},
	),
	createProxyModel(
		"qwen-3-30b",
		"alibaba",
		{
			name: "Qwen 3 30B",
			description: "Qwen 3 30B exposed by the Free CF Models worker.",
		},
		{
			reasoning: true,
		},
	),
	createProxyModel(
		"qwen-2.5-coder",
		"alibaba",
		{
			name: "Qwen 2.5 Coder",
			description: "Qwen 2.5 Coder exposed by the Free CF Models worker.",
		},
		{
			reasoning: true,
		},
	),
	createProxyModel("gemma-3-12b", "google", {
		name: "Gemma 3 12B",
		description: "Gemma 3 12B exposed by the Free CF Models worker.",
	}),
	createProxyModel("gemma-2b", "google", {
		name: "Gemma 2B",
		description: "Gemma 2B exposed by the Free CF Models worker.",
	}),
	createProxyModel("nemotron-120b", "nvidia", {
		name: "Nemotron 120B",
		description: "Nemotron 120B exposed by the Free CF Models worker.",
	}),
	createProxyModel("phi-2", "microsoft", {
		name: "Phi 2",
		description: "Phi 2 exposed by the Free CF Models worker.",
	}),
	createProxyModel("una-cybertron", "openrouter", {
		name: "Una Cybertron",
		description: "Una Cybertron exposed by the Free CF Models worker.",
	}),
	createProxyModel("llama", "meta", {
		name: "Llama",
		description: "Llama exposed by the Free CF Models worker.",
	}),
	createProxyModel(
		"flux-1-schnell",
		"black-forest-labs",
		{
			name: "FLUX.1 Schnell",
			description:
				"FLUX.1 Schnell image generation exposed by the Free CF Models worker.",
			output: ["image"],
		},
		{
			streaming: false,
			tools: false,
			jsonOutput: false,
			imageGenerations: true,
		},
	),
	createProxyModel(
		"stable-diffusion-xl",
		"stability",
		{
			name: "Stable Diffusion XL",
			description:
				"Stable Diffusion XL image generation exposed by the Free CF Models worker.",
			output: ["image"],
		},
		{
			streaming: false,
			tools: false,
			jsonOutput: false,
			imageGenerations: true,
		},
	),
] as const satisfies ModelDefinition[];
