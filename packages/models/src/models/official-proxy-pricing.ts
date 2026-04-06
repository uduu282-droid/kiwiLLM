import { alibabaModels } from "./alibaba.js";
import { anthropicModels } from "./anthropic.js";
import { bytedanceModels } from "./bytedance.js";
import { deepseekModels } from "./deepseek.js";
import { googleModels } from "./google.js";
import { metaModels } from "./meta.js";
import { minimaxModels } from "./minimax.js";
import { mistralModels } from "./mistral.js";
import { moonshotModels } from "./moonshot.js";
import { openaiModels } from "./openai.js";
import { perplexityModels } from "./perplexity.js";
import { xaiModels } from "./xai.js";
import { zaiModels } from "./zai.js";

import type { ModelDefinition, ProviderModelMapping } from "@/models.js";

type ReferencePricing = Pick<
	ProviderModelMapping,
	| "inputPrice"
	| "outputPrice"
	| "requestPrice"
	| "cachedInputPrice"
	| "minCacheableTokens"
	| "imageInputPrice"
	| "imageOutputPrice"
	| "imageOutputTokensByResolution"
	| "imageInputTokensByResolution"
	| "discount"
	| "pricingTiers"
	| "webSearchPrice"
>;

const referencePricingById = new Map<string, ReferencePricing>();
const referencePricingByNormalizedId = new Map<string, ReferencePricing>();
const referencePricingByNormalizedModelName = new Map<
	string,
	ReferencePricing
>();
const manualReferencePricingById = new Map<string, ReferencePricing>([
	[
		"chatgpt-4o-latest",
		{
			inputPrice: 5 / 1e6,
			outputPrice: 15 / 1e6,
		},
	],
	[
		"gpt-4-32k",
		{
			inputPrice: 60 / 1e6,
			outputPrice: 120 / 1e6,
		},
	],
	[
		"gpt-4-vision-preview",
		{
			inputPrice: 10 / 1e6,
			outputPrice: 30 / 1e6,
		},
	],
	[
		"gpt-3.5-turbo-0125",
		{
			inputPrice: 0.5 / 1e6,
			outputPrice: 1.5 / 1e6,
		},
	],
	[
		"o1-preview",
		{
			inputPrice: 15 / 1e6,
			cachedInputPrice: 7.5 / 1e6,
			outputPrice: 60 / 1e6,
		},
	],
	[
		"gpt-5-codex",
		{
			inputPrice: 1.25 / 1e6,
			cachedInputPrice: 0.125 / 1e6,
			outputPrice: 10 / 1e6,
		},
	],
	[
		"gpt-5.1-codex-max",
		{
			inputPrice: 1.25 / 1e6,
			cachedInputPrice: 0.125 / 1e6,
			outputPrice: 10 / 1e6,
		},
	],
	[
		"gpt-5.4-mini",
		{
			inputPrice: 0.75 / 1e6,
			cachedInputPrice: 0.075 / 1e6,
			outputPrice: 4.5 / 1e6,
		},
	],
	[
		"gpt-5.4-nano",
		{
			inputPrice: 0.2 / 1e6,
			cachedInputPrice: 0.02 / 1e6,
			outputPrice: 1.25 / 1e6,
		},
	],
	[
		"gpt-5-image",
		{
			inputPrice: 5 / 1e6,
			cachedInputPrice: 1.25 / 1e6,
			outputPrice: 10 / 1e6,
			imageInputPrice: 8 / 1e6,
			imageOutputPrice: 32 / 1e6,
		},
	],
	[
		"gpt-5-image-mini",
		{
			inputPrice: 2 / 1e6,
			cachedInputPrice: 0.2 / 1e6,
			imageInputPrice: 2.5 / 1e6,
			imageOutputPrice: 8 / 1e6,
		},
	],
	[
		"command-a",
		{
			inputPrice: 2.5 / 1e6,
			outputPrice: 10 / 1e6,
		},
	],
	[
		"command-r",
		{
			inputPrice: 0.15 / 1e6,
			outputPrice: 0.6 / 1e6,
		},
	],
	[
		"command-r-08-2024",
		{
			inputPrice: 0.15 / 1e6,
			outputPrice: 0.6 / 1e6,
		},
	],
	[
		"command-r-plus",
		{
			inputPrice: 2.5 / 1e6,
			outputPrice: 10 / 1e6,
		},
	],
	[
		"command-r-plus-08-2024",
		{
			inputPrice: 2.5 / 1e6,
			outputPrice: 10 / 1e6,
		},
	],
	[
		"nova-pro",
		{
			inputPrice: 0.8 / 1e6,
			outputPrice: 3.2 / 1e6,
		},
	],
	[
		"jamba-1.5-mini-instruct",
		{
			inputPrice: 0.2 / 1e6,
			outputPrice: 0.4 / 1e6,
		},
	],
	[
		"llama-guard-3-8b",
		{
			inputPrice: 0.02 / 1e6,
			outputPrice: 0.06 / 1e6,
		},
	],
	[
		"claude-3-sonnet-20240229",
		{
			inputPrice: 3 / 1e6,
			cachedInputPrice: 0.3 / 1e6,
			minCacheableTokens: 1024,
			outputPrice: 15 / 1e6,
		},
	],
	[
		"claude-instant",
		{
			inputPrice: 1.63 / 1e6,
			outputPrice: 5.51 / 1e6,
		},
	],
	[
		"deepseek-chat",
		{
			inputPrice: 0.28 / 1e6,
			cachedInputPrice: 0.028 / 1e6,
			outputPrice: 0.42 / 1e6,
		},
	],
	[
		"deepseek-reasoner",
		{
			inputPrice: 0.28 / 1e6,
			cachedInputPrice: 0.028 / 1e6,
			outputPrice: 0.42 / 1e6,
		},
	],
	[
		"phi-3-mini-4k-instruct",
		{
			inputPrice: 0.13 / 1e6,
			outputPrice: 0.52 / 1e6,
		},
	],
	[
		"phi-3-mini-128k-instruct",
		{
			inputPrice: 0.13 / 1e6,
			outputPrice: 0.52 / 1e6,
		},
	],
	[
		"phi-3.5-mini-instruct",
		{
			inputPrice: 0.13 / 1e6,
			outputPrice: 0.52 / 1e6,
		},
	],
	[
		"phi-3-medium-4k-instruct",
		{
			inputPrice: 0.17 / 1e6,
			outputPrice: 0.68 / 1e6,
		},
	],
	[
		"phi-3-medium-128k-instruct",
		{
			inputPrice: 0.17 / 1e6,
			outputPrice: 0.68 / 1e6,
		},
	],
	[
		"phi-4",
		{
			inputPrice: 0.125 / 1e6,
			outputPrice: 0.5 / 1e6,
		},
	],
	[
		"phi-4-mini",
		{
			inputPrice: 0.075 / 1e6,
			outputPrice: 0.3 / 1e6,
		},
	],
	[
		"phi-4-multimodal",
		{
			inputPrice: 0.08 / 1e6,
			outputPrice: 0.32 / 1e6,
		},
	],
	[
		"mistral-nemo",
		{
			inputPrice: 0.15 / 1e6,
			outputPrice: 0.15 / 1e6,
		},
	],
	[
		"reka-core",
		{
			inputPrice: 2 / 1e6,
			outputPrice: 6 / 1e6,
		},
	],
	[
		"minimax-m1",
		{
			inputPrice: 0.4 / 1e6,
			outputPrice: 2.2 / 1e6,
			pricingTiers: [
				{
					name: "Up to 200K",
					upToTokens: 200000,
					inputPrice: 0.4 / 1e6,
					outputPrice: 2.2 / 1e6,
				},
				{
					name: "Over 200K",
					upToTokens: Infinity,
					inputPrice: 1.3 / 1e6,
					outputPrice: 2.2 / 1e6,
				},
			],
		},
	],
]);

const pricingAliases = new Map<string, string>([
	["claude-3-sonnet", "claude-3-sonnet-20240229"],
	["claude-3.5-sonnet", "claude-3-5-sonnet"],
	["claude-3.5-haiku", "claude-3-5-haiku"],
	["claude-3.5-opus", "claude-opus-4-5-20251101"],
	["claude-3-sonnet", "claude-3-sonnet-20240229"],
	["claude-4", "claude-sonnet-4"],
	["claude-4-sonnet", "claude-sonnet-4-5"],
	["claude-4.5", "claude-sonnet-4-5"],
	["claude-sonnet-4.5", "claude-sonnet-4-5"],
	["claude-sonnet-4.6", "claude-sonnet-4-6"],
	["claude-4-opus", "claude-opus-4-6"],
	["deepseek-chat", "deepseek-v3"],
	["deepseek-coder", "deepseek-v3"],
	["deepseek", "deepseek-v3"],
	["gemini", "gemini-2.5-pro"],
	["gemma", "gemma-3-27b"],
	["gemini-advanced", "gemini-2.5-pro"],
	["gemini-ultra", "gemini-2.5-pro"],
	["gpt", "gpt-4o"],
	["chatgpt-4o-latest", "gpt-4o"],
	["gpt-3.5-turbo-16k", "gpt-3.5-turbo"],
	["gpt-3.5-turbo-0125", "gpt-3.5-turbo"],
	["gpt-4-turbo-preview", "gpt-4-turbo"],
	["gpt-4-plus", "gpt-4o"],
	["gpt-4-mini", "gpt-4o-mini"],
	["gpt-4-nano", "gpt-4.1-nano"],
	["gpt-5-codex", "gpt-5.2-codex"],
	["gpt-5.2-high", "gpt-5.2"],
	["gpt-5.1-codex-max", "gpt-5.1-codex-max"],
	["gpt-5.4-mini", "gpt-5.4-mini"],
	["gpt-5.4-nano", "gpt-5.4-nano"],
	["o1-preview", "o1"],
	["grok", "grok-3"],
	["claude-2", "claude-2.1"],
	["mistral-large", "mistral-large-latest"],
	["mistral-large-2", "mistral-large-latest"],
	["mistral-small", "mistral-small-2506"],
	["mistral-small-3.1", "mistral-small-2506"],
	["mistral-nemo", "mistral-nemotron"],
	["mistral-small-24b-instruct-2501", "mistral-small-2506"],
	["mistral-7b-instruct", "mistral-7b-instruct-together"],
	["devstral", "devstral-2512"],
	["ministral", "ministral-14b-2512"],
	["llama", "llama-3.1-8b-instruct"],
	["llama-2-7b", "llama-3-8b-instruct"],
	["llama-3-8b", "llama-3-8b-instruct"],
	["llama-3.1", "llama-3.1-8b-instruct"],
	["llama-3.1-8b-awq", "llama-3.1-8b-instruct"],
	["llama-3.1-8b-fp8", "llama-3.1-8b-instruct"],
	["llama-3.2", "llama-3.2-3b-instruct"],
	["llama-3.2-1b", "llama-3.2-3b-instruct"],
	["llama-3.2-11b-vision", "llama-3.2-11b-instruct"],
	["llama-3.2-11b-vision-instruct", "llama-3.2-11b-instruct"],
	["llama-3.2-90b-vision-instruct", "llama-4-scout-17b-instruct"],
	["llama-3.3", "llama-3.3-70b-instruct"],
	["llama-3.3-70b-fp8", "llama-3.3-70b-instruct"],
	["llama-4-maverick", "llama-4-maverick-17b-instruct"],
	["llama-4-maverick-17b-128e-instruct", "llama-4-maverick-17b-instruct"],
	["llama-guard-3", "llama-guard-3-8b"],
	["llama-3-sonar-large-32k-online", "sonar-pro"],
	["llama-3-sonar-small-32k-online", "sonar"],
	["nova-pro-v1", "nova-pro"],
	["perplexity-pro", "sonar-pro"],
	["qwen", "qwen-plus"],
	["qwq-32b", "qwen-qwq-32b"],
	["qwen-2.5-72b-instruct", "qwen25-72b-instruct"],
	["qwen-2.5-7b-instruct", "qwen25-coder-7b"],
	["qwen-2.5-coder", "qwen25-coder-7b"],
	["qwen2-7b-instruct", "qwen25-coder-7b"],
	["qwen2.5-7b-instruct", "qwen25-coder-7b"],
	["qwen-3-32b", "qwen3-32b"],
	["qwen-3-30b", "qwen3-30b-a3b"],
	["qwen-3-235b-a22b", "qwen3-235b-a22b-instruct-2507"],
	["qwen2.5-coder-32b-instruct", "qwen3-32b"],
	["qwen2.5-coder-7b-instruct", "qwen25-coder-7b"],
	["qwen3.5", "qwen-plus"],
	["qwen3.5-plus", "qwen-max"],
	["qwen3-thinking-2507", "qwen3-next-80b-a3b-thinking"],
	["deepseek-v3-0324", "deepseek-v3"],
	["deepseek-chat-v3-0324", "deepseek-chat"],
	["deepseek-r1", "deepseek-reasoner"],
	["deepseek-v3.2-exp", "deepseek-chat"],
	["claude-3-5-sonnet-reasoning", "claude-3-5-sonnet"],
	["claude-opus-4.5", "claude-opus-4-5-20251101"],
	["claude-opus-4.6-fast", "claude-opus-4-6"],
	["gemini-3-pro", "gemini-3-pro-preview"],
	["gemini-3-flash", "gemini-3-flash-preview"],
	["gemini-pro", "gemini-1.5-pro"],
	["gemini-pro-vision", "gemini-1.5-pro"],
	["gemma-3-27b-it", "gemma-3-27b"],
	["gemma-3-12b", "gemma-3-12b-it"],
	["grok-2", "grok-2-1212"],
	["gpt-oss-safeguard-20b", "gpt-oss-20b"],
	["llama-3.2-3b", "llama-3.2-3b-instruct"],
	["llama-3-8b-awq", "llama-3-8b-instruct"],
	["llama-3-meta", "llama-3-8b-instruct"],
	["llama-3.1-8b-instant", "llama-3.1-8b-instruct"],
	["llama-3.3-70b-versatile", "llama-3.3-70b-instruct"],
	["llama-prompt-guard-2-22m", "llama-guard-3-8b"],
	["llama-prompt-guard-2-86m", "llama-guard-3-8b"],
	["mistral-small-24b-instruct", "mistral-small-2506"],
	["mistral-7b-instruct-v0.2", "mistral-7b-instruct-together"],
	["mistral-7b-instruct-v0.3", "mistral-7b-instruct-together"],
	["ministral-14b-instruct-2512", "ministral-14b-2512"],
	["devstral-2-123b-instruct-2512", "devstral-2512"],
	["deepseek-v3.5", "deepseek-chat"],
	["llama-3.2-1b-instruct", "llama-3.2-3b-instruct"],
	["llama-3.1-nemotron-70b-instruct", "llama-3.1-70b-instruct"],
	["mistral-large-3-675b-instruct-2512", "mistral-large-2512"],
	["mistral-small-4-119b-2603", "mistral-small-2506"],
	["phi-3-mini-4k-instruct", "phi-3-mini-4k-instruct"],
	["phi-3-mini-128k-instruct", "phi-3-mini-128k-instruct"],
	["phi-3.5-mini-instruct", "phi-3.5-mini-instruct"],
	["phi-3-medium-4k-instruct", "phi-3-medium-4k-instruct"],
	["phi-3-medium-128k-instruct", "phi-3-medium-128k-instruct"],
	["phi-4-mini-instruct", "phi-4-mini"],
	["phi-4-mini-flash-reasoning", "phi-4-mini"],
	["phi-4-multimodal-instruct", "phi-4-multimodal"],
	["llama-3.1-8b-instruct-turbo", "llama-3.1-8b-instruct"],
	["minimax-m1", "minimax-m1"],
]);

function normalizeId(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function resolvePricingAlias(modelId: string): string {
	let current = modelId;
	const visited = new Set<string>();

	while (!visited.has(current)) {
		visited.add(current);
		const next = pricingAliases.get(current);
		if (!next) {
			return current;
		}
		current = next;
	}

	return current;
}

function copyReferencePricing(
	provider: ProviderModelMapping,
): ReferencePricing | undefined {
	const hasPricing =
		(provider.inputPrice ?? 0) > 0 ||
		(provider.outputPrice ?? 0) > 0 ||
		(provider.requestPrice ?? 0) > 0 ||
		(provider.pricingTiers?.length ?? 0) > 0 ||
		(provider.imageInputPrice ?? 0) > 0 ||
		(provider.imageOutputPrice ?? 0) > 0;

	if (!hasPricing) {
		return undefined;
	}

	return {
		inputPrice: provider.inputPrice,
		outputPrice: provider.outputPrice,
		requestPrice: provider.requestPrice,
		cachedInputPrice: provider.cachedInputPrice,
		minCacheableTokens: provider.minCacheableTokens,
		imageInputPrice: provider.imageInputPrice,
		imageOutputPrice: provider.imageOutputPrice,
		imageOutputTokensByResolution: provider.imageOutputTokensByResolution,
		imageInputTokensByResolution: provider.imageInputTokensByResolution,
		discount: provider.discount,
		pricingTiers: provider.pricingTiers,
		webSearchPrice: provider.webSearchPrice,
	};
}

function preferredProviderPricing(
	model: ModelDefinition,
	preferredProviderIds: readonly string[],
): ReferencePricing | undefined {
	for (const providerId of preferredProviderIds) {
		const provider = model.providers.find(
			(entry) => entry.providerId === providerId,
		);
		const pricing = provider ? copyReferencePricing(provider) : undefined;
		if (pricing) {
			return pricing;
		}
	}

	for (const provider of model.providers) {
		if (provider.providerId.startsWith("kiwillm-")) {
			continue;
		}

		const pricing = copyReferencePricing(provider);
		if (pricing) {
			return pricing;
		}
	}

	return undefined;
}

function registerReferenceModels(
	models: readonly ModelDefinition[],
	preferredProviderIds: readonly string[],
): void {
	for (const model of models) {
		const pricing = preferredProviderPricing(model, preferredProviderIds);
		if (pricing) {
			referencePricingById.set(model.id, pricing);
			referencePricingByNormalizedId.set(normalizeId(model.id), pricing);
			for (const provider of model.providers) {
				if (provider.providerId.startsWith("kiwillm-")) {
					continue;
				}
				referencePricingByNormalizedModelName.set(
					normalizeId(provider.modelName),
					pricing,
				);
			}
		}
	}
}

registerReferenceModels(openaiModels, ["openai"]);
registerReferenceModels(anthropicModels, ["anthropic"]);
registerReferenceModels(googleModels, ["google-ai-studio", "google-vertex"]);
registerReferenceModels(alibabaModels, ["alibaba"]);
registerReferenceModels(deepseekModels, ["nebius"]);
registerReferenceModels(xaiModels, ["xai"]);
registerReferenceModels(mistralModels, ["mistral"]);
registerReferenceModels(moonshotModels, ["moonshot"]);
registerReferenceModels(minimaxModels, ["minimax"]);
registerReferenceModels(zaiModels, ["zai"]);
registerReferenceModels(bytedanceModels, ["bytedance"]);
registerReferenceModels(perplexityModels, ["perplexity"]);
registerReferenceModels(metaModels, [
	"aws-bedrock",
	"nebius",
	"inference.net",
	"together.ai",
	"cerebras",
	"novita",
]);

export function getOfficialProxyPricing(
	modelId: string,
	providerModelName?: string,
): ReferencePricing {
	const canonicalId = resolvePricingAlias(modelId);
	const manualPricing =
		manualReferencePricingById.get(modelId) ??
		manualReferencePricingById.get(normalizeId(modelId)) ??
		manualReferencePricingById.get(canonicalId) ??
		manualReferencePricingById.get(normalizeId(canonicalId));
	return (
		manualPricing ??
		referencePricingById.get(canonicalId) ??
		referencePricingByNormalizedId.get(normalizeId(canonicalId)) ??
		(providerModelName
			? referencePricingByNormalizedModelName.get(
					normalizeId(providerModelName),
				)
			: undefined) ??
		{}
	);
}
