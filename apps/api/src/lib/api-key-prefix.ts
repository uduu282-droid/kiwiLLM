const defaultApiKeyPrefix =
	process.env.NODE_ENV === "development" ? "kiwidev_" : "kiwillm_";

export function getApiKeyPrefix() {
	return process.env.API_KEY_PREFIX ?? defaultApiKeyPrefix;
}
