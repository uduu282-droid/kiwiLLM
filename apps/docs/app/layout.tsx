// eslint-disable-next-line import/order
import "./global.css";

import { RootProvider } from "fumadocs-ui/provider/next";
import { Geist_Mono, Inter } from "next/font/google";

import { ConfigProvider } from "@/lib/context";
import { PostHogProvider } from "@/lib/providers";

import type { Metadata } from "next";
import type { ReactNode } from "react";

const inter = Inter({
	subsets: ["latin"],
});

const mono = Geist_Mono({
	subsets: ["latin"],
	variable: "--font-mono",
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	metadataBase: new URL(process.env.DOCS_URL ?? "https://kiwillm.in"),
	title: "KiwiLLM Documentation",
	description:
		"KiwiLLM documentation - route, manage, and analyze LLM traffic across providers with one API.",
	icons: {
		icon: [{ url: "/brand/kiwillm-logo.png?v=3", type: "image/png" }],
		shortcut: [{ url: "/brand/kiwillm-logo.png?v=3", type: "image/png" }],
		apple: [{ url: "/brand/kiwillm-logo.png?v=3", type: "image/png" }],
	},
	alternates: {
		canonical: "./",
	},
	openGraph: {
		title: "KiwiLLM Documentation",
		description:
			"KiwiLLM documentation - route, manage, and analyze LLM traffic across providers with one API.",
		images: ["/brand/kiwillm-logo.png"],
		type: "website",
	},
};

export default function Layout({ children }: { children: ReactNode }) {
	// Access environment variables directly on the server
	const posthogKey = process.env.POSTHOG_KEY ?? "";
	const posthogHost = process.env.POSTHOG_HOST ?? "";

	return (
		<html
			lang="en"
			className={`${inter.className} ${mono.variable}`}
			suppressHydrationWarning
		>
			<body className="flex flex-col min-h-screen">
				<ConfigProvider posthogKey={posthogKey} posthogHost={posthogHost}>
					<PostHogProvider>
						<RootProvider
							theme={{
								defaultTheme: "system",
							}}
						>
							{children}
						</RootProvider>
					</PostHogProvider>
				</ConfigProvider>
			</body>
		</html>
	);
}
