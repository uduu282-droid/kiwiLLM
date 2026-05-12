import { NextResponse } from "next/server";

import { fetchServerData } from "@/lib/server-api";

import type { User } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
	const userData = await fetchServerData<{ user: User } | undefined | null>(
		"GET",
		"/user/me",
	);

	if (!userData?.user) {
		return NextResponse.json({ ready: false }, { status: 401 });
	}

	const organizationsData = await fetchServerData("GET", "/orgs");

	if (!organizationsData) {
		return NextResponse.json({ ready: false }, { status: 503 });
	}

	return NextResponse.json({ ready: true });
}
