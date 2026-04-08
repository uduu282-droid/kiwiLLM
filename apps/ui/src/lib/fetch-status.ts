import { cache } from "react";

import { getConfig } from "./config-server";

export interface PublicStatusModel {
	modelId: string;
	name: string;
	family: string;
	uptimePercent: number | null;
	checkCount: number;
	lastCheckedAt: string | null;
	lastSuccessfulAt: string | null;
	lastFailureAt: string | null;
	lastResponseTimeMs: number | null;
	lastStatusCode: number | null;
	lastErrorMessage: string | null;
	status: "operational" | "degraded" | "down" | "unknown";
}

export interface PublicStatusResponse {
	generatedAt: string;
	checkedEveryHours: number;
	windowDays: number;
	summary: {
		totalModels: number;
		operational: number;
		degraded: number;
		down: number;
		unknown: number;
	};
	models: PublicStatusModel[];
}

const emptyStatusResponse: PublicStatusResponse = {
	generatedAt: new Date(0).toISOString(),
	checkedEveryHours: 12,
	windowDays: 30,
	summary: {
		totalModels: 0,
		operational: 0,
		degraded: 0,
		down: 0,
		unknown: 0,
	},
	models: [],
};

export const fetchPublicStatus = cache(
	async (): Promise<PublicStatusResponse> => {
		const config = getConfig();

		try {
			const response = await fetch(`${config.apiBackendUrl}/public/status`, {
				next: { revalidate: 300 },
			});

			if (!response.ok) {
				console.error("Failed to fetch status page data:", response.statusText);
				return emptyStatusResponse;
			}

			return (await response.json()) as PublicStatusResponse;
		} catch (error) {
			console.error("Error fetching status page data:", error);
			return emptyStatusResponse;
		}
	},
);
