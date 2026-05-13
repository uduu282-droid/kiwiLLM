import { expect, test } from "vitest";

import { allowedOrigins } from "./auth/config.js";
import { app } from "./index.js";

test("/", async () => {
	const res = await app.request("/");
	expect([200, 503]).toContain(res.status);
	const data = await res.json();
	expect(data).toHaveProperty("message");
	expect(data).toHaveProperty("health");
	expect(data.health).toHaveProperty("status");
	expect(data.health).toHaveProperty("database");
});

test("/user/me", async () => {
	const res = await app.request("/user/me");
	expect(res.status).toBe(401);
	const text = await res.text();
	expect(text).toMatch(/Unauthorized/);
});

test("OPTIONS /auth/supabase/session includes frontend auth headers in CORS", async () => {
	const origin = allowedOrigins[0] ?? "http://localhost:3002";
	const res = await app.request("/auth/supabase/session", {
		method: "OPTIONS",
		headers: {
			Origin: origin,
			"Access-Control-Request-Method": "POST",
			"Access-Control-Request-Headers":
				"content-type,baggage,sentry-trace,x-client-info,apikey",
		},
	});

	expect(res.status).toBe(204);
	expect(res.headers.get("access-control-allow-origin")).toBe(origin);
	expect(res.headers.get("access-control-allow-origin")).not.toBe("*");

	const allowHeaders = res.headers.get("access-control-allow-headers") ?? "";
	expect(allowHeaders).toContain("Content-Type");
	expect(allowHeaders).toContain("baggage");
	expect(allowHeaders).toContain("sentry-trace");
	expect(allowHeaders).toContain("x-client-info");
	expect(allowHeaders).toContain("apikey");
});

test("OPTIONS /auth/supabase/session does not allow unknown credentialed origins", async () => {
	const res = await app.request("/auth/supabase/session", {
		method: "OPTIONS",
		headers: {
			Origin: "https://malicious.example",
			"Access-Control-Request-Method": "POST",
			"Access-Control-Request-Headers": "content-type",
		},
	});

	expect(res.status).toBe(204);
	expect(res.headers.get("access-control-allow-origin")).toBeNull();
});
