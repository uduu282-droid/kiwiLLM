"use client";

import {
	ArrowRight,
	BadgeCheck,
	Copy,
	KeyRound,
	Layers3,
	LogIn,
	Mail,
	UserRound,
} from "lucide-react";
import Link from "next/link";

import { AnimatedGroup } from "./animated-group";

const authMethods = [
	{ label: "Google", content: "G" },
	{ label: "GitHub", content: "⌘" },
	{ label: "Email", content: <Mail className="size-4" /> },
	{ label: "Login", content: <LogIn className="size-4" /> },
];

const stepCards = [
	{
		step: "01",
		title: "Create your workspace",
		description:
			"Sign in with Google, GitHub, or email and get your first project ready in minutes.",
		icon: UserRound,
		body: (
			<div className="rounded-2xl border border-white/10 bg-[#0d1016] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_28px_rgba(0,0,0,0.18)]">
				<div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/86">
					<UserRound className="size-4 text-white/62" />
					<span>Set up your account</span>
				</div>
				<p className="mb-4 text-sm text-white/58">
					Pick a sign-in method and start exploring immediately:
				</p>
				<div className="flex items-center gap-2">
					{authMethods.map((method) => (
						<div
							key={method.label}
							className="flex size-12 items-center justify-center rounded-xl border border-white/10 bg-[#07090d] text-sm font-semibold text-white/84 shadow-[0_8px_18px_rgba(0,0,0,0.18)]"
							aria-label={method.label}
							title={method.label}
						>
							{method.content}
						</div>
					))}
				</div>
			</div>
		),
	},
	{
		step: "02",
		title: "Generate an API key",
		description:
			"Create a production-ready key instantly and plug it into your app with one OpenAI-compatible endpoint.",
		icon: KeyRound,
		body: (
			<div className="rounded-2xl border border-white/10 bg-[#0d1016] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_28px_rgba(0,0,0,0.18)]">
				<div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/82">
					<KeyRound className="size-4 text-white/62" />
					<span>KIWILLM_API_KEY</span>
				</div>
				<div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#07090d] px-4 py-3 shadow-[0_10px_24px_rgba(0,0,0,0.2)]">
					<span className="font-mono text-sm tracking-[0.18em] text-white">
						kiwillm_••••••••••••
					</span>
					<Copy className="size-4 text-white/58" />
				</div>
				<div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-white/72">
					<BadgeCheck className="size-4" />
					<span>Free Tier Included</span>
				</div>
			</div>
		),
	},
	{
		step: "03",
		title: "Ship and scale",
		description:
			"Route across 210+ models, monitor spend, and scale usage when your workloads start growing.",
		icon: Layers3,
		body: (
			<div className="rounded-2xl border border-white/10 bg-[#0d1016] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_28px_rgba(0,0,0,0.18)]">
				<div className="mb-4 flex items-center justify-center gap-2 text-sm font-medium text-white/76">
					<Layers3 className="size-4 text-white/56" />
					<span>Launch & Grow</span>
				</div>
				<div className="rounded-xl border border-white/10 bg-[#07090d] px-4 py-4 text-center shadow-[0_10px_24px_rgba(0,0,0,0.18)]">
					<div className="text-[1.05rem] font-semibold text-white">
						Access 210+ Models
					</div>
					<p className="mt-1 text-sm leading-6 text-white/58">
						Start on free, then grow on your terms.
					</p>
					<Link
						href="#pricing"
						className="mt-4 flex justify-center rounded-xl border border-[#3b82f6]/20 bg-[#3b82f6] px-4 py-3 text-sm font-medium text-white shadow-[0_12px_26px_rgba(37,99,235,0.24)] transition-all hover:bg-[#4b8dff]"
					>
						View Pricing
					</Link>
				</div>
				<p className="mt-4 text-center text-sm leading-6 text-white/54">
					Track usage, control costs, and unlock more capacity when you need it.
				</p>
			</div>
		),
	},
];

export function CodeExample() {
	return (
		<section className="relative overflow-hidden py-24 text-foreground md:py-32">
			<div className="mx-auto max-w-[1460px] px-6">
				<AnimatedGroup preset="blur-slide" className="space-y-16">
					<div className="space-y-10">
						<h2 className="font-display text-5xl tracking-tight text-white md:text-6xl">
							Our key features
						</h2>

						<div className="mx-auto max-w-4xl text-center">
							<div className="inline-flex items-center rounded-full border border-white/10 bg-[#0c0f16] px-4 py-1.5 text-sm font-medium text-white/72 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
								Simple Integration
							</div>
							<h3 className="mt-6 font-display text-4xl tracking-tight text-white md:text-5xl">
								Get Started in 3 Easy Steps
							</h3>
							<p className="mx-auto mt-5 max-w-3xl text-xl leading-relaxed text-white/66">
								KiwiLLM keeps onboarding simple: create your workspace, generate
								a key, and start shipping with one API across every major model
								provider.
							</p>
						</div>
					</div>

					<div className="grid gap-8 lg:grid-cols-[1.08fr_auto_1.08fr_auto_1.08fr] lg:items-stretch">
						{stepCards.map((step, index) => {
							const Icon = step.icon;

							return (
								<div key={step.title} className="contents">
									<div className="group relative flex h-full min-h-[520px] flex-col overflow-hidden rounded-[2rem] border border-white/8 bg-[linear-gradient(180deg,#0b0d12_0%,#06070a_100%)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.3)]">
										<div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)] opacity-90" />
										<div className="relative flex items-center justify-between">
											<div className="flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-[#11151c] text-white/66 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_10px_26px_rgba(17,24,39,0.24)]">
												<Icon className="size-6" />
											</div>
											<div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-xs font-semibold tracking-[0.26em] text-white/42">
												{step.step}
											</div>
										</div>
										<h4 className="mt-6 font-display text-[2rem] tracking-tight text-white">
											{step.title}
										</h4>
										<p className="mt-4 min-h-[96px] text-lg leading-8 text-white/70">
											{step.description}
										</p>
										<div className="mt-auto pt-10">{step.body}</div>
									</div>

									{index < stepCards.length - 1 ? (
										<div className="hidden self-center lg:flex lg:flex-col lg:items-center lg:justify-center">
											<div className="mb-3 h-px w-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))]" />
											<div className="flex size-11 items-center justify-center rounded-full border border-white/10 bg-[#0b0d13] text-white/56 shadow-[0_14px_28px_rgba(16,24,40,0.2)]">
												<ArrowRight className="size-5" />
											</div>
											<div className="mt-3 h-px w-10 bg-[linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.14))]" />
										</div>
									) : null}
								</div>
							);
						})}
					</div>
				</AnimatedGroup>
			</div>
		</section>
	);
}
