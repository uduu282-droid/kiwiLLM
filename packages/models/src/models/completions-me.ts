import type { ModelDefinition, ProviderModelMapping } from "@/models.js";

const completionsMeProviderId = "kiwillm-completions-me" as const;

function createProxyMapping(
	modelName: string,
	overrides: Partial<ProviderModelMapping> = {},
): ProviderModelMapping {
	return {
		test: "skip",
		providerId: completionsMeProviderId,
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

export const completionsMeProviderAugments: Record<
	string,
	ProviderModelMapping[]
> = {
	"gpt-5.4": [
		createProxyMapping("gpt-5.4", {
			contextSize: 400000,
			maxOutput: 128000,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gpt-5.3-codex": [
		createProxyMapping("gpt-5.3-codex", {
			contextSize: 400000,
			maxOutput: 128000,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gpt-5.2-codex": [
		createProxyMapping("gpt-5.2-codex", {
			contextSize: 400000,
			maxOutput: 128000,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gpt-5.1-codex": [
		createProxyMapping("gpt-5.1-codex", {
			contextSize: 400000,
			maxOutput: 128000,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gpt-5.1-codex-max": [
		createProxyMapping("gpt-5.1-codex-max", {
			contextSize: 400000,
			maxOutput: 128000,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gpt-5.1-codex-mini": [
		createProxyMapping("gpt-5.1-codex-mini", {
			contextSize: 400000,
			maxOutput: 128000,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gpt-5.2": [
		createProxyMapping("gpt-5.2", {
			contextSize: 400000,
			maxOutput: 128000,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gpt-5.1": [
		createProxyMapping("gpt-5.1", {
			contextSize: 400000,
			maxOutput: 128000,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gpt-5-mini": [
		createProxyMapping("gpt-5-mini", {
			contextSize: 400000,
			maxOutput: 128000,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gpt-4o": [
		createProxyMapping("gpt-4o", {
			contextSize: 128000,
			vision: true,
			webSearch: true,
		}),
	],
	"gpt-4.1": [
		createProxyMapping("gpt-4.1", {
			contextSize: 1000000,
			vision: true,
		}),
	],
	"gpt-4o-mini": [
		createProxyMapping("gpt-4o-mini", {
			contextSize: 128000,
			vision: true,
		}),
	],
	"gemini-3.1-pro-preview": [
		createProxyMapping("gemini-3.1-pro-preview", {
			contextSize: 1048576,
			maxOutput: 65536,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gemini-3-pro-preview": [
		createProxyMapping("gemini-3-pro-preview", {
			contextSize: 1048576,
			maxOutput: 65536,
			reasoning: true,
			vision: true,
			webSearch: true,
		}),
	],
	"gemini-3-flash-preview": [
		createProxyMapping("gemini-3-flash-preview", {
			contextSize: 1048576,
			maxOutput: 65536,
			reasoning: true,
			vision: true,
			webSearch: true,
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
	"grok-code-fast-1": [
		createProxyMapping("grok-code-fast-1", {
			contextSize: 256000,
			maxOutput: 10000,
		}),
	],
};

export const completionsMeModels = [
	createProxyModel(
		"claude-opus-4.6",
		"anthropic",
		{
			name: "Claude Opus 4.6",
			description:
				"Claude Opus 4.6 exposed by the completions.me proxy, temporarily routed through the working Claude Opus 4.5 upstream.",
		},
		{
			modelName: "claude-opus-4.5",
			contextSize: 1000000,
			maxOutput: 128000,
			reasoning: true,
			tools: true,
		},
	),
	createProxyModel(
		"claude-opus-4.6-fast",
		"anthropic",
		{
			name: "Claude Opus 4.6 Fast",
			description:
				"Faster Claude Opus 4.6 variant exposed by the completions.me proxy.",
		},
		{
			contextSize: 1000000,
			maxOutput: 128000,
			reasoning: true,
			tools: true,
		},
	),
	createProxyModel(
		"claude-sonnet-4.6",
		"anthropic",
		{
			name: "Claude Sonnet 4.6",
			description: "Claude Sonnet 4.6 exposed by the completions.me proxy.",
		},
		{
			contextSize: 200000,
			maxOutput: 64000,
			reasoning: true,
			tools: true,
		},
	),
	createProxyModel(
		"claude-opus-4.5",
		"anthropic",
		{
			name: "Claude Opus 4.5",
			description: "Claude Opus 4.5 exposed by the completions.me proxy.",
		},
		{
			contextSize: 200000,
			maxOutput: 32000,
			reasoning: true,
			tools: true,
		},
	),
	createProxyModel(
		"claude-sonnet-4.5",
		"anthropic",
		{
			name: "Claude Sonnet 4.5",
			description: "Claude Sonnet 4.5 exposed by the completions.me proxy.",
		},
		{
			contextSize: 200000,
			maxOutput: 64000,
			reasoning: true,
			tools: true,
		},
	),
	createProxyModel(
		"claude-sonnet-4",
		"anthropic",
		{
			name: "Claude Sonnet 4",
			description: "Claude Sonnet 4 exposed by the completions.me proxy.",
		},
		{
			contextSize: 200000,
			maxOutput: 64000,
			reasoning: true,
			tools: true,
		},
	),
	createProxyModel(
		"claude-haiku-4.5",
		"anthropic",
		{
			name: "Claude Haiku 4.5",
			description: "Claude Haiku 4.5 exposed by the completions.me proxy.",
		},
		{
			contextSize: 200000,
			maxOutput: 64000,
			tools: true,
		},
	),
	createProxyModel(
		"oswe-vscode-prime",
		"oswe",
		{
			name: "OSWE VSCode Prime",
			description:
				"Custom coding-focused model exposed by the completions.me proxy.",
		},
		{
			contextSize: 200000,
			maxOutput: 32768,
			reasoning: true,
			tools: true,
		},
	),
	createProxyModel(
		"oswe-vscode-secondary",
		"oswe",
		{
			name: "OSWE VSCode Secondary",
			description:
				"Secondary coding-focused model exposed by the completions.me proxy.",
		},
		{
			contextSize: 200000,
			maxOutput: 32768,
			reasoning: true,
			tools: true,
		},
	),
] as const satisfies ModelDefinition[];
