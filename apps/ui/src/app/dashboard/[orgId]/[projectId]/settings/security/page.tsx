"use client";

import { useState } from "react";

import { useUser, useUpdatePassword } from "@/hooks/useUser";
import { Button } from "@/lib/components/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/lib/components/card";
import { Input } from "@/lib/components/input";
import { Label } from "@/lib/components/label";
import { Separator } from "@/lib/components/separator";
import { toast } from "@/lib/components/use-toast";

function formatProviderName(providerId: string) {
	switch (providerId) {
		case "credential":
			return "Email & Password";
		case "github":
			return "GitHub";
		case "google":
			return "Google";
		default:
			return providerId;
	}
}

export default function SecurityPage() {
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const { user } = useUser();
	const updatePasswordMutation = useUpdatePassword();
	const hasCredentialAccount =
		user?.accounts?.some((account) => account.providerId === "credential") ??
		false;
	const socialProviders =
		user?.accounts?.filter((account) => account.providerId !== "credential") ??
		[];

	const handleUpdatePassword = async () => {
		if (newPassword !== confirmPassword) {
			toast({
				title: "Error",
				description: "New passwords do not match",
				variant: "destructive",
			});
			return;
		}

		try {
			await updatePasswordMutation.mutateAsync({
				body: {
					currentPassword,
					newPassword,
				},
			});

			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");

			toast({
				title: "Success",
				description: "Your password has been updated.",
			});
		} catch (error) {
			toast({
				title: "Error",
				description:
					error instanceof Error ? error.message : "An error occurred",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="flex flex-col">
			<div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
				<div className="flex items-center justify-between">
					<h2 className="text-3xl font-bold tracking-tight">Security</h2>
				</div>
				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle>Password</CardTitle>
							<CardDescription>
								{hasCredentialAccount
									? "Update your password"
									: "Password changes are only available for email/password accounts"}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{hasCredentialAccount ? (
								<>
									<div className="space-y-2">
										<Label htmlFor="current-password">Current Password</Label>
										<Input
											id="current-password"
											type="password"
											value={currentPassword}
											onChange={(e) => setCurrentPassword(e.target.value)}
										/>
									</div>
									<Separator />
									<div className="space-y-2">
										<Label htmlFor="new-password">New Password</Label>
										<Input
											id="new-password"
											type="password"
											value={newPassword}
											onChange={(e) => setNewPassword(e.target.value)}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="confirm-password">
											Confirm New Password
										</Label>
										<Input
											id="confirm-password"
											type="password"
											value={confirmPassword}
											onChange={(e) => setConfirmPassword(e.target.value)}
										/>
									</div>
								</>
							) : (
								<div className="space-y-2 text-sm text-muted-foreground">
									<p>
										This account signs in with{" "}
										{socialProviders
											.map((provider) =>
												formatProviderName(provider.providerId),
											)
											.join(", ")}
										.
									</p>
									<p>
										If you want password-based login here, we can add a
										dedicated linking flow next.
									</p>
								</div>
							)}
						</CardContent>
						{hasCredentialAccount && (
							<CardFooter>
								<Button
									onClick={handleUpdatePassword}
									disabled={updatePasswordMutation.isPending}
								>
									{updatePasswordMutation.isPending
										? "Updating..."
										: "Update Password"}
								</Button>
							</CardFooter>
						)}
					</Card>
				</div>
			</div>
		</div>
	);
}
