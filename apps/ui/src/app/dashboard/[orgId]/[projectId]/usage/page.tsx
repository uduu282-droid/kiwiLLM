import { subDays, format } from "date-fns";

import { UsageClient } from "@/components/usage/usage-client";
import { fetchServerData } from "@/lib/server-api";

import type { ActivitT } from "@/types/activity";

export default async function UsagePage({
	params,
	searchParams,
}: {
	params: Promise<{
		projectId: string;
	}>;
	searchParams?: Promise<{
		from?: string;
		to?: string;
		apiKeyId?: string;
	}>;
}) {
	const paramsData = await params;
	const projectId = paramsData.projectId;
	const searchParamsData = await searchParams;

	const today = new Date();
	const fromParam =
		searchParamsData?.from ?? format(subDays(today, 6), "yyyy-MM-dd");
	const toParam = searchParamsData?.to ?? format(today, "yyyy-MM-dd");
	const apiKeyId = searchParamsData?.apiKeyId;

	const initialActivityData = apiKeyId
		? null
		: await fetchServerData<ActivitT>("GET", "/activity", {
				params: {
					query: {
						from: fromParam,
						to: toParam,
						projectId,
					},
				},
			});

	return (
		<UsageClient
			initialActivityData={initialActivityData ?? undefined}
			projectId={projectId}
		/>
	);
}
