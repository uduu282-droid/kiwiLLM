import { createRelativeLink } from "fumadocs-ui/mdx";
import {
	DocsBody,
	DocsDescription,
	DocsPage,
	DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";

import { getDocsMDXComponents } from "@/lib/docs-mdx-components";
import { source } from "@/lib/docs-source";

import type { Metadata } from "next";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
	const { slug = [] } = await params;
	const page = source.getPage(slug);

	if (!page) {
		notFound();
	}

	return {
		title: page.data.title,
		description: page.data.description,
		alternates: {
			canonical: page.url,
		},
		openGraph: {
			title: page.data.title,
			description: page.data.description,
			type: "article",
			url: `https://www.kiwillm.in${page.url}`,
		},
	};
}

export default async function DocsRoutePage({
	params,
}: {
	params: Promise<{ slug?: string[] }>;
}) {
	const { slug = [] } = await params;
	const page = source.getPage(slug);

	if (!page) {
		notFound();
	}

	const MDXContent = page.data.body;

	return (
		<div className="flex gap-10">
			<div className="min-w-0 flex-1">
				<DocsPage
					toc={page.data.toc}
					full={page.data.full}
					tableOfContent={{
						style: "clerk",
					}}
					lastUpdate={new Date()}
				>
					<DocsTitle>{page.data.title}</DocsTitle>
					<DocsDescription>{page.data.description}</DocsDescription>
					<DocsBody>
						<MDXContent
							components={getDocsMDXComponents({
								a: createRelativeLink(source, page),
							})}
						/>
					</DocsBody>
				</DocsPage>
			</div>
		</div>
	);
}

export function generateStaticParams() {
	return source.generateParams();
}
