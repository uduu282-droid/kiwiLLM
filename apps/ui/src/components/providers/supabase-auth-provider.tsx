"use client";

import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";

import { useAppConfig } from "@/lib/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

import type {
	AuthChangeEvent,
	Session as SupabaseSession,
	SupabaseClient,
	User as SupabaseUser,
} from "@supabase/supabase-js";

interface SupabaseAuthContextValue {
	auth: SupabaseClient;
	currentUser: SupabaseUser | null;
	currentSession: SupabaseSession | null;
	isReady: boolean;
	syncServerSession: (session?: SupabaseSession | null) => Promise<void>;
	clearServerSession: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(
	null,
);

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function safeFetch(url: string, init: RequestInit) {
	try {
		await fetch(url, init);
	} catch (error) {
		console.error("Supabase auth sync failed", error);
	}
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
	const config = useAppConfig();
	const auth = useMemo(() => getSupabaseBrowserClient(config), [config]);
	const [currentSession, setCurrentSession] = useState<SupabaseSession | null>(
		null,
	);
	const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
	const [isReady, setIsReady] = useState(false);
	const lastSyncedTokenRef = useRef<string | null>(null);

	const waitForServerSession = useCallback(async () => {
		const retryDelaysMs = [0, 150, 300, 600, 1200];

		for (const retryDelayMs of retryDelaysMs) {
			if (retryDelayMs > 0) {
				await sleep(retryDelayMs);
			}

			const response = await fetch(`${config.apiUrl}/user/me`, {
				method: "GET",
				credentials: "include",
				cache: "no-store",
			});

			if (response.ok) {
				return;
			}
		}

		throw new Error("Server session was not ready after sign in.");
	}, [config.apiUrl]);

	const clearServerSession = useCallback(async () => {
		lastSyncedTokenRef.current = null;
		await safeFetch(`${config.apiUrl}/auth/supabase/sign-out`, {
			method: "POST",
			credentials: "include",
		});
	}, [config.apiUrl]);

	const syncServerSession = useCallback(
		async (sessionOverride?: SupabaseSession | null) => {
			const nextSession =
				sessionOverride ?? (await auth.auth.getSession()).data.session;

			if (!nextSession?.access_token) {
				return;
			}

			if (lastSyncedTokenRef.current === nextSession.access_token) {
				return;
			}

			const response = await fetch(`${config.apiUrl}/auth/supabase/session`, {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					accessToken: nextSession.access_token,
					refreshToken: nextSession.refresh_token,
				}),
			});

			if (!response.ok) {
				throw new Error("Failed to create Supabase session");
			}

			await waitForServerSession();
			lastSyncedTokenRef.current = nextSession.access_token;
		},
		[auth, config.apiUrl, waitForServerSession],
	);

	useEffect(() => {
		let isMounted = true;

		void auth.auth
			.getSession()
			.then(async ({ data: { session } }) => {
				if (!isMounted) {
					return;
				}

				setCurrentSession(session);
				setCurrentUser(session?.user ?? null);

				if (session) {
					await syncServerSession(session);
				}
			})
			.catch((error: unknown) => {
				console.error("Failed to restore Supabase session", error);
			})
			.finally(() => {
				if (isMounted) {
					setIsReady(true);
				}
			});

		const {
			data: { subscription },
		} = auth.auth.onAuthStateChange(
			(event: AuthChangeEvent, session: SupabaseSession | null) => {
				if (!isMounted || event === "INITIAL_SESSION") {
					return;
				}

				setCurrentSession(session);
				setCurrentUser(session?.user ?? null);

				const nextAction =
					event === "SIGNED_OUT"
						? clearServerSession()
						: session
							? syncServerSession(session)
							: Promise.resolve();

				void nextAction
					.catch((error: unknown) => {
						console.error("Failed to sync Supabase session", error);
					})
					.finally(() => {
						if (isMounted) {
							setIsReady(true);
						}
					});
			},
		);

		return () => {
			isMounted = false;
			subscription.unsubscribe();
		};
	}, [auth, clearServerSession, syncServerSession]);

	const value = useMemo<SupabaseAuthContextValue>(
		() => ({
			auth,
			currentUser,
			currentSession,
			isReady,
			syncServerSession,
			clearServerSession,
		}),
		[
			auth,
			clearServerSession,
			currentSession,
			currentUser,
			isReady,
			syncServerSession,
		],
	);

	return <SupabaseAuthContext value={value}>{children}</SupabaseAuthContext>;
}

export function useSupabaseAuthContext() {
	const context = use(SupabaseAuthContext);

	if (!context) {
		throw new Error(
			"useSupabaseAuthContext must be used within a SupabaseAuthProvider",
		);
	}

	return context;
}
