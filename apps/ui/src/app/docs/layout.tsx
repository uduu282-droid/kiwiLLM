import { DocsLayout as FumaDocsLayout } from "fumadocs-ui/layouts/docs";
import { RootProvider } from "fumadocs-ui/provider/next";


import { source } from "@/lib/docs-source";

import type { ReactNode } from "react";

export const metadata = {
	title: "Docs",
	description: "KiwiLLM documentation and quickstart guides.",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
	return (
		<RootProvider
			theme={{
				defaultTheme: "system",
			}}
		>
			<FumaDocsLayout
				tree={source.pageTree}
				nav={{
					title: (
						<div className="flex items-center gap-3 font-semibold">
							<img
								src="/brand/kiwillm-logo.png"
								alt="KiwiLLM"
								className="h-8 w-8 object-contain"
							/>
							<span>KiwiLLM Docs</span>
						</div>
					),
					url: "/docs",
				}}
				links={[
					{
						text: "Dashboard",
						url: "https://app.kiwillm.in/dashboard",
						active: "none",
					},
				]}
			>
				{children}
			</FumaDocsLayout>
		</RootProvider>
	);
}
