// middleware.ts - Quebec Locale Enforcement

/**
 * Middleware - Quebec Locale Enforcement
 * Ensures Quebec-first experience
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get locale from cookie or default to Quebec French
  const locale = request.cookies.get("NEXT_LOCALE")?.value || "fr-CA";

  // Set Quebec-specific headers
  const response = NextResponse.next();

  // Add Quebec locale header
  response.headers.set("X-Quebec-Locale", locale);

  // Add cultural compliance header
  response.headers.set("X-Quebec-Compliant", "true");

  // Enforce HTTPS in production
  if (
    process.env.NODE_ENV === "production" &&
    !request.headers.get("x-forwarded-proto")?.includes("https")
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get("host")}${pathname}`,
      301,
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
