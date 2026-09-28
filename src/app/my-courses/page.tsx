"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/apiHandler";

type Enrollment = {
	_id: string;
	title: string;
	description: string;
	thumbnail?: string;
	instructor: string;
	enrolledAt?: string;
	added?: string;
	updated?: string;
	status?: "draft" | "published";
	progress?: {
		totalLessons: number;
		completedLessons: number;
		percentage: number;
	};
};

type EnrollmentResponse = {
	courses: Enrollment[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
};

export default function DashboardPage() {
	const { user, loading } = useAuth();

	const [enrollments, setEnrollments] = useState<Enrollment[] | null>(null);
	const [error, setError] = useState("");

	const [search, setSearch] = useState("");
	const [submittedSearch, setSubmittedSearch] = useState("");

	const [sort, setSort] = useState("newest");
	const [status, setStatus] = useState("");

	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);

	useEffect(() => {
		if (!user) return;

		let cancelled = false;

		async function loadEnrollments() {
			const params = new URLSearchParams({
				page: page.toString(),
				limit: "12",
				sort,
			});

			if (submittedSearch) {
				params.set("search", submittedSearch);
			}

			if (user?.role === "instructor" && status) {
				params.set("status", status);
			}

			const response = await apiRequest<EnrollmentResponse>(
				`/api/v1/courses/my-courses?${params.toString()}`,
			);

			if (cancelled) return;

			if (!response.success || !response.data) {
				setError(
					response.message || "Failed to load your courses.",
				);
				setEnrollments([]);
				return;
			}

			setEnrollments(response.data.courses);
			setTotalPages(response.data.pagination.totalPages);
			setError("");
		}

		loadEnrollments();

		return () => {
			cancelled = true;
		};
	}, [user, page, sort, status, submittedSearch]);

	function handleSearch(event: React.SubmitEvent) {
		event.preventDefault();

		setPage(1);
		setSubmittedSearch(search.trim());
	}

	function handleSortChange(value: string) {
		setSort(value);
		setPage(1);
	}

	function handleStatusChange(value: string) {
		setStatus(value);
		setPage(1);
	}

	if (loading) {
		return (
			<main className="mx-auto max-w-7xl px-4 py-12">
				<p>Loading...</p>
			</main>
		);
	}

	if (!user) {
		return (
			<main className="mx-auto max-w-7xl px-4 py-12">
				<h1 className="text-3xl font-bold">
					My Courses
				</h1>

				<p className="mt-4">
					Please log in to view your courses.
				</p>

				<Link
					href="/login"
					className="mt-6 inline-block border border-foreground px-5 py-3 font-medium hover:bg-foreground hover:text-background"
				>
					Login
				</Link>
			</main>
		);
	}

	const isInstructor = user.role === "instructor";

	return (
		<main className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
			<div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
				<div>
					<h1 className="text-3xl font-bold">
						My Courses
					</h1>

					<p className="mt-2 text-gray-600">
						{isInstructor
							? "Manage your courses and content."
							: "Continue where you left off."}
					</p>
				</div>

				{isInstructor && (
					<Link
						href="/my-courses/new"
						className="border border-foreground bg-foreground px-5 py-3 text-center font-medium text-background hover:bg-background hover:text-foreground"
					>
						Create Course
					</Link>
				)}
			</div>

			<div className="mt-8 flex flex-col gap-4">
				<form
					onSubmit={handleSearch}
					className="flex flex-col gap-3 sm:flex-row"
				>
					<input
						type="search"
						value={search}
						onChange={(event) => setSearch(event.target.value)}
						placeholder="Search courses..."
						className="min-w-0 flex-1 border border-foreground px-4 py-3 outline-none"
					/>

					<button
						type="submit"
						className="border border-foreground px-6 py-3 font-medium hover:bg-foreground hover:text-background"
					>
						Search
					</button>
				</form>

				<div className="flex flex-col gap-3 sm:flex-row">
					<select
						value={sort}
						onChange={(event) => handleSortChange(event.target.value)}
						className="border border-foreground px-4 py-3"
					>
						<option value="newest">Newest</option>
						<option value="oldest">Oldest</option>
						<option value="title_asc">
							Title: A-Z
						</option>
						<option value="title_desc">
							Title: Z-A
						</option>
					</select>

					{isInstructor && (
						<select
							value={status}
							onChange={(event) => handleStatusChange(event.target.value)}
							className="border border-foreground px-4 py-3"
						>
							<option value="">All statuses</option>
							<option value="draft">Draft</option>
							<option value="published">
								Published
							</option>
						</select>
					)}
				</div>
			</div>

			{error && (
				<p className="mt-8 text-red-600">
					{error}
				</p>
			)}

			{enrollments === null && !error && (
				<p className="mt-8">
					Loading your courses...
				</p>
			)}

			{enrollments !== null
				&& !error
				&& enrollments.length === 0 && (
				<div className="mt-10 border border-foreground p-8 text-center">
					<h2 className="text-xl font-semibold">
						{submittedSearch
							? "No courses found"
							: isInstructor
							? "No courses yet"
							: "No courses yet"}
					</h2>

					<p className="mt-2 text-gray-600">
						{submittedSearch
							? "Try a different search."
							: isInstructor
							? "Create your first course to get started."
							: "You haven't enrolled in any courses."}
					</p>

					{!submittedSearch && (
						<Link
							href={isInstructor
								? "/my-courses/new"
								: "/courses"}
							className="mt-6 inline-block border border-foreground px-5 py-3 font-medium hover:bg-foreground hover:text-background"
						>
							{isInstructor
								? "Create Course"
								: "Browse Courses"}
						</Link>
					)}
				</div>
			)}

			{enrollments !== null
				&& !error
				&& enrollments.length > 0 && (
				<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
					{enrollments.map((enrollment) => {
						return (
							<article
								key={enrollment._id}
								className="flex flex-col border border-foreground"
							>
								<div className="relative aspect-video overflow-hidden border-b border-foreground">
									{enrollment.thumbnail
										? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={enrollment.thumbnail}
												alt={enrollment.title}
												className="absolute inset-0 h-full w-full object-contain"
											/>
										)
										: (
											<div className="flex h-full items-center justify-center">
												No thumbnail
											</div>
										)}
								</div>

								<div className="flex flex-1 flex-col p-5">
									<h2 className="text-xl font-semibold">
										{enrollment.title}
									</h2>

									<p className="mt-2 text-sm text-gray-600">
										Instructor: {enrollment.instructor}
									</p>

									{isInstructor
										? (
											<>
												<div className="mt-5 flex items-center justify-between text-sm">
													<span>
														Status
													</span>

													<span className="capitalize">
														{enrollment.status}
													</span>
												</div>

												{enrollment.added && (
													<p className="mt-2 text-sm text-gray-600">
														Created {new Date(
															enrollment.added,
														).toLocaleDateString()}
													</p>
												)}

												{enrollment.updated && (
													<p className="mt-1 text-sm text-gray-600">
														Updated {new Date(
															enrollment.updated,
														).toLocaleDateString()}
													</p>
												)}

												<Link
													href={`/my-courses/${enrollment._id}`}
													className="mt-6 border border-foreground px-4 py-3 text-center font-medium hover:bg-foreground hover:text-background"
												>
													Manage Course
												</Link>
											</>
										)
										: (
											<>
												<div className="mt-5">
													<div className="flex items-center justify-between text-sm">
														<span>
															Progress
														</span>

														<span>
															{enrollment
																.progress
																?.percentage}%
														</span>
													</div>

													<div className="mt-2 h-2 border border-foreground">
														<div
															className="h-full bg-foreground"
															style={{
																width: `${enrollment.progress?.percentage ?? 0}%`,
															}}
														/>
													</div>

													<p className="mt-2 text-sm text-gray-600">
														{enrollment
															.progress
															?.completedLessons} of {enrollment
															.progress
															?.totalLessons} lessons completed
													</p>
												</div>

												<Link
													href={`/my-courses/${enrollment._id}`}
													className="mt-6 border border-foreground px-4 py-3 text-center font-medium hover:bg-foreground hover:text-background"
												>
													Continue Learning
												</Link>
											</>
										)}
								</div>
							</article>
						);
					})}
				</div>
			)}

			{totalPages > 1 && (
				<div className="mt-10 flex items-center justify-center gap-4">
					<button
						type="button"
						disabled={page === 1}
						onClick={() => setPage((current) => current - 1)}
						className="border border-foreground px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Previous
					</button>

					<span className="text-sm">
						Page {page} of {totalPages}
					</span>

					<button
						type="button"
						disabled={page === totalPages}
						onClick={() => setPage((current) => current + 1)}
						className="border border-foreground px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
					>
						Next
					</button>
				</div>
			)}
		</main>
	);
}
