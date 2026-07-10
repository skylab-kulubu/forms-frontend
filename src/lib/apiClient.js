import { getSession } from "next-auth/react";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const SESSION_EXPIRED_EVENT = "skyforms:session-expired";

// Concurrent callers share one in-flight session fetch. Every request() reads the session,
// and each separate fetch can trigger its own server-side token refresh; with refresh-token
// rotation two parallel refreshes race and the loser gets invalid_grant.
let inflightSession = null;
function getSharedSession() {
  if (!inflightSession) {
    inflightSession = getSession().finally(() => { inflightSession = null; });
  }
  return inflightSession;
}

// We had a token but it no longer authenticates and a refresh couldn't produce a new one:
// tell the UI (SessionExpiredHandler) so it can offer a re-login instead of failing silently.
function announceSessionExpired() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
}

export async function request(path, options = {}) {

  const { token, ...otherOptions } = options;
  const hasAuthHeader = options.headers && ("Authorization" in options.headers || "authorization" in options.headers);

  let resolvedToken = token;
  if (!resolvedToken && !hasAuthHeader) {
    try {
      const session = await getSharedSession();
      resolvedToken = session?.accessToken;
    } catch { }
  }

  const buildOptions = (authToken) => ({
    ...otherOptions,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
      ...(authToken ? { "Authorization": `Bearer ${authToken}` } : {}),
    },
    body:
      options.body && typeof options.body !== "string"
        ? JSON.stringify(options.body)
        : options.body,
  });

  const send = async (authToken) => {
    const response = await fetch(`${BASE_URL}${path}`, buildOptions(authToken));
    let data = null;
    try { data = await response.json(); } catch { }
    return { response, data };
  };

  let { response, data } = await send(resolvedToken);

  // A 401 usually means the access token went stale (e.g. a long idle session where the
  // client-cached token wasn't refreshed). Force a fresh session (which triggers the
  // server-side jwt refresh in auth.js) and retry once with the new token. Skipped when
  // the caller supplied its own Authorization header.
  if (response.status === 401 && !hasAuthHeader) {
    let refreshed = false;
    try {
      const session = await getSharedSession();
      const freshToken = session?.accessToken;
      if (freshToken && freshToken !== resolvedToken) {
        refreshed = true;
        ({ response, data } = await send(freshToken));
      }
    } catch { }
    // No new token means the refresh token is dead too; only announce when a token existed,
    // so a never-logged-in visitor hitting a 401 doesn't get a "session expired" prompt.
    if (!refreshed && resolvedToken) announceSessionExpired();
  }

  if (!response.ok) {
    const error = new Error( data?.detail || data?.message || `İstek başarısız: ${response.status}` );
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data;
}

export async function uploadWithProgress(path, file, onProgress) {
  const attempt = (authToken) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${BASE_URL}${path}`);

      if (authToken) {
        xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
      }

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch {
            resolve(xhr.responseText);
          }
        } else {
          const error = new Error(`Yükleme başarısız: ${xhr.status}`);
          error.status = xhr.status;
          reject(error);
        }
      };

      xhr.onerror = () => reject(new Error("Network hatası"));

      const formData = new FormData();
      formData.append("file", file);

      xhr.send(formData);
    });

  let resolvedToken = null;
  try {
    const session = await getSharedSession();
    resolvedToken = session?.accessToken;
  } catch {}

  try {
    return await attempt(resolvedToken);
  } catch (error) {
    // Same stale-token recovery as request(): a fresh session read triggers the server-side
    // refresh, then retry once (progress restarts from zero on the retry).
    if (error.status === 401) {
      let freshToken = null;
      try {
        const session = await getSharedSession();
        freshToken = session?.accessToken;
      } catch {}
      if (freshToken && freshToken !== resolvedToken) {
        return attempt(freshToken);
      }
      if (resolvedToken) announceSessionExpired();
    }
    throw error;
  }
}