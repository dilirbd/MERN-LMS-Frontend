"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/apiHandler";
import type { Course, Module } from "@/types/course";
import StudentLearningView from "./StudentLearningView";

type CourseDetails = Course & {
	status: "draft" | "published";
	modules: Module[];
};

export default function MyCoursePage() {
	const params = useParams();
	const { user, loading: authLoading } = useAuth();

	const courseId = params.courseId as string;

	const [course, setCourse] = useState<CourseDetails | null>(null);
	const [modules, setModules] = useState<Module[]>([]);

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [thumbnail, setThumbnail] = useState("");

	const [moduleTitle, setModuleTitle] = useState("");
	const [moduleDescription, setModuleDescription] = useState("");
	const [moduleOrder, setModuleOrder] = useState(1);

	const [editingModuleId, setEditingModuleId] = useState<string | null>(
		null,
	);

	const [editModuleTitle, setEditModuleTitle] = useState("");
	const [editModuleDescription, setEditModuleDescription] = useState("");
	const [editModuleOrder, setEditModuleOrder] = useState(1);

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [addingModule, setAddingModule] = useState(false);
	const [updatingModule, setUpdatingModule] = useState(false);
	const [deletingModuleId, setDeletingModuleId] = useState<string | null>(
		null,
	);
	const [publishing, setPublishing] = useState(false);
	const [deletingCourse, setDeletingCourse] = useState(false);
	const router = useRouter();

	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		if (authLoading || user?.role !== "instructor") {
			return;
		}

		let cancelled = false;

		async function loadCourse() {
			setLoading(true);
			setError("");

			const response = await apiRequest<CourseDetails>(
				`/api/v1/courses/my-courses/${courseId}`,
			);

			if (cancelled) return;

			if (!response.success || !response.data) {
				setError(
					response.message || "Failed to load course.",
				);
				setLoading(false);
				return;
			}

			setCourse(response.data);
			setModules(response.data.modules ?? []);
			setTitle(response.data.title);
			setDescription(response.data.description);
			setThumbnail(response.data.thumbnail ?? "");

			setLoading(false);
		}

		loadCourse();

		return () => {
			cancelled = true;
		};
	}, [authLoading, user, courseId]);

	async function handleSaveCourse(
		event: React.SubmitEvent<HTMLFormElement>,
	) {
		event.preventDefault();

		if (saving) return;

		setSaving(true);
		setError("");
		setSuccess("");

		const response = await apiRequest<CourseDetails>(
			`/api/1/courses/my-courses/${courseId}/update-course`,
			{
				method: "PATCH",
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim(),
					thumbnail: thumbnail.trim() || undefined,
				}),
			},
		);

		if (!response.success || !response.data) {
			setError(
				response.message || "Failed to save course.",
			);
			setSaving(false);
			return;
		}

		setCourse(response.data);
		setModules(response.data.modules ?? []);

		setTitle(response.data.title);
		setDescription(response.data.description);
		setThumbnail(response.data.thumbnail ?? "");

		setSuccess("Course updated successfully.");
		setSaving(false);
	}

	async function handleDeleteCourse() {
		if (deletingCourse) return;

		const confirmed = window.confirm(
			`Delete "${course?.title}"? This will permanently delete the course, all of its modules, lessons, enrollments, and progress.`,
		);

		if (!confirmed) return;

		setDeletingCourse(true);
		setError("");
		setSuccess("");

		const response = await apiRequest(
			`/api/v1/courses/my-courses/${courseId}/delete-course`,
			{
				method: "DELETE",
			},
		);

		if (!response.success) {
			setError(
				response.message || "Failed to delete course.",
			);
			setDeletingCourse(false);
			return;
		}

		router.push("/my-courses");
	}

	async function handleAddModule(
		event: React.SubmitEvent<HTMLFormElement>,
	) {
		event.preventDefault();

		if (addingModule) return;

		setAddingModule(true);
		setError("");
		setSuccess("");

		const response = await apiRequest<Module[]>(
			`/api/v1/courses/${courseId}/modules/new-module`,
			{
				method: "POST",
				body: JSON.stringify({
					title: moduleTitle.trim(),
					description: moduleDescription.trim() || undefined,
					order: moduleOrder
						|| modules.length + 1,
				}),
			},
		);

		if (!response.success || !response.data) {
			setError(
				response.message || "Failed to add module.",
			);
			setAddingModule(false);
			return;
		}

		setModules(response.data);

		setModuleTitle("");
		setModuleDescription("");
		setModuleOrder(1);

		setSuccess("Module added successfully.");
		setAddingModule(false);
	}

	function startEditingModule(module: Module) {
		setEditingModuleId(module._id);
		setEditModuleTitle(module.title);
		setEditModuleDescription(module.description ?? "");
		setEditModuleOrder(module.order ?? 1);
		setError("");
		setSuccess("");
	}

	function cancelEditingModule() {
		setEditingModuleId(null);
		setEditModuleTitle("");
		setEditModuleDescription("");
		setEditModuleOrder(1);
	}

	async function handleUpdateModule(
		event: React.SubmitEvent<HTMLFormElement>,
		moduleId: string,
	) {
		event.preventDefault();

		if (updatingModule) return;

		setUpdatingModule(true);
		setError("");
		setSuccess("");

		const response = await apiRequest<Module[]>(
			`/api/v1/courses/${courseId}/modules/${moduleId}/update-module`,
			{
				method: "PATCH",
				body: JSON.stringify({
					title: editModuleTitle.trim(),
					description: editModuleDescription.trim()
						|| undefined,
					order: editModuleOrder,
				}),
			},
		);

		if (!response.success || !response.data) {
			setError(
				response.message
					|| "Failed to update module.",
			);
			setUpdatingModule(false);
			return;
		}

		setModules(response.data);

		cancelEditingModule();

		setSuccess("Module updated successfully.");
		setUpdatingModule(false);
	}

	async function handleDeleteModule(module: Module) {
		if (deletingModuleId) return;

		const confirmed = window.confirm(
			`Delete "${module.title}"? This will also delete its lessons and their progress.`,
		);

		if (!confirmed) return;

		setDeletingModuleId(module._id);
		setError("");
		setSuccess("");

		const response = await apiRequest<Module[]>(
			`/api/v1/courses/${courseId}/modules/${module._id}/delete-module`,
			{
				method: "DELETE",
			},
		);

		if (!response.success || !response.data) {
			setError(
				response.message
					|| "Failed to delete module.",
			);
			setDeletingModuleId(null);
			return;
		}

		setModules(
			response.data.filter(
				(mod) => mod._id !== module._id,
			),
		);

		if (editingModuleId === module._id) {
			cancelEditingModule();
		}

		setSuccess("Module deleted successfully.");
		setDeletingModuleId(null);
	}

	async function handlePublish() {
		if (
			publishing
			|| !course
			|| course.status === "published"
		) {
			return;
		}

		setPublishing(true);
		setError("");
		setSuccess("");

		const response = await apiRequest<CourseDetails>(
			`/api/v1/courses/my-courses/${courseId}/publish`,
			{
				method: "PATCH",
			},
		);

		if (!response.success || !response.data) {
			setError(
				response.message
					|| "Failed to publish course.",
			);
			setPublishing(false);
			return;
		}

		setCourse(response.data);

		setSuccess("Course published successfully.");
		setPublishing(false);
	}

	if (authLoading) {
		return (
			<main className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
				<p>Loading course...</p>
			</main>
		);
	}

	if (user?.role === "student") {
		return <StudentLearningView courseId={courseId} />;
	}

	if (!user || user.role !== "instructor") {
		return (
			<main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
				<div className="border border-foreground p-6 sm:p-8">
					<h1 className="text-2xl font-bold sm:text-3xl">
						Access denied
					</h1>

					<p className="mt-3 text-gray-600">
						Only instructors and enrolled students can access this page.
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
						className="mt-6 inline-block underline"
					>
						Back to My Courses
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="mx-auto max-w-7xl px-4 py-8 sm:py-12">
			<div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<Link
						href="/my-courses"
						className="text-sm underline underline-offset-4"
					>
						← Back to My Courses
					</Link>

					<h1 className="mt-5 text-3xl font-bold sm:text-4xl">
						Manage Course
					</h1>
				</div>

				<div className="flex flex-col gap-3 sm:flex-row sm:items-center">
					<span className="border border-foreground px-4 py-2 text-center text-sm capitalize">
						{course.status}
					</span>

					{course.status === "draft" && (
						<button
							type="button"
							onClick={handlePublish}
							disabled={publishing}
							className="border border-foreground bg-foreground px-5 py-3 font-medium text-background hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
						>
							{publishing
								? "Publishing..."
								: "Publish Course"}
						</button>
					)}
					<button
						type="button"
						onClick={handleDeleteCourse}
						disabled={deletingCourse || publishing}
						className="border border-red-600 px-5 py-3 font-medium text-red-600 hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
					>
						{deletingCourse ? "Deleting..." : "Delete Course"}
					</button>
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
					<h2 className="text-2xl font-bold">
						Course Details
					</h2>

					<p className="mt-2 text-sm text-gray-600">
						Update the information students will see.
					</p>

					<form
						onSubmit={handleSaveCourse}
						className="mt-8"
					>
						<div>
							<label
								htmlFor="title"
								className="block text-sm font-medium"
							>
								Course Title
							</label>

							<input
								id="title"
								type="text"
								value={title}
								onChange={(event) =>
									setTitle(
										event.target.value,
									)}
								required
								className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
							/>
						</div>

						<div className="mt-6">
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
								required
								rows={7}
								className="mt-2 w-full resize-y border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
							/>
						</div>

						<div className="mt-6">
							<label
								htmlFor="thumbnail"
								className="block text-sm font-medium"
							>
								Thumbnail URL
							</label>

							<input
								id="thumbnail"
								type="url"
								value={thumbnail}
								onChange={(event) =>
									setThumbnail(
										event.target.value,
									)}
								className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
							/>
						</div>

						<button
							type="submit"
							disabled={saving}
							className="mt-8 w-full border border-foreground bg-foreground px-5 py-3 font-medium text-background hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
						>
							{saving
								? "Saving..."
								: "Save Changes"}
						</button>
					</form>
				</section>

				<aside className="h-fit border border-foreground p-5 sm:p-8">
					<h2 className="text-xl font-bold">
						Course Preview
					</h2>

					<div className="mt-5">
						<div className="relative aspect-video overflow-hidden border border-foreground">
							{thumbnail
								? (
									<Image
										src={thumbnail}
										alt={title}
										fill
										sizes="(max-width: 1024px) 100vw, 33vw"
										className="object-contain"
									/>
								)
								: (
									<div className="flex h-full items-center justify-center text-sm">
										No thumbnail
									</div>
								)}
						</div>

						<h3 className="mt-4 text-xl font-semibold">
							{title || "Untitled Course"}
						</h3>

						<p className="mt-2 line-clamp-4 text-sm text-gray-600">
							{description
								|| "No description yet."}
						</p>
					</div>
				</aside>
			</div>

			<section className="mt-8 border border-foreground p-5 sm:p-8">
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
					<div>
						<h2 className="text-2xl font-bold">
							Modules
						</h2>

						<p className="mt-2 text-sm text-gray-600">
							Organize your course into learning sections.
						</p>
					</div>

					<span className="text-sm text-gray-600">
						{modules.length} {modules.length === 1
							? "module"
							: "modules"}
					</span>
				</div>

				{modules.length > 0 && (
					<div className="mt-6 space-y-4">
						{modules.map((module, index) => {
							const isEditing = editingModuleId
								=== module._id;

							const isDeleting = deletingModuleId
								=== module._id;

							return (
								<div
									key={module._id}
									className="border border-foreground p-4 sm:p-5"
								>
									{isEditing
										? (
											<form
												onSubmit={(
													event,
												) => handleUpdateModule(
													event,
													module._id,
												)}
											>
												<div className="flex flex-col gap-5">
													<div>
														<label
															htmlFor={`edit-module-title-${module._id}`}
															className="block text-sm font-medium"
														>
															Module Title
														</label>

														<input
															id={`edit-module-title-${module._id}`}
															type="text"
															value={editModuleTitle}
															onChange={(
																event,
															) => setEditModuleTitle(
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
															htmlFor={`edit-module-description-${module._id}`}
															className="block text-sm font-medium"
														>
															Description
														</label>

														<input
															id={`edit-module-description-${module._id}`}
															type="text"
															value={editModuleDescription}
															onChange={(
																event,
															) => setEditModuleDescription(
																event
																	.target
																	.value,
															)}
															className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
														/>
													</div>

													<div>
														<label
															htmlFor={`edit-module-order-${module._id}`}
															className="block text-sm font-medium"
														>
															Order
														</label>

														<input
															id={`edit-module-order-${module._id}`}
															type="number"
															value={editModuleOrder}
															min={1}
															max={150}
															onChange={(
																event,
															) => setEditModuleOrder(
																Number(
																	event.target.value.replace(
																		/^0+/,
																		"",
																	),
																),
															)}
															className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
														/>
													</div>
												</div>

												<div className="mt-5 flex flex-col gap-3 sm:flex-row">
													<button
														type="submit"
														disabled={updatingModule}
														className="border border-foreground bg-foreground px-4 py-3 font-medium text-background hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
													>
														{updatingModule
															? "Saving..."
															: "Save Module"}
													</button>

													<button
														type="button"
														onClick={cancelEditingModule}
														disabled={updatingModule}
														className="border border-foreground px-4 py-3 font-medium hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
													>
														Cancel
													</button>
												</div>
											</form>
										)
										: (
											<>
												<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
													<div className="flex min-w-0 gap-4">
														<span className="font-bold">
															{index
																+ 1}
														</span>

														<div className="min-w-0">
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

													<div className="flex flex-wrap gap-2 lg:shrink-0">
														<Link
															href={`/my-courses/${courseId}/modules/${module._id}`}
															className="border border-foreground px-3 py-2 text-sm font-medium hover:bg-foreground hover:text-background"
														>
															Manage Lessons
														</Link>

														<button
															type="button"
															onClick={() =>
																startEditingModule(
																	module,
																)}
															disabled={Boolean(
																deletingModuleId,
															)}
															className="border border-foreground px-3 py-2 text-sm font-medium hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
														>
															Edit
														</button>

														<button
															type="button"
															onClick={() =>
																handleDeleteModule(
																	module,
																)}
															disabled={Boolean(
																deletingModuleId,
															)}
															className="border border-foreground px-3 py-2 text-sm font-medium hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50"
														>
															{isDeleting
																? "Deleting..."
																: "Delete"}
														</button>
													</div>
												</div>
											</>
										)}
								</div>
							);
						})}
					</div>
				)}

				{modules.length === 0 && (
					<div className="mt-6 border border-dashed border-foreground p-6 text-center">
						<p className="font-medium">
							No modules yet
						</p>

						<p className="mt-2 text-sm text-gray-600">
							Add your first module below.
						</p>
					</div>
				)}

				<form
					onSubmit={handleAddModule}
					className="mt-8 border-t border-foreground pt-8"
				>
					<h3 className="text-lg font-semibold">
						Add Module
					</h3>

					<div className="mt-5 grid gap-5 lg:grid-cols-2">
						<div>
							<label
								htmlFor="moduleTitle"
								className="block text-sm font-medium"
							>
								Module Title
							</label>

							<input
								id="moduleTitle"
								type="text"
								value={moduleTitle}
								onChange={(event) =>
									setModuleTitle(
										event.target.value,
									)}
								placeholder="e.g. Introduction to React"
								required
								className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
							/>
						</div>

						<div>
							<label
								htmlFor="moduleDescription"
								className="block text-sm font-medium"
							>
								Description
							</label>

							<input
								id="moduleDescription"
								type="text"
								value={moduleDescription}
								onChange={(event) =>
									setModuleDescription(
										event.target.value,
									)}
								placeholder="Optional module description"
								className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
							/>
						</div>

						<div>
							<label
								htmlFor="moduleOrder"
								className="block text-sm font-medium"
							>
								Order
							</label>

							<input
								id="moduleOrder"
								type="number"
								value={moduleOrder}
								min={1}
								max={150}
								onChange={(event) =>
									setModuleOrder(
										Number(
											event.target.value.replace(
												/^0+/,
												"",
											),
										),
									)}
								className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
							/>
						</div>
					</div>

					<button
						type="submit"
						disabled={addingModule}
						className="mt-5 w-full border border-foreground px-5 py-3 font-medium hover:bg-foreground hover:text-background disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
					>
						{addingModule
							? "Adding..."
							: "Add Module"}
					</button>
				</form>
			</section>
		</main>
	);
}
