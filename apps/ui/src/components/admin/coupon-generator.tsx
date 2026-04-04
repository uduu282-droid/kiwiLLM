"use client";

import {
	Copy,
	Gift,
	Loader2,
	ShieldCheck,
	Sparkles,
	Ticket,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/lib/components/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/lib/components/dialog";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { useFetchClient } from "@/lib/fetch-client";

interface CreatedCoupon {
	code: string;
	creditAmount: string;
	maxRedemptions: number;
	description: string | null;
	expiresAt: string | null;
}

export function AdminCouponGenerator() {
	const $api = useFetchClient();
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [creditAmount, setCreditAmount] = useState("100");
	const [customCode, setCustomCode] = useState("");
	const [description, setDescription] = useState("");
	const [maxRedemptions, setMaxRedemptions] = useState("1");
	const [expiresAt, setExpiresAt] = useState("");
	const [createdCoupon, setCreatedCoupon] = useState<CreatedCoupon | null>(
		null,
	);
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
			expiresAt: coupon.expiresAt
				? new Date(coupon.expiresAt).toISOString()
				: null,
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
		<div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.28)]">
			<div className="flex items-start justify-between gap-4">
				<div>
					<div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10 text-emerald-300">
						<Gift className="h-5 w-5" />
					</div>
					<h3 className="mt-4 text-xl font-semibold text-white">
						Coupon Generator
					</h3>
					<p className="mt-2 max-w-2xl text-sm text-white/60">
						Create real redeemable credit coupons for giveaways, launch offers,
						and private grants without leaving the main dashboard.
					</p>
				</div>
				<div className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs text-white/55">
					Admin only
				</div>
			</div>

			<div className="mt-5 grid gap-3 lg:grid-cols-3">
				<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
					<div className="flex items-center gap-2 text-sm font-medium text-white">
						<ShieldCheck className="h-4 w-4 text-emerald-300" />
						Protected flow
					</div>
					<p className="mt-1 text-xs text-white/55">
						Uses the real protected admin API route and existing allowlist
						checks.
					</p>
				</div>
				<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
					<div className="flex items-center gap-2 text-sm font-medium text-white">
						<Ticket className="h-4 w-4 text-sky-300" />
						One-time by default
					</div>
					<p className="mt-1 text-xs text-white/55">
						Default max redemptions is 1 so campaign coupons stay single-use.
					</p>
				</div>
				<div className="rounded-2xl border border-white/10 bg-black/20 p-4">
					<div className="flex items-center gap-2 text-sm font-medium text-white">
						<Sparkles className="h-4 w-4 text-violet-300" />
						Persisted in DB
					</div>
					<p className="mt-1 text-xs text-white/55">
						Coupons stay valid until redeemed, disabled, or expired.
					</p>
				</div>
			</div>

			<div className="mt-5 flex flex-wrap gap-3">
				<Dialog open={open} onOpenChange={setOpen}>
					<DialogTrigger asChild>
						<Button className="bg-white text-black hover:bg-white/90">
							Create Coupon
						</Button>
					</DialogTrigger>
					<DialogContent className="border-white/10 bg-neutral-950 text-white sm:max-w-xl">
						<DialogHeader>
							<DialogTitle>Create Credit Coupon</DialogTitle>
							<DialogDescription className="text-white/60">
								Set the amount, optionally choose a custom code, and generate a
								valid redeemable coupon.
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
							</div>

							<div className="space-y-2">
								<Label htmlFor="description">Description (optional)</Label>
								<Input
									id="description"
									value={description}
									onChange={(e) => setDescription(e.target.value)}
									placeholder="Example: Launch giveaway"
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
								<div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
									{error}
								</div>
							) : null}

							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									className="border-white/10 bg-transparent text-white hover:bg-white/10"
									onClick={() => setOpen(false)}
								>
									Cancel
								</Button>
								<Button type="submit" disabled={loading}>
									{loading ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : null}
									Generate Coupon
								</Button>
							</DialogFooter>
						</form>
					</DialogContent>
				</Dialog>
			</div>

			{createdCoupon ? (
				<div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
					<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
						<div>
							<p className="text-xs font-medium uppercase tracking-wide text-emerald-200/80">
								Last created coupon
							</p>
							<p className="mt-2 text-xl font-semibold text-white">
								{createdCoupon.code}
							</p>
							<p className="mt-1 text-sm text-white/70">
								${createdCoupon.creditAmount} credits •{" "}
								{createdCoupon.maxRedemptions} redemption
								{createdCoupon.maxRedemptions > 1 ? "s" : ""}
							</p>
							{createdCoupon.description ? (
								<p className="mt-1 text-xs text-white/55">
									{createdCoupon.description}
								</p>
							) : null}
						</div>
						<Button
							variant="outline"
							className="shrink-0 border-white/10 bg-transparent text-white hover:bg-white/10"
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
