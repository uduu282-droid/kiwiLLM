import { createHttpClient } from "@llmgateway/shared";

export const httpClient = createHttpClient({
	tracerName:
		process.env.API_SERVICE_NAME ??
		process.env.OTEL_SERVICE_NAME ??
		"kiwillm-api",
	clientName: "api-http-client",
});

export type { HttpClientOptions } from "@llmgateway/shared";
