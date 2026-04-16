import { NextRequest, NextResponse } from "next/server";

const protectedPaths = ["/account", "/intake"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  let response = NextResponse.next();

  // Capture referral code from ?ref= param (Task 13)
  const ref = searchParams.get("ref");
  if (ref && !request.cookies.get("stadian_ref")) {
    response = NextResponse.next();
    response.cookies.set("stadian_ref", ref, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });
  }

  // Protected route check
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!isProtected) return response;

  const token = request.cookies.get("stadian_customer_token")?.value;
  if (token) return response;

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
