import Footer from "@/components/landing/footer";
import { HeroRSC } from "@/components/landing/hero-rsc";
import { Badge } from "@/lib/components/badge";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { fetchPublicStatus } from "@/lib/fetch-status";

import type { PublicStatusModel } from "@/lib/fetch-status";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Status - KiwiLLM",
	description:
		"Track KiwiLLM chat model availability, recent health checks, and uptime across the hosted model catalog.",
	openGraph: {
		title: "KiwiLLM Status",
		description:
			"Track KiwiLLM chat model availability, recent health checks, and uptime across the hosted model catalog.",
	},
};

type ModelStatus = "operational" | "degraded" | "down" | "unknown";

interface BrandGroup {
	id: string;
	label: string;
	status: ModelStatus;
	models: PublicStatusModel[];
	modelCount: number;
	averageUptimePercent: number | null;
	averageLatencyMs: number | null;
}

const statusOrder: Record<ModelStatus, number> = {
	down: 0,
	degraded: 1,
	unknown: 2,
	operational: 3,
};

const familyLabelMap: Record<string, string> = {
	alibaba: "Qwen",
	anthropic: "Anthropic",
	aws: "AWS",
	baichuan: "Baichuan",
	bytedance: "ByteDance",
	cohere: "Cohere",
	databricks: "Databricks",
	deepseek: "DeepSeek",
	glm: "GLM",
	google: "Google",
	ibm: "IBM",
	meta: "Meta",
	microsoft: "Microsoft",
	minimax: "MiniMax",
	mistral: "Mistral",
	moonshot: "Moonshot",
	nvidia: "NVIDIA",
	openai: "OpenAI",
	openrouter: "OpenRouter",
	perplexity: "Perplexity",
	qwen: "Qwen",
	reka: "Reka",
	sarvam: "Sarvam",
	stepfun: "StepFun",
	upstage: "Upstage",
	xai: "xAI",
	zai: "Z AI",
};

function titleCase(value: string): string {
	return value
		.split(/[-_.\s]+/)
		.filter(Boolean)
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join(" ");
}

function getBrandLabel(family: string): string {
	return familyLabelMap[family] ?? titleCase(family);
}

function formatPercent(value: number | null): string {
	if (value === null) {
		return "Awaiting checks";
	}

	return `${value.toFixed(1)}%`;
}

function formatDateTime(value: string | null): string {
	if (!value) {
		return "No checks yet";
	}

	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit",
		timeZoneName: "short",
	}).format(new Date(value));
}

function formatRelativeTime(value: string | null): string {
	if (!value) {
		return "No checks yet";
	}

	const diffMs = Date.now() - new Date(value).getTime();
	const diffHours = Math.max(0, Math.round(diffMs / (60 * 60 * 1000)));

	if (diffHours < 1) {
		return "Less than 1 hour ago";
	}

	if (diffHours < 24) {
		return `${diffHours}h ago`;
	}

	return `${Math.round(diffHours / 24)}d ago`;
}

function getStatusBadgeClassName(status: ModelStatus): string {
	switch (status) {
		case "operational":
			return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
		case "degraded":
			return "border-amber-500/30 bg-amber-500/10 text-amber-300";
		case "down":
			return "border-red-500/30 bg-red-500/10 text-red-300";
		case "unknown":
		default:
			return "border-zinc-500/30 bg-zinc-500/10 text-zinc-300";
	}
}

function getAggregateStatus(models: PublicStatusModel[]): ModelStatus {
	return (
		[...models].sort((a, b) => statusOrder[a.status] - statusOrder[b.status])[0]
			?.status ?? "unknown"
	);
}

function averageNumber(values: Array<number | null>): number | null {
	const numbers = values.filter((value): value is number => value !== null);
	if (numbers.length === 0) {
		return null;
	}

	return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function buildBrandGroups(models: PublicStatusModel[]): BrandGroup[] {
	const groups = new Map<string, PublicStatusModel[]>();

	for (const model of models) {
		const key = model.family;
		const existing = groups.get(key) ?? [];
		existing.push(model);
		groups.set(key, existing);
	}

	return Array.from(groups.entries())
		.map(([family, brandModels]) => {
			const sortedModels = [...brandModels].sort((a, b) => {
				const statusDiff = statusOrder[a.status] - statusOrder[b.status];
				if (statusDiff !== 0) {
					return statusDiff;
				}

				return a.name.localeCompare(b.name);
			});

			return {
				id: family,
				label: getBrandLabel(family),
				status: getAggregateStatus(sortedModels),
				models: sortedModels,
				modelCount: sortedModels.length,
				averageUptimePercent: averageNumber(
					sortedModels.map((model) => model.uptimePercent),
				),
				averageLatencyMs: averageNumber(
					sortedModels.map((model) => model.lastResponseTimeMs),
				),
			};
		})
		.sort((a, b) => {
			const statusDiff = statusOrder[a.status] - statusOrder[b.status];
			if (statusDiff !== 0) {
				return statusDiff;
			}

			return a.label.localeCompare(b.label);
		});
}

export default async function StatusPage() {
	const status = await fetchPublicStatus();
	const brandGroups = buildBrandGroups(status.models);
	const allUnknown =
		status.summary.totalModels > 0 &&
		status.summary.unknown === status.summary.totalModels;

	return (
		<div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
			<main>
				<HeroRSC navbarOnly />

				<section className="container mx-auto px-4 pt-40 pb-16">
					<div className="mx-auto max-w-7xl space-y-8">
						<div className="space-y-4">
							<Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
								Live Status
							</Badge>
							<div className="space-y-3">
								<h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
									KiwiLLM model status
								</h1>
								<p className="max-w-3xl text-base text-zinc-600 dark:text-zinc-400 md:text-lg">
									Hosted chat models are probed every {status.checkedEveryHours}{" "}
									hours. Brand cards below roll model health into a single
									system view so we can spot healthy brands, degraded families,
									and individual model issues quickly.
								</p>
							</div>
							<p className="text-sm text-zinc-500 dark:text-zinc-500">
								Last generated {formatDateTime(status.generatedAt)}
							</p>
						</div>

						{allUnknown ? (
							<Card className="border-amber-500/20 bg-amber-500/5 text-white">
								<CardHeader>
									<CardTitle className="text-lg text-amber-200">
										Awaiting first health checks
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-2 text-sm text-zinc-300">
									<p>
										The status board can already see all hosted chat models, but
										no probe results have been written yet, so every model is
										still <code>unknown</code>.
									</p>
									<p>
										Once the worker writes the first probe batch, this page will
										show real uptime, latency, and operational/degraded/down
										states.
									</p>
								</CardContent>
							</Card>
						) : null}

						<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
							{[
								{
									label: "Total models",
									value: status.summary.totalModels,
									tone: "text-white",
								},
								{
									label: "Operational",
									value: status.summary.operational,
									tone: "text-emerald-400",
								},
								{
									label: "Degraded",
									value: status.summary.degraded,
									tone: "text-amber-300",
								},
								{
									label: "Down",
									value: status.summary.down,
									tone: "text-red-300",
								},
								{
									label: "Unknown",
									value: status.summary.unknown,
									tone: "text-zinc-300",
								},
							].map((item) => (
								<Card
									key={item.label}
									className="border-zinc-800 bg-zinc-950 text-white"
								>
									<CardHeader className="pb-2">
										<CardTitle className="text-sm font-medium text-zinc-400">
											{item.label}
										</CardTitle>
									</CardHeader>
									<CardContent>
										<div className={`text-3xl font-semibold ${item.tone}`}>
											{item.value}
										</div>
									</CardContent>
								</Card>
							))}
						</div>

						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<h2 className="text-xl font-semibold text-white">
									Models by brand
								</h2>
								<p className="text-sm text-zinc-500">
									{brandGroups.length} brands
								</p>
							</div>

							<div className="space-y-4">
								{brandGroups.map((group) => (
									<details
										key={group.id}
										open
										className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 text-white"
									>
										<summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5">
											<div className="flex items-center gap-3">
												<div className="text-2xl leading-none text-zinc-500">
													▾
												</div>
												<div>
													<div className="flex items-center gap-3">
														<h3 className="text-2xl font-semibold">
															{group.label}
														</h3>
														<span className="rounded-full border border-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
															{group.modelCount}
														</span>
													</div>
													<div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-zinc-400">
														<span>
															Average uptime{" "}
															{formatPercent(group.averageUptimePercent)}
														</span>
														<span>
															Average latency{" "}
															{group.averageLatencyMs !== null
																? `${Math.round(group.averageLatencyMs)} ms`
																: "Awaiting checks"}
														</span>
													</div>
												</div>
											</div>
											<Badge className={getStatusBadgeClassName(group.status)}>
												{group.status}
											</Badge>
										</summary>

										<div className="grid gap-0 border-t border-zinc-900 lg:grid-cols-2">
											{group.models.map((model, index) => (
												<div
													key={model.modelId}
													className={[
														"flex items-start justify-between gap-6 px-6 py-5",
														index % 2 === 1
															? "lg:border-l lg:border-zinc-900"
															: "",
														index >= 2 ? "border-t border-zinc-900" : "",
													]
														.filter(Boolean)
														.join(" ")}
												>
													<div className="min-w-0 space-y-2">
														<div className="text-lg font-semibold text-white">
															{model.name}
														</div>
														<div className="flex flex-wrap items-center gap-3 text-sm">
															<span
																className={[
																	"font-medium uppercase tracking-wide",
																	model.status === "operational"
																		? "text-emerald-400"
																		: model.status === "degraded"
																			? "text-amber-300"
																			: model.status === "down"
																				? "text-red-300"
																				: "text-zinc-400",
																].join(" ")}
															>
																{model.status}
															</span>
															<span className="text-zinc-600">|</span>
															<span className="text-zinc-400">
																{formatPercent(model.uptimePercent)} uptime
															</span>
															<span className="text-zinc-600">|</span>
															<span className="text-zinc-500">
																{model.checkCount} checks
															</span>
														</div>
														<div className="text-xs text-zinc-500">
															{model.modelId}
														</div>
														{model.lastErrorMessage ? (
															<div className="max-w-xl text-xs leading-5 text-red-200">
																{model.lastErrorMessage}
																{model.lastStatusCode !== null
																	? ` (${model.lastStatusCode})`
																	: ""}
															</div>
														) : null}
													</div>
													<div className="shrink-0 space-y-2 text-right">
														<div className="rounded-full border border-zinc-800 px-3 py-1 text-xs text-zinc-300">
															{model.lastResponseTimeMs !== null
																? `${model.lastResponseTimeMs} ms`
																: "Awaiting checks"}
														</div>
														<div className="text-sm text-zinc-300">
															{formatRelativeTime(model.lastCheckedAt)}
														</div>
														<div className="text-xs text-zinc-500">
															{formatDateTime(model.lastCheckedAt)}
														</div>
													</div>
												</div>
											))}
										</div>
									</details>
								))}
							</div>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}
