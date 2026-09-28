"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { apiRequest } from "@/lib/apiHandler";
import type { EnrollmentCourseDetails, LearningModule, Lesson } from "@/types/course";
import { useRouter } from "next/navigation";

type StudentLearningViewProps = {
	courseId: string;
};

function getYouTubeEmbedUrl(url: string) {
	try {
		const parsedUrl = new URL(url);

		if (
			parsedUrl.hostname === "www.youtube.com"
			|| parsedUrl.hostname === "youtube.com"
		) {
			const videoId = parsedUrl.searchParams.get("v");

			if (videoId) {
				return `https://www.youtube.com/embed/${videoId}`;
			}
		}

		if (parsedUrl.hostname === "youtu.be") {
			const videoId = parsedUrl.pathname.slice(1);

			if (videoId) {
				return `https://www.youtube.com/embed/${videoId}`;
			}
		}

		if (
			parsedUrl.hostname === "www.youtube-nocookie.com"
			|| parsedUrl.hostname === "youtube-nocookie.com"
		) {
			const videoId = parsedUrl.pathname
				.replace("/embed/", "")
				.split("/")[0];

			if (videoId) {
				return `https://www.youtube-nocookie.com/embed/${videoId}`;
			}
		}

		return null;
	}
	catch {
		return null;
	}
}

export default function StudentLearningView({
	courseId,
}: StudentLearningViewProps) {
	const [course, setCourse] = useState<EnrollmentCourseDetails | null>(null);

	const [modules, setModules] = useState<LearningModule[]>([]);

	const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);

	const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);

	const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

	const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
	const [selectedContent, setSelectedContent] = useState<
		"course" | "module" | "lesson"
	>("course");

	const [loading, setLoading] = useState(true);
	const [lessonLoading, setLessonLoading] = useState(false);
	const [completing, setCompleting] = useState(false);
	const router = useRouter();

	const [unenrolling, setUnenrolling] = useState(false);

	const [error, setError] = useState("");
	const [lessonError, setLessonError] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function loadCourse() {
			setLoading(true);
			setError("");

			const response = await apiRequest<EnrollmentCourseDetails>(
				`/api/v1/courses/my-courses/${courseId}`,
			);

			if (cancelled) return;

			if (!response.success || !response.data) {
				setError(
					response.message
						|| "Failed to load course.",
				);
				setLoading(false);
				return;
			}

			setCourse(response.data);
			setModules(response.data.modules ?? []);

			setLoading(false);
		}

		loadCourse();

		return () => {
			cancelled = true;
		};
	}, [courseId]);

	function toggleModule(moduleId: string) {
		setExpandedModuleId((current) => current === moduleId ? null : moduleId);
	}

	const handleLessonClick = async (
		moduleId: string,
		lesson: Lesson,
	) => {
		setSelectedContent("lesson");
		setExpandedModuleId(moduleId);
		setSelectedModuleId(moduleId);
		setSelectedLessonId(lesson._id);
		setLessonError("");
		setLessonLoading(true);

		try {
			const response = await apiRequest<Lesson[]>(
				`/api/v1/courses/${courseId}/modules/${moduleId}/lessons`,
			);

			if (!response.success || !response.data) {
				setLessonError(
					response.message || "Failed to load lesson.",
				);
				return;
			}

			const fullLesson = response.data.find(
				(item) => item._id === lesson._id,
			);

			if (!fullLesson) {
				setLessonError("Lesson not found.");
				return;
			}

			const localLesson = modules
				.find((module) => module._id === moduleId)
				?.lessons.find((item) => item._id === lesson._id);

			setSelectedLesson({
				...fullLesson,
				completed: localLesson?.completed ?? fullLesson.completed ?? false,
			});
		}
		catch (error) {
			console.error(error);
			setLessonError("Failed to load lesson.");
		}
		finally {
			setLessonLoading(false);
		}
	};

	const handleToggleComplete = async () => {
		if (
			!selectedModuleId
			|| !selectedLessonId
			|| !selectedLesson
			|| completing
		) {
			return;
		}

		setCompleting(true);
		setLessonError("");

		try {
			const response = await apiRequest<{
				completed: boolean;
				completedAt?: string;
			}>(
				`/api/v1/courses/${courseId}/modules/${selectedModuleId}/lessons/${selectedLessonId}/complete`,
				{
					method: "POST",
				},
			);

			if (!response.success) {
				setLessonError(
					response.message || "Failed to update lesson.",
				);
				return;
			}

			const completed = response.code === 251 ? false : true;

			// Update the currently selected lesson.
			setSelectedLesson((prev) =>
				prev
					? {
						...prev,
						completed,
					}
					: prev
			);

			// Update the lesson in the sidebar.
			setModules((prevModules) =>
				prevModules.map((module) => {
					if (module._id !== selectedModuleId) {
						return module;
					}

					return {
						...module,
						lessons: module.lessons.map((lesson) =>
							lesson._id === selectedLessonId
								? {
									...lesson,
									completed,
								}
								: lesson
						),
					};
				})
			);

			// Update course progress.
			setCourse((prevCourse) => {
				if (!prevCourse?.progress) {
					return prevCourse;
				}

				const change = completed ? 1 : -1;

				const completedLessons = Math.max(
					0,
					Math.min(
						prevCourse.progress.totalLessons,
						prevCourse.progress.completedLessons + change,
					),
				);

				const percentage = prevCourse.progress.totalLessons > 0
					? Math.round(
						(completedLessons
							/ prevCourse.progress.totalLessons)
							* 100,
					)
					: 0;

				return {
					...prevCourse,
					progress: {
						...prevCourse.progress,
						completedLessons,
						percentage,
					},
				};
			});

			setLessonError("");
		}
		catch (error) {
			console.error(error);

			setLessonError(
				"Something went wrong while updating the lesson.",
			);
		}
		finally {
			setCompleting(false);
		}
	};

	async function handleUnenroll() {
		if (unenrolling) return;

		const confirmed = window.confirm(
			`Unenroll from "${course?.title}"? Your enrollment and course progress will be removed.`,
		);

		if (!confirmed) return;

		setUnenrolling(true);
		setError("");

		const response = await apiRequest(
			`/api/v1/courses/${courseId}/unenroll`,
			{
				method: "POST",
			},
		);

		if (!response.success) {
			setError(
				response.message || "Failed to unenroll from the course.",
			);
			setUnenrolling(false);
			return;
		}

		router.push("/my-courses");
	}

	function renderVideo() {
		if (!selectedLesson?.videoUrl) {
			return (
				<div className="flex aspect-video w-full items-center justify-center border border-foreground bg-background p-6 text-center">
					<div>
						<p className="font-medium">
							No video available
						</p>

						<p className="mt-2 text-sm text-gray-600">
							This lesson does not have a video yet.
						</p>
					</div>
				</div>
			);
		}

		const embedUrl = getYouTubeEmbedUrl(
			selectedLesson.videoUrl,
		);

		if (!embedUrl) {
			return (
				<div className="flex aspect-video w-full items-center justify-center border border-foreground p-6 text-center">
					<div>
						<p className="font-medium">
							Unsupported video URL
						</p>

						<p className="mt-2 text-sm text-gray-600">
							This lesson currently supports YouTube videos.
						</p>
					</div>
				</div>
			);
		}

		return (
			<div className="relative aspect-video w-full overflow-hidden border border-foreground">
				<iframe
					src={embedUrl}
					title={selectedLesson.title}
					className="absolute inset-0 h-full w-full"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
					allowFullScreen
				/>
			</div>
		);
	}

	if (loading) {
		return (
			<main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
				<p>Loading course...</p>
			</main>
		);
	}

	if (!course) {
		return (
			<main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
				<div className="border border-foreground p-6 sm:p-8">
					<p className="text-red-600">
						{error || "Course not found."}
					</p>

					<Link
						href="/my-courses"
						className="mt-6 inline-block underline underline-offset-4"
					>
						Back to My Courses
					</Link>
				</div>
			</main>
		);
	}

	const progress = course.progress;

	return (
		<main className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
			<div className="flex flex-col gap-4 border-b border-foreground pb-6 sm:flex-row sm:items-end sm:justify-between">
				<div className="min-w-0">
					<Link
						href="/my-courses"
						className="text-sm underline underline-offset-4"
					>
						← Back to My Courses
					</Link>

					<h1 className="mt-4 text-2xl font-bold sm:text-3xl">
						{course.title}
					</h1>
				</div>

				{progress && (
					<div className="w-full sm:w-64">
						<div className="flex items-center justify-between text-sm">
							<span>Progress</span>

							<span>
								{progress.completedLessons}
								/
								{progress.totalLessons} lessons
							</span>
						</div>

						<div className="mt-2 h-2 border border-foreground">
							<div
								className="h-full bg-foreground"
								style={{
									width: `${progress.percentage}%`,
								}}
							/>
						</div>

						<p className="mt-1 text-right text-xs text-gray-600">
							{progress.percentage}%
						</p>
					</div>
				)}

				<button
					type="button"
					onClick={handleUnenroll}
					disabled={unenrolling}
					className="w-full border border-red-600 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:shrink-0"
				>
					{unenrolling ? "Unenrolling..." : "Unenroll"}
				</button>
			</div>

			{error && (
				<div
					role="alert"
					className="mt-6 border border-red-600 p-4 text-sm text-red-600"
				>
					{error}
				</div>
			)}

			<div className="mt-6 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)]">
				<aside className="h-fit border border-foreground">
					<button
						type="button"
						onClick={() => {
							setSelectedContent("course");
							setSelectedModuleId(null);
							setSelectedLessonId(null);
							setSelectedLesson(null);
							setLessonError("");
						}}
						className="w-full border-b border-foreground p-4 text-left hover:bg-foreground hover:text-background"
					>
						<h2 className="font-bold">
							Course Content
						</h2>

						<p className="mt-1 text-sm opacity-70">
							{modules.length} {modules.length === 1 ? "module" : "modules"}
						</p>
					</button>

					<div>
						{modules.map(
							(module, moduleIndex) => {
								const expanded = expandedModuleId
									=== module._id;

								const completedLessons = module.lessons.filter(
									(lesson) => lesson.completed,
								).length;

								return (
									<div
										key={module._id}
										className="border-b border-foreground last:border-b-0"
									>
										<button
											type="button"
											onClick={() => {
												setSelectedContent("module");
												setSelectedModuleId(module._id);
												setSelectedLessonId(null);
												setSelectedLesson(null);
												setLessonError("");

												toggleModule(module._id);
											}}
											className="w-full px-4 py-4 text-left hover:bg-foreground hover:text-background"
										>
											<div className="flex items-start justify-between gap-3">
												<div className="min-w-0">
													<p className="text-xs">
														Module {moduleIndex
															+ 1}
													</p>

													<p className="mt-1 font-medium">
														{module.title}
													</p>
												</div>

												<span className="shrink-0 text-sm">
													{expanded
														? "−"
														: "+"}
												</span>
											</div>

											<p className="mt-2 text-xs opacity-70">
												{completedLessons}
												/
												{module
													.lessons
													.length} completed
											</p>
										</button>

										{expanded && (
											<div className="border-t border-foreground">
												{module
														.lessons
														.length
														=== 0
													? (
														<p className="p-4 text-sm text-gray-600">
															No lessons in this module.
														</p>
													)
													: (
														module.lessons.map(
															(
																lesson,
																lessonIndex,
															) => {
																const selected = selectedLessonId
																	=== lesson._id;

																return (
																	<button
																		type="button"
																		key={lesson._id}
																		onClick={() =>
																			handleLessonClick(
																				module._id,
																				lesson,
																			)}
																		className={`flex w-full items-start gap-3 px-4 py-3 text-left text-sm ${
																			selected
																				? "bg-foreground text-background"
																				: "hover:bg-gray-100"
																		}`}
																	>
																		<span className="shrink-0">
																			{lesson.completed
																				? "✓"
																				: lessonIndex
																					+ 1}
																		</span>

																		<span className="min-w-0">
																			{lesson.title}
																		</span>
																	</button>
																);
															},
														)
													)}
											</div>
										)}
									</div>
								);
							},
						)}
					</div>
				</aside>

				<section className="min-w-0">
					{lessonLoading
						? (
							<div className="border border-foreground p-6 sm:p-8">
								<p>Loading lesson...</p>
							</div>
						)
						: lessonError
						? (
							<div
								role="alert"
								className="border border-red-600 p-6 text-red-600"
							>
								{lessonError}
							</div>
						)
						: selectedContent === "module"
						? (
							(() => {
								const selectedModule = modules.find(
									(module) => module._id === selectedModuleId,
								);

								if (!selectedModule) {
									return null;
								}

								return (
									<div className="border border-foreground">
										<div className="p-6 sm:p-8">
											<p className="text-sm text-gray-600">
												Module
											</p>

											<h2 className="mt-1 text-2xl font-bold sm:text-3xl">
												{selectedModule.title}
											</h2>

											{selectedModule.description && (
												<div className="mt-6 border-t border-foreground pt-6">
													<h3 className="font-semibold">
														About this module
													</h3>

													<p className="mt-3 whitespace-pre-wrap text-gray-700">
														{selectedModule.description}
													</p>
												</div>
											)}

											<div className="mt-6 border-t border-foreground pt-6">
												<p className="text-sm text-gray-600">
													{selectedModule.lessons.length} {selectedModule.lessons.length === 1
														? "lesson"
														: "lessons"}
												</p>

												<p className="mt-2 text-sm text-gray-600">
													Select a lesson from the course content to start learning.
												</p>
											</div>
										</div>
									</div>
								);
							})()
						)
						: selectedContent === "lesson" && selectedLesson
						? (
							<div>
								{renderVideo()}

								<div className="mt-6">
									<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
										<div className="min-w-0">
											<p className="text-sm text-gray-600">
												Lesson
											</p>

											<h2 className="mt-1 text-2xl font-bold sm:text-3xl">
												{selectedLesson.title}
											</h2>
										</div>

										<button
											type="button"
											onClick={handleToggleComplete}
											disabled={completing}
											className={`w-full border border-foreground px-5 py-3 font-medium sm:w-auto ${
												selectedLesson.completed
													? "bg-foreground text-background"
													: "hover:bg-foreground hover:text-background"
											} disabled:cursor-not-allowed disabled:opacity-50`}
										>
											{completing
												? "Updating..."
												: selectedLesson.completed
												? "✓ Completed"
												: "Mark as Complete"}
										</button>
									</div>

									{selectedLesson.description && (
										<div className="mt-6 border-t border-foreground pt-6">
											<h3 className="font-semibold">
												About this lesson
											</h3>

											<p className="mt-3 whitespace-pre-wrap text-gray-700">
												{selectedLesson.description}
											</p>
										</div>
									)}
								</div>
							</div>
						)
						: (
							<div className="border border-foreground">
								<div className="relative aspect-video overflow-hidden">
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
												No course image
											</div>
										)}
								</div>

								<div className="p-6 sm:p-8">
									<p className="text-sm text-gray-600">
										Course
									</p>

									<h2 className="mt-1 text-2xl font-bold sm:text-3xl">
										{course.title}
									</h2>

									<p className="mt-4 whitespace-pre-wrap text-gray-700">
										{course.description}
									</p>

									<p className="mt-6 text-sm text-gray-600">
										Select a module or lesson from the course content to continue learning.
									</p>
								</div>
							</div>
						)}
				</section>
			</div>
		</main>
	);
}
