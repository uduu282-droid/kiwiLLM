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
	const uniqueProviderIds = Array.from(new Set(providerIds));

	return (
		<div className="flex flex-wrap gap-2 mb-6">
			{uniqueProviderIds.map((providerId) => {
				const providerInfo = providerDefinitions.find(
					(p) => p.id === providerId,
				);
				const displayProvider = getDisplayProviderInfo({
					providerId,
					providerName: providerInfo?.name,
					modelId,
				});
				const ProviderIcon = getProviderIcon(displayProvider.iconProviderId);
				const isActive = providerId === activeProviderId;

				return (
					<Link
						key={providerId}
						href={
							`/models/${encodeURIComponent(modelId)}/${encodeURIComponent(providerId)}` as any
						}
					>
						<Button
							variant={isActive ? "secondary" : "outline"}
							size="sm"
							className="gap-2"
						>
							{ProviderIcon && <ProviderIcon className="h-4 w-4" />}
							{displayProvider.name}
						</Button>
					</Link>
				);
			})}
		</div>
	);
}
