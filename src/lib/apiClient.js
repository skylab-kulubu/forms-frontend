const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000";

export async function request(path, options = {}) {
  const finalOptions = {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {}),
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
