import {
	ProviderIcons,
	type ProviderIconKey,
} from "@llmgateway/shared/components";

import type { ApiProvider } from "@/lib/fetch-models";
import type { ComponentType } from "react";

interface DisplayProviderInfo {
	iconProviderId: string;
	name: string;
}

function titleizeSlug(value: string) {
	return value
		.split(/[-_]+/)
		.filter(Boolean)
		.map((part) =>
			part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part,
		)
		.join(" ");
}

function normalizeValue(value?: string | null) {
	return value?.toLowerCase() ?? "";
}

function resolveCompanyFromModel(
	modelId?: string | null,
	family?: string | null,
) {
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
		haystack.includes("o4") ||
		modelFamily === "openai"
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
	if (
		haystack.includes("gemma") ||
		haystack.includes("shieldgemma") ||
		modelFamily === "google"
	) {
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
	if (
		haystack.includes("phi") ||
		modelFamily === "microsoft" ||
		haystack.includes("wizardlm")
	) {
		return {
			iconProviderId: "azure",
			name: "Microsoft",
		};
	}
	if (haystack.includes("deepseek")) {
		return {
			iconProviderId: "deepseek",
			name: "DeepSeek",
		};
	}
	if (modelFamily === "nvidia" || haystack.includes("nemoguard")) {
		return {
			iconProviderId: "nvidia",
			name: "NVIDIA",
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
		modelFamily === "groq" ||
		haystack.includes("compound") ||
		haystack.includes("whisper")
	) {
		return {
			iconProviderId: haystack.includes("whisper") ? "openai" : "groq",
			name: haystack.includes("whisper") ? "OpenAI" : "Groq",
		};
	}
	if (
		haystack.includes("llama") ||
		haystack.includes("nemotron") ||
		haystack.includes("llama-4") ||
		modelFamily === "meta"
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
	if (modelFamily === "ibm" || haystack.includes("granite")) {
		return {
			iconProviderId: "llmgateway",
			name: "IBM",
		};
	}
	if (modelFamily === "cohere" || haystack.includes("command-r")) {
		return {
			iconProviderId: "llmgateway",
			name: "Cohere",
		};
	}
	if (modelFamily === "databricks" || haystack.includes("dbrx")) {
		return {
			iconProviderId: "llmgateway",
			name: "Databricks",
		};
	}
	if (
		modelFamily === "amazon" ||
		modelFamily === "aws" ||
		haystack.includes("nova-pro")
	) {
		return {
			iconProviderId: "aws-bedrock",
			name: "Amazon",
		};
	}
	if (modelFamily === "ai21" || haystack.includes("jamba")) {
		return {
			iconProviderId: "llmgateway",
			name: "AI21 Labs",
		};
	}
	if (modelFamily === "baichuan" || haystack.includes("baichuan")) {
		return {
			iconProviderId: "llmgateway",
			name: "Baichuan",
		};
	}
	if (modelFamily === "mediatek" || haystack.includes("breeze")) {
		return {
			iconProviderId: "llmgateway",
			name: "MediaTek",
		};
	}
	if (modelFamily === "igenius" || haystack.includes("italia")) {
		return {
			iconProviderId: "llmgateway",
			name: "iGenius",
		};
	}
	if (modelFamily === "canopylabs" || haystack.includes("orpheus")) {
		return {
			iconProviderId: "llmgateway",
			name: "Canopy",
		};
	}
	if (
		modelFamily === "stability" ||
		haystack.includes("stable-diffusion") ||
		haystack.includes("sdxl")
	) {
		return {
			iconProviderId: "llmgateway",
			name: "Stability AI",
		};
	}
	if (modelFamily === "black-forest-labs" || haystack.includes("flux")) {
		return {
			iconProviderId: "llmgateway",
			name: "Black Forest Labs",
		};
	}
	if (modelFamily === "marin" || haystack.includes("marin-")) {
		return {
			iconProviderId: "llmgateway",
			name: "Marin",
		};
	}
	if (modelFamily === "upstage" || haystack.includes("solar-")) {
		return {
			iconProviderId: "llmgateway",
			name: "Upstage",
		};
	}
	if (modelFamily === "rakuten" || haystack.includes("rakuten")) {
		return {
			iconProviderId: "llmgateway",
			name: "Rakuten",
		};
	}
	if (modelFamily === "sarvam" || haystack.includes("sarvam")) {
		return {
			iconProviderId: "llmgateway",
			name: "Sarvam AI",
		};
	}
	if (modelFamily === "tiiuae" || haystack.includes("falcon")) {
		return {
			iconProviderId: "llmgateway",
			name: "TII",
		};
	}
	if (modelFamily === "opengptx" || haystack.includes("teuken")) {
		return {
			iconProviderId: "llmgateway",
			name: "OpenGPT-X",
		};
	}
	if (modelFamily === "speakleash" || haystack.includes("bielik")) {
		return {
			iconProviderId: "llmgateway",
			name: "SpeakLeash",
		};
	}
	if (modelFamily === "utter" || haystack.includes("eurollm")) {
		return {
			iconProviderId: "llmgateway",
			name: "EuroLLM",
		};
	}
	if (modelFamily === "stockmark" || haystack.includes("stockmark")) {
		return {
			iconProviderId: "llmgateway",
			name: "Stockmark",
		};
	}
	if (modelFamily === "thedrummer" || haystack.includes("rocinante")) {
		return {
			iconProviderId: "llmgateway",
			name: "TheDrummer",
		};
	}
	if (
		modelFamily === "openrouter" ||
		haystack.includes("trinity") ||
		haystack.includes("cybertron")
	) {
		return {
			iconProviderId: "llmgateway",
			name: "OpenRouter",
		};
	}
	if (modelFamily === "stepfun" || haystack.includes("step-")) {
		return {
			iconProviderId: "llmgateway",
			name: "StepFun",
		};
	}
	if (modelFamily === "nvidia") {
		return {
			iconProviderId: "nvidia",
			name: "NVIDIA",
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

export function getDisplayProviderIcon(
	iconProviderId: string,
): ComponentType<{ className?: string }> | null {
	if (ProviderIcons[iconProviderId as ProviderIconKey]) {
		return ProviderIcons[iconProviderId as ProviderIconKey];
	}

	const normalizedProvider = iconProviderId
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "-") as ProviderIconKey;

	return ProviderIcons[normalizedProvider] ?? null;
}

export function getDisplayModelName({
	modelId,
	modelName,
	family,
}: {
	modelId: string;
	modelName?: string | null;
	family?: string | null;
}) {
	const normalizedFamily = normalizeValue(family);

	if (modelName) {
		if (normalizedFamily === "groq" && modelName.startsWith("Groq ")) {
			return modelName.replace(/^Groq\s+/, "");
		}
		return modelName;
	}

	if (modelId.startsWith("groq-")) {
		return titleizeSlug(modelId.replace(/^groq-/, ""));
	}

	return modelId;
}
