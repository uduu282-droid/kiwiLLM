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
	auth: SupabaseClient | null;
	currentUser: SupabaseUser | null;
	currentSession: SupabaseSession | null;
	isReady: boolean;
	syncServerSession: (session?: SupabaseSession | null) => Promise<void>;
	clearServerSession: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | null>(
	null,
);

async function safeFetch(url: string, init: RequestInit) {
	try {
		return await fetch(url, init);
	} catch (error) {
		console.error("Supabase auth sync failed", error);
		return null;
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
	const inFlightSyncRef = useRef<Promise<void> | null>(null);
	const inFlightSyncTokenRef = useRef<string | null>(null);

	const resetAuthState = useCallback(() => {
		setCurrentSession(null);
		setCurrentUser(null);
		setIsReady(true);
	}, []);

	const clearServerSession = useCallback(async () => {
		lastSyncedTokenRef.current = null;
		inFlightSyncRef.current = null;
		inFlightSyncTokenRef.current = null;
		await safeFetch(`${config.apiUrl}/auth/supabase/sign-out`, {
			method: "POST",
			credentials: "include",
		});
	}, [config.apiUrl]);

	const syncServerSession = useCallback(
		async (sessionOverride?: SupabaseSession | null) => {
			if (!auth) {
				return;
			}

			const nextSession =
				sessionOverride ?? (await auth.auth.getSession()).data.session;

			if (!nextSession?.access_token) {
				return;
			}

			if (lastSyncedTokenRef.current === nextSession.access_token) {
				return;
			}

			if (
				inFlightSyncRef.current &&
				inFlightSyncTokenRef.current === nextSession.access_token
			) {
				await inFlightSyncRef.current;
				return;
			}

			const syncPromise = (async () => {
				const response = await safeFetch(
					`${config.apiUrl}/auth/supabase/session`,
					{
						method: "POST",
						credentials: "include",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							accessToken: nextSession.access_token,
							refreshToken: nextSession.refresh_token,
						}),
					},
				);

				if (!response?.ok) {
					throw new Error("Failed to create Supabase session");
				}

				lastSyncedTokenRef.current = nextSession.access_token;
			})();

			inFlightSyncRef.current = syncPromise;
			inFlightSyncTokenRef.current = nextSession.access_token;

			try {
				await syncPromise;
			} finally {
				if (inFlightSyncRef.current === syncPromise) {
					inFlightSyncRef.current = null;
					inFlightSyncTokenRef.current = null;
				}
			}
		},
		[auth, config.apiUrl],
	);

	useEffect(() => {
		if (!auth) {
			resetAuthState();
			return;
		}

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
					setIsReady(false);
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
				setIsReady(false);

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
	}, [auth, clearServerSession, resetAuthState, syncServerSession]);

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
