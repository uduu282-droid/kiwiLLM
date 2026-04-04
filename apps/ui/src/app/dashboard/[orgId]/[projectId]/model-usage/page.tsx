import { redirect } from "next/navigation";

export default async function ModelUsagePage({
	params,
	searchParams,
}: {
	params: Promise<{ orgId: string; projectId: string }>;
	searchParams?: Promise<{
		days?: string;
		from?: string;
		to?: string;
		apiKeyId?: string;
	}>;
}) {
	const { orgId, projectId } = await params;
	const searchParamsData = await searchParams;
	const paramsObject = new URLSearchParams();

	if (searchParamsData?.days) {
		paramsObject.set("days", searchParamsData.days);
	}
	if (searchParamsData?.from) {
		paramsObject.set("from", searchParamsData.from);
	}
	if (searchParamsData?.to) {
		paramsObject.set("to", searchParamsData.to);
	}
	if (searchParamsData?.apiKeyId) {
		paramsObject.set("apiKeyId", searchParamsData.apiKeyId);
	}

	const query = paramsObject.toString();
	redirect(
		`/dashboard/${orgId}/${projectId}/usage${query ? `?${query}` : ""}`,
	);
}
