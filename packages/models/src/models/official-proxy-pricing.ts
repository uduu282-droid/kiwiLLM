import { alibabaModels } from "./alibaba.js";
import { anthropicModels } from "./anthropic.js";
import { googleModels } from "./google.js";
import { metaModels } from "./meta.js";
import { minimaxModels } from "./minimax.js";
import { mistralModels } from "./mistral.js";
import { moonshotModels } from "./moonshot.js";
import { openaiModels } from "./openai.js";
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

const pricingAliases = new Map<string, string>([
	["claude-3-sonnet", "claude-3-sonnet-20240229"],
	["claude-3.5-sonnet", "claude-3-5-sonnet"],
	["claude-3.5-haiku", "claude-3-5-haiku"],
	["claude-4", "claude-sonnet-4"],
	["claude-4.5", "claude-sonnet-4-5"],
	["claude-sonnet-4.5", "claude-sonnet-4-5"],
	["claude-sonnet-4.6", "claude-sonnet-4-6"],
	["mistral-large", "mistral-large-latest"],
	["mistral-small", "mistral-small-2506"],
	["mistral-nemo", "mistral-nemotron"],
	["qwen-2.5-72b-instruct", "qwen25-72b-instruct"],
	["qwen-3-32b", "qwen3-32b"],
	["qwen-3-235b-a22b", "qwen3-235b-a22b-instruct-2507"],
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
		}
	}
}

registerReferenceModels(openaiModels, ["openai"]);
registerReferenceModels(anthropicModels, ["anthropic"]);
registerReferenceModels(googleModels, ["google-ai-studio", "google-vertex"]);
registerReferenceModels(alibabaModels, ["alibaba"]);
registerReferenceModels(xaiModels, ["xai"]);
registerReferenceModels(mistralModels, ["mistral"]);
registerReferenceModels(moonshotModels, ["moonshot"]);
registerReferenceModels(minimaxModels, ["minimax"]);
registerReferenceModels(zaiModels, ["zai"]);
registerReferenceModels(metaModels, [
	"aws-bedrock",
	"nebius",
	"inference.net",
	"together.ai",
	"cerebras",
	"novita",
]);

export function getOfficialProxyPricing(modelId: string): ReferencePricing {
	const canonicalId = pricingAliases.get(modelId) ?? modelId;
	return (
		referencePricingById.get(canonicalId) ??
		referencePricingByNormalizedId.get(normalizeId(canonicalId)) ??
		{}
	);
}
