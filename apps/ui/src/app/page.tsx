import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

import Features from "@/components/landing/features";
import { HeroRSC } from "@/components/landing/hero-rsc";
import { Testimonials } from "@/components/landing/testimonials";
import { getUser } from "@/lib/getUser";

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

	const user = await getUser();

	return (
		<div className="relative overflow-hidden bg-[#050608] text-foreground">
			<div aria-hidden className="pointer-events-none absolute inset-0">
				<div className="absolute -left-[10%] top-[6%] h-[540px] w-[540px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,rgba(59,130,246,0.03)_36%,transparent_72%)] blur-[140px]" />
				<div className="absolute right-[-8%] top-[18%] h-[720px] w-[720px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.06)_0%,rgba(59,130,246,0.02)_34%,transparent_72%)] blur-[180px]" />
				<div className="absolute left-1/2 top-[38%] h-[680px] w-[1280px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,rgba(255,255,255,0.015)_28%,transparent_72%)] blur-[180px]" />
			</div>
			<div className="relative z-10">
				<HeroRSC initialUser={user} />
				<Features />
				<Graph />
				<CodeExample />
				<Testimonials />
				<Faq />
				<CallToAction />
				<Footer />
			</div>
		</div>
	);
}
