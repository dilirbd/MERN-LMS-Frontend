"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/apiHandler";
import type { Lesson, Module } from "@/types/course";

export default function ModuleLessonsPage() {
	const params = useParams();
	const { user, loading: authLoading } = useAuth();

	const courseId = params.courseId as string;
	const moduleId = params.moduleId as string;

	const [module, setModule] = useState<Module | null>(null);
	const [lessons, setLessons] = useState<Lesson[]>([]);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [videoUrl, setVideoUrl] = useState("");
	const [duration, setDuration] = useState("");
	const [order, setOrder] = useState(1);

	const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

	const [editTitle, setEditTitle] = useState("");
	const [editDescription, setEditDescription] = useState("");
	const [editVideoUrl, setEditVideoUrl] = useState("");
	const [editDuration, setEditDuration] = useState("");
	const [editOrder, setEditOrder] = useState(1);

	const [loading, setLoading] = useState(true);
	const [addingLesson, setAddingLesson] = useState(false);
	const [updatingLesson, setUpdatingLesson] = useState(false);
	const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);

	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		if (authLoading) return;

		if (!user || user.role !== "instructor") {
			// setLoading(false);
			return;
		}

		let cancelled = false;

		async function loadData() {
			setLoading(true);
			setError("");

			const [modulesResponse, lessonsResponse] = await Promise.all([
				apiRequest<Module[]>(
					`/api/v1/courses/${courseId}/modules`,
				),
				apiRequest<Lesson[]>(
					`/api/v1/courses/${courseId}/modules/${moduleId}/lessons`,
				),
			]);

			if (cancelled) return;

			let foundModule: Module | undefined;

			if (
				modulesResponse.success
				&& modulesResponse.data
			) {
				foundModule = modulesResponse.data.find(
					(item) => item._id === moduleId,
				);

				if (foundModule) {
					setModule(foundModule);
				}
				else {
					setError("Module not found.");
				}
			}
			else {
				setError(
					modulesResponse.message
						|| "Failed to load module.",
				);
			}

			if (
				lessonsResponse.success
				&& lessonsResponse.data
			) {
				setLessons(lessonsResponse.data);
			}
			else if (!lessonsResponse.success) {
				setError(
					lessonsResponse.message
						|| "Failed to load lessons.",
				);
			}

			setLoading(false);
		}

		loadData();

		return () => {
			cancelled = true;
		};
	}, [authLoading, user, courseId, moduleId]);

	async function handleAddLesson(
		event: React.SubmitEvent<HTMLFormElement>,
	) {
		event.preventDefault();

		if (addingLesson) return;

		setAddingLesson(true);
		setError("");
		setSuccess("");

		const parsedDuration = duration.trim()
			? Number(duration)
			: undefined;

		const response = await apiRequest<Lesson[]>(
			`/api/v1/courses/${courseId}/modules/${moduleId}/lessons/new-lesson`,
			{
				method: "POST",
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim() || undefined,
					videoUrl: videoUrl.trim() || undefined,
					duration: parsedDuration !== undefined
						? parsedDuration
						: undefined,
					order: order || (lessons ? lessons.length + 1 : 1),
				}),
			},
		);

		if (!response.success || !response.data) {
			setError(
				response.message
					|| "Failed to add lesson.",
			);
			setAddingLesson(false);
			return;
		}

		setLessons(response.data!);

		setTitle("");
		setDescription("");
		setVideoUrl("");
		setDuration("");
		setOrder(1);

		setSuccess("Lesson added successfully.");
		setAddingLesson(false);
	}

	function startEditingLesson(lesson: Lesson) {
		setEditingLessonId(lesson._id);
		setEditTitle(lesson.title);
		setEditDescription(lesson.description ?? "");
		setEditVideoUrl(lesson.videoUrl ?? "");
		setEditDuration(
			lesson.duration !== undefined
				? String(lesson.duration)
				: "",
		);
		setEditOrder(lesson.order ?? 1);

		setError("");
		setSuccess("");
	}

	function cancelEditingLesson() {
		setEditingLessonId(null);
		setEditTitle("");
		setEditDescription("");
		setEditVideoUrl("");
		setEditDuration("");
		setEditOrder(1);
	}

	async function handleUpdateLesson(
		event: React.SubmitEvent<HTMLFormElement>,
		lessonId: string,
	) {
		event.preventDefault();

		if (updatingLesson) return;

		setUpdatingLesson(true);
		setError("");
		setSuccess("");

		const parsedDuration = editDuration.trim()
			? Number(editDuration)
			: undefined;

		const response = await apiRequest<Lesson[]>(
			`/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/update-lesson`,
			{
				method: "PATCH",
				body: JSON.stringify({
					title: editTitle.trim(),
					description: editDescription.trim()
						|| undefined,
					videoUrl: editVideoUrl.trim() || undefined,
					duration: parsedDuration !== undefined
						? parsedDuration
						: undefined,
					order: editOrder,
				}),
			},
		);

		if (!response.success || !response.data) {
			setError(
				response.message
					|| "Failed to update lesson.",
			);
			setUpdatingLesson(false);
			return;
		}

		setLessons(response.data.map((lesson, index) =>
			lesson._id === lessonId
				? response.data![index]
				: lesson
		));

		cancelEditingLesson();

		setSuccess("Lesson updated successfully.");
		setUpdatingLesson(false);
	}

	async function handleDeleteLesson(lesson: Lesson) {
		if (deletingLessonId) return;

		const confirmed = window.confirm(
			`Delete "${lesson.title}"?`,
		);

		if (!confirmed) return;

		setDeletingLessonId(lesson._id);
		setError("");
		setSuccess("");

		const response = await apiRequest<Lesson[]>(
			`/api/v1/courses/${courseId}/modules/${moduleId}/lessons/${lesson._id}/delete-lesson`,
			{
				method: "DELETE",
			},
		);

		if (!response.success || !response.data) {
			setError(
				response.message
					|| "Failed to delete lesson.",
			);
			setDeletingLessonId(null);
			return;
		}

		setLessons(response.data.filter((les) => lesson._id !== les._id));

		if (editingLessonId === lesson._id) {
			cancelEditingLesson();
		}

		setSuccess("Lesson deleted successfully.");
		setDeletingLessonId(null);
	}

	if (authLoading || loading) {
		return (
			<main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
				<p>Loading module...</p>
			</main>
		);
	}

	if (!user || user.role !== "instructor") {
		return (
			<main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
				<div className="border border-foreground p-6 sm:p-8">
					<h1 className="text-2xl font-bold sm:text-3xl">
						Access denied
					</h1>

					<p className="mt-3 text-gray-600">
						Only instructors can manage lessons.
					</p>

					<Link
						href="/my-courses"
						className="mt-6 inline-block border border-foreground px-5 py-3 font-medium hover:bg-foreground hover:text-background"
					>
						Back to My Courses
					</Link>
				</div>
			</main>
		);
	}

	if (!module) {
		return (
			<main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
				<div className="border border-foreground p-6 sm:p-8">
					<p className="text-red-600">
						{error || "Module not found."}
					</p>

					<Link
						href={`/my-courses/${courseId}`}
						className="mt-6 inline-block underline underline-offset-4"
					>
						Back to Course
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
			<div>
				<Link
					href={`/my-courses/${courseId}`}
					className="text-sm underline underline-offset-4"
				>
					← Back to Course
				</Link>

				<div className="mt-5">
					<p className="text-sm text-gray-600">
						Module
					</p>

					<h1 className="mt-1 text-3xl font-bold sm:text-4xl">
						{module.title}
					</h1>

					{module.description && (
						<p className="mt-3 max-w-3xl text-gray-600">
							{module.description}
						</p>
					)}
				</div>
			</div>

			{error && (
				<div
					role="alert"
					className="mt-6 border border-red-600 p-4 text-sm text-red-600"
				>
					{error}
				</div>
			)}

			{success && (
				<div
					role="status"
					className="mt-6 border border-foreground p-4 text-sm"
				>
					{success}
				</div>
			)}

			<div className="mt-8 grid gap-8 lg:grid-cols-[2fr_1fr]">
				<section className="border border-foreground p-5 sm:p-8">
					<div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
						<div>
							<h2 className="text-2xl font-bold">
								Lessons
							</h2>

							<p className="mt-2 text-sm text-gray-600">
								Manage the lessons inside this module.
							</p>
						</div>

						<span className="text-sm text-gray-600">
							{lessons.length} {lessons.length === 1
								? "lesson"
								: "lessons"}
						</span>
					</div>

					{lessons.length === 0
						? (
							<div className="mt-6 border border-dashed border-foreground p-6 text-center">
								<p className="font-medium">
									No lessons yet
								</p>

								<p className="mt-2 text-sm text-gray-600">
									Add your first lesson using the form.
								</p>
							</div>
						)
						: (
							<div className="mt-6 space-y-4">
								{lessons.map(
									(lesson, index) => {
										const isEditing = editingLessonId
											=== lesson._id;

										const isDeleting = deletingLessonId
											=== lesson._id;

										return (
											<div
												key={lesson._id}
												className="border border-foreground p-4 sm:p-5"
											>
												{isEditing
													? (
														<form
															onSubmit={(
																event,
															) => handleUpdateLesson(
																event,
																lesson._id,
															)}
														>
															<div className="space-y-5">
																<div>
																	<label
																		htmlFor={`edit-title-${lesson._id}`}
																		className="block text-sm font-medium"
																	>
																		Lesson Title
																	</label>

																	<input
																		id={`edit-title-${lesson._id}`}
																		type="text"
																		value={editTitle}
																		onChange={(
																			event,
																		) => setEditTitle(
																			event
																				.target
																				.value,
																		)}
																		required
																		className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
																	/>
																</div>

																<div>
																	<label
																		htmlFor={`edit-description-${lesson._id}`}
																		className="block text-sm font-medium"
																	>
																		Description
																	</label>

																	<textarea
																		id={`edit-description-${lesson._id}`}
																		value={editDescription}
																		onChange={(
																			event,
																		) => setEditDescription(
																			event
																				.target
																				.value,
																		)}
																		rows={4}
																		className="mt-2 w-full resize-y border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
																	/>
																</div>

																<div>
																	<label
																		htmlFor={`edit-video-${lesson._id}`}
																		className="block text-sm font-medium"
																	>
																		Video URL
																	</label>

																	<input
																		id={`edit-video-${lesson._id}`}
																		type="url"
																		value={editVideoUrl}
																		onChange={(
																			event,
																		) => setEditVideoUrl(
																			event
																				.target
																				.value,
																		)}
																		placeholder="https://youtube.com/..."
																		className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
																	/>
																</div>

																<div>
																	<label
																		htmlFor={`edit-duration-${lesson._id}`}
																		className="block text-sm font-medium"
																	>
																		Duration (minutes)
																	</label>

																	<input
																		id={`edit-duration-${lesson._id}`}
																		type="number"
																		min="0"
																		max="4320"
																		value={editDuration}
																		onChange={(
																			event,
																		) => setEditDuration(
																			event
																				.target
																				.value,
																		)}
																		className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
																	/>
																</div>

																<div>
																	<label
																		htmlFor={`edit-order-${lesson._id}`}
																		className="block text-sm font-medium"
																	>
																		Order
																	</label>

																	<input
																		id={`edit-order-${lesson._id}`}
																		type="number"
																		min={1}
																		max={50}
																		value={editOrder}
																		onChange={(
																			event,
																		) => setEditOrder(
																			Number(event
																				.target
																				.value.replace(/^0+/, "")),
																		)}
																		className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
																	/>
																</div>
															</div>

															<div className="mt-5 flex flex-col gap-3 sm:flex-row">
																<button
																	type="submit"
																	disabled={updatingLesson}
																	className="border border-foreground bg-foreground px-4 py-3 font-medium text-background hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
																>
																	{updatingLesson
																		? "Saving..."
																		: "Save Lesson"}
																</button>

																<button
																	type="button"
																	onClick={cancelEditingLesson}
																	disabled={updatingLesson}
																	className="border border-foreground px-4 py-3 font-medium hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
																>
																	Cancel
																</button>
															</div>
														</form>
													)
													: (
														<div className="flex flex-col gap-5">
															<div className="flex min-w-0 gap-4">
																<span className="font-bold">
																	{index
																		+ 1}
																</span>

																<div className="min-w-0">
																	<h3 className="font-semibold">
																		{lesson.title}
																	</h3>

																	{lesson.description && (
																		<p className="mt-2 text-sm text-gray-600">
																			{lesson.description}
																		</p>
																	)}

																	<div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-600">
																		{lesson.duration
																				!== undefined && (
																			<span>
																				{lesson.duration} min
																			</span>
																		)}

																		{lesson.videoUrl && (
																			<span className="max-w-full truncate">
																				Video added
																			</span>
																		)}
																	</div>
																</div>
															</div>

															<div className="flex flex-wrap gap-2">
																{lesson.videoUrl && (
																	<a
																		href={lesson.videoUrl}
																		target="_blank"
																		rel="noopener noreferrer"
																		className="border border-foreground px-3 py-2 text-sm font-medium hover:bg-foreground hover:text-background"
																	>
																		View Video
																	</a>
																)}

																<button
																	type="button"
																	onClick={() =>
																		startEditingLesson(
																			lesson,
																		)}
																	disabled={Boolean(
																		deletingLessonId,
																	)}
																	className="border border-foreground px-3 py-2 text-sm font-medium hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
																>
																	Edit
																</button>

																<button
																	type="button"
																	onClick={() =>
																		handleDeleteLesson(
																			lesson,
																		)}
																	disabled={Boolean(
																		deletingLessonId,
																	)}
																	className="border border-foreground px-3 py-2 text-sm font-medium hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
																>
																	{isDeleting
																		? "Deleting..."
																		: "Delete"}
																</button>
															</div>
														</div>
													)}
											</div>
										);
									},
								)}
							</div>
						)}
				</section>

				<aside className="h-fit border border-foreground p-5 sm:p-8">
					<h2 className="text-xl font-bold">
						Add Lesson
					</h2>

					<p className="mt-2 text-sm text-gray-600">
						Add a video lesson to this module.
					</p>

					<form
						onSubmit={handleAddLesson}
						className="mt-6 space-y-5"
					>
						<div>
							<label
								htmlFor="title"
								className="block text-sm font-medium"
							>
								Lesson Title
							</label>

							<input
								id="title"
								type="text"
								value={title}
								onChange={(event) => setTitle(event.target.value)}
								placeholder="e.g. What is React?"
								required
								className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
							/>
						</div>

						<div>
							<label
								htmlFor="description"
								className="block text-sm font-medium"
							>
								Description
							</label>

							<textarea
								id="description"
								value={description}
								onChange={(event) =>
									setDescription(
										event.target.value,
									)}
								rows={4}
								placeholder="What will students learn?"
								className="mt-2 w-full resize-y border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
							/>
						</div>

						<div>
							<label
								htmlFor="videoUrl"
								className="block text-sm font-medium"
							>
								Video URL
							</label>

							<input
								id="videoUrl"
								type="url"
								value={videoUrl}
								onChange={(event) =>
									setVideoUrl(
										event.target.value,
									)}
								placeholder="https://youtube.com/..."
								className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
							/>
						</div>

						<div>
							<label
								htmlFor="duration"
								className="block text-sm font-medium"
							>
								Duration (minutes)
							</label>

							<input
								id="duration"
								type="number"
								min="0"
								max="4320"
								value={duration}
								onChange={(event) =>
									setDuration(
										event.target.value,
									)}
								placeholder="10"
								className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
							/>
						</div>

						<div>
							<label
								htmlFor="order"
								className="block text-sm font-medium"
							>
								Order
							</label>

							<input
								id="order"
								type="number"
								min={1}
								max={50}
								value={order}
								onChange={(event) => setOrder(Number(event.target.value.replace(/^0+/, "")))}
								placeholder="10"
								className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
							/>
						</div>

						<button
							type="submit"
							disabled={addingLesson}
							className="w-full border border-foreground bg-foreground px-5 py-3 font-medium text-background hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
						>
							{addingLesson
								? "Adding..."
								: "Add Lesson"}
						</button>
					</form>
				</aside>
			</div>
		</main>
	);
}
