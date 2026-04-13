"use client";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";

import { useAuthClient } from "@/lib/auth-client";
import { useApi } from "@/lib/fetch-client";

import type { Route } from "next";

export interface UserUpdateData {
	name?: string;
	email?: string;
}

export interface PasswordUpdateData {
	currentPassword: string;
	newPassword: string;
}

export interface UseUserOptions {
	redirectTo?: string;
	redirectWhen?: "authenticated" | "unauthenticated";
	checkOnboarding?: boolean;
}

function getHttpStatus(error: unknown): number | null {
	if (!error || typeof error !== "object") {
		return null;
	}

	const possibleStatus = Reflect.get(error, "status");
	if (typeof possibleStatus === "number") {
		return possibleStatus;
	}

	const possibleResponse = Reflect.get(error, "response");
	if (possibleResponse && typeof possibleResponse === "object") {
		const responseStatus = Reflect.get(possibleResponse, "status");
		if (typeof responseStatus === "number") {
			return responseStatus;
		}
	}

	return null;
}

export function useUser(options?: UseUserOptions) {
	const posthog = usePostHog();
	const router = useRouter();
	const api = useApi();
	const pathname = usePathname();
	const authClient = useAuthClient();
	const isAuthReady = authClient.isReady;

	const { data, isLoading, error } = api.useQuery(
		"get",
		"/user/me",
		{},
		{
			enabled: isAuthReady,
			retry: 0,
			staleTime: 5 * 60 * 1000, // 5 minutes
			refetchOnWindowFocus: false,
		},
	);

	useEffect(() => {
		if (!data?.user) {
			return;
		}

		posthog.identify(data.user.id, {
			email: data.user.email,
			name: data.user.name,
			onboarding_completed: data.user.onboardingCompleted,
		});
	}, [
		data?.user?.email,
		data?.user?.id,
		data?.user?.name,
		data?.user?.onboardingCompleted,
		posthog,
	]);

	// Check for onboarding completion for all authenticated users
	useEffect(() => {
		if (!isAuthReady || !data?.user || isLoading) {
			return;
		}

		const currentPath = pathname;
		const isAuthPage = ["/login", "/signup", "/onboarding"].includes(
			currentPath,
		);
		const isLandingPage = currentPath === "/";

		// Don't redirect if already on auth pages
		if (isAuthPage || isLandingPage) {
			return;
		}

		// Redirect to onboarding if user hasn't completed it
		if (!data.user.onboardingCompleted) {
			router.push("/onboarding");
		}
	}, [data?.user, isLoading, router, pathname]);

	// Handle existing redirect logic
	useEffect(() => {
		if (!isAuthReady || !options?.redirectTo || !options?.redirectWhen) {
			return;
		}

		const { redirectTo, redirectWhen, checkOnboarding } = options;
		const hasUser = !!data?.user;
		const errorStatus = getHttpStatus(error);
		const isUnauthenticatedError = errorStatus === 401 || errorStatus === 403;

		if (redirectWhen === "authenticated" && hasUser && !isLoading && !error) {
			if (checkOnboarding && !data.user.onboardingCompleted) {
				router.push("/onboarding");
			} else {
				router.push(redirectTo as Route);
			}
		} else if (
			redirectWhen === "unauthenticated" &&
			!isLoading &&
			(!hasUser || isUnauthenticatedError)
		) {
			router.push(redirectTo as Route);
		}
	}, [
		data?.user,
		isLoading,
		error,
		router,
		options?.redirectTo,
		options?.redirectWhen,
		options?.checkOnboarding,
		options,
		isAuthReady,
	]);

	return {
		user: data?.user ?? null,
		isLoading: !isAuthReady || isLoading,
		error,
		data,
	};
}

export function useUpdateUser() {
	const queryClient = useQueryClient();
	const api = useApi();

	return api.useMutation("patch", "/user/me", {
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: ["user"] });
			void queryClient.invalidateQueries({ queryKey: ["session"] });
		},
	});
}

export function useUpdatePassword() {
	const api = useApi();
	return api.useMutation("put", "/user/password");
}

export function useDeleteAccount() {
	const api = useApi();
	return api.useMutation("delete", "/user/me");
}
