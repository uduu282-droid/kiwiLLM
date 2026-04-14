"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Github, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePostHog } from "posthog-js/react";
import { useState, useEffect } from "react";
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

const createFormSchema = (isHosted: boolean) =>
	z.object({
		email: isHosted
			? z
					.string()
					.email({
						message: "Please enter a valid email address",
					})
					.refine((email) => !email.split("@")[0]?.includes("+"), {
						message: "Email addresses with '+' are not allowed",
					})
			: z.string().email({
					message: "Please enter a valid email address",
				}),
		password: z.string().min(8, {
			message: "Password must be at least 8 characters",
		}),
	});

export default function Signup() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const posthog = usePostHog();
	const [loadingState, setLoadingState] = useState<
		null | "email" | "github" | "google"
	>(null);
	const [isRecoveringSession, setIsRecoveringSession] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const { signUp, signIn } = useAuth();
	const authClient = useAuthClient();
	const config = useAppConfig();
	const { user, isLoading: isUserLoading } = useUser({
		redirectTo: "/dashboard",
		redirectWhen: "authenticated",
	});
	const isBootstrappingAuth =
		loadingState === null &&
		!!authClient.currentSession &&
		(isRecoveringSession || !authClient.isReady || isUserLoading || !!user);
	const isLoading = loadingState !== null || isBootstrappingAuth;

	const loadingMessage = isBootstrappingAuth
		? "Finishing sign in and loading your dashboard..."
		: loadingState === "google"
			? "Redirecting to Google and creating your workspace..."
			: loadingState === "github"
				? "Redirecting to GitHub and creating your workspace..."
				: "Creating your account and preparing your workspace...";

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
						`Failed to sign up with ${provider === "github" ? "GitHub" : "Google"}`,
					variant: "destructive",
				});
				setLoadingState(null);
			}
		} catch {
			toast({
				title: `Failed to sign up with ${provider === "github" ? "GitHub" : "Google"}`,
				variant: "destructive",
			});
			setLoadingState(null);
		}
	};

	const formSchema = createFormSchema(config.hosted);

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

				await queryClient.invalidateQueries();
			})
			.catch((error: unknown) => {
				console.error(
					"Failed to recover server session from signup page",
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
	}, [authClient, authClient.currentSession, isUserLoading, queryClient, user]);

	useEffect(() => {
		posthog.capture("page_viewed_signup");
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

		const { error } = await signUp.email(
			{
				name: "",
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
					posthog.capture("user_signed_up", {
						email: values.email,
					});
					toast({
						title: "Account created",
						description: ctx.data.requiresEmailVerification
							? "Please check your email to verify your account."
							: "Your account is ready.",
					});
					window.location.replace(
						ctx.data.requiresEmailVerification ? "/login" : "/dashboard",
					);
				},
				onError: (ctx) => {
					toast({
						title: ctx?.error?.message ?? "Failed to sign up",
						variant: "destructive",
					});
				},
			},
		);

		if (error) {
			toast({
				title: error.message ?? "Failed to sign up",
				variant: "destructive",
			});
			setLoadingState(null);
		}
	}

	return (
		<div className="px-4 sm:px-0 max-w-[64rem] mx-auto flex min-h-screen w-screen flex-col items-center justify-center py-10">
			<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
				<div className="flex flex-col space-y-2 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">
						Create your free account
					</h1>
					<p className="text-sm text-muted-foreground">
						No credit card required
					</p>
					{isLoading ? (
						<div className="rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-left text-sm text-muted-foreground">
							<div className="flex items-center gap-2 font-medium text-foreground">
								<Loader2 className="h-4 w-4 animate-spin" />
								Working on it
							</div>
							<p className="mt-1 text-xs leading-relaxed">
								{loadingMessage} First-time setup can take a few seconds while
								we create your account, sync your workspace, and load the
								dashboard.
							</p>
						</div>
					) : null}
				</div>
				<div className="grid grid-cols-1 gap-3">
					{config.googleAuth && (
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
							Continue with Google
						</Button>
					)}
					{config.githubAuth && (
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
							Continue with GitHub
						</Button>
					)}
				</div>
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<span className="w-full border-t" />
					</div>
					<div className="relative flex justify-center text-xs uppercase">
						<span className="bg-background px-2 text-muted-foreground">
							Or continue with email
						</span>
					</div>
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
											autoComplete="email"
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
												autoComplete="new-password"
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
									<p className="text-xs text-muted-foreground">
										Minimum 8 characters
									</p>
									<FormMessage />
								</FormItem>
							)}
						/>
						<Button type="submit" className="w-full" disabled={isLoading}>
							{isLoading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Creating account...
								</>
							) : (
								"Start free"
							)}
						</Button>
					</form>
				</Form>
				<p className="px-8 text-center text-sm text-muted-foreground">
					<Link
						href="/login"
						className="hover:text-brand underline underline-offset-4"
					>
						Already have an account? Sign in
					</Link>
				</p>
				<div className="pt-4 border-t">
					<p className="text-xs text-center text-muted-foreground">
						Trusted by developers building AI-powered applications
					</p>
				</div>
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
