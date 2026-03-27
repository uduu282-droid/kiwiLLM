"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Github, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod/v3";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUser } from "@/hooks/useUser";
import { useAuth } from "@/lib/auth-client";
import { useAppConfig } from "@/lib/config";

const formSchema = z.object({
	email: z.string().email({ message: "Please enter a valid email address" }),
	password: z
		.string()
		.min(8, { message: "Password must be at least 8 characters" }),
});

function getSafeRedirectUrl(url: string | null): string {
	if (!url) {
		return "/";
	}
	if (url.startsWith("/") && !url.startsWith("//")) {
		return url;
	}
	return "/";
}

export default function Login() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const searchParams = useSearchParams();
	const posthog = usePostHog();
	const [isLoading, setIsLoading] = useState(false);
	const { signIn } = useAuth();
	const { githubAuth, googleAuth } = useAppConfig();
	const returnUrl = getSafeRedirectUrl(searchParams.get("returnUrl"));

	const signInWithSocial = async (provider: "github" | "google") => {
		setIsLoading(true);
		try {
			const result = await signIn.social({
				provider,
				callbackURL: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`,
			});

			if (result?.error) {
				toast.error(
					result.error.message ??
						`Failed to sign in with ${provider === "github" ? "GitHub" : "Google"}`,
					{
						style: {
							backgroundColor: "var(--destructive)",
							color: "var(--destructive-foreground)",
						},
					},
				);
			}
		} finally {
			setIsLoading(false);
		}
	};

	useUser({
		redirectTo: returnUrl,
		redirectWhen: "authenticated",
	});

	useEffect(() => {
		posthog.capture("page_viewed_login");
	}, [posthog]);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);
		const { error } = await signIn.email(
			{
				email: values.email,
				password: values.password,
			},
			{
				onSuccess: (ctx) => {
					queryClient.clear();
					posthog.identify(ctx.data.user.id, {
						email: ctx.data.user.email,
						name: ctx.data.user.name,
					});
					posthog.capture("user_logged_in", {
						method: "email",
						email: values.email,
					});
					toast.success("Login successful");
					router.push(returnUrl);
				},
				onError: (ctx) => {
					toast.error(ctx.error.message ?? "An unknown error occurred", {
						style: {
							backgroundColor: "var(--destructive)",
							color: "var(--destructive-foreground)",
						},
					});
				},
			},
		);

		if (error) {
			toast.error(error.message ?? "An unknown error occurred", {
				style: {
					backgroundColor: "var(--destructive)",
					color: "var(--destructive-foreground)",
				},
			});
		}

		setIsLoading(false);
	}

	return (
		<div className="px-4 sm:px-0 max-w-[64rem] mx-auto flex h-screen w-screen flex-col items-center justify-center">
			<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
				<div className="flex flex-col space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">
						Welcome back
					</h1>
					<p className="text-sm text-muted-foreground">
						Enter your email and password to sign in to your account
					</p>
				</div>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="email"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Email</FormLabel>
									<FormControl>
										<Input
											placeholder="name@example.com"
											type="email"
											autoComplete="username webauthn"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											placeholder="••••••••"
											type="password"
											autoComplete="current-password webauthn"
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Signing in...
								</>
							) : (
								"Sign in"
							)}
						</Button>
					</form>
				</Form>
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">Or</span>
					</div>
				</div>
				<div className="grid grid-cols-1 gap-3">
					{googleAuth ? (
						<Button
							onClick={async () => {
								await signInWithSocial("google");
							}}
							variant="outline"
							className="w-full"
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<GoogleIcon className="mr-2 h-4 w-4" />
							)}
							Sign in with Google
						</Button>
					) : null}
					{githubAuth ? (
						<Button
							onClick={async () => {
								await signInWithSocial("github");
							}}
							variant="outline"
							className="w-full"
							disabled={isLoading}
						>
							{isLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Github className="mr-2 h-4 w-4" />
							)}
							Sign in with GitHub
						</Button>
					) : null}
				</div>
				<p className="px-8 text-center text-sm text-muted-foreground">
					<Link
						href="/signup"
						className="hover:text-primary underline underline-offset-4"
					>
						Don&apos;t have an account? Sign up
					</Link>
				</p>
			</div>
		</div>
	);
}

function GoogleIcon({ className }: { className?: string }) {
	return (
		<svg
			viewBox="0 0 24 24"
			aria-hidden="true"
			className={className}
			fill="none"
		>
			<path
				d="M21.805 12.23c0-.68-.061-1.334-.174-1.963H12v3.714h5.498a4.703 4.703 0 0 1-2.04 3.086v2.565h3.304c1.934-1.781 3.043-4.406 3.043-7.402Z"
				fill="#4285F4"
			/>
			<path
				d="M12 22c2.76 0 5.073-.914 6.763-2.468l-3.304-2.565c-.914.612-2.083.974-3.459.974-2.659 0-4.912-1.795-5.717-4.209H2.867v2.645A10.215 10.215 0 0 0 12 22Z"
				fill="#34A853"
			/>
			<path
				d="M6.283 13.732A6.14 6.14 0 0 1 5.963 12c0-.602.109-1.186.32-1.732V7.623H2.867A10.215 10.215 0 0 0 1.8 12c0 1.64.393 3.192 1.067 4.377l3.416-2.645Z"
				fill="#FBBC05"
			/>
			<path
				d="M12 6.06c1.5 0 2.848.517 3.908 1.53l2.93-2.93C17.068 3.012 14.755 2 12 2a10.215 10.215 0 0 0-9.133 5.623l3.416 2.645C7.088 7.855 9.341 6.06 12 6.06Z"
				fill="#EA4335"
			/>
		</svg>
	);
}
