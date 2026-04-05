"use client";

import Link from "next/link";

import { Button } from "@/lib/components/button";
import { getDisplayProviderInfo } from "@/lib/model-catalog-display";

import { providers as providerDefinitions } from "@llmgateway/models";
import { getProviderIcon } from "@llmgateway/shared/components";

interface ProviderTabsProps {
	modelId: string;
	providerIds: string[];
	activeProviderId: string;
}

export function ProviderTabs({
	modelId,
	providerIds,
	activeProviderId,
}: ProviderTabsProps) {
	const groupedProviders = Array.from(new Set(providerIds)).reduce<
		Array<{
			providerId: string;
			name: string;
			iconProviderId: string;
			active: boolean;
		}>
	>((groups, providerId) => {
		const providerInfo = providerDefinitions.find((p) => p.id === providerId);
		const displayProvider = getDisplayProviderInfo({
			providerId,
			providerName: providerInfo?.name,
			modelId,
		});
		const existingGroup = groups.find(
			(group) => group.name === displayProvider.name,
		);

		if (existingGroup) {
			if (providerId === activeProviderId) {
				existingGroup.providerId = providerId;
				existingGroup.active = true;
			}
			return groups;
		}

		groups.push({
			providerId,
			name: displayProvider.name,
			iconProviderId: displayProvider.iconProviderId,
			active: providerId === activeProviderId,
		});
		return groups;
	}, []);

	return (
		<div className="flex flex-wrap gap-2 mb-6">
			{groupedProviders.map((provider) => {
				const ProviderIcon = getProviderIcon(provider.iconProviderId);

				return (
					<Link
						key={provider.providerId}
						href={
							`/models/${encodeURIComponent(modelId)}/${encodeURIComponent(provider.providerId)}` as any
						}
					>
						<Button
							variant={provider.active ? "secondary" : "outline"}
							size="sm"
							className="gap-2"
						>
							{ProviderIcon && <ProviderIcon className="h-4 w-4" />}
							{provider.name}
						</Button>
					</Link>
				);
			})}
		</div>
	);
}
