"use client";

import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/apiHandler";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type FormData = {
	email: string;
	password: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function LoginPage() {
	const [formData, setFormData] = useState<FormData>({
		email: "",
		password: "",
	});
	const { refreshUser } = useAuth();

	const [errors, setErrors] = useState<FormErrors>({});
	const [apiError, setApiError] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const router = useRouter();

	function handleChange(field: keyof FormData, value: string) {
		setFormData((previous) => ({
			...previous,
			[field]: value,
		}));

		setErrors((previous) => ({
			...previous,
			[field]: "",
		}));

		setApiError("");
	}

	function validate(): FormErrors {
		const newErrors: FormErrors = {};

		if (!formData.email.trim()) {
			newErrors.email = "Email is required.";
		}
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Please enter a valid email address.";
		}

		if (!formData.password) {
			newErrors.password = "Password is required.";
		}

		return newErrors;
	}

	async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		setApiError("");

		const validationErrors = validate();

		if (Object.keys(validationErrors).length > 0) {
			setErrors(validationErrors);
			return;
		}

		setIsSubmitting(true);

		try {
			const response = await apiRequest("/api/v1/auth/login", {
				method: "POST",
				body: JSON.stringify({
					email: formData.email.trim(),
					password: formData.password,
				}),
			});

			if (!response.success) {
				setApiError(response.message);
				setIsSubmitting(false);
				return;
			}

			console.log("Login successful:", response.data);
			await refreshUser();

			router.push("/my-courses");
		}
		catch {
			setApiError(
				"Unable to connect to the server. Please try again.",
			);
		}
	}

	useEffect(() => {
		async function checkAuthentication() {
			try {
				const response = await apiRequest("/api/v1/auth/profile");

				if (response.success) {
					router.replace("/my-courses");
				}
			}
			catch {
				// User is not authenticated so don't do anything.
			}
		}

		function handlePageShow(event: PageTransitionEvent) {
			if (event.persisted) {
				checkAuthentication();
			}
		}

		checkAuthentication();

		window.addEventListener("pageshow", handlePageShow);

		return () => {
			window.removeEventListener("pageshow", handlePageShow);
		};
	}, [router]);

	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
			<div className="w-full max-w-md">
				<div className="mb-8">
					<Link
						href="/"
						className="text-sm opacity-70 hover:opacity-100"
					>
						← Back to home
					</Link>

					<h1 className="mt-6 text-3xl font-bold">
						Welcome back
					</h1>

					<p className="mt-2 opacity-70">
						Login to continue learning.
					</p>
				</div>

				<form
					onSubmit={handleSubmit}
					noValidate
					className="space-y-5"
				>
					<div>
						<label
							htmlFor="email"
							className="mb-2 block text-sm font-medium"
						>
							Email
						</label>

						<input
							id="email"
							type="email"
							value={formData.email}
							onChange={(event) => handleChange("email", event.target.value)}
							className="w-full border border-foreground bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-foreground"
							placeholder="you@example.com"
							autoComplete="email"
						/>

						{errors.email && (
							<p className="mt-1 text-sm text-red-600">
								{errors.email}
							</p>
						)}
					</div>

					<div>
						<label
							htmlFor="password"
							className="mb-2 block text-sm font-medium"
						>
							Password
						</label>

						<input
							id="password"
							type="password"
							value={formData.password}
							onChange={(event) => handleChange("password", event.target.value)}
							className="w-full border border-foreground bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-foreground"
							placeholder="Enter your password"
							autoComplete="current-password"
						/>

						{errors.password && (
							<p className="mt-1 text-sm text-red-600">
								{errors.password}
							</p>
						)}
					</div>

					{apiError && (
						<div
							role="alert"
							className="border border-red-600 px-4 py-3 text-sm text-red-600"
						>
							{apiError}
						</div>
					)}

					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full border border-foreground bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? "Logging in..." : "Login"}
					</button>
				</form>

				<p className="mt-6 text-center text-sm opacity-70">
					Don&apos;t have an account?{" "}
					<Link
						href="/register"
						className="font-medium text-foreground underline"
					>
						Register
					</Link>
				</p>
			</div>
		</main>
	);
}
