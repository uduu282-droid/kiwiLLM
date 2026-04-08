import type { Provider } from "@llmgateway/models";

export function isBackendSupportedProvider(
	providerId: Provider | string,
): boolean {
	return (
		providerId === "llmgateway" ||
		providerId === "custom" ||
		providerId.startsWith("kiwillm-")
	);
}
