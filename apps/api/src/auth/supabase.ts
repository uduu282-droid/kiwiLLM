import { createClient, type User as SupabaseUser } from "@supabase/supabase-js";

import { apiAuth } from "@/auth/config.js";
import { getApiKeyPrefix } from "@/lib/api-key-prefix.js";

import { db, eq, tables, shortid } from "@llmgateway/db";
import { logger } from "@llmgateway/logger";

import type {
	AuthAccount,
	AuthenticatedSession,
	AuthenticatedUser,
} from "./types.js";

const SUPABASE_SESSION_COOKIE_NAME =
	process.env.SUPABASE_SESSION_COOKIE_NAME ?? "sb-access-token";
const SUPABASE_REFRESH_COOKIE_NAME =
	process.env.SUPABASE_REFRESH_COOKIE_NAME ?? "sb-refresh-token";
const SUPABASE_COOKIE_MAX_AGE_SECONDS =
	Number(process.env.SUPABASE_COOKIE_MAX_AGE_SECONDS) || 60 * 60 * 24 * 30;

function getSupabaseConfig() {
	const url =
		process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
	const anonKey =
		process.env.SUPABASE_ANON_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
		process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
		null;
	const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? null;

	if (!url || !anonKey || !serviceRoleKey) {
		return null;
	}

	return {
		url,
		anonKey,
		serviceRoleKey,
	};
}

export function isSupabaseAuthConfigured() {
	return !!getSupabaseConfig();
}

function getSupabaseAdminClient() {
	const config = getSupabaseConfig();

	if (!config) {
		throw new Error("Supabase auth is not configured.");
	}

	return createClient(config.url, config.serviceRoleKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

function getSupabasePublicClient() {
	const config = getSupabaseConfig();

	if (!config) {
		throw new Error("Supabase auth is not configured.");
	}

	return createClient(config.url, config.anonKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false,
		},
	});
}

function getCookieValue(cookieHeader: string | null, name: string) {
	if (!cookieHeader) {
		return null;
	}

	for (const entry of cookieHeader.split(";")) {
		const [rawName, ...rest] = entry.trim().split("=");
		if (rawName === name) {
			return decodeURIComponent(rest.join("="));
		}
	}

	return null;
}

function getSupabaseEmailVerified(user: SupabaseUser) {
	return !!user.email_confirmed_at;
}

function getSupabaseDisplayName(user: SupabaseUser) {
	const metadata = user.user_metadata;

	if (typeof metadata?.name === "string" && metadata.name.trim()) {
		return metadata.name.trim();
	}

	if (typeof metadata?.full_name === "string" && metadata.full_name.trim()) {
		return metadata.full_name.trim();
	}

	if (typeof metadata?.user_name === "string" && metadata.user_name.trim()) {
		return metadata.user_name.trim();
	}

	if (typeof metadata?.preferred_username === "string") {
		return metadata.preferred_username;
	}

	return user.email?.split("@")[0] ?? null;
}

function getSupabaseImage(user: SupabaseUser) {
	const metadata = user.user_metadata;

	if (typeof metadata?.avatar_url === "string") {
		return metadata.avatar_url;
	}

	if (typeof metadata?.picture === "string") {
		return metadata.picture;
	}

	return null;
}

function normalizeProviderId(providerId: string) {
	switch (providerId) {
		case "email":
			return "credential";
		default:
			return providerId;
	}
}

function getSupabaseAccounts(user: SupabaseUser): AuthAccount[] {
	const providers = new Set<string>();
	const appProviders = user.app_metadata?.providers;

	if (Array.isArray(appProviders)) {
		for (const provider of appProviders) {
			if (typeof provider === "string" && provider.length > 0) {
				providers.add(normalizeProviderId(provider));
			}
		}
	}

	for (const identity of user.identities ?? []) {
		if (identity.provider) {
			providers.add(normalizeProviderId(identity.provider));
		}
	}

	if (providers.size === 0 && user.email) {
		providers.add("credential");
	}

	return Array.from(providers).map((providerId) => ({
		providerId,
	}));
}

function getSupabaseUserValues(supabaseUser: SupabaseUser) {
	const userEmail = supabaseUser.email;

	if (!userEmail) {
		throw new Error("Supabase user must have an email address.");
	}

	return {
		id: supabaseUser.id,
		email: userEmail,
		name: getSupabaseDisplayName(supabaseUser),
		image: getSupabaseImage(supabaseUser),
		emailVerified: getSupabaseEmailVerified(supabaseUser),
	};
}

async function findExistingSupabaseUser(supabaseUser: SupabaseUser) {
	const userValues = getSupabaseUserValues(supabaseUser);

	return (
		(await db.query.user.findFirst({
			where: {
				id: { eq: userValues.id },
			},
		})) ??
		(await db.query.user.findFirst({
			where: {
				email: { eq: userValues.email },
			},
		}))
	);
}

async function upsertSupabaseUser(supabaseUser: SupabaseUser) {
	const userValues = getSupabaseUserValues(supabaseUser);
	const existingUser = await findExistingSupabaseUser(supabaseUser);

	if (existingUser) {
		const [updatedUser] = await db
			.update(tables.user)
			.set({
				email: userValues.email,
				name: userValues.name,
				image: userValues.image,
				emailVerified: userValues.emailVerified,
			})
			.where(eq(tables.user.id, existingUser.id))
			.returning();

		return updatedUser;
	}

	const [createdUser] = await db
		.insert(tables.user)
		.values(userValues)
		.onConflictDoUpdate({
			target: tables.user.id,
			set: {
				email: userValues.email,
				name: userValues.name,
				image: userValues.image,
				emailVerified: userValues.emailVerified,
			},
		})
		.returning();

	return createdUser;
}

async function ensureSupabaseUserAppData(supabaseUser: SupabaseUser) {
	const { email: userEmail } = getSupabaseUserValues(supabaseUser);
	const dbUser = await upsertSupabaseUser(supabaseUser);

	const activeOrganizations = (
		await db.query.userOrganization.findMany({
			where: {
				userId: dbUser.id,
			},
			with: {
				organization: true,
			},
		})
	).filter((membership) => membership.organization?.status !== "deleted");

	if (activeOrganizations.length === 0) {
		await db.transaction(async (tx) => {
			const [organization] = await tx
				.insert(tables.organization)
				.values({
					name: "Default Organization",
					billingEmail: userEmail,
				})
				.returning();

			await tx.insert(tables.userOrganization).values({
				userId: dbUser.id,
				organizationId: organization.id,
			});

			const [project] = await tx
				.insert(tables.project)
				.values({
					name: "Default Project",
					organizationId: organization.id,
					mode: "hybrid",
				})
				.returning();

			const token = getApiKeyPrefix() + shortid(40);

			await tx.insert(tables.apiKey).values({
				projectId: project.id,
				token,
				description: "Auto-generated playground key",
				usageLimit: null,
				createdBy: dbUser.id,
			});
		});
	}

	return {
		dbUser,
	};
}

async function syncSupabaseUserRecord(supabaseUser: SupabaseUser) {
	return upsertSupabaseUser(supabaseUser);
}

async function resolveSupabaseAuthContext(supabaseUser: SupabaseUser) {
	const dbUser = await syncSupabaseUserRecord(supabaseUser);

	const user: AuthenticatedUser = {
		id: dbUser.id,
		email: dbUser.email,
		name: dbUser.name,
		emailVerified: getSupabaseEmailVerified(supabaseUser),
		image: dbUser.image,
		accounts: getSupabaseAccounts(supabaseUser),
		hasPasskeys: false,
		authSource: "supabase",
		supabaseUserId: supabaseUser.id,
	};

	const session: AuthenticatedSession = {
		id: supabaseUser.id,
		expiresAt: null,
		authSource: "supabase",
	};

	return {
		user,
		session,
	};
}

function mapBetterAuthSession(
	session: Awaited<ReturnType<typeof apiAuth.api.getSession>>,
) {
	if (!session?.user || !session.session) {
		return null;
	}

	return {
		user: {
			id: session.user.id,
			email: session.user.email,
			name: session.user.name ?? null,
			emailVerified: session.user.emailVerified,
			image: session.user.image ?? null,
			accounts: [],
			hasPasskeys: false,
			authSource: "better-auth" as const,
		},
		session: {
			id: session.session.id,
			expiresAt: session.session.expiresAt,
			token: session.session.token,
			authSource: "better-auth" as const,
		},
	};
}

async function getSupabaseUserForAccessToken(accessToken: string) {
	const supabase = getSupabaseAdminClient();
	const { data, error } = await supabase.auth.getUser(accessToken);

	if (error || !data.user) {
		throw error ?? new Error("Unable to resolve Supabase user.");
	}

	return data.user;
}

export async function getRequestAuthContext(headers: Headers) {
	const cookieHeader = headers.get("cookie");
	const bearerToken = headers.get("authorization")?.replace(/^Bearer\s+/i, "");

	if (isSupabaseAuthConfigured()) {
		try {
			const accessToken =
				getCookieValue(cookieHeader, SUPABASE_SESSION_COOKIE_NAME) ??
				bearerToken;

			if (accessToken) {
				const user = await getSupabaseUserForAccessToken(accessToken);
				return await resolveSupabaseAuthContext(user);
			}
		} catch (error) {
			logger.warn("Supabase auth verification failed", {
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	const betterAuthSession = await apiAuth.api.getSession({ headers });
	return mapBetterAuthSession(betterAuthSession);
}

export async function createSupabaseSession(input: {
	accessToken: string;
	refreshToken?: string | null;
}) {
	const supabaseUser = await getSupabaseUserForAccessToken(input.accessToken);
	await ensureSupabaseUserAppData(supabaseUser);

	return {
		accessToken: input.accessToken,
		refreshToken: input.refreshToken ?? null,
	};
}

export function getSupabaseSessionCookieName() {
	return SUPABASE_SESSION_COOKIE_NAME;
}

export function getSupabaseRefreshCookieName() {
	return SUPABASE_REFRESH_COOKIE_NAME;
}

function getCookieBaseOptions() {
	return {
		path: "/",
		httpOnly: true,
		sameSite: "lax" as const,
		secure: process.env.NODE_ENV === "production",
		maxAge: SUPABASE_COOKIE_MAX_AGE_SECONDS,
		...(process.env.SUPABASE_COOKIE_DOMAIN
			? {
					domain: process.env.SUPABASE_COOKIE_DOMAIN,
				}
			: {}),
	};
}

export function getSupabaseSessionCookieOptions() {
	return getCookieBaseOptions();
}

export function getSupabaseRefreshCookieOptions() {
	return getCookieBaseOptions();
}

export async function syncSupabaseUserProfile(
	supabaseUserId: string,
	data: {
		name?: string | null;
		email?: string;
		onboardingCompleted?: boolean;
	},
) {
	if (!isSupabaseAuthConfigured()) {
		return;
	}

	const supabase = getSupabaseAdminClient();
	const { data: currentUserData, error: getUserError } =
		await supabase.auth.admin.getUserById(supabaseUserId);

	if (getUserError || !currentUserData.user) {
		throw getUserError ?? new Error("Supabase user not found.");
	}

	const currentMetadata = currentUserData.user.user_metadata ?? {};
	const nextMetadata = {
		...currentMetadata,
		...(data.name !== undefined ? { name: data.name } : {}),
		...(data.onboardingCompleted !== undefined
			? { onboardingCompleted: data.onboardingCompleted }
			: {}),
	};

	const { error } = await supabase.auth.admin.updateUserById(supabaseUserId, {
		...(data.email ? { email: data.email } : {}),
		user_metadata: nextMetadata,
	});

	if (error) {
		throw error;
	}
}

export async function verifySupabasePassword(email: string, password: string) {
	const supabase = getSupabasePublicClient();
	const { error } = await supabase.auth.signInWithPassword({
		email,
		password,
	});

	if (error) {
		throw new Error("Incorrect current password");
	}
}

export async function updateSupabasePassword(
	supabaseUserId: string,
	newPassword: string,
) {
	if (!isSupabaseAuthConfigured()) {
		return;
	}

	const supabase = getSupabaseAdminClient();
	const { error } = await supabase.auth.admin.updateUserById(supabaseUserId, {
		password: newPassword,
	});

	if (error) {
		throw error;
	}
}

export async function deleteSupabaseUser(supabaseUserId: string) {
	if (!isSupabaseAuthConfigured()) {
		return;
	}

	const supabase = getSupabaseAdminClient();
	const { error } = await supabase.auth.admin.deleteUser(supabaseUserId);

	if (error) {
		throw error;
	}
}
