"use client";

import { apiRequest } from "@/lib/apiHandler";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type FormData = {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
	address?: string;
	role: "student" | "instructor";
};

type FormErrors = Partial<Record<keyof FormData, string>>;

export default function RegisterPage() {
	const [formData, setFormData] = useState<FormData>({
		name: "",
		email: "",
		password: "",
		confirmPassword: "",
		address: "",
		role: "student",
	});

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

		if (!formData.name.trim()) {
			newErrors.name = "Name is required.";
		}
		else if (formData.name.trim().length < 2) {
			newErrors.name = "Name must be at least 2 characters.";
		}

		if (!formData.email.trim()) {
			newErrors.email = "Email is required.";
		}
		else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			newErrors.email = "Please enter a valid email address.";
		}

		if (!formData.password) {
			newErrors.password = "Password is required.";
		}
		else if (formData.password.length < 8) {
			newErrors.password = "Password must be at least 8 characters.";
		}
		else if (formData.password.length > 49) {
			newErrors.password = "Password must be less than 50 characters.";
		}

		if (!formData.confirmPassword) {
			newErrors.confirmPassword = "Please confirm your password.";
		}
		else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = "Passwords do not match.";
		}

		if (formData.address && formData.address.trim().length > 200) {
			newErrors.address = "Address must not exceed 200 characters.";
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
			const addr = (formData.address) ? formData.address.trim() : undefined;
			const response = await apiRequest("/api/v1/auth/register", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name: formData.name.trim(),
					email: formData.email.trim(),
					password: formData.password,
					...(addr && formData.address && { address: formData.address.trim() }),
					role: formData.role,
				}),
			});

			if (!response.success) {
				console.log(response.message);
				if (response.data) console.log(response.data);
				setApiError(response.message);
				setIsSubmitting(false);
				return;
			}

			console.log("Registration successful:", response.message);

			router.push("/login");
		}
		catch {
			setApiError(
				"Unable to connect to the server. Please try again.",
			);
		}
	}

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
						Create an account
					</h1>

					<p className="mt-2 opacity-70">
						Register to start learning.
					</p>
				</div>

				<form
					onSubmit={(event) => handleSubmit(event)}
					noValidate
					className="space-y-5"
				>
					<div>
						<label
							htmlFor="name"
							className="mb-2 block text-sm font-medium"
						>
							Name
						</label>

						<input
							id="name"
							type="text"
							value={formData.name}
							onChange={(event) => handleChange("name", event.target.value)}
							className="w-full border border-foreground bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-foreground"
							placeholder="Your name"
							autoComplete="name"
						/>

						{errors.name && (
							<p className="mt-1 text-sm text-red-600">
								{errors.name}
							</p>
						)}
					</div>

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
							placeholder="At least 8 characters"
							autoComplete="new-password"
						/>

						{errors.password && (
							<p className="mt-1 text-sm text-red-600">
								{errors.password}
							</p>
						)}
					</div>

					<div>
						<label
							htmlFor="confirmPassword"
							className="mb-2 block text-sm font-medium"
						>
							Confirm password
						</label>

						<input
							id="confirmPassword"
							type="password"
							value={formData.confirmPassword}
							onChange={(event) => handleChange("confirmPassword", event.target.value)}
							className="w-full border border-foreground bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-foreground"
							placeholder="Enter your password again"
							autoComplete="new-password"
						/>

						{errors.confirmPassword && (
							<p className="mt-1 text-sm text-red-600">
								{errors.confirmPassword}
							</p>
						)}
					</div>

					<div>
						<label
							htmlFor="address"
							className="mb-2 block text-sm font-medium"
						>
							Address
						</label>

						<input
							id="address"
							type="text"
							value={formData.address}
							onChange={(event) => handleChange("address", event.target.value)}
							className="w-full border border-foreground bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-foreground"
							placeholder="Your address"
							autoComplete="street-address"
						/>

						{errors.address && (
							<p className="mt-1 text-sm text-red-600">
								{errors.address}
							</p>
						)}
					</div>

					<div>
						<label
							htmlFor="role"
							className="mb-2 block text-sm font-medium"
						>
							Register as
						</label>

						<select
							id="role"
							value={formData.role}
							onChange={(event) => handleChange("role", event.target.value)}
							className="w-full border border-foreground bg-background px-3 py-3 outline-none focus:ring-2 focus:ring-foreground"
						>
							<option value="student">Student</option>
							<option value="instructor">Instructor</option>
						</select>

						{errors.role && (
							<p className="mt-1 text-sm text-red-600">
								{errors.role}
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
						{isSubmitting ? "Creating account..." : "Create account"}
					</button>
				</form>

				<p className="mt-6 text-center text-sm opacity-70">
					Already have an account?{" "}
					<Link
						href="/login"
						className="font-medium text-foreground underline"
					>
						Login
					</Link>
				</p>
			</div>
		</main>
	);
}
