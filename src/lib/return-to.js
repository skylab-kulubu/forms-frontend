export const RETURN_TO_KEY = "skyforms:returnTo";
export const DEFAULT_ADMIN_ORIGIN = "https://admin.yildizskylab.com";
export const DEFAULT_FORMS_ORIGIN = "https://forms.yildizskylab.com";

export function adminOrigin(env = process.env.NEXT_PUBLIC_ADMIN_URL) {
  return String(env || DEFAULT_ADMIN_ORIGIN).replace(/\/+$/, "");
}

export function formsPublicOrigin(env = process.env.NEXT_PUBLIC_SITE_URL) {
  return String(env || DEFAULT_FORMS_ORIGIN).replace(/\/+$/, "");
}

export function sanitizeReturnTo(raw, adminHref = adminOrigin()) {
  if (!raw || typeof raw !== "string") return null;
  try {
    const url = new URL(raw);
    const allowed = new URL(adminHref);
    if (url.origin !== allowed.origin) return null;
    if (url.protocol !== "https:" && url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

export function captureReturnTo(raw, storage, adminHref = adminOrigin()) {
  const allowed = sanitizeReturnTo(raw, adminHref);
  if (allowed && storage) storage.setItem(RETURN_TO_KEY, allowed);
  return allowed;
}

export function readStoredReturnTo(storage, adminHref = adminOrigin()) {
  if (!storage) return null;
  try {
    return sanitizeReturnTo(storage.getItem(RETURN_TO_KEY), adminHref);
  } catch {
    return null;
  }
}

export function publicFormUrl(formId, site = formsPublicOrigin()) {
  const id = String(formId || "").trim();
  if (!id) return "";
  const origin = String(site || "").replace(/\/+$/, "") || DEFAULT_FORMS_ORIGIN;
  return `${origin}/${id}`;
}

export function returnToEventHref(returnTo, formId, site = formsPublicOrigin(), adminHref = adminOrigin()) {
  const base = sanitizeReturnTo(returnTo, adminHref);
  const formUrl = publicFormUrl(formId, site);
  if (!base || !formUrl) return null;
  const url = new URL(base);
  url.searchParams.set("formUrl", formUrl);
  return url.toString();
}

export function editPathWithReturnTo(formId, returnTo, adminHref = adminOrigin()) {
  const path = `/admin/forms/${formId}/edit`;
  const allowed = sanitizeReturnTo(returnTo, adminHref);
  if (!allowed) return path;
  return `${path}?returnTo=${encodeURIComponent(allowed)}`;
}

const EVENT_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function eventIdFromReturnTo(returnTo, adminHref = adminOrigin()) {
  const allowed = sanitizeReturnTo(returnTo, adminHref);
  if (!allowed) return null;
  try {
    const parts = new URL(allowed).pathname.split("/").filter(Boolean);
    if (parts[0] !== "events" || parts.length < 2) return null;
    const id = parts[1];
    return EVENT_ID_RE.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function eventAdminHref(eventId, adminHref = adminOrigin()) {
  const id = String(eventId || "").trim();
  if (!EVENT_ID_RE.test(id)) return null;
  return `${String(adminHref).replace(/\/+$/, "")}/events/${id}`;
}

export function eventRefFromForm(form, returnTo, adminHref = adminOrigin()) {
  const nested = form?.event && typeof form.event === "object" ? form.event : null;
  const id = nested?.id || form?.eventId || eventIdFromReturnTo(returnTo, adminHref);
  if (!id) return null;
  const href = eventAdminHref(id, adminHref);
  if (!href) return null;
  const name = nested?.name || form?.eventName || "";
  return { id, name, href };
}
