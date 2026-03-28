import { createTracingMiddleware } from "@llmgateway/instrumentation";

export const tracingMiddleware = createTracingMiddleware({
	serviceName:
		process.env.GATEWAY_SERVICE_NAME ??
		process.env.OTEL_SERVICE_NAME ??
		"kiwillm-gateway",
});
