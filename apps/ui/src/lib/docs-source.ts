import { customIcons } from "@kiwi-docs/lib/custom-icons";
import { loader } from "fumadocs-core/source";
import { lucideIconsPlugin } from "fumadocs-core/source/lucide-icons";
import { createMDXSource } from "fumadocs-mdx/runtime/next";
import { createOpenAPI, openapiPlugin } from "fumadocs-openapi/server";
import { icons } from "lucide-react";
import { createElement } from "react";

import { docs, meta } from "../../.source";

import type { InferPageType } from "fumadocs-core/source";

export const source = loader({
	icon(icon) {
		if (!icon) {
			return undefined;
		}
		if (icon in icons) {
			return createElement(icons[icon as keyof typeof icons]);
		}
		if (icon in customIcons) {
			const CustomIcon = customIcons[icon];
			return createElement(CustomIcon);
		}
		return undefined;
	},
	baseUrl: "/docs",
	source: createMDXSource(docs, meta),
	plugins: [lucideIconsPlugin(), openapiPlugin()],
});

export const openapi = createOpenAPI({
	input: ["../api/openapi.json", "../gateway/openapi.json"],
});

export interface DocsNavGroup {
	title: string;
	items: Array<{
		title: string;
		url: string;
	}>;
}

export function getDocsNavigation(): DocsNavGroup[] {
	const groups = new Map<string, DocsNavGroup>();
	const rootItems: DocsNavGroup["items"] = [];

	for (const params of source.generateParams()) {
		const slug = params.slug ?? [];
		const page = source.getPage(slug);
		if (!page) {
			continue;
		}

		if (slug.length === 0) {
			rootItems.push({
				title: page.data.title,
				url: "/docs",
			});
			continue;
		}

		const [section] = slug;
		const sectionTitle =
			section
				.split("-")
				.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
				.join(" ") ?? "Docs";

		if (!groups.has(sectionTitle)) {
			groups.set(sectionTitle, {
				title: sectionTitle,
				items: [],
			});
		}

		groups.get(sectionTitle)?.items.push({
			title: page.data.title,
			url: page.url,
		});
	}

	return [
		...(rootItems.length > 0
			? [
					{
						title: "Start",
						items: rootItems,
					},
				]
			: []),
		...Array.from(groups.values()).sort((a, b) =>
			a.title.localeCompare(b.title),
		),
	];
}

export function getPageImage(page: InferPageType<typeof source>) {
	const segments = [...page.slugs, "image.png"];

	return {
		segments,
		url: `/docs-og/${segments.join("/")}`,
		title: page.data.title,
		description: page.data.description,
	};
}
