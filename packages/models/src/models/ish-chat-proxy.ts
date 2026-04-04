import type { ModelDefinition, ProviderModelMapping } from "@/models.js";

const ishChatProxyProviderId = "kiwillm-ish-chat-proxy" as const;

function createProxyMapping(
	modelName: string,
	overrides: Partial<ProviderModelMapping> = {},
): ProviderModelMapping {
	return {
		test: "skip",
		providerId: ishChatProxyProviderId,
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

export const ishChatProxyProviderAugments: Record<
	string,
	ProviderModelMapping[]
> = {
	"grok-4-fast-reasoning": [
		createProxyMapping("grok-4-fast-reasoning", {
			contextSize: 256000,
			reasoning: true,
		}),
	],
	"grok-4-fast-non-reasoning": [
		createProxyMapping("grok-4-fast-non-reasoning", {
			contextSize: 256000,
		}),
	],
	"gpt-oss-120b": [
		createProxyMapping("gpt-oss-120b", {
			reasoning: true,
		}),
	],
	"grok-3-mini": [
		createProxyMapping("grok-3-mini", {
			contextSize: 131072,
		}),
	],
};

export const ishChatProxyModels =
	[] as const satisfies readonly ModelDefinition[];
