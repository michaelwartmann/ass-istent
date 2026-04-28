import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip auth gate for the login flow + password-reset routes
  if (
    pathname === "/login" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/admin/reset/")
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get("coach_auth");
  if (!authCookie || authCookie.value !== "true") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals + static assets so the auth gate doesn't break
  // image/manifest/favicon delivery.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:png|jpg|jpeg|svg|webp|webmanifest)$).*)",
  ],
};
