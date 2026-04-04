"use client";

import { Copy, Gift, Loader2, ShieldCheck, Sparkles, Ticket } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFetchClient } from "@/lib/fetch-client";

type CreatedCoupon = {
	code: string;
	creditAmount: string;
	maxRedemptions: number;
	description: string | null;
	expiresAt: string | null;
};

export function CouponGenerator() {
	const $api = useFetchClient();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [creditAmount, setCreditAmount] = useState("100");
	const [customCode, setCustomCode] = useState("");
	const [description, setDescription] = useState("");
	const [maxRedemptions, setMaxRedemptions] = useState("1");
	const [expiresAt, setExpiresAt] = useState("");
	const [createdCoupon, setCreatedCoupon] = useState<CreatedCoupon | null>(null);
	const [error, setError] = useState<string | null>(null);

	const resetForm = () => {
		setCreditAmount("100");
		setCustomCode("");
		setDescription("");
		setMaxRedemptions("1");
		setExpiresAt("");
		setError(null);
	};

	const handleGenerate = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError(null);

		const parsedCreditAmount = Number(creditAmount);
		const parsedMaxRedemptions = Number(maxRedemptions);

		if (!Number.isFinite(parsedCreditAmount) || parsedCreditAmount <= 0) {
			setError("Enter a valid credit amount.");
			setLoading(false);
			return;
		}

		if (!Number.isInteger(parsedMaxRedemptions) || parsedMaxRedemptions < 1) {
			setError("Max redemptions must be at least 1.");
			setLoading(false);
			return;
		}

		const { data, error: requestError } = await $api.POST("/admin/coupons", {
			body: {
				code: customCode.trim() || undefined,
				description: description.trim() || undefined,
				creditAmount: parsedCreditAmount,
				maxRedemptions: parsedMaxRedemptions,
				expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
				active: true,
			},
		});

		setLoading(false);

		if (requestError || !data) {
			const message = "Could not create the coupon. Please try again.";
			setError(message);
			toast.error(message);
			return;
		}

		const coupon = data.coupon;
		setCreatedCoupon({
			code: coupon.code,
			creditAmount: coupon.creditAmount,
			maxRedemptions: coupon.maxRedemptions,
			description: coupon.description,
			expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString() : null,
		});
		toast.success(`Coupon ${coupon.code} created successfully`);
		resetForm();
		setOpen(false);
	};

	const handleCopy = async (value: string) => {
		await navigator.clipboard.writeText(value);
		toast.success("Coupon code copied");
	};

	return (
		<div className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-sm">
			<div className="flex items-start justify-between gap-4">
				<div>
					<div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
						<Gift className="h-4 w-4" />
					</div>
					<h3 className="mt-4 text-lg font-semibold">Coupon Generator</h3>
					<p className="mt-1 text-sm text-muted-foreground">
						Create real redeemable credit coupons for campaigns, giveaways, and
						private grants.
					</p>
				</div>
				<div className="rounded-full border border-border/60 bg-background/70 px-3 py-1 text-xs text-muted-foreground">
					Admin only
				</div>
			</div>

			<div className="mt-5 grid gap-3 sm:grid-cols-3">
				<div className="rounded-xl border border-border/60 bg-background/60 p-4">
					<div className="flex items-center gap-2 text-sm font-medium">
						<ShieldCheck className="h-4 w-4 text-emerald-400" />
						Protected flow
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						Creation uses the protected admin API route and existing auth checks.
					</p>
				</div>
				<div className="rounded-xl border border-border/60 bg-background/60 p-4">
					<div className="flex items-center gap-2 text-sm font-medium">
						<Ticket className="h-4 w-4 text-sky-400" />
						One-time by default
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						Default max redemptions is 1 so giveaway coupons stay single-use.
					</p>
				</div>
				<div className="rounded-xl border border-border/60 bg-background/60 p-4">
					<div className="flex items-center gap-2 text-sm font-medium">
						<Sparkles className="h-4 w-4 text-violet-400" />
						Stored in DB
					</div>
					<p className="mt-1 text-xs text-muted-foreground">
						Generated coupons are persisted and remain valid until redeemed or
						expired.
					</p>
				</div>
			</div>

			<div className="mt-5 flex flex-wrap gap-3">
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button>Create Coupon</Button>
					</DialogTrigger>
					<DialogContent className="sm:max-w-xl">
						<DialogHeader>
							<DialogTitle>Create Credit Coupon</DialogTitle>
							<DialogDescription>
								Set the credit amount, optionally choose a code, and generate a
								valid coupon users can redeem from the dashboard.
							</DialogDescription>
						</DialogHeader>
						<form onSubmit={handleGenerate} className="space-y-4">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="space-y-2">
									<Label htmlFor="creditAmount">Credit amount (USD)</Label>
									<Input
										id="creditAmount"
										type="number"
										min="0.01"
										step="0.01"
										value={creditAmount}
										onChange={(e) => setCreditAmount(e.target.value)}
										placeholder="100"
										required
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor="maxRedemptions">Max redemptions</Label>
									<Input
										id="maxRedemptions"
										type="number"
										min="1"
										step="1"
										value={maxRedemptions}
										onChange={(e) => setMaxRedemptions(e.target.value)}
										placeholder="1"
										required
									/>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="customCode">Coupon code (optional)</Label>
								<Input
									id="customCode"
									value={customCode}
									onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
									placeholder="Example: KIWI-LAUNCH-100"
								/>
								<p className="text-xs text-muted-foreground">
									Leave blank to auto-generate a secure coupon code.
								</p>
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description (optional)</Label>
								<Input
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Example: Creator giveaway coupon"
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="expiresAt">Expires at (optional)</Label>
								<Input
									id="expiresAt"
									type="datetime-local"
									value={expiresAt}
									onChange={(e) => setExpiresAt(e.target.value)}
								/>
							</div>

							{error ? (
								<div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
									{error}
								</div>
							) : null}

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => setOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={loading}>
									{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
									Generate Coupon
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{createdCoupon ? (
				<div className="mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-emerald-200/80">
								Last created coupon
							</p>
							<p className="mt-2 text-xl font-semibold">{createdCoupon.code}</p>
							<p className="mt-1 text-sm text-muted-foreground">
								${createdCoupon.creditAmount} credits • {createdCoupon.maxRedemptions} redemption
								{createdCoupon.maxRedemptions > 1 ? "s" : ""}
							</p>
							{createdCoupon.description ? (
								<p className="mt-1 text-xs text-muted-foreground">
									{createdCoupon.description}
								</p>
							) : null}
						</div>
						<Button
							variant="outline"
							className="shrink-0"
							onClick={() => handleCopy(createdCoupon.code)}
						>
							<Copy className="h-4 w-4" />
							Copy Code
						</Button>
					</div>
				</div>
			) : null}
		</div>
	);
}
