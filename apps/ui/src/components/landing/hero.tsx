"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import { AuthLink } from "@/components/shared/auth-link";
import { Button } from "@/lib/components/button";
import { ShimmerButton } from "@/lib/components/shimmer-button";
import { useAppConfig } from "@/lib/config";

import { providerLogoUrls } from "@llmgateway/shared/components";

import { AnimatedGroup } from "./animated-group";
import { DarkVeil } from "./dark-veil";
import { Navbar } from "./navbar";

import type { Variants } from "@/components/motion-wrapper";
import type { PublicUser } from "@/lib/getUser";
import type { ProviderId } from "@llmgateway/models";

const transitionVariants: { item: Variants } = {
	item: {
		hidden: {
			opacity: 0,
			filter: "blur(12px)",
			y: 12,
		},
		visible: {
			opacity: 1,
			filter: "blur(0px)",
			y: 0,
			transition: {
				type: "spring" as const,
				bounce: 0.3,
				duration: 1.5,
			},
		},
	},
};

// Provider logos configuration
const PROVIDER_LOGOS: { name: string; providerId: ProviderId }[] = [
	{ name: "OpenAI", providerId: "openai" },
	{ name: "Anthropic", providerId: "anthropic" },
	{ name: "Together AI", providerId: "together.ai" },
	{ name: "Groq", providerId: "groq" },
	{ name: "xAI", providerId: "xai" },
	{ name: "DeepSeek", providerId: "deepseek" },
	{ name: "Perplexity", providerId: "perplexity" },
	{ name: "Ai Studio", providerId: "google-ai-studio" },
	{ name: "Moonshot", providerId: "moonshot" },
	{ name: "Novita", providerId: "novita" },
	{ name: "Nebius", providerId: "nebius" },
	{ name: "Zai", providerId: "zai" },
	{ name: "NanoGPT", providerId: "nanogpt" },
	{ name: "Canopywave", providerId: "canopywave" },
	{ name: "AWS Bedrock", providerId: "aws-bedrock" },
	{ name: "Azure", providerId: "azure" },
	{ name: "Inference.net", providerId: "inference.net" },
	{ name: "Mistral", providerId: "mistral" },
	{ name: "Alibaba", providerId: "alibaba" },
	{ name: "ByteDance", providerId: "bytedance" },
	{ name: "Cerebras", providerId: "cerebras" },
	{ name: "Google Vertex", providerId: "google-vertex" },
	{ name: "MiniMax", providerId: "minimax" },
];

interface MigrationData {
	slug: string;
	title: string;
	fromProvider: string;
}

const providerIcons: Record<string, React.ReactNode> = {
	OpenRouter: (
		<svg
			fill="currentColor"
			fillRule="evenodd"
			viewBox="0 0 24 24"
			xmlns="http://www.w3.org/2000/svg"
			className="size-5"
			aria-hidden="true"
		>
			<path d="m16.804 1.957 7.22 4.105v.087L16.73 10.21l.017-2.117-.821-.03c-1.059-.028-1.611.002-2.268.11-1.064.175-2.038.577-3.147 1.352L8.345 11.03c-.284.195-.495.336-.68.455l-.515.322-.397.234.385.23.53.338c.476.314 1.17.796 2.701 1.866 1.11.775 2.083 1.177 3.147 1.352l.3.045c.694.091 1.375.094 2.825.033l.022-2.159 7.22 4.105v.087L16.589 22l.014-1.862-.635.022c-1.386.042-2.137.002-3.138-.162-1.694-.28-3.26-.926-4.881-2.059l-2.158-1.5a21.997 21.997 0 0 0-.755-.498l-.467-.28a55.927 55.927 0 0 0-.76-.43C2.908 14.73.563 14.116 0 14.116V9.888l.14.004c.564-.007 2.91-.622 3.809-1.124l1.016-.58.438-.274c.428-.28 1.072-.726 2.686-1.853 1.621-1.133 3.186-1.78 4.881-2.059 1.152-.19 1.974-.213 3.814-.138z" />
		</svg>
	),
	"Vercel AI Gateway": (
		<svg
			viewBox="0 0 76 65"
			fill="currentColor"
			className="size-5"
			aria-hidden="true"
		>
			<path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
		</svg>
	),
	LiteLLM: (
		<span className="text-lg" role="img" aria-label="LiteLLM">
			🚅
		</span>
	),
};

export function Hero({
	initialUser,
	navbarOnly,
	sticky = true,
	migrations = [],
}: {
	initialUser?: PublicUser | null;
	navbarOnly?: boolean;
	sticky?: boolean;
	migrations?: MigrationData[];
}) {
	return (
		<>
			<Navbar initialUser={initialUser} sticky={sticky} />
			{!navbarOnly && (
				<HeroMain initialUser={initialUser} migrations={migrations} />
			)}
		</>
	);
}

function HeroMain({
	initialUser,
	migrations,
}: {
	initialUser?: PublicUser | null;
	migrations: MigrationData[];
}) {
	const config = useAppConfig();
	const previewRef = useRef<HTMLDivElement | null>(null);
	const { scrollYProgress } = useScroll({
		target: previewRef,
		offset: ["start end", "end start"],
	});
	const previewScale = useTransform(
		scrollYProgress,
		[0, 0.45, 1],
		[0.88, 1, 1.08],
	);
	const previewY = useTransform(scrollYProgress, [0, 0.45, 1], [72, 0, -20]);
	const previewOpacity = useTransform(
		scrollYProgress,
		[0, 0.2, 0.45],
		[0.45, 0.72, 1],
	);
	const primaryCtaHref = initialUser
		? initialUser.onboardingCompleted
			? "/dashboard"
			: "/onboarding"
		: "/signup";
	const primaryCtaLabel = initialUser
		? initialUser.onboardingCompleted
			? "Go to Dashboard"
			: "Continue Onboarding"
		: "Get My API Key";

	return (
		<main className="overflow-hidden">
			<div
				aria-hidden
				className="z-2 absolute inset-0 pointer-events-none isolate opacity-50 contain-strict hidden lg:block"
			>
				<div className="w-140 h-320 -translate-y-[350px] absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
				<div className="h-320 absolute left-0 top-0 w-56 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
				<div className="h-320 -translate-y-[350px] absolute left-0 top-0 w-56 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
			</div>
			<section>
				<div className="relative pt-24 md:pt-36">
					<div
						aria-hidden
						className="absolute inset-x-0 top-0 -z-20 h-[980px] overflow-hidden"
					>
						<div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,8,22,0.96)_0%,rgba(4,7,20,0.84)_44%,rgba(5,7,14,0.48)_72%,rgba(5,7,14,0)_100%)]" />
						<div className="absolute -left-[18%] top-[-120px] h-[560px] w-[1840px] rotate-[-12deg] rounded-full bg-[linear-gradient(90deg,rgba(14,165,233,0)_0%,rgba(125,211,252,0.96)_8%,rgba(56,189,248,1)_18%,rgba(96,165,250,1)_32%,rgba(59,130,246,1)_48%,rgba(29,78,216,1)_62%,rgba(96,165,250,0.88)_76%,rgba(56,189,248,0.22)_88%,rgba(37,99,235,0)_100%)] blur-[82px]" />
						<div className="absolute left-[-6%] top-[6px] h-[620px] w-[1220px] rounded-full bg-[radial-gradient(circle,rgba(191,219,254,0.98)_0%,rgba(96,165,250,0.82)_18%,rgba(56,189,248,0.44)_38%,rgba(37,99,235,0.18)_58%,rgba(3,7,18,0)_84%)] blur-[92px]" />
						<div className="absolute right-[-16%] top-[-24px] h-[720px] w-[1320px] rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.86)_0%,rgba(59,130,246,0.66)_22%,rgba(14,165,233,0.36)_42%,rgba(37,99,235,0.14)_58%,rgba(5,7,14,0)_84%)] blur-[104px]" />
						<div className="absolute left-1/2 top-[160px] h-[520px] w-[1580px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(191,219,254,0.58)_0%,rgba(125,211,252,0.34)_18%,rgba(59,130,246,0.16)_40%,rgba(4,6,12,0)_72%)] blur-[96px]" />
						<div className="absolute left-1/2 top-[300px] h-[620px] w-[1860px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.24)_0%,rgba(56,189,248,0.16)_18%,rgba(59,130,246,0.08)_34%,rgba(8,10,18,0)_68%)] blur-[126px]" />
						<div className="absolute inset-0 opacity-100 [mask-image:linear-gradient(to_bottom,black,black_86%,transparent)]">
							<DarkVeil
								hueShift={256}
								noiseIntensity={0.03}
								scanlineIntensity={0.0}
								speed={1.05}
								scanlineFrequency={0.0}
								warpAmount={0.52}
								resolutionScale={1}
								className="h-full w-full mix-blend-screen opacity-100 saturate-[2.7] brightness-[1.95] contrast-[1.16] [filter:hue-rotate(238deg)_saturate(2.6)_brightness(1.76)]"
							/>
						</div>
						<div className="absolute inset-0 bg-[radial-gradient(80%_62%_at_50%_42%,transparent_0%,rgba(5,7,14,0.0)_40%,rgba(5,7,14,0.08)_60%,rgba(5,7,14,0.48)_84%,var(--background)_100%)]" />
						<div className="absolute inset-x-0 top-0 h-36 bg-[linear-gradient(180deg,rgba(8,8,11,0.45),transparent)]" />
					</div>
					<div
						aria-hidden
						className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--background)_75%)]"
					/>
					<div className="mx-auto max-w-7xl px-6">
						<div className="relative z-10">
							<div className="mb-10 lg:mb-12 flex justify-center">
								<AnimatedGroup variants={transitionVariants}>
									<Link
										href="/cost-simulator"
										className="bg-white/6 hover:bg-white/10 group flex w-fit items-center gap-4 rounded-full border border-white/10 p-1 pl-4 shadow-md shadow-black/20 backdrop-blur-md transition-all duration-300"
									>
										<span className="text-sm text-white/85">
											Save Your LLM Costs Without the Headache
										</span>
										<span className="block h-4 w-0.5 border-l border-white/15" />

										<div className="size-6 overflow-hidden rounded-full bg-white/8 duration-500 group-hover:bg-white/12">
											<div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
												<span className="flex size-6">
													<ArrowRight className="m-auto size-3 text-white/80" />
												</span>
												<span className="flex size-6">
													<ArrowRight className="m-auto size-3 text-white/80" />
												</span>
											</div>
										</div>
									</Link>
								</AnimatedGroup>
							</div>

							<div className="mx-auto max-w-4xl text-center">
								<AnimatedGroup variants={transitionVariants}>
									<h1 className="text-balance text-3xl font-medium tracking-tight text-white/90 md:text-4xl lg:text-5xl">
										One unified API for every major LLM provider.
									</h1>
									<p className="mt-4 mx-auto max-w-2xl text-balance text-base text-white/60 md:mt-6 md:text-lg">
										Access 210+ models through a single integration. No more
										managing multiple API keys, switching dashboards, or
										rewriting code every time you change providers.
									</p>
								</AnimatedGroup>

								<AnimatedGroup
									variants={{
										container: {
											visible: {
												transition: {
													staggerChildren: 0.05,
													delayChildren: 0.5,
												},
											},
										},
										...transitionVariants,
									}}
									className="mt-8 flex flex-col items-center gap-6 md:mt-10"
								>
									<div className="relative">
										<div className="absolute -inset-3 rounded-full bg-blue-500/35 blur-2xl" />
										{initialUser ? (
											<Link
												href={primaryCtaHref}
												className="group relative"
												prefetch={true}
											>
												<ShimmerButton
													background="rgb(37, 99, 235)"
													className="px-10 py-3 shadow-2xl shadow-blue-500/30 md:px-12 md:py-4"
												>
													<span className="flex items-center gap-3 text-center text-xl font-bold leading-none tracking-tight whitespace-pre-wrap text-white md:text-2xl">
														<span>{primaryCtaLabel}</span>
														<ArrowRight className="size-6 transition-transform group-hover:translate-x-1 md:size-7" />
													</span>
												</ShimmerButton>
											</Link>
										) : (
											<AuthLink
												href={primaryCtaHref}
												className="group relative"
											>
												<ShimmerButton
													background="rgb(37, 99, 235)"
													className="px-10 py-3 shadow-2xl shadow-blue-500/30 md:px-12 md:py-4"
												>
													<span className="flex items-center gap-3 text-center text-xl font-bold leading-none tracking-tight whitespace-pre-wrap text-white md:text-2xl">
														<span>{primaryCtaLabel}</span>
														<ArrowRight className="size-6 transition-transform group-hover:translate-x-1 md:size-7" />
													</span>
												</ShimmerButton>
											</AuthLink>
										)}
									</div>

									<div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/55">
										<span className="flex items-center gap-1.5">
											<svg
												className="size-4 text-green-400"
												fill="currentColor"
												viewBox="0 0 20 20"
												aria-hidden="true"
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
											Free tier included
										</span>
										<span className="flex items-center gap-1.5">
											<svg
												className="size-4 text-green-400"
												fill="currentColor"
												viewBox="0 0 20 20"
												aria-hidden="true"
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
											No credit card required
										</span>
										<span className="flex items-center gap-1.5">
											<svg
												className="size-4 text-green-400"
												fill="currentColor"
												viewBox="0 0 20 20"
												aria-hidden="true"
											>
												<path
													fillRule="evenodd"
													d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
													clipRule="evenodd"
												/>
											</svg>
											Setup in 30 seconds
										</span>
									</div>

									<Button
										asChild
										variant="ghost"
										className="text-white/60 hover:text-white hover:bg-white/5"
									>
										<a href={config.docsUrl ?? ""} target="_blank">
											<span>View documentation</span>
											<ChevronRight className="size-4" />
										</a>
									</Button>
								</AnimatedGroup>
							</div>

							{migrations.length > 0 && (
								<AnimatedGroup
									variants={{
										container: {
											visible: {
												transition: {
													staggerChildren: 0.05,
													delayChildren: 0.6,
												},
											},
										},
										...transitionVariants,
									}}
								>
									<div className="mx-auto mt-12 max-w-4xl">
										<p className="mb-4 text-center text-sm text-white/45">
											Switching from another provider?
										</p>
										<div className="flex flex-wrap items-center justify-center gap-3">
											{migrations.map((migration) => (
												<Link
													key={migration.slug}
													href={`/migration/${migration.slug}`}
													className="group/card flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-colors hover:border-blue-400/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
												>
													<span className="flex size-6 items-center justify-center text-white/45 transition-colors group-hover/card:text-white/80">
														{providerIcons[migration.fromProvider] ?? (
															<ChevronRight
																className="size-4"
																aria-hidden="true"
															/>
														)}
													</span>
													<span className="transition-colors group-hover/card:text-white/85">
														{migration.fromProvider}
													</span>
													<ArrowRight
														className="size-3 text-white/40 transition-transform group-hover/card:translate-x-0.5 group-hover/card:text-blue-300"
														aria-hidden="true"
													/>
												</Link>
											))}
											<Link
												href="/migration"
												className="flex items-center gap-1 rounded-full px-3 py-2 text-sm text-white/55 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
											>
												<span>View all</span>
												<ChevronRight className="size-3" aria-hidden="true" />
											</Link>
										</div>
									</div>
								</AnimatedGroup>
							)}
						</div>
					</div>

					<AnimatedGroup
						variants={{
							container: {
								visible: {
									transition: {
										staggerChildren: 0.05,
										delayChildren: 0.75,
									},
								},
							},
							...transitionVariants,
						}}
					>
						<div
							ref={previewRef}
							className="relative -mr-56 mt-8 overflow-hidden px-2 sm:mr-0 sm:mt-12 md:mt-20"
						>
							<div
								aria-hidden
								className="bg-linear-to-b to-background absolute inset-0 z-10 from-transparent from-35%"
							/>
							<motion.div
								style={{
									scale: previewScale,
									y: previewY,
									opacity: previewOpacity,
								}}
								className="relative mx-auto max-w-6xl will-change-transform"
							>
								<div className="absolute inset-x-[10%] top-8 -z-10 h-28 rounded-full bg-blue-500/18 blur-3xl md:h-36" />
								<div className="inset-shadow-2xs ring-background dark:inset-shadow-white/20 bg-background relative overflow-hidden rounded-2xl border p-4 shadow-lg shadow-zinc-950/15 ring-1">
									<Image
										className="bg-background aspect-15/8 relative hidden rounded-2xl dark:block"
										src="/screenshots/dashboard-kiwillm.png"
										alt="KiwiLLM dashboard showing analytics and API usage"
										width={1351}
										height={768}
										priority
									/>
									<Image
										className="z-2 border-border/25 aspect-15/8 relative rounded-2xl border dark:hidden"
										src="/screenshots/dashboard-kiwillm.png"
										alt="KiwiLLM dashboard showing analytics and API usage"
										width={1351}
										height={768}
										priority
									/>
								</div>
							</motion.div>
						</div>
					</AnimatedGroup>
				</div>
			</section>
			<section className="pb-16 pt-16 md:pb-32">
				<div className="group relative m-auto max-w-5xl px-6">
					<div className="absolute inset-0 z-10 flex scale-95 items-center justify-center opacity-0 duration-500 group-hover:scale-100 group-hover:opacity-100">
						<Link
							href="/providers"
							className="block text-sm text-white/70 duration-150 hover:text-white"
							prefetch={true}
						>
							<span>View All Providers</span>
							<ChevronRight className="ml-1 inline-block size-3" />
						</Link>
					</div>
					<div className="mx-auto mt-12 grid max-w-3xl grid-cols-5 gap-x-10 gap-y-6 transition-all duration-500 group-hover:blur-xs group-hover:opacity-50 sm:grid-cols-6 sm:gap-x-12 sm:gap-y-10 lg:grid-cols-8">
						{PROVIDER_LOGOS.map((provider) => {
							const LogoComponent = providerLogoUrls[provider.providerId];

							return (
								<div key={provider.name} className="flex">
									{LogoComponent ? (
										<LogoComponent className="mx-auto h-16 w-fit object-contain" />
									) : null}
								</div>
							);
						})}
					</div>
				</div>
			</section>
		</main>
	);
}
