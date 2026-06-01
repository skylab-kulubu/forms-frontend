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
  // client-cached token wasn't refreshed). Force a fresh session — which triggers the
  // server-side jwt refresh in auth.js — and retry once with the new token. Skipped when
  // the caller supplied its own Authorization header.
  if (response.status === 401 && !hasAuthHeader) {
    try {
      const session = await getSession();
      const freshToken = session?.accessToken;
      if (freshToken && freshToken !== resolvedToken) {
        ({ response, data } = await send(freshToken));
      }
    } catch { }
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
  let resolvedToken = null;
  try {
    const session = await getSession();
    resolvedToken = session?.accessToken;
  } catch {}

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}${path}`);
    
    if (resolvedToken) {
      xhr.setRequestHeader("Authorization", `Bearer ${resolvedToken}`);
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
        reject(new Error(`Yükleme başarısız: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network hatası"));

    const formData = new FormData();
    formData.append("file", file); 
    
    xhr.send(formData);
  });
}