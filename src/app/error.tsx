"use client";

export default function Error({
	reset,
}: {
	error: Error & { digest?: string; };
	reset: () => void;
}) {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
			<div className="w-full max-w-md text-center">
				<h1 className="text-3xl font-bold">Something went wrong</h1>

				<p className="mt-4 opacity-70">
					An unexpected error occurred. Please try again.
				</p>

				<button
					onClick={() => reset()}
					className="mt-8 border border-foreground bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-background hover:text-foreground"
				>
					Try again
				</button>
			</div>
		</main>
	);
}
