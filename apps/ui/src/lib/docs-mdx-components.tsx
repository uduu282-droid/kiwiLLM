import { createAPIPage } from "fumadocs-openapi/ui";
import defaultMdxComponents from "fumadocs-ui/mdx";

import { openapi } from "@/lib/docs-source";

import client from "@kiwi-docs/components/api-page.client";

import type { ComponentType } from "react";

type MDXComponents = Record<string, ComponentType<any>>;

const APIPage = createAPIPage(openapi, {
	client,
});

export function getDocsMDXComponents(
	components?: MDXComponents,
): MDXComponents {
	return {
		...defaultMdxComponents,
		APIPage,
		...components,
	};
}
