import { HTTPException } from "hono/http-exception";

type SupportedOrganizationPlan = "enterprise" | "free" | "pro";
type SupportedDevPlan = "lite" | "max" | "none" | "pro";
type ProjectMode = "api-keys" | "credits" | "hybrid";

export interface ContextLimitedOrganization {
	plan: SupportedOrganizationPlan;
	devPlan: SupportedDevPlan;
	credits: string | null;
}

export interface ContextLimitInput {
	organization: ContextLimitedOrganization;
	projectMode: ProjectMode;
	requiredContextSize: number;
}

export const FREE_CONTEXT_LIMIT = 16_000;
export const STARTER_CONTEXT_LIMIT = 32_000;
export const PRO_CONTEXT_LIMIT = 128_000;

export function getTierContextLimit(
	organization: ContextLimitedOrganization,
	projectMode: ProjectMode,
): number | null {
	const regularCredits = Number.parseFloat(organization.credits ?? "0");
	const hasPayAsYouGoCredits =
		regularCredits > 0 &&
		(projectMode === "credits" || projectMode === "hybrid");

	if (
		organization.plan === "enterprise" ||
		organization.devPlan === "max" ||
		hasPayAsYouGoCredits
	) {
		return null;
	}

	if (organization.plan === "pro" || organization.devPlan === "pro") {
		return PRO_CONTEXT_LIMIT;
	}

	if (organization.devPlan === "lite") {
		return STARTER_CONTEXT_LIMIT;
	}

	return FREE_CONTEXT_LIMIT;
}

function formatTokenCount(value: number): string {
	return value.toLocaleString("en-US");
}

function getTierLabel(
	organization: ContextLimitedOrganization,
	projectMode: ProjectMode,
): string {
	const regularCredits = Number.parseFloat(organization.credits ?? "0");
	const hasPayAsYouGoCredits =
		regularCredits > 0 &&
		(projectMode === "credits" || projectMode === "hybrid");

	if (
		organization.plan === "enterprise" ||
		organization.devPlan === "max" ||
		hasPayAsYouGoCredits
	) {
		return "Pay-as-you-go";
	}

	if (organization.plan === "pro" || organization.devPlan === "pro") {
		return "Pro";
	}

	if (organization.devPlan === "lite") {
		return "Starter";
	}

	return "Free";
}

export function assertContextWithinTierLimit({
	organization,
	projectMode,
	requiredContextSize,
}: ContextLimitInput): void {
	const contextLimit = getTierContextLimit(organization, projectMode);

	if (contextLimit === null || requiredContextSize <= contextLimit) {
		return;
	}

	throw new HTTPException(403, {
		message: `This request needs about ${formatTokenCount(requiredContextSize)} tokens of context, but your ${getTierLabel(organization, projectMode)} tier allows up to ${formatTokenCount(contextLimit)} tokens per request. Upgrade your plan or use a pay-as-you-go project for larger context windows.`,
	});
}
