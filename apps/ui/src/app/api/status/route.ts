import { NextResponse } from "next/server";

import { getConfig } from "@/lib/config-server";

export async function GET() {
	try {
		const config = getConfig();
		const response = await fetch(`${config.apiBackendUrl}/public/status`, {
			cache: "no-store",
		});
		const text = await response.text();

		return new NextResponse(text, {
			status: response.status,
			headers: {
				"content-type":
					response.headers.get("content-type") ?? "application/json",
				"cache-control": "no-store",
			},
		});
	} catch (error) {
		return NextResponse.json(
			{
				error: true,
				message:
					error instanceof Error
						? error.message
						: "Failed to fetch status data",
			},
			{ status: 500 },
		);
	}
}
