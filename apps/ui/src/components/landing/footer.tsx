"use client";

import { BrandMark } from "@/components/shared/brand-mark";
import { useAppConfig } from "@/lib/config";

export default function Footer() {
	const config = useAppConfig();

	return (
		<footer className="relative overflow-hidden text-white">
			<div aria-hidden className="absolute inset-0 opacity-80">
				<div className="absolute left-1/2 top-0 h-[260px] w-[760px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,rgba(59,130,246,0.03)_34%,transparent_72%)] blur-[120px]" />
			</div>

			<div className="relative mx-auto max-w-[1800px] px-5 pb-10 pt-10 md:px-6 md:pb-12 md:pt-14">
				<div className="grid gap-10 md:grid-cols-[1.1fr_0.55fr_0.45fr] md:gap-12">
					<div className="flex items-center gap-3 text-white/92">
						<BrandMark className="size-7" />
						<span className="font-display text-xl font-semibold tracking-tight">
							KiwiLLM
						</span>
					</div>

					<div className="space-y-4 text-[0.95rem] text-white/72">
						<a
							href={config.docsUrl ?? "/"}
							className="block transition-colors duration-200 ease-out hover:text-white"
							target="_blank"
							rel="noopener noreferrer"
						>
							Documentation
						</a>
						<a
							href="#features"
							className="block transition-colors duration-200 ease-out hover:text-white"
						>
							Product
						</a>
						<a
							href="/pricing"
							className="block transition-colors duration-200 ease-out hover:text-white"
						>
							Pricing
						</a>
						<a
							href="/changelog"
							className="block transition-colors duration-200 ease-out hover:text-white"
						>
							Changelog
						</a>
					</div>

					<div className="space-y-4 text-[0.95rem] text-white/72">
						<a
							href="/blog"
							className="block transition-colors duration-200 ease-out hover:text-white"
						>
							Blog
						</a>
						<a
							href="/about"
							className="block transition-colors duration-200 ease-out hover:text-white"
						>
							About
						</a>
						<a
							href="/legal/privacy"
							className="block transition-colors duration-200 ease-out hover:text-white"
						>
							Privacy
						</a>
						<a
							href="/legal/terms"
							className="block transition-colors duration-200 ease-out hover:text-white"
						>
							Terms
						</a>
					</div>
				</div>

				<div className="pointer-events-none mt-12 -mx-12 select-none overflow-hidden md:-mx-24">
					<h2 className="font-display text-center text-[clamp(9.5rem,28vw,24rem)] font-semibold leading-[0.84] tracking-[-0.06em] text-white/[0.84]">
						KiwiLLM
					</h2>
				</div>

				<div className="mt-10 flex flex-col gap-5 text-sm text-white/58 sm:flex-row sm:items-center sm:justify-between">
					<div className="flex items-center gap-3 text-white/74">
						<BrandMark className="size-5" />
						<span className="font-medium">KiwiLLM</span>
					</div>

					<div className="flex flex-wrap items-center gap-x-6 gap-y-3 sm:justify-end">
						<a
							href="/about"
							className="transition-colors duration-200 ease-out hover:text-white"
						>
							About KiwiLLM
						</a>
						<a
							href={config.docsUrl ?? "/"}
							className="transition-colors duration-200 ease-out hover:text-white"
							target="_blank"
							rel="noopener noreferrer"
						>
							Documentation
						</a>
						<a
							href="/legal/privacy"
							className="transition-colors duration-200 ease-out hover:text-white"
						>
							Privacy
						</a>
						<a
							href="/legal/terms"
							className="transition-colors duration-200 ease-out hover:text-white"
						>
							Terms
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
