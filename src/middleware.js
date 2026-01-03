import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ALLOWED_ROLES = ["ADMIN", "YK", "DK"];

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnAdminPanel = req.nextUrl.pathname.startsWith("/admin");

  const userRoles = req.auth?.roles || [];

  const hasPermission = userRoles.some(role => ALLOWED_ROLES.includes(role));

  if (isOnAdminPanel) {
    if (!isLoggedIn) {
        return NextResponse.redirect(new URL("/api/auth/signin", req.nextUrl));
    }
    if (!hasPermission) {
        return NextResponse.redirect(new URL("/", req.nextUrl));
    }
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/auth/:path*"],
};