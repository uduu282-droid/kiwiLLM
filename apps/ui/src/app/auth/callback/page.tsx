"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { useAuthClient } from "@/lib/auth-client";

import type { Route } from "next";

export default function AuthCallbackPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const authClient = useAuthClient();

	useEffect(() => {
		if (!authClient.isReady) {
			return;
		}

		const next = searchParams.get("next") ?? "/dashboard";

		if (!authClient.currentUser) {
			router.replace("/login");
			return;
		}

		void authClient
			.syncServerSession(authClient.currentSession)
			.then(() => {
				router.replace(next as Route);
			})
			.catch(() => {
				router.replace("/login");
			});
	}, [
		authClient,
		authClient.currentSession,
		authClient.currentUser,
		authClient.isReady,
		router,
		searchParams,
	]);

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="flex items-center gap-2 text-sm text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				Completing sign in...
			</div>
		</div>
	);
}
