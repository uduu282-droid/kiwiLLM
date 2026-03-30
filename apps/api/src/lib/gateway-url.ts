const isHosted = process.env.HOSTED === "true";

const normalizeUrl = (value: string) => value.replace(/\/+$/, "").toLowerCase();

const apiUrl =
	process.env.API_URL ??
	(isHosted ? "https://api.kiwillm.in" : "http://localhost:4002");

const publicGatewayUrl =
	process.env.PUBLIC_GATEWAY_URL ??
	process.env.GATEWAY_URL ??
	(isHosted ? "https://api.kiwillm.in" : "http://localhost:4001");

const internalGatewayUrlCandidate =
	process.env.INTERNAL_GATEWAY_URL ??
	process.env.GATEWAY_INTERNAL_URL ??
	process.env.GATEWAY_URL ??
	process.env.PUBLIC_GATEWAY_URL ??
	(isHosted ? apiUrl : "http://localhost:4001");

export const getPublicGatewayUrl = () => publicGatewayUrl;

export const getInternalGatewayUrl = () => {
	if (
		isHosted &&
		normalizeUrl(internalGatewayUrlCandidate) === normalizeUrl(apiUrl)
	) {
		return null;
	}

	return internalGatewayUrlCandidate;
};
