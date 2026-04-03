"use client";

import Lenis from "lenis";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import type { ReactNode } from "react";

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
	const pathname = usePathname();

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		if (
			pathname.startsWith("/dashboard") ||
			pathname.startsWith("/login") ||
			pathname.startsWith("/signup") ||
			pathname.startsWith("/onboarding") ||
			pathname.startsWith("/auth") ||
			pathname.startsWith("/docs")
		) {
			return;
		}

		const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
		if (mediaQuery.matches) {
			return;
		}

		const lenis = new Lenis({
			duration: 1.35,
			lerp: 0.085,
			wheelMultiplier: 0.92,
			touchMultiplier: 0.9,
			smoothWheel: true,
			syncTouch: false,
		});

		let frameId = 0;

		const raf = (time: number) => {
			lenis.raf(time);
			frameId = window.requestAnimationFrame(raf);
		};

		frameId = window.requestAnimationFrame(raf);

		return () => {
			window.cancelAnimationFrame(frameId);
			lenis.destroy();
		};
	}, [pathname]);

	return <>{children}</>;
}
