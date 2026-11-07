import { getToken } from "next-auth/jwt";
import { handlers } from "@/auth";

export const { POST } = handlers;

async function cookieAlreadyFailed(request) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  const token = (await getToken({ req: request, secret, secureCookie: true })) ?? (await getToken({ req: request, secret, secureCookie: false }));
  return Boolean(token?.error);
}

export async function GET(request) {
  const keepCookie = request.nextUrl.pathname.endsWith("/session") && await cookieAlreadyFailed(request);
  const response = await handlers.GET(request);
  if (keepCookie) response.headers.delete("set-cookie");
  return response;
}
