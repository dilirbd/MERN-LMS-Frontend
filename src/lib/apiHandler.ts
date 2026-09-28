const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type ApiResponse<T = unknown> = {
	success: boolean;
	message: string;
	data?: T;
	error?: unknown;
	code: number;
};

export async function apiRequest<T>(
	endpoint: string,
	options?: RequestInit,
): Promise<ApiResponse<T>> {
	try {
		const response = await fetch(`${API_URL}${endpoint}`, {
			...options,
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				...options?.headers,
			},
		});

		console.log(response);

		let data: Partial<ApiResponse<T>> = {};

		try {
			data = await response.json();
		}
		catch {
			// Response wasn't JSON.
		}

		return {
			success: data.success ?? response.ok,
			message: data.message
				?? (response.ok
					? "Request successful."
					: "Request failed."),
			data: data.data,
			error: data.error,
			code: response.status,
		};
	}
	catch (error) {
		console.error("API request failed:", error);

		return {
			success: false,
			message: "Unable to connect to the server.",
			error,
			code: 0,
		};
	}
}
