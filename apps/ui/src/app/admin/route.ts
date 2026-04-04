import { NextResponse } from "next/server";

import { getConfig } from "@/lib/config-server";

export const dynamic = "force-dynamic";

export function GET() {
	const config = getConfig();
	return NextResponse.redirect(config.adminUrl);
}
