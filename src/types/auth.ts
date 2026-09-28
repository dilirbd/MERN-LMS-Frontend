export type User = {
	_id: string;
	name: string;
	email: string;
	role: "student" | "instructor";
	address?: string;
	phone?: string;
	countryCode?: string;
	city?: string;
	country?: string;
};
