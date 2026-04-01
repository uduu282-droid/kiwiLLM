import { join, resolve } from "path";

import { withContentCollections } from "@content-collections/next";
import { createMDX } from "fumadocs-mdx/next";

import type { NextConfig } from "next";

const withMDX = createMDX();

const nextConfig: NextConfig = {
	outputFileTracingRoot: join(__dirname, "../../"),
	distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
	output: "standalone",
	productionBrowserSourceMaps: false,
	typedRoutes: true,
	reactStrictMode: true,
	reactCompiler: true,
	webpack: (config, { isServer }) => {
		if (isServer) {
			config.devtool = "source-map";
		}

		config.resolve.alias = {
			...(config.resolve.alias ?? {}),
			"@llmgateway/shared$": resolve(
				__dirname,
				"../../packages/shared/src/index.ts",
			),
			"@llmgateway/shared/components$": resolve(
				__dirname,
				"../../packages/shared/src/components/index.tsx",
			),
			"@kiwi-docs": resolve(__dirname, "../docs"),
		};

		return config;
	},
	async redirects() {
		return [
			{
				source: "/models/sherlock-dash-alpha",
				destination: "/models/grok-4-1-fast-non-reasoning",
				permanent: true,
			},
			{
				source: "/models/sherlock-think-alpha",
				destination: "/models/grok-4-1-fast-reasoning",
				permanent: true,
			},
			{
				source: "/discord",
				destination: "https://discord.gg/3u7jpXf36B",
				permanent: true,
			},
			{
				source: "/github",
				destination: "https://github.com/uduu282-droid/kiwiLLM",
				permanent: true,
			},
			{
				source: "/twitter",
				destination: "https://www.kiwillm.in",
				permanent: true,
			},
			{
				source: "/x",
				destination: "https://www.kiwillm.in",
				permanent: true,
			},
			{
				source: "/terms",
				destination: "/legal/terms",
				permanent: true,
			},
			{
				source: "/terms-of-use",
				destination: "/legal/terms",
				permanent: true,
			},
			{
				source: "/privacy",
				destination: "/legal/privacy",
				permanent: true,
			},
			{
				source: "/privacy-policy",
				destination: "/legal/privacy",
				permanent: true,
			},
		];
	},
	typescript: {
		ignoreBuildErrors: true,
	},
};

// withContentCollections must be the outermost plugin
export default withContentCollections(withMDX(nextConfig));
