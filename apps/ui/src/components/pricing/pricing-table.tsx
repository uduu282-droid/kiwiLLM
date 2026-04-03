"use client";

import {
	CheckCircle2,
	CreditCard,
	Gauge,
	ImageIcon,
	Layers3,
	Shield,
	Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AuthLink } from "@/components/shared/auth-link";
import { useUser } from "@/hooks/useUser";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import { cn } from "@/lib/utils";

import type { LucideIcon } from "lucide-react";
import type { Route } from "next";

type BillingCycle = "monthly" | "yearly";

interface PriceDefinition {
	inrMonthly: number | null;
	usdMonthly: number | null;
	label?: string;
}

interface PricingPlan {
	name: string;
	description: string;
	secondaryLabel: string;
	price: PriceDefinition;
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
		name: "Free",
		description: "Start testing KiwiLLM with no upfront payment.",
		secondaryLabel: "Best for quick evaluation, Playground testing, and early integration work.",
		price: {
			inrMonthly: 0,
			usdMonthly: 0,
		},
		cta: "Start for Free",
		ctaAction: "dashboard",
		highlightClassName:
			"border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] shadow-[0_20px_60px_rgba(0,0,0,0.24)]",
		ctaClassName:
			"bg-[linear-gradient(180deg,#21242b,#15181f)] text-white hover:brightness-110",
		headlineIcon: Shield,
		metrics: [
			{
				icon: Layers3,
				title: "Limited AI Models",
				subtitle: "Best for evaluation and lightweight hosted usage",
			},
			{
				icon: Gauge,
				title: "5 RPM Rate Limits",
				subtitle: "Kept intentionally constrained for fair free-tier access",
			},
			{
				icon: Shield,
				title: "300 RPD Request Limit",
				subtitle: "Daily request cap with automatic reset",
			},
			{
				icon: ImageIcon,
				title: "Limited Context (Approx. 50%)",
				subtitle: "Reduced context window compared with paid plans",
			},
		],
		includesLabel: "Free includes:",
		includes: [
			"Limited AI models",
			"5 requests per minute",
			"300 requests per day",
			"Unlimited validity",
			"Limited context window",
			"No premium model access",
		],
	},
	{
		name: "Starter",
		description: "For solo builders and small teams moving into real usage.",
		secondaryLabel: "Higher throughput, smoother testing, and more room for production traffic.",
		price: {
			inrMonthly: 999,
			usdMonthly: 10,
		},
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
				title: "Higher hosted request limits",
				subtitle: "Built for teams actively shipping and testing every day",
			},
			{
				icon: Shield,
				title: "BYOK + hosted access",
				subtitle: "Choose Kiwi-managed routing or bring your own keys",
			},
			{
				icon: Gauge,
				title: "Priority throughput",
				subtitle: "More breathing room for apps, demos, and internal tools",
			},
			{
				icon: ImageIcon,
				title: "Multimodal workflows",
				subtitle: "Use image-capable models from the same product surface",
			},
		],
		includesLabel: "Starter includes:",
		includes: [
			"Everything in Free",
			"Higher usage limits and faster throughput",
			"Better room for production-grade testing",
			"Dashboard, Playground, and API access",
			"Prompt caching and routing controls",
			"Better everyday experience for active projects",
		],
	},
	{
		name: "Pro",
		description: "For growing teams that need more headroom and stronger support.",
		secondaryLabel: "More capacity, cleaner scaling, and a better fit for serious workloads.",
		price: {
			inrMonthly: 1999,
			usdMonthly: 20,
		},
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
				title: "Larger hosted allocation",
				subtitle: "Designed for heavier workloads and more active teams",
			},
			{
				icon: Star,
				title: "Premium-ready path",
				subtitle: "Better fit for reasoning-heavy and premium model usage",
			},
			{
				icon: Gauge,
				title: "Higher throughput ceilings",
				subtitle: "More room for apps, power users, and internal tools",
			},
			{
				icon: ImageIcon,
				title: "More room for media generation",
				subtitle: "Better support for multimodal and image-heavy workflows",
			},
		],
		includesLabel: "Everything in Starter, plus:",
		includes: [
			"More capacity for daily usage",
			"Better support response and onboarding help",
			"Stronger production headroom",
			"Cleaner scaling path before enterprise",
			"More comfortable premium-model usage",
			"Built for teams moving beyond experimentation",
		],
	},
	{
		name: "Pay as You Go",
		description:
			"Stay flexible and only pay when you actually need direct usage-based access.",
		secondaryLabel: "Top up credits anytime and pay against real model and token pricing.",
		price: {
			inrMonthly: null,
			usdMonthly: null,
			label: "Credits",
		},
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
				subtitle: "Add balance whenever you need it and stay flexible",
			},
			{
				icon: Layers3,
				title: "All accessible Kiwi models",
				subtitle: "Usage is charged against model and token pricing",
			},
			{
				icon: ImageIcon,
				title: "Image and media generation",
				subtitle: "Media usage charges come from your credit balance",
			},
			{
				icon: Gauge,
				title: "Usage without subscription lock-in",
				subtitle: "Great for bursts, client work, and experiment-heavy teams",
			},
		],
		includesLabel: "Pay as You Go includes:",
		includes: [
			"Top up balance only when needed",
			"Credits for model and token-based pricing",
			"Good fit for bursts and agency-style work",
			"Same API, dashboard, and Playground",
			"No subscription commitment",
			"Easy path to scale later",
		],
	},
];

function detectIndianVisitor() {
	if (typeof window === "undefined") {
		return true;
	}

	const locale = navigator.language.toLowerCase();
	const timeZone =
		Intl.DateTimeFormat().resolvedOptions().timeZone?.toLowerCase() ?? "";

	return locale.includes("-in") || locale.startsWith("hi") || timeZone.includes("kolkata");
}

function formatPrice(price: PriceDefinition, isIndian: boolean, cycle: BillingCycle) {
	if (price.label) {
		return {
			main: price.label,
			sub: isIndian ? "Start from ₹399 • no expiry" : "Start from $5 • no expiry",
		};
	}

	const base = isIndian ? price.inrMonthly : price.usdMonthly;

	if (base === null) {
		return {
			main: "",
			sub: "",
		};
	}

	if (base === 0) {
		return {
			main: isIndian ? "₹0" : "$0",
			sub: cycle === "yearly" ? "forever" : "forever",
		};
	}

	const billedValue = cycle === "yearly" ? Math.round(base * 0.8) : base;
	const currencyValue = isIndian ? `₹${billedValue}` : `$${billedValue}`;
	const suffix = cycle === "yearly" ? "/mo billed yearly" : "/month";

	return {
		main: currencyValue,
		sub: suffix,
	};
}

function PricingCard({
	plan,
	isIndian,
	cycle,
}: {
	plan: PricingPlan;
	isIndian: boolean;
	cycle: BillingCycle;
}) {
	const router = useRouter();
	const { user } = useUser();
	const HeadlineIcon = plan.headlineIcon;
	const price = formatPrice(plan.price, isIndian, cycle);

	const handlePrimaryAction = () => {
		if (plan.ctaAction === "dashboard") {
			router.push(user ? "/dashboard" : "/signup");
		}
	};

	return (
		<div
			className={cn(
				"relative flex h-full flex-col rounded-[1.8rem] border p-6 text-white md:p-7",
				plan.highlightClassName,
			)}
		>
			<div className="flex items-start justify-between gap-3">
				<div className="flex items-center gap-3">
					<div className="rounded-2xl border border-white/10 bg-white/[0.05] p-2.5 text-white/82">
						<HeadlineIcon className="size-5" />
					</div>
					<h2 className="text-[1.95rem] font-semibold tracking-tight text-white">
						{plan.name}
					</h2>
				</div>
				{plan.popular && (
					<Badge className="rounded-full bg-[#15254a] px-3 py-1 text-white hover:bg-[#15254a]">
						Popular
					</Badge>
				)}
			</div>

			<p className="mt-5 min-h-14 text-[0.96rem] leading-7 text-white/66">
				{plan.secondaryLabel}
			</p>
			<p className="mt-1 text-sm leading-6 text-white/48">{plan.description}</p>

			<div className="mt-7">
				<div className="flex flex-wrap items-end gap-2">
					<span className="text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
						{price.main}
					</span>
					{price.sub && (
						<span className="pb-1.5 text-base text-white/66">{price.sub}</span>
					)}
				</div>
			</div>

			<div className="mt-7">
				{plan.ctaHref ? (
					<Button
						asChild
						className={cn(
							"h-12 w-full rounded-[1.2rem] text-base font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
							plan.ctaClassName,
						)}
					>
						<Link href={plan.ctaHref}>{plan.cta}</Link>
					</Button>
				) : user ? (
					<Button
						className={cn(
							"h-12 w-full rounded-[1.2rem] text-base font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
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
							"h-12 w-full rounded-[1.2rem] text-base font-semibold shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]",
							plan.ctaClassName,
						)}
					>
						<AuthLink href="/signup">{plan.cta}</AuthLink>
					</Button>
				)}
			</div>

			<div className="mt-8 space-y-5">
				{plan.metrics.map((metric) => {
					const MetricIcon = metric.icon;

					return (
						<div key={metric.title} className="flex items-start gap-4">
							<div className="rounded-full bg-white/8 p-2.5 text-white/80">
								<MetricIcon className="size-4" />
							</div>
							<div>
								<p className="text-lg font-semibold leading-7 text-white">
									{metric.title}
								</p>
								<p className="mt-0.5 text-sm leading-6 text-white/50">
									{metric.subtitle}
								</p>
							</div>
						</div>
					);
				})}
			</div>

			<div className="mt-7 border-t border-white/10 pt-6">
				<p className="text-lg font-semibold text-white">{plan.includesLabel}</p>
				<ul className="mt-4 space-y-2.5">
					{plan.includes.map((item) => (
						<li key={item} className="flex items-start gap-3 text-white/78">
							<CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-white/80" />
							<span className="text-[0.97rem] leading-6">{item}</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}

export function PricingTable() {
	const [cycle, setCycle] = useState<BillingCycle>("monthly");
	const [isIndian, setIsIndian] = useState(true);

	useEffect(() => {
		setIsIndian(detectIndianVisitor());
	}, []);

	const currencyLabel = useMemo(
		() => (isIndian ? "Showing prices in INR" : "Showing prices in USD"),
		[isIndian],
	);

	return (
		<section className="w-full px-5 pb-20 md:px-6 md:pb-24">
			<div className="mx-auto max-w-[1460px]">
				<div className="mb-8 flex flex-col items-center gap-4">
					<div className="inline-flex items-center rounded-full border border-white/12 bg-white/95 p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.28)]">
						<button
							type="button"
							onClick={() => setCycle("monthly")}
							className={cn(
								"rounded-full px-7 py-3 text-base font-semibold transition-all",
								cycle === "monthly"
									? "bg-[linear-gradient(180deg,#35455f,#1e2a40)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
									: "text-zinc-500 hover:text-zinc-800",
							)}
						>
							Monthly Billing
						</button>
						<button
							type="button"
							onClick={() => setCycle("yearly")}
							className={cn(
								"flex items-center gap-3 rounded-full px-7 py-3 text-base font-semibold transition-all",
								cycle === "yearly"
									? "bg-[linear-gradient(180deg,#35455f,#1e2a40)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
									: "text-zinc-500 hover:text-zinc-800",
							)}
						>
							<span>Yearly Billing</span>
							<span
								className={cn(
									"rounded-full px-3 py-1 text-sm",
									cycle === "yearly"
										? "bg-white/14 text-white"
										: "bg-zinc-100 text-zinc-700",
								)}
							>
								Save 20%
							</span>
						</button>
					</div>
					<p className="text-sm uppercase tracking-[0.22em] text-white/38">
						{currencyLabel}
					</p>
				</div>

				<div className="grid gap-5 xl:grid-cols-4">
					{plans.map((plan) => (
						<PricingCard
							key={plan.name}
							plan={plan}
							isIndian={isIndian}
							cycle={cycle}
						/>
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
			</div>
		</section>
	);
}
