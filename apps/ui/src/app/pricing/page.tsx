import Footer from "@/components/landing/footer";
import { HeroRSC } from "@/components/landing/hero-rsc";
import { PricingHero } from "@/components/pricing/pricing-hero";
import { PricingTable } from "@/components/pricing/pricing-table";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Pricing - KiwiLLM",
	description:
		"Simple, transparent pricing for KiwiLLM. Start free, scale with low fees.",
};

export default function PricingPage() {
	return (
		<div className="relative overflow-hidden bg-[#050608] text-white">
			<div aria-hidden className="pointer-events-none absolute inset-0">
				<div className="absolute left-[-12%] top-[3%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.16)_0%,rgba(59,130,246,0.05)_36%,transparent_72%)] blur-[140px]" />
				<div className="absolute right-[-10%] top-[10%] h-[580px] w-[580px] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.14)_0%,rgba(16,185,129,0.04)_34%,transparent_72%)] blur-[170px]" />
				<div className="absolute left-1/2 top-[34%] h-[640px] w-[1200px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.015)_32%,transparent_72%)] blur-[180px]" />
			</div>
			<div className="relative z-10">
				<HeroRSC navbarOnly />
				<PricingHero />
				<PricingTable />
				<Footer />
			</div>
		</div>
	);
}
