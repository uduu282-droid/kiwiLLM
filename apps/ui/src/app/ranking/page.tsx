import Footer from "@/components/landing/footer";
import { HeroRSC } from "@/components/landing/hero-rsc";
import { RankingPageClient } from "@/components/ranking/ranking-page-client";
import { getConfig } from "@/lib/config-server";
import { fetchModels } from "@/lib/fetch-models";

import type { Metadata } from "next";

type RankingWindow = "7d" | "30d" | "90d";

interface RankingsPayload {
	window: RankingWindow;
	generatedAt: string;
	totalRequests: number;
	totalTokens: number;
	totalModels: number;
	leaderboard: Array<{
		modelId: string;
		providerId: string;
		requestCount: number;
		totalTokens: number;
		totalCost: number;
		changePercent: number | null;
		isNew: boolean;
	}>;
	chart: Array<{
		weekStart: string;
		totalTokens: number;
		segments: Array<{
			modelId: string;
			tokens: number;
		}>;
	}>;
	fastest: Array<{
		modelId: string;
		providerId: string;
		requestCount: number;
		totalTokens: number;
		avgLatencyMs: number;
		throughputTokensPerSecond: number;
		pricePerMillion: number | null;
	}>;
	apps: Array<{
		appName: string;
		subtitle: string | null;
		requestCount: number;
		totalTokens: number;
	}>;
}

export const metadata: Metadata = {
	title: "AI Model Rankings - KiwiLLM",
	description:
		"See the most popular AI models on KiwiLLM based on real platform usage and compare top-performing models across recent activity windows.",
};

async function fetchRankings(
	window: RankingWindow,
): Promise<RankingsPayload | null> {
	const config = getConfig();
	try {
		const response = await fetch(
			`${config.apiBackendUrl}/public/rankings?window=${window}`,
			{
				next: { revalidate: 300 },
			},
		);
		if (!response.ok) {
			return null;
		}
		return (await response.json()) as RankingsPayload;
	} catch {
		return null;
	}
}

export default async function RankingPage({
	searchParams,
}: {
	searchParams?: Promise<{ window?: string }>;
}) {
	const params = searchParams ? await searchParams : {};
	const window =
		params?.window === "30d" || params?.window === "90d" ? params.window : "7d";
	const [rankings, models] = await Promise.all([
		fetchRankings(window),
		fetchModels(),
	]);

	const modelNameMap = Object.fromEntries(
		models.map((model) => [model.id, model.name ?? model.id]),
	);

	return (
		<div className="relative overflow-hidden bg-[#050608] text-white">
			<div aria-hidden className="pointer-events-none absolute inset-0">
				<div className="absolute left-[-8%] top-[2%] h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.12)_0%,rgba(236,72,153,0.04)_34%,transparent_72%)] blur-[170px]" />
				<div className="absolute right-[-10%] top-[14%] h-[620px] w-[620px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.14)_0%,rgba(59,130,246,0.04)_34%,transparent_72%)] blur-[190px]" />
				<div className="absolute left-1/2 top-[40%] h-[760px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.015)_32%,transparent_72%)] blur-[200px]" />
			</div>
			<div className="relative z-10">
				<HeroRSC navbarOnly />
				{rankings ? (
					<RankingPageClient data={rankings} modelNameMap={modelNameMap} />
				) : (
					<section className="mx-auto flex min-h-[50vh] max-w-7xl items-center px-5 py-20 md:px-6">
						<div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-white">
							<h1 className="text-3xl font-semibold">Rankings unavailable</h1>
							<p className="mt-3 max-w-2xl text-white/64">
								We couldn&apos;t load KiwiLLM ranking data right now. Please try
								again in a bit.
							</p>
						</div>
					</section>
				)}
				<Footer />
			</div>
		</div>
	);
}
