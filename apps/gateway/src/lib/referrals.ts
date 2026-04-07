import { and, db, desc, eq, sql, tables } from "@llmgateway/db";
import { logger } from "@llmgateway/logger";

const REFERRAL_REWARD_AMOUNT = "5";

async function getOrganizationOwnerProfile(organizationId: string) {
	const [ownerMembership] = await db
		.select({
			userId: tables.userOrganization.userId,
		})
		.from(tables.userOrganization)
		.where(
			and(
				eq(tables.userOrganization.organizationId, organizationId),
				eq(tables.userOrganization.role, "owner"),
			),
		)
		.limit(1);

	if (!ownerMembership) {
		return null;
	}

	const [owner] = await db
		.select({
			id: tables.user.id,
			email: tables.user.email,
		})
		.from(tables.user)
		.where(eq(tables.user.id, ownerMembership.userId))
		.limit(1);

	if (!owner) {
		return null;
	}

	const recentSessions = await db
		.select({
			ipAddress: tables.session.ipAddress,
		})
		.from(tables.session)
		.where(eq(tables.session.userId, owner.id))
		.orderBy(desc(tables.session.createdAt))
		.limit(10);

	const recentIpAddresses = Array.from(
		new Set(
			recentSessions
				.map((session) => session.ipAddress?.trim())
				.filter((ipAddress): ipAddress is string => Boolean(ipAddress)),
		),
	);

	return {
		userId: owner.id,
		email: owner.email.trim().toLowerCase(),
		recentIpAddresses,
	};
}

async function blockPendingReferral(referralId: string, blockReason: string) {
	await db.execute(sql`
		update referral
		set status = 'blocked',
			block_reason = ${blockReason}
		where id = ${referralId}
			and status = 'pending'
	`);
}

export async function rewardQualifiedReferral(
	referredOrganizationId: string,
	requestId: string,
) {
	const [referral] = await db
		.select({
			id: tables.referral.id,
			referrerOrganizationId: tables.referral.referrerOrganizationId,
			referredOrganizationId: tables.referral.referredOrganizationId,
			signupIpAddress: sql<string | null>`signup_ip_address`,
		})
		.from(tables.referral)
		.where(
			and(
				eq(tables.referral.referredOrganizationId, referredOrganizationId),
				sql`status = 'pending'`,
			),
		)
		.limit(1);

	if (!referral) {
		return;
	}

	if (referral.referrerOrganizationId === referral.referredOrganizationId) {
		await blockPendingReferral(referral.id, "self_referral");
		return;
	}

	const [referrerOrg, referredOrg, referrerOwner, referredOwner] =
		await Promise.all([
			db.query.organization.findFirst({
				where: {
					id: {
						eq: referral.referrerOrganizationId,
					},
					status: {
						eq: "active",
					},
				},
			}),
			db.query.organization.findFirst({
				where: {
					id: {
						eq: referral.referredOrganizationId,
					},
					status: {
						eq: "active",
					},
				},
			}),
			getOrganizationOwnerProfile(referral.referrerOrganizationId),
			getOrganizationOwnerProfile(referral.referredOrganizationId),
		]);

	if (!referrerOrg || !referredOrg) {
		await blockPendingReferral(referral.id, "organization_inactive");
		return;
	}

	if (!referrerOwner || !referredOwner) {
		await blockPendingReferral(referral.id, "owner_missing");
		return;
	}

	if (
		referrerOwner.userId === referredOwner.userId ||
		referrerOwner.email === referredOwner.email
	) {
		await blockPendingReferral(referral.id, "same_owner_email");
		return;
	}

	if (
		referral.signupIpAddress &&
		referrerOwner.recentIpAddresses.includes(referral.signupIpAddress)
	) {
		await blockPendingReferral(referral.id, "same_signup_ip");
		return;
	}

	const overlappingRewardIps = referredOwner.recentIpAddresses.filter((ipAddress) =>
		referrerOwner.recentIpAddresses.includes(ipAddress),
	);

	if (overlappingRewardIps.length > 0) {
		await blockPendingReferral(referral.id, "same_reward_ip");
		return;
	}

	const referrerDescription = `Referral reward earned: ${referral.id}`;
	const referredDescription = `Referral welcome credit: ${referral.id}`;
	const rewardTimestamp = new Date();

	await db.transaction(async (tx) => {
		const claimResult = await tx.execute(sql<{ id: string }>`
			update referral
			set status = 'rewarded',
				qualified_at = ${rewardTimestamp},
				rewarded_at = ${rewardTimestamp},
				referrer_reward_amount = ${REFERRAL_REWARD_AMOUNT},
				referred_reward_amount = ${REFERRAL_REWARD_AMOUNT},
				qualified_request_id = ${requestId},
				block_reason = null
			where id = ${referral.id}
				and status = 'pending'
			returning id
		`);

		if (claimResult.rows.length === 0) {
			return;
		}

		await tx.insert(tables.organizationAction).values([
			{
				organizationId: referral.referrerOrganizationId,
				type: "credit",
				amount: REFERRAL_REWARD_AMOUNT,
				description: referrerDescription,
			},
			{
				organizationId: referral.referredOrganizationId,
				type: "credit",
				amount: REFERRAL_REWARD_AMOUNT,
				description: referredDescription,
			},
		]);

		await tx.insert(tables.transaction).values([
			{
				organizationId: referral.referrerOrganizationId,
				type: "credit_gift",
				creditAmount: REFERRAL_REWARD_AMOUNT,
				currency: "USD",
				status: "completed",
				description: referrerDescription,
			},
			{
				organizationId: referral.referredOrganizationId,
				type: "credit_gift",
				creditAmount: REFERRAL_REWARD_AMOUNT,
				currency: "USD",
				status: "completed",
				description: referredDescription,
			},
		]);

		await tx
			.update(tables.organization)
			.set({
				credits: sql`${tables.organization.credits} + ${REFERRAL_REWARD_AMOUNT}`,
				referralEarnings: sql`${tables.organization.referralEarnings} + ${REFERRAL_REWARD_AMOUNT}`,
			})
			.where(eq(tables.organization.id, referral.referrerOrganizationId));

		await tx
			.update(tables.organization)
			.set({
				credits: sql`${tables.organization.credits} + ${REFERRAL_REWARD_AMOUNT}`,
			})
			.where(eq(tables.organization.id, referral.referredOrganizationId));
	});

	logger.info("Rewarded qualified referral", {
		referralId: referral.id,
		referrerOrganizationId: referral.referrerOrganizationId,
		referredOrganizationId: referral.referredOrganizationId,
		requestId,
	});
}
