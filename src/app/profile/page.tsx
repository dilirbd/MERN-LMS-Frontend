"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/apiHandler";
import type { User } from "@/types/auth";

type DialCodeResponse = {
	countries: string[];
	dialCodes: string[];
};

export default function ProfilePage() {
	const {
		user,
		loading: authLoading,
		setUser,
	} = useAuth();

	if (authLoading) {
		return (
			<main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
				<p>Loading profile...</p>
			</main>
		);
	}

	if (!user) {
		return (
			<main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
				<div className="border border-foreground p-6 sm:p-8">
					<h1 className="text-2xl font-bold sm:text-3xl">
						Profile
					</h1>

					<p className="mt-3 text-gray-600">
						Please log in to view your profile.
					</p>
				</div>
			</main>
		);
	}

	return <ProfileForm user={user} setUser={setUser} />;
}

function ProfileForm({
	user,
	setUser,
}: {
	user: User;
	setUser: (user: User | null) => void;
}) {
	const [name, setName] = useState(user.name);
	const [dialCode, setDialCode] = useState(user.countryCode ?? "");
	const [phone, setPhone] = useState(user.phone ?? "");
	const [address, setAddress] = useState(user.address ?? "");

	const [dialCodes, setDialCodes] = useState<string[]>([]);
	const [dialCodesLoading, setDialCodesLoading] = useState(true);

	const [country, setCountry] = useState(user.country ?? "");
	const [countries, setCountries] = useState<string[]>([]);

	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	useEffect(() => {
		let cancelled = false;

		async function loadDialCodes() {
			const response = await apiRequest<DialCodeResponse>(
				"/api/v1/auth/get-regions",
			);

			if (cancelled) return;

			if (!response.success || !response.data) {
				setError(
					response.message || "Failed to load countries and dial codes.",
				);
				setDialCodesLoading(false);
				return;
			}

			setCountries(response.data.countries);
			setDialCodes(response.data.dialCodes);
			setDialCodesLoading(false);
		}

		loadDialCodes();

		return () => {
			cancelled = true;
		};
	}, []);

	async function handleSubmit(
		event: React.SubmitEvent<HTMLFormElement>,
	) {
		event.preventDefault();

		if (saving) return;

		setSaving(true);
		setError("");
		setSuccess("");

		const response = await apiRequest<User>(
			"/api/v1/auth/profile/update",
			{
				method: "PATCH",
				body: JSON.stringify({
					name: name.trim(),
					countryCode: dialCode || undefined,
					phone: phone.trim() || undefined,
					address: address.trim() || undefined,
					country: country.trim() || undefined,
				}),
			},
		);

		if (!response.success || !response.data) {
			setError(
				response.message || "Failed to update profile.",
			);
			setSaving(false);
			return;
		}

		setUser(response.data);
		setSuccess("Profile updated successfully.");
		setSaving(false);
	}

	return (
		<main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
			<div>
				<h1 className="text-3xl font-bold sm:text-4xl">
					Profile
				</h1>

				<p className="mt-2 text-sm text-gray-600">
					Update your personal information.
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

			{success && (
				<div
					role="status"
					className="mt-6 border border-foreground p-4 text-sm"
				>
					{success}
				</div>
			)}

			<section className="mt-8 border border-foreground p-5 sm:p-8">
				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<label
							htmlFor="name"
							className="block text-sm font-medium"
						>
							Name
						</label>

						<input
							id="name"
							type="text"
							value={name}
							onChange={(event) => setName(event.target.value)}
							required
							className="mt-2 w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
						/>
					</div>

					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium"
						>
							Email
						</label>

						<input
							id="email"
							type="email"
							value={user.email}
							disabled
							className="mt-2 w-full border border-foreground bg-gray-100 px-4 py-3 text-gray-600 outline-none"
						/>

						<p className="mt-2 text-xs text-gray-500">
							Email changes are not available here.
						</p>
					</div>

					<div>
						<label
							htmlFor="phone"
							className="block text-sm font-medium"
						>
							Phone
						</label>

						<div className="mt-2 grid gap-3 sm:grid-cols-[140px_1fr]">
							<select
								id="dialCode"
								value={dialCode}
								onChange={(event) => setDialCode(event.target.value)}
								disabled={dialCodesLoading}
								className="w-full border border-foreground bg-background px-4 py-3 outline-none focus:ring-1 focus:ring-foreground disabled:cursor-not-allowed disabled:bg-gray-100"
							>
								<option value="">
									{dialCodesLoading ? "Loading..." : "Code"}
								</option>

								{dialCodes.map((code) => (
									<option key={code} value={code}>
										{code}
									</option>
								))}
							</select>

							<input
								id="phone"
								type="tel"
								value={phone}
								onChange={(event) => setPhone(event.target.value)}
								placeholder="Phone number"
								className="w-full border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
							/>
						</div>
					</div>

					<div>
						<label
							htmlFor="country"
							className="block text-sm font-medium"
						>
							Country
						</label>

						<select
							id="country"
							value={country}
							onChange={(event) => setCountry(event.target.value)}
							disabled={dialCodesLoading}
							className="mt-2 w-full border border-foreground bg-background px-4 py-3 outline-none focus:ring-1 focus:ring-foreground disabled:cursor-not-allowed disabled:bg-gray-100"
						>
							<option value="">
								{dialCodesLoading
									? "Loading..."
									: "Select country"}
							</option>

							{countries.map((countryName) => (
								<option key={countryName} value={countryName}>
									{countryName}
								</option>
							))}
						</select>
					</div>

					<div>
						<label
							htmlFor="address"
							className="block text-sm font-medium"
						>
							Address
						</label>

						<textarea
							id="address"
							value={address}
							onChange={(event) => setAddress(event.target.value)}
							placeholder="Optional"
							rows={4}
							className="mt-2 w-full resize-y border border-foreground px-4 py-3 outline-none focus:ring-1 focus:ring-foreground"
						/>
					</div>

					<button
						type="submit"
						disabled={saving || dialCodesLoading}
						className="w-full border border-foreground bg-foreground px-5 py-3 font-medium text-background transition-colors hover:bg-background hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
					>
						{saving ? "Saving..." : "Save Changes"}
					</button>
				</form>
			</section>
		</main>
	);
}
