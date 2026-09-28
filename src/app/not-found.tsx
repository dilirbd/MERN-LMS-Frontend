import Link from "next/link";

export default function NotFound() {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
			<div className="w-full max-w-md text-center">
				<p className="text-sm font-medium opacity-70">404</p>

				<h1 className="mt-2 text-3xl font-bold">Page not found</h1>

				<p className="mt-4 opacity-70">
					The page you&#39;re looking for doesn&#39;t exist.
				</p>

				<Link
					href="/"
					className="mt-8 inline-block border border-foreground px-6 py-3 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
				>
					Go home
				</Link>
			</div>
		</main>
	);
}
