import { BookOpen, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/lib/components/button";

function formatNumber(num: number | null): string {
	if (num === null) {
		return "20K+";
	}
	if (num >= 1000) {
		const thousands = Math.floor(num / 1000);
		const hundreds = Math.floor((num % 1000) / 100);
		if (hundreds === 0) {
			return `${thousands}K`;
		}
		return `${thousands}.${hundreds}K`;
	}
	return num.toLocaleString();
}

export function OpenSourceEnterprise() {
	const formattedStars = formatNumber(20000);
	const contributorCount = 60;
	return (
		<section className="py-20 sm:py-28 bg-muted/30">
			<div className="container mx-auto px-4 sm:px-6 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
						{/* Left side - Content */}
						<div className="space-y-6">
							<div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-sm">
								<ShieldCheck className="h-4 w-4" />
								<span className="font-medium">Platform trust</span>
							</div>

							<div className="space-y-4">
								<h2 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
									Built for trust, security, and scale
								</h2>
								<p className="text-lg text-muted-foreground leading-relaxed max-w-xl">
									KiwiLLM gives teams a reliable hosted platform with clear
									documentation, enterprise controls, and operational
									transparency.
								</p>
							</div>

							<div className="flex flex-wrap gap-3">
								<Button asChild size="lg">
									<a href="/docs">
										<BookOpen className="mr-2 h-4 w-4" />
										Read the docs
									</a>
								</Button>
							</div>
						</div>

						{/* Right side - Stats */}
						<div className="space-y-12">
							{/* Stars */}
							<div className="flex flex-col items-center lg:items-start space-y-4">
								<div className="flex gap-2">
									{[...Array(3)].map((_, i) => (
										<Star
											key={i}
											className="h-12 w-12 fill-yellow-400 text-yellow-400"
										/>
									))}
								</div>
								<div className="text-center lg:text-left">
									<div className="text-2xl font-bold">
										{formattedStars} Stars
									</div>
									<p className="text-sm text-muted-foreground">
										Trusted by the community
									</p>
								</div>
							</div>

							{/* Contributors */}
							<div className="flex flex-col items-center lg:items-start space-y-4">
								<div className="flex -space-x-3">
									{[...Array(8)].map((_, i) => (
										<div
											key={i}
											className="h-12 w-12 rounded-full border-2 border-background bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold"
										>
											{String.fromCharCode(65 + i)}
										</div>
									))}
								</div>
								<div className="text-center lg:text-left">
									<div className="text-2xl font-bold">
										{contributorCount}+ Contributors
									</div>
									<p className="text-sm text-muted-foreground">
										Building the future together
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
