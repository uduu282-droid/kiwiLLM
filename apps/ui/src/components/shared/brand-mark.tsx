import Image from "next/image";

import { cn } from "@/lib/utils";

export function BrandMark({
	className,
	alt = "KiwiLLM logo",
}: {
	className?: string;
	alt?: string;
}) {
	return (
		<Image
			src="/brand/kiwillm-logo.png"
			alt={alt}
			width={128}
			height={128}
			className={cn("object-contain", className)}
			priority
		/>
	);
}
