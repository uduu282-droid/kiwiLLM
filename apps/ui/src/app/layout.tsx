import { Inter, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";

import { Providers } from "@/components/providers";
import { getConfig } from "@/lib/config-server";

import "./globals.css";

import type { Metadata } from "next";
import type { ReactNode } from "react";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	display: "swap",
});

const geistMono = Geist_Mono({
	variable: "--font-mono",
	subsets: ["latin"],
	display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
	variable: "--font-display",
	subsets: ["latin"],
	weight: ["500", "600", "700", "800"],
	display: "swap",
});

const siteUrl = process.env.APP_URL ?? "https://kiwi-llm.vercel.app";

export const metadata: Metadata = {
	metadataBase: new URL(siteUrl),
	title: {
		default: "KiwiLLM - Unified API for Multiple LLM Providers",
		template: "%s | KiwiLLM",
	},
	description:
		"Route, manage, and analyze your LLM requests across multiple providers with a unified API interface. Access OpenAI, Anthropic, Google, and 19+ providers through one API.",
	authors: [{ name: "KiwiLLM" }],
	creator: "KiwiLLM",
	publisher: "KiwiLLM",
	icons: {
		icon: [{ url: "/brand/kiwillm-logo.png", type: "image/png" }],
		apple: [{ url: "/brand/kiwillm-logo.png", type: "image/png" }],
	},
	alternates: {
		canonical: "./",
	},
	openGraph: {
		title: "KiwiLLM - Unified API for Multiple LLM Providers",
		description:
			"Route, manage, and analyze your LLM requests across multiple providers with a unified API interface. Access OpenAI, Anthropic, Google, and 19+ providers through one API.",
		images: ["/brand/kiwillm-logo.png"],
		type: "website",
		url: siteUrl,
		siteName: "KiwiLLM",
		locale: "en_US",
	},
	twitter: {
		card: "summary_large_image",
		title: "KiwiLLM - Unified API for Multiple LLM Providers",
		description:
			"Route, manage, and analyze your LLM requests across multiple providers with a unified API interface.",
		images: ["/brand/kiwillm-logo.png"],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

const organizationSchema = {
	"@context": "https://schema.org",
	"@type": "Organization",
	name: "KiwiLLM",
	url: siteUrl,
	logo: `${siteUrl}/brand/kiwillm-logo.png`,
	description:
		"Route, manage, and analyze your LLM requests across multiple providers with a unified API interface.",
	sameAs: ["https://github.com/uduu282-droid/kiwiLLM"],
};

const websiteSchema = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: "KiwiLLM",
	url: siteUrl,
	potentialAction: {
		"@type": "SearchAction",
		target: {
			"@type": "EntryPoint",
			urlTemplate: `${siteUrl}/models?search={search_term_string}`,
		},
		"query-input": "required name=search_term_string",
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	const config = getConfig();

	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<link rel="preconnect" href="https://internal.llmgateway.io" />
				<link rel="preconnect" href="https://kiwillm.in" />
				<script
					type="application/ld+json"
					// eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(organizationSchema),
					}}
				/>
				<script
					type="application/ld+json"
					// eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(websiteSchema),
					}}
				/>
			</head>
			<body
				className={`${inter.variable} ${geistMono.variable} ${plusJakarta.variable} min-h-screen antialiased`}
			>
				<Providers config={config}>{children}</Providers>
			</body>
		</html>
	);
}
