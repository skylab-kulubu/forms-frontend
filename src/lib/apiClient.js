import { getSession } from "next-auth/react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export async function request(path, options = {}) {

  const { token, ...otherOptions } = options;
  const hasAuthHeader = options.headers && ("Authorization" in options.headers || "authorization" in options.headers);

  let resolvedToken = token;
  if (!resolvedToken && !hasAuthHeader) {
    try {
      const session = await getSession();
      resolvedToken = session?.accessToken;
    } catch { }
  }

  const finalOptions = {
    ...otherOptions,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
      ...(resolvedToken ? { "Authorization": `Bearer ${resolvedToken}` } : {}),
    },
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  };

  const response = await fetch(`${BASE_URL}${path}`, finalOptions);

  let data = null;
  try { data = await response.json(); } catch { }

  if (!response.ok) {
    const error = new Error( data?.detail || data?.message || `İstek başarısız: ${response.status}` );
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data;
}
