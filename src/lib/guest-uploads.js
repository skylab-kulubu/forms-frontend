const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const GUEST_SESSION_HEADER = "X-Guest-Upload-Session";

const GUEST_TYPES = {
  "application/pdf": { label: "PDF", extensions: [".pdf"] },
  "image/jpeg": { label: "JPG", extensions: [".jpg", ".jpeg", ".jpe", ".jfif"] },
  "image/png": { label: "PNG", extensions: [".png"] },
};

const ACCEPT_RULES = {
  ".pdf": ["application/pdf"],
  ".jpg": ["image/jpeg"],
  ".jpeg": ["image/jpeg"],
  ".jpe": ["image/jpeg"],
  ".jfif": ["image/jpeg"],
  ".png": ["image/png"],
  "image/*": ["image/jpeg", "image/png"],
  "application/*": ["application/pdf"],
  "application/pdf": ["application/pdf"],
  "image/jpeg": ["image/jpeg"],
  "image/jpg": ["image/jpeg"],
  "image/pjpeg": ["image/jpeg"],
  "image/png": ["image/png"],
};

const SCAN_RESULT_COPY = {
  infected: "Dosyada zararlı içerik bulundu ve silindi. Temiz bir kopyasını yükleyin.",
  too_large_to_scan: "Dosya bütünüyle taranamadı. Daha sade bir kopya ya da PDF yükleyin.",
  archive_invalid: "Dosya bozuk ya da şifreli. Şifresiz, sağlam bir kopya yükleyin.",
  archive_nested: "Dosyanın içindeki arşivleri açıp tekrar yükleyin.",
  lost: "Dosya işlenemedi. Lütfen yeniden yükleyin.",
  integrity: "Dosya işlenemedi. Lütfen yeniden yükleyin.",
  scan_timeout: "Tarama tamamlanamadı. Lütfen yeniden yükleyin.",
};

export function scanResultCopy(code) {
  return SCAN_RESULT_COPY[code] ?? "Dosya güvenlik taramasından geçmedi. Başka bir dosya yükleyin.";
}

export function waitCopy(seconds) {
  const total = Math.max(1, Math.ceil(Number(seconds || 0)));
  if (total < 60) return `${total} saniye`;
  return `${Math.ceil(total / 60)} dakika`;
}

export function guestFileRules(acceptedFiles, maxSize, capability) {
  const allowed = new Set(capability?.types ?? []);
  const rules = typeof acceptedFiles === "string"
    ? acceptedFiles.split(",").map((rule) => rule.trim().toLowerCase()).filter(Boolean)
    : [];
  const wanted = rules.length ? new Set(rules.flatMap((rule) => ACCEPT_RULES[rule] ?? [])) : new Set(Object.keys(GUEST_TYPES));
  const types = Object.keys(GUEST_TYPES).filter((type) => allowed.has(type) && wanted.has(type));
  const questionBytes = Number(maxSize) > 0 ? Number(maxSize) * 1024 * 1024 : Infinity;
  const maxBytes = Math.min(Number(capability?.maxBytes) || 0, questionBytes);

  return {
    types,
    maxBytes,
    accept: types.flatMap((type) => GUEST_TYPES[type].extensions).join(","),
    label: types.map((type) => GUEST_TYPES[type].label).join(", "),
  };
}

export function fileMatchesGuestTypes(file, types) {
  const name = (file?.name || "").toLowerCase();
  const extension = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const type = (file?.type || "").toLowerCase();
  return types.some((allowed) => allowed === type || GUEST_TYPES[allowed]?.extensions.includes(extension));
}

export function guestReasonOf(error) {
  return error?.body?.data?.reason ?? null;
}

async function guestRequest(path, { method = "GET", body, headers = {} } = {}) {
  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      cache: "no-store",
      headers: { ...(body ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    const error = new Error("network");
    error.status = 0;
    throw error;
  }

  let data = null;
  try { data = await response.json(); } catch { }

  if (!response.ok) {
    const error = new Error(data?.message || `İstek başarısız: ${response.status}`);
    error.status = response.status;
    error.body = data;
    throw error;
  }

  return data;
}

export function fetchGuestUploadCapability() {
  return guestRequest("/api/forms/guest-uploads");
}

export function fetchTurnstileStatus() {
  return guestRequest("/api/forms/turnstile");
}

export function createGuestUploadSession(formId, turnstileToken) {
  return guestRequest(`/api/forms/${formId}/guest-uploads/sessions`, { method: "POST", body: { turnstileToken } });
}

export function fetchGuestUploadStatus(formId, sessionId, mediaId) {
  return guestRequest(`/api/forms/${formId}/guest-uploads/${mediaId}`, { headers: { [GUEST_SESSION_HEADER]: sessionId } });
}

export function uploadGuestFile({ formId, sessionId, questionId, file, onProgress }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${BASE_URL}/api/forms/${formId}/guest-uploads`);
    xhr.setRequestHeader(GUEST_SESSION_HEADER, sessionId);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch { }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
        return;
      }
      const error = new Error(data?.message || `Yükleme başarısız: ${xhr.status}`);
      error.status = xhr.status;
      error.body = data;
      reject(error);
    };

    xhr.onerror = () => {
      const error = new Error("network");
      error.status = 0;
      reject(error);
    };

    const formData = new FormData();
    formData.append("questionId", questionId);
    formData.append("file", file);
    xhr.send(formData);
  });
}
