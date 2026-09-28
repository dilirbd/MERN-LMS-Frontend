"use client";

import { apiRequest } from "@/lib/apiHandler";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type VerificationStatus = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [status, setStatus] = useState<VerificationStatus>("verifying");
	const [message, setMessage] = useState(
		"Verifying your email address...",
	);
	const hasRequested = useRef(false);

	useEffect(() => {
		if (hasRequested.current) {
			return;
		}
		hasRequested.current = true;

		async function verifyEmail() {
			if (!token) {
				setStatus("error");
				setMessage("Verification token is missing.");
				return;
			}

			try {
				const response = await apiRequest(
					`/api/v1/auth/register/verify/${encodeURIComponent(token)}`,
					{
						method: "GET",
					},
				);

				if (!response.success) {
					setStatus("error");
					setMessage(
						response.message
							|| "Email verification failed.",
					);
					return;
				}

				setStatus("success");
				setMessage(
					response.message
						|| "Your email has been verified successfully.",
				);
			}
			catch {
				setStatus("error");
				setMessage(
					"Unable to verify your email. Please try again.",
				);
			}
		}

		verifyEmail();
	}, [token]);

	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-6 py-12 text-foreground">
			<div className="w-full max-w-md text-center">
				{status === "verifying" && (
					<>
						<p className="text-sm font-medium opacity-70">
							Please wait
						</p>

						<h1 className="mt-2 text-3xl font-bold">
							Verifying your email
						</h1>

						<p className="mt-4 opacity-70">
							{message}
						</p>
					</>
				)}

				{status === "success" && (
					<>
						<p className="text-sm font-medium opacity-70">
							Success
						</p>

						<h1 className="mt-2 text-3xl font-bold">
							Email verified
						</h1>

						<p className="mt-4 opacity-70">
							{message}
						</p>

						<Link
							href="/login"
							className="mt-8 inline-block border border-foreground bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-background hover:text-foreground"
						>
							Go to login
						</Link>
					</>
				)}

				{status === "error" && (
					<>
						<p className="text-sm font-medium opacity-70">
							Verification failed
						</p>

						<h1 className="mt-2 text-3xl font-bold">
							Unable to verify email
						</h1>

						<p className="mt-4 opacity-70">
							{message}
						</p>

						<div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
							<Link
								href="/login"
								className="border border-foreground px-6 py-3 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
							>
								Go to login
							</Link>

							<Link
								href="/"
								className="border border-foreground px-6 py-3 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
							>
								Back to home
							</Link>
						</div>
					</>
				)}
			</div>
		</main>
	);
}
