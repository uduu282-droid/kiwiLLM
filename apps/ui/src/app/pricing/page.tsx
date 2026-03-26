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
		<>
			<HeroRSC navbarOnly />
			<PricingHero />
			<PricingTable />
			<Footer />
		</>
	);
}

