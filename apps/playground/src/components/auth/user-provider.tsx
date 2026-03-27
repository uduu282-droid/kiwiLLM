"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";

import { useApi } from "@/lib/fetch-client";

import type { User } from "@/lib/types";

interface UserProviderProps {
	children: React.ReactNode;
	initialUserData?: { user: User } | null;
}

export function UserProvider({ children, initialUserData }: UserProviderProps) {
	const queryClient = useQueryClient();
	const hasSetInitialData = useRef(false);
	const api = useApi();

	useEffect(() => {
		if (!initialUserData || hasSetInitialData.current) {
			return;
		}

		const queryKey = api.queryOptions("get", "/user/me", {}).queryKey;
		queryClient.setQueryData(queryKey, initialUserData);
		hasSetInitialData.current = true;
	}, [api, initialUserData, queryClient]);

	return children;
}
