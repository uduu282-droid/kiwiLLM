import { RecentLogs } from "@/components/activity/recent-logs";
import { fetchServerData } from "@/lib/server-api";

import type { LogsData } from "@/types/activity";

export default async function ActivityPage({
	params,
	searchParams,
}: {
	params: Promise<{ orgId: string; projectId: string }>;
	searchParams?: Promise<{
		days?: string;
		page?: string;
		startDate?: string;
		endDate?: string;
		finishReason?: string;
		unifiedFinishReason?: string;
		model?: string;
		limit?: string;
		customHeaderKey?: string;
		customHeaderValue?: string;
	}>;
}) {
	const { orgId, projectId } = await params;
	const searchParamsData = await searchParams;

	// Build query parameters for logs - same as client-side
	const logsQueryParams: Record<string, string> = {
		orderBy: "createdAt_desc",
		projectId,
		limit: "25",
		page: searchParamsData?.page ?? "1",
	};

	// Add optional filter parameters if they exist
	if (searchParamsData?.startDate) {
		logsQueryParams.startDate = searchParamsData.startDate;
	}
	if (searchParamsData?.endDate) {
		logsQueryParams.endDate = searchParamsData.endDate;
	}
	if (
		searchParamsData?.finishReason &&
		searchParamsData.finishReason !== "all"
	) {
		logsQueryParams.finishReason = searchParamsData.finishReason;
	}
	if (
		searchParamsData?.unifiedFinishReason &&
		searchParamsData.unifiedFinishReason !== "all"
	) {
		logsQueryParams.unifiedFinishReason = searchParamsData.unifiedFinishReason;
	}
	if (searchParamsData?.model && searchParamsData.model !== "all") {
		logsQueryParams.model = searchParamsData.model;
	}
	if (searchParamsData?.customHeaderKey) {
		logsQueryParams.customHeaderKey = searchParamsData.customHeaderKey;
	}
	if (searchParamsData?.customHeaderValue) {
		logsQueryParams.customHeaderValue = searchParamsData.customHeaderValue;
	}

	if (searchParamsData?.limit) {
		logsQueryParams.limit = searchParamsData.limit;
	}

	// Server-side data fetching for logs with all query parameters
	const initialLogsData = await fetchServerData<LogsData>("GET", "/logs", {
		params: {
			query: logsQueryParams,
		},
	});

	return (
		<div className="flex flex-col">
			<div className="flex-1 p-4 pt-6 md:p-8">
				<div className="mx-auto w-full max-w-[1600px]">
					<RecentLogs
						initialData={initialLogsData ?? undefined}
						projectId={projectId}
						orgId={orgId}
					/>
				</div>
			</div>
		</div>
	);
}
