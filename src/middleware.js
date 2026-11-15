import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import { DEMO_HEADER, DEMO_PARAM, DEMO_POLICY } from "@/lib/demo/protocol";

async function readSession(req) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  return (await getToken({ req, secret, secureCookie: true })) ?? (await getToken({ req, secret, secureCookie: false }));
}

function demoRequest(req) {
  if (req.headers.get("sec-fetch-site") !== "same-origin") return null;
  if (req.headers.get(DEMO_HEADER) === "1") return "data";
  if (req.headers.get("sec-fetch-dest") === "iframe" && req.nextUrl.searchParams.has(DEMO_PARAM)) return "document";
  return null;
}

export default async function middleware(req) {
  const demo = demoRequest(req);
  if (demo) {
    const response = NextResponse.next();
    if (demo === "document") response.headers.set("Content-Security-Policy", DEMO_POLICY);
    return response;
  }
  if (!req.nextUrl.pathname.startsWith("/admin")) return NextResponse.next();

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
  matcher: ["/admin/:path*", { source: "/:path*", has: [{ type: "query", key: "tanitim" }] }],
};
