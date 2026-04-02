import { redirect } from "next/navigation";

import ChatPageClient from "@/components/playground/chat-page-client";
import { fetchModels, fetchProviders } from "@/lib/fetch-models";
import type { Metadata } from "next";

export async function generateMetadata({
	searchParams,
}: {
	searchParams: Promise<{ model?: string }>;
}): Promise<Metadata> {
	const { model } = await searchParams;
	return {
		alternates: {
			canonical: model ? `/?model=${model}` : "/",
		},
	};
}

export interface GatewayModel {
	id: string;
	name?: string;
	architecture?: { input_modalities?: string[] };
}

function getDefaultModelValue(models: Awaited<ReturnType<typeof fetchModels>>) {
	const firstModel = models[0];
	if (!firstModel) {
		return "";
	}

	const firstMapping = firstModel.mappings[0];
	if (firstMapping?.providerId) {
		return `${firstMapping.providerId}/${firstModel.id}`;
	}

	return firstModel.id;
}

export default async function ChatPage({
	searchParams,
}: {
	searchParams: Promise<{
		q?: string;
		hints?: string;
		model?: string;
		code?: string;
	}>;
}) {
	const params = await searchParams;
	const { code, q, hints } = params;
	let { model } = params;

	if (code) {
		redirect(
			`/auth/callback?next=${encodeURIComponent("/")}&code=${encodeURIComponent(code)}`,
		);
	}

	// Fetch the curated Kiwi playground catalog early so defaults come from it.
	const [models, providers] = await Promise.all([
		fetchModels(),
		fetchProviders(),
	]);
	const defaultModel = getDefaultModelValue(models);

	// Auto-select a web search capable model when hints=search
	if (hints === "search" && !model) {
		const webSearchModel =
			models.find((entry) =>
				entry.mappings.some((mapping) => mapping.webSearch),
			) ?? models[0];

		model = webSearchModel
			? `${webSearchModel.mappings[0]?.providerId}/${webSearchModel.id}`
			: defaultModel;
		const newParams = new URLSearchParams();
		if (q) {
			newParams.set("q", q);
		}
		if (hints) {
			newParams.set("hints", hints);
		}
		if (model) {
			newParams.set("model", model);
			redirect(`/?${newParams.toString()}`);
		}
	}

	return (
		<ChatPageClient
			models={models}
			providers={providers}
			organizations={[]}
			selectedOrganization={null}
			projects={[]}
			selectedProject={null}
			initialPrompt={q}
			enableWebSearch={hints === "search"}
		/>
	);
}
