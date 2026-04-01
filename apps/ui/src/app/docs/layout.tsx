import Link from "next/link";

import { RootProvider } from "fumadocs-ui/provider/next";

import { getDocsNavigation } from "@/lib/docs-source";

import type { Route } from "next";
import type { ReactNode } from "react";

export const metadata = {
	title: "Docs",
	description: "KiwiLLM documentation and quickstart guides.",
};

export default function DocsLayout({ children }: { children: ReactNode }) {
	const navGroups = getDocsNavigation();

	return (
		<RootProvider
			theme={{
				defaultTheme: "system",
			}}
		>
			<div className="min-h-screen bg-background">
				<div className="border-b bg-background/95 backdrop-blur">
					<div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
						<Link href="/" className="flex items-center gap-3 font-semibold">
							<img
								src="/brand/kiwillm-logo.png"
								alt="KiwiLLM"
								className="h-8 w-8 object-contain"
							/>
							<span>KiwiLLM Docs</span>
						</Link>
						<div className="text-sm text-muted-foreground">
							OpenAI-compatible docs, guides, and API reference
						</div>
					</div>
				</div>
				<div className="mx-auto flex max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:px-8">
					<aside className="hidden w-72 shrink-0 lg:block">
						<div className="sticky top-24 space-y-8">
							{navGroups.map((group) => (
								<div key={group.title} className="space-y-3">
									<div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
										{group.title}
									</div>
									<div className="space-y-1">
										{group.items.map((item) => (
											<Link
												key={item.url}
												href={item.url as Route}
												className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
											>
												{item.title}
											</Link>
										))}
									</div>
								</div>
							))}
						</div>
					</aside>
					<div className="min-w-0 flex-1">{children}</div>
				</div>
			</div>
		</RootProvider>
	);
}
