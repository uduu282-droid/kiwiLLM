import { cn } from "@/lib/utils";

import type { ComponentPropsWithoutRef } from "react";

export type LogoProps = ComponentPropsWithoutRef<"img">;

export const Logo = ({ className, alt, ...props }: LogoProps) => (
	<img
		src="/brand/kiwillm-logo.png"
		alt={alt ?? "KiwiLLM"}
		className={cn("object-contain", className)}
		{...props}
	/>
);
