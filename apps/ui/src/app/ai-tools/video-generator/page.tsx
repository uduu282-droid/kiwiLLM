import {
	ArrowRight,
	BadgeCheck,
	Brain,
	Download,
	Film,
	ImageIcon,
	MonitorPlay,
	MoveRight,
	Play,
	ShieldCheck,
	Sparkles,
	Upload,
	WandSparkles,
	Zap,
} from "lucide-react";

import Footer from "@/components/landing/footer";
import { Navbar } from "@/components/landing/navbar";
import { AuthLink } from "@/components/shared/auth-link";
import { Button } from "@/lib/components/button";
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from "@/lib/components/tabs";

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "AI Video Generator",
	description:
		"Generate cinematic AI videos from prompts or images with a production-ready interface built on the KiwiLLM UI stack.",
};

const modes = [
	{
		id: "image-to-video",
		label: "Image to Video",
		description: "Animate a still frame into a camera-ready sequence.",
	},
	{
		id: "motion-control",
		label: "Motion Control",
		description: "Guide subject motion, timing, and camera movement precisely.",
	},
	{
		id: "text-to-video",
		label: "Text to Video",
		description: "Start from a pure prompt and let the model stage the scene.",
	},
] as const;

const showcase = [
	{
		title: "Cloud bottle editorial",
		prompt:
			"A woman rides a glass bottle through bright cloud layers while lemon slices swirl inside. The camera orbits slowly with warm lens flares and soft dress motion.",
		accent: "from-amber-200 via-orange-300 to-sky-300",
	},
	{
		title: "Antarctic tracking shot",
		prompt:
			"A lone penguin crosses a frozen field at dawn. Track low behind it, then lift into a quiet wide reveal with pale blue atmospheric haze.",
		accent: "from-sky-200 via-cyan-300 to-slate-300",
	},
	{
		title: "Fashion reveal zoom",
		prompt:
			"Extreme close-up on blinking eyes, then a fast pullback into a full architectural fashion shot as fabric settles dramatically.",
		accent: "from-rose-200 via-fuchsia-300 to-zinc-300",
	},
	{
		title: "Robot terrace hero",
		prompt:
			"A white humanoid robot scans a dense skyline from a rooftop terrace while the camera pushes in from a low-angle hero shot.",
		accent: "from-zinc-200 via-slate-300 to-cyan-300",
	},
	{
		title: "Cyber raven close-up",
		prompt:
			"A mechanical raven turns toward camera as its red eye powers up. Dust drifts through a deep crimson studio while reflections glide across metal.",
		accent: "from-red-300 via-rose-400 to-zinc-900",
	},
	{
		title: "Bridge speed pass",
		prompt:
			"A glossy sports car races across a coastal bridge at dusk. Swing from a high trailing angle into a low side-follow with natural road blur.",
		accent: "from-cyan-200 via-blue-300 to-indigo-400",
	},
] as const;

const steps = [
	{
		title: "Start with your idea",
		body: "Upload an image or write a short prompt depending on the generation mode you choose.",
		icon: Upload,
	},
	{
		title: "Generate your video",
		body: "Pick a model, refine the motion instructions, and launch the render in a few clicks.",
		icon: WandSparkles,
	},
	{
		title: "Download the output",
		body: "Review the generated clip, export a clean HD result, and share it immediately.",
		icon: Download,
	},
] as const;

const benefits = [
	{
		title: "Multiple image formats",
		body: "Accept JPG, JPEG, WEBP, and PNG inputs without conversion friction.",
		icon: ImageIcon,
	},
	{
		title: "Prompt-first editing",
		body: "Drive the scene with plain language instead of timeline editing.",
		icon: Brain,
	},
	{
		title: "Fast free trials",
		body: "Offer a light free tier so users can test the workflow before committing.",
		icon: Zap,
	},
	{
		title: "HD exports",
		body: "Keep generated outputs ready for social, product, and presentation use.",
		icon: Film,
	},
	{
		title: "No payment wall up front",
		body: "Lower friction with a browser-first experience and optional signup later.",
		icon: BadgeCheck,
	},
	{
		title: "Secure processing",
		body: "Position privacy and protected rendering as part of the core promise.",
		icon: ShieldCheck,
	},
	{
		title: "Top-end models",
		body: "Surface premium video models as a clear quality differentiator.",
		icon: Sparkles,
	},
	{
		title: "Works in the browser",
		body: "No native install, no edit suite, no local render pipeline required.",
		icon: MonitorPlay,
	},
] as const;

const highlights = [
	"Faster video creation for campaigns, demos, and social posts.",
	"Prompt-guided animation for static product shots and concept art.",
	"Style consistency across scenes with reusable direction patterns.",
	"Customizable mood, duration, framing, and camera behavior.",
	"Clean exports with a privacy-first workflow.",
	"Cross-device access for desktop and mobile creators.",
] as const;

const useCases = [
	"Create marketing and ad videos from product descriptions and motion cues.",
	"Generate explainer clips that visualize a concept or workflow instantly.",
	"Turn stories, poems, and concepts into short cinematic sequences.",
	"Produce mood visuals for music, launches, and presentation backdrops.",
] as const;

const promptTips = [
	"Describe the subject, setting, and action clearly.",
	"Add style cues like cinematic, documentary, retro, or glossy commercial.",
	"Specify camera directions such as push-in, orbit, pan, or drone shot.",
	"Include lighting and atmosphere to control color and mood.",
] as const;

const faqs = [
	{
		question: "How does the free version work?",
		answer:
			"A lightweight free tier is enough for trial runs and prompt iteration. Scale up once users are ready for production volume.",
	},
	{
		question: "Do users need to install anything?",
		answer:
			"No. The whole flow can live in a browser-based experience with uploads, prompt editing, and output delivery in one place.",
	},
	{
		question: "What input formats make sense?",
		answer:
			"JPG, JPEG, PNG, and WEBP cover the common image-to-video use cases without forcing pre-processing.",
	},
	{
		question: "What makes results better?",
		answer:
			"Clear prompts, explicit motion direction, and a defined visual style usually improve consistency more than simply adding more words.",
	},
] as const;

type ModeId = (typeof modes)[number]["id"];

function resolveMode(value?: string): ModeId {
	if (modes.some((mode) => mode.id === value)) {
		return value as ModeId;
	}

	return modes[0].id;
}

function resolvePrompt(value?: string) {
	const normalized = value?.trim();

	if (!normalized) {
		return "A surreal cinematic scene where a transparent bottle drifts through bright clouds. A seated subject balances on top while light ripples across the glass. Add gentle orbit camera movement, subtle parallax, and warm sun flares.";
	}

	return normalized;
}

function PreviewCard({
	title,
	prompt,
	accent,
}: {
	title: string;
	prompt: string;
	accent: string;
}) {
	return (
		<article className="group overflow-hidden rounded-[28px] border border-border/70 bg-white/80 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur dark:bg-zinc-950/75">
			<div className={`relative h-56 bg-linear-to-br ${accent}`}>
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.7),transparent_48%)]" />
				<div className="absolute inset-x-6 bottom-6 rounded-2xl border border-white/40 bg-white/25 p-4 backdrop-blur">
					<div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.24em] text-zinc-900/70">
						<Play className="size-3.5 fill-current" />
						Featured prompt
					</div>
					<p className="max-w-xs text-sm leading-6 text-zinc-900/80">{title}</p>
				</div>
			</div>
			<div className="space-y-4 p-6">
				<h3 className="font-display text-xl font-semibold text-foreground">
					{title}
				</h3>
				<p className="line-clamp-4 text-sm leading-6 text-muted-foreground">
					{prompt}
				</p>
				<div className="flex items-center justify-between">
					<span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
						Looped motion preview
					</span>
					<Button variant="outline" className="rounded-full">
						Recreate
					</Button>
				</div>
			</div>
		</article>
	);
}

function GeneratorPanel({
	initialMode,
	initialPrompt,
}: {
	initialMode: ModeId;
	initialPrompt: string;
}) {
	return (
		<div className="rounded-[32px] border border-border/70 bg-white/90 p-5 shadow-[0_40px_120px_-60px_rgba(15,23,42,0.55)] backdrop-blur dark:bg-zinc-950/80 md:p-7">
			<Tabs defaultValue={initialMode} className="gap-6">
				<TabsList className="h-auto w-full flex-wrap justify-start rounded-[22px] bg-zinc-100/85 p-1.5 dark:bg-zinc-900/80">
					{modes.map((mode) => (
						<TabsTrigger
							key={mode.id}
							value={mode.id}
							className="rounded-2xl px-4 py-3 text-sm"
						>
							{mode.label}
						</TabsTrigger>
					))}
				</TabsList>
				{modes.map((mode) => (
					<TabsContent key={mode.id} value={mode.id} className="space-y-5">
						<div>
							<p className="text-sm font-medium text-foreground">
								{mode.label}
							</p>
							<p className="mt-1 text-sm text-muted-foreground">
								{mode.description}
							</p>
						</div>
						<div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
							<div className="space-y-4">
								<div className="rounded-3xl border border-border/70 bg-zinc-50 p-4 dark:bg-zinc-900/70">
									<div className="mb-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
										Generation model
									</div>
									<div className="flex items-center justify-between rounded-2xl border border-border/70 bg-background px-4 py-3">
										<div>
											<p className="font-medium text-foreground">
												Veo 3.1 Fast
											</p>
											<p className="text-sm text-muted-foreground">
												Short cinematic clips, fast turnaround
											</p>
										</div>
										<MoveRight className="size-4 text-muted-foreground" />
									</div>
								</div>
								<div className="rounded-3xl border border-border/70 bg-zinc-50 p-4 dark:bg-zinc-900/70">
									<div className="mb-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
										Prompt
									</div>
									<div className="min-h-40 rounded-2xl border border-border/70 bg-background p-4 text-sm leading-6 text-muted-foreground">
										{initialPrompt}
									</div>
								</div>
								<div className="flex flex-wrap gap-3">
									<Button variant="outline" className="rounded-full">
										Clear
									</Button>
									<Button className="rounded-full bg-zinc-950 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100">
										Generate
									</Button>
								</div>
							</div>
							<div className="space-y-4">
								<div className="rounded-3xl border border-dashed border-border bg-linear-to-br from-zinc-100 via-white to-zinc-100 p-4 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-900">
									<div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground">
										<ImageIcon className="size-3.5" />
										Source frame
									</div>
									<div className="relative aspect-[4/5] rounded-[24px] bg-linear-to-b from-lime-100 via-amber-100 to-sky-200 shadow-inner">
										<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.95),transparent_50%)]" />
										<div className="absolute inset-x-5 bottom-5 rounded-2xl border border-white/40 bg-white/40 p-3 text-xs font-medium uppercase tracking-[0.22em] text-zinc-900/70 backdrop-blur">
											Upload reference image
										</div>
									</div>
								</div>
								<div className="grid gap-3 sm:grid-cols-2">
									<div className="rounded-3xl border border-border/70 bg-zinc-50 p-4 dark:bg-zinc-900/70">
										<p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
											Duration
										</p>
										<p className="mt-2 text-lg font-semibold text-foreground">
											8 sec
										</p>
									</div>
									<div className="rounded-3xl border border-border/70 bg-zinc-50 p-4 dark:bg-zinc-900/70">
										<p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
											Format
										</p>
										<p className="mt-2 text-lg font-semibold text-foreground">
											16:9 HD
										</p>
									</div>
								</div>
								<div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/8 p-4">
									<p className="text-sm font-medium text-foreground">
										Add prompt and image to continue
									</p>
									<p className="mt-1 text-sm text-muted-foreground">
										This mock panel reproduces the Pixelbin-style input flow
										while staying inside your current product shell.
									</p>
								</div>
							</div>
						</div>
					</TabsContent>
				))}
			</Tabs>
		</div>
	);
}

export default async function VideoGeneratorPage({
	searchParams,
}: {
	searchParams?: Promise<{
		mode?: string;
		prompt?: string;
	}>;
}) {
	const params = (await searchParams) ?? {};
	const initialMode = resolveMode(params.mode);
	const initialPrompt = resolvePrompt(params.prompt);

	return (
		<>
			<Navbar sticky={true} />
			<main className="overflow-hidden bg-[linear-gradient(180deg,rgba(252,251,247,1)_0%,rgba(246,246,244,1)_40%,rgba(255,255,255,1)_100%)] dark:bg-[linear-gradient(180deg,rgba(9,9,11,1)_0%,rgba(12,12,14,1)_45%,rgba(7,7,8,1)_100%)]">
				<section className="relative px-6 pb-18 pt-28 md:pt-36">
					<div className="absolute inset-0 -z-10 overflow-hidden">
						<div className="absolute left-1/2 top-0 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-orange-300/20 blur-3xl dark:bg-orange-500/10" />
						<div className="absolute right-0 top-24 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-500/10" />
						<div className="absolute left-0 top-56 h-72 w-72 rounded-full bg-lime-200/20 blur-3xl dark:bg-lime-500/10" />
					</div>
					<div className="mx-auto max-w-7xl">
						<div className="max-w-3xl">
							<div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-4 py-2 text-xs uppercase tracking-[0.28em] text-muted-foreground backdrop-blur">
								<Film className="size-3.5" />
								AI video generator
							</div>
							<h1 className="mt-6 max-w-4xl font-display text-4xl font-semibold tracking-tight text-foreground md:text-6xl">
								Generate studio-grade AI videos from prompts or images without
								filming or manual editing.
							</h1>
							<p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
								This page reverse-engineers the structure of Pixelbin&apos;s
								video generator landing flow: creator-first hero, prompt
								surface, showcase gallery, conversion sections, and SEO-heavy
								support content.
							</p>
							<div className="mt-8 flex flex-col gap-4 sm:flex-row">
								<Button
									asChild
									className="rounded-full bg-zinc-950 px-6 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
								>
									<AuthLink href="/signup">
										Try the generator
										<ArrowRight className="size-4" />
									</AuthLink>
								</Button>
								<Button asChild variant="outline" className="rounded-full px-6">
									<a href="#showcase">Browse prompts</a>
								</Button>
							</div>
							<div className="mt-8 flex flex-wrap gap-6 text-sm text-muted-foreground">
								<span>No install required</span>
								<span>Image + text workflows</span>
								<span>HD-ready exports</span>
							</div>
						</div>
						<div className="mt-12">
							<GeneratorPanel
								initialMode={initialMode}
								initialPrompt={initialPrompt}
							/>
						</div>
					</div>
				</section>

				<section id="showcase" className="px-6 py-18">
					<div className="mx-auto max-w-7xl">
						<div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
							<div className="max-w-2xl">
								<p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">
									Prompt showcase
								</p>
								<h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
									Reference scenes that make the product feel instantly usable
								</h2>
							</div>
							<p className="max-w-xl text-sm leading-7 text-muted-foreground">
								The source page leans hard on prompt examples. That is correct
								product strategy because it removes imagination cost and shows
								the range of the model before users type anything.
							</p>
						</div>
						<div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
							{showcase.map((item) => (
								<PreviewCard key={item.title} {...item} />
							))}
						</div>
					</div>
				</section>

				<section className="px-6 py-18">
					<div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
						<div className="rounded-[32px] border border-border/70 bg-zinc-950 p-8 text-white shadow-[0_40px_120px_-60px_rgba(0,0,0,0.8)]">
							<p className="text-xs uppercase tracking-[0.26em] text-white/60">
								Why the page converts
							</p>
							<h2 className="mt-4 font-display text-3xl font-semibold tracking-tight">
								The original layout sells before it explains.
							</h2>
							<p className="mt-4 max-w-xl text-sm leading-7 text-zinc-300">
								It opens with a usable generator, then proves quality through
								examples, then explains the workflow, benefits, and FAQs. That
								order is what you want for a high-intent AI tool landing page.
							</p>
							<div className="mt-8 grid gap-4 sm:grid-cols-3">
								<div className="rounded-3xl border border-white/10 bg-white/5 p-4">
									<p className="text-2xl font-semibold">3-step</p>
									<p className="mt-2 text-sm text-zinc-300">
										Input, generate, export
									</p>
								</div>
								<div className="rounded-3xl border border-white/10 bg-white/5 p-4">
									<p className="text-2xl font-semibold">Prompt-led</p>
									<p className="mt-2 text-sm text-zinc-300">
										Less UI complexity, faster start
									</p>
								</div>
								<div className="rounded-3xl border border-white/10 bg-white/5 p-4">
									<p className="text-2xl font-semibold">SEO-heavy</p>
									<p className="mt-2 text-sm text-zinc-300">
										Long-tail acquisition baked in
									</p>
								</div>
							</div>
						</div>
						<div className="grid gap-5 md:grid-cols-3">
							{steps.map((step, index) => {
								const Icon = step.icon;
								return (
									<div
										key={step.title}
										className="rounded-[28px] border border-border/70 bg-white/85 p-6 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.4)] dark:bg-zinc-950/80"
									>
										<div className="flex items-center justify-between">
											<div className="flex size-12 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-black">
												<Icon className="size-5" />
											</div>
											<span className="text-sm text-muted-foreground">
												0{index + 1}
											</span>
										</div>
										<h3 className="mt-6 text-xl font-semibold text-foreground">
											{step.title}
										</h3>
										<p className="mt-3 text-sm leading-7 text-muted-foreground">
											{step.body}
										</p>
									</div>
								);
							})}
						</div>
					</div>
				</section>

				<section className="px-6 py-18">
					<div className="mx-auto max-w-7xl">
						<div className="mb-10 max-w-3xl">
							<p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">
								Benefits
							</p>
							<h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
								Why this kind of AI video generator page resonates with users
							</h2>
						</div>
						<div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
							{benefits.map((benefit) => {
								const Icon = benefit.icon;
								return (
									<div
										key={benefit.title}
										className="rounded-[28px] border border-border/70 bg-white/80 p-6 dark:bg-zinc-950/75"
									>
										<div className="flex size-11 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-white">
											<Icon className="size-5" />
										</div>
										<h3 className="mt-5 text-lg font-semibold text-foreground">
											{benefit.title}
										</h3>
										<p className="mt-3 text-sm leading-7 text-muted-foreground">
											{benefit.body}
										</p>
									</div>
								);
							})}
						</div>
					</div>
				</section>

				<section className="px-6 py-18">
					<div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-3">
						<div className="rounded-[32px] border border-border/70 bg-linear-to-br from-orange-100 via-amber-50 to-white p-8 dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950">
							<p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">
								Key highlights
							</p>
							<h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-foreground">
								Turn creative ideas into video content fast
							</h2>
							<p className="mt-4 text-sm leading-7 text-muted-foreground">
								The lower part of the source page is doing classic acquisition
								work: feature reinforcement, use cases, prompt education, and
								FAQ expansion for search coverage.
							</p>
						</div>
						<div className="rounded-[32px] border border-border/70 bg-white/85 p-8 dark:bg-zinc-950/75 lg:col-span-2">
							<div className="grid gap-8 md:grid-cols-2">
								<div>
									<h3 className="text-lg font-semibold text-foreground">
										Benefits of using the tool
									</h3>
									<ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
										{highlights.map((item) => (
											<li key={item} className="flex gap-3">
												<BadgeCheck className="mt-1 size-4 shrink-0 text-emerald-500" />
												<span>{item}</span>
											</li>
										))}
									</ul>
								</div>
								<div>
									<h3 className="text-lg font-semibold text-foreground">
										Use cases
									</h3>
									<ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
										{useCases.map((item) => (
											<li key={item} className="flex gap-3">
												<Sparkles className="mt-1 size-4 shrink-0 text-orange-500" />
												<span>{item}</span>
											</li>
										))}
									</ul>
									<h3 className="mt-8 text-lg font-semibold text-foreground">
										Prompt tips
									</h3>
									<ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
										{promptTips.map((item) => (
											<li key={item} className="flex gap-3">
												<WandSparkles className="mt-1 size-4 shrink-0 text-sky-500" />
												<span>{item}</span>
											</li>
										))}
									</ul>
								</div>
							</div>
						</div>
					</div>
				</section>

				<section className="px-6 py-18">
					<div className="mx-auto max-w-7xl">
						<div className="mb-10 max-w-2xl">
							<p className="text-xs uppercase tracking-[0.26em] text-muted-foreground">
								FAQ
							</p>
							<h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
								Common questions you would keep on a page like this
							</h2>
						</div>
						<div className="grid gap-5 md:grid-cols-2">
							{faqs.map((faq) => (
								<div
									key={faq.question}
									className="rounded-[28px] border border-border/70 bg-white/85 p-6 dark:bg-zinc-950/75"
								>
									<h3 className="text-lg font-semibold text-foreground">
										{faq.question}
									</h3>
									<p className="mt-3 text-sm leading-7 text-muted-foreground">
										{faq.answer}
									</p>
								</div>
							))}
						</div>
					</div>
				</section>

				<section className="px-6 pb-20 pt-10">
					<div className="mx-auto max-w-7xl rounded-[36px] border border-border/70 bg-zinc-950 px-8 py-10 text-white shadow-[0_40px_120px_-60px_rgba(0,0,0,0.8)] md:px-12 md:py-14">
						<div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
							<div className="max-w-2xl">
								<p className="text-xs uppercase tracking-[0.26em] text-white/60">
									Next step
								</p>
								<h2 className="mt-3 font-display text-3xl font-semibold tracking-tight md:text-4xl">
									The page architecture is now in place. Backend generation is
									the next layer.
								</h2>
								<p className="mt-4 text-sm leading-7 text-zinc-300">
									If you want, I can take the next step and wire this route to a
									real video generation provider, add uploads, and persist
									render jobs instead of leaving it as a faithful front-end
									reverse.
								</p>
							</div>
							<Button
								asChild
								className="rounded-full bg-white px-6 text-black hover:bg-zinc-100"
							>
								<AuthLink href="/signup">
									Open dashboard
									<ArrowRight className="size-4" />
								</AuthLink>
							</Button>
						</div>
					</div>
				</section>
			</main>
			<Footer />
		</>
	);
}
