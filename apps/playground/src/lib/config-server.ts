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
}

export function getConfig(): AppConfig {
	const apiUrl = process.env.API_URL ?? "http://localhost:4002";
	return {
		hosted: process.env.HOSTED === "true",
		apiUrl,
		apiBackendUrl: process.env.API_BACKEND_URL ?? apiUrl,
		githubUrl:
			process.env.GITHUB_URL ?? "https://github.com/uduu282-droid/kiwiLLM",
		discordUrl: process.env.DISCORD_URL ?? "https://discord.gg/gcqcZeYWEz",
		twitterUrl: process.env.TWITTER_URL ?? "https://kiwillm.in",
		docsUrl: process.env.DOCS_URL ?? "https://kiwillm.in",
		adminUrl: process.env.ADMIN_URL ?? "https://app.kiwillm.in",
		posthogKey: process.env.POSTHOG_KEY,
		posthogHost: process.env.POSTHOG_HOST,
		crispId: process.env.CRISP_ID,
	};
}
