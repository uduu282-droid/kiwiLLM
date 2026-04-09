import type { ModelDefinition, ProviderModelMapping } from "@llmgateway/models";

import {
	getBillableProviderMapping,
	hasBillablePricing,
} from "@/lib/provider-pricing.js";

/**
 * Checks if a specific provider mapping is effectively free to use.
 * This is used for env-backed providers that don't require platform credits
 * because they don't have any upstream token or per-request cost.
 */
export function isProviderMappingTrulyFree(
	modelInfo: ModelDefinition,
	providerMapping: ProviderModelMapping | undefined,
): boolean {
	const billedProviderMapping = getBillableProviderMapping(
		modelInfo,
		providerMapping,
	);

	if (!billedProviderMapping) {
		return false;
	}

	return modelInfo.free === true && !hasBillablePricing(billedProviderMapping);
}

/**
 * Checks if a model is truly free (has free flag AND no per-request pricing)
 */
export function isModelTrulyFree(modelInfo: ModelDefinition): boolean {
	if (!modelInfo.free) {
		return false;
	}
	// Check if any provider has a per-request cost
	return !modelInfo.providers.some((p) => p.requestPrice && p.requestPrice > 0);
}
