import {
	Activity,
	ArrowDownToLine,
	ArrowUpFromLine,
	Banknote,
	Building2,
	Clock3,
	CircleDollarSign,
	Cpu,
	KeyRound,
	Lock,
	PiggyBank,
	Rocket,
	ShieldAlert,
	TimerReset,
	UserCheck,
	Users,
	Workflow,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminCouponGenerator } from "@/components/admin/coupon-generator";
import { Button } from "@/lib/components/button";
import { fetchServerData } from "@/lib/server-api";

import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

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

function MetricCard({
	label,
	value,
	subtitle,
	icon,
}: {
	label: string;
	value: string;
	subtitle?: string;
	icon: React.ReactNode;
}) {
	return (
		<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_70px_rgba(0,0,0,0.24)]">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-xs font-medium uppercase tracking-[0.2em] text-white/45">
						{label}
					</p>
					<p className="mt-3 text-3xl font-semibold text-white">{value}</p>
					{subtitle ? (
						<p className="mt-2 text-sm text-white/55">{subtitle}</p>
					) : null}
				</div>
				<div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70">
					{icon}
				</div>
			</div>
		</div>
	);
}

function SectionShell({
	title,
	description,
	children,
}: {
	title: string;
	description: string;
	children: React.ReactNode;
}) {
	return (
		<section className="rounded-[2rem] border border-white/10 bg-white/[0.03] shadow-[0_24px_100px_rgba(0,0,0,0.28)]">
			<div className="border-b border-white/10 px-6 py-5">
				<h2 className="text-xl font-semibold text-white">{title}</h2>
				<p className="mt-1 text-sm text-white/55">{description}</p>
			</div>
			<div className="p-6">{children}</div>
		</section>
	);
}

function AccessDenied({ user }: { user: User }) {
	return (
		<div className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center justify-center px-4 py-10">
			<div className="w-full rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center shadow-[0_24px_100px_rgba(0,0,0,0.28)]">
				<div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10 text-amber-300">
					<ShieldAlert className="h-6 w-6" />
				</div>
				<h1 className="mt-5 text-3xl font-semibold text-white">
					Admin Access Required
				</h1>
				<p className="mt-3 text-sm text-white/60">
					You are signed in as{" "}
					<span className="font-medium text-white">
						{user?.email ?? "unknown user"}
					</span>
					, but this account is not on the admin allowlist.
				</p>
				<p className="mt-2 text-sm text-white/50">
					Add this email to{" "}
					<code className="rounded bg-black/30 px-1.5 py-0.5 text-white/80">
						ADMIN_EMAILS
					</code>{" "}
					on the backend to unlock the admin dashboard.
				</p>
				<div className="mt-6">
					<Button asChild className="bg-white text-black hover:bg-white/90">
						<Link href="/dashboard">Back to Dashboard</Link>
					</Button>
				</div>
			</div>
		</div>
	);
}

export default async function AdminPage() {
	const userData = await fetchServerData<{ user: User } | null>(
		"GET",
		"/user/me",
	);

	if (!userData?.user) {
		redirect("/login");
	}

	const metrics = await fetchServerData<AdminDashboardData | null>(
		"GET",
		"/admin/metrics",
	);

	if (!metrics) {
		return <AccessDenied user={userData.user} />;
	}

	return (
		<div className="min-h-screen bg-[#050505] text-white">
			<div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-8 md:px-8">
				<header className="overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(18,86,211,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_24%),rgba(255,255,255,0.03)] p-6 shadow-[0_24px_120px_rgba(0,0,0,0.35)]">
					<div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
						<div>
							<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-white/60">
								<span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
								Protected admin workspace
							</div>
							<h1 className="mt-4 text-4xl font-semibold tracking-tight">
								KiwiLLM Admin
							</h1>
							<p className="mt-3 max-w-3xl text-sm leading-6 text-white/60">
								This is now a native first-party admin page inside the main app.
								Every metric below is pulled from the real admin API and
								protected by the same admin allowlist checks.
							</p>
						</div>
						<div className="grid min-w-[280px] gap-3 sm:grid-cols-2">
							<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
								<p className="text-xs uppercase tracking-[0.18em] text-white/40">
									Signed in as
								</p>
								<p className="mt-2 truncate text-sm font-medium text-white">
									{userData.user.email}
								</p>
							</div>
							<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
								<p className="text-xs uppercase tracking-[0.18em] text-white/40">
									Protection
								</p>
								<p className="mt-2 text-sm font-medium text-white">
									Allowlisted admin email
								</p>
							</div>
						</div>
					</div>
				</header>

				<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
					<MetricCard
						label="Total Global Requests"
						value={compactNumberFormatter.format(metrics.totalRequests)}
						subtitle={`${compactNumberFormatter.format(metrics.successfulRequests)} successful • ${compactNumberFormatter.format(metrics.failedRequests)} failed`}
						icon={<Activity className="h-5 w-5" />}
					/>
					<MetricCard
						label="Success Rate"
						value={`${percentFormatter.format(metrics.successRate)}%`}
						subtitle="Based on routed requests"
						icon={<Rocket className="h-5 w-5" />}
					/>
					<MetricCard
						label="Total Tokens"
						value={compactNumberFormatter.format(metrics.totalTokens)}
						subtitle="Prompt + completion tokens"
						icon={<Cpu className="h-5 w-5" />}
					/>
					<MetricCard
						label="Active API Keys"
						value={numberFormatter.format(metrics.activeApiKeys)}
						subtitle={`${numberFormatter.format(metrics.totalProjects)} projects across ${numberFormatter.format(metrics.totalOrganizations)} orgs`}
						icon={<KeyRound className="h-5 w-5" />}
					/>
				</section>

				<section className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
					<SectionShell
						title="Platform Overview"
						description="High-signal platform metrics and live operating checkpoints."
					>
						<div className="grid gap-4 md:grid-cols-2">
							<MetricCard
								label="Average Latency"
								value={`${numberFormatter.format(metrics.averageLatencyMs)} ms`}
								subtitle="Average full request duration"
								icon={<Clock3 className="h-5 w-5" />}
							/>
							<MetricCard
								label="Average Time To First Token"
								value={`${numberFormatter.format(metrics.averageTimeToFirstTokenMs)} ms`}
								subtitle="Average TTFT"
								icon={<TimerReset className="h-5 w-5" />}
							/>
							<MetricCard
								label="Top Model"
								value={metrics.topModel ?? "No activity yet"}
								subtitle="Most used in current window"
								icon={<Workflow className="h-5 w-5" />}
							/>
							<MetricCard
								label="Top Provider"
								value={metrics.topProvider ?? "No activity yet"}
								subtitle="Most used provider in current window"
								icon={<Building2 className="h-5 w-5" />}
							/>
						</div>
					</SectionShell>

					<SectionShell
						title="Growth & Revenue"
						description="Commercial and account growth signals from real backend data."
					>
						<div className="grid gap-4">
							<MetricCard
								label="Total Sign Ups"
								value={numberFormatter.format(metrics.totalSignups)}
								subtitle="All registered user accounts"
								icon={<Users className="h-5 w-5" />}
							/>
							<MetricCard
								label="Verified Users"
								value={numberFormatter.format(metrics.verifiedUsers)}
								subtitle={`${numberFormatter.format(metrics.payingCustomers)} paying customers`}
								icon={<UserCheck className="h-5 w-5" />}
							/>
							<MetricCard
								label="Total Revenue"
								value={currencyFormatter.format(metrics.totalRevenue)}
								subtitle={`Processed ${currencyFormatter.format(metrics.totalProcessed)}`}
								icon={<CircleDollarSign className="h-5 w-5" />}
							/>
						</div>
					</SectionShell>
				</section>

				<SectionShell
					title="Credits & Billing"
					description="How money and credits are moving across the platform."
				>
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
						<MetricCard
							label="Total Topped Up"
							value={currencyFormatter.format(metrics.totalToppedUp)}
							subtitle="All-time credits purchased"
							icon={<ArrowDownToLine className="h-5 w-5" />}
						/>
						<MetricCard
							label="Total Spent"
							value={currencyFormatter.format(metrics.totalSpent)}
							subtitle="All-time usage costs"
							icon={<ArrowUpFromLine className="h-5 w-5" />}
						/>
						<MetricCard
							label="Unused Credits"
							value={currencyFormatter.format(metrics.unusedCredits)}
							subtitle="Credits sitting across orgs"
							icon={<PiggyBank className="h-5 w-5" />}
						/>
						<MetricCard
							label="Overage"
							value={currencyFormatter.format(metrics.overage)}
							subtitle="Spending beyond topped-up credits"
							icon={<Banknote className="h-5 w-5" />}
						/>
					</div>
				</SectionShell>

				<AdminCouponGenerator />

				<div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 text-sm text-white/55 shadow-[0_24px_100px_rgba(0,0,0,0.28)]">
					<div className="flex items-start gap-3">
						<div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-white/70">
							<Lock className="h-4 w-4" />
						</div>
						<div>
							<p className="font-medium text-white">Access model</p>
							<p className="mt-1 leading-6">
								This page is protected by the real admin middleware. Users must
								be logged in and their email must be included in{" "}
								<code className="rounded bg-black/30 px-1.5 py-0.5 text-white/80">
									ADMIN_EMAILS
								</code>{" "}
								on the backend. No hardcoded backdoor credentials are used.
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
