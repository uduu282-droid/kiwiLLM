import type { ModelDefinition, ProviderModelMapping } from "@/models.js";

const openrouterAiHubProviderId = "kiwillm-openrouter-ai-hub" as const;

function createProxyMapping(
	modelName: string,
	overrides: Partial<ProviderModelMapping> = {},
): ProviderModelMapping {
	return {
		test: "skip",
		providerId: openrouterAiHubProviderId,
		modelName,
		inputPrice: 0,
		outputPrice: 0,
		requestPrice: 0,
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
		providers: [createProxyMapping(modelName, mappingOverrides)],
	};
}

export const openrouterAiHubProviderAugments: Record<
	string,
	ProviderModelMapping[]
> = {
	"gpt-4o-mini": [
		createProxyMapping("openai/gpt-4o-mini", {
			contextSize: 128000,
			vision: true,
		}),
	],
	"gpt-3.5-turbo": [createProxyMapping("openai/gpt-3.5-turbo")],
	"gpt-oss-20b": [
		createProxyMapping("openai/gpt-oss-20b", {
			reasoning: true,
		}),
	],
	"claude-3-5-haiku": [
		createProxyMapping("anthropic/claude-3.5-haiku", {
			contextSize: 200000,
			maxOutput: 8192,
		}),
	],
};

export const openrouterAiHubModels = [
	createProxyModel(
		"qwen-2.5-7b-instruct",
		"alibaba",
		"qwen/qwen-2.5-7b-instruct",
		{
			name: "Qwen 2.5 7B Instruct",
			description:
				"Qwen 2.5 7B Instruct exposed by the OpenRouter AI Hub KiwiLLM worker.",
		},
	),
	createProxyModel(
		"qwen-2.5-72b-instruct",
		"alibaba",
		"qwen/qwen-2.5-72b-instruct",
		{
			name: "Qwen 2.5 72B Instruct",
			description:
				"Qwen 2.5 72B Instruct exposed by the OpenRouter AI Hub KiwiLLM worker.",
		},
	),
	createProxyModel("phi-4", "microsoft", "microsoft/phi-4", {
		name: "Phi-4",
		description: "Phi-4 exposed by the OpenRouter AI Hub KiwiLLM worker.",
	}),
] as const satisfies ModelDefinition[];
