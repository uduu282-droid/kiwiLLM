"use client";

import {
	Eye,
	EyeOff,
	ImageIcon,
	KeyRound,
	Sparkles,
	Search,
	Settings2,
	Zap,
} from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";

import type { ApiModel, ApiProvider } from "@/lib/fetch-models";

interface PlaygroundConfigSidebarProps {
	models: ApiModel[];
	providers: ApiProvider[];
	selectedModelValue: string;
	apiKey: string;
	setApiKey: (value: string) => void;
	showApiKey: boolean;
	setShowApiKey: (value: boolean) => void;
	persistApiKey: boolean;
	setPersistApiKey: (value: boolean) => void;
	canUsePlayground: boolean;
	supportsReasoning: boolean;
	reasoningEffort: "" | "minimal" | "low" | "medium" | "high";
	setReasoningEffort: (
		value: "" | "minimal" | "low" | "medium" | "high",
	) => void;
	supportsWebSearch: boolean;
	webSearchEnabled: boolean;
	setWebSearchEnabled: (value: boolean) => void;
	supportsImageGen: boolean;
	imageAspectRatio:
		| "auto"
		| "1:1"
		| "9:16"
		| "16:9"
		| "3:4"
		| "4:3"
		| "3:2"
		| "2:3"
		| "5:4"
		| "4:5"
		| "21:9"
		| "1:4"
		| "4:1"
		| "1:8"
		| "8:1";
	setImageAspectRatio: (
		value:
			| "auto"
			| "1:1"
			| "9:16"
			| "16:9"
			| "3:4"
			| "4:3"
			| "3:2"
			| "2:3"
			| "5:4"
			| "4:5"
			| "21:9"
			| "1:4"
			| "4:1"
			| "1:8"
			| "8:1",
	) => void;
	imageSize: string;
	setImageSize: (value: string) => void;
	alibabaImageSize: string;
	setAlibabaImageSize: (value: string) => void;
	imageCount: 1 | 2 | 3 | 4;
	setImageCount: (value: 1 | 2 | 3 | 4) => void;
}

const aspectRatios = [
	"auto",
	"1:1",
	"9:16",
	"16:9",
	"3:4",
	"4:3",
	"3:2",
	"2:3",
	"5:4",
	"4:5",
	"21:9",
	"1:4",
	"4:1",
	"1:8",
	"8:1",
] as const;

const imageCounts = [1, 2, 3, 4] as const;

const pixelSizes = [
	"1024x1024",
	"720x1280",
	"1280x720",
	"1024x1536",
	"1536x1024",
	"2048x1024",
	"1024x2048",
] as const;

function formatPrice(value: string | null) {
	if (!value) {
		return "N/A";
	}

	const parsed = Number(value);
	if (Number.isNaN(parsed)) {
		return value;
	}

	if (parsed === 0) {
		return "Free";
	}

	return `$${parsed.toExponential(2)}`;
}

export function PlaygroundConfigSidebar({
	models,
	providers,
	selectedModelValue,
	apiKey,
	setApiKey,
	showApiKey,
	setShowApiKey,
	persistApiKey,
	setPersistApiKey,
	canUsePlayground,
	supportsReasoning,
	reasoningEffort,
	setReasoningEffort,
	supportsWebSearch,
	webSearchEnabled,
	setWebSearchEnabled,
	supportsImageGen,
	imageAspectRatio,
	setImageAspectRatio,
	imageSize,
	setImageSize,
	alibabaImageSize,
	setAlibabaImageSize,
	imageCount,
	setImageCount,
}: PlaygroundConfigSidebarProps) {
	const [selectedProviderId, selectedModelId] = selectedModelValue.includes("/")
		? (selectedModelValue.split("/") as [string, string])
		: ["", selectedModelValue];
	const selectedModel =
		models.find((model) => model.id === selectedModelId) ?? null;
	const selectedMapping =
		selectedModel?.mappings.find(
			(mapping) =>
				!selectedProviderId || mapping.providerId === selectedProviderId,
		) ??
		selectedModel?.mappings[0] ??
		null;
	const selectedProvider =
		providers.find((provider) => provider.id === selectedMapping?.providerId) ??
		null;

	const usesPixelDimensions =
		selectedModelValue.toLowerCase().includes("alibaba") ||
		selectedModelValue.toLowerCase().includes("qwen-image") ||
		selectedModelValue.toLowerCase().includes("zai") ||
		selectedModelValue.toLowerCase().includes("cogview");

	const isSeedream =
		selectedModelValue.toLowerCase().includes("seedream") ||
		selectedModelValue.toLowerCase().includes("bytedance/seedream");
	const isGemini31FlashImage = selectedModelValue
		.toLowerCase()
		.includes("gemini-3.1-flash-image");

	const availableSizes = isSeedream
		? (["2K", "4K"] as const)
		: isGemini31FlashImage
			? (["0.5K", "1K", "2K", "4K"] as const)
			: (["1K", "2K", "4K"] as const);

	const capabilities = [
		selectedMapping?.streaming ? "Streaming" : null,
		selectedMapping?.vision ? "Vision" : null,
		selectedMapping?.reasoning ? "Reasoning" : null,
		selectedMapping?.tools ? "Tools" : null,
		selectedMapping?.jsonOutput ? "JSON" : null,
		selectedMapping?.webSearch ? "Web search" : null,
	].filter(Boolean) as string[];

	return (
		<aside className="hidden w-[360px] shrink-0 border-l bg-muted/20 xl:flex xl:flex-col">
			<div className="border-b px-5 py-4">
				<div className="flex items-center gap-2">
					<Settings2 className="h-4 w-4 text-muted-foreground" />
					<h2 className="text-sm font-semibold">Playground Config</h2>
				</div>
				<p className="mt-1 text-xs text-muted-foreground">
					Provide a KiwiLLM API key to unlock chat and tune advanced request
					settings.
				</p>
			</div>
			<div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
				<section className="space-y-3">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-sm font-medium">API Access</h3>
							<p className="text-xs text-muted-foreground">
								The Playground only sends requests when a key is present.
							</p>
						</div>
						<Badge variant={canUsePlayground ? "default" : "outline"}>
							{canUsePlayground ? "Ready" : "Locked"}
						</Badge>
					</div>
					<div className="space-y-2">
						<Label htmlFor="playground-api-key">KiwiLLM API key</Label>
						<div className="flex gap-2">
							<Input
								id="playground-api-key"
								type={showApiKey ? "text" : "password"}
								value={apiKey}
								onChange={(event) => setApiKey(event.target.value)}
								placeholder="kiwillm_..."
								autoComplete="off"
								spellCheck={false}
							/>
							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={() => setShowApiKey(!showApiKey)}
								aria-label={showApiKey ? "Hide API key" : "Show API key"}
							>
								{showApiKey ? (
									<EyeOff className="h-4 w-4" />
								) : (
									<Eye className="h-4 w-4" />
								)}
							</Button>
						</div>
					</div>
					<div className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
						<div className="space-y-1">
							<div className="flex items-center gap-2 text-sm font-medium">
								<KeyRound className="h-4 w-4 text-muted-foreground" />
								Remember in this browser
							</div>
							<p className="text-xs text-muted-foreground">
								Keep the key locally so repeat testing is faster.
							</p>
						</div>
						<Switch
							checked={persistApiKey}
							onCheckedChange={setPersistApiKey}
							aria-label="Remember API key in this browser"
						/>
					</div>
					{!canUsePlayground ? (
						<Alert>
							<KeyRound className="h-4 w-4" />
							<AlertTitle>API key required</AlertTitle>
							<AlertDescription>
								Paste a KiwiLLM API key here before sending prompts or testing
								models.
							</AlertDescription>
						</Alert>
					) : null}
				</section>

				<Separator />

				<section className="space-y-3">
					<div>
						<h3 className="text-sm font-medium">Selected Model</h3>
						<p className="text-xs text-muted-foreground">
							Live details for the current Playground target.
						</p>
					</div>
					<div className="rounded-xl border bg-background p-4">
						<div className="flex items-start justify-between gap-3">
							<div>
								<div className="text-sm font-semibold">
									{selectedModel?.name ??
										(selectedModelId || "No model selected")}
								</div>
								<div className="mt-1 text-xs text-muted-foreground">
									{selectedProvider?.name ?? "Provider auto-selection"}
								</div>
							</div>
							<Badge variant="secondary">
								{selectedModel?.family ?? "Kiwi catalog"}
							</Badge>
						</div>
						<p className="mt-3 text-xs leading-5 text-muted-foreground">
							{selectedModel?.description ??
								"Choose a Kiwi-backed model to inspect pricing, capabilities, and request settings."}
						</p>
						<div className="mt-4 grid grid-cols-2 gap-3 text-xs">
							<div className="rounded-lg border p-3">
								<div className="text-muted-foreground">Context</div>
								<div className="mt-1 font-medium">
									{selectedMapping?.contextSize?.toLocaleString() ?? "N/A"}
								</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="text-muted-foreground">Max output</div>
								<div className="mt-1 font-medium">
									{selectedMapping?.maxOutput?.toLocaleString() ?? "N/A"}
								</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="text-muted-foreground">Input price</div>
								<div className="mt-1 font-medium">
									{formatPrice(selectedMapping?.inputPrice ?? null)}
								</div>
							</div>
							<div className="rounded-lg border p-3">
								<div className="text-muted-foreground">Output price</div>
								<div className="mt-1 font-medium">
									{formatPrice(selectedMapping?.outputPrice ?? null)}
								</div>
							</div>
						</div>
						<div className="mt-4 flex flex-wrap gap-2">
							{capabilities.length > 0 ? (
								capabilities.map((capability) => (
									<Badge key={capability} variant="outline">
										{capability}
									</Badge>
								))
							) : (
								<Badge variant="outline">Capabilities unavailable</Badge>
							)}
						</div>
					</div>
				</section>

				<Separator />

				<section className="space-y-3">
					<div>
						<h3 className="text-sm font-medium">Advanced Request Settings</h3>
						<p className="text-xs text-muted-foreground">
							Fine-tune how the current request is sent through KiwiLLM.
						</p>
					</div>
					<div className="space-y-3 rounded-xl border bg-background p-4">
						<div className="flex items-center justify-between rounded-lg border px-3 py-2">
							<div className="space-y-1">
								<div className="flex items-center gap-2 text-sm font-medium">
									<Search className="h-4 w-4 text-muted-foreground" />
									Web search
								</div>
								<p className="text-xs text-muted-foreground">
									Enable only when the selected model supports live web search.
								</p>
							</div>
							<Switch
								checked={supportsWebSearch && webSearchEnabled}
								onCheckedChange={setWebSearchEnabled}
								disabled={!supportsWebSearch}
								aria-label="Toggle web search"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="playground-reasoning">Reasoning effort</Label>
							<Select
								value={reasoningEffort || "off"}
								onValueChange={(value) =>
									setReasoningEffort(
										value === "off"
											? ""
											: (value as "minimal" | "low" | "medium" | "high"),
									)
								}
								disabled={!supportsReasoning}
							>
								<SelectTrigger id="playground-reasoning">
									<SelectValue placeholder="Auto" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="off">Auto</SelectItem>
									{selectedModelValue.includes("gpt-5") ? (
										<SelectItem value="minimal">Minimal</SelectItem>
									) : null}
									<SelectItem value="low">Low</SelectItem>
									<SelectItem value="medium">Medium</SelectItem>
									<SelectItem value="high">High</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{supportsImageGen ? (
							<>
								<div className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
									<div className="flex items-center gap-2 font-medium text-foreground">
										<ImageIcon className="h-4 w-4" />
										Image generation settings
									</div>
									<p className="mt-1">
										These controls only apply when the selected model is used in
										image generation mode.
									</p>
								</div>
								{usesPixelDimensions ? (
									<div className="space-y-2">
										<Label htmlFor="playground-image-size-px">Image size</Label>
										<Select
											value={alibabaImageSize}
											onValueChange={setAlibabaImageSize}
										>
											<SelectTrigger id="playground-image-size-px">
												<SelectValue placeholder="Image size" />
											</SelectTrigger>
											<SelectContent>
												{pixelSizes.map((size) => (
													<SelectItem key={size} value={size}>
														{size}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								) : (
									<>
										<div className="space-y-2">
											<Label htmlFor="playground-aspect-ratio">
												Aspect ratio
											</Label>
											<Select
												value={imageAspectRatio}
												onValueChange={(value) =>
													setImageAspectRatio(
														value as (typeof aspectRatios)[number],
													)
												}
											>
												<SelectTrigger id="playground-aspect-ratio">
													<SelectValue placeholder="Aspect ratio" />
												</SelectTrigger>
												<SelectContent>
													{aspectRatios.map((ratio) => (
														<SelectItem key={ratio} value={ratio}>
															{ratio === "auto" ? "Auto" : ratio}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="playground-image-size">Image size</Label>
											<Select value={imageSize} onValueChange={setImageSize}>
												<SelectTrigger id="playground-image-size">
													<SelectValue placeholder="Image size" />
												</SelectTrigger>
												<SelectContent>
													{availableSizes.map((size) => (
														<SelectItem key={size} value={size}>
															{size}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
									</>
								)}
								<div className="space-y-2">
									<Label htmlFor="playground-image-count">Image count</Label>
									<Select
										value={String(imageCount)}
										onValueChange={(value) =>
											setImageCount(Number(value) as 1 | 2 | 3 | 4)
										}
									>
										<SelectTrigger id="playground-image-count">
											<SelectValue placeholder="Image count" />
										</SelectTrigger>
										<SelectContent>
											{imageCounts.map((count) => (
												<SelectItem key={count} value={String(count)}>
													{count} image{count > 1 ? "s" : ""}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							</>
						) : (
							<div className="rounded-lg border border-dashed px-3 py-3 text-xs text-muted-foreground">
								Image controls will appear automatically when you pick an
								image-generation model.
							</div>
						)}
					</div>
				</section>

				<Separator />

				<section className="space-y-3">
					<div>
						<h3 className="text-sm font-medium">Request Notes</h3>
						<p className="text-xs text-muted-foreground">
							Quick reminders about how this Playground behaves now.
						</p>
					</div>
					<div className="space-y-2 text-xs text-muted-foreground">
						<div className="rounded-lg border bg-background px-3 py-2">
							<div className="flex items-center gap-2 text-sm font-medium text-foreground">
								<Sparkles className="h-4 w-4" />
								Manual API key mode
							</div>
							<p className="mt-1">
								Requests use the key entered here. Hidden project-key fallback
								is no longer required for testing.
							</p>
						</div>
						<div className="rounded-lg border bg-background px-3 py-2">
							<div className="flex items-center gap-2 text-sm font-medium text-foreground">
								<Zap className="h-4 w-4" />
								Provider selection
							</div>
							<p className="mt-1">
								Provider-specific selections disable fallback automatically,
								which makes direct model/provider testing more reliable.
							</p>
						</div>
					</div>
				</section>
			</div>
		</aside>
	);
}
