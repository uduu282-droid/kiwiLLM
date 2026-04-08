"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { Button } from "@/lib/components/button";

export function StatusControls({ allUnknown }: { allUnknown: boolean }) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [statusMessage, setStatusMessage] = useState<string | null>(null);
	const hasAutoStarted = useRef(false);

	const runChecks = (reason: "auto" | "manual") => {
		if (isPending) {
			return;
		}

		startTransition(async () => {
			setStatusMessage(
				reason === "auto"
					? "Running the first health sweep across all hosted chat models..."
					: "Running checks across all hosted chat models...",
			);

			try {
				const response = await fetch("/api/status/run", {
					method: "POST",
				});

				if (!response.ok) {
					const payload = (await response.json().catch(() => null)) as {
						message?: string;
					} | null;
					setStatusMessage(
						payload?.message ?? "Status checks failed. Try again in a moment.",
					);
					return;
				}

				setStatusMessage("Health checks finished. Refreshing the board...");
				router.refresh();
			} catch (error) {
				setStatusMessage(
					error instanceof Error
						? error.message
						: "Status checks failed. Try again in a moment.",
				);
			}
		});
	};

	useEffect(() => {
		if (allUnknown && !hasAutoStarted.current) {
			hasAutoStarted.current = true;
			runChecks("auto");
		}
	}, [allUnknown]);

	return (
		<div className="flex flex-wrap items-center gap-3">
			<Button
				type="button"
				onClick={() => runChecks("manual")}
				disabled={isPending}
				className="bg-white text-black hover:bg-zinc-200"
			>
				{isPending ? "Running checks..." : "Run checks now"}
			</Button>
			<Button
				type="button"
				variant="outline"
				onClick={() => router.refresh()}
				disabled={isPending}
				className="border-zinc-700 bg-transparent text-white hover:bg-zinc-900"
			>
				Refresh
			</Button>
			{statusMessage ? (
				<p className="text-sm text-zinc-400">{statusMessage}</p>
			) : null}
		</div>
	);
}
