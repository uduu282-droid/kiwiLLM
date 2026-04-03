"use client";

import { format, parseISO } from "date-fns";
import {
	BarChart3,
	Flame,
	Trophy,
	TrendingDown,
	TrendingUp,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	type TooltipProps,
	XAxis,
	YAxis,
} from "recharts";

import { Badge } from "@/lib/components/badge";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/lib/components/select";

import type { Route } from "next";

type RankingWindow = "7d" | "30d" | "90d";

interface RankingEntry {
	modelId: string;
	providerId: string;
	requestCount: number;
	totalTokens: number;
	totalCost: number;
	changePercent: number | null;
	isNew: boolean;
}

interface RankingChartPoint {
	weekStart: string;
	totalTokens: number;
	segments: Array<{
		modelId: string;
		tokens: number;
	}>;
}

interface RankingsPayload {
	window: RankingWindow;
	generatedAt: string;
	totalRequests: number;
	totalTokens: number;
	totalModels: number;
	leaderboard: RankingEntry[];
	chart: RankingChartPoint[];
}

const WINDOW_LABELS: Record<RankingWindow, string> = {
	"7d": "This Week",
	"30d": "Last 30 Days",
	"90d": "Last 90 Days",
};

const MODEL_COLORS = [
	"#f472b6",
	"#fb7185",
	"#f97316",
	"#facc15",
	"#84cc16",
	"#2dd4bf",
	"#60a5fa",
	"#a78bfa",
	"#9ca3af",
];

function formatTokens(value: number): string {
	if (value >= 1_000_000_000_000) {
		return `${(value / 1_000_000_000_000).toFixed(2)}T`;
	}
	if (value >= 1_000_000_000) {
		return `${(value / 1_000_000_000).toFixed(2)}B`;
	}
	if (value >= 1_000_000) {
		return `${(value / 1_000_000).toFixed(2)}M`;
	}
	if (value >= 1_000) {
		return `${(value / 1_000).toFixed(1)}K`;
	}
	return `${Math.round(value)}`;
}

function getModelLabel(
	modelId: string,
	modelNameMap: Record<string, string>,
): string {
	return modelNameMap[modelId] ?? modelId.split("/").pop() ?? modelId;
}

function getProviderLabel(providerId: string): string {
	return providerId.replace(/^kiwillm-/, "").replaceAll("-", " ");
}

function RankingsTooltip({
	active,
	payload,
	label,
	modelNameMap,
}: TooltipProps<number, string> & { modelNameMap: Record<string, string> }) {
	if (!active || !payload?.length) {
		return null;
	}

	return (
		<div className="rounded-2xl border border-white/10 bg-[#090b10] px-3 py-2 text-sm text-white shadow-2xl">
			<p className="mb-2 font-medium text-white">
				{label ? format(parseISO(String(label)), "MMM d, yyyy") : ""}
			</p>
			{payload
				.filter((entry) => Number(entry.value) > 0)
				.sort((a, b) => Number(b.value) - Number(a.value))
				.map((entry) => (
					<div
						key={entry.dataKey}
						className="flex items-center justify-between gap-4 py-0.5"
					>
						<div className="flex items-center gap-2 text-white/72">
							<span
								className="h-2.5 w-2.5 rounded-full"
								style={{ backgroundColor: entry.color }}
							/>
							<span>{getModelLabel(String(entry.dataKey), modelNameMap)}</span>
						</div>
						<span className="font-medium text-white">
							{formatTokens(Number(entry.value))}
						</span>
					</div>
				))}
		</div>
	);
}

export function RankingPageClient({
	data,
	modelNameMap,
}: {
	data: RankingsPayload;
	modelNameMap: Record<string, string>;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();

	const topChartModels = data.leaderboard
		.slice(0, 8)
		.map((entry) => entry.modelId);
	const chartData = data.chart.map((point) => {
		const segments = Object.fromEntries(
			point.segments.map((segment) => [segment.modelId, segment.tokens]),
		);
		return {
			weekStart: point.weekStart,
			...segments,
		};
	});

	const onWindowChange = (value: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("window", value);
		router.push(`/ranking?${params.toString()}` as Route);
	};

	return (
		<section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 pb-20 pt-10 md:px-6 md:pb-24">
			<div className="max-w-3xl">
				<Badge className="mb-5 border-white/10 bg-white/5 px-3 py-1 text-white/72 hover:bg-white/5">
					KiwiLLM Rankings
				</Badge>
				<h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
					AI Model Rankings
				</h1>
				<p className="mt-5 text-base leading-7 text-white/68 sm:text-lg">
					Based on real KiwiLLM traffic across {data.totalModels} active models.
					Compare which models users actually reach for most on KiwiLLM.
				</p>
			</div>

			<div className="grid gap-4 md:grid-cols-3">
				<Card className="border-white/10 bg-white/[0.03] text-white">
					<CardHeader className="pb-2">
						<CardDescription className="text-white/56">
							Window requests
						</CardDescription>
						<CardTitle className="text-3xl">
							{data.totalRequests.toLocaleString()}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card className="border-white/10 bg-white/[0.03] text-white">
					<CardHeader className="pb-2">
						<CardDescription className="text-white/56">
							Tokens served
						</CardDescription>
						<CardTitle className="text-3xl">
							{formatTokens(data.totalTokens)}
						</CardTitle>
					</CardHeader>
				</Card>
				<Card className="border-white/10 bg-white/[0.03] text-white">
					<CardHeader className="pb-2">
						<CardDescription className="text-white/56">Updated</CardDescription>
						<CardTitle className="text-3xl">
							{format(parseISO(data.generatedAt), "MMM d")}
						</CardTitle>
					</CardHeader>
				</Card>
			</div>

			<Card className="border-white/10 bg-white/[0.03] text-white">
				<CardHeader>
					<div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
						<div>
							<div className="mb-2 flex items-center gap-2 text-white">
								<BarChart3 className="h-5 w-5 text-white/70" />
								<CardTitle className="text-2xl">Top Models</CardTitle>
							</div>
							<CardDescription className="text-white/62">
								Weekly token usage across KiwiLLM.
							</CardDescription>
						</div>
						<Select value={data.window} onValueChange={onWindowChange}>
							<SelectTrigger className="w-[170px] border-white/10 bg-[#080a0f] text-white">
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="border-white/10 bg-[#090b10] text-white">
								<SelectItem value="7d">This Week</SelectItem>
								<SelectItem value="30d">Last 30 Days</SelectItem>
								<SelectItem value="90d">Last 90 Days</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardHeader>
				<CardContent className="pt-2">
					<div className="h-[420px] w-full">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={chartData} barCategoryGap={6}>
								<CartesianGrid
									vertical={false}
									stroke="rgba(255,255,255,0.08)"
								/>
								<Tooltip
									content={<RankingsTooltip modelNameMap={modelNameMap} />}
								/>
								<Legend
									wrapperStyle={{ color: "#e5e7eb", paddingTop: 12 }}
									formatter={(value) =>
										getModelLabel(String(value), modelNameMap)
									}
								/>
								{topChartModels.map((modelId, index) => (
									<Bar
										key={modelId}
										dataKey={modelId}
										stackId="usage"
										fill={MODEL_COLORS[index % MODEL_COLORS.length]}
										radius={
											index === topChartModels.length - 1
												? [4, 4, 0, 0]
												: [0, 0, 0, 0]
										}
									/>
								))}
								<Bar
									dataKey="Other"
									stackId="usage"
									fill={MODEL_COLORS[MODEL_COLORS.length - 1]}
									radius={[4, 4, 0, 0]}
								/>
								<XAxis
									dataKey="weekStart"
									stroke="rgba(255,255,255,0.38)"
									tickFormatter={(value: string) =>
										format(parseISO(String(value)), "MMM d")
									}
								/>
								<YAxis
									stroke="rgba(255,255,255,0.38)"
									tickFormatter={(value: number) => formatTokens(Number(value))}
								/>
							</BarChart>
						</ResponsiveContainer>
					</div>
				</CardContent>
			</Card>

			<Card className="border-white/10 bg-white/[0.03] text-white">
				<CardHeader>
					<div className="flex items-center justify-between gap-4">
						<div>
							<div className="mb-2 flex items-center gap-2 text-white">
								<Trophy className="h-5 w-5 text-white/70" />
								<CardTitle className="text-2xl">LLM Leaderboard</CardTitle>
							</div>
							<CardDescription className="text-white/62">
								Most popular models on KiwiLLM for{" "}
								{WINDOW_LABELS[data.window].toLowerCase()}.
							</CardDescription>
						</div>
						<Badge className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
							Live Kiwi usage
						</Badge>
					</div>
				</CardHeader>
				<CardContent className="grid gap-4 md:grid-cols-2">
					{data.leaderboard.map((entry, index) => (
						<div
							key={`${entry.providerId}-${entry.modelId}`}
							className="flex items-start justify-between gap-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
						>
							<div className="flex items-start gap-4">
								<div className="w-8 pt-0.5 text-right text-lg font-semibold text-white/70">
									{index + 1}.
								</div>
								<div className="space-y-1">
									<div className="text-xl font-semibold leading-tight text-white">
										{getModelLabel(entry.modelId, modelNameMap)}
									</div>
									<div className="text-sm text-white/52">
										by {getProviderLabel(entry.providerId)}
									</div>
									<div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-white/46">
										<span>{entry.requestCount.toLocaleString()} requests</span>
										<span>•</span>
										<span>${entry.totalCost.toFixed(2)}</span>
									</div>
								</div>
							</div>
							<div className="text-right">
								<div className="text-xl font-medium text-white">
									{formatTokens(entry.totalTokens)} tokens
								</div>
								<div
									className={`mt-1 flex items-center justify-end gap-1 text-sm ${
										entry.isNew
											? "text-sky-300"
											: (entry.changePercent ?? 0) >= 0
												? "text-emerald-300"
												: "text-rose-300"
									}`}
								>
									{entry.isNew ? (
										<>
											<Flame className="h-3.5 w-3.5" />
											new
										</>
									) : (entry.changePercent ?? 0) >= 0 ? (
										<>
											<TrendingUp className="h-3.5 w-3.5" />
											{Math.abs(entry.changePercent ?? 0)}%
										</>
									) : (
										<>
											<TrendingDown className="h-3.5 w-3.5" />
											{Math.abs(entry.changePercent ?? 0)}%
										</>
									)}
								</div>
							</div>
						</div>
					))}
				</CardContent>
			</Card>
		</section>
	);
}
