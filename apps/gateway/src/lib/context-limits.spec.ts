import { describe, expect, it } from "vitest";

import {
	assertContextWithinTierLimit,
	FREE_CONTEXT_LIMIT,
	getTierContextLimit,
	PRO_CONTEXT_LIMIT,
	STARTER_CONTEXT_LIMIT,
} from "./context-limits.js";

describe("context limits", () => {
	it("uses the free cap for free organizations without a dev plan", () => {
		expect(
			getTierContextLimit(
				{
					plan: "free",
					devPlan: "none",
					credits: "0",
				},
				"credits",
			),
		).toBe(FREE_CONTEXT_LIMIT);
	});

	it("uses the starter cap for lite dev plans", () => {
		expect(
			getTierContextLimit(
				{
					plan: "free",
					devPlan: "lite",
					credits: "0",
				},
				"credits",
			),
		).toBe(STARTER_CONTEXT_LIMIT);
	});

	it("uses the pro cap for pro organizations", () => {
		expect(
			getTierContextLimit(
				{
					plan: "pro",
					devPlan: "none",
					credits: "0",
				},
				"api-keys",
			),
		).toBe(PRO_CONTEXT_LIMIT);
	});

	it("removes the cap for pay-as-you-go credit-backed projects", () => {
		expect(
			getTierContextLimit(
				{
					plan: "free",
					devPlan: "none",
					credits: "12",
				},
				"credits",
			),
		).toBeNull();
	});

	it("throws when the request exceeds the current tier cap", () => {
		expect(() =>
			assertContextWithinTierLimit({
				organization: {
					plan: "free",
					devPlan: "none",
					credits: "0",
				},
				projectMode: "credits",
				requiredContextSize: FREE_CONTEXT_LIMIT + 1,
			}),
		).toThrowError(/Free tier allows up to 16,000 tokens/i);
	});

	it("allows requests that fit the current tier cap", () => {
		expect(() =>
			assertContextWithinTierLimit({
				organization: {
					plan: "free",
					devPlan: "lite",
					credits: "0",
				},
				projectMode: "credits",
				requiredContextSize: STARTER_CONTEXT_LIMIT,
			}),
		).not.toThrow();
	});
});
