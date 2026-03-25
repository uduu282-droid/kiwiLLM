export interface AuthAccount {
	providerId: string;
}

export interface AuthenticatedUser {
	id: string;
	email: string;
	name: string | null;
	emailVerified: boolean;
	image?: string | null;
	accounts: AuthAccount[];
	hasPasskeys: boolean;
	authSource: "supabase" | "better-auth";
	supabaseUserId?: string;
}

export interface AuthenticatedSession {
	id: string;
	expiresAt: Date | string | null;
	token?: string | null;
	authSource: "supabase" | "better-auth";
}

export interface Variables {
	user: AuthenticatedUser | null;
	session: AuthenticatedSession | null;
}
