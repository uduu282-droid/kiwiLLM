import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import Features from "@/components/landing/features";
import { HeroRSC } from "@/components/landing/hero-rsc";
import { Testimonials } from "@/components/landing/testimonials";

const Graph = dynamic(() =>
	import("@/components/landing/graph").then((mod) => mod.Graph),
);
const CodeExample = dynamic(() =>
	import("@/components/landing/code-example").then((mod) => mod.CodeExample),
);
const Faq = dynamic(() =>
	import("@/components/landing/faq").then((mod) => mod.Faq),
);
const CallToAction = dynamic(() => import("@/components/landing/cta"));
const Footer = dynamic(() => import("@/components/landing/footer"));

export default async function Home({
	searchParams,
}: {
	searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
	const params = (await searchParams) ?? {};
	const code = typeof params.code === "string" ? params.code : null;

	if (code) {
		const callbackParams = new URLSearchParams();
		callbackParams.set("code", code);
		callbackParams.set("next", "/dashboard");

		for (const key of [
			"error",
			"error_code",
			"error_description",
			"error_description_code",
		] as const) {
			const value = params[key];
			if (typeof value === "string") {
				callbackParams.set(key, value);
			}
		}

		redirect(`/auth/callback?${callbackParams.toString()}`);
	}

	return (
		<>
			<HeroRSC />
			<Features />
			<Graph />
			<CodeExample />
			<Testimonials />
			<Faq />
			<CallToAction />
			<Footer />
		</>
	);
}
