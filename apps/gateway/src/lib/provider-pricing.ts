import type { ModelDefinition, ProviderModelMapping } from "@llmgateway/models";

import { isBackendSupportedProvider } from "./backend-provider-support.js";

function getWebSearchPrice(providerMapping: ProviderModelMapping): number {
	return "webSearchPrice" in providerMapping &&
		typeof providerMapping.webSearchPrice === "number"
		? providerMapping.webSearchPrice
		: 0;
}

export function hasBillablePricing(
	providerMapping: ProviderModelMapping | undefined,
): boolean {
	if (!providerMapping) {
		return false;
	}

	if (
		(providerMapping.inputPrice ?? 0) > 0 ||
		(providerMapping.outputPrice ?? 0) > 0 ||
		(providerMapping.cachedInputPrice ?? 0) > 0 ||
		(providerMapping.imageInputPrice ?? 0) > 0 ||
		(providerMapping.imageOutputPrice ?? 0) > 0 ||
		(providerMapping.requestPrice ?? 0) > 0 ||
		getWebSearchPrice(providerMapping) > 0
	) {
		return true;
	}

	return (
		providerMapping.pricingTiers?.some(
			(tier) =>
				tier.inputPrice > 0 ||
				tier.outputPrice > 0 ||
				(tier.cachedInputPrice ?? 0) > 0,
		) ?? false
	);
}

function shouldUseCanonicalPricing(
	modelInfo: ModelDefinition,
	providerMapping: ProviderModelMapping,
): boolean {
	return (
		isBackendSupportedProvider(providerMapping.providerId) &&
		!hasBillablePricing(providerMapping) &&
		modelInfo.free !== true
	);
}

export function getBillableProviderMapping(
	modelInfo: ModelDefinition,
	providerMapping: ProviderModelMapping | undefined,
): ProviderModelMapping | undefined {
	if (!providerMapping) {
		return undefined;
	}

	if (!shouldUseCanonicalPricing(modelInfo, providerMapping)) {
		return providerMapping;
	}

	const billableProviders = modelInfo.providers.filter(hasBillablePricing);
	return (
		billableProviders.find(
			(candidate) => !isBackendSupportedProvider(candidate.providerId),
		) ??
		billableProviders[0] ??
		providerMapping
	);
}
