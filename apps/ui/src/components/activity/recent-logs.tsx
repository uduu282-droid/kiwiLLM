"use client";

import { format, formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	CheckCircle2,
	ChevronDown,
	ChevronUp,
	Clock3,
	Download,
	ExternalLink,
	RefreshCw,
	Search,
	Server,
	Sparkles,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";

import {
	type DateRange,
	DateRangeSelect,
} from "@/components/date-range-select";
import { Button } from "@/lib/components/button";
import { Card, CardContent, CardHeader } from "@/lib/components/card";
import { Input } from "@/lib/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/lib/components/select";
import { useApi } from "@/lib/fetch-client";
import { LIVE_DASHBOARD_REFRESH_MS } from "@/lib/live-refresh";
import { cn } from "@/lib/utils";

import type { Log } from "@llmgateway/db";

const UnifiedFinishReason = {
	COMPLETED: "completed",
	LENGTH_LIMIT: "length_limit",
	CONTENT_FILTER: "content_filter",
	TOOL_CALLS: "tool_calls",
	GATEWAY_ERROR: "gateway_error",
	UPSTREAM_ERROR: "upstream_error",
	CANCELED: "canceled",
	UNKNOWN: "unknown",
} as const;

interface RecentLogsProps {
	initialData?:
		| {
				message?: string;
				logs: Log[];
				pagination: {
					nextCursor: string | null;
					hasMore: boolean;
					limit: number;
				};
		  }
		| undefined;
	projectId: string | null;
	orgId?: string | null;
}

type ClientLog = Omit<Log, "createdAt" | "updatedAt"> & {
	createdAt: string;
	updatedAt: string;
};

function formatDuration(ms: number | null | undefined) {
	if (!ms) {
		return "0ms";
	}
	if (ms < 1000) {
		return `${ms}ms`;
	}
	return `${(ms / 1000).toFixed(2)}s`;
}

function formatStatus(log: Pick<ClientLog, "hasError" | "unifiedFinishReason">) {
	if (log.hasError || log.unifiedFinishReason === "gateway_error") {
		return { label: "Error", icon: XCircle, className: "text-rose-300" };
	}
	if (log.unifiedFinishReason === "upstream_error") {
		return {
			label: "Upstream Error",
			icon: AlertTriangle,
			className: "text-amber-300",
		};
	}
	if (log.unifiedFinishReason === "canceled") {
		return {
			label: "Canceled",
			icon: AlertTriangle,
			className: "text-zinc-300",
		};
	}
	return {
		label: "Completed",
		icon: CheckCircle2,
		className: "text-emerald-300",
	};
}

function isSuccessfulLog(log: Pick<ClientLog, "hasError" | "unifiedFinishReason">) {
	return (
		!log.hasError &&
		log.unifiedFinishReason !== "gateway_error" &&
		log.unifiedFinishReason !== "upstream_error" &&
		log.unifiedFinishReason !== "canceled"
	);
}

function exportLogs(logs: ClientLog[]) {
	const blob = new Blob([JSON.stringify(logs, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = `kiwillm-logs-${format(new Date(), "yyyy-MM-dd-HH-mm")}.json`;
	link.click();
	URL.revokeObjectURL(url);
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
	icon: typeof Clock3;
	accentClassName: string;
}) {
	return (
		<Card className="rounded-[28px] border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
			<CardContent className="p-6">
				<div className="mb-4 flex items-start justify-between">
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

export function RecentLogs({ initialData, projectId, orgId }: RecentLogsProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
	const [search, setSearch] = useState("");

	const [dateRange, setDateRange] = useState<DateRange | undefined>();
	const [unifiedFinishReason, setUnifiedFinishReason] = useState<
		string | undefined
	>(searchParams.get("unifiedFinishReason") ?? undefined);
	const [provider, setProvider] = useState<string | undefined>(
		searchParams.get("provider") ?? undefined,
	);
	const [model, setModel] = useState<string | undefined>(
		searchParams.get("model") ?? undefined,
	);
	const [customHeaderKey, setCustomHeaderKey] = useState<string>(
		searchParams.get("customHeaderKey") ?? "",
	);
	const [customHeaderValue, setCustomHeaderValue] = useState<string>(
		searchParams.get("customHeaderValue") ?? "",
	);

	const api = useApi();

	const { data: uniqueModels } = api.useQuery("get", "/logs/unique-models", {
		params: {
			query: projectId ? { projectId } : {},
		},
		enabled: !!projectId,
		refetchOnWindowFocus: false,
		staleTime: 10 * 60 * 1000,
	});

	const scrollPositionRef = useRef<number>(0);
	const isFilteringRef = useRef<boolean>(false);

	const updateUrlWithFilters = useCallback(
		(newParams: Record<string, string | undefined>) => {
			const params = new URLSearchParams(searchParams.toString());
			Object.entries(newParams).forEach(([key, value]) => {
				if (value && value !== "all") {
					params.set(key, value);
				} else {
					params.delete(key);
				}
			});
			router.push(`?${params.toString()}`, { scroll: false });
		},
		[router, searchParams],
	);

	useLayoutEffect(() => {
		const handleScroll = () => {
			if (!isFilteringRef.current) {
				scrollPositionRef.current = window.scrollY;
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, []);

	useLayoutEffect(() => {
		if (isFilteringRef.current) {
			window.scrollTo(0, scrollPositionRef.current);
			isFilteringRef.current = false;
		}
	});

	const handleFilterChange = useCallback(
		(filterKey: string, setter: (value: string | undefined) => void) => {
			return (value: string) => {
				isFilteringRef.current = true;
				scrollPositionRef.current = window.scrollY;
				const filterValue = value === "all" ? undefined : value;
				setter(filterValue);
				updateUrlWithFilters({ [filterKey]: filterValue });
			};
		},
		[updateUrlWithFilters],
	);

	const queryParams: Record<string, string> = {
		orderBy: "createdAt_desc",
	};

	if (dateRange?.start) {
		queryParams.startDate = dateRange.start.toISOString();
	}
	if (dateRange?.end) {
		queryParams.endDate = dateRange.end.toISOString();
	}
	if (unifiedFinishReason && unifiedFinishReason !== "all") {
		queryParams.unifiedFinishReason = unifiedFinishReason;
	}
	if (provider && provider !== "all") {
		queryParams.provider = provider;
	}
	if (model && model !== "all") {
		queryParams.model = model;
	}
	if (customHeaderKey.trim()) {
		queryParams.customHeaderKey = customHeaderKey.trim();
	}
	if (customHeaderValue.trim()) {
		queryParams.customHeaderValue = customHeaderValue.trim();
	}
	if (projectId) {
		queryParams.projectId = projectId;
	}

	const shouldUseInitialData =
		!dateRange &&
		unifiedFinishReason ===
			(searchParams.get("unifiedFinishReason") ?? undefined) &&
		provider === (searchParams.get("provider") ?? undefined) &&
		model === (searchParams.get("model") ?? undefined) &&
		customHeaderKey === (searchParams.get("customHeaderKey") ?? "") &&
		customHeaderValue === (searchParams.get("customHeaderValue") ?? "");

	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		refetch,
		isRefetching,
	} = api.useInfiniteQuery(
		"get",
		"/logs",
		{
			params: {
				query: queryParams,
			},
		},
		{
			enabled: !!projectId,
			initialData:
				shouldUseInitialData && initialData
					? {
							pages: [
								{
									...initialData,
									logs: initialData.logs.map((log) => ({
										...log,
										createdAt:
											log.createdAt instanceof Date
												? log.createdAt.toISOString()
												: log.createdAt,
										updatedAt:
											log.updatedAt instanceof Date
												? log.updatedAt.toISOString()
												: log.updatedAt,
									})),
								},
							],
							pageParams: [undefined],
						}
					: undefined,
			initialPageParam: undefined,
			refetchOnWindowFocus: false,
			staleTime: 5 * 60 * 1000,
			refetchInterval: LIVE_DASHBOARD_REFRESH_MS,
			refetchIntervalInBackground: true,
			getNextPageParam: (lastPage) => {
				return lastPage?.pagination?.hasMore
					? lastPage.pagination.nextCursor
					: undefined;
			},
		},
	);

	const allLogs = useMemo(
		() => (data?.pages.flatMap((page) => page?.logs ?? []) ?? []) as ClientLog[],
		[data],
	);

	const visibleLogs = useMemo(() => {
		const query = search.trim().toLowerCase();
		if (!query) {
			return allLogs;
		}
		return allLogs.filter((log) => {
			const haystack = [
				log.requestId,
				log.usedModel,
				log.usedProvider,
				log.requestedModel,
				log.unifiedFinishReason,
				log.source,
			]
				.filter(Boolean)
				.join(" ")
				.toLowerCase();
			return haystack.includes(query);
		});
	}, [allLogs, search]);

	const totalRequests = visibleLogs.length;
	const successfulRequests = visibleLogs.filter(isSuccessfulLog).length;
	const errorRequests = visibleLogs.filter((log) => !isSuccessfulLog(log)).length;
	const successRate =
		totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

	const handleDateRangeChange = (_value: string, range: DateRange) => {
		setDateRange(range);
		updateUrlWithFilters({
			startDate: range.start?.toISOString(),
			endDate: range.end?.toISOString(),
		});
	};

	if (!projectId) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				<p>Please select a project to view recent logs.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
				<div className="space-y-2">
					<h2 className="text-3xl font-bold tracking-tight text-white">Logs</h2>
					<p className="text-sm text-zinc-400">
						Monitor and debug your API requests in near real time.
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3">
					<Button
						variant="outline"
						className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
						onClick={() => refetch()}
						disabled={isRefetching}
					>
						<RefreshCw
							className={cn("mr-2 h-4 w-4", isRefetching && "animate-spin")}
						/>
						Refresh
					</Button>
					<Button
						className="rounded-full bg-white text-black hover:bg-zinc-200"
						onClick={() => exportLogs(visibleLogs)}
					>
						<Download className="mr-2 h-4 w-4" />
						Export Logs
					</Button>
				</div>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<MetricCard
					title="Total Requests"
					value={totalRequests.toLocaleString()}
					subtitle="Current filtered volume"
					icon={Clock3}
					accentClassName="text-sky-300"
				/>
				<MetricCard
					title="Success Rate"
					value={`${successRate.toFixed(1)}%`}
					subtitle={`${successfulRequests.toLocaleString()} successful requests`}
					icon={CheckCircle2}
					accentClassName="text-emerald-300"
				/>
				<MetricCard
					title="Errors"
					value={errorRequests.toLocaleString()}
					subtitle="Requests requiring attention"
					icon={XCircle}
					accentClassName="text-rose-300"
				/>
			</div>

			<Card className="rounded-[30px] border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
				<CardHeader className="border-b border-white/10 pb-5">
					<div className="grid gap-3 xl:grid-cols-[1.5fr_repeat(5,minmax(0,1fr))]">
						<div className="relative">
							<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
							<Input
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								placeholder="Search by model, provider, request ID, or source"
								className="h-11 rounded-full border-white/10 bg-white/5 pl-10 text-white placeholder:text-zinc-500"
							/>
						</div>
						<Select
							onValueChange={handleFilterChange(
								"unifiedFinishReason",
								setUnifiedFinishReason,
							)}
							value={unifiedFinishReason ?? "all"}
						>
							<SelectTrigger className="h-11 rounded-full border-white/10 bg-white/5 text-white">
								<SelectValue placeholder="All statuses" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All statuses</SelectItem>
								{Object.entries(UnifiedFinishReason).map(([key, value]) => (
									<SelectItem key={value} value={value}>
										{key
											.toLowerCase()
											.replace(/_/g, " ")
											.replace(/\b\w/g, (letter) => letter.toUpperCase())}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							onValueChange={handleFilterChange("provider", setProvider)}
							value={provider ?? "all"}
						>
							<SelectTrigger className="h-11 rounded-full border-white/10 bg-white/5 text-white">
								<SelectValue placeholder="All providers" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All providers</SelectItem>
								{(uniqueModels?.providers ?? []).map((providerId) => (
									<SelectItem key={providerId} value={providerId}>
										{providerId}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							onValueChange={handleFilterChange("model", setModel)}
							value={model ?? "all"}
						>
							<SelectTrigger className="h-11 rounded-full border-white/10 bg-white/5 text-white">
								<SelectValue placeholder="All models" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">All models</SelectItem>
								{(uniqueModels?.models ?? []).map((modelName) => (
									<SelectItem key={modelName} value={modelName}>
										{modelName}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Input
							placeholder="Header key"
							value={customHeaderKey}
							onChange={(e) => {
								isFilteringRef.current = true;
								scrollPositionRef.current = window.scrollY;
								setCustomHeaderKey(e.target.value);
								updateUrlWithFilters({
									customHeaderKey: e.target.value ?? undefined,
								});
							}}
							className="h-11 rounded-full border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
						/>
						<Input
							placeholder="Header value"
							value={customHeaderValue}
							onChange={(e) => {
								isFilteringRef.current = true;
								scrollPositionRef.current = window.scrollY;
								setCustomHeaderValue(e.target.value);
								updateUrlWithFilters({
									customHeaderValue: e.target.value ?? undefined,
								});
							}}
							className="h-11 rounded-full border-white/10 bg-white/5 text-white placeholder:text-zinc-500"
						/>
					</div>
					<div className="mt-3">
						<DateRangeSelect onChange={handleDateRangeChange} />
					</div>
				</CardHeader>
				<CardContent className="p-0">
					{isLoading ? (
						<div className="px-6 py-10 text-center text-zinc-400">Loading logs...</div>
					) : error ? (
						<div className="px-6 py-10 text-center text-zinc-400">
							Error loading logs.
						</div>
					) : visibleLogs.length ? (
						<div className="overflow-x-auto">
							<div className="min-w-[980px]">
								<div className="grid grid-cols-[1.3fr_1.2fr_0.9fr_0.9fr_0.8fr_0.8fr_0.5fr] gap-4 border-b border-white/10 px-6 py-4 text-xs font-medium uppercase tracking-[0.16em] text-zinc-500">
									<div>Timestamp</div>
									<div>Model</div>
									<div>Provider</div>
									<div>Status</div>
									<div>Tokens</div>
									<div>Duration</div>
									<div />
								</div>
								<div className="divide-y divide-white/5">
									{visibleLogs.map((log) => {
										const status = formatStatus(log);
										const StatusIcon = status.icon;
										const isExpanded = expandedLogId === log.id;
										return (
											<div key={log.id}>
												<div className="grid grid-cols-[1.3fr_1.2fr_0.9fr_0.9fr_0.8fr_0.8fr_0.5fr] items-center gap-4 px-6 py-4">
													<div>
														<p className="font-medium text-white">
															{format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss")}
														</p>
														<p className="mt-1 text-xs text-zinc-500">
															{formatDistanceToNow(new Date(log.createdAt), {
																addSuffix: true,
															})}
														</p>
													</div>
													<div className="min-w-0">
														<p className="truncate font-medium text-white">
															{log.usedModel ?? "---"}
														</p>
														<p className="mt-1 truncate text-xs text-zinc-500">
															{log.requestId}
														</p>
													</div>
													<div className="min-w-0">
														<div className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-sky-500/10 px-3 py-1 text-xs text-sky-200">
															<Server className="h-3 w-3" />
															<span className="truncate">{log.usedProvider ?? "---"}</span>
														</div>
													</div>
													<div>
														<div
															className={cn(
																"inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 text-xs font-medium",
																status.className,
															)}
														>
															<StatusIcon className="h-3.5 w-3.5" />
															{status.label}
														</div>
													</div>
													<div className="text-sm text-white">
														{Number(log.totalTokens ?? 0).toLocaleString()}
													</div>
													<div className="text-sm text-zinc-300">
														{formatDuration(log.duration)}
													</div>
													<div className="flex items-center justify-end gap-2">
														{orgId && projectId && log.id && (
															<Button
																asChild
																variant="ghost"
																size="sm"
																className="h-9 w-9 rounded-full border border-white/10 bg-white/5 p-0 text-zinc-300 hover:bg-white/10 hover:text-white"
															>
																<Link
																	href={`/dashboard/${orgId}/${projectId}/activity/${log.id}`}
																	prefetch={false}
																>
																	<Sparkles className="h-4 w-4" />
																	<span className="sr-only">View details</span>
																</Link>
															</Button>
														)}
														<Button
															variant="ghost"
															size="sm"
															className="h-9 w-9 rounded-full border border-white/10 bg-white/5 p-0 text-zinc-300 hover:bg-white/10 hover:text-white"
															onClick={() =>
																setExpandedLogId(isExpanded ? null : (log.id ?? null))
															}
														>
															{isExpanded ? (
																<ChevronUp className="h-4 w-4" />
															) : (
																<ChevronDown className="h-4 w-4" />
															)}
														</Button>
													</div>
												</div>
												{isExpanded && (
													<div className="border-t border-white/5 bg-white/[0.02] px-6 py-5">
														<div className="grid gap-4 lg:grid-cols-2">
															<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
																<h4 className="mb-3 text-sm font-medium text-white">
																	Request Details
																</h4>
																<div className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
																	<span className="text-zinc-500">Request ID</span>
																	<span className="break-all text-zinc-200">
																		{log.requestId}
																	</span>
																	<span className="text-zinc-500">Requested</span>
																	<span className="break-all text-zinc-200">
																		{log.requestedModel}
																	</span>
																	<span className="text-zinc-500">Used</span>
																	<span className="break-all text-zinc-200">
																		{log.usedModel}
																	</span>
																	<span className="text-zinc-500">Provider</span>
																	<span className="break-all text-zinc-200">
																		{log.usedProvider}
																	</span>
																	<span className="text-zinc-500">Source</span>
																	<span className="break-all text-zinc-200">
																		{log.source ?? "Direct API"}
																	</span>
																	<span className="text-zinc-500">Cost</span>
																	<span className="text-zinc-200">
																		${Number(log.cost ?? 0).toFixed(6)}
																	</span>
																</div>
															</div>
															<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
																<h4 className="mb-3 text-sm font-medium text-white">
																	Response Summary
																</h4>
																<div className="space-y-3">
																	<div className="grid grid-cols-3 gap-3">
																		<div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
																			<p className="text-xs text-zinc-500">Prompt</p>
																			<p className="mt-1 text-sm font-medium text-white">
																				{Number(log.promptTokens ?? 0).toLocaleString()}
																			</p>
																		</div>
																		<div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
																			<p className="text-xs text-zinc-500">Completion</p>
																			<p className="mt-1 text-sm font-medium text-white">
																				{Number(log.completionTokens ?? 0).toLocaleString()}
																			</p>
																		</div>
																		<div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
																			<p className="text-xs text-zinc-500">Cached</p>
																			<p className="mt-1 text-sm font-medium text-white">
																				{Number(log.cachedTokens ?? 0).toLocaleString()}
																			</p>
																		</div>
																	</div>
																	<div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-zinc-300">
																		<p className="mb-2 text-xs uppercase tracking-[0.14em] text-zinc-500">
																			Content Preview
																		</p>
																		<p className="line-clamp-4 whitespace-pre-wrap text-zinc-200">
																			{log.content?.trim() ||
																				log.reasoningContent?.trim() ||
																				"No stored response content for this request."}
																		</p>
																	</div>
																	{orgId && projectId && log.id && (
																		<Button
																			asChild
																			variant="outline"
																			className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
																		>
																			<Link
																				href={`/dashboard/${orgId}/${projectId}/activity/${log.id}`}
																				prefetch={false}
																			>
																				<ExternalLink className="mr-2 h-4 w-4" />
																				Open full log details
																			</Link>
																		</Button>
																	)}
																</div>
															</div>
														</div>
													</div>
												)}
											</div>
										);
									})}
								</div>
							</div>
						</div>
					) : (
						<div className="px-6 py-12 text-center text-zinc-400">
							No logs found matching the selected filters.
							{projectId && (
								<span className="mt-1 block text-sm text-zinc-500">
									Project: {projectId}
								</span>
							)}
						</div>
					)}
					{visibleLogs.length > 0 && hasNextPage && (
						<div className="border-t border-white/10 px-6 py-5">
							<Button
								onClick={() => fetchNextPage()}
								disabled={isFetchingNextPage}
								variant="outline"
								className="rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10"
							>
								{isFetchingNextPage ? "Loading more..." : "Load More Logs"}
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
