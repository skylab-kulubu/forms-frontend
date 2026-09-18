import { eventIdFromReturnTo } from "./return-to.js";

export const FORM_STATUS_CLOSED = 1;
export const FORM_STATUS_OPEN = 2;
export const NEW_FORM_DRAFT_KEY = "skyforms:newFormDraft";

export function nextFieldId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

export function cloneSchema(schema, nextId = nextFieldId) {
  if (!Array.isArray(schema)) return [];
  return schema.map((field) => ({
    ...field,
    id: nextId(),
    props: structuredClone(field.props ?? {}),
  }));
}

function fold(value) {
  return String(value || "")
    .toLocaleLowerCase("tr-TR")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9]+/g, "");
}

export function matchesGroupTemplate(groupTitle, ownerTeam) {
  const group = fold(groupTitle);
  const team = fold(ownerTeam);
  if (!group || !team) return false;
  return group === team || group.includes(team) || team.includes(group);
}

export function eventHandoffFromSearch(search) {
  const get = (name) => {
    if (!search) return "";
    if (typeof search.get === "function") return (search.get(name) ?? "").trim();
    return String(search[name] ?? "").trim();
  };
  const returnTo = get("returnTo");
  const published = get("published");
  const eventId = get("eventId") || eventIdFromReturnTo(returnTo);
  const eventLinked = Boolean(returnTo) || Boolean(eventId);
  return {
    title: get("title"),
    ownerTeam: get("ownerTeam"),
    fromForm: get("fromForm") || null,
    eventId: eventId || null,
    eventLinked,
    open: eventLinked && published !== "0" && published !== "false",
  };
}

export function draftStorageKey(returnTo) {
  return `${NEW_FORM_DRAFT_KEY}:${returnTo || "anon"}`;
}

export function readNewFormDraft(storage, returnTo) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(draftStorageKey(returnTo));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      title: typeof parsed.title === "string" ? parsed.title : "",
      description: typeof parsed.description === "string" ? parsed.description : "",
      schema: Array.isArray(parsed.schema) ? parsed.schema : [],
      status: Number(parsed.status) || FORM_STATUS_OPEN,
      allowAnonymousResponses: Boolean(parsed.allowAnonymousResponses),
      allowMultipleResponses: Boolean(parsed.allowMultipleResponses),
      requiresManualReview: Boolean(parsed.requiresManualReview),
    };
  } catch {
    return null;
  }
}

export function writeNewFormDraft(storage, returnTo, draft) {
  if (!storage || !returnTo) return;
  try {
    storage.setItem(draftStorageKey(returnTo), JSON.stringify(draft));
  } catch {
    /* quota */
  }
}

export function clearNewFormDraft(storage, returnTo) {
  if (!storage) return;
  try {
    storage.removeItem(draftStorageKey(returnTo));
  } catch {
    /* ignore */
  }
}

export function pickTemplateGroup(groups, ownerTeam) {
  const rows = Array.isArray(groups) ? groups : [];
  return (
    rows.find(
      (group) =>
        matchesGroupTemplate(group?.title, ownerTeam) &&
        Array.isArray(group?.schema) &&
        group.schema.length > 0,
    ) ?? null
  );
}
