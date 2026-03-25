interface Env {
	AIHUBMIX_API_KEY: string;
}

const upstreamBaseUrl = "https://aihubmix.com";

const corsHeaders = {
	"access-control-allow-headers": "authorization, content-type",
	"access-control-allow-methods": "GET,POST,OPTIONS",
	"access-control-allow-origin": "*",
} as const;

function jsonResponse(body: unknown, init?: ResponseInit): Response {
	return Response.json(body, {
		...init,
		headers: {
			...corsHeaders,
			...(init?.headers ?? {}),
		},
	});
}

function withCors(response: Response): Response {
	const headers = new Headers(response.headers);
	for (const [key, value] of Object.entries(corsHeaders)) {
		headers.set(key, value);
	}

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers,
	});
}

async function proxyChatCompletions(request: Request, env: Env): Promise<Response> {
	if (!env.AIHUBMIX_API_KEY) {
		return jsonResponse(
			{ error: "Missing AIHUBMIX_API_KEY worker secret." },
			{ status: 500 },
		);
	}

	const upstreamRequest = new Request(`${upstreamBaseUrl}/v1/chat/completions`, {
		method: "POST",
		headers: {
			authorization: `Bearer ${env.AIHUBMIX_API_KEY}`,
			"content-type": request.headers.get("content-type") ?? "application/json",
		},
		body: request.body,
	});

	const upstreamResponse = await fetch(upstreamRequest);
	return withCors(upstreamResponse);
}

async function proxyModels(env: Env): Promise<Response> {
	if (!env.AIHUBMIX_API_KEY) {
		return jsonResponse(
			{ error: "Missing AIHUBMIX_API_KEY worker secret." },
			{ status: 500 },
		);
	}

	const upstreamResponse = await fetch(`${upstreamBaseUrl}/v1/models`, {
		headers: {
			authorization: `Bearer ${env.AIHUBMIX_API_KEY}`,
		},
	});

	return withCors(upstreamResponse);
}

export default {
	async fetch(request, env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === "OPTIONS") {
			return new Response(null, {
				status: 204,
				headers: corsHeaders,
			});
		}

		if (url.pathname === "/" || url.pathname === "/health") {
			return jsonResponse({
				ok: true,
				service: "aihubmix-worker",
				paths: ["/v1/chat/completions", "/v1/models"],
			});
		}

		if (url.pathname === "/v1/chat/completions" && request.method === "POST") {
			return proxyChatCompletions(request, env);
		}

		if (url.pathname === "/v1/models" && request.method === "GET") {
			return proxyModels(env);
		}

		return jsonResponse({ error: "Not found." }, { status: 404 });
	},
} satisfies ExportedHandler<Env>;