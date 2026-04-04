import {
	Activity,
	AlertTriangle,
	ArrowDownToLine,
	ArrowUpFromLine,
	Banknote,
	Building2,
	Clock3,
	CircleDollarSign,
	Cpu,
	KeyRound,
	PiggyBank,
	Rocket,
	Sparkles,
	TimerReset,
	UserCheck,
	Users,
	Workflow,
} from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { DashboardCostByModel } from "@/components/dashboard-cost-by-model";
import { DateRangePicker } from "@/components/date-range-picker";
import { RevenueChart } from "@/components/revenue-chart";
import { SignupsChart } from "@/components/signups-chart";
import { Button } from "@/components/ui/button";
import { createServerApiClient } from "@/lib/server-api";
import { cn } from "@/lib/utils";

import type { ReactNode } from "react";

const currencyFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	maximumFractionDigits: 2,
});

const numberFormatter = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("en-US", {
	notation: "compact",
	compactDisplay: "short",
	maximumFractionDigits: 1,
});

const percentFormatter = new Intl.NumberFormat("en-US", {
	maximumFractionDigits: 1,
});

interface AdminDashboardData {
	totalSignups: number;
	verifiedUsers: number;
	payingCustomers: number;
	totalRevenue: number;
	totalProcessed: number;
	totalOrganizations: number;
	totalProjects: number;
	activeApiKeys: number;
	totalRequests: number;
	successfulRequests: number;
	failedRequests: number;
	successRate: number;
	totalTokens: number;
	averageLatencyMs: number;
	averageTimeToFirstTokenMs: number;
	topModel: string | null;
	topProvider: string | null;
	totalToppedUp: number;
	totalSpent: number;
	unusedCredits: number;
	overage: number;
}

function MetricCard({
	label,
	value,
	subtitle,
	icon,
	accent,
}: {
	label: string;
	value: string;
	subtitle?: string;
	icon?: ReactNode;
	accent?: "green" | "blue" | "purple" | "red";
}) {
	return (
		<div className="bg-card text-card-foreground flex flex-col justify-between gap-3 rounded-2xl border border-border/60 p-5 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<div>
					<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
						{label}
					</p>
					<p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
					{subtitle ? (
						<p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
					) : null}
				</div>
				{icon ? (
					<div
						className={cn(
							"inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs",
							accent === "green" &&
								"border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
							accent === "blue" &&
								"border-sky-500/30 bg-sky-500/10 text-sky-400",
							accent === "purple" &&
								"border-violet-500/30 bg-violet-500/10 text-violet-400",
							accent === "red" &&
								"border-red-500/30 bg-red-500/10 text-red-400",
						)}
					>
						{icon}
					</div>
				) : null}
			</div>
		</div>
	);
}

function AdminSection({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: ReactNode;
}) {
	return (
		<section className="overflow-hidden rounded-3xl border border-border/60 bg-card/70 shadow-sm">
			<div className="border-b border-border/60 px-6 py-5">
				<h2 className="text-xl font-semibold tracking-tight">{title}</h2>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</div>
			<div className="p-6">{children}</div>
		</section>
	);
}

function SignInPrompt() {
	return (
		<div className="flex min-h-screen items-center justify-center px-4">
			<div className="w-full max-w-md text-center">
				<div className="mb-8">
					<h1 className="text-3xl font-semibold tracking-tight">
						Admin Dashboard
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						Sign in to access the admin dashboard
					</p>
				</div>
				<Button asChild size="lg" className="w-full">
					<Link href="/login">Sign In</Link>
				</Button>
			</div>
		</div>
	);
}

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = await searchParams;
	const from = typeof params.from === "string" ? params.from : undefined;
	const to = typeof params.to === "string" ? params.to : undefined;

	const $api = await createServerApiClient();
	const [metricsRes, timeseriesRes] = await Promise.all([
		$api.GET("/admin/metrics", { params: { query: { from, to } } }),
		$api.GET("/admin/metrics/timeseries", {
			params: { query: { from, to } },
		}),
	]);
	const metrics = metricsRes.data as AdminDashboardData | undefined;
	const timeseries = timeseriesRes.data;

	if (!metrics) {
		return <SignInPrompt />;
	}

	return (
		<div className="mx-auto flex w-full max-w-[1920px] flex-col gap-6 px-4 py-8 md:px-8">
			<header className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
				<div>
					<h1 className="text-3xl font-semibold tracking-tight">
						Admin Dashboard
					</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Overview of users, customers, and revenue.
					</p>
				</div>
				<div className="flex items-center gap-3">
					<Suspense>
						<DateRangePicker />
					</Suspense>
					<div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
						<span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
						<span>Live data</span>
					</div>
				</div>
			</header>

			<section className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
				<div className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-sm">
					<div className="border-b border-border/60 px-6 py-5">
						<h2 className="text-xl font-semibold tracking-tight">
							Platform Overview
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							Global activity and platform health across all organizations.
						</p>
					</div>
					<div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-3">
						<MetricCard
							label="Total Global Requests"
							value={compactNumberFormatter.format(metrics.totalRequests)}
							subtitle={`${compactNumberFormatter.format(metrics.successfulRequests)} successful • ${compactNumberFormatter.format(metrics.failedRequests)} failed`}
							icon={<Activity className="h-4 w-4" />}
							accent="blue"
						/>
						<MetricCard
							label="Success Rate"
							value={`${percentFormatter.format(metrics.successRate)}%`}
							subtitle="Based on all routed requests"
							icon={<Rocket className="h-4 w-4" />}
							accent="green"
						/>
						<MetricCard
							label="Total Tokens"
							value={compactNumberFormatter.format(metrics.totalTokens)}
							subtitle="Prompt + completion tokens processed"
							icon={<Cpu className="h-4 w-4" />}
							accent="purple"
						/>
						<MetricCard
							label="Average Latency"
							value={`${numberFormatter.format(metrics.averageLatencyMs)} ms`}
							subtitle="Average full request duration"
							icon={<Clock3 className="h-4 w-4" />}
							accent="blue"
						/>
						<MetricCard
							label="Average Time To First Token"
							value={`${numberFormatter.format(metrics.averageTimeToFirstTokenMs)} ms`}
							subtitle="Average TTFT for streamed responses"
							icon={<TimerReset className="h-4 w-4" />}
							accent="purple"
						/>
						<MetricCard
							label="Active API Keys"
							value={numberFormatter.format(metrics.activeApiKeys)}
							subtitle={`${numberFormatter.format(metrics.totalProjects)} projects across ${numberFormatter.format(metrics.totalOrganizations)} orgs`}
							icon={<KeyRound className="h-4 w-4" />}
							accent="green"
						/>
					</div>
				</div>

				<div className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 shadow-sm">
					<div className="border-b border-border/60 px-6 py-5">
						<h2 className="text-xl font-semibold tracking-tight">
							Live Snapshot
						</h2>
						<p className="mt-1 text-sm text-muted-foreground">
							High-signal admin checkpoints for what the platform is doing now.
						</p>
					</div>
					<div className="space-y-4 p-6">
						<div className="rounded-2xl border border-border/60 bg-background/70 p-4">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Top Model
							</p>
							<p className="mt-2 text-lg font-semibold">
								{metrics.topModel ?? "No activity yet"}
							</p>
						</div>
						<div className="rounded-2xl border border-border/60 bg-background/70 p-4">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Top Provider
							</p>
							<p className="mt-2 text-lg font-semibold">
								{metrics.topProvider ?? "No activity yet"}
							</p>
						</div>
						<div className="rounded-2xl border border-border/60 bg-background/70 p-4">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Paying Customers
							</p>
							<p className="mt-2 text-lg font-semibold">
								{numberFormatter.format(metrics.payingCustomers)}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								Organizations with completed payments in the selected range
							</p>
						</div>
						<div className="rounded-2xl border border-border/60 bg-background/70 p-4">
							<p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
								Verified Users
							</p>
							<p className="mt-2 text-lg font-semibold">
								{numberFormatter.format(metrics.verifiedUsers)}
							</p>
							<p className="mt-1 text-xs text-muted-foreground">
								From {numberFormatter.format(metrics.totalSignups)} signups in
								range
							</p>
						</div>
					</div>
				</div>
			</section>

			<AdminSection
				title="Growth & Revenue"
				description="Commercial and account growth metrics for the selected window."
			>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="Total Sign Ups"
						value={numberFormatter.format(metrics.totalSignups)}
						subtitle="All registered user accounts"
						icon={<Users className="h-4 w-4" />}
						accent="blue"
					/>
					<MetricCard
						label="Verified Users"
						value={numberFormatter.format(metrics.verifiedUsers)}
						subtitle="Users with verified email addresses"
						icon={<UserCheck className="h-4 w-4" />}
						accent="green"
					/>
					<MetricCard
						label="Total Revenue"
						value={currencyFormatter.format(metrics.totalRevenue)}
						subtitle="Money in (excl. Stripe fees & refunds)"
						icon={<CircleDollarSign className="h-4 w-4" />}
						accent="green"
					/>
					<MetricCard
						label="Total Processed"
						value={currencyFormatter.format(metrics.totalProcessed)}
						subtitle="Stripe gross revenue (incl. fees)"
						icon={<Banknote className="h-4 w-4" />}
						accent="green"
					/>
				</div>
			</AdminSection>

			<AdminSection
				title="Credits & Billing"
				description="Credit flow across all organizations, from top-ups to usage."
			>
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="Total Topped Up"
						value={currencyFormatter.format(metrics.totalToppedUp)}
						subtitle="All-time credits purchased"
						icon={<ArrowDownToLine className="h-4 w-4" />}
						accent="green"
					/>
					<MetricCard
						label="Total Spent"
						value={currencyFormatter.format(metrics.totalSpent)}
						subtitle="All-time usage costs"
						icon={<ArrowUpFromLine className="h-4 w-4" />}
						accent="purple"
					/>
					<MetricCard
						label="Unused Credits"
						value={currencyFormatter.format(metrics.unusedCredits)}
						subtitle="Credits sitting unused across all orgs"
						icon={<PiggyBank className="h-4 w-4" />}
						accent="blue"
					/>
					<MetricCard
						label="Total Organizations"
						value={numberFormatter.format(metrics.totalOrganizations)}
						subtitle="All registered organizations"
						icon={<Building2 className="h-4 w-4" />}
						accent="blue"
					/>
				</div>
				{metrics.overage > 0 && (
					<MetricCard
						label="Overage"
						value={currencyFormatter.format(metrics.overage)}
						subtitle="Spending exceeding topped-up credits"
						icon={<AlertTriangle className="h-4 w-4" />}
						accent="red"
					/>
				)}
			</AdminSection>

			{timeseries ? (
				<section className="grid gap-6 lg:grid-cols-2">
					<SignupsChart
						data={timeseries.data}
						totals={{
							signups: timeseries.totals.signups,
							paidCustomers: timeseries.totals.paidCustomers,
						}}
					/>
					<RevenueChart
						data={timeseries.data}
						totalRevenue={timeseries.totals.revenue}
					/>
				</section>
			) : null}

			<section>
				<DashboardCostByModel from={from} to={to} />
			</section>

			<section className="grid gap-4 md:grid-cols-3">
				<div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm">
					<div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400">
						<Building2 className="h-4 w-4" />
					</div>
					<h3 className="mt-4 text-lg font-semibold">Organizations</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Inspect customer orgs, balances, projects, and ownership details.
					</p>
					<Button asChild className="mt-4">
						<Link href="/organizations">View Organizations</Link>
					</Button>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm">
					<div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400">
						<Workflow className="h-4 w-4" />
					</div>
					<h3 className="mt-4 text-lg font-semibold">Models & Providers</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Manage provider coverage, mappings, and model-level operational
						data.
					</p>
					<div className="mt-4 flex gap-2">
						<Button asChild variant="outline">
							<Link href="/models">Models</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/providers">Providers</Link>
						</Button>
					</div>
				</div>
				<div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm">
					<div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
						<Sparkles className="h-4 w-4" />
					</div>
					<h3 className="mt-4 text-lg font-semibold">Admin Tools</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Control pricing behavior, global discounts, and platform rollouts.
					</p>
					<div className="mt-4 flex gap-2">
						<Button asChild variant="outline">
							<Link href="/discounts">Discounts</Link>
						</Button>
						<Button asChild variant="outline">
							<Link href="/model-provider-mappings">Mappings</Link>
						</Button>
					</div>
				</div>
			</section>
		</div>
	);
}
