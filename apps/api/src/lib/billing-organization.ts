import { db } from "@llmgateway/db";

export async function findPreferredBillingOrganization(userId: string) {
	const memberships = await db.query.userOrganization.findMany({
		where: {
			userId,
		},
		with: {
			organization: true,
		},
	});

	const activeMemberships = memberships.filter(
		(membership) => membership.organization?.status !== "deleted",
	);

	const personalMembership = activeMemberships.find(
		(membership) => membership.organization?.isPersonal === true,
	);

	if (personalMembership?.organization) {
		return {
			membership: personalMembership,
			organization: personalMembership.organization,
		};
	}

	const fallbackMembership = activeMemberships[0];

	if (!fallbackMembership?.organization) {
		return null;
	}

	return {
		membership: fallbackMembership,
		organization: fallbackMembership.organization,
	};
}
