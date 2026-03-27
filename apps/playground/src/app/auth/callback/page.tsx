"use client";

import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useAuthClient } from "@/lib/auth-client";

import type { Session as SupabaseSession } from "@supabase/supabase-js";

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

export default function AuthCallbackPage() {
	const searchParams = useSearchParams();
	const authClient = useAuthClient();
	const hasHandledCallbackRef = useRef(false);

	useEffect(() => {
		if (hasHandledCallbackRef.current) {
			return;
		}

		const next = searchParams.get("next") ?? "/";
		const code = searchParams.get("code");

		void (async () => {
			let exchangedSession: SupabaseSession | null = null;

			try {
				if (code && !authClient.currentSession) {
					const { data, error } =
						await authClient.auth.auth.exchangeCodeForSession(code);

					if (error) {
						throw error;
					}

					exchangedSession = data.session;
				}

				const session =
					exchangedSession ??
					authClient.currentSession ??
					(await authClient.auth.auth.getSession()).data.session;

				if (!session?.user) {
					throw new Error(
						"No authenticated session found after OAuth callback.",
					);
				}

				hasHandledCallbackRef.current = true;
				await authClient.syncServerSession(session);
				window.location.replace(next);
			} catch {
				const resumeAuthUrl = `/login?resumeAuth=true&returnUrl=${encodeURIComponent(next)}`;
				let recoveredSession = exchangedSession;
				const retryDelaysMs = [0, 250, 500, 1000, 2000];

				for (const retryDelayMs of retryDelaysMs) {
					if (recoveredSession?.user) {
						break;
					}

					if (retryDelayMs > 0) {
						await sleep(retryDelayMs);
					}

					recoveredSession = (await authClient.auth.auth.getSession()).data
						.session;
				}

				hasHandledCallbackRef.current = true;
				window.location.replace(
					recoveredSession?.user ? resumeAuthUrl : resumeAuthUrl,
				);
			}
		})();
	}, [authClient, searchParams]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				Completing sign in...
			</div>
		</div>
	);
}
