"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { useAuthClient } from "@/lib/auth-client";

import type { Session as SupabaseSession } from "@supabase/supabase-js";

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

export default function AuthCallbackPage() {
	const authClient = useAuthClient();
	const hasHandledCallbackRef = useRef(false);

	useEffect(() => {
		if (hasHandledCallbackRef.current) {
			return;
		}

		const params = new URLSearchParams(window.location.search);
		const next = params.get("next") ?? "/dashboard";
		const code = params.get("code");

		void (async () => {
			let exchangedSession: SupabaseSession | null = null;
			const auth = authClient.auth;

			try {
				if (!auth) {
					throw new Error("Authentication is not configured.");
				}

				if (code && !authClient.currentSession) {
					const { data, error } = await auth.auth.exchangeCodeForSession(code);

					if (error) {
						throw error;
					}

					exchangedSession = data.session;
				}

				const session =
					exchangedSession ??
					authClient.currentSession ??
					(await auth.auth.getSession()).data.session;

				if (!session?.user) {
					throw new Error(
						"No authenticated session found after OAuth callback.",
					);
				}

				hasHandledCallbackRef.current = true;
				await authClient.syncServerSession(session);
				window.location.replace(next);
			} catch {
				const resumeAuthUrl = `/login?resumeAuth=true&next=${encodeURIComponent(next)}`;
				let recoveredSession = exchangedSession;
				const retryDelaysMs = [0, 250, 500, 1000, 2000];

				if (!auth) {
					hasHandledCallbackRef.current = true;
					window.location.replace(resumeAuthUrl);
					return;
				}

				for (const retryDelayMs of retryDelaysMs) {
					if (recoveredSession?.user) {
						break;
					}

					if (retryDelayMs > 0) {
						await sleep(retryDelayMs);
					}

					recoveredSession = (await auth.auth.getSession()).data.session;
				}

				hasHandledCallbackRef.current = true;
				if (recoveredSession?.user) {
					window.location.replace(next);
					return;
				}

				window.location.replace(resumeAuthUrl);
			}
		})();
	}, [authClient]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="rounded-lg border border-border/60 bg-background/95 px-5 py-4 text-center shadow-xs">
				<div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
					<Loader2 className="h-4 w-4 animate-spin" />
					Completing sign in
				</div>
				<p className="mt-2 max-w-xs text-sm text-muted-foreground">
					We&apos;re syncing your account and preparing the dashboard. This can
					take a few seconds on the first sign in.
				</p>
			</div>
		</div>
	);
}
