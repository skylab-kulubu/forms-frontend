import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ALLOWED_ROLES = ["ADMIN", "YK", "DK", "EKIP"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAdminPanel = req.nextUrl.pathname.startsWith("/admin");

  if (req.auth?.error === "RefreshAccessTokenError") {
    return NextResponse.redirect(new URL("/auth/signin?error=SessionExpired", req.nextUrl));
  }

  const userRoles = req.auth?.user?.roles || [];

  const hasPermission = userRoles.some(role => ALLOWED_ROLES.includes(role));

  if (isOnAdminPanel) {
    if (!isLoggedIn) {
      const signInUrl = new URL("/auth/signin", req.nextUrl);
      signInUrl.searchParams.set("callbackUrl", req.nextUrl.href);
      return NextResponse.redirect(signInUrl);
    }
    if (!hasPermission) {
      return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};