"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CreditCard, Gift, TicketPercent } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import CountUp from "@/components/shared/count-up";
import { Button } from "@/lib/components/button";
import { Card, CardContent } from "@/lib/components/card";
import { Input } from "@/lib/components/input";
import { useToast } from "@/lib/components/use-toast";
import { useApi } from "@/lib/fetch-client";
import { cn } from "@/lib/utils";

import type { BillingAccount, Organization } from "@/lib/types";

interface OrganizationCreditsCardProps {
	organization: BillingAccount | null;
}

export function OrganizationCreditsCard({
	organization,
}: OrganizationCreditsCardProps) {
	const api = useApi();
	const queryClient = useQueryClient();
	const { toast } = useToast();
	const [isRedeemOpen, setIsRedeemOpen] = useState(false);
	const [couponCode, setCouponCode] = useState("");
	const [highlightIncrease, setHighlightIncrease] = useState<number | null>(
		null,
	);
	const currentCredits = Number(organization?.credits ?? 0);
	const previousCreditsRef = useRef(currentCredits);
	const countFrom = previousCreditsRef.current;
	const countTo = currentCredits;

	const organizationsQueryKey = api.queryOptions("get", "/orgs", {}).queryKey;
	const redeemCoupon = api.useMutation("post", "/orgs/{id}/redeem-coupon");

	useEffect(() => {
		previousCreditsRef.current = currentCredits;
	}, [currentCredits]);

	const helperText = useMemo(() => {
		return currentCredits > 0
			? "Used for pay-as-you-go and other hosted credit-backed requests. Recent paid requests can take a few seconds to settle."
			: "Redeemed credits are used for hosted paid requests once your account needs credit-backed routing.";
	}, [currentCredits]);

	const detailedBalance = organization?.credits ?? "0";

	const applyCreditsToCache = (nextCredits: string) => {
		queryClient.setQueryData<{ organizations: Organization[] } | undefined>(
			organizationsQueryKey,
			(old) => {
				if (!old?.organizations || !organization) {
					return old;
				}

				return {
					...old,
					organizations: old.organizations.map((org) =>
						org.id === organization.id ? { ...org, credits: nextCredits } : org,
					),
				};
			},
		);
	};

	const handleRedeem = async () => {
		if (!organization?.id) {
			return;
		}

		const normalizedCode = couponCode.trim().toUpperCase();
		if (!normalizedCode) {
			toast({
				title: "Enter a coupon",
				description: "Add a coupon code like KIWI-LAUNCH-50 to redeem credits.",
				variant: "destructive",
			});
			return;
		}

		try {
			const response = await redeemCoupon.mutateAsync({
				params: {
					path: {
						id: organization.id,
					},
				},
				body: {
					code: normalizedCode,
				},
			});

			applyCreditsToCache(response.credits);
			setHighlightIncrease(Number(response.creditAmount));
			setCouponCode("");
			setIsRedeemOpen(false);

			void queryClient.invalidateQueries({ queryKey: organizationsQueryKey });

			toast({
				title: "Credits added",
				description: `${response.creditAmount} credits were added from coupon ${response.coupon.code}.`,
			});

			window.setTimeout(() => {
				setHighlightIncrease(null);
			}, 2200);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Failed to redeem coupon";
			toast({
				title: "Coupon redemption failed",
				description: message,
				variant: "destructive",
			});
		}
	};

	return (
		<Card className="rounded-[28px] border border-white/10 bg-black/30 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]">
			<CardContent className="space-y-4 p-6">
				<div className="flex items-start justify-between gap-4">
					<div className="space-y-1">
						<p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
							{organization?.isPersonal
								? "Personal Credits"
								: "Organization Credits"}
						</p>
						<div className="flex items-baseline gap-2">
							<CountUp
								className="text-2xl font-semibold tabular-nums text-white"
								from={countFrom}
								to={countTo}
								duration={0.8}
								prefix="$"
								startCounting
							/>
							{highlightIncrease ? (
								<span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-300">
									+$
									<CountUp
										className="tabular-nums"
										from={0}
										to={highlightIncrease}
										duration={0.7}
										startCounting
									/>
								</span>
							) : null}
						</div>
						<p className="text-xs text-zinc-500">Available balance</p>
						<p className="text-[11px] text-zinc-600">
							Exact live balance: ${detailedBalance}
						</p>
					</div>
					<div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-sky-500/30 bg-sky-500/10 text-sky-400">
						<CreditCard className="h-4 w-4" />
					</div>
				</div>

				<div className="rounded-2xl border border-white/6 bg-white/[0.02] p-3 text-sm text-zinc-400">
					<div className="flex items-center gap-2 text-zinc-200">
						<Gift className="h-4 w-4 text-emerald-300" />
						<span className="font-medium">Coupon credits</span>
					</div>
					<p className="mt-2 text-xs leading-5 text-zinc-500">{helperText}</p>
				</div>

				<div className="space-y-3">
					<Button
						type="button"
						variant="outline"
						className="w-full justify-center border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.06]"
						onClick={() => setIsRedeemOpen((open) => !open)}
					>
						<TicketPercent className="mr-2 h-4 w-4" />
						Redeem Credits
					</Button>

					{isRedeemOpen ? (
						<div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
							<div className="space-y-1">
								<p className="text-sm font-medium text-white">
									Enter your coupon code
								</p>
								<p className="text-xs text-zinc-500">
									Example coupon:{" "}
									<span className="font-medium text-zinc-300">
										KIWI-LAUNCH-50
									</span>
								</p>
							</div>
							<Input
								value={couponCode}
								onChange={(event) =>
									setCouponCode(event.target.value.toUpperCase())
								}
								placeholder="Enter coupon code"
								className="border-white/10 bg-black/30 text-white placeholder:text-zinc-500"
							/>
							<div className="flex items-center justify-end gap-2">
								<Button
									type="button"
									variant="ghost"
									className="text-zinc-400 hover:text-white"
									onClick={() => {
										setIsRedeemOpen(false);
										setCouponCode("");
									}}
								>
									Cancel
								</Button>
								<Button
									type="button"
									onClick={handleRedeem}
									disabled={redeemCoupon.isPending}
									className={cn(
										"min-w-28 bg-emerald-500 text-black hover:bg-emerald-400",
										redeemCoupon.isPending && "opacity-80",
									)}
								>
									{redeemCoupon.isPending ? "Redeeming..." : "Apply coupon"}
								</Button>
							</div>
						</div>
					) : null}
				</div>
			</CardContent>
		</Card>
	);
}
