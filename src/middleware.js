import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAdminPanel = req.nextUrl.pathname.startsWith("/admin");

  if (req.auth?.error === "RefreshAccessTokenError") {
    return NextResponse.redirect(new URL("/auth/signin?error=SessionExpired", req.nextUrl));
  }

  const hasAccess = req.auth?.skyformsRoles?.includes("skyforms:access") ?? false;

  if (isOnAdminPanel) {
    if (!isLoggedIn) {
      const signInUrl = new URL("/auth/signin", req.nextUrl);
      signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
      return NextResponse.redirect(signInUrl);
    }
    if (!hasAccess) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};