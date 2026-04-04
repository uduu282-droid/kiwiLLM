"use client";

import { format, subDays } from "date-fns";
import {
	CreditCard,
	Zap,
	Key,
	Activity,
	CircleDollarSign,
	ChartColumnBig,
	ArrowDownToLine,
	ArrowUpFromLine,
	Server,
	ExternalLink,
	BookOpen,
	FlaskConical,
	MessageSquare,
	Gauge,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { CreateApiKeyDialog } from "@/components/api-keys/create-api-key-dialog";
import { TopUpCreditsButton } from "@/components/credits/top-up-credits-dialog";
import { CostBreakdownCard } from "@/components/dashboard/cost-breakdown-card";
import { ErrorsReliabilityCard } from "@/components/dashboard/errors-reliability-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Overview } from "@/components/dashboard/overview";
import { RecentActivityCard } from "@/components/dashboard/recent-activity-card";
import { ReferralBanner } from "@/components/dashboard/referral-banner";
import {
	DateRangePicker,
	getDateRangeFromParams,
} from "@/components/date-range-picker";
import { QuickStartSection } from "@/components/shared/quick-start-snippet";
import { useDashboardNavigation } from "@/hooks/useDashboardNavigation";
import { Button } from "@/lib/components/button";
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
import { useAppConfig } from "@/lib/config";
import { useApi } from "@/lib/fetch-client";
import { LIVE_DASHBOARD_REFRESH_MS } from "@/lib/live-refresh";

import type { ActivitT } from "@/types/activity";

interface DashboardClientProps {
	initialActivityData?: ActivitT;
}

export function DashboardClient({ initialActivityData }: DashboardClientProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { buildUrl } = useDashboardNavigation();
	const config = useAppConfig();

	// Get date range from URL params
	const { from, to } = getDateRangeFromParams(searchParams);
	const fromStr = format(from, "yyyy-MM-dd");
	const toStr = format(to, "yyyy-MM-dd");

	// Get metric type from URL params, default to "costs"
	const metricParam = searchParams.get("metric");
	const metric = (metricParam === "requests" ? "requests" : "costs") as
		| "costs"
		| "requests";

	// If no from/to params exist, add them to the URL immediately
	useEffect(() => {
		if (!searchParams.get("from") || !searchParams.get("to")) {
			const params = new URLSearchParams(searchParams.toString());
			params.delete("days");
			const today = new Date();
			params.set("from", format(subDays(today, 6), "yyyy-MM-dd"));
			params.set("to", format(today, "yyyy-MM-dd"));
			router.replace(`${buildUrl()}?${params.toString()}`);
		}
	}, [searchParams, router, buildUrl]);

	const { selectedOrganization, selectedProject } = useDashboardNavigation();
	const api = useApi();

	const { data, isLoading } = api.useQuery(
		"get",
		"/activity",
		{
			params: {
				query: {
					from: fromStr,
					to: toStr,
					...(selectedProject?.id ? { projectId: selectedProject.id } : {}),
				},
			},
		},
		{
			enabled: !!selectedProject?.id,
			initialData: searchParams.get("from") ? initialActivityData : undefined,
			refetchOnWindowFocus: false,
			staleTime: 1000 * 60 * 5, // 5 minutes
			refetchInterval: LIVE_DASHBOARD_REFRESH_MS,
			refetchIntervalInBackground: true,
		},
	);

	// Get API keys data to check plan limits
	const { data: apiKeysData } = api.useQuery(
		"get",
		"/keys/api",
		{
			params: {
				query: { projectId: selectedProject?.id ?? "" },
			},
		},
		{
			enabled: !!selectedProject?.id,
			staleTime: 5 * 60 * 1000, // 5 minutes
			refetchOnWindowFocus: false,
		},
	);

	const planLimits = apiKeysData?.planLimits;

	// Function to update URL with new metric parameter
	const updateMetricInUrl = (newMetric: "costs" | "requests") => {
		const params = new URLSearchParams(searchParams.toString());
		params.set("metric", newMetric);
		router.push(`${buildUrl()}?${params.toString()}`);
	};

	const activityData = data?.activity ?? [];

	const totalRequests =
		activityData.reduce((sum, day) => sum + day.requestCount, 0) ?? 0;

	// Track when user reaches 50+ calls for invite banner eligibility
	useEffect(() => {
		if (totalRequests >= 50) {
			localStorage.setItem("user_has_50_plus_calls", "true");
		}
	}, [totalRequests]);
	const totalCost = activityData.reduce((sum, day) => sum + day.cost, 0) ?? 0;
	const totalInputCost =
		activityData.reduce((sum, day) => sum + day.inputCost, 0) ?? 0;
	const totalOutputCost =
		activityData.reduce((sum, day) => sum + day.outputCost, 0) ?? 0;
	const totalDataStorageCost =
		activityData.reduce((sum, day) => sum + day.dataStorageCost, 0) ?? 0;
	const totalRequestCost =
		activityData.reduce((sum, day) => sum + day.requestCost, 0) ?? 0;
	const totalInputTokens =
		activityData.reduce((sum, day) => sum + day.inputTokens, 0) ?? 0;
	const totalOutputTokens =
		activityData.reduce((sum, day) => sum + day.outputTokens, 0) ?? 0;
	const totalCachedTokens =
		activityData.reduce((sum, day) => sum + day.cachedTokens, 0) ?? 0;
	const totalCachedInputCost =
		activityData.reduce((sum, day) => sum + day.cachedInputCost, 0) ?? 0;

	const quickActions = [
		{
			href: "usage",
			icon: ChartColumnBig,
			label: "Analytics",
		},
		{
			href: "activity",
			icon: Activity,
			label: "View Activity",
		},
		{
			href: "api-keys",
			icon: Key,
			label: "Manage API Keys",
		},
	] as const;

	const formatTokens = (tokens: number) => {
		if (tokens >= 1_000_000) {
			return `${(tokens / 1_000_000).toFixed(1)}M`;
		}
		if (tokens >= 1_000) {
			return `${(tokens / 1_000).toFixed(1)}k`;
		}
		return tokens.toString();
	};

	const currentPlan = planLimits?.plan === "pro" ? "pro" : "free";
	const requestLimits =
		currentPlan === "pro"
			? { label: "Pro limits", rpm: 20, rpd: 2000 }
			: { label: "Free limits", rpm: 10, rpd: 200 };
	const requestUsagePercent =
		requestLimits.rpd > 0
			? Math.min(100, (totalRequests / requestLimits.rpd) * 100)
			: 0;

	const isInitialLoading = !selectedOrganization;

	if (isInitialLoading) {
		return (
			<div className="flex flex-col">
				<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
					<div className="flex flex-col md:flex-row items-center justify-between space-y-2">
						<div>
							<h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
							<div className="h-5 w-48 bg-muted animate-pulse rounded mt-1" />
						</div>
					</div>
					<div className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
							{Array.from({ length: 4 }).map((_, i) => (
								<Card key={i}>
									<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
										<div className="h-4 w-24 bg-muted animate-pulse rounded" />
										<div className="h-4 w-4 bg-muted animate-pulse rounded" />
									</CardHeader>
									<CardContent>
										<div className="h-8 w-20 bg-muted animate-pulse rounded mb-2" />
										<div className="h-3 w-16 bg-muted animate-pulse rounded" />
									</CardContent>
								</Card>
							))}
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-6 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_25%),radial-gradient(circle_at_top_left,rgba(59,130,246,0.08),transparent_22%),#050505] p-4 pt-6 md:p-8">
				<div className="rounded-[28px] border border-white/10 bg-black/30 px-6 py-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] md:px-8">
					<div className="flex flex-col md:flex-row items-center justify-between space-y-2">
					<div>
						<h1 className="text-3xl font-bold tracking-tight text-white">
							Dashboard
						</h1>
						{selectedProject && (
							<p className="mt-1 text-sm text-zinc-400">
								Project: {selectedProject.name}
								{selectedOrganization && (
									<span className="ml-2">
										• Organization: {selectedOrganization.name}
									</span>
								)}
								<span className="ml-2">• Live usage refreshes every 15s</span>
							</p>
						)}
					</div>
					<div className="flex items-center space-x-2">
						{selectedOrganization && selectedProject && (
							<>
								<CreateApiKeyDialog
									selectedProject={selectedProject}
									disabled={
										planLimits
											? planLimits.currentCount >= planLimits.maxKeys
											: false
									}
									disabledMessage={
										planLimits
											? `${planLimits.plan === "pro" ? "Pro" : "Free"} plan allows maximum ${planLimits.maxKeys} API keys per project`
											: undefined
									}
								>
									<Button
										variant="outline"
										disabled={
											!selectedProject ||
											(planLimits
												? planLimits.currentCount >= planLimits.maxKeys
												: false)
										}
										className="flex items-center border-white/10 bg-white/5 text-white hover:bg-white/10"
									>
										<Key className="mr-2 h-4 w-4" />
										Create API Key
									</Button>
								</CreateApiKeyDialog>
								<TopUpCreditsButton />
							</>
						)}
						{selectedOrganization && !selectedProject && <TopUpCreditsButton />}
					</div>
					</div>
				</div>

				<ReferralBanner />

				<DateRangePicker buildUrl={buildUrl} />

				<div className="space-y-4">
					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
						<Card className="rounded-[28px] border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] lg:col-span-2">
							<CardContent className="p-6">
								<div className="mb-5 flex items-start justify-between gap-4">
									<div>
										<p className="text-sm text-zinc-400">Daily Request Limits</p>
										<div className="mt-2 flex items-end gap-3">
											<p className="text-3xl font-semibold tracking-tight text-white">
												{requestLimits.rpm} RPM
											</p>
											<p className="pb-1 text-sm text-zinc-500">
												{requestLimits.rpd} RPD
											</p>
										</div>
									</div>
									<div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300">
										<Gauge className="h-5 w-5" />
									</div>
								</div>
								<div className="space-y-3">
									<div className="flex items-center justify-between text-sm">
										<span className="text-zinc-400">{requestLimits.label}</span>
										<span className="font-medium text-white">
											{isLoading
												? "Loading..."
												: `${totalRequests.toLocaleString()} used`}
										</span>
									</div>
									<div className="h-2 overflow-hidden rounded-full bg-white/5">
										<div
											className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 transition-all"
											style={{ width: `${requestUsagePercent}%` }}
										/>
									</div>
									<div className="flex items-center justify-between text-xs text-zinc-500">
										<span>
											{format(from, "MMM d")} - {format(to, "MMM d")}
										</span>
										<span>
											{Math.max(
												requestLimits.rpd - totalRequests,
												0,
											).toLocaleString()}{" "}
											remaining
										</span>
									</div>
								</div>
							</CardContent>
						</Card>
						<MetricCard
							label="Organization Credits"
							value={`$${
								selectedOrganization
									? Number(selectedOrganization.credits).toFixed(8)
									: "0.00"
							}`}
							subtitle="Available balance"
							icon={<CreditCard className="h-4 w-4" />}
							accent="blue"
						/>
						<MetricCard
							label="Total Requests"
							value={isLoading ? "Loading..." : totalRequests.toLocaleString()}
							subtitle={
								isLoading
									? "–"
									: `${format(from, "MMM d")} - ${format(to, "MMM d")}${
											activityData.length > 0
												? ` • ${(
														activityData.reduce(
															(sum, day) => sum + day.cacheRate,
															0,
														) / activityData.length
													).toFixed(1)}% cached`
												: ""
										}`
							}
							icon={<Zap className="h-4 w-4" />}
							accent="purple"
						/>
						<MetricCard
							label="Total Cost"
							value={isLoading ? "Loading..." : `$${totalCost.toFixed(2)}`}
							subtitle={
								isLoading
									? "–"
									: `${format(from, "MMM d")} - ${format(to, "MMM d")}${
											totalRequestCost > 0
												? ` • $${totalRequestCost.toFixed(2)} requests`
												: ""
										}${
											totalDataStorageCost > 0
												? ` • $${totalDataStorageCost.toFixed(4)} storage`
												: ""
										}`
							}
							icon={<CircleDollarSign className="h-4 w-4" />}
							accent="purple"
						/>
						<MetricCard
							label="Input Tokens & Cost"
							value={
								isLoading
									? "Loading..."
									: `${formatTokens(totalInputTokens)} • $${totalInputCost.toFixed(2)}`
							}
							subtitle={isLoading ? "–" : "Prompt tokens and associated cost"}
							icon={<ArrowDownToLine className="h-4 w-4" />}
							accent="blue"
						/>
						<MetricCard
							label="Output Tokens & Cost"
							value={
								isLoading
									? "Loading..."
									: `${formatTokens(totalOutputTokens)} • $${totalOutputCost.toFixed(2)}`
							}
							subtitle={
								isLoading ? "–" : "Completion tokens and associated cost"
							}
							icon={<ArrowUpFromLine className="h-4 w-4" />}
							accent="purple"
						/>
						<MetricCard
							label="Cached Tokens & Cost"
							value={
								isLoading
									? "Loading..."
									: `${formatTokens(totalCachedTokens)} • $${totalCachedInputCost.toFixed(2)}`
							}
							subtitle={
								isLoading
									? "–"
									: "Tokens and cost served from cache (if supported)"
							}
							icon={<Server className="h-4 w-4" />}
							accent="green"
						/>
					</div>
					{!isLoading && totalRequests < 5 ? (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
							<Card className="col-span-4 rounded-[28px] border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
								<CardHeader>
									<CardTitle>Get Started</CardTitle>
									<CardDescription>
										{totalRequests > 0
											? `You made ${totalRequests === 1 ? "your first call" : `${totalRequests} calls`} during setup! Now integrate KiwiLLM in your own code.`
											: "Integrate KiwiLLM in 1 line — just change your base URL."}
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<QuickStartSection />
									<div className="flex flex-wrap gap-2">
										<Button asChild variant="outline" size="sm">
											<a
												href={config.docsUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												<BookOpen className="mr-2 h-4 w-4" />
												Docs
												<ExternalLink className="ml-1.5 h-3 w-3" />
											</a>
										</Button>
										<Button asChild variant="outline" size="sm">
											<a
												href={config.playgroundUrl}
												target="_blank"
												rel="noopener noreferrer"
											>
												<FlaskConical className="mr-2 h-4 w-4" />
												Playground
												<ExternalLink className="ml-1.5 h-3 w-3" />
											</a>
										</Button>
										<Button asChild variant="outline" size="sm">
											<Link href="/models" prefetch={true}>
												<MessageSquare className="mr-2 h-4 w-4" />
												Models
											</Link>
										</Button>
									</div>
								</CardContent>
							</Card>
							<Card className="col-span-3 rounded-[28px] border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
								<CardHeader>
									<CardTitle>Quick Actions</CardTitle>
									<CardDescription>
										Common tasks you might want to perform
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-2">
									{quickActions.map((action) => (
										<Button
											key={action.href}
											asChild
											variant="outline"
											className="w-full justify-start"
										>
											<Link
												href={buildUrl(action.href)}
												prefetch={true}
											>
												<action.icon className="mr-2 h-4 w-4" />
												{action.label}
											</Link>
										</Button>
									))}
								</CardContent>
							</Card>
						</div>
					) : (
						<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
							<Card className="col-span-4 rounded-[28px] border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
								<CardHeader>
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<CardTitle>Usage Overview</CardTitle>
											<CardDescription>
												{metric === "costs"
													? "Provider pricing for reference"
													: "Total Requests"}
												{selectedProject && (
													<span className="block mt-1 text-sm">
														Filtered by project: {selectedProject.name}
													</span>
												)}
											</CardDescription>
										</div>
										<Select value={metric} onValueChange={updateMetricInUrl}>
											<SelectTrigger className="w-[140px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="costs">Costs</SelectItem>
												<SelectItem value="requests">Requests</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</CardHeader>
								<CardContent className="pl-2">
									<Overview
										data={activityData}
										isLoading={isLoading}
										metric={metric}
									/>
								</CardContent>
							</Card>
							<Card className="col-span-3 rounded-[28px] border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
								<CardHeader>
									<CardTitle>Quick Actions</CardTitle>
									<CardDescription>
										Common tasks you might want to perform
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-2">
									{quickActions.map((action) => (
										<Button
											key={action.href}
											asChild
											variant="outline"
											className="w-full justify-start"
										>
											<Link
												href={buildUrl(action.href)}
												prefetch={true}
											>
												<action.icon className="mr-2 h-4 w-4" />
												{action.label}
											</Link>
										</Button>
									))}
								</CardContent>
							</Card>
						</div>
					)}

					<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
						<div className="col-span-4 space-y-4">
							<CostBreakdownCard initialActivityData={initialActivityData} />
						</div>
						<div className="col-span-3">
							<ErrorsReliabilityCard
								activityData={activityData}
								isLoading={isLoading}
							/>
						</div>
					</div>
					<div>
						<RecentActivityCard
							activityData={activityData}
							isLoading={isLoading}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
