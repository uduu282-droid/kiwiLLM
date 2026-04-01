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
	upstreamHeaders.set("accept-encoding", "identity");

	const method = c.req.method.toUpperCase();
	const hasBody = method !== "GET" && method !== "HEAD";
	let body = hasBody ? await c.req.raw.arrayBuffer() : undefined;

	if (
		body &&
		method === "POST" &&
		requestUrl.pathname.endsWith("/chat/completions") &&
		(upstreamHeaders.get("content-type") ?? "").includes("application/json")
	) {
		try {
			const requestText = Buffer.from(body).toString("utf8");
			const requestJson = JSON.parse(requestText) as {
				model?: string;
			};

			if (requestJson.model === "auto") {
				requestJson.model = "minimax-m1";
				const rewrittenBody = Buffer.from(JSON.stringify(requestJson), "utf8");
				body = rewrittenBody.buffer.slice(
					rewrittenBody.byteOffset,
					rewrittenBody.byteOffset + rewrittenBody.byteLength,
				);
				upstreamHeaders.set("content-length", String(rewrittenBody.byteLength));
			}
		} catch {
			// Leave the original request body untouched when it is not valid JSON.
		}
	}

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

	const contentType = responseHeaders.get("content-type") ?? "";
	const isStreamingResponse = contentType.includes("text/event-stream");

	if (isStreamingResponse) {
		return new Response(upstreamResponse.body, {
			status: upstreamResponse.status,
			statusText: upstreamResponse.statusText,
			headers: responseHeaders,
		});
	}

	const responseText = await upstreamResponse.text();
	responseHeaders.set(
		"content-length",
		String(Buffer.byteLength(responseText, "utf8")),
	);
	responseHeaders.set("cache-control", "no-store, no-transform");

	return new Response(responseText, {
		status: upstreamResponse.status,
		statusText: upstreamResponse.statusText,
		headers: responseHeaders,
	});
};
