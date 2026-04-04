"use client";

import { format, parseISO, subDays } from "date-fns";
import {
	Activity,
	BarChart3,
	Boxes,
	CircleDollarSign,
	Coins,
	Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
	Area,
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	ComposedChart,
	Legend,
	Line,
	LineChart,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

import { DateRangePicker, getDateRangeFromParams } from "@/components/date-range-picker";
import { useDashboardNavigation } from "@/hooks/useDashboardNavigation";
import { Badge } from "@/lib/components/badge";
import { Card, CardContent } from "@/lib/components/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/lib/components/select";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/lib/components/tabs";
import { useApi } from "@/lib/fetch-client";
import { LIVE_DASHBOARD_REFRESH_MS } from "@/lib/live-refresh";
import { cn } from "@/lib/utils";

import type { ActivitT, ActivityModelUsage } from "@/types/activity";
import type { TooltipProps } from "recharts";

interface UsageClientProps {
	initialActivityData?: ActivitT;
	projectId: string | undefined;
}

type OverviewMode = "overview" | "requests" | "tokens";
type AnalysisMode = "consumption" | "trend" | "distribution" | "ranking";

interface AggregatedModelUsage extends ActivityModelUsage {
	share: number;
}

const MODEL_COLORS = [
	"#f59e0b",
	"#84cc16",
	"#22c55e",
	"#2dd4bf",
	"#60a5fa",
	"#a78bfa",
	"#f472b6",
	"#ef4444",
	"#fb7185",
	"#f97316",
];

function formatCompactNumber(value: number) {
	if (value >= 1_000_000_000) {
		return `${(value / 1_000_000_000).toFixed(1)}B`;
	}
	if (value >= 1_000_000) {
		return `${(value / 1_000_000).toFixed(1)}M`;
	}
	if (value >= 1_000) {
		return `${(value / 1_000).toFixed(1)}K`;
	}
	return value.toString();
}

function formatCompactUsd(value: number) {
	if (value >= 1000) {
		return `$${formatCompactNumber(value)}`;
	}
	if (value === 0) {
		return "$0.00";
	}
	if (value < 0.01) {
		return `$${value.toFixed(4)}`;
	}
	return `$${value.toFixed(2)}`;
}

function buildChartTooltipLabel(label: string | undefined) {
	if (!label) {
		return "";
	}
	return format(parseISO(label), "MMM d, yyyy");
}

function MetricCard({
	title,
	value,
	subtitle,
	icon: Icon,
	accentClassName,
}: {
	title: string;
	value: string;
	subtitle: string;
	icon: typeof Activity;
	accentClassName: string;
}) {
	return (
		<Card className="rounded-[28px] border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
			<CardContent className="p-6">
				<div className="mb-5 flex items-start justify-between">
					<div className="space-y-2">
						<p className="text-sm text-zinc-400">{title}</p>
						<p className="text-4xl font-semibold tracking-tight text-white">
							{value}
						</p>
					</div>
					<div
						className={cn(
							"flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5",
							accentClassName,
						)}
					>
						<Icon className="h-5 w-5" />
					</div>
				</div>
				<p className="text-sm text-zinc-500">{subtitle}</p>
			</CardContent>
		</Card>
	);
}

function SnapshotRow({
	label,
	value,
	subvalue,
}: {
	label: string;
	value: string;
	subvalue: string;
}) {
	return (
		<div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
			<p className="text-sm text-zinc-500">{label}</p>
			<p className="mt-1 text-xl font-semibold text-white">{value}</p>
			<p className="mt-1 text-sm text-zinc-400">{subvalue}</p>
		</div>
	);
}

function OverviewTooltip({
	active,
	payload,
	label,
	mode,
}: TooltipProps<number, string> & { mode: OverviewMode }) {
	if (!active || !payload?.length) {
		return null;
	}

	const requests =
		payload.find((entry) => entry.dataKey === "requests")?.value ?? 0;
	const tokens = payload.find((entry) => entry.dataKey === "tokens")?.value ?? 0;
	const cost = payload.find((entry) => entry.dataKey === "cost")?.value ?? 0;

	return (
		<div className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm shadow-2xl">
			<p className="mb-2 font-medium text-white">{buildChartTooltipLabel(label)}</p>
			{mode !== "tokens" && (
				<p className="text-zinc-300">Requests: {Number(requests).toLocaleString()}</p>
			)}
			{mode !== "requests" && (
				<p className="text-zinc-300">Tokens: {Number(tokens).toLocaleString()}</p>
			)}
			{mode === "overview" && (
				<p className="text-zinc-500">Cost: {formatCompactUsd(Number(cost))}</p>
			)}
		</div>
	);
}

function DistributionTooltip({
	active,
	payload,
}: TooltipProps<number, string>) {
	if (!active || !payload?.length) {
		return null;
	}

	const item = payload[0];
	return (
		<div className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm shadow-2xl">
			<p className="font-medium text-white">{String(item.name)}</p>
			<p className="text-zinc-300">
				Requests: {Number(item.value).toLocaleString()}
			</p>
		</div>
	);
}

function ConsumptionTooltip({
	active,
	payload,
	label,
	models,
}: TooltipProps<number, string> & { models: AggregatedModelUsage[] }) {
	if (!active || !payload?.length) {
		return null;
	}

	return (
		<div className="rounded-2xl border border-white/10 bg-[#090909] px-4 py-3 text-sm shadow-2xl">
			<p className="mb-2 font-medium text-white">{buildChartTooltipLabel(label)}</p>
			<div className="space-y-1">
				{payload
					.filter((entry) => Number(entry.value) > 0)
					.map((entry) => {
						const model = models.find(
							(item) => `${item.provider}::${item.id}` === entry.dataKey,
						);
						return (
							<div
								key={entry.dataKey}
								className="flex items-center justify-between gap-4"
							>
								<span className="text-zinc-300">{model?.id ?? entry.name}</span>
								<span className="font-medium text-white">
									{Number(entry.value).toLocaleString()}
								</span>
							</div>
						);
					})}
			</div>
		</div>
	);
}

export function UsageClient({
	initialActivityData,
	projectId,
}: UsageClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { buildUrl } = useDashboardNavigation();
	const api = useApi();
	const [overviewMode, setOverviewMode] = useState<OverviewMode>("overview");
	const [analysisMode, setAnalysisMode] =
		useState<AnalysisMode>("consumption");

	const { data: apiKeysData } = api.useQuery(
		"get",
		"/keys/api",
		{
			params: {
				query: {
					projectId: projectId ?? "",
				},
			},
		},
		{
			enabled: !!projectId,
		},
	);

	const apiKeys =
		apiKeysData?.apiKeys.filter((key) => key.status !== "deleted") ?? [];
	const apiKeyId = searchParams.get("apiKeyId") ?? undefined;

	useEffect(() => {
		if (!searchParams.get("from") || !searchParams.get("to")) {
			const params = new URLSearchParams(searchParams);
			const today = new Date();
			params.set("from", format(subDays(today, 6), "yyyy-MM-dd"));
			params.set("to", format(today, "yyyy-MM-dd"));
			params.delete("days");
			router.replace(`${buildUrl("usage")}?${params.toString()}`);
		}
	}, [buildUrl, router, searchParams]);

	const updateApiKeyIdInUrl = (newApiKeyId: string | undefined) => {
		const params = new URLSearchParams(searchParams);
		if (newApiKeyId) {
			params.set("apiKeyId", newApiKeyId);
		} else {
			params.delete("apiKeyId");
		}
		router.push(`${buildUrl("usage")}?${params.toString()}`);
	};

	const { from, to } = getDateRangeFromParams(searchParams);
	const fromStr = format(from, "yyyy-MM-dd");
	const toStr = format(to, "yyyy-MM-dd");

	const { data, isLoading, error } = api.useQuery(
		"get",
		"/activity",
		{
			params: {
				query: {
					from: fromStr,
					to: toStr,
					...(projectId ? { projectId } : {}),
					...(apiKeyId ? { apiKeyId } : {}),
				},
			},
		},
		{
			enabled: !!projectId,
			initialData: apiKeyId ? undefined : initialActivityData,
			refetchInterval: LIVE_DASHBOARD_REFRESH_MS,
			refetchIntervalInBackground: true,
		},
	);

	const activity = data?.activity ?? [];

	const {
		totalRequests,
		totalTokens,
		totalCost,
		activeModels,
		averageCacheRate,
		averageErrorRate,
		topModel,
		dailyChartData,
		rankingRows,
		distributionData,
		visibleModels,
	} = useMemo(() => {
		const modelMap = new Map<string, ActivityModelUsage>();

		for (const day of activity) {
			for (const model of day.modelBreakdown) {
				const key = `${model.provider}::${model.id}`;
				const existing = modelMap.get(key);
				if (existing) {
					existing.requestCount += model.requestCount;
					existing.inputTokens += model.inputTokens;
					existing.outputTokens += model.outputTokens;
					existing.totalTokens += model.totalTokens;
					existing.cost += model.cost;
				} else {
					modelMap.set(key, { ...model });
				}
			}
		}

		const aggregatedRows = Array.from(modelMap.values())
			.sort((a, b) => b.totalTokens - a.totalTokens)
			.map((row) => ({ ...row, share: 0 }));

		const grandTotalTokens = aggregatedRows.reduce(
			(sum, row) => sum + row.totalTokens,
			0,
		);

		const rowsWithShare: AggregatedModelUsage[] = aggregatedRows.map((row) => ({
			...row,
			share:
				grandTotalTokens === 0
					? 0
					: Math.round((row.totalTokens / grandTotalTokens) * 100),
		}));

		const topRows = rowsWithShare.slice(0, 8);

		const chartRows = activity.map((day) => {
			const row: Record<string, number | string> = {
				date: day.date,
				requests: day.requestCount,
				tokens: day.totalTokens,
				cost: Number(day.cost),
				inputTokens: day.inputTokens,
				outputTokens: day.outputTokens,
			};

			for (const model of topRows) {
				const dayModel = day.modelBreakdown.find(
					(item) =>
						item.id === model.id && item.provider === model.provider,
				);
				row[`${model.provider}::${model.id}`] = dayModel?.totalTokens ?? 0;
			}

			return row;
		});

		return {
			totalRequests: activity.reduce((sum, day) => sum + day.requestCount, 0),
			totalTokens: activity.reduce((sum, day) => sum + day.totalTokens, 0),
			totalCost: activity.reduce((sum, day) => sum + Number(day.cost), 0),
			activeModels: rowsWithShare.length,
			averageCacheRate:
				activity.length === 0
					? 0
					: activity.reduce((sum, day) => sum + day.cacheRate, 0) /
						activity.length,
			averageErrorRate:
				activity.length === 0
					? 0
					: activity.reduce((sum, day) => sum + day.errorRate, 0) /
						activity.length,
			topModel: rowsWithShare[0],
			dailyChartData: chartRows,
			rankingRows: rowsWithShare,
			distributionData: rowsWithShare.slice(0, 8),
			visibleModels: topRows,
		};
	}, [activity]);

	if (!projectId) {
		return (
			<div className="p-4 pt-6 md:p-8">
				<Card className="rounded-[28px] border-white/10 bg-black/30">
					<CardContent className="flex h-72 items-center justify-center text-zinc-400">
						Please select a project to view analytics.
					</CardContent>
				</Card>
			</div>
		);
	}

	if (isLoading) {
		return (
			<div className="p-4 pt-6 md:p-8">
				<Card className="rounded-[28px] border-white/10 bg-black/30">
					<CardContent className="flex h-72 items-center justify-center text-zinc-400">
						Loading analytics...
					</CardContent>
				</Card>
			</div>
		);
	}

	if (error) {
		return (
			<div className="p-4 pt-6 md:p-8">
				<Card className="rounded-[28px] border-red-500/20 bg-black/30">
					<CardContent className="flex h-72 items-center justify-center text-red-400">
						Error loading analytics data.
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
				<Card className="overflow-hidden rounded-[32px] border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))] shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
					<CardContent className="p-6 md:p-8">
						<div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
							<div className="space-y-2">
								<div className="flex items-center gap-3">
									<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
										<BarChart3 className="h-5 w-5" />
									</div>
									<div>
										<h2 className="text-3xl font-bold tracking-tight text-white">
											Usage Dashboard
										</h2>
										<p className="text-sm text-zinc-400">
											Real-time analytics and model performance across your
											project.
										</p>
									</div>
								</div>
							</div>
							<div className="flex flex-col gap-3 md:flex-row md:items-center">
								<Select
									value={apiKeyId ?? "all"}
									onValueChange={(value) =>
										updateApiKeyIdInUrl(value === "all" ? undefined : value)
									}
								>
									<SelectTrigger className="h-11 w-full min-w-[180px] rounded-2xl border-white/10 bg-white/5 text-white md:w-[200px]">
										<SelectValue placeholder="All API Keys" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">All API Keys</SelectItem>
										{apiKeys.map((key) => (
											<SelectItem key={key.id} value={key.id}>
												{key.description}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<DateRangePicker buildUrl={buildUrl} path="usage" />
							</div>
						</div>
					</CardContent>
				</Card>

				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						title="Total Requests"
						value={formatCompactNumber(totalRequests)}
						subtitle="Completed calls in selected range"
						icon={Activity}
						accentClassName="text-emerald-300"
					/>
					<MetricCard
						title="Tokens Processed"
						value={formatCompactNumber(totalTokens)}
						subtitle="Input + output + cached tokens"
						icon={Coins}
						accentClassName="text-cyan-300"
					/>
					<MetricCard
						title="Total Cost"
						value={formatCompactUsd(totalCost)}
						subtitle="Estimated spend across requests"
						icon={CircleDollarSign}
						accentClassName="text-amber-300"
					/>
					<MetricCard
						title="Active Models"
						value={activeModels.toString()}
						subtitle={
							topModel
								? `${topModel.id} is leading this period`
								: "No active model yet"
						}
						icon={Boxes}
						accentClassName="text-fuchsia-300"
					/>
				</div>

				<div className="grid gap-6 xl:grid-cols-[1.65fr_0.95fr]">
					<Card className="rounded-[32px] border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
						<CardContent className="p-6 md:p-8">
							<div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
								<div>
									<h3 className="text-2xl font-semibold text-white">Statistics</h3>
									<p className="text-sm text-zinc-400">
										Track requests, tokens, and spend over time.
									</p>
								</div>
								<Tabs
									value={overviewMode}
									onValueChange={(value) =>
										setOverviewMode(value as OverviewMode)
									}
									className="w-full md:w-auto"
								>
									<TabsList className="grid h-11 w-full grid-cols-3 rounded-full border border-white/10 bg-white/5 p-1 md:w-[280px]">
										<TabsTrigger value="overview" className="rounded-full data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">Overview</TabsTrigger>
										<TabsTrigger value="requests" className="rounded-full data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">Requests</TabsTrigger>
										<TabsTrigger value="tokens" className="rounded-full data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-300">Tokens</TabsTrigger>
									</TabsList>
								</Tabs>
							</div>
							<div className="h-[360px]">
								<ResponsiveContainer width="100%" height="100%">
									{overviewMode === "overview" ? (
										<ComposedChart data={dailyChartData}>
											<CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
											<XAxis dataKey="date" tickFormatter={(value: string) => format(parseISO(value), "MMM d")} axisLine={false} tickLine={false} stroke="#71717a" />
											<YAxis yAxisId="left" axisLine={false} tickLine={false} stroke="#71717a" tickFormatter={(value: number) => formatCompactNumber(value)} />
											<YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} stroke="#71717a" tickFormatter={(value: number) => formatCompactNumber(value)} />
											<Tooltip content={<OverviewTooltip mode={overviewMode} />} />
											<Legend />
											<Area yAxisId="left" type="monotone" dataKey="tokens" name="Tokens" stroke="#a7f3d0" fill="url(#tokensFill)" strokeWidth={3} />
											<Line yAxisId="right" type="monotone" dataKey="requests" name="Requests" stroke="#f4f4f5" strokeWidth={2} dot={{ fill: "#f4f4f5", r: 3 }} />
											<defs>
												<linearGradient id="tokensFill" x1="0" y1="0" x2="0" y2="1">
													<stop offset="0%" stopColor="#4ade80" stopOpacity={0.28} />
													<stop offset="100%" stopColor="#4ade80" stopOpacity={0.02} />
												</linearGradient>
											</defs>
										</ComposedChart>
									) : overviewMode === "requests" ? (
										<BarChart data={dailyChartData}>
											<CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
											<XAxis dataKey="date" tickFormatter={(value: string) => format(parseISO(value), "MMM d")} axisLine={false} tickLine={false} stroke="#71717a" />
											<YAxis axisLine={false} tickLine={false} stroke="#71717a" />
											<Tooltip content={<OverviewTooltip mode={overviewMode} />} />
											<Bar dataKey="requests" name="Requests" fill="#4ade80" radius={[10, 10, 0, 0]} />
										</BarChart>
									) : (
										<LineChart data={dailyChartData}>
											<CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
											<XAxis dataKey="date" tickFormatter={(value: string) => format(parseISO(value), "MMM d")} axisLine={false} tickLine={false} stroke="#71717a" />
											<YAxis axisLine={false} tickLine={false} stroke="#71717a" tickFormatter={(value: number) => formatCompactNumber(value)} />
											<Tooltip content={<OverviewTooltip mode={overviewMode} />} />
											<Line type="monotone" dataKey="tokens" name="Tokens" stroke="#a7f3d0" strokeWidth={3} dot={{ fill: "#a7f3d0", r: 4 }} />
										</LineChart>
									)}
								</ResponsiveContainer>
							</div>
						</CardContent>
					</Card>

					<Card className="rounded-[32px] border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
						<CardContent className="p-6 md:p-8">
							<div className="mb-8 flex items-center gap-3">
								<div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
									<Sparkles className="h-5 w-5" />
								</div>
								<div>
									<h3 className="text-2xl font-semibold text-white">Project Snapshot</h3>
									<p className="text-sm text-zinc-400">A quick view of performance and model mix.</p>
								</div>
							</div>
							<div className="space-y-5">
								<SnapshotRow label="Top model" value={topModel?.id ?? "No usage yet"} subvalue={topModel ? topModel.provider : "Waiting for traffic"} />
								<SnapshotRow label="Top model share" value={topModel ? `${topModel.share}%` : "0%"} subvalue="Share of total tokens" />
								<SnapshotRow label="Average cache rate" value={`${averageCacheRate.toFixed(1)}%`} subvalue="Across selected days" />
								<SnapshotRow label="Average error rate" value={`${averageErrorRate.toFixed(1)}%`} subvalue="Across selected days" />
								<SnapshotRow label="Estimated spend" value={formatCompactUsd(totalCost)} subvalue="Current range total" />
							</div>
						</CardContent>
					</Card>
				</div>

				<Card className="rounded-[32px] border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
					<CardContent className="p-6 md:p-8">
						<div className="mb-6 flex flex-col gap-4 border-b border-white/10 pb-6 md:flex-row md:items-start md:justify-between">
							<div>
								<h3 className="text-2xl font-semibold text-white">
									Model Data Analysis
								</h3>
								<p className="text-sm text-zinc-400">
									Visualize usage, model mix, and performance in one place.
								</p>
							</div>
							<Tabs
								value={analysisMode}
								onValueChange={(value) =>
									setAnalysisMode(value as AnalysisMode)
								}
								className="w-full md:w-auto"
							>
								<TabsList className="grid h-11 w-full grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/5 p-1 md:grid-cols-4 md:w-[520px]">
									<TabsTrigger value="consumption" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black">Consumption</TabsTrigger>
									<TabsTrigger value="trend" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black">Trend</TabsTrigger>
									<TabsTrigger value="distribution" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black">Call Distribution</TabsTrigger>
									<TabsTrigger value="ranking" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-black">Ranking</TabsTrigger>
								</TabsList>
							</Tabs>
						</div>

						<Tabs value={analysisMode} className="space-y-6">
							<TabsContent value="consumption" className="space-y-6">
								<div className="space-y-1">
									<h4 className="text-3xl font-semibold text-white">Consumption Distribution</h4>
									<p className="text-zinc-400">
										Total: {formatCompactNumber(totalTokens)} tokens
									</p>
								</div>
								<div className="h-[360px]">
									<ResponsiveContainer width="100%" height="100%">
										<BarChart data={dailyChartData}>
											<CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
											<XAxis dataKey="date" tickFormatter={(value: string) => format(parseISO(value), "MM-dd")} axisLine={false} tickLine={false} stroke="#71717a" />
											<YAxis axisLine={false} tickLine={false} stroke="#71717a" tickFormatter={(value: number) => formatCompactNumber(value)} />
											<Tooltip content={<ConsumptionTooltip models={visibleModels} />} />
											<Legend />
											{visibleModels.map((model, index) => (
												<Bar
													key={`${model.provider}::${model.id}`}
													dataKey={`${model.provider}::${model.id}`}
													stackId="consumption"
													name={model.id}
													fill={MODEL_COLORS[index % MODEL_COLORS.length]}
													radius={
														index === visibleModels.length - 1
															? [8, 8, 0, 0]
															: [0, 0, 0, 0]
													}
												/>
											))}
										</BarChart>
									</ResponsiveContainer>
								</div>
							</TabsContent>

							<TabsContent value="trend" className="space-y-6">
								<div className="space-y-1">
									<h4 className="text-3xl font-semibold text-white">Request and Token Trend</h4>
									<p className="text-zinc-400">
										Compare daily volume and token flow across the selected range.
									</p>
								</div>
								<div className="h-[360px]">
									<ResponsiveContainer width="100%" height="100%">
										<LineChart data={dailyChartData}>
											<CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
											<XAxis dataKey="date" tickFormatter={(value: string) => format(parseISO(value), "MMM d")} axisLine={false} tickLine={false} stroke="#71717a" />
											<YAxis yAxisId="left" axisLine={false} tickLine={false} stroke="#71717a" />
											<YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} stroke="#71717a" tickFormatter={(value: number) => formatCompactNumber(value)} />
											<Tooltip content={<OverviewTooltip mode="overview" />} />
											<Legend />
											<Line yAxisId="left" type="monotone" dataKey="requests" name="Requests" stroke="#f4f4f5" strokeWidth={2} dot={{ fill: "#f4f4f5", r: 3 }} />
											<Line yAxisId="right" type="monotone" dataKey="tokens" name="Tokens" stroke="#4ade80" strokeWidth={3} dot={{ fill: "#4ade80", r: 3 }} />
										</LineChart>
									</ResponsiveContainer>
								</div>
							</TabsContent>

							<TabsContent value="distribution" className="space-y-6">
								<div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
									<div className="h-[360px]">
										<ResponsiveContainer width="100%" height="100%">
											<PieChart>
												<Pie
													data={distributionData}
													dataKey="requestCount"
													nameKey="id"
													innerRadius={90}
													outerRadius={130}
													paddingAngle={2}
												>
													{distributionData.map((entry, index) => (
														<Cell key={`${entry.provider}-${entry.id}`} fill={MODEL_COLORS[index % MODEL_COLORS.length]} />
													))}
												</Pie>
												<Tooltip content={<DistributionTooltip />} />
											</PieChart>
										</ResponsiveContainer>
									</div>
									<div className="space-y-4">
										<h4 className="text-3xl font-semibold text-white">Call Distribution</h4>
										<p className="text-zinc-400">
											See which models are taking the largest share of requests.
										</p>
										<div className="space-y-3">
											{distributionData.map((row, index) => (
												<div key={`${row.provider}-${row.id}`} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
													<div className="flex items-center gap-3 min-w-0">
														<span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: MODEL_COLORS[index % MODEL_COLORS.length] }} />
														<div className="min-w-0">
															<p className="truncate font-medium text-white">{row.id}</p>
															<p className="truncate text-sm text-zinc-500">{row.provider}</p>
														</div>
													</div>
													<div className="text-right">
														<p className="font-medium text-white">
															{row.requestCount.toLocaleString()}
														</p>
														<p className="text-sm text-zinc-500">
															{row.share}% of tokens
														</p>
													</div>
												</div>
											))}
										</div>
									</div>
								</div>
							</TabsContent>

							<TabsContent value="ranking" className="space-y-6">
								<div className="space-y-1">
									<h4 className="text-3xl font-semibold text-white">Model Statistics</h4>
									<p className="text-zinc-400">
										Detailed breakdown of model usage across requests and tokens.
									</p>
								</div>
								<div className="overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.02]">
									<div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_110px_130px_110px] gap-4 border-b border-white/10 px-6 py-4 text-sm font-medium text-zinc-500">
										<div>Model Name</div>
										<div>Provider</div>
										<div className="text-right">Requests</div>
										<div className="text-right">Tokens</div>
										<div className="text-right">Cost</div>
									</div>
									<div>
										{rankingRows.slice(0, 12).map((row, index) => (
											<div key={`${row.provider}-${row.id}`} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.9fr)_110px_130px_110px] gap-4 border-b border-white/5 px-6 py-5 last:border-b-0">
												<div className="flex items-center gap-4 min-w-0">
													<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-sm font-semibold text-zinc-300">
														{index + 1}
													</div>
													<div className="min-w-0">
														<p className="truncate font-semibold text-white">{row.id}</p>
														<p className="text-sm text-zinc-500">{row.share}% of token usage</p>
													</div>
												</div>
												<div className="flex items-center">
													<Badge variant="outline" className="rounded-full border-white/10 bg-white/[0.03] text-zinc-300">
														{row.provider}
													</Badge>
												</div>
												<div className="text-right font-medium text-white">{row.requestCount.toLocaleString()}</div>
												<div className="text-right font-medium text-white">{formatCompactNumber(row.totalTokens)}</div>
												<div className="text-right font-medium text-white">{formatCompactUsd(row.cost)}</div>
											</div>
										))}
									</div>
								</div>
							</TabsContent>
						</Tabs>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
