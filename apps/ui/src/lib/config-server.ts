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
	const hosted = process.env.HOSTED === "true";
	const appUrl =
		process.env.APP_URL ??
		(hosted ? "https://app.kiwillm.in" : "http://localhost:3002");
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
	const githubAuthEnabled =
		process.env.SUPABASE_GITHUB_AUTH === "false"
			? false
			: !!process.env.GITHUB_CLIENT_ID || supabaseConfigured;
	const googleAuthEnabled =
		process.env.SUPABASE_GOOGLE_AUTH === "false" ? false : supabaseConfigured;
	return {
		hosted,
		appUrl,
		apiUrl,
		apiBackendUrl: process.env.API_BACKEND_URL ?? apiUrl,
		gatewayUrl:
			process.env.GATEWAY_URL ??
			(hosted ? "https://api.kiwillm.in" : "http://localhost:4001"),
		githubUrl:
			process.env.GITHUB_URL ?? "https://github.com/uduu282-droid/kiwiLLM",
		discordUrl: process.env.DISCORD_URL ?? "https://discord.gg/gcqcZeYWEz",
		twitterUrl: process.env.TWITTER_URL ?? "https://kiwillm.in",
		docsUrl:
			process.env.DOCS_URL ??
			(hosted ? "https://kiwillm.in" : "http://localhost:3005"),
		playgroundUrl:
			process.env.PLAYGROUND_URL ??
			(hosted ? "https://chat.kiwillm.in" : "http://localhost:3003"),
		adminUrl:
			process.env.ADMIN_URL ??
			(hosted ? "https://app.kiwillm.in" : "http://localhost:3006"),
		posthogKey: process.env.POSTHOG_KEY,
		posthogHost: process.env.POSTHOG_HOST,
		crispId: process.env.CRISP_ID,
		githubAuth: githubAuthEnabled,
		googleAuth: googleAuthEnabled,
		supabaseUrl,
		supabaseAnonKey,
	};
}
