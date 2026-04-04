import {
	AlertTriangle,
	ArrowLeft,
	Play,
	Zap,
	Eye,
	Wrench,
	MessageSquare,
	ImagePlus,
	Braces,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { CopyModelName } from "@/components/models/copy-model-name";
import {
	GlobalDiscountBanner,
	type DiscountData,
} from "@/components/models/global-discount-banner";
import { ModelProviderCard } from "@/components/models/model-provider-card";
import { ModelStatusBadgeAuto } from "@/components/models/model-status-badge-auto";
import { ProviderTabs } from "@/components/models/provider-tabs";
import { Badge } from "@/lib/components/badge";
import { Button } from "@/lib/components/button";
import { getConfig } from "@/lib/config-server";
import { fetchModels, fetchProviders } from "@/lib/fetch-models";
import { fetchServerData } from "@/lib/server-api";
import { type StabilityLevel } from "@llmgateway/models";

import type { Metadata } from "next";

interface PageProps {
	params: Promise<{ name: string }>;
}

export const dynamic = "force-dynamic";

async function getModelDiscounts(modelId: string): Promise<DiscountData[]> {
	const data = await fetchServerData<{ discounts: DiscountData[] }>(
		"GET",
		"/public/discounts/model/{modelId}",
		{
			params: {
				path: { modelId },
			},
		},
	);

	return data?.discounts ?? [];
}

function getBestDiscount(
	discounts: DiscountData[],
	modelId: string,
): DiscountData | null {
	// Precedence: model-specific > fully global
	const modelSpecific = discounts.find((d) => d.model === modelId);
	if (modelSpecific) {
		return modelSpecific;
	}

	const fullyGlobal = discounts.find(
		(d) => d.provider === null && d.model === null,
	);
	if (fullyGlobal) {
		return fullyGlobal;
	}

	return null;
}

function getEffectiveProviderDiscount(
	discounts: DiscountData[],
	providerId: string,
	modelId: string,
): number | undefined {
	// Precedence: provider+model > provider > model > fully global
	const providerModel = discounts.find(
		(d) => d.provider === providerId && d.model === modelId,
	);
	if (providerModel) {
		return parseFloat(providerModel.discountPercent);
	}

	const providerOnly = discounts.find(
		(d) => d.provider === providerId && d.model === null,
	);
	if (providerOnly) {
		return parseFloat(providerOnly.discountPercent);
	}

	const modelOnly = discounts.find(
		(d) => d.provider === null && d.model === modelId,
	);
	if (modelOnly) {
		return parseFloat(modelOnly.discountPercent);
	}

	const fullyGlobal = discounts.find(
		(d) => d.provider === null && d.model === null,
	);
	if (fullyGlobal) {
		return parseFloat(fullyGlobal.discountPercent);
	}

	return undefined;
}

function toDiscountNumber(discount: string | number | null | undefined) {
	if (typeof discount === "number") {
		return discount;
	}
	if (typeof discount === "string") {
		const parsed = parseFloat(discount);
		return Number.isFinite(parsed) ? parsed : undefined;
	}
	return undefined;
}

function toPriceNumber(price: string | null | undefined) {
	if (!price) {
		return undefined;
	}
	const parsed = parseFloat(price);
	return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function ModelPage({ params }: PageProps) {
	const config = getConfig();
	const { name } = await params;
	const decodedName = decodeURIComponent(name);
	const [models, providers] = await Promise.all([fetchModels(), fetchProviders()]);

	const modelDef = models.find((m) => m.id === decodedName);

	if (!modelDef) {
		notFound();
	}

	const getStabilityBadgeProps = (stability?: StabilityLevel | null) => {
		switch (stability) {
			case "beta":
				return {
					variant: "secondary" as const,
					color: "text-blue-600",
					label: "BETA",
				};
			case "unstable":
				return {
					variant: "destructive" as const,
					color: "text-red-600",
					label: "UNSTABLE",
				};
			case "experimental":
				return {
					variant: "destructive" as const,
					color: "text-orange-600",
					label: "EXPERIMENTAL",
				};
			default:
				return null;
		}
	};

	const shouldShowStabilityWarning = (stability?: StabilityLevel | null) => {
		return stability && ["unstable", "experimental"].includes(stability);
	};

	const allDiscounts = await getModelDiscounts(decodedName);
	const modelProviders = modelDef.mappings.map((provider) => {
		const providerInfo = providers.find(
			(p) => p.id === provider.providerId,
		);
		const globalDiscount = getEffectiveProviderDiscount(
			allDiscounts,
			provider.providerId,
			decodedName,
		);
		return {
			...provider,
			providerInfo,
			// Global discount takes precedence over hardcoded
			discount: globalDiscount ?? provider.discount,
		};
	});
	const currentModelDiscount = getBestDiscount(allDiscounts, decodedName);

	const breadcrumbSchema = {
		"@context": "https://schema.org",
		"@type": "BreadcrumbList",
		itemListElement: [
			{
				"@type": "ListItem",
				position: 1,
				name: "Home",
				item: "https://llmgateway.io",
			},
			{
				"@type": "ListItem",
				position: 2,
				name: "Models",
				item: "https://llmgateway.io/models",
			},
			{
				"@type": "ListItem",
				position: 3,
				name: modelDef.name ?? modelDef.id,
				item: `https://llmgateway.io/models/${encodeURIComponent(decodedName)}`,
			},
		],
	};

	const lowestInputPrice = Math.min(
		...modelProviders
			.map((p) => {
				const inputPrice = toPriceNumber(p.inputPrice);
				if (inputPrice === undefined) {
					return Infinity;
				}
				const discount = toDiscountNumber(p.discount) ?? 0;
				return inputPrice * 1e6 * (1 - discount);
			})
			.filter((price) => Number.isFinite(price)),
	);

	const productSchema = {
		"@context": "https://schema.org",
		"@type": "Product",
		name: modelDef.name ?? modelDef.id,
		description:
			modelDef.description ??
			`Access ${modelDef.name ?? modelDef.id} through LLM Gateway's unified API.`,
		brand: {
			"@type": "Brand",
			name: modelDef.family || "LLM Gateway",
		},
		offers: {
			"@type": "AggregateOffer",
			priceCurrency: "USD",
			lowPrice: isFinite(lowestInputPrice) ? lowestInputPrice : 0,
			offerCount: modelProviders.length,
			availability: "https://schema.org/InStock",
		},
		category: "AI/ML API Service",
	};

	return (
		<>
			<script
				type="application/ld+json"
				// eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(breadcrumbSchema),
				}}
			/>
			<script
				type="application/ld+json"
				// eslint-disable-next-line @eslint-react/dom/no-dangerously-set-innerhtml
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(productSchema),
				}}
			/>
			<Navbar />
			<div className="min-h-screen bg-background pt-24 md:pt-32 pb-16">
				<div className="container mx-auto px-4 py-8">
					<div className="mb-6">
						<Link
							href="/models"
							className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
						>
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to all models
						</Link>
					</div>
					<div className="mb-8">
						<div className="flex items-center gap-3 mb-2 flex-wrap">
							<h1 className="text-3xl md:text-4xl font-bold tracking-tight">
								{modelDef.name}
							</h1>
							{shouldShowStabilityWarning(modelDef.stability) && (
								<AlertTriangle className="h-6 w-6 md:h-8 md:w-8 text-orange-500" />
							)}
						</div>
						{modelDef.description && (
							<p className="text-muted-foreground mb-4">
								{modelDef.description}
							</p>
						)}
						<div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
							<CopyModelName modelName={decodedName} />
							{(() => {
								const stabilityProps = getStabilityBadgeProps(
									modelDef.stability ?? undefined,
								);
								return stabilityProps ? (
									<Badge
										variant={stabilityProps.variant}
										className="text-xs md:text-sm px-2 md:px-3 py-1"
									>
										{stabilityProps.label}
									</Badge>
								) : (
									<Badge
										variant="outline"
										className="text-xs md:text-sm px-2 md:px-3 py-1"
									>
										STABLE
									</Badge>
								);
							})()}
							<ModelStatusBadgeAuto
								providers={modelProviders.map((p) => ({
									deprecatedAt: p.deprecatedAt,
									deactivatedAt: p.deactivatedAt,
								}))}
							/>

							<a
								href={`${config.playgroundUrl}?model=${encodeURIComponent(modelDef.id)}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Button variant="outline" size="sm" className="gap-2">
									<Play className="h-3 w-3" />
									Try in Playground
								</Button>
							</a>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm text-muted-foreground mb-4">
							<div>
								{Math.max(
									...modelProviders.map((p) => p.contextSize ?? 0),
								).toLocaleString()}{" "}
								context
							</div>
							<div>
								Starting at{" "}
								{(() => {
									const inputPrices = modelProviders
										.map((p) => {
											const price = toPriceNumber(p.inputPrice);
											if (price === undefined) {
												return null;
											}
											const discount = toDiscountNumber(p.discount);
											return {
												price: price * 1e6 * (discount ? 1 - discount : 1),
												originalPrice: price * 1e6,
												discount,
											};
										})
										.filter((p): p is NonNullable<typeof p> => p !== null);
									if (inputPrices.length === 0) {
										return "Free";
									}
									const minPrice = Math.min(...inputPrices.map((p) => p.price));
									const minPriceItem = inputPrices.find(
										(p) => p.price === minPrice,
									);
									return minPriceItem?.discount
										? `$${minPrice.toFixed(2)}/M (${(minPriceItem.discount * 100).toFixed(0)}% off)`
										: `$${minPrice.toFixed(2)}/M`;
								})()}{" "}
								input tokens
							</div>
							<div>
								Starting at{" "}
								{(() => {
									const outputPrices = modelProviders
										.map((p) => {
											const price = toPriceNumber(p.outputPrice);
											if (price === undefined) {
												return null;
											}
											const discount = toDiscountNumber(p.discount);
											return {
												price: price * 1e6 * (discount ? 1 - discount : 1),
												originalPrice: price * 1e6,
												discount,
											};
										})
										.filter((p): p is NonNullable<typeof p> => p !== null);
									if (outputPrices.length === 0) {
										return "Free";
									}
									const minPrice = Math.min(
										...outputPrices.map((p) => p.price),
									);
									const minPriceItem = outputPrices.find(
										(p) => p.price === minPrice,
									);
									return minPriceItem?.discount
										? `$${minPrice.toFixed(2)}/M (${(minPriceItem.discount * 100).toFixed(0)}% off)`
										: `$${minPrice.toFixed(2)}/M`;
								})()}{" "}
								output tokens
							</div>
						</div>

						{/* Capabilities (using same icons as /models) */}
						<div className="flex flex-wrap items-center gap-4 mb-6">
							{(() => {
								const items: Array<{
									key: string;
									icon: typeof Zap;
									label: string;
									color: string;
								}> = [];
								const hasStreaming = modelProviders.some((p) => p.streaming);
								const hasVision = modelProviders.some((p) => p.vision);
								const hasTools = modelProviders.some((p) => p.tools);
								const hasReasoning = modelProviders.some((p) => p.reasoning);
								const hasJsonOutput = modelProviders.some((p) => p.jsonOutput);
								const hasImageGen =
									Array.isArray(modelDef.output) &&
									modelDef.output.includes("image");

								if (hasStreaming) {
									items.push({
										key: "streaming",
										icon: Zap,
										label: "Streaming",
										color: "text-blue-500",
									});
								}
								if (hasVision) {
									items.push({
										key: "vision",
										icon: Eye,
										label: "Vision",
										color: "text-green-500",
									});
								}
								if (hasTools) {
									items.push({
										key: "tools",
										icon: Wrench,
										label: "Tools",
										color: "text-purple-500",
									});
								}
								if (hasReasoning) {
									items.push({
										key: "reasoning",
										icon: MessageSquare,
										label: "Reasoning",
										color: "text-orange-500",
									});
								}
								if (hasJsonOutput) {
									items.push({
										key: "jsonOutput",
										icon: Braces,
										label: "JSON Output",
										color: "text-cyan-500",
									});
								}
								if (hasImageGen) {
									items.push({
										key: "image",
										icon: ImagePlus,
										label: "Image Generation",
										color: "text-pink-500",
									});
								}

								return items.map(({ key, icon: Icon, label, color }) => (
									<div
										key={key}
										className="inline-flex items-center gap-2 text-sm text-foreground"
									>
										<Icon className={`h-4 w-4 ${color}`} />
										<span className="text-muted-foreground">{label}</span>
									</div>
								));
							})()}
						</div>
					</div>

					{currentModelDiscount && (
						<div className="mb-6">
							<GlobalDiscountBanner discount={currentModelDiscount} />
						</div>
					)}

					<div className="mb-8">
						<h2 className="text-xl md:text-2xl font-semibold mb-4">
							Select Provider
						</h2>
						<ProviderTabs
							modelId={decodedName}
							providerIds={modelProviders.map((p) => p.providerId)}
							activeProviderId=""
						/>
					</div>

					<div className="mb-8">
						<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
							<div>
								<h2 className="text-xl md:text-2xl font-semibold mb-2">
									All Providers for {modelDef.name}
								</h2>
								<p className="text-muted-foreground">
									LLM Gateway routes requests to the best providers that are
									able to handle your prompt size and parameters.
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
							{modelProviders.map((provider) => (
								<ModelProviderCard
									key={`${provider.providerId}-${provider.modelName}-${decodedName}`}
									provider={provider}
									modelName={decodedName}
									modelStability={modelDef.stability ?? undefined}
									modelOutput={modelDef.output ?? undefined}
								/>
							))}
						</div>
					</div>
				</div>
			</div>
			<Footer />
		</>
	);
}

export async function generateMetadata({
	params,
}: PageProps): Promise<Metadata> {
	const { name } = await params;
	const decodedName = decodeURIComponent(name);
	const models = await fetchModels();
	const model = models.find((m) => m.id === decodedName);

	if (!model) {
		return {};
	}

	const title = `${model.name ?? model.id} – AI Model on LLM Gateway`;
	const description =
		model.description ??
		`Details, pricing, and capabilities for ${model.name ?? model.id} on KiwiLLM.`;

	const primaryProvider = model.mappings[0]?.providerId || "default";
	const ogImageUrl = `/models/${encodeURIComponent(decodedName)}/${encodeURIComponent(primaryProvider)}/opengraph-image`;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "website",
			images: [
				{
					url: ogImageUrl,
					width: 1200,
					height: 630,
					alt: `${model.name ?? model.id} model card`,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
			images: [ogImageUrl],
		},
	};
}
