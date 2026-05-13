"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { AppConfig } from "@/lib/config-server";

let supabaseClientInstance: SupabaseClient | null = null;

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
				// The callback page performs an explicit exchangeCodeForSession(code).
				// Keep URL session detection off to avoid duplicate/racy PKCE exchanges.
				detectSessionInUrl: false,
				flowType: "pkce",
				persistSession: true,
			},
		},
	);

	return supabaseClientInstance;
}
