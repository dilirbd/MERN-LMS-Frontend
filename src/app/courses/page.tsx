"use client";

import { apiRequest } from "@/lib/apiHandler";
import type { Course, Pagination } from "@/types/course";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CoursesPage() {
	const [courses, setCourses] = useState<Course[]>([]);
	const [pagination, setPagination] = useState<Pagination | null>(null);

	const [search, setSearch] = useState("");
	const [submittedSearch, setSubmittedSearch] = useState("");
	const [sort, setSort] = useState("newest");
	const [page, setPage] = useState(1);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function loadCourses() {
			setLoading(true);
			setError("");

			const params = new URLSearchParams({
				page: page.toString(),
				limit: "12",
				sort,
			});

			if (submittedSearch) {
				params.set("search", submittedSearch);
			}

			const response = await apiRequest<{
				courses: Course[];
				pagination: Pagination;
			}>(`/api/v1/courses/?${params.toString()}`);

			if (cancelled) return;

			if (!response.success || !response.data) {
				setError(response.message || "Failed to load courses.");
				setCourses([]);
				setPagination(null);
				setLoading(false);
				return;
			}

			setCourses(response.data.courses);
			setPagination(response.data.pagination);
			setLoading(false);
		}

		loadCourses();

		return () => {
			cancelled = true;
		};
	}, [page, sort, submittedSearch]);

	function handleSearch(event: React.SubmitEvent) {
		event.preventDefault();

		setPage(1);
		setSubmittedSearch(search.trim());
	}

	return (
		<main className="mx-auto max-w-7xl px-4 py-8">
			<div className="mb-8">
				<h1 className="mb-2 text-3xl font-bold">
					Courses
				</h1>

				<p className="text-sm opacity-70">
					Find a course and start learning.
				</p>
			</div>

			<form
				onSubmit={handleSearch}
				className="mb-8 flex flex-col gap-3 sm:flex-row"
			>
				<input
					type="text"
					value={search}
					onChange={(event) => setSearch(event.target.value)}
					placeholder="Search courses..."
					className="min-h-11 flex-1 border border-foreground bg-background px-3 outline-none focus:ring-1 focus:ring-foreground"
				/>

				<select
					value={sort}
					onChange={(event) => {
						setSort(event.target.value);
						setPage(1);
					}}
					className="min-h-11 border border-foreground bg-background px-3"
				>
					<option value="newest">Newest</option>
					<option value="oldest">Oldest</option>
					<option value="title_asc">Title A–Z</option>
					<option value="title_desc">Title Z–A</option>
				</select>

				<button
					type="submit"
					className="min-h-11 border border-foreground bg-foreground px-6 text-background hover:opacity-80"
				>
					Search
				</button>
			</form>

			{loading && (
				<div className="py-16 text-center">
					<p>Loading courses...</p>
				</div>
			)}

			{!loading && error && (
				<div className="border border-foreground p-6">
					<p>{error}</p>
				</div>
			)}

			{!loading && !error && courses.length === 0 && (
				<div className="border border-foreground p-8 text-center">
					<p>No courses found.</p>
				</div>
			)}

			{!loading && !error && courses.length > 0 && (
				<>
					<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
						{courses.map((course) => (
							<Link
								key={course._id}
								href={`/courses/${course._id}`}
								className="group border border-foreground"
							>
								<div className="relative aspect-video overflow-hidden border-b border-foreground">
									{course.thumbnail
										? (
											// eslint-disable-next-line @next/next/no-img-element
											<img
												src={course.thumbnail}
												alt={course.title}
												className="absolute inset-0 h-full w-full object-contain"
											/>
										)
										: (
											<div className="flex h-full items-center justify-center">
												No image
											</div>
										)}
								</div>

								<div className="p-4">
									<h2 className="mb-2 text-lg font-semibold group-hover:underline">
										{course.title}
									</h2>

									<p className="text-sm opacity-70">
										By {course.instructor}
									</p>
								</div>
							</Link>
						))}
					</div>

					{pagination && pagination.totalPages > 1 && (
						<div className="mt-8 flex items-center justify-center gap-4">
							<button
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
								className="border border-foreground px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Previous
							</button>

							<span className="text-sm">
								Page {pagination.page} of {pagination.totalPages}
							</span>

							<button
								disabled={page >= pagination.totalPages}
								onClick={() => setPage((p) => p + 1)}
								className="border border-foreground px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
							>
								Next
							</button>
						</div>
					)}
				</>
			)}
		</main>
	);
}
