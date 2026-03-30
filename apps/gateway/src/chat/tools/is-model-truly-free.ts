import type { ModelDefinition } from "@llmgateway/models";
import type { ProviderModelMapping } from "@llmgateway/models";

/**
 * Checks if a specific provider mapping is effectively free to use.
 * This is used for env-backed providers that don't require platform credits
 * because they don't have any upstream token or per-request cost.
 */
export function isProviderMappingTrulyFree(
	providerMapping: ProviderModelMapping | undefined,
): boolean {
	if (!providerMapping) {
		return false;
	}

	return (
		(providerMapping.inputPrice ?? 0) <= 0 &&
		(providerMapping.outputPrice ?? 0) <= 0 &&
		(providerMapping.cachedInputPrice ?? 0) <= 0 &&
		(providerMapping.imageInputPrice ?? 0) <= 0 &&
		(providerMapping.imageOutputPrice ?? 0) <= 0 &&
		(providerMapping.requestPrice ?? 0) <= 0 &&
		(providerMapping.webSearchPrice ?? 0) <= 0
	);
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
