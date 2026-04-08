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

function formatPercent(value: number | null): string {
	if (value === null) {
		return "No data";
	}

	return `${value.toFixed(1)}%`;
}

function formatDateTime(value: string | null): string {
	if (!value) {
		return "Never";
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

	const diffDays = Math.round(diffHours / 24);
	return `${diffDays}d ago`;
}

function getStatusBadgeClassName(
	status: "operational" | "degraded" | "down" | "unknown",
): string {
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

export default async function StatusPage() {
	const status = await fetchPublicStatus();
	const models = [...status.models].sort((a, b) => {
		const order = {
			down: 0,
			degraded: 1,
			unknown: 2,
			operational: 3,
		} satisfies Record<"operational" | "degraded" | "down" | "unknown", number>;

		const diff = order[a.status] - order[b.status];
		if (diff !== 0) {
			return diff;
		}

		return a.name.localeCompare(b.name);
	});

	return (
		<div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
			<main>
				<HeroRSC navbarOnly />

				<section className="container mx-auto px-4 pt-40 pb-16">
					<div className="mx-auto max-w-6xl space-y-8">
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
									hours. Uptime is calculated over the last {status.windowDays}{" "}
									days of health checks so we can see which models are currently
									healthy and which need attention.
								</p>
							</div>
							<p className="text-sm text-zinc-500 dark:text-zinc-500">
								Last generated {formatDateTime(status.generatedAt)}
							</p>
						</div>

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

						<Card className="border-zinc-800 bg-zinc-950 text-white">
							<CardHeader className="space-y-2">
								<CardTitle className="text-xl">Chat model uptime</CardTitle>
								<p className="text-sm text-zinc-400">
									Only Kiwi-backed chat models are listed here. The latest probe
									sets current status, and the trailing success rate shows
									historical uptime.
								</p>
							</CardHeader>
							<CardContent>
								<div className="overflow-x-auto">
									<table className="min-w-full text-sm">
										<thead>
											<tr className="border-b border-zinc-800 text-left text-zinc-400">
												<th className="px-3 py-3 font-medium">Model</th>
												<th className="px-3 py-3 font-medium">Status</th>
												<th className="px-3 py-3 font-medium">Uptime</th>
												<th className="px-3 py-3 font-medium">Checks</th>
												<th className="px-3 py-3 font-medium">Latency</th>
												<th className="px-3 py-3 font-medium">Last checked</th>
												<th className="px-3 py-3 font-medium">Last error</th>
											</tr>
										</thead>
										<tbody>
											{models.map((model) => (
												<tr
													key={model.modelId}
													className="border-b border-zinc-900 align-top"
												>
													<td className="px-3 py-4">
														<div className="font-medium text-white">
															{model.name}
														</div>
														<div className="mt-1 text-xs text-zinc-500">
															{model.modelId} • {model.family}
														</div>
													</td>
													<td className="px-3 py-4">
														<Badge
															className={getStatusBadgeClassName(model.status)}
														>
															{model.status}
														</Badge>
													</td>
													<td className="px-3 py-4">
														<div className="font-medium text-white">
															{formatPercent(model.uptimePercent)}
														</div>
													</td>
													<td className="px-3 py-4 text-zinc-300">
														{model.checkCount}
													</td>
													<td className="px-3 py-4 text-zinc-300">
														{model.lastResponseTimeMs !== null
															? `${model.lastResponseTimeMs} ms`
															: "—"}
													</td>
													<td className="px-3 py-4">
														<div className="text-zinc-200">
															{formatRelativeTime(model.lastCheckedAt)}
														</div>
														<div className="mt-1 text-xs text-zinc-500">
															{formatDateTime(model.lastCheckedAt)}
														</div>
													</td>
													<td className="px-3 py-4 text-zinc-400">
														{model.lastErrorMessage ? (
															<div className="max-w-xs text-xs leading-5 text-red-200">
																{model.lastErrorMessage}
																{model.lastStatusCode !== null
																	? ` (${model.lastStatusCode})`
																	: ""}
															</div>
														) : (
															<span className="text-zinc-500">—</span>
														)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</CardContent>
						</Card>
					</div>
				</section>
			</main>
			<Footer />
		</div>
	);
}
