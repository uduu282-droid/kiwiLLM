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
]);

const pricingAliases = new Map<string, string>([
	["claude-3-sonnet", "claude-3-sonnet-20240229"],
	["claude-3.5-sonnet", "claude-3-5-sonnet"],
	["claude-3.5-haiku", "claude-3-5-haiku"],
	["claude-3.5-opus", "claude-opus-4-5"],
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
	["gpt-4-plus", "gpt-4o"],
	["gpt-4-mini", "gpt-4o-mini"],
	["gpt-4-nano", "gpt-4.1-nano"],
	["gpt-5.2-high", "gpt-5.2"],
	["grok", "grok-3"],
	["mistral-large", "mistral-large-latest"],
	["mistral-large-2", "mistral-large-latest"],
	["mistral-small", "mistral-small-2506"],
	["mistral-small-3.1", "mistral-small-2506"],
	["mistral-nemo", "mistral-nemotron"],
	["llama", "llama-3.1-8b-instruct"],
	["llama-3.1", "llama-3.1-8b-instruct"],
	["llama-3.2", "llama-3.2-3b-instruct"],
	["llama-3.3", "llama-3.3-70b-instruct"],
	["llama-4-maverick", "llama-4-maverick-17b-instruct"],
	["llama-guard-3", "llama-guard-3-8b"],
	["nova-pro-v1", "nova-pro"],
	["perplexity-pro", "sonar-pro"],
	["qwen", "qwen-plus"],
	["qwen-2.5-72b-instruct", "qwen25-72b-instruct"],
	["qwen-2.5-7b-instruct", "qwen25-coder-7b"],
	["qwen-2.5-coder", "qwen25-coder-7b"],
	["qwen-3-32b", "qwen3-32b"],
	["qwen-3-30b", "qwen3-30b-a3b"],
	["qwen-3-235b-a22b", "qwen3-235b-a22b-instruct-2507"],
	["qwen2.5-7b-instruct", "qwen-2.5-7b-instruct"],
	["qwen2.5-coder-7b-instruct", "qwen25-coder-7b"],
	["qwen3.5", "qwen-plus"],
	["qwen3.5-plus", "qwen-max"],
	["qwen3-thinking-2507", "qwen3-next-80b-a3b-thinking"],
	["deepseek-v3-0324", "deepseek-v3"],
	["gemma-3-27b-it", "gemma-3-27b"],
	["llama-3.1-8b-instruct-turbo", "llama-3.1-8b-instruct"],
]);

function normalizeId(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]/g, "");
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
	const canonicalId = pricingAliases.get(modelId) ?? modelId;
	const manualPricing =
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
