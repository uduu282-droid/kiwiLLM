"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Github, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUser } from "@/hooks/useUser";
import { useAuth, useAuthClient } from "@/lib/auth-client";
import { Button } from "@/lib/components/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/lib/components/form";
import { Input } from "@/lib/components/input";
import { toast } from "@/lib/components/use-toast";
import { useAppConfig } from "@/lib/config";

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

const formSchema = z.object({
	email: z.string().email({
		message: "Please enter a valid email address",
	}),
	password: z.string().min(8, {
		message: "Password must be at least 8 characters",
	}),
});

export default function Login() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const searchParams = useSearchParams();
	const posthog = usePostHog();
	const [loadingState, setLoadingState] = useState<
		null | "email" | "github" | "google"
	>(null);
	const [isRecoveringSession, setIsRecoveringSession] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const { signIn } = useAuth();
	const authClient = useAuthClient();
	const { githubAuth, googleAuth } = useAppConfig();
	const shouldResumeAuth = searchParams.get("resumeAuth") === "true";
	const resumeAuthTarget = searchParams.get("next") ?? "/dashboard";
	const [resumeAuthTimedOut, setResumeAuthTimedOut] = useState(false);
	const { user, isLoading: isUserLoading } = useUser({
		redirectTo: "/dashboard",
		redirectWhen: "authenticated",
		checkOnboarding: true,
	});
	const isResumeAuthPending = shouldResumeAuth && !resumeAuthTimedOut;
	const isBootstrappingAuth =
		loadingState === null &&
		(isResumeAuthPending ||
			(!!authClient.currentSession &&
				(isRecoveringSession ||
					!authClient.isReady ||
					isUserLoading ||
					!!user)));
	const isLoading = loadingState !== null || isBootstrappingAuth;

	const loadingMessage = isBootstrappingAuth
		? "Finishing sign in and loading your dashboard..."
		: loadingState === "google"
			? "Redirecting to Google and preparing your dashboard..."
			: loadingState === "github"
				? "Redirecting to GitHub and preparing your dashboard..."
				: "Signing you in and preparing your dashboard...";

	const signInWithSocial = async (provider: "github" | "google") => {
		setLoadingState(provider);
		try {
			const res = await signIn.social({
				provider,
				callbackURL:
					location.protocol +
					"//" +
					location.host +
					"/auth/callback?next=/dashboard",
			});
			if (res?.error) {
				toast({
					title:
						res.error.message ??
						`Failed to sign in with ${provider === "github" ? "GitHub" : "Google"}`,
					variant: "destructive",
				});
				setLoadingState(null);
			}
		} catch {
			toast({
				title: `Failed to sign in with ${provider === "github" ? "GitHub" : "Google"}`,
				variant: "destructive",
			});
			setLoadingState(null);
		}
	};

	useEffect(() => {
		if (!authClient.currentSession?.access_token || user || isUserLoading) {
			return;
		}

		let isCancelled = false;
		setIsRecoveringSession(true);

		void authClient
			.syncServerSession(authClient.currentSession)
			.then(async () => {
				if (isCancelled) {
					return;
				}

				if (shouldResumeAuth) {
					window.location.replace(resumeAuthTarget);
					return;
				}

				await queryClient.invalidateQueries();
			})
			.catch((error: unknown) => {
				console.error(
					"Failed to recover server session from login page",
					error,
				);
			})
			.finally(() => {
				if (!isCancelled) {
					setIsRecoveringSession(false);
				}
			});

		return () => {
			isCancelled = true;
		};
	}, [
		authClient,
		authClient.currentSession,
		isUserLoading,
		queryClient,
		resumeAuthTarget,
		shouldResumeAuth,
		user,
	]);

	useEffect(() => {
		if (!shouldResumeAuth || authClient.currentSession || user) {
			return;
		}

		let isCancelled = false;
		const retryDelaysMs = [0, 250, 500, 1000, 2000, 3000];

		setIsRecoveringSession(true);
		setResumeAuthTimedOut(false);

		void (async () => {
			for (const retryDelayMs of retryDelaysMs) {
				if (isCancelled) {
					return;
				}

				if (retryDelayMs > 0) {
					await sleep(retryDelayMs);
				}

				const {
					data: { session },
				} = await authClient.auth.auth.getSession();

				if (!session?.access_token) {
					continue;
				}

				await authClient.syncServerSession(session);

				if (!isCancelled) {
					window.location.replace(resumeAuthTarget);
				}
				return;
			}

			if (!isCancelled) {
				setResumeAuthTimedOut(true);
			}
		})()
			.catch((error: unknown) => {
				console.error("Failed to resume auth from login page", error);
				if (!isCancelled) {
					setResumeAuthTimedOut(true);
				}
			})
			.finally(() => {
				if (!isCancelled) {
					setIsRecoveringSession(false);
				}
			});

		return () => {
			isCancelled = true;
		};
	}, [
		authClient,
		authClient.currentSession,
		queryClient,
		resumeAuthTarget,
		shouldResumeAuth,
		user,
	]);

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
		setLoadingState("email");
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
					toast({ title: "Login successful" });
					router.push("/dashboard");
				},
				onError: (ctx) => {
					toast({
						title: ctx?.error?.message ?? "An unknown error occurred",
						variant: "destructive",
					});
				},
			},
		);

		if (error) {
			toast({
				title: error.message ?? "An unknown error occurred",
				variant: "destructive",
			});
			setLoadingState(null);
		}
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
					{isLoading ? (
						<div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-left text-sm text-muted-foreground">
							<div className="flex items-center gap-2 font-medium text-foreground">
								<Loader2 className="h-4 w-4 animate-spin" />
								Working on it
							</div>
							<p className="mt-1 text-xs leading-relaxed">
								{loadingMessage} First sign in can take a few seconds while we
								sync your account, create your workspace if needed, and load
								your dashboard.
							</p>
						</div>
					) : null}
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
											autoComplete="username"
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
										<div className="relative">
											<Input
												placeholder="••••••••"
												type={showPassword ? "text" : "password"}
												autoComplete="current-password"
												className="pr-10"
												{...field}
											/>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
												onClick={() => setShowPassword(!showPassword)}
												tabIndex={-1}
											>
												{showPassword ? (
													<EyeOff className="h-4 w-4 text-muted-foreground" />
												) : (
													<Eye className="h-4 w-4 text-muted-foreground" />
												)}
												<span className="sr-only">
													{showPassword ? "Hide password" : "Show password"}
												</span>
											</Button>
										</div>
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
					{googleAuth && (
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
					)}
					{githubAuth && (
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
					)}
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
