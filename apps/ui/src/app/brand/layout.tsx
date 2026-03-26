import Footer from "@/components/landing/footer";
import { HeroRSC } from "@/components/landing/hero-rsc";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Brand Assets | KiwiLLM",
	description:
		"Download official KiwiLLM logos and brand assets. Get the kiwi mark and wordmark for product screenshots, presentations, and integrations.",
	openGraph: {
		title: "Brand Assets | KiwiLLM",
		description:
			"Download official KiwiLLM logos and brand assets. Get the kiwi mark and wordmark for product screenshots, presentations, and integrations.",
	},
};

export default function BrandLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div>
			<HeroRSC navbarOnly />
			{children}
			<Footer />
		</div>
	);
}
