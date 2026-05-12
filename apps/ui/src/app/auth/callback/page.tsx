"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useAuthClient } from "@/lib/auth-client";

import type { Session as SupabaseSession } from "@supabase/supabase-js";

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

type DebugLogger = (step: string, details?: Record<string, unknown>) => void;

function getErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return String(error);
}

async function syncSessionWithRetry(
	authClient: ReturnType<typeof useAuthClient>,
	session: SupabaseSession,
	debug: DebugLogger,
) {
	const retryDelaysMs = [0, 250, 500, 1000, 2000, 3000, 5000];
	let lastError: unknown = null;

	for (
		let attemptIndex = 0;
		attemptIndex < retryDelaysMs.length;
		attemptIndex++
	) {
		const retryDelayMs = retryDelaysMs[attemptIndex];
		if (retryDelayMs > 0) {
			await sleep(retryDelayMs);
		}

		try {
			debug("sync_server_session_attempt", {
				attempt: attemptIndex + 1,
				delayMs: retryDelayMs,
				userId: session.user.id,
			});
			await authClient.syncServerSession(session);
			debug("sync_server_session_ready", {
				attempt: attemptIndex + 1,
				userId: session.user.id,
			});
			return;
		} catch (error) {
			lastError = error;
			debug("sync_server_session_failed", {
				attempt: attemptIndex + 1,
				error: getErrorMessage(error),
			});
		}
	}

	if (lastError instanceof Error) {
		throw lastError;
	}

	throw new Error("Failed to sync server session.");
}

async function waitForAppSession(debug: DebugLogger) {
	const retryDelaysMs = [0, 250, 500, 1000, 2000, 3000, 5000];
	let lastStatus: number | null = null;
	let lastBody: unknown = null;

	for (
		let attemptIndex = 0;
		attemptIndex < retryDelaysMs.length;
		attemptIndex++
	) {
		const retryDelayMs = retryDelaysMs[attemptIndex];
		if (retryDelayMs > 0) {
			await sleep(retryDelayMs);
		}

		debug("app_session_ready_check", {
			attempt: attemptIndex + 1,
			delayMs: retryDelayMs,
		});

		const response = await fetch("/api/auth/ready", {
			cache: "no-store",
			credentials: "include",
		});

		if (response.ok) {
			debug("app_session_ready", { attempt: attemptIndex + 1 });
			return;
		}

		lastStatus = response.status;
		try {
			lastBody = await response.clone().json();
		} catch {
			lastBody = await response.text().catch(() => null);
		}
		debug("app_session_not_ready", {
			attempt: attemptIndex + 1,
			status: lastStatus,
			body: lastBody,
		});
	}

	throw new Error(
		`App session was not ready after sign in${lastStatus ? ` (last status: ${lastStatus})` : ""}${lastBody ? `: ${JSON.stringify(lastBody)}` : ""}.`,
	);
}

export default function AuthCallbackPage() {
	const authClient = useAuthClient();
	const hasHandledCallbackRef = useRef(false);
	const [debugStep, setDebugStep] = useState("Starting OAuth callback");
	const [failureMessage, setFailureMessage] = useState<string | null>(null);

	useEffect(() => {
		if (hasHandledCallbackRef.current) {
			return;
		}

		const params = new URLSearchParams(window.location.search);
		const next = params.get("next") ?? "/dashboard";
		const code = params.get("code");
		const debug: DebugLogger = (step, details) => {
			setDebugStep(step);
			console.info("[kiwillm auth callback]", step, details ?? {});
		};

		void (async () => {
			let exchangedSession: SupabaseSession | null = null;
			const auth = authClient.auth;

			try {
				debug("callback_started", {
					next,
					hasCode: !!code,
					hasCurrentSession: !!authClient.currentSession,
				});
				if (!auth) {
					throw new Error("Authentication is not configured.");
				}

				if (code && !authClient.currentSession) {
					debug("exchange_code_for_session_started");
					const { data, error } = await auth.auth.exchangeCodeForSession(code);

					if (error) {
						throw error;
					}

					exchangedSession = data.session;
					debug("exchange_code_for_session_ready", {
						hasSession: !!exchangedSession,
						userId: exchangedSession?.user.id,
					});
				}

				const session =
					exchangedSession ??
					authClient.currentSession ??
					(await auth.auth.getSession()).data.session;
				debug("session_resolved", {
					hasSession: !!session,
					userId: session?.user.id,
				});

				if (!session?.user) {
					throw new Error(
						"No authenticated session found after OAuth callback.",
					);
				}

				hasHandledCallbackRef.current = true;
				await syncSessionWithRetry(authClient, session, debug);
				await waitForAppSession(debug);
				debug("redirecting_to_dashboard", { next });
				window.location.replace(next);
			} catch (error) {
				debug("callback_primary_flow_failed", {
					error: getErrorMessage(error),
				});
				let recoveredSession = exchangedSession;
				const retryDelaysMs = [0, 250, 500, 1000, 2000, 3000, 5000];

				if (!auth) {
					hasHandledCallbackRef.current = true;
					setFailureMessage("Authentication is not configured.");
					return;
				}

				for (
					let attemptIndex = 0;
					attemptIndex < retryDelaysMs.length;
					attemptIndex++
				) {
					const retryDelayMs = retryDelaysMs[attemptIndex];
					if (recoveredSession?.user) {
						break;
					}

					if (retryDelayMs > 0) {
						await sleep(retryDelayMs);
					}

					recoveredSession = (await auth.auth.getSession()).data.session;
					debug("recover_session_attempt", {
						attempt: attemptIndex + 1,
						delayMs: retryDelayMs,
						hasSession: !!recoveredSession,
						userId: recoveredSession?.user.id,
					});
				}

				hasHandledCallbackRef.current = true;
				if (recoveredSession?.user) {
					try {
						await syncSessionWithRetry(authClient, recoveredSession, debug);
						await waitForAppSession(debug);
						debug("redirecting_to_dashboard_after_recovery", { next });
						window.location.replace(next);
						return;
					} catch (error) {
						const message = getErrorMessage(error);
						debug("callback_recovery_failed", { error: message });
						setFailureMessage(message);
						return;
					}
				}

				setFailureMessage("No authenticated session found after OAuth callback.");
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
					{failureMessage
						? "Sign in did not complete. Open DevTools Console and look for [kiwillm auth callback]."
						: "We're syncing your account and preparing the dashboard. This can take a few seconds on the first sign in."}
				</p>
				<p className="mt-2 max-w-xs break-words text-xs text-muted-foreground">
					{failureMessage ?? debugStep}
				</p>
			</div>
		</div>
	);
}
