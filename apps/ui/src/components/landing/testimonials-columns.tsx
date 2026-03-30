"use client";

import { motion } from "motion/react";
import React from "react";

interface Testimonial {
	text: string;
	image: string;
	name: string;
	role: string;
}

export const TestimonialsColumns = (props: {
	className?: string;
	testimonials: Testimonial[];
	duration?: number;
}) => {
	return (
		<div className={props.className}>
			<motion.div
				animate={{
					translateY: "-50%",
				}}
				transition={{
					duration: props.duration ?? 10,
					repeat: Number.POSITIVE_INFINITY,
					ease: "linear",
					repeatType: "loop",
				}}
				className="flex flex-col gap-6 pb-6"
			>
				{[0, 1].map((index) => (
					<React.Fragment key={index}>
						{props.testimonials.map(({ text, image, name, role }) => (
							<div
								key={`${index}-${name}`}
								className="relative max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(13,16,22,0.98)_0%,rgba(6,7,10,0.98)_100%)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
							>
								<div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
								<div className="relative">
									<p className="text-base leading-7 text-white/72">{text}</p>
									<div className="mt-8 flex items-center gap-3">
										<img
											width={44}
											height={44}
											src={image}
											alt={name}
											className="h-11 w-11 rounded-full border border-white/10 object-cover"
										/>
										<div className="flex flex-col">
											<div className="text-sm font-medium tracking-tight text-white">
												{name}
											</div>
											<div className="text-sm tracking-tight text-white/45">
												{role}
											</div>
										</div>
									</div>
								</div>
							</div>
						))}
					</React.Fragment>
				))}
			</motion.div>
		</div>
	);
};
