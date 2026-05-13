"use client";

import {
	createClient,
	type SupabaseClient,
	type SupportedStorage,
} from "@supabase/supabase-js";

import type { AppConfig } from "@/lib/config-server";

let supabaseClientInstance: SupabaseClient | null = null;

function cookieEscape(value: string) {
	return encodeURIComponent(value);
}

function cookieUnescape(value: string) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function readCookie(name: string) {
	if (typeof document === "undefined") {
		return null;
	}

	const encodedName = `${name}=`;
	const cookie = document.cookie
		.split(";")
		.map((entry) => entry.trim())
		.find((entry) => entry.startsWith(encodedName));

	if (!cookie) {
		return null;
	}

	return cookieUnescape(cookie.slice(encodedName.length));
}

function writeCookie(name: string, value: string) {
	if (typeof document === "undefined") {
		return;
	}

	document.cookie = `${name}=${cookieEscape(value)}; Path=/; Max-Age=${60 * 30}; SameSite=Lax; Secure`;
}

function clearCookie(name: string) {
	if (typeof document === "undefined") {
		return;
	}

	document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax; Secure`;
}

function createBrowserAuthStorage(): SupportedStorage {
	return {
		getItem(key: string) {
			try {
				const localValue = window.localStorage.getItem(key);
				if (localValue !== null) {
					return localValue;
				}
			} catch {}

			return readCookie(key);
		},
		setItem(key: string, value: string) {
			try {
				window.localStorage.setItem(key, value);
			} catch {}

			// Keep PKCE verifier in cookie as fallback across OAuth redirects.
			if (key.endsWith("-code-verifier")) {
				writeCookie(key, value);
			}
		},
		removeItem(key: string) {
			try {
				window.localStorage.removeItem(key);
			} catch {}

			if (key.endsWith("-code-verifier")) {
				clearCookie(key);
			}
		},
	};
}

export function getSupabaseBrowserClient(config: AppConfig) {
	if (!config.supabaseUrl || !config.supabaseAnonKey) {
		return null;
	}

	if (supabaseClientInstance) {
		return supabaseClientInstance;
	}

	supabaseClientInstance = createClient(
		config.supabaseUrl,
		config.supabaseAnonKey,
		{
			auth: {
				autoRefreshToken: true,
				detectSessionInUrl: false,
				flowType: "pkce",
				persistSession: true,
				storage: createBrowserAuthStorage(),
			},
		},
	);

	return supabaseClientInstance;
}
