import {
	ArrowRight,
	GitBranch,
	Globe2,
	ShieldCheck,
	Sparkles,
	Workflow,
} from "lucide-react";
import Link from "next/link";

import Footer from "@/components/landing/footer";
import { HeroRSC } from "@/components/landing/hero-rsc";
import { BrandMark } from "@/components/shared/brand-mark";
import { Button } from "@/lib/components/button";

import type { Metadata } from "next";

const principles = [
	{
		title: "One API, real flexibility",
		description:
			"Teams should be able to switch models, compare providers, and route traffic intelligently without rebuilding their app every time the landscape shifts.",
		icon: Workflow,
	},
	{
		title: "Operations should be visible",
		description:
			"Cost, latency, failures, and provider behavior should be easy to inspect so teams can make better product and infrastructure decisions.",
		icon: Globe2,
	},
	{
		title: "Reliability matters in production",
		description:
			"Fallbacks, controls, guardrails, and sane defaults help AI products behave like real software systems instead of fragile demos.",
		icon: ShieldCheck,
	},
];

const highlights = [
	"Unified gateway for multiple LLM providers",
	"Model routing, observability, and cost controls in one place",
	"Open-source core built for teams shipping production AI",
];

export const metadata: Metadata = {
	title: "About Us",
	description:
		"Learn what KiwiLLM is building, why it exists, and the principles behind our unified LLM gateway.",
	alternates: {
		canonical: "/about",
	},
	openGraph: {
		title: "About KiwiLLM",
		description:
			"Learn what KiwiLLM is building, why it exists, and the principles behind our unified LLM gateway.",
		url: "/about",
	},
	twitter: {
		title: "About KiwiLLM",
		description:
			"Learn what KiwiLLM is building, why it exists, and the principles behind our unified LLM gateway.",
	},
};

export default function AboutPage() {
	return (
		<div className="relative overflow-hidden bg-[#050608] text-white">
			<div aria-hidden className="pointer-events-none absolute inset-0">
				<div className="absolute left-[-12%] top-[4%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.16)_0%,rgba(16,185,129,0.05)_36%,transparent_72%)] blur-[140px]" />
				<div className="absolute right-[-8%] top-[14%] h-[580px] w-[580px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.14)_0%,rgba(59,130,246,0.04)_34%,transparent_72%)] blur-[170px]" />
				<div className="absolute left-1/2 top-[42%] h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.015)_30%,transparent_72%)] blur-[180px]" />
			</div>

			<div className="relative z-10">
				<HeroRSC navbarOnly />

				<main>
					<section className="mx-auto max-w-[1400px] px-5 pb-14 pt-14 md:px-6 md:pb-20 md:pt-20">
						<div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:items-end">
							<div className="max-w-4xl">
								<div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-white/74 backdrop-blur">
									<BrandMark className="size-5" />
									<span>About KiwiLLM</span>
								</div>

								<h1 className="max-w-4xl font-display text-5xl font-semibold tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
									We&apos;re building calmer infrastructure for fast-moving AI
									teams.
								</h1>

								<p className="mt-6 max-w-3xl text-lg leading-8 text-white/72 sm:text-xl">
									KiwiLLM helps teams work across multiple model providers
									without stitching together fragile adapters, dashboards, and
									cost spreadsheets. The goal is simple: make shipping AI
									products feel more predictable.
								</p>
							</div>

							<div className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] backdrop-blur">
								<div className="mb-5 flex items-center gap-3">
									<div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/12 p-3 text-emerald-200">
										<Sparkles className="size-5" />
									</div>
									<div>
										<p className="text-sm uppercase tracking-[0.24em] text-white/45">
											What We Believe
										</p>
										<p className="text-lg font-semibold text-white">
											AI infrastructure should reduce chaos, not add to it.
										</p>
									</div>
								</div>

								<div className="space-y-4">
									{highlights.map((highlight) => (
										<div
											key={highlight}
											className="flex items-start gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
										>
											<div className="mt-0.5 rounded-full bg-white/10 p-1.5">
												<ArrowRight className="size-4 text-white/80" />
											</div>
											<p className="text-sm leading-6 text-white/72">
												{highlight}
											</p>
										</div>
									))}
								</div>
							</div>
						</div>
					</section>

					<section className="mx-auto max-w-[1400px] px-5 py-8 md:px-6 md:py-12">
						<div className="grid gap-6 lg:grid-cols-3">
							{principles.map((principle) => {
								const Icon = principle.icon;

								return (
									<div
										key={principle.title}
										className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.2)] backdrop-blur"
									>
										<div className="mb-5 inline-flex rounded-2xl border border-white/12 bg-white/6 p-3 text-white">
											<Icon className="size-5" />
										</div>
										<h2 className="text-2xl font-semibold tracking-tight text-white">
											{principle.title}
										</h2>
										<p className="mt-3 text-base leading-7 text-white/68">
											{principle.description}
										</p>
									</div>
								);
							})}
						</div>
					</section>

					<section className="mx-auto max-w-[1400px] px-5 py-12 md:px-6 md:py-16">
						<div className="grid gap-8 rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.03))] p-8 md:p-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(320px,0.75fr)] lg:gap-12">
							<div>
								<div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/55">
									<GitBranch className="size-3.5" />
									Story
								</div>
								<h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
									KiwiLLM exists because the model layer changes faster than
									most product stacks can keep up.
								</h2>
								<div className="mt-6 space-y-5 text-base leading-7 text-white/72">
									<p>
										New providers appear constantly. Pricing changes. Model
										quality shifts. Reliability varies by workload. Teams need
										the freedom to adapt without redoing integrations every few
										weeks.
									</p>
									<p>
										We built KiwiLLM to sit in the middle of that change: one
										place to route requests, compare outcomes, manage provider
										keys, understand spend, and keep product teams moving.
									</p>
									<p>
										The long-term aim is a gateway that helps engineering,
										platform, and product teams experiment quickly while still
										operating with production discipline.
									</p>
								</div>
							</div>

							<div className="grid gap-4 self-start">
								<div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
									<p className="text-sm uppercase tracking-[0.22em] text-white/45">
										Built For
									</p>
									<p className="mt-3 text-lg font-semibold text-white">
										Teams shipping AI features into real products
									</p>
								</div>
								<div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
									<p className="text-sm uppercase tracking-[0.22em] text-white/45">
										Focus
									</p>
									<p className="mt-3 text-lg font-semibold text-white">
										Routing, visibility, and control across providers
									</p>
								</div>
								<div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
									<p className="text-sm uppercase tracking-[0.22em] text-white/45">
										Approach
									</p>
									<p className="mt-3 text-lg font-semibold text-white">
										Practical infrastructure, open-source momentum, and a
										product-first developer experience
									</p>
								</div>
							</div>
						</div>
					</section>

					<section className="mx-auto max-w-[1400px] px-5 pb-20 pt-6 md:px-6 md:pb-24">
						<div className="flex flex-col gap-6 rounded-[2rem] border border-white/10 bg-white/[0.045] p-8 backdrop-blur md:flex-row md:items-center md:justify-between">
							<div className="max-w-2xl">
								<h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-white">
									Want to see what KiwiLLM feels like in practice?
								</h2>
								<p className="mt-3 text-base leading-7 text-white/68">
									Explore pricing, read the docs, or jump into the product and
									start routing requests locally.
								</p>
							</div>

							<div className="flex flex-col gap-3 sm:flex-row">
								<Button
									asChild
									className="bg-white text-black hover:bg-white/90"
								>
									<Link href="/pricing">View pricing</Link>
								</Button>
								<Button
									asChild
									variant="outline"
									className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
								>
									<Link href="/guides">Read guides</Link>
								</Button>
							</div>
						</div>
					</section>
				</main>

				<Footer />
			</div>
		</div>
	);
}
