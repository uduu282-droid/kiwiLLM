import { Inter, Geist_Mono } from "next/font/google";

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
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
	metadataBase: new URL("https://code.llmgateway.io"),
	title: "KiwiLLM Code - Dev Plans for Developers",
	description:
		"Subscribe to KiwiLLM Code for AI-powered coding assistance. Access Claude, GPT-4, and other models.",
	icons: {
		icon: [
			{ url: "/favicon/favicon.ico?v=2" },
			{ url: "/brand/kiwillm-logo.png", type: "image/png" },
		],
		apple: [{ url: "/brand/kiwillm-logo.png", type: "image/png" }],
	},
	openGraph: {
		title: "KiwiLLM Code - Dev Plans for Developers",
		description:
			"Subscribe to KiwiLLM Code for AI-powered coding assistance. Access Claude, GPT-4, and other models.",
		images: ["/brand/kiwillm-logo.png"],
		type: "website",
		url: "https://code.llmgateway.io",
	},
	twitter: {
		card: "summary_large_image",
		title: "KiwiLLM Code - Dev Plans for Developers",
		description:
			"Subscribe to KiwiLLM Code for AI-powered coding assistance. Access Claude, GPT-4, and other models.",
		images: ["/brand/kiwillm-logo.png"],
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	const config = getConfig();

	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.variable} ${geistMono.variable} antialiased`}>
				<Providers config={config}>{children}</Providers>
			</body>
		</html>
	);
}
