import { HeroCompare } from "@/components/compare/hero-compare";
import { ComparisonLiteLLM } from "@/components/landing/comparison-litellm";
import Footer from "@/components/landing/footer";

export default function CompareLiteLLMPage() {
	return (
		<div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
			<main>
				<HeroCompare
					content={{
						heading: "Why Choose KiwiLLM Over LiteLLM?",
						description:
							"Compare our production-ready managed gateway with advanced analytics, routing, and enterprise features against LiteLLM's self-hosted proxy solution.",
						badges: [
							"Managed Infrastructure",
							"Advanced Analytics",
							"Enterprise Support",
							"Production Ready",
						],
						cta: {
							primary: {
								text: "Start for Free",
								href: "/signup",
							},
							secondary: {
								text: "View Documentation",
								href: "https://docs.llmgateway.io",
								external: true,
							},
						},
					}}
				/>
				<ComparisonLiteLLM />
			</main>
			<Footer />
		</div>
	);
}

export async function generateMetadata() {
	return {
		title: "KiwiLLM vs LiteLLM - Feature Comparison | KiwiLLM",
		description:
			"Compare KiwiLLM's managed infrastructure, advanced analytics, and enterprise features against LiteLLM's self-hosted proxy solution. See why teams choose our production-ready API gateway.",
		openGraph: {
			title: "KiwiLLM vs LiteLLM - Feature Comparison",
			description:
				"Compare KiwiLLM's managed infrastructure, advanced analytics, and enterprise features against LiteLLM's self-hosted proxy solution. See why teams choose our production-ready API gateway.",
			type: "website",
		},
		twitter: {
			card: "summary_large_image",
			title: "KiwiLLM vs LiteLLM - Feature Comparison",
			description:
				"Compare KiwiLLM's managed infrastructure, advanced analytics, and enterprise features against LiteLLM's self-hosted proxy solution.",
		},
	};
}

