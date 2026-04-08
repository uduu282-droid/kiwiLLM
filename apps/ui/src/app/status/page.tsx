import Footer from "@/components/landing/footer";
import { HeroRSC } from "@/components/landing/hero-rsc";
import { fetchPublicStatus } from "@/lib/fetch-status";

import { StatusBoard } from "./status-board";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Status - KiwiLLM",
	description:
		"Track KiwiLLM chat model availability, recent health checks, and uptime across the hosted model catalog.",
	openGraph: {
		title: "KiwiLLM Status",
		description:
			"Track KiwiLLM chat model availability, recent health checks, and uptime across the hosted model catalog.",
	},
};

export default async function StatusPage() {
	const status = await fetchPublicStatus();

	return (
		<div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
			<main>
				<HeroRSC navbarOnly />
				<section className="container mx-auto px-4 pt-40 pb-16">
					<div className="mx-auto max-w-7xl">
						<StatusBoard initialStatus={status} />
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}
