"use client";

import { formatDistanceToNow } from "date-fns";
import {
	AlertCircle,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock3,
	ExternalLink,
	RefreshCw,
	XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import {
	type DateRange,
	DateRangeSelect,
} from "@/components/date-range-select";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import { Input } from "@/lib/components/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/lib/components/select";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/lib/components/table";
import { useApi } from "@/lib/fetch-client";

import type { LogsData } from "@/types/activity";

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
	initialData?: LogsData | undefined;
	projectId: string | null;
	orgId?: string | null;
}

function formatCurrency(value: number | null | undefined) {
	if (!value) {
		return "$0";
	}

	return `$${value.toFixed(6)}`;
}

function formatDuration(value: number | null | undefined) {
	if (!value) {
		return "-";
	}

	if (value < 1000) {
		return `${value}ms`;
	}

	return `${(value / 1000).toFixed(2)}s`;
}

function getStatusBadge(log: LogsData["logs"][number]) {
	if (log.hasError) {
		return {
			label: "Error",
			variant: "destructive" as const,
		};
	}

	if (log.unifiedFinishReason === "content_filter") {
		return {
			label: "Filtered",
			variant: "destructive" as const,
		};
	}

	return {
		label: log.unifiedFinishReason ?? "completed",
		variant: "outline" as const,
	};
}

export function RecentLogs({ initialData, projectId, orgId }: RecentLogsProps) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const api = useApi();

	const initialPage = Number(searchParams.get("page") ?? "1");
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
	const [page, setPage] = useState(Number.isNaN(initialPage) ? 1 : initialPage);

	const { data: uniqueModels } = api.useQuery("get", "/logs/unique-models", {
		params: {
			query: projectId ? { projectId } : {},
		},
		enabled: !!projectId,
		refetchOnWindowFocus: false,
		staleTime: 10 * 60 * 1000,
	});

	const updateUrlWithFilters = useCallback(
		(
			newParams: Record<string, string | undefined>,
			options?: { resetPage?: boolean },
		) => {
			const params = new URLSearchParams(searchParams.toString());

			Object.entries(newParams).forEach(([key, value]) => {
				if (value && value !== "all") {
					params.set(key, value);
				} else {
					params.delete(key);
				}
			});

			const explicitPage = newParams.page ? Number(newParams.page) : undefined;
			const nextPage =
				options?.resetPage === false ? (explicitPage ?? page) : 1;
			if (nextPage > 1) {
				params.set("page", String(nextPage));
			} else {
				params.delete("page");
			}

			router.push(`?${params.toString()}`, { scroll: false });
		},
		[page, router, searchParams],
	);

	const handleFilterChange = useCallback(
		(filterKey: string, setter: (value: string | undefined) => void) => {
			return (value: string) => {
				const filterValue = value === "all" ? undefined : value;
				setter(filterValue);
				setPage(1);
				updateUrlWithFilters({ [filterKey]: filterValue });
			};
		},
		[updateUrlWithFilters],
	);

	const handlePageChange = useCallback(
		(nextPage: number) => {
			setPage(nextPage);
			updateUrlWithFilters({ page: nextPage > 1 ? String(nextPage) : undefined }, {
				resetPage: false,
			});
		},
		[updateUrlWithFilters],
	);

	const queryParams = useMemo(() => {
		const nextQueryParams: Record<string, string> = {
			orderBy: "createdAt_desc",
			page: String(page),
			limit: "25",
		};

		if (dateRange?.start) {
			nextQueryParams.startDate = dateRange.start.toISOString();
		}
		if (dateRange?.end) {
			nextQueryParams.endDate = dateRange.end.toISOString();
		}
		if (unifiedFinishReason && unifiedFinishReason !== "all") {
			nextQueryParams.unifiedFinishReason = unifiedFinishReason;
		}
		if (provider && provider !== "all") {
			nextQueryParams.provider = provider;
		}
		if (model && model !== "all") {
			nextQueryParams.model = model;
		}
		if (customHeaderKey.trim()) {
			nextQueryParams.customHeaderKey = customHeaderKey.trim();
		}
		if (customHeaderValue.trim()) {
			nextQueryParams.customHeaderValue = customHeaderValue.trim();
		}
		if (projectId) {
			nextQueryParams.projectId = projectId;
		}

		return nextQueryParams;
	}, [
		customHeaderKey,
		customHeaderValue,
		dateRange?.end,
		dateRange?.start,
		model,
		page,
		projectId,
		provider,
		unifiedFinishReason,
	]);

	const shouldUseInitialData =
		page === (Number(searchParams.get("page") ?? "1") || 1) &&
		!dateRange &&
		unifiedFinishReason ===
			(searchParams.get("unifiedFinishReason") ?? undefined) &&
		provider === (searchParams.get("provider") ?? undefined) &&
		model === (searchParams.get("model") ?? undefined) &&
		customHeaderKey === (searchParams.get("customHeaderKey") ?? "") &&
		customHeaderValue === (searchParams.get("customHeaderValue") ?? "");

	const logsQuery = api.useQuery(
		"get",
		"/logs",
		{
			params: {
				query: queryParams,
			},
		},
		{
			enabled: !!projectId,
			initialData: shouldUseInitialData ? initialData : undefined,
			refetchOnWindowFocus: false,
			staleTime: 30 * 1000,
		},
	);

	const logsData = logsQuery.data as LogsData | undefined;
	const logs = logsData?.logs ?? [];
	const pagination = logsData?.pagination;
	const summary = logsData?.summary;

	const pageNumbers = useMemo(() => {
		const totalPages = pagination?.totalPages ?? 0;

		if (totalPages <= 1) {
			return [];
		}

		const start = Math.max(1, page - 2);
		const end = Math.min(totalPages, page + 2);
		const numbers: number[] = [];

		for (let current = start; current <= end; current += 1) {
			numbers.push(current);
		}

		return numbers;
	}, [page, pagination?.totalPages]);

	if (!projectId) {
		return (
			<div className="py-8 text-center text-muted-foreground">
				<p>Please select a project to view recent logs.</p>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 className="text-3xl font-bold tracking-tight">Logs</h2>
					<p className="text-sm text-muted-foreground">
						Monitor and debug your API requests with real filtered totals.
					</p>
				</div>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => void logsQuery.refetch()}
					disabled={logsQuery.isFetching}
				>
					<RefreshCw className="mr-2 h-4 w-4" />
					{logsQuery.isFetching ? "Refreshing..." : "Refresh"}
				</Button>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<div className="rounded-3xl border bg-card p-6">
					<div className="mb-6 flex items-start justify-between">
						<div>
							<p className="text-sm text-muted-foreground">Total Requests</p>
							<p className="mt-3 text-4xl font-semibold">
								{summary?.totalRequests ?? 0}
							</p>
							<p className="mt-4 text-sm text-muted-foreground">
								Actual filtered total across all pages
							</p>
						</div>
						<div className="rounded-2xl border p-3 text-sky-500">
							<Clock3 className="h-5 w-5" />
						</div>
					</div>
				</div>

				<div className="rounded-3xl border bg-card p-6">
					<div className="mb-6 flex items-start justify-between">
						<div>
							<p className="text-sm text-muted-foreground">Success Rate</p>
							<p className="mt-3 text-4xl font-semibold">
								{summary?.successRate?.toFixed(1) ?? "0.0"}%
							</p>
							<p className="mt-4 text-sm text-muted-foreground">
								{summary?.successRequests ?? 0} successful requests
							</p>
						</div>
						<div className="rounded-2xl border p-3 text-emerald-500">
							<CheckCircle2 className="h-5 w-5" />
						</div>
					</div>
				</div>

				<div className="rounded-3xl border bg-card p-6">
					<div className="mb-6 flex items-start justify-between">
						<div>
							<p className="text-sm text-muted-foreground">Errors</p>
							<p className="mt-3 text-4xl font-semibold">
								{summary?.errorRequests ?? 0}
							</p>
							<p className="mt-4 text-sm text-muted-foreground">
								Requests requiring attention
							</p>
						</div>
						<div className="rounded-2xl border p-3 text-rose-500">
							<XCircle className="h-5 w-5" />
						</div>
					</div>
				</div>
			</div>

			<div className="flex flex-wrap gap-2">
				<DateRangeSelect
					onChange={(_value, range) => {
						setDateRange(range);
						setPage(1);
						updateUrlWithFilters({
							startDate: range.start?.toISOString(),
							endDate: range.end?.toISOString(),
						});
					}}
				/>

				<Select
					onValueChange={handleFilterChange(
						"unifiedFinishReason",
						setUnifiedFinishReason,
					)}
					value={unifiedFinishReason ?? "all"}
				>
					<SelectTrigger className="w-[180px]">
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
					<SelectTrigger className="w-[180px]">
						<SelectValue placeholder="All providers" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All providers</SelectItem>
						{(uniqueModels?.providers ?? []).map((providerName) => (
							<SelectItem key={providerName} value={providerName}>
								{providerName}
							</SelectItem>
						))}
					</SelectContent>
				</Select>

				<Select
					onValueChange={handleFilterChange("model", setModel)}
					value={model ?? "all"}
				>
					<SelectTrigger className="w-[200px]">
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
					onChange={(event) => {
						const nextValue = event.target.value;
						setCustomHeaderKey(nextValue);
						setPage(1);
						updateUrlWithFilters({
							customHeaderKey: nextValue || undefined,
						});
					}}
					className="w-[180px]"
				/>

				<Input
					placeholder="Header value"
					value={customHeaderValue}
					onChange={(event) => {
						const nextValue = event.target.value;
						setCustomHeaderValue(nextValue);
						setPage(1);
						updateUrlWithFilters({
							customHeaderValue: nextValue || undefined,
						});
					}}
					className="w-[180px]"
				/>
			</div>

			<div className="overflow-hidden rounded-3xl border bg-card">
				<div className="border-b px-6 py-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<div>
							<h3 className="text-lg font-semibold">Request Logs</h3>
							<p className="text-sm text-muted-foreground">
								Page {pagination?.page ?? page} of {pagination?.totalPages ?? 0}{" "}
								with {pagination?.totalCount ?? 0} filtered logs
							</p>
						</div>
					</div>
				</div>

				{logsQuery.isLoading ? (
					<div className="p-6 text-sm text-muted-foreground">
						Loading logs...
					</div>
				) : logsQuery.error ? (
					<div className="p-6 text-sm text-red-500">Error loading logs.</div>
				) : logs.length === 0 ? (
					<div className="p-6 text-sm text-muted-foreground">
						No logs found matching the selected filters.
					</div>
				) : (
					<div className="overflow-x-auto">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Time</TableHead>
									<TableHead>Status</TableHead>
									<TableHead>Model</TableHead>
									<TableHead>Provider</TableHead>
									<TableHead>Source</TableHead>
									<TableHead>Tokens</TableHead>
									<TableHead>Duration</TableHead>
									<TableHead>Cost</TableHead>
									<TableHead className="text-right">Details</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{logs.map((log) => {
									const createdAt = new Date(log.createdAt);
									const status = getStatusBadge(log);

									return (
										<TableRow key={log.id}>
											<TableCell className="whitespace-normal">
												<div className="font-medium">
													{formatDistanceToNow(createdAt, {
														addSuffix: true,
													})}
												</div>
												<div className="text-xs text-muted-foreground">
													{createdAt.toLocaleString()}
												</div>
											</TableCell>
											<TableCell>
												<Badge variant={status.variant}>{status.label}</Badge>
												{log.hasError && (
													<div className="mt-1 flex items-center gap-1 text-xs text-red-500">
														<AlertCircle className="h-3 w-3" />
														Failed
													</div>
												)}
											</TableCell>
											<TableCell className="max-w-[260px] whitespace-normal break-words">
												{log.usedModel}
											</TableCell>
											<TableCell>{log.usedProvider}</TableCell>
											<TableCell className="max-w-[180px] whitespace-normal break-words">
												{log.source ?? "-"}
											</TableCell>
											<TableCell>{log.totalTokens ?? "-"}</TableCell>
											<TableCell>{formatDuration(log.duration)}</TableCell>
											<TableCell>{formatCurrency(log.cost)}</TableCell>
											<TableCell className="text-right">
												<Button asChild variant="ghost" size="sm">
													<Link
														href={`/dashboard/${orgId}/${projectId}/activity/${log.id}`}
														prefetch={false}
													>
														<ExternalLink className="mr-2 h-4 w-4" />
														View
													</Link>
												</Button>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>
				)}

				<div className="border-t px-6 py-4">
					<div className="flex flex-wrap items-center justify-between gap-3">
						<p className="text-sm text-muted-foreground">
							Showing page {pagination?.page ?? page} of{" "}
							{pagination?.totalPages ?? 0}
						</p>
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() => handlePageChange(Math.max(1, page - 1))}
								disabled={(pagination?.page ?? page) <= 1}
							>
								<ChevronLeft className="mr-1 h-4 w-4" />
								Prev
							</Button>
							{pageNumbers.map((pageNumber) => (
								<Button
									key={pageNumber}
									type="button"
									variant={
										pageNumber === (pagination?.page ?? page)
											? "default"
											: "outline"
									}
									size="sm"
									onClick={() => handlePageChange(pageNumber)}
								>
									{pageNumber}
								</Button>
							))}
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={() =>
									handlePageChange(
										Math.min(
											pagination?.totalPages ?? page,
											(pagination?.page ?? page) + 1,
										),
									)
								}
								disabled={
									(pagination?.page ?? page) >= (pagination?.totalPages ?? 0)
								}
							>
								Next
								<ChevronRight className="ml-1 h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
