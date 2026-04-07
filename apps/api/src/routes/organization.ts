import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import { userHasOrganizationAccess } from "@/utils/authorization.js";

import { logAuditEvent } from "@llmgateway/audit";
import { and, db, desc, eq, gte, isNull, or, sql, tables } from "@llmgateway/db";

import type { ServerTypes } from "@/vars.js";

export const organization = new OpenAPIHono<ServerTypes>();
const dashboardUrl = process.env.APP_URL ?? "https://app.kiwillm.in";

// Define schemas directly with Zod instead of using createSelectSchema
const organizationSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	name: z.string(),
	billingEmail: z.string(),
	billingCompany: z.string().nullable(),
	billingAddress: z.string().nullable(),
	billingTaxId: z.string().nullable(),
	billingNotes: z.string().nullable(),
	credits: z.string(),
	plan: z.enum(["free", "pro", "enterprise"]),
	planExpiresAt: z.date().nullable(),
	retentionLevel: z.enum(["retain", "none"]),
	status: z.enum(["active", "inactive", "deleted"]).nullable(),
	autoTopUpEnabled: z.boolean(),
	autoTopUpThreshold: z.string().nullable(),
	autoTopUpAmount: z.string().nullable(),
	referralEarnings: z.string(),
	// Dev Plans fields
	isPersonal: z.boolean(),
	devPlan: z.enum(["none", "lite", "pro", "max"]),
	devPlanCreditsUsed: z.string(),
	devPlanCreditsLimit: z.string(),
	devPlanBillingCycleStart: z.date().nullable(),
	devPlanExpiresAt: z.date().nullable(),
	devPlanAllowAllModels: z.boolean(),
});

const projectSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	name: z.string(),
	organizationId: z.string(),
	cachingEnabled: z.boolean(),
	cacheDurationSeconds: z.number(),
	mode: z.enum(["api-keys", "credits", "hybrid"]),
	status: z.enum(["active", "inactive", "deleted"]).nullable(),
});

const createOrganizationSchema = z.object({
	name: z.string().min(1).max(255),
});

const updateOrganizationSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	billingEmail: z.string().email().optional(),
	billingCompany: z.string().optional(),
	billingAddress: z.string().optional(),
	billingTaxId: z.string().optional(),
	billingNotes: z.string().optional(),
	retentionLevel: z.enum(["retain", "none"]).optional(),
	autoTopUpEnabled: z.boolean().optional(),
	autoTopUpThreshold: z.number().min(5).optional(),
	autoTopUpAmount: z.number().min(10).optional(),
});

const transactionSchema = z.object({
	id: z.string(),
	createdAt: z.date(),
	updatedAt: z.date(),
	organizationId: z.string(),
	type: z.enum([
		"subscription_start",
		"subscription_cancel",
		"subscription_end",
		"credit_topup",
		"credit_refund",
		"credit_gift",
		"dev_plan_start",
		"dev_plan_upgrade",
		"dev_plan_downgrade",
		"dev_plan_cancel",
		"dev_plan_end",
		"dev_plan_renewal",
	]),
	amount: z.string().nullable(),
	creditAmount: z.string().nullable(),
	currency: z.string(),
	status: z.enum(["pending", "completed", "failed"]),
	stripePaymentIntentId: z.string().nullable(),
	stripeInvoiceId: z.string().nullable(),
	description: z.string().nullable(),
	relatedTransactionId: z.string().nullable(),
	refundReason: z.string().nullable(),
});

const creditCouponSchema = z.object({
	id: z.string(),
	code: z.string(),
	description: z.string().nullable(),
	creditAmount: z.string(),
	maxRedemptions: z.number(),
	redeemedCount: z.number(),
	active: z.boolean(),
	expiresAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

const redeemCouponSchema = z.object({
	code: z.string().trim().min(3).max(64),
});

const getOrganizations = createRoute({
	method: "get",
	path: "/",
	request: {},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						organizations: z.array(organizationSchema).openapi({}),
					}),
				},
			},
			description: "List of organizations the user belongs to",
		},
	},
});

organization.openapi(getOrganizations, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const userOrganizations = await db.query.userOrganization.findMany({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	const organizations = userOrganizations
		.map((uo) => uo.organization!)
		.filter((org) => org.status !== "deleted")
		// Hide personal orgs from the regular organization UI - they are managed through the dashboard flow
		.filter((org) => !org.isPersonal);

	return c.json({
		organizations,
	});
});

const getProjects = createRoute({
	method: "get",
	path: "/{id}/projects",
	request: {
		params: z.object({
			id: z.string(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						projects: z.array(projectSchema).openapi({}),
					}),
				},
			},
			description: "List of projects for the specified organization",
		},
	},
});

organization.openapi(getProjects, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	const hasAccess = await userHasOrganizationAccess(user.id, id);
	if (!hasAccess) {
		throw new HTTPException(403, {
			message: "You do not have access to this organization",
		});
	}

	const projects = await db.query.project.findMany({
		where: {
			organizationId: {
				eq: id,
			},
			status: {
				ne: "deleted",
			},
		},
	});

	return c.json({
		projects,
	});
});

const createOrganization = createRoute({
	method: "post",
	path: "/",
	request: {
		body: {
			content: {
				"application/json": {
					schema: createOrganizationSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						organization: organizationSchema.openapi({}),
					}),
				},
			},
			description: "Organization created successfully.",
		},
	},
});

organization.openapi(createOrganization, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { name } = c.req.valid("json");

	// Get user's existing organizations to check limits
	const userOrganizations = await db.query.userOrganization.findMany({
		where: {
			userId: user.id,
		},
		with: {
			organization: true,
		},
	});

	// Filter out deleted organizations
	const activeOrganizations = userOrganizations
		.filter((uo) => uo.organization?.status !== "deleted")
		.map((uo) => uo.organization!);

	const orgsLimit = 3;

	// If user only has free plan, they can have only 1 organization
	if (activeOrganizations.length >= orgsLimit) {
		throw new HTTPException(403, {
			message: `You have reached the limit of ${orgsLimit} organizations. Please reach out to support to increase this limit.`,
		});
	}

	const [newOrganization] = await db
		.insert(tables.organization)
		.values({
			name,
			billingEmail: user.email,
		})
		.returning();

	await db.insert(tables.userOrganization).values({
		userId: user.id,
		organizationId: newOrganization.id,
		role: "owner",
	});

	await db.insert(tables.project).values({
		name: "Default Project",
		organizationId: newOrganization.id,
		mode: "hybrid",
	});

	await logAuditEvent({
		organizationId: newOrganization.id,
		userId: user.id,
		action: "organization.create",
		resourceType: "organization",
		resourceId: newOrganization.id,
		metadata: { resourceName: name },
	});

	return c.json({
		organization: newOrganization,
	});
});

const updateOrganization = createRoute({
	method: "patch",
	path: "/{id}",
	request: {
		params: z.object({
			id: z.string(),
		}),
		body: {
			content: {
				"application/json": {
					schema: updateOrganizationSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
						organization: organizationSchema.openapi({}),
					}),
				},
			},
			description: "Organization updated successfully.",
		},
		401: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Unauthorized.",
		},
		404: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Organization not found.",
		},
	},
});

organization.openapi(updateOrganization, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();
	const {
		name,
		billingEmail,
		billingCompany,
		billingAddress,
		billingTaxId,
		billingNotes,
		retentionLevel,
		autoTopUpEnabled,
		autoTopUpThreshold,
		autoTopUpAmount,
	} = c.req.valid("json");

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: {
				eq: user.id,
			},
			organizationId: {
				eq: id,
			},
		},
		with: {
			organization: true,
		},
	});

	if (
		!userOrganization ||
		userOrganization.organization?.status === "deleted"
	) {
		throw new HTTPException(404, {
			message: "Organization not found",
		});
	}

	// Check if user is trying to update policies or billing settings
	const isBillingOrPolicyUpdate =
		billingEmail !== undefined ||
		billingCompany !== undefined ||
		billingAddress !== undefined ||
		billingTaxId !== undefined ||
		billingNotes !== undefined ||
		retentionLevel !== undefined ||
		autoTopUpEnabled !== undefined ||
		autoTopUpThreshold !== undefined ||
		autoTopUpAmount !== undefined;

	// Only owners can update billing and policy settings
	if (isBillingOrPolicyUpdate && userOrganization.role !== "owner") {
		throw new HTTPException(403, {
			message: "Only owners can update billing and policy settings",
		});
	}

	const updateData: any = {};
	if (name !== undefined) {
		updateData.name = name;
	}
	if (billingEmail !== undefined) {
		updateData.billingEmail = billingEmail;
	}
	if (billingCompany !== undefined) {
		updateData.billingCompany = billingCompany;
	}
	if (billingAddress !== undefined) {
		updateData.billingAddress = billingAddress;
	}
	if (billingTaxId !== undefined) {
		updateData.billingTaxId = billingTaxId;
	}
	if (billingNotes !== undefined) {
		updateData.billingNotes = billingNotes;
	}
	if (retentionLevel !== undefined) {
		updateData.retentionLevel = retentionLevel;
	}
	if (autoTopUpEnabled !== undefined) {
		updateData.autoTopUpEnabled = autoTopUpEnabled;
	}
	if (autoTopUpThreshold !== undefined) {
		updateData.autoTopUpThreshold = autoTopUpThreshold.toString();
	}
	if (autoTopUpAmount !== undefined) {
		updateData.autoTopUpAmount = autoTopUpAmount.toString();
	}

	const [updatedOrganization] = await db
		.update(tables.organization)
		.set(updateData)
		.where(eq(tables.organization.id, id))
		.returning();

	// Build changes metadata for audit log
	const changes: Record<string, { old: unknown; new: unknown }> = {};
	const oldOrg = userOrganization.organization!;
	if (name !== undefined && name !== oldOrg.name) {
		changes.name = { old: oldOrg.name, new: name };
	}
	if (billingEmail !== undefined && billingEmail !== oldOrg.billingEmail) {
		changes.billingEmail = { old: oldOrg.billingEmail, new: billingEmail };
	}
	if (
		billingCompany !== undefined &&
		billingCompany !== oldOrg.billingCompany
	) {
		changes.billingCompany = {
			old: oldOrg.billingCompany,
			new: billingCompany,
		};
	}
	if (
		billingAddress !== undefined &&
		billingAddress !== oldOrg.billingAddress
	) {
		changes.billingAddress = {
			old: oldOrg.billingAddress,
			new: billingAddress,
		};
	}
	if (billingTaxId !== undefined && billingTaxId !== oldOrg.billingTaxId) {
		changes.billingTaxId = { old: oldOrg.billingTaxId, new: billingTaxId };
	}
	if (billingNotes !== undefined && billingNotes !== oldOrg.billingNotes) {
		changes.billingNotes = { old: oldOrg.billingNotes, new: billingNotes };
	}
	if (
		retentionLevel !== undefined &&
		retentionLevel !== oldOrg.retentionLevel
	) {
		changes.retentionLevel = {
			old: oldOrg.retentionLevel,
			new: retentionLevel,
		};
	}
	if (
		autoTopUpEnabled !== undefined &&
		autoTopUpEnabled !== oldOrg.autoTopUpEnabled
	) {
		changes.autoTopUpEnabled = {
			old: oldOrg.autoTopUpEnabled,
			new: autoTopUpEnabled,
		};
	}
	if (autoTopUpThreshold !== undefined) {
		changes.autoTopUpThreshold = {
			old: oldOrg.autoTopUpThreshold,
			new: autoTopUpThreshold.toString(),
		};
	}
	if (autoTopUpAmount !== undefined) {
		changes.autoTopUpAmount = {
			old: oldOrg.autoTopUpAmount,
			new: autoTopUpAmount.toString(),
		};
	}

	if (Object.keys(changes).length > 0) {
		await logAuditEvent({
			organizationId: id,
			userId: user.id,
			action: "organization.update",
			resourceType: "organization",
			resourceId: id,
			metadata: { changes },
		});
	}

	return c.json({
		message: "Organization updated successfully",
		organization: updatedOrganization,
	});
});

const deleteOrganization = createRoute({
	method: "delete",
	path: "/{id}",
	request: {
		params: z.object({
			id: z.string(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Organization deleted successfully.",
		},
		401: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Unauthorized.",
		},
		404: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Organization not found.",
		},
	},
});

organization.openapi(deleteOrganization, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	const userOrganization = await db.query.userOrganization.findFirst({
		where: {
			userId: {
				eq: user.id,
			},
			organizationId: {
				eq: id,
			},
		},
		with: {
			organization: true,
		},
	});

	if (
		!userOrganization ||
		userOrganization.organization?.status === "deleted"
	) {
		throw new HTTPException(404, {
			message: "Organization not found",
		});
	}

	// Block deletion of personal orgs - they are managed via dev plans
	if (userOrganization.organization?.isPersonal) {
		throw new HTTPException(403, {
			message: `Personal organizations cannot be deleted. Please cancel your dev plan in the KiwiLLM dashboard instead: ${dashboardUrl}/dashboard`,
		});
	}

	await db
		.update(tables.organization)
		.set({
			status: "deleted",
		})
		.where(eq(tables.organization.id, id));

	await logAuditEvent({
		organizationId: id,
		userId: user.id,
		action: "organization.delete",
		resourceType: "organization",
		resourceId: id,
		metadata: { resourceName: userOrganization.organization?.name },
	});

	return c.json({
		message: "Organization deleted successfully",
	});
});

const getTransactions = createRoute({
	method: "get",
	path: "/{id}/transactions",
	request: {
		params: z.object({
			id: z.string(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						transactions: z.array(transactionSchema).openapi({}),
					}),
				},
			},
			description: "List of transactions for the specified organization",
		},
	},
});

organization.openapi(getTransactions, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	const hasAccess = await userHasOrganizationAccess(user.id, id);
	if (!hasAccess) {
		throw new HTTPException(403, {
			message: "You do not have access to this organization",
		});
	}

	const transactions = await db.query.transaction.findMany({
		where: {
			organizationId: {
				eq: id,
			},
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	return c.json({
		transactions,
	});
});

const getReferralStats = createRoute({
	method: "get",
	path: "/{id}/referral-stats",
	request: {
		params: z.object({
			id: z.string(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						referredCount: z.number(),
						pendingCount: z.number(),
						rewardedCount: z.number(),
						blockedCount: z.number(),
						earnedCredits: z.string(),
						rewardPerReferral: z.string(),
					}),
				},
			},
			description: "Referral statistics for the organization",
		},
	},
});

organization.openapi(getReferralStats, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	const hasAccess = await userHasOrganizationAccess(user.id, id);
	if (!hasAccess) {
		throw new HTTPException(403, {
			message: "You do not have access to this organization",
		});
	}

	const referrals = await db
		.select({
			id: tables.referral.id,
			status: sql<"pending" | "rewarded" | "blocked">`status`,
		})
		.from(tables.referral)
		.where(eq(tables.referral.referrerOrganizationId, id));

	const org = await db.query.organization.findFirst({
		where: {
			id: {
				eq: id,
			},
		},
		columns: {
			referralEarnings: true,
		},
	});

	const pendingCount = referrals.filter(
		(referral) => referral.status === "pending",
	).length;
	const rewardedCount = referrals.filter(
		(referral) => referral.status === "rewarded",
	).length;
	const blockedCount = referrals.filter(
		(referral) => referral.status === "blocked",
	).length;

	return c.json({
		referredCount: referrals.length,
		pendingCount,
		rewardedCount,
		blockedCount,
		earnedCredits: org?.referralEarnings ?? "0",
		rewardPerReferral: "5",
	});
});

const discountSchema = z.object({
	id: z.string(),
	organizationId: z.string().nullable(),
	provider: z.string().nullable(),
	model: z.string().nullable(),
	discountPercent: z.string(),
	reason: z.string().nullable(),
	expiresAt: z.date().nullable(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

const getOrgDiscounts = createRoute({
	method: "get",
	path: "/{id}/discounts",
	request: {
		params: z.object({
			id: z.string(),
		}),
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						orgDiscounts: z.array(discountSchema).openapi({}),
						globalDiscounts: z.array(discountSchema).openapi({}),
					}),
				},
			},
			description:
				"Active discounts for the organization (org-specific and global)",
		},
	},
});

organization.openapi(getOrgDiscounts, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.param();

	const hasAccess = await userHasOrganizationAccess(user.id, id);
	if (!hasAccess) {
		throw new HTTPException(403, {
			message: "You do not have access to this organization",
		});
	}

	const now = new Date();
	const notExpired = or(
		isNull(tables.discount.expiresAt),
		gte(tables.discount.expiresAt, now),
	);

	const [orgDiscounts, globalDiscounts] = await Promise.all([
		db
			.select()
			.from(tables.discount)
			.where(and(eq(tables.discount.organizationId, id), notExpired))
			.orderBy(desc(tables.discount.createdAt)),
		db
			.select()
			.from(tables.discount)
			.where(and(isNull(tables.discount.organizationId), notExpired))
			.orderBy(desc(tables.discount.createdAt)),
	]);

	return c.json({
		orgDiscounts,
		globalDiscounts,
	});
});

const redeemCouponRoute = createRoute({
	method: "post",
	path: "/{id}/redeem-coupon",
	request: {
		params: z.object({
			id: z.string(),
		}),
		body: {
			content: {
				"application/json": {
					schema: redeemCouponSchema,
				},
			},
		},
	},
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
						credits: z.string(),
						creditAmount: z.string(),
						coupon: creditCouponSchema,
					}),
				},
			},
			description: "Coupon redeemed successfully.",
		},
		400: {
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
					}),
				},
			},
			description: "Coupon is invalid, expired, or already redeemed.",
		},
	},
});

organization.openapi(redeemCouponRoute, async (c) => {
	const user = c.get("user");
	if (!user) {
		throw new HTTPException(401, {
			message: "Unauthorized",
		});
	}

	const { id } = c.req.valid("param");
	const { code } = c.req.valid("json");

	const hasAccess = await userHasOrganizationAccess(user.id, id);
	if (!hasAccess) {
		throw new HTTPException(403, {
			message: "You do not have access to this organization",
		});
	}

	const normalizedCode = code.trim().toUpperCase();
	const now = new Date();
	const couponIdentifier = `coupon:${normalizedCode}`;

	try {
		const redeemed = await db.transaction(async (tx) => {
			const [couponRecord] = await tx
				.select()
				.from(tables.verification)
				.where(
					and(
						eq(tables.verification.identifier, couponIdentifier),
						gte(tables.verification.expiresAt, now),
					),
				)
				.limit(1);

			if (!couponRecord) {
				throw new HTTPException(400, {
					message: "Invalid coupon code",
				});
			}

			const coupon = JSON.parse(couponRecord.value) as {
				code: string;
				description?: string | null;
				creditAmount: string;
				maxRedemptions: number;
				redeemedCount: number;
				active: boolean;
			};

			if (!coupon.active) {
				throw new HTTPException(400, {
					message: "This coupon is no longer active",
				});
			}

			if (coupon.redeemedCount >= coupon.maxRedemptions) {
				throw new HTTPException(400, {
					message: "This coupon has already been fully redeemed",
				});
			}

			const redemptionDescription = `Coupon redeemed: ${normalizedCode}`;

			const [existingRedemption] = await tx
				.select({ id: tables.organizationAction.id })
				.from(tables.organizationAction)
				.where(
					and(
						eq(tables.organizationAction.organizationId, id),
						eq(tables.organizationAction.type, "credit"),
						eq(tables.organizationAction.description, redemptionDescription),
					),
				)
				.limit(1);

			if (existingRedemption) {
				throw new HTTPException(400, {
					message: "This coupon has already been redeemed by your organization",
				});
			}

			await tx
				.update(tables.verification)
				.set({
					value: JSON.stringify({
						...coupon,
						redeemedCount: coupon.redeemedCount + 1,
					}),
				})
				.where(eq(tables.verification.id, couponRecord.id));

			await tx.insert(tables.organizationAction).values({
				organizationId: id,
				type: "credit",
				amount: coupon.creditAmount,
				description: redemptionDescription,
			});

			await tx.insert(tables.transaction).values({
				organizationId: id,
				type: "credit_gift",
				creditAmount: coupon.creditAmount,
				currency: "USD",
				status: "completed",
				description: redemptionDescription,
			});

			const [updatedOrganization] = await tx
				.update(tables.organization)
				.set({
					credits: sql`${tables.organization.credits} + ${coupon.creditAmount}`,
				})
				.where(eq(tables.organization.id, id))
				.returning({
					credits: tables.organization.credits,
				});

			return {
				coupon: {
					id: couponRecord.id,
					code: normalizedCode,
					description: coupon.description ?? null,
					creditAmount: coupon.creditAmount,
					maxRedemptions: coupon.maxRedemptions,
					redeemedCount: coupon.redeemedCount + 1,
					active: coupon.active,
					expiresAt: couponRecord.expiresAt,
					createdAt: couponRecord.createdAt ?? now,
					updatedAt: couponRecord.updatedAt ?? now,
				},
				credits: String(updatedOrganization.credits),
			};
		});

		return c.json({
			message: "Coupon redeemed successfully",
			credits: redeemed.credits,
			creditAmount: redeemed.coupon.creditAmount,
			coupon: redeemed.coupon,
		});
	} catch (error) {
		if (error instanceof HTTPException) {
			throw error;
		}

		throw error;
	}
});

export default organization;
