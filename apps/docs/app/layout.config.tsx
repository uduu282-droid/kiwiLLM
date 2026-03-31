import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";

/**
 * Shared layout configurations
 *
 * you can customise layouts individually from:
 * Home Layout: app/(home)/layout.tsx
 * Docs Layout: app/docs/layout.tsx
 */
export const baseOptions: BaseLayoutProps = {
	nav: {
		url: "/",
		title: (
			<>
				<img
					src="/brand/kiwillm-logo.png"
					alt="KiwiLLM"
					className="h-6 w-6 object-contain"
				/>
				KiwiLLM
			</>
		),
	},
	links: [
		{
			text: "Dashboard",
			url: "https://app.kiwillm.in/dashboard",
			active: "none",
		},
	],
};
