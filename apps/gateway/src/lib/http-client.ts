import { createHttpClient } from "@llmgateway/shared";

export const httpClient = createHttpClient({
	tracerName:
		process.env.GATEWAY_SERVICE_NAME ??
		process.env.OTEL_SERVICE_NAME ??
		"kiwillm-gateway",
	clientName: "gateway-http-client",
});

export type { HttpClientOptions } from "@llmgateway/shared";
