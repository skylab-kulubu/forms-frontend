const PREFIX = "skyforms:utm:";
const KEYS = ["source", "medium", "campaign", "term", "content"];

function sessionStore() {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

export function captureAttribution(formId, search) {
  if (!formId) return;
  const params = new URLSearchParams(search || "");
  const tags = {};
  for (const key of KEYS) {
    const value = params.get(`utm_${key}`)?.trim();
    if (value) tags[key] = value.slice(0, 200);
  }
  if (Object.keys(tags).length === 0) return;
  try {
    sessionStore()?.setItem(PREFIX + formId, JSON.stringify(tags));
  } catch {}
}

export function readAttribution(...formIds) {
  const store = sessionStore();
  if (!store) return null;
  for (const formId of formIds) {
    if (!formId) continue;
    try {
      const raw = store.getItem(PREFIX + formId);
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
}
