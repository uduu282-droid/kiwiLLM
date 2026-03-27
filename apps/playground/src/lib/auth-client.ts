import { useMemo } from "react";

import { useSupabaseAuthContext } from "@/components/providers/supabase-auth-provider";

import type {
	Session as SupabaseSession,
	User as SupabaseUser,
} from "@supabase/supabase-js";

interface AuthCallbackContext {
	data: {
		user: {
			id: string;
			email: string;
			name: string | null;
		};
		requiresEmailVerification?: boolean;
	};
}

interface AuthErrorContext {
	error: {
		message: string;
	};
}

interface AuthResult {
	data?: AuthCallbackContext["data"];
	error?: AuthErrorContext["error"];
}

interface SocialAuthResult {
	data?: {
		provider: string;
		url?: string | null;
	};
	error?: AuthErrorContext["error"];
}

function getErrorMessage(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return "Authentication failed";
}

function getAuthError(error: unknown) {
	return {
		message: getErrorMessage(error),
	};
}

function mapSupabaseUser(user: SupabaseUser) {
	const metadata = user.user_metadata;

	const name =
		(typeof metadata?.name === "string" ? metadata.name : null) ??
		(typeof metadata?.full_name === "string" ? metadata.full_name : null) ??
		(typeof metadata?.user_name === "string" ? metadata.user_name : null) ??
		null;

	return {
		id: user.id,
		email: user.email ?? "",
		name,
	};
}

export function useAuthClient() {
	const {
		auth,
		currentUser,
		currentSession,
		isReady,
		syncServerSession,
		clearServerSession,
	} = useSupabaseAuthContext();

	return useMemo(
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
}

export function useAuth() {
	const authClient = useAuthClient();

	return useMemo(() => {
		const handleAuthError = (
			error: unknown,
			onError?: (ctx: AuthErrorContext) => void,
		): AuthResult => {
			const authError = getAuthError(error);
			onError?.({ error: authError });
			return { error: authError };
		};

		const handleAuthSuccess = async (
			user: SupabaseUser,
			session: SupabaseSession | null,
			onSuccess?: (ctx: AuthCallbackContext) => void,
		): Promise<AuthResult> => {
			if (session) {
				await authClient.syncServerSession(session);
			}

			const data = { user: mapSupabaseUser(user) };
			onSuccess?.({ data });
			return { data };
		};

		return {
			signIn: {
				email: async (
					input: { email: string; password: string },
					options?: {
						onSuccess?: (ctx: AuthCallbackContext) => void;
						onError?: (ctx: AuthErrorContext) => void;
					},
				): Promise<AuthResult> => {
					try {
						const { data, error } =
							await authClient.auth.auth.signInWithPassword({
								email: input.email,
								password: input.password,
							});

						if (error || !data.user) {
							throw error ?? new Error("Unable to sign in.");
						}

						return await handleAuthSuccess(
							data.user,
							data.session,
							options?.onSuccess,
						);
					} catch (error) {
						return handleAuthError(error, options?.onError);
					}
				},
				social: async (input: {
					provider: "github" | "google";
					callbackURL?: string;
				}): Promise<SocialAuthResult> => {
					try {
						const { data, error } = await authClient.auth.auth.signInWithOAuth({
							provider: input.provider,
							options: {
								redirectTo:
									input.callbackURL ??
									`${window.location.origin}/auth/callback?next=/`,
							},
						});

						if (error) {
							throw error;
						}

						return { data };
					} catch (error) {
						return { error: getAuthError(error) };
					}
				},
				passkey: async () => ({
					error: {
						message: "Passkeys are not available with Supabase auth.",
					},
				}),
			},
			signUp: {
				email: async (
					input: { email: string; password: string; name?: string },
					options?: {
						onSuccess?: (ctx: AuthCallbackContext) => void;
						onError?: (ctx: AuthErrorContext) => void;
					},
				): Promise<AuthResult> => {
					try {
						const { data, error } = await authClient.auth.auth.signUp({
							email: input.email,
							password: input.password,
							options: {
								data: {
									name: input.name ?? "",
								},
								emailRedirectTo: `${window.location.origin}/login?emailVerified=true`,
							},
						});

						if (error || !data.user) {
							throw error ?? new Error("Unable to sign up.");
						}

						if (!data.session) {
							const result = {
								data: {
									user: mapSupabaseUser(data.user),
									requiresEmailVerification: true,
								},
							};
							options?.onSuccess?.(result);
							return result;
						}

						return await handleAuthSuccess(
							data.user,
							data.session,
							options?.onSuccess,
						);
					} catch (error) {
						return handleAuthError(error, options?.onError);
					}
				},
			},
			signOut: async (options?: {
				fetchOptions?: {
					onSuccess?: () => void;
				};
			}) => {
				await authClient.auth.auth.signOut();
				await authClient.clearServerSession();
				options?.fetchOptions?.onSuccess?.();
				return { data: true };
			},
			useSession: () => ({
				data: authClient.currentUser
					? {
							user: mapSupabaseUser(authClient.currentUser),
						}
					: null,
				isPending: !authClient.isReady,
				error: null,
			}),
			getSession: async () =>
				authClient.currentUser
					? {
							data: {
								user: mapSupabaseUser(authClient.currentUser),
							},
						}
					: null,
		};
	}, [authClient]);
}
