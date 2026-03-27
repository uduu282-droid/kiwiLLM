import { OpenAPIHono } from "@hono/zod-openapi";
import { setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";

import { apiAuth } from "./config.js";
import {
	createSupabaseSession,
	getRequestAuthContext,
	getSupabaseRefreshCookieName,
	getSupabaseRefreshCookieOptions,
	getSupabaseSessionCookieName,
	getSupabaseSessionCookieOptions,
	isSupabaseAuthConfigured,
} from "./supabase.js";

import type { ServerTypes } from "@/vars.js";

// Create a Hono app for auth routes
export const authHandler = new OpenAPIHono<ServerTypes>();

authHandler.use("*", async (c, next) => {
	const session = await getRequestAuthContext(c.req.raw.headers);

	if (!session) {
		c.set("user", null);
		c.set("session", null);
		return await next();
	}

	c.set("user", session.user);
	c.set("session", session.session);
	return await next();
});

authHandler.post("/auth/supabase/session", async (c) => {
	if (!isSupabaseAuthConfigured()) {
		return c.json({ message: "Supabase auth is not configured" }, 500);
	}

	const rawBody = await c.req.text();

	if (!rawBody.trim()) {
		return c.json({ message: "Missing Supabase session payload" }, 400);
	}

	let parsedBody: unknown;

	try {
		parsedBody = JSON.parse(rawBody);
	} catch {
		return c.json({ message: "Invalid Supabase session payload" }, 400);
	}

	const body = z
		.object({
			accessToken: z.string().min(1),
			refreshToken: z.string().nullable().optional(),
		})
		.parse(parsedBody);

	const session = await createSupabaseSession(body);
	setCookie(
		c,
		getSupabaseSessionCookieName(),
		session.accessToken,
		getSupabaseSessionCookieOptions(),
	);

	if (session.refreshToken) {
		setCookie(
			c,
			getSupabaseRefreshCookieName(),
			session.refreshToken,
			getSupabaseRefreshCookieOptions(),
		);
	}

	return c.json({ ok: true });
});

authHandler.post("/auth/supabase/sign-out", async (c) => {
	deleteCookie(c, getSupabaseSessionCookieName(), {
		path: "/",
		...(process.env.SUPABASE_COOKIE_DOMAIN
			? {
					domain: process.env.SUPABASE_COOKIE_DOMAIN,
				}
			: {}),
	});
	deleteCookie(c, getSupabaseRefreshCookieName(), {
		path: "/",
		...(process.env.SUPABASE_COOKIE_DOMAIN
			? {
					domain: process.env.SUPABASE_COOKIE_DOMAIN,
				}
			: {}),
	});

	return c.json({ ok: true });
});

authHandler.on(["POST", "GET"], "/auth/*", (c) => {
	return apiAuth.handler(c.req.raw);
});
