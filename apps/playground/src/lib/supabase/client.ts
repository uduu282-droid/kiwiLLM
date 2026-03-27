"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { AppConfig } from "@/lib/config-server";

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseBrowserClient(config: AppConfig) {
	if (!config.supabaseUrl || !config.supabaseAnonKey) {
		throw new Error(
			"Supabase is not configured. Missing NEXT_PUBLIC_SUPABASE_URL or publishable key.",
		);
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
				detectSessionInUrl: true,
				flowType: "pkce",
				persistSession: true,
			},
		},
	);

	return supabaseClientInstance;
}
