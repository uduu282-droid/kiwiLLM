import type { ModelDefinition, ProviderModelMapping } from "@/models.js";

const groqWorkerProviderId = "kiwillm-groq-worker" as const;

function createProxyMapping(
	modelName: string,
	overrides: Partial<ProviderModelMapping> = {},
): ProviderModelMapping {
	return {
		test: "skip",
		providerId: groqWorkerProviderId,
		modelName,
		inputPrice: 0,
		outputPrice: 0,
		requestPrice: 0,
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

export const groqWorkerProviderAugments: Record<
	string,
	ProviderModelMapping[]
> = {
	"llama-2-7b": [createProxyMapping("llama-2-7b", { tools: false })],
	"kimi-k2": [
		createProxyMapping("moonshotai/kimi-k2-instruct", {
			contextSize: 131072,
		}),
	],
	"gpt-oss-120b": [
		createProxyMapping("openai/gpt-oss-120b", {
			reasoning: true,
		}),
	],
	"gpt-oss-20b": [
		createProxyMapping("openai/gpt-oss-20b", {
			reasoning: true,
		}),
	],
	"qwen3-32b": [
		createProxyMapping("qwen/qwen3-32b", {
			reasoning: true,
			contextSize: 32768,
		}),
	],
	"llama-4-scout-17b-instruct": [
		createProxyMapping("meta-llama/llama-4-scout-17b-16e-instruct", {
			vision: true,
			contextSize: 32768,
		}),
	],
};

export const groqWorkerModels = [
	createProxyModel(
		"orpheus-arabic-saudi",
		"canopylabs",
		"canopylabs/orpheus-arabic-saudi",
		{
			name: "Orpheus Arabic Saudi",
			description:
				"Canopylabs Orpheus Arabic Saudi exposed by the Groq KiwiLLM worker.",
		},
	),
	createProxyModel(
		"orpheus-v1-english",
		"canopylabs",
		"canopylabs/orpheus-v1-english",
		{
			name: "Orpheus V1 English",
			description:
				"Canopylabs Orpheus English exposed by the Groq KiwiLLM worker.",
		},
	),
	createProxyModel(
		"groq-compound",
		"groq",
		"groq/compound",
		{
			name: "Groq Compound",
			description: "Groq Compound exposed by the Groq KiwiLLM worker.",
		},
		{
			reasoning: true,
		},
	),
	createProxyModel(
		"groq-compound-mini",
		"groq",
		"groq/compound-mini",
		{
			name: "Groq Compound Mini",
			description: "Groq Compound Mini exposed by the Groq KiwiLLM worker.",
		},
		{
			reasoning: true,
			contextSize: 4096,
		},
	),
	createProxyModel("llama-3.1-8b-instant", "meta", "llama-3.1-8b-instant", {
		name: "Llama 3.1 8B Instant",
		description: "Llama 3.1 8B Instant exposed by the Groq KiwiLLM worker.",
	}),
	createProxyModel(
		"llama-3.3-70b-versatile",
		"meta",
		"llama-3.3-70b-versatile",
		{
			name: "Llama 3.3 70B Versatile",
			description:
				"Llama 3.3 70B Versatile exposed by the Groq KiwiLLM worker.",
		},
	),
	createProxyModel(
		"llama-prompt-guard-2-22m",
		"meta",
		"meta-llama/llama-prompt-guard-2-22m",
		{
			name: "Llama Prompt Guard 2 22M",
			description: "Prompt Guard 22M exposed by the Groq KiwiLLM worker.",
		},
		{
			contextSize: 512,
			tools: false,
			jsonOutput: false,
			jsonOutputSchema: false,
		},
	),
	createProxyModel(
		"llama-prompt-guard-2-86m",
		"meta",
		"meta-llama/llama-prompt-guard-2-86m",
		{
			name: "Llama Prompt Guard 2 86M",
			description: "Prompt Guard 86M exposed by the Groq KiwiLLM worker.",
		},
		{
			contextSize: 512,
			tools: false,
			jsonOutput: false,
			jsonOutputSchema: false,
		},
	),
	createProxyModel(
		"gpt-oss-safeguard-20b",
		"openai",
		"openai/gpt-oss-safeguard-20b",
		{
			name: "GPT OSS Safeguard 20B",
			description: "GPT OSS Safeguard 20B exposed by the Groq KiwiLLM worker.",
		},
		{
			tools: false,
			jsonOutput: false,
			jsonOutputSchema: false,
		},
	),
] as const satisfies ModelDefinition[];
