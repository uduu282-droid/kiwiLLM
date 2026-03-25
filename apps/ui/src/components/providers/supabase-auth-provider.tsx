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
				await clearServerSession();
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

			lastSyncedTokenRef.current = nextSession.access_token;
		},
		[auth, clearServerSession, config.apiUrl],
	);

	useEffect(() => {
		const {
			data: { subscription },
		} = auth.auth.onAuthStateChange((_event, session) => {
			setCurrentSession(session);
			setCurrentUser(session?.user ?? null);

			void syncServerSession(session)
				.catch((error: unknown) => {
					console.error("Failed to sync Supabase session", error);
				})
				.finally(() => {
					setIsReady(true);
				});
		});

		return () => {
			subscription.unsubscribe();
		};
	}, [auth, syncServerSession]);

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
