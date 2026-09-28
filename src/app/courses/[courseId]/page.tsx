"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/apiHandler";
import type { Course, Module } from "@/types/course";

type CourseDetails = Course & {
	modules: Module[];
	enrolled?: boolean;
	updated: string;
};

export default function CourseDetailsPage() {
	const params = useParams();
	const router = useRouter();

	const courseId = params.courseId as string;

	const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);

	const [loading, setLoading] = useState(true);
	const [enrolling, setEnrolling] = useState(false);
	const [error, setError] = useState("");
	const [enrollMessage, setEnrollMessage] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function loadCourse() {
			setLoading(true);
			setError("");

			const response = await apiRequest<CourseDetails>(
				`/api/v1/courses/${courseId}`,
			);

			if (cancelled) return;

			if (!response.success || !response.data) {
				setError(response.message || "Failed to load course.");
				setLoading(false);
				return;
			}

			setCourseDetails(response.data);
			setLoading(false);
		}

		loadCourse();

		return () => {
			cancelled = true;
		};
	}, [courseId]);

	async function handleEnroll() {
		setEnrolling(true);
		setEnrollMessage("");

		const response = await apiRequest(`/api/v1/courses/${courseId}/enroll`, {
			method: "POST",
		});

		if (response.success) {
			router.push(`/my-courses/${courseId}`);
			return;
		}

		if (response.message?.toLowerCase().includes("authentication")) {
			router.push("/login");
			return;
		}

		setEnrollMessage(response.message || "Failed to enroll.");
		setEnrolling(false);
	}

	if (loading) {
		return (
			<main className="mx-auto max-w-7xl px-4 py-12">
				<p>Loading course...</p>
			</main>
		);
	}

	if (error || !courseDetails) {
		return (
			<main className="mx-auto max-w-7xl px-4 py-12">
				<p className="mb-4 text-red-600">
					{error || "Course not found."}
				</p>

				<Link href="/courses" className="underline">
					Back to courses
				</Link>
			</main>
		);
	}

	const { thumbnail, title, instructor, description, modules, enrolled } = courseDetails;

	return (
		<main className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
			<div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
				<section>
					<div className="relative aspect-video overflow-hidden border border-foreground">
						{thumbnail
							? (
								<Image
									src={thumbnail}
									alt={title}
									fill
									sizes="(max-width: 1024px) 100vw, 66vw"
									className="object-contain"
								/>
							)
							: (
								<div className="flex h-full items-center justify-center">
									No thumbnail
								</div>
							)}
					</div>

					<div className="mt-6">
						<h1 className="text-3xl font-bold sm:text-4xl">
							{title}
						</h1>

						<p className="mt-3 text-sm text-gray-600">
							Instructor: {instructor}
						</p>

						<p className="mt-6 whitespace-pre-line leading-7">
							{description}
						</p>
					</div>
				</section>

				<aside className="h-fit border border-foreground p-6">
					<h2 className="text-xl font-bold">
						{enrolled ? "Continue Learning" : "Start Learning"}
					</h2>

					<p className="mt-3 text-sm text-gray-600">
						{enrolled
							? "You are already enrolled in this course."
							: "Enroll in this course to start learning."}
					</p>

					{enrolled
						? (
							<Link
								href={`/my-courses/${courseId}`}
								className="mt-6 block w-full border border-foreground px-4 py-3 text-center font-medium hover:bg-foreground hover:text-background"
							>
								Continue Learning
							</Link>
						)
						: (
							<button
								type="button"
								onClick={handleEnroll}
								disabled={enrolling}
								className="mt-6 w-full border border-foreground px-4 py-3 font-medium hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
							>
								{enrolling ? "Enrolling..." : "Enroll Now"}
							</button>
						)}

					{enrollMessage && (
						<p className="mt-3 text-sm text-red-600">
							{enrollMessage}
						</p>
					)}
				</aside>
			</div>

			{/* Course content */}
			<section className="mt-12">
				<h2 className="text-2xl font-bold">
					Course Content
				</h2>

				{modules.length === 0
					? (
						<p className="mt-4 text-gray-600">
							No modules available yet.
						</p>
					)
					: (
						<div className="mt-6 space-y-3">
							{modules.map((module, index) => (
								<div
									key={module._id}
									className="border border-foreground p-5"
								>
									<div className="flex gap-4">
										<span className="font-bold">
											{index + 1}.
										</span>

										<div>
											<h3 className="font-semibold">
												{module.title}
											</h3>

											{module.description && (
												<p className="mt-2 text-sm text-gray-600">
													{module.description}
												</p>
											)}
										</div>
									</div>
								</div>
							))}
						</div>
					)}
			</section>
		</main>
	);
}
