import { cache } from "react";

export interface ApiProvider {
	id: string;
	createdAt: string;
	name: string | null;
	description: string | null;
	streaming: boolean | null;
	cancellation: boolean | null;
	color: string | null;
	website: string | null;
	announcement: string | null;
	status: "active" | "inactive";
}

export interface ApiModelProviderMapping {
	id: string;
	createdAt: string;
	modelId: string;
	providerId: string;
	modelName: string;
	inputPrice: string | null;
	outputPrice: string | null;
	cachedInputPrice: string | null;
	imageInputPrice: string | null;
	requestPrice: string | null;
	contextSize: number | null;
	maxOutput: number | null;
	streaming: boolean;
	vision: boolean | null;
	reasoning: boolean | null;
	reasoningOutput: string | null;
	tools: boolean | null;
	jsonOutput: boolean | null;
	jsonOutputSchema: boolean | null;
	webSearch: boolean | null;
	discount: string | null;
	stability: "stable" | "beta" | "unstable" | "experimental" | null;
	supportedParameters: string[] | null;
	deprecatedAt: string | null;
	deactivatedAt: string | null;
	status: "active" | "inactive";
}

export interface ApiModel {
	id: string;
	createdAt: string;
	releasedAt: string | null;
	name: string | null;
	aliases: string[] | null;
	description: string | null;
	family: string;
	free: boolean | null;
	output: string[] | null;
	imageInputRequired: boolean | null;
	stability: "stable" | "beta" | "unstable" | "experimental" | null;
	status: "active" | "inactive";
	mappings: ApiModelProviderMapping[];
}

const API_URL =
	process.env.API_BACKEND_URL ?? process.env.API_URL ?? "http://localhost:4002";

const isKiwiProviderId = (providerId: string) =>
	providerId === "kiwillm" || providerId.startsWith("kiwillm-");

const filterKiwiProviders = (providers: ApiProvider[]): ApiProvider[] =>
	providers.filter(
		(provider) =>
			provider.status === "active" && isKiwiProviderId(provider.id),
	);

const filterKiwiModels = (
	models: ApiModel[],
	providers: ApiProvider[],
): ApiModel[] => {
	const activeKiwiProviderIds = new Set(
		filterKiwiProviders(providers).map((provider) => provider.id),
	);

	return models
		.filter((model) => model.status === "active")
		.map((model) => {
			const mappings = model.mappings.filter(
				(mapping) =>
					mapping.status === "active" &&
					activeKiwiProviderIds.has(mapping.providerId),
			);

			return {
				...model,
				mappings,
			};
		})
		.filter((model) => model.mappings.length > 0);
};

export const fetchModels = cache(async (): Promise<ApiModel[]> => {
	try {
		const [modelsResponse, providersResponse] = await Promise.all([
			fetch(`${API_URL}/internal/models`, {
				next: { revalidate: 60 },
			}),
			fetch(`${API_URL}/internal/providers`, {
				next: { revalidate: 60 },
			}),
		]);

		if (!modelsResponse.ok) {
			console.error("Failed to fetch models:", modelsResponse.statusText);
			return [];
		}

		if (!providersResponse.ok) {
			console.error("Failed to fetch providers:", providersResponse.statusText);
			return [];
		}

		const [modelsData, providersData] = await Promise.all([
			modelsResponse.json(),
			providersResponse.json(),
		]);

		return filterKiwiModels(
			modelsData.models ?? [],
			providersData.providers ?? [],
		);
	} catch (error) {
		console.error("Error fetching models:", error);
		return [];
	}
});

export const fetchProviders = cache(async (): Promise<ApiProvider[]> => {
	try {
		const response = await fetch(`${API_URL}/internal/providers`, {
			next: { revalidate: 60 },
		});
		if (!response.ok) {
			console.error("Failed to fetch providers:", response.statusText);
			return [];
		}
		const data = await response.json();
		return filterKiwiProviders(data.providers ?? []);
	} catch (error) {
		console.error("Error fetching providers:", error);
		return [];
	}
});
