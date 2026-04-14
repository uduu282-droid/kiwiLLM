import { redirect } from "next/navigation";

import { resolvePreferredProjectId } from "@/lib/default-project-server";
import { fetchServerData } from "@/lib/server-api";

import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
	const [initialUserData, initialOrganizationsData] = await Promise.all([
		fetchServerData<{ user: User } | undefined | null>("GET", "/user/me"),
		fetchServerData("GET", "/orgs"),
	]);

	// Redirect to login if not authenticated
	if (!initialUserData?.user) {
		redirect("/login");
	}

	// Check if organizations data is null (API error)
	if (!initialOrganizationsData) {
		redirect("/login?next=/dashboard");
	}

	// Determine default organization and project for redirect
	if (
		initialOrganizationsData &&
		typeof initialOrganizationsData === "object"
	) {
		const data = initialOrganizationsData as {
			organizations?: Array<{ id: string; name: string }>;
		};

		if (data.organizations && data.organizations.length > 0) {
			const defaultOrgId = data.organizations[0].id;

			// Fetch projects for the default organization
			const projectsData = await fetchServerData("GET", "/orgs/{id}/projects", {
				params: {
					path: {
						id: defaultOrgId,
					},
				},
			});

			// Check if projects data is null (API error)
			if (!projectsData) {
				redirect(`/dashboard/${defaultOrgId}`);
			}

			if (projectsData && typeof projectsData === "object") {
				const projects = projectsData as {
					projects?: Array<{ id: string; name: string }>;
				};

				if (projects.projects && projects.projects.length > 0) {
					const defaultProjectId = await resolvePreferredProjectId(
						defaultOrgId,
						projects.projects,
					);

					if (!defaultProjectId) {
						redirect(`/dashboard/${defaultOrgId}`);
					}

					// Redirect to the proper route structure
					redirect(`/dashboard/${defaultOrgId}/${defaultProjectId}`);
				}
			}

			// If no projects found, redirect to organization level
			redirect(`/dashboard/${defaultOrgId}`);
		}
	}

	// If no organizations found, send user to login flow
	redirect("/login?next=/dashboard");
}
