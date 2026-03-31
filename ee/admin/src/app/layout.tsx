import { Inter, Geist_Mono } from "next/font/google";

import { AdminShell } from "@/components/admin-shell";
import { getConfig } from "@/lib/config-server";
import { Providers } from "@/lib/providers";

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
	metadataBase: new URL("https://admin.llmgateway.io"),
	title: "KiwiLLM Admin",
	description: "Admin dashboard for KiwiLLM.",
	icons: {
		icon: [
			{ url: "/favicon/favicon.ico?v=2" },
			{ url: "/brand/kiwillm-logo.png", type: "image/png" },
		],
		apple: [{ url: "/brand/kiwillm-logo.png", type: "image/png" }],
	},
	openGraph: {
		title: "KiwiLLM Admin",
		description: "Admin dashboard for KiwiLLM.",
		images: ["/brand/kiwillm-logo.png"],
		type: "website",
		url: "https://admin.llmgateway.io",
	},
	robots: {
		index: false,
		follow: false,
	},
};

export default function RootLayout({ children }: { children: ReactNode }) {
	const config = getConfig();

	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.variable} ${geistMono.variable} antialiased`}>
				<Providers config={config}>
					<AdminShell>{children}</AdminShell>
				</Providers>
			</body>
		</html>
	);
}
