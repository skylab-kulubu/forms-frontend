import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

async function readSession(req) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  return (await getToken({ req, secret, secureCookie: true })) ?? (await getToken({ req, secret, secureCookie: false }));
}

export default async function middleware(req) {
  const token = await readSession(req);

  if (!token) {
    const target = req.nextUrl.clone();
    target.searchParams.delete("_rsc");
    const signInUrl = new URL("/auth/signin", req.nextUrl);
    signInUrl.searchParams.set("callbackUrl", `${target.pathname}${target.search}`);
    return NextResponse.redirect(signInUrl);
  }

  if (!token.skyformsRoles?.includes("skyforms:access")) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
