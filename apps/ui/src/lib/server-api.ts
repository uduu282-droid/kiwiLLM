import { cookies } from "next/headers";
import createFetchClient from "openapi-fetch";

import { getConfig } from "./config-server";

import type { paths } from "./api/v1";

// Server-side API client
export async function createServerApiClient() {
	const config = getConfig();
	const cookieStore = await cookies();

	const supabaseSessionCookie = cookieStore.get(
		process.env.SUPABASE_SESSION_COOKIE_NAME ?? "sb-access-token",
	);
	const supabaseRefreshCookie = cookieStore.get(
		process.env.SUPABASE_REFRESH_COOKIE_NAME ?? "sb-refresh-token",
	);
	const key = "better-auth.session_token";
	const sessionCookie = cookieStore.get(`${key}`);
	const secureSessionCookie = cookieStore.get(`__Secure-${key}`);
	const cookieHeaderParts = [];

	if (supabaseSessionCookie?.value) {
		cookieHeaderParts.push(
			`${process.env.SUPABASE_SESSION_COOKIE_NAME ?? "sb-access-token"}=${supabaseSessionCookie.value}`,
		);
	}

	if (supabaseRefreshCookie?.value) {
		cookieHeaderParts.push(
			`${process.env.SUPABASE_REFRESH_COOKIE_NAME ?? "sb-refresh-token"}=${supabaseRefreshCookie.value}`,
		);
	}

	if (secureSessionCookie?.value) {
		cookieHeaderParts.push(`__Secure-${key}=${secureSessionCookie.value}`);
	} else if (sessionCookie?.value) {
		cookieHeaderParts.push(`${key}=${sessionCookie.value}`);
	}

	return createFetchClient<paths>({
		baseUrl: config.apiBackendUrl,
		credentials: "include",
		headers: {
			Cookie: cookieHeaderParts.join("; "),
		},
	});
}

// Type-safe method signatures for different HTTP methods
type GetPaths = {
	[P in keyof paths]: paths[P] extends { get: any } ? P : never;
}[keyof paths];

type PostPaths = {
	[P in keyof paths]: paths[P] extends { post: any } ? P : never;
}[keyof paths];

type PutPaths = {
	[P in keyof paths]: paths[P] extends { put: any } ? P : never;
}[keyof paths];

type DeletePaths = {
	[P in keyof paths]: paths[P] extends { delete: any } ? P : never;
}[keyof paths];

type PatchPaths = {
	[P in keyof paths]: paths[P] extends { patch: any } ? P : never;
}[keyof paths];

// Generic server-side data fetcher with proper typing
export async function fetchServerData<T>(
	method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
	path: keyof paths,
	options?: any,
): Promise<T | null> {
	try {
		const client = await createServerApiClient();

		let response: { data?: T; error?: any };
		const requestOptions = options ?? {};

		switch (method) {
			case "GET":
				response = await client.GET(path as GetPaths, requestOptions);
				break;
			case "POST":
				response = await client.POST(path as PostPaths, requestOptions);
				break;
			case "PUT":
				response = await client.PUT(path as PutPaths, requestOptions);
				break;
			case "DELETE":
				response = await client.DELETE(path as DeletePaths, requestOptions);
				break;
			case "PATCH":
				response = await client.PATCH(path as PatchPaths, requestOptions);
				break;
			default:
				throw new Error(`Unsupported HTTP method: ${method}`);
		}

		if (!response || response.error) {
			return null;
		}

		return response.data ?? null;
	} catch (error) {
		console.error(`Server API error for ${method} ${path}:`, error);
		return null;
	}
}
