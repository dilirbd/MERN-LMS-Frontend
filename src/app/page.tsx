import Link from "next/link";

export default function Home() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
			<div className="w-full max-w-md text-center">
				<h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
					DDR LMS
				</h1>

				<p className="mt-4 text-base opacity-70 sm:text-lg">
					A simple learning management system.
				</p>

				<div className="mt-8 flex flex-col gap-8 sm:flex-row sm:justify-center">
					<Link
						href="/login"
						className="border border-foreground px-6 py-3 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
					>
						Login
					</Link>

					<Link
						href="/register"
						className="border border-foreground bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-background hover:text-foreground"
					>
						Register
					</Link>
				</div>
			</div>
		</main>
	);
}
