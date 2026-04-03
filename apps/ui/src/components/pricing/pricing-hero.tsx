import { Badge } from "@/lib/components/badge";

export function PricingHero() {
	return (
		<section className="w-full px-5 pb-10 pt-16 md:px-6 md:pb-14 md:pt-24">
			<div className="mx-auto max-w-3xl text-center">
				<Badge
					variant="outline"
					className="mb-5 border-white/12 bg-white/5 px-3 py-1 text-white/78"
				>
					Pricing
				</Badge>
				<h1 className="text-4xl font-semibold tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
					Clear plans for teams shipping with KiwiLLM
				</h1>
				<p className="mt-5 text-base leading-7 text-white/64 sm:text-lg">
					Start with a simple monthly plan or keep things flexible with
					usage-based credits. Every option gives you the same clean KiwiLLM
					experience across API, Playground, and dashboard.
				</p>
			</div>
		</section>
	);
}
