"use client";

import { Suspense } from "react";
import { VerifyEmailContent } from "./VerifyEmailContent";

function Loading() {
	return (
		<main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
			<p>Verifying email...</p>
		</main>
	);
}

export default function VerifyEmailPage() {
	return (
		<Suspense fallback={<Loading />}>
			<VerifyEmailContent />
		</Suspense>
	);
}
