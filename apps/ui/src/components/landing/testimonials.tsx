import { TestimonialsColumns } from "./testimonials-columns";

const testimonials = [
	{
		text: "KiwiLLM replaced a pile of separate provider dashboards with one stable API surface. We shipped multi-model routing without reworking our stack.",
		image: "https://randomuser.me/api/portraits/women/12.jpg",
		name: "Briana Patton",
		role: "Platform Engineer",
	},
	{
		text: "The setup was genuinely fast. We generated a key, switched the base URL, and started comparing providers the same afternoon.",
		image: "https://randomuser.me/api/portraits/men/18.jpg",
		name: "Bilal Ahmed",
		role: "Product Engineer",
	},
	{
		text: "Cost tracking became much easier to explain internally. Finance, engineering, and product finally look at the same usage data.",
		image: "https://randomuser.me/api/portraits/women/22.jpg",
		name: "Saman Malik",
		role: "Operations Lead",
	},
	{
		text: "We use KiwiLLM to test models side by side before changing production traffic. That workflow alone saved us a lot of wasted spend.",
		image: "https://randomuser.me/api/portraits/men/27.jpg",
		name: "Omar Raza",
		role: "CTO",
	},
	{
		text: "The dashboard feels clean, but the real win is what happens behind it: one API key, cleaner logs, and fewer provider-specific surprises.",
		image: "https://randomuser.me/api/portraits/women/31.jpg",
		name: "Zainab Hussain",
		role: "Engineering Manager",
	},
	{
		text: "Our team needed speed, not another platform to babysit. KiwiLLM gave us a simpler path to launch and scale model features.",
		image: "https://randomuser.me/api/portraits/women/37.jpg",
		name: "Aliza Khan",
		role: "Founder",
	},
	{
		text: "Switching providers used to mean code changes, credential churn, and delay. Now it is a routing decision, not a project.",
		image: "https://randomuser.me/api/portraits/men/41.jpg",
		name: "Farhan Siddiqui",
		role: "Staff Engineer",
	},
	{
		text: "We brought model evaluation, usage visibility, and API key management into one place. That reduced a lot of team friction.",
		image: "https://randomuser.me/api/portraits/women/44.jpg",
		name: "Sana Sheikh",
		role: "AI Product Manager",
	},
	{
		text: "The product feels opinionated in the right places. It removes the repetitive integration work so we can focus on shipping features.",
		image: "https://randomuser.me/api/portraits/men/48.jpg",
		name: "Hassan Ali",
		role: "Lead Developer",
	},
];

const firstColumn = testimonials.slice(0, 3);
const secondColumn = testimonials.slice(3, 6);
const thirdColumn = testimonials.slice(6, 9);

export const Testimonials = () => {
	return (
		<section className="relative overflow-hidden py-24 md:py-32">
			<div className="relative mx-auto max-w-[1440px] px-6 lg:px-10">
				<div className="mx-auto flex max-w-[640px] flex-col items-center justify-center text-center">
					<div className="rounded-full border border-white/10 bg-white/5 px-4 py-1 text-sm text-white/80 backdrop-blur-md">
						Testimonials
					</div>
					<h2 className="mt-6 text-balance font-display text-4xl font-semibold tracking-tight text-white md:text-5xl">
						Teams choose KiwiLLM to move faster
					</h2>
					<p className="mt-5 text-pretty text-base leading-7 text-white/60 md:text-lg">
						From early product teams to scaling platforms, developers use
						KiwiLLM to unify providers, control spend, and ship model features
						with less friction.
					</p>
				</div>

				<div className="mt-14 flex justify-center gap-6 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)] max-h-[760px] overflow-hidden">
					<TestimonialsColumns testimonials={firstColumn} duration={16} />
					<TestimonialsColumns
						testimonials={secondColumn}
						className="hidden md:block"
						duration={19}
					/>
					<TestimonialsColumns
						testimonials={thirdColumn}
						className="hidden lg:block"
						duration={17}
					/>
				</div>
			</div>
		</section>
	);
};
