"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/apiHandler";

const DEFAULT_THUMBNAIL =
	"https://pluspng.com/img-png/react-logo-png-img-react-logo-png-react-js-logo-png-transparent-png-1142x1027.png";

export default function NewCoursePage() {
	const router = useRouter();
	const { user, loading: authLoading } = useAuth();

	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [thumbnail, setThumbnail] = useState(DEFAULT_THUMBNAIL);

	const [creating, setCreating] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
		event.preventDefault();

		if (creating) return;

		setCreating(true);
		setError("");

		const response = await apiRequest<{
			_id: string;
		}>("/api/v1/courses/my-courses/new-course", {
			method: "POST",
			body: JSON.stringify({
				title: title.trim(),
				description: description.trim(),
				thumbnail: thumbnail.trim() || undefined,
			}),
		});

		if (!response.success || !response.data) {
			setError(response.message || "Failed to create course.");
			setCreating(false);
			return;
		}

		router.push(`/my-courses/${response.data._id}`);
	}

	if (authLoading) {
		return (
			<main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
				<p>Loading...</p>
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
						Only instructors can make courses.
					</p>

					<Link
						href="/my-courses"
						className="mt-6 inline-block border border-foreground px-5 py-3 font-medium hover:bg-foreground hover:text-background"
					>
						Back to Dashboard
					</Link>
				</div>
			</main>
		);
	}

	return (
		<main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
			<div>
				<Link
					href="/my-courses"
					className="text-sm underline underline-offset-4"
				>
					← Back to Dashboard
				</Link>

				<h1 className="mt-6 text-3xl font-bold sm:text-4xl">
					Make a new Course
				</h1>

				<p className="mt-2 text-gray-600">
					Make a draft course, then add modules and lessons.
				</p>
			</div>

			<form
				onSubmit={handleSubmit}
				className="mt-8 border border-foreground p-5 sm:p-8"
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
						onChange={(event) => setTitle(event.target.value)}
						placeholder="e.g. React Fundamentals"
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
						onChange={(event) => setDescription(event.target.value)}
						placeholder="Describe what students will learn..."
						required
						rows={6}
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
						onChange={(event) => setThumbnail(event.target.value)}
						placeholder="https://example.com/image.jpg"
						className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
					/>

					<p className="mt-2 text-sm text-gray-600">
						You can change this later.
					</p>
				</div>

				{error && (
					<div
						role="alert"
						className="mt-6 border border-red-600 p-4 text-sm text-red-600"
					>
						{error}
					</div>
				)}

				<div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
					<Link
						href="/my-courses"
						className="border border-foreground px-5 py-3 text-center font-medium hover:bg-foreground hover:text-background"
					>
						Cancel
					</Link>

					<button
						type="submit"
						disabled={creating}
						className="border border-foreground bg-foreground px-5 py-3 font-medium text-background hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
					>
						{creating ? "Creating..." : "Create Draft"}
					</button>
				</div>
			</form>
		</main>
	);
}
