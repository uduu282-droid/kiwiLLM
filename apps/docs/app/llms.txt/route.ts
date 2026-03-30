import { source } from "@/lib/source";

// cached forever
export const revalidate = false;

export async function GET() {
	const pages = source.getPages();

	const lines = pages.map((page) => {
		return `- [${page.data.title}](${page.url})${page.data.description ? `: ${page.data.description}` : ""}`;
	});

	const content = `# KiwiLLM Documentation

> Documentation for KiwiLLM - a full-stack LLM API gateway

## Docs

${lines.join("\n")}`;

	return new Response(content);
}
