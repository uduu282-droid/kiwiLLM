"use client";

import { useRouter, usePathname } from "next/navigation";
import { useMemo, useCallback } from "react";

import { useUser } from "@/hooks/useUser";
import { useApi } from "@/lib/fetch-client";
import { LIVE_DASHBOARD_REFRESH_MS } from "@/lib/live-refresh";

import type { BillingAccount, Organization, Project } from "@/lib/types";

interface PersonalBillingResponse extends BillingAccount {
	createdAt: string;
	updatedAt: string;
}

interface UseDashboardStateProps {
	initialOrganizationsData?: unknown;
	initialProjectsData?: unknown;
	selectedOrgId?: string;
	selectedProjectId?: string;
}

export function useDashboardState({
	initialOrganizationsData,
	initialProjectsData,
	selectedOrgId,
	selectedProjectId,
}: UseDashboardStateProps = {}) {
	const router = useRouter();
	const pathname = usePathname();
	const api = useApi();

	useUser({ redirectTo: "/login", redirectWhen: "unauthenticated" });

	// Fetch organizations
	const { data: organizationsData } = api.useQuery(
		"get",
		"/orgs",
		{},
		{
			initialData: initialOrganizationsData as
				| { organizations: Organization[] }
				| undefined,
			staleTime: LIVE_DASHBOARD_REFRESH_MS,
			refetchOnWindowFocus: false,
			refetchInterval: LIVE_DASHBOARD_REFRESH_MS,
			refetchIntervalInBackground: true,
		},
	);
	const organizations = useMemo(
		() => organizationsData?.organizations ?? [],
		[organizationsData?.organizations],
	);

	const { data: rawPersonalOrgData } = api.useQuery(
		"get",
		"/dev-plans/personal-org",
		{},
		{
			staleTime: LIVE_DASHBOARD_REFRESH_MS,
			refetchOnWindowFocus: false,
			refetchInterval: LIVE_DASHBOARD_REFRESH_MS,
			refetchIntervalInBackground: true,
		},
	);
	const personalOrgData = rawPersonalOrgData as PersonalBillingResponse | undefined;

	// Derive selected organization from props or default to first
	const selectedOrganization = useMemo(() => {
		if (selectedOrgId) {
			return organizations.find((org) => org.id === selectedOrgId) ?? null;
		}
		return organizations[0] ?? null;
	}, [selectedOrgId, organizations]);

	// Fetch projects for selected organization
	const { data: projectsData } = api.useQuery(
		"get",
		"/orgs/{id}/projects",
		{
			params: {
				path: {
					id: selectedOrganization?.id ?? "",
				},
			},
		},
		{
			enabled: !!selectedOrganization?.id,
			initialData: initialProjectsData as { projects: Project[] } | undefined,
			staleTime: 5 * 60 * 1000, // 5 minutes
			refetchOnWindowFocus: false,
		},
	);

	// Get current projects from query data
	const projects = useMemo(
		() => projectsData?.projects ?? [],
		[projectsData?.projects],
	);

	// Derive selected project from props
	const selectedProject = useMemo(() => {
		if (selectedProjectId && projects.length > 0) {
			return (
				projects.find((project) => project.id === selectedProjectId) ?? null
			);
		}
		return projects[0] ?? null;
	}, [selectedProjectId, projects]);

	const billingAccount = useMemo<BillingAccount | null>(() => {
		if (selectedOrganization) {
			return {
				id: selectedOrganization.id,
				name: selectedOrganization.name,
				credits: selectedOrganization.credits,
				isPersonal: selectedOrganization.isPersonal,
				plan: selectedOrganization.plan,
				planExpiresAt: selectedOrganization.planExpiresAt
					? new Date(selectedOrganization.planExpiresAt).toISOString()
					: null,
				billingEmail: selectedOrganization.billingEmail,
				autoTopUpEnabled: selectedOrganization.autoTopUpEnabled,
				autoTopUpThreshold: selectedOrganization.autoTopUpThreshold,
				autoTopUpAmount: selectedOrganization.autoTopUpAmount,
				devPlan: selectedOrganization.devPlan,
				devPlanCreditsUsed: selectedOrganization.devPlanCreditsUsed,
				devPlanCreditsLimit: selectedOrganization.devPlanCreditsLimit,
				devPlanBillingCycleStart:
					selectedOrganization.devPlanBillingCycleStart
						? new Date(
								selectedOrganization.devPlanBillingCycleStart,
							).toISOString()
						: null,
				devPlanCancelled: false,
				devPlanExpiresAt: selectedOrganization.devPlanExpiresAt
					? new Date(selectedOrganization.devPlanExpiresAt).toISOString()
					: null,
				devPlanAllowAllModels: selectedOrganization.devPlanAllowAllModels,
			};
		}

		if (personalOrgData) {
			return {
				id: personalOrgData.id,
				name: personalOrgData.name,
				credits: personalOrgData.credits,
				isPersonal: personalOrgData.isPersonal,
				plan: personalOrgData.plan,
				planExpiresAt: personalOrgData.planExpiresAt,
				billingEmail: personalOrgData.billingEmail,
				autoTopUpEnabled: personalOrgData.autoTopUpEnabled,
				autoTopUpThreshold: personalOrgData.autoTopUpThreshold,
				autoTopUpAmount: personalOrgData.autoTopUpAmount,
				devPlan: personalOrgData.devPlan,
				devPlanCreditsUsed: personalOrgData.devPlanCreditsUsed,
				devPlanCreditsLimit: personalOrgData.devPlanCreditsLimit,
				devPlanBillingCycleStart: personalOrgData.devPlanBillingCycleStart,
				devPlanCancelled: personalOrgData.devPlanCancelled,
				devPlanExpiresAt: personalOrgData.devPlanExpiresAt,
				devPlanAllowAllModels: personalOrgData.devPlanAllowAllModels,
			};
		}

		return null;
	}, [personalOrgData, selectedOrganization]);

	// Navigation functions for the new route structure
	const handleOrganizationCreated = useCallback(
		(org: Organization) => {
			// Navigate to the new organization with first project
			router.push(`/dashboard/${org.id}`);
		},
		[router],
	);

	const handleProjectCreated = useCallback(
		(project: Project) => {
			// Navigate to the new project
			router.push(`/dashboard/${project.organizationId}/${project.id}`);
		},
		[router],
	);

	const handleOrganizationSelect = useCallback(
		(org: Organization | null) => {
			if (org?.id) {
				// Navigate to the new organization (will redirect to first project)
				router.push(`/dashboard/${org.id}`);
			}
		},
		[router],
	);

	const handleProjectSelect = useCallback(
		(project: Project | null) => {
			if (project?.id) {
				// Extract the current page from pathname (e.g., 'api-keys', 'provider-keys', etc.)
				const pathParts = pathname.split("/");
				const currentPage = pathParts[4]; // /dashboard/[orgId]/[projectId]/[page]

				if (currentPage && pathParts.length > 4) {
					// Preserve the current page when changing projects
					router.push(
						`/dashboard/${project.organizationId}/${project.id}/${currentPage}`,
					);
				} else {
					// Navigate to the new project dashboard
					router.push(`/dashboard/${project.organizationId}/${project.id}`);
				}
			}
		},
		[router, pathname],
	);

	return {
		selectedOrganization,
		billingAccount,
		selectedProject,
		organizations,
		projects,
		handleOrganizationSelect,
		handleProjectSelect,
		handleOrganizationCreated,
		handleProjectCreated,
	};
}
