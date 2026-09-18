import { getSession } from "next-auth/react";
import { coreApiUrl } from "./short-url";

async function coreRequest(path, options = {}) {
  const session = await getSession();
  const token = session?.accessToken;
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(`${coreApiUrl()}${path}`, {
    method: options.method || "GET",
    headers,
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {}
  if (!response.ok) {
    const error = new Error(data?.title || data?.detail || data?.message || `İstek başarısız: ${response.status}`);
    error.status = response.status;
    error.body = data;
    throw error;
  }
  return data;
}

export const urlsApi = {
  listMine: () => coreRequest("/v1/urls"),
  create: (body) => coreRequest("/v1/urls", { method: "POST", body }),
};
