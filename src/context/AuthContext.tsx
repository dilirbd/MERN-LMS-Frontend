"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

import { apiRequest } from "@/lib/apiHandler";
import type { User } from "@/types/auth";

type AuthContextType = {
	user: User | null;
	loading: boolean;
	setUser: (user: User | null) => void;
	refreshUser: () => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(
	undefined,
);

export function AuthProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);

	async function refreshUser() {
		try {
			const response = await apiRequest<User>(
				"/api/v1/auth/profile",
			);

			if (response.success && response.data) {
				setUser(response.data);
			}
			else {
				setUser(null);
			}
		}
		catch (error) {
			console.error("Failed to load user:", error);
			setUser(null);
		}
	}

	async function logout() {
		try {
			await apiRequest("/api/v1/auth/logout", {
				method: "POST",
			});
		}
		finally {
			setUser(null);
		}
	}

	useEffect(() => {
		async function loadUser() {
			try {
				await refreshUser();
			}
			finally {
				setLoading(false);
			}
		}

		loadUser();
	}, []);

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				setUser,
				refreshUser,
				logout,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);

	if (!context) {
		throw new Error(
			"useAuth must be used inside AuthProvider",
		);
	}

	return context;
}
