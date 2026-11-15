import { PERSONAS, sessionOf } from "./people";

const SESSION_PATH = "/api/auth/session";
const LATENCY_MS = 24;

const parse = (text) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

export function serve(handle) {
  async function respond(persona, { method = "GET", url, body = null }) {
    await new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
    if (!PERSONAS[persona]) return { status: 401, body: JSON.stringify({ status: 401, message: "Oturum yok.", data: null }) };
    const { pathname, searchParams } = new URL(url);
    if (pathname === SESSION_PATH) return { status: 200, body: JSON.stringify(sessionOf(persona)) };
    let status = 500;
    let payload = { message: "Tanıtım sunucusunda bir hata oluştu." };
    try {
      [status, payload] = handle({ persona, user: PERSONAS[persona].user, method: method.toUpperCase(), pathname, params: searchParams, body: parse(body) });
    } catch (error) {
      console.error("tanıtım sunucusu:", error);
    }
    if (payload && typeof payload === "object" && payload.status == null) payload.status = status;
    return { status, body: JSON.stringify(payload) };
  }

  return { respond };
}

export function demoBackend(create) {
  let server = null;
  const get = () => (server ??= create());
  return {
    get,
    bind: (persona) => ({ request: (request) => get().respond(persona, request), storage: { localStorage: {}, sessionStorage: {} } }),
  };
}
