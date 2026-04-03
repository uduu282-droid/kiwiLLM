import { getLastUsedProjectId } from "@/lib/last-used-project-server";
import { fetchServerData } from "@/lib/server-api";

interface ProjectLike {
	id: string;
	name: string;
}

interface LogLike {
	projectId: string;
	createdAt?: string | Date;
}

interface ApiKeyLike {
	projectId: string;
	updatedAt?: string | Date;
	createdAt?: string | Date;
}

function getTimestamp(value?: string | Date): number {
	if (!value) {
		return 0;
	}

	const parsed =
		value instanceof Date ? value.getTime() : new Date(value).getTime();
	return Number.isFinite(parsed) ? parsed : 0;
}

export async function resolvePreferredProjectId(
	orgId: string,
	projects: ProjectLike[],
): Promise<string | null> {
	if (!projects.length) {
		return null;
	}

	const validProjectIds = new Set(projects.map((project) => project.id));

	const lastUsedProjectId = await getLastUsedProjectId(orgId);
	if (lastUsedProjectId && validProjectIds.has(lastUsedProjectId)) {
		return lastUsedProjectId;
	}

	const latestLogsData = await fetchServerData<{ logs: LogLike[] }>(
		"GET",
		"/logs",
		{
			params: {
				query: {
					orgId,
					orderBy: "createdAt_desc",
					limit: "50",
				},
			},
		},
	);

	const latestLoggedProjectId = (latestLogsData?.logs ?? []).find((log) =>
		validProjectIds.has(log.projectId),
	)?.projectId;
	if (latestLoggedProjectId) {
		return latestLoggedProjectId;
	}

	const apiKeysData = await fetchServerData<{ apiKeys: ApiKeyLike[] }>(
		"GET",
		"/keys/api",
	);

	const latestKeyProjectId = (apiKeysData?.apiKeys ?? [])
		.filter((apiKey) => validProjectIds.has(apiKey.projectId))
		.sort(
			(a, b) =>
				Math.max(getTimestamp(b.updatedAt), getTimestamp(b.createdAt)) -
				Math.max(getTimestamp(a.updatedAt), getTimestamp(a.createdAt)),
		)[0]?.projectId;

	if (latestKeyProjectId) {
		return latestKeyProjectId;
	}

	return projects[0]?.id ?? null;
}
