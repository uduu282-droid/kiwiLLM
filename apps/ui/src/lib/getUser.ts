import { cookies } from "next/headers";

import PostHogClient from "@/app/posthog";
import { getConfig } from "@/lib/config-server";

export interface PublicUser {
	id: string;
	email: string;
	name: string | null;
	image: string | null;
	onboardingCompleted: boolean;
}

export async function getUser() {
	const posthog = PostHogClient();
	const config = getConfig();
	const cookieStore = await cookies();

	const supabaseSessionCookie = cookieStore.get(
		process.env.SUPABASE_SESSION_COOKIE_NAME ?? "sb-access-token",
	);
	const supabaseRefreshCookie = cookieStore.get(
		process.env.SUPABASE_REFRESH_COOKIE_NAME ?? "sb-refresh-token",
	);
	const betterAuthKey = "better-auth.session_token";
	const sessionCookie = cookieStore.get(`${betterAuthKey}`);
	const secureSessionCookie = cookieStore.get(`__Secure-${betterAuthKey}`);
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
		cookieHeaderParts.push(
			`__Secure-${betterAuthKey}=${secureSessionCookie.value}`,
		);
	} else if (sessionCookie?.value) {
		cookieHeaderParts.push(`${betterAuthKey}=${sessionCookie.value}`);
	}

	const data = await fetch(`${config.apiBackendUrl}/user/me`, {
		method: "GET",
		headers: {
			Cookie: cookieHeaderParts.join("; "),
		},
	});

	if (!data.ok) {
		return null;
	}

	const payload = (await data.json()) as { user?: PublicUser };
	const user = payload.user;

	if (!user) {
		return null;
	}

	if (posthog) {
		posthog.identify({
			distinctId: user.id,
			properties: {
				email: user.email,
				name: user.name,
			},
		});
	}

	return user;
}
