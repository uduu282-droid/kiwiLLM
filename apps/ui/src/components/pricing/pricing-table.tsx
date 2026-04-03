"use client";

import {
	CheckCircle2,
	CreditCard,
	Gauge,
	ImageIcon,
	Layers3,
	Shield,
	Sparkles,
	Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AuthLink } from "@/components/shared/auth-link";
import { useUser } from "@/hooks/useUser";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import { cn } from "@/lib/utils";

import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

interface PricingPlan {
	name: string;
	description: string;
	priceLabel: string;
	priceSuffix?: string;
	secondaryLabel: string;
	cta: string;
	ctaHref?: Route;
	ctaAction?: "dashboard";
	popular?: boolean;
	highlightClassName: string;
	ctaClassName: string;
	headlineIcon: LucideIcon;
	metrics: {
		icon: LucideIcon;
		title: string;
		subtitle: string;
	}[];
	includesLabel: string;
	includes: string[];
}

const plans: PricingPlan[] = [
	{
		name: "Starter",
		description: "For solo builders and early product teams shipping every day.",
		priceLabel: "$20",
		priceSuffix: "/month",
		secondaryLabel: "Higher daily limits and fast throughput for real usage.",
		cta: "Upgrade to Starter",
		ctaAction: "dashboard",
		popular: true,
		highlightClassName:
			"border-white/14 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] shadow-[0_24px_80px_rgba(0,0,0,0.32)]",
		ctaClassName:
			"bg-[linear-gradient(180deg,#1b2940,#152136)] text-white hover:brightness-110",
		headlineIcon: Layers3,
		metrics: [
			{
				icon: Layers3,
				title: "2,000 hosted requests / day",
				subtitle: "Daily allocation for everyday product traffic",
			},
			{
				icon: Shield,
				title: "BYOK + hosted access",
				subtitle: "Use Kiwi-managed routing or bring your own provider keys",
			},
			{
				icon: Gauge,
				title: "10 RPM / 3,500 RPD",
				subtitle: "Higher throughput with predictable free-tier style guardrails",
			},
			{
				icon: ImageIcon,
				title: "Image generation support",
				subtitle: "Use image-capable models from the same account",
			},
		],
		includesLabel: "Starter includes:",
		includes: [
			"Dashboard, activity logs, and model usage views",
			"Playground and OpenAI-compatible API access",
			"Prompt caching and routing controls",
			"Provider switching without app rewrites",
			"Team-ready project structure",
			"Fast path to production testing",
		],
	},
	{
		name: "Pro",
		description: "For teams that need more throughput, better support, and room to grow.",
		priceLabel: "$40",
		priceSuffix: "/month",
		secondaryLabel: "More volume, stronger limits, and better support for serious workloads.",
		cta: "Upgrade to Pro",
		ctaAction: "dashboard",
		highlightClassName:
			"border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] shadow-[0_24px_80px_rgba(0,0,0,0.28)]",
		ctaClassName:
			"bg-[linear-gradient(180deg,#4a4a4a,#252525)] text-white hover:brightness-110",
		headlineIcon: Star,
		metrics: [
			{
				icon: Layers3,
				title: "4,500 hosted requests / day",
				subtitle: "Designed for heavier production usage and active teams",
			},
			{
				icon: Star,
				title: "Priority access to premium model classes",
				subtitle: "Use the broad Kiwi catalog with stronger limits",
			},
			{
				icon: Gauge,
				title: "20 RPM / 8,000 RPD",
				subtitle: "More room for apps, internal tools, and power users",
			},
			{
				icon: ImageIcon,
				title: "Higher media generation capacity",
				subtitle: "Better support for image-heavy and multimodal workflows",
			},
		],
		includesLabel: "Everything in Starter, plus:",
		includes: [
			"Higher throughput and larger daily allowance",
			"Better support response and onboarding help",
			"More room for premium and reasoning-heavy usage",
			"Stronger production headroom for teams",
			"Better scaling path before enterprise",
			"Cleaner handoff to custom contracts later",
		],
	},
	{
		name: "Pay as You Go",
		description:
			"Stay flexible and top up credits whenever you need direct usage-based access.",
		priceLabel: "Credits",
		secondaryLabel: "Start from $5 and pay based on actual model and token pricing.",
		cta: "Add Credits",
		ctaAction: "dashboard",
		highlightClassName:
			"border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.025))] shadow-[0_24px_80px_rgba(0,0,0,0.28)]",
		ctaClassName:
			"bg-[linear-gradient(180deg,#0ecf88,#08a56c)] text-white hover:brightness-110",
		headlineIcon: CreditCard,
		metrics: [
			{
				icon: CreditCard,
				title: "No monthly commitment",
				subtitle: "Add balance when you need it and stay flexible",
			},
			{
				icon: Layers3,
				title: "All accessible Kiwi models",
				subtitle: "Usage charged against model and token pricing",
			},
			{
				icon: ImageIcon,
				title: "Image and media generation",
				subtitle: "Media usage charges come from your credit balance",
			},
			{
				icon: Gauge,
				title: "20 RPM rate limit",
				subtitle: "Consistent throughput without a fixed subscription",
			},
		],
		includesLabel: "Pay as You Go includes:",
		includes: [
			"Credits starting from $5",
			"Usage-based billing instead of monthly commitment",
			"Great fit for bursts, experiments, and agencies",
			"Same API, dashboard, and Playground experience",
			"Model and token-based charging",
			"Simple scale-up path when demand grows",
		],
	},
];

function PricingCard({ plan }: { plan: PricingPlan }) {
	const router = useRouter();
	const { user } = useUser();
	const HeadlineIcon = plan.headlineIcon;

	const handlePrimaryAction = () => {
		if (plan.ctaAction === "dashboard") {
			router.push(user ? "/dashboard" : "/signup");
		}
	};

	return (
		<div
			className={cn(
				"relative flex h-full flex-col rounded-[2rem] border p-7 text-white md:p-8",
				plan.highlightClassName,
			)}
		>
			<div className="flex items-start justify-between gap-4">
				<div className="flex items-center gap-3">
					<div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 text-white/82">
						<HeadlineIcon className="size-5" />
					</div>
					<h2 className="text-2xl font-semibold tracking-tight text-white md:text-[2rem]">
						{plan.name}
					</h2>
				</div>
				{plan.popular && (
					<Badge className="rounded-full bg-[#15254a] px-3 py-1 text-white hover:bg-[#15254a]">
						Popular
					</Badge>
				)}
			</div>

			<p className="mt-6 min-h-16 text-[0.98rem] leading-7 text-white/66">
				{plan.secondaryLabel}
			</p>
			<p className="mt-1 text-sm leading-6 text-white/48">{plan.description}</p>

			<div className="mt-8">
				<div className="flex items-end gap-2">
					<span className="text-5xl font-semibold tracking-[-0.05em] text-white">
						{plan.priceLabel}
					</span>
					{plan.priceSuffix && (
						<span className="pb-2 text-lg text-white/66">{plan.priceSuffix}</span>
					)}
				</div>
			</div>

			<div className="mt-8">
				{plan.ctaHref ? (
					<Button
						asChild
						className={cn(
							"h-14 w-full rounded-[1.35rem] text-lg font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
							plan.ctaClassName,
						)}
					>
						<Link href={plan.ctaHref}>{plan.cta}</Link>
					</Button>
				) : user ? (
					<Button
						className={cn(
							"h-14 w-full rounded-[1.35rem] text-lg font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
							plan.ctaClassName,
						)}
						onClick={handlePrimaryAction}
					>
						{plan.cta}
					</Button>
				) : (
					<Button
						asChild
						className={cn(
							"h-14 w-full rounded-[1.35rem] text-lg font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
							plan.ctaClassName,
						)}
					>
						<AuthLink href="/signup">{plan.cta}</AuthLink>
					</Button>
				)}
			</div>

			<div className="mt-10 space-y-6">
				{plan.metrics.map((metric) => {
					const MetricIcon = metric.icon;

					return (
						<div key={metric.title} className="flex items-start gap-4">
							<div className="rounded-full bg-white/8 p-2.5 text-white/80">
								<MetricIcon className="size-4" />
							</div>
							<div>
								<p className="text-xl font-semibold leading-7 text-white">
									{metric.title}
								</p>
								<p className="mt-1 text-sm leading-6 text-white/50">
									{metric.subtitle}
								</p>
							</div>
						</div>
					);
				})}
			</div>

			<div className="mt-8 border-t border-white/10 pt-7">
				<p className="text-xl font-semibold text-white">{plan.includesLabel}</p>
				<ul className="mt-5 space-y-3">
					{plan.includes.map((item) => (
						<li key={item} className="flex items-start gap-3 text-white/78">
							<CheckCircle2 className="mt-0.5 size-5 shrink-0 text-white/80" />
							<span className="text-[1rem] leading-7">{item}</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

export function PricingTable() {
	return (
		<section className="w-full px-5 pb-20 md:px-6 md:pb-24">
			<div className="mx-auto grid max-w-[1440px] gap-6 xl:grid-cols-3">
				{plans.map((plan) => (
					<PricingCard key={plan.name} plan={plan} />
				))}
			</div>

			<div className="mx-auto mt-12 max-w-3xl text-center">
				<p className="text-sm uppercase tracking-[0.24em] text-white/34">
					Need enterprise controls?
				</p>
				<p className="mt-4 text-base leading-7 text-white/58">
					If you need SSO, custom limits, policy enforcement, invoicing, or a
					managed rollout for your team,{" "}
					<Link
						href="/enterprise"
						className="font-medium text-white transition-colors hover:text-white/82"
					>
						talk to KiwiLLM Enterprise
					</Link>
					.
				</p>
			</div>
		</section>
	);
}
