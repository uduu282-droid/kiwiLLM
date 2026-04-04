import type { ApiProvider } from "@/lib/fetch-models";

interface DisplayProviderInfo {
	iconProviderId: string;
	name: string;
}

function normalizeValue(value?: string | null) {
	return value?.toLowerCase() ?? "";
}

function resolveCompanyFromModel(modelId?: string | null, family?: string | null) {
	const model = normalizeValue(modelId);
	const modelFamily = normalizeValue(family);
	const haystack = `${model} ${modelFamily}`;

	if (haystack.includes("claude")) {
		return {
			iconProviderId: "anthropic",
			name: "Anthropic",
		};
	}
	if (haystack.includes("grok")) {
		return {
			iconProviderId: "xai",
			name: "xAI",
		};
	}
	if (
		haystack.includes("gpt") ||
		haystack.includes("o1") ||
		haystack.includes("o3") ||
		haystack.includes("o4")
	) {
		return {
			iconProviderId: "openai",
			name: "OpenAI",
		};
	}
	if (haystack.includes("gemini")) {
		return {
			iconProviderId: "google-ai-studio",
			name: "Google",
		};
	}
	if (haystack.includes("qwen")) {
		return {
			iconProviderId: "alibaba",
			name: "Alibaba",
		};
	}
	if (haystack.includes("deepseek")) {
		return {
			iconProviderId: "deepseek",
			name: "DeepSeek",
		};
	}
	if (haystack.includes("kimi")) {
		return {
			iconProviderId: "moonshot",
			name: "Moonshot AI",
		};
	}
	if (haystack.includes("minimax")) {
		return {
			iconProviderId: "minimax",
			name: "MiniMax",
		};
	}
	if (
		haystack.includes("llama") ||
		haystack.includes("nemotron") ||
		haystack.includes("llama-4")
	) {
		return {
			iconProviderId: "meta",
			name: "Meta",
		};
	}
	if (haystack.includes("mistral") || haystack.includes("codestral")) {
		return {
			iconProviderId: "mistral",
			name: "Mistral",
		};
	}
	if (haystack.includes("sonar") || haystack.includes("perplexity")) {
		return {
			iconProviderId: "perplexity",
			name: "Perplexity",
		};
	}
	if (haystack.includes("glm")) {
		return {
			iconProviderId: "zai",
			name: "Z.AI",
		};
	}
	if (haystack.includes("seed")) {
		return {
			iconProviderId: "bytedance",
			name: "ByteDance",
		};
	}

	return null;
}

export function getDisplayProviderInfo({
	providerId,
	providerName,
	modelId,
	family,
}: {
	providerId: string;
	providerName?: string | null;
	modelId?: string | null;
	family?: string | null;
}): DisplayProviderInfo {
	if (providerId.startsWith("kiwillm-")) {
		return (
			resolveCompanyFromModel(modelId, family) ?? {
				iconProviderId: "llmgateway",
				name: "KiwiLLM",
			}
		);
	}

	if (providerId === "llmgateway") {
		return {
			iconProviderId: "llmgateway",
			name: "KiwiLLM",
		};
	}

	if (providerId === "custom") {
		return {
			iconProviderId: "llmgateway",
			name: "KiwiLLM",
		};
	}

	return {
		iconProviderId: providerId,
		name: providerName ?? providerId,
	};
}

export function getDisplayProviderName(
	provider: Pick<ApiProvider, "id" | "name">,
	modelId?: string | null,
	family?: string | null,
) {
	return getDisplayProviderInfo({
		providerId: provider.id,
		providerName: provider.name,
		modelId,
		family,
	}).name;
}
