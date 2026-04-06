import type { ModelDefinition, ProviderModelMapping } from "@/models.js";

const swiftSoraVideoProviderId = "kiwillm-swift-sora-video" as const;

function createVideoMapping(
	modelName: string,
	overrides: Partial<ProviderModelMapping> = {},
): ProviderModelMapping {
	return {
		test: "skip",
		providerId: swiftSoraVideoProviderId,
		modelName,
		inputPrice: 0,
		outputPrice: 0,
		requestPrice: 0,
		contextSize: 0,
		maxOutput: 0,
		streaming: false,
		vision: false,
		tools: false,
		jsonOutput: true,
		jsonOutputSchema: false,
		...overrides,
	};
}

export const swiftSoraVideoModels = [
	{
		id: "sora-video",
		name: "Sora Video",
		family: "openai",
		description:
			"Swift Sora video generation worker exposing OpenAI Sora-style video output through KiwiLLM.",
		output: ["video"],
		providers: [createVideoMapping("sora-video")],
	},
] as const satisfies ModelDefinition[];
