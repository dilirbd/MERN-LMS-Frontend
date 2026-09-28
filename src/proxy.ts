import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
	const sessionToken = request.cookies.get("sessionToken");

	const { pathname } = request.nextUrl;

	if (pathname.startsWith("/my-courses") && !sessionToken) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	// if (pathname === "/login" && isAuthenticated) {
	// 	return NextResponse.redirect(new URL("/my-courses", request.url));
	// }

	return NextResponse.next();
}

// export const config = {
// 	matcher: ["/my-courses/:path*", "/login"],
// };
