import { getInternalGatewayUrl } from "@/lib/gateway-url.js";

import type { ServerTypes } from "@/vars.js";
import type { Context } from "hono";

const HOP_BY_HOP_HEADERS = new Set([
	"connection",
	"keep-alive",
	"proxy-authenticate",
	"proxy-authorization",
	"te",
	"trailer",
	"transfer-encoding",
	"upgrade",
	"host",
]);

export const proxyV1Request = async (c: Context<ServerTypes>) => {
	const gatewayUrl = getInternalGatewayUrl();

	if (!gatewayUrl) {
		return c.json(
			{
				message:
					"Gateway upstream is not configured. Set INTERNAL_GATEWAY_URL on the API service.",
			},
			503,
		);
	}

	const requestUrl = new URL(c.req.url);
	const upstreamUrl = new URL(c.req.path, gatewayUrl);
	upstreamUrl.search = requestUrl.search;

	const upstreamHeaders = new Headers();
	for (const [key, value] of c.req.raw.headers.entries()) {
		if (!HOP_BY_HOP_HEADERS.has(key.toLowerCase())) {
			upstreamHeaders.set(key, value);
		}
	}

	const method = c.req.method.toUpperCase();
	const hasBody = method !== "GET" && method !== "HEAD";
	const body = hasBody ? await c.req.raw.arrayBuffer() : undefined;

	const upstreamResponse = await fetch(upstreamUrl, {
		method,
		headers: upstreamHeaders,
		body,
		redirect: "manual",
	});

	const responseHeaders = new Headers(upstreamResponse.headers);
	for (const header of HOP_BY_HOP_HEADERS) {
		responseHeaders.delete(header);
	}

	const contentType = upstreamResponse.headers.get("content-type") ?? "";
	const isEventStream = contentType.includes("text/event-stream");

	if (!isEventStream) {
		const responseBody = await upstreamResponse.arrayBuffer();
		responseHeaders.delete("content-encoding");
		responseHeaders.delete("content-length");

		return new Response(responseBody, {
			status: upstreamResponse.status,
			statusText: upstreamResponse.statusText,
			headers: responseHeaders,
		});
	}

	return new Response(upstreamResponse.body, {
		status: upstreamResponse.status,
		statusText: upstreamResponse.statusText,
		headers: responseHeaders,
	});
};
