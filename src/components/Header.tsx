"use client";

import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function Header() {
	const router = useRouter();
	const { user, loading, logout } = useAuth();

	const [menuOpen, setMenuOpen] = useState(false);
	const [loggingOut, setLoggingOut] = useState(false);
	const [, startTransition] = useTransition();

	function closeMenu() {
		setMenuOpen(false);
	}

	async function handleLogout() {
		if (loggingOut) return;

		setLoggingOut(true);

		try {
			startTransition(async () => {
				await logout();
				setLoggingOut(false);
				setMenuOpen(false);
				router.push("/login");
				router.refresh();
			});
		}
		catch {
			setLoggingOut(false);
		}
	}

	return (
		<header className="border-b border-foreground">
			<div className="mx-auto max-w-7xl px-4">
				<div className="flex items-center justify-between py-4">
					<Link
						href="/"
						onClick={closeMenu}
						className="text-xl font-bold"
					>
						DDS LMS
					</Link>

					{!loading && (
						<nav className="hidden items-center gap-5 text-sm sm:flex">
							<Link
								href="/courses"
								className="hover:underline"
							>
								Browse Courses
							</Link>

							{user
								? (
									<>
										<Link
											href="/my-courses"
											className="hover:underline"
										>
											My Courses
										</Link>

										<Link
											href="/profile"
											className="hover:underline"
										>
											Profile
										</Link>

										<button
											type="button"
											onClick={handleLogout}
											disabled={loggingOut}
											className="hover:underline disabled:cursor-not-allowed disabled:opacity-50"
										>
											{loggingOut
												? "Logging out..."
												: "Logout"}
										</button>
									</>
								)
								: (
									<>
										<Link
											href="/login"
											className="hover:underline"
										>
											Login
										</Link>

										<Link
											href="/register"
											className="hover:underline"
										>
											Register
										</Link>
									</>
								)}
						</nav>
					)}

					{!loading && (
						<button
							type="button"
							aria-label={menuOpen
								? "Close navigation menu"
								: "Open navigation menu"}
							aria-expanded={menuOpen}
							onClick={() => setMenuOpen((open) => !open)}
							className="border border-foreground px-3 py-2 text-sm sm:hidden"
						>
							{menuOpen ? "Close" : "Menu"}
						</button>
					)}
				</div>

				{!loading && menuOpen && (
					<nav className="border-t border-foreground py-4 sm:hidden">
						<div className="flex flex-col">
							<Link
								href="/courses"
								onClick={closeMenu}
								className="border-b border-foreground py-3"
							>
								Browse Courses
							</Link>

							{user
								? (
									<>
										<Link
											href="/my-courses"
											onClick={closeMenu}
											className="border-b border-foreground py-3"
										>
											My Courses
										</Link>

										<Link
											href="/profile"
											onClick={closeMenu}
											className="border-b border-foreground py-3"
										>
											Profile
										</Link>

										<button
											type="button"
											onClick={handleLogout}
											disabled={loggingOut}
											className="py-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
										>
											{loggingOut
												? "Logging out..."
												: "Logout"}
										</button>
									</>
								)
								: (
									<>
										<Link
											href="/login"
											onClick={closeMenu}
											className="border-b border-foreground py-3"
										>
											Login
										</Link>

										<Link
											href="/register"
											onClick={closeMenu}
											className="py-3"
										>
											Register
										</Link>
									</>
								)}
						</div>
					</nav>
				)}
			</div>
		</header>
	);
}
