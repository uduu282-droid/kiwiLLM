import { HTTPException } from "hono/http-exception";

import { calculateCosts } from "@/lib/costs.js";

import {
	freeTierModelIds,
	type ModelDefinition,
	payAsYouGoOnlyTierModelIds,
	proTierModelIds,
	type Provider,
	starterTierModelIds,
} from "@llmgateway/models";

type SupportedOrganizationPlan = "enterprise" | "free" | "pro";

export interface CreditBearingOrganization {
	id: string;
	plan: SupportedOrganizationPlan;
	credits: string | null;
	devPlan: string;
	devPlanCreditsLimit: string | null;
	devPlanCreditsUsed: string | null;
}

export interface AvailableCreditsBreakdown {
	regularCredits: number;
	devPlanCreditsRemaining: number;
	totalAvailableCredits: number;
}

export type CatalogTier = "free" | "payg" | "pro" | "starter" | "unassigned";

export interface HostedCreditEstimateInput {
	organization: CreditBearingOrganization;
	model: ModelDefinition;
	provider: Provider;
	providerIsZeroCost: boolean;
	promptTokens: number | null;
	completionTokens: number | null;
	reasoningTokens?: number | null;
	inputImageCount?: number;
	imageSize?: string;
	webSearchCount?: number | null;
	fullOutput?: {
		prompt?: string;
		completion?: string;
	};
}

export function getAvailableCredits(
	organization: CreditBearingOrganization,
): AvailableCreditsBreakdown {
	const regularCredits = parseFloat(organization.credits ?? "0");
	const devPlanCreditsRemaining =
		organization.devPlan !== "none"
			? parseFloat(organization.devPlanCreditsLimit ?? "0") -
				parseFloat(organization.devPlanCreditsUsed ?? "0")
			: 0;

	return {
		regularCredits,
		devPlanCreditsRemaining,
		totalAvailableCredits: regularCredits + devPlanCreditsRemaining,
	};
}

export function getCatalogTier(modelId: string): CatalogTier {
	if (payAsYouGoOnlyTierModelIds.has(modelId)) {
		return "payg";
	}
	if (proTierModelIds.has(modelId)) {
		return "pro";
	}
	if (starterTierModelIds.has(modelId)) {
		return "starter";
	}
	if (freeTierModelIds.has(modelId)) {
		return "free";
	}
	return "unassigned";
}

function formatCredits(value: number): string {
	if (value >= 100) {
		return value.toFixed(2);
	}
	if (value >= 1) {
		return value.toFixed(3);
	}
	return value.toFixed(4);
}

function getTierDisplayName(tier: CatalogTier): string {
	switch (tier) {
		case "free":
			return "Free";
		case "starter":
			return "Starter";
		case "pro":
			return "Pro";
		case "payg":
			return "Pay as you go";
		default:
			return "standard";
	}
}

function buildInsufficientCreditsMessage(
	modelId: string,
	tier: CatalogTier,
	requiredCredits: number,
	availableCredits: number,
): string {
	const tierLabel = getTierDisplayName(tier);
	const required = formatCredits(requiredCredits);
	const available = formatCredits(availableCredits);

	if (tier === "payg") {
		return `Low credit balance. Model ${modelId} is Pay as you go. This request is estimated to cost $${required}, but only $${available} credits are available. Add more credits and try again.`;
	}

	return `Low credit balance. Model ${modelId} is in the ${tierLabel} catalog. This request is estimated to cost $${required}, but only $${available} credits are available. Add more credits or lower max_tokens and try again.`;
}

export async function assertHostedCreditsAvailable(
	input: HostedCreditEstimateInput,
): Promise<{
	estimatedCost: number;
	availableCredits: AvailableCreditsBreakdown;
}> {
	if (input.model.free === true || input.providerIsZeroCost) {
		return {
			estimatedCost: 0,
			availableCredits: getAvailableCredits(input.organization),
		};
	}

	const availableCredits = getAvailableCredits(input.organization);
	const estimatedCosts = await calculateCosts(
		input.model.id,
		input.provider,
		input.promptTokens,
		input.completionTokens,
		null,
		input.fullOutput,
		input.reasoningTokens ?? null,
		0,
		input.imageSize,
		input.inputImageCount ?? 0,
		input.webSearchCount ?? null,
		input.organization.id,
	);

	const estimatedCost = estimatedCosts.totalCost ?? 0;

	if (estimatedCost > availableCredits.totalAvailableCredits) {
		throw new HTTPException(402, {
			message: buildInsufficientCreditsMessage(
				input.model.id,
				getCatalogTier(input.model.id),
				estimatedCost,
				availableCredits.totalAvailableCredits,
			),
		});
	}

	return {
		estimatedCost,
		availableCredits,
	};
}
