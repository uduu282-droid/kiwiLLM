import type {
	SerializedOrganization,
	SerializedProject,
	SerializedUser,
	SerializedApiKey,
	SerializedApiKeyIamRule,
} from "@llmgateway/db";

export type Organization = SerializedOrganization;
export type Project = SerializedProject;
export type User = SerializedUser | null;

export interface BillingAccount {
	id: string;
	name: string;
	credits: string;
	isPersonal: boolean;
	plan: "free" | "pro" | "enterprise";
	planExpiresAt: string | null;
	billingEmail: string;
	autoTopUpEnabled: boolean;
	autoTopUpThreshold: string | null;
	autoTopUpAmount: string | null;
	devPlan: "none" | "lite" | "pro" | "max";
	devPlanCreditsUsed: string;
	devPlanCreditsLimit: string;
	devPlanBillingCycleStart: string | null;
	devPlanCancelled: boolean;
	devPlanExpiresAt: string | null;
	devPlanAllowAllModels: boolean;
}

export type ApiKey = Omit<SerializedApiKey, "token"> & {
	maskedToken: string;
	iamRules?: Omit<SerializedApiKeyIamRule, "apiKeyId">[];
};
