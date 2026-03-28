import { getUser } from "@/lib/getUser";

import { Hero } from "./hero";

export const HeroRSC = async ({
	initialUser,
	navbarOnly,
	sticky = true,
}: {
	initialUser?: import("@/lib/getUser").PublicUser | null;
	navbarOnly?: boolean;
	sticky?: boolean;
}) => {
	const { allMigrations } = await import("content-collections");
	const migrations = navbarOnly
		? []
		: allMigrations.map((m) => ({
				slug: m.slug,
				title: m.title,
				fromProvider: m.fromProvider,
			}));
	const resolvedInitialUser =
		initialUser === undefined ? await getUser() : initialUser;

	return (
		<Hero
			initialUser={resolvedInitialUser}
			navbarOnly={navbarOnly}
			sticky={sticky}
			migrations={migrations}
		/>
	);
};
