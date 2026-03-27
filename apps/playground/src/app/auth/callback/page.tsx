"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";

import { useAuthClient } from "@/lib/auth-client";

export default function AuthCallbackPage() {
	const router = useRouter();
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
			try {
				if (code && !authClient.currentSession) {
					const { error } =
						await authClient.auth.auth.exchangeCodeForSession(code);

					if (error) {
						throw error;
					}
				}

				const {
					data: { session },
				} = await authClient.auth.auth.getSession();

				if (!session?.user) {
					throw new Error(
						"No authenticated session found after OAuth callback.",
					);
				}

				hasHandledCallbackRef.current = true;
				await authClient.syncServerSession(session);
				router.replace(next);
			} catch {
				hasHandledCallbackRef.current = true;
				router.replace("/login");
			}
		})();
	}, [authClient, router, searchParams]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				Completing sign in...
			</div>
		</div>
	);
}
