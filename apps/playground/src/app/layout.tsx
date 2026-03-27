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
	metadataBase: new URL("https://chat.kiwillm.in"),
	title: "KiwiLLM Chat",
	description: "Chat, compare models, and generate images with KiwiLLM.",
	icons: {
		icon: "/icon.png",
		apple: "/apple-icon.png",
	},
	alternates: {
		canonical: "./",
	},
	openGraph: {
		title: "KiwiLLM Chat",
		description: "Chat, compare models, and generate images with KiwiLLM.",
		images: ["/brand/kiwillm-logo.png"],
		type: "website",
		url: "https://chat.kiwillm.in",
	},
	twitter: {
		card: "summary_large_image",
		title: "KiwiLLM Chat",
		description: "Chat, compare models, and generate images with KiwiLLM.",
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
