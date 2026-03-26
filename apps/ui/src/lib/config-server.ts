export interface AppConfig {
	hosted: boolean;
	appUrl: string;
	apiUrl: string;
	apiBackendUrl: string;
	gatewayUrl: string;
	githubUrl: string;
	discordUrl: string;
	twitterUrl: string;
	docsUrl: string;
	playgroundUrl: string;
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
	const apiUrl = process.env.API_URL ?? "http://localhost:4002";
	const supabaseUrl =
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
	const supabaseAnonKey =
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
		process.env.SUPABASE_ANON_KEY;
	const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey);
	const githubAuthEnabled =
		process.env.SUPABASE_GITHUB_AUTH === "false"
			? false
			: !!process.env.GITHUB_CLIENT_ID || supabaseConfigured;
	const googleAuthEnabled =
		process.env.SUPABASE_GOOGLE_AUTH === "false" ? false : supabaseConfigured;
	return {
		hosted: process.env.HOSTED === "true",
		appUrl: process.env.APP_URL ?? "http://localhost:3002",
		apiUrl,
		apiBackendUrl: process.env.API_BACKEND_URL ?? apiUrl,
		gatewayUrl: process.env.GATEWAY_URL ?? "http://localhost:4001",
		githubUrl:
			process.env.GITHUB_URL ?? "https://github.com/theopenco/llmgateway",
		discordUrl: process.env.DISCORD_URL ?? "https://discord.gg/gcqcZeYWEz",
		twitterUrl: process.env.TWITTER_URL ?? "https://x.com/llmgateway",
		docsUrl: process.env.DOCS_URL ?? "http://localhost:3005",
		playgroundUrl: process.env.PLAYGROUND_URL ?? "http://localhost:3003",
		adminUrl: process.env.ADMIN_URL ?? "http://localhost:3006",
		posthogKey: process.env.POSTHOG_KEY,
		posthogHost: process.env.POSTHOG_HOST,
		crispId: process.env.CRISP_ID,
		githubAuth: githubAuthEnabled,
		googleAuth: googleAuthEnabled,
		supabaseUrl,
		supabaseAnonKey,
	};
}
