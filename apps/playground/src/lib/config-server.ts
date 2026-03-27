export interface AppConfig {
	hosted: boolean;
	apiUrl: string;
	apiBackendUrl: string;
	githubUrl: string;
	discordUrl: string;
	twitterUrl: string;
	docsUrl: string;
	adminUrl: string;
	posthogKey?: string;
	posthogHost?: string;
	crispId?: string;
	githubAuth: boolean;
	googleAuth: boolean;
	supabaseUrl?: string;
	supabaseAnonKey?: string;
}

export function getConfig(): AppConfig {
	const hosted = process.env.HOSTED === "true";
	const apiUrl =
		process.env.API_URL ??
		(hosted ? "https://api.kiwillm.in" : "http://localhost:4002");
	const supabaseUrl =
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
	const supabaseAnonKey =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
		process.env.SUPABASE_ANON_KEY;
	const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
	return {
		hosted,
		apiUrl,
		apiBackendUrl: process.env.API_BACKEND_URL ?? apiUrl,
		githubUrl:
			process.env.GITHUB_URL ?? "https://github.com/uduu282-droid/kiwiLLM",
		discordUrl: process.env.DISCORD_URL ?? "https://discord.gg/gcqcZeYWEz",
		twitterUrl: process.env.TWITTER_URL ?? "https://kiwillm.in",
		docsUrl:
			process.env.DOCS_URL ??
			(hosted ? "https://kiwillm.in" : "http://localhost:3005"),
		adminUrl:
			process.env.ADMIN_URL ??
			(hosted ? "https://app.kiwillm.in" : "http://localhost:3006"),
		posthogKey: process.env.POSTHOG_KEY,
		posthogHost: process.env.POSTHOG_HOST,
		crispId: process.env.CRISP_ID,
		githubAuth:
			process.env.SUPABASE_GITHUB_AUTH === "false"
				? false
				: !!process.env.GITHUB_CLIENT_ID || supabaseConfigured,
		googleAuth:
			process.env.SUPABASE_GOOGLE_AUTH === "false" ? false : supabaseConfigured,
		supabaseUrl,
		supabaseAnonKey,
	};
}
