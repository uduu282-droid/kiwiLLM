"use client";

import { useMotionValue, useSpring } from "motion/react";
import { useCallback, useEffect, useMemo, useRef } from "react";

interface CountUpProps {
	to: number;
	from?: number;
	direction?: "up" | "down";
	delay?: number;
	duration?: number;
	className?: string;
	startCounting?: boolean;
	separator?: string;
	prefix?: string;
	suffix?: string;
}

function getDecimalPlaces(num: number) {
	const str = num.toString();

	if (!str.includes(".")) {
		return 0;
	}

	const decimals = str.split(".")[1];

	if (parseInt(decimals, 10) !== 0) {
		return decimals.length;
	}

	return 0;
}

export default function CountUp({
	to,
	from = 0,
	direction = "up",
	delay = 0,
	duration = 0.9,
	className = "",
	startCounting = true,
	separator = ",",
	prefix = "",
	suffix = "",
}: CountUpProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const previousToRef = useRef(direction === "down" ? to : from);
	const motionValue = useMotionValue(previousToRef.current);

	const damping = 20 + 40 * (1 / Math.max(duration, 0.01));
	const stiffness = 100 * (1 / Math.max(duration, 0.01));

	const springValue = useSpring(motionValue, {
		damping,
		stiffness,
	});

	const maxDecimals = useMemo(
		() => Math.max(getDecimalPlaces(from), getDecimalPlaces(to)),
		[from, to],
	);

	const formatValue = useCallback(
		(latest: number) => {
			const rounded =
				direction === "down" ? Math.max(latest, to) : Math.min(latest, to);

			const formattedNumber = Intl.NumberFormat("en-US", {
				useGrouping: !!separator,
				minimumFractionDigits: maxDecimals,
				maximumFractionDigits: maxDecimals,
			}).format(rounded);

			const numberText = separator
				? formattedNumber.replace(/,/g, separator)
				: formattedNumber;

			return `${prefix}${numberText}${suffix}`;
		},
		[direction, maxDecimals, prefix, separator, suffix, to],
	);

	useEffect(() => {
		if (ref.current) {
			ref.current.textContent = formatValue(previousToRef.current);
		}
	}, [formatValue]);

	useEffect(() => {
		if (!startCounting) {
			if (ref.current) {
				ref.current.textContent = formatValue(to);
			}
			previousToRef.current = to;
			motionValue.set(to);
			return;
		}

		const startValue = previousToRef.current;
		motionValue.set(startValue);

		const timeoutId = window.setTimeout(() => {
			motionValue.set(to);
		}, delay * 1000);

		previousToRef.current = to;

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [delay, formatValue, motionValue, startCounting, to]);

	useEffect(() => {
		const unsubscribe = springValue.on("change", (latest) => {
			if (ref.current) {
				ref.current.textContent = formatValue(latest);
			}
		});

		return () => unsubscribe();
	}, [formatValue, springValue]);

	return <span className={className} ref={ref} />;
}
