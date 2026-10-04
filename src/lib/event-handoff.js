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
  const ids = new Map(schema.map((field) => [field.id, nextId()]));
  return schema.map((field) => {
    const clone = { ...field, id: ids.get(field.id), props: structuredClone(field.props ?? {}) };
    const target = field.condition?.fieldId;
    if (target && ids.has(target)) {
      clone.condition = { ...field.condition, fieldId: ids.get(target) };
    }
    return clone;
  });
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

export const IDENTITY_FIRST_NAME = "firstName";
export const IDENTITY_LAST_NAME = "lastName";
export const IDENTITY_EMAIL = "email";
export const EVENT_IDENTITY_KEYS = [IDENTITY_FIRST_NAME, IDENTITY_LAST_NAME, IDENTITY_EMAIL];

const IDENTITY_SPECS = {
  [IDENTITY_FIRST_NAME]: { question: "Ad", inputType: "name" },
  [IDENTITY_LAST_NAME]: { question: "Soyad", inputType: "name" },
  [IDENTITY_EMAIL]: { question: "E-posta", inputType: "email" },
};

export function identityKeyOf(field) {
  const key = field?.props?.identity;
  return EVENT_IDENTITY_KEYS.includes(key) ? key : null;
}

export function isIdentityField(field) {
  return Boolean(identityKeyOf(field));
}

function guessIdentityKey(field, used) {
  const marked = identityKeyOf(field);
  if (marked && !used.has(marked)) return marked;
  if (field?.type !== "short_text") return null;
  const input = fold(field?.props?.inputType);
  const question = fold(field?.props?.question);
  if (!used.has(IDENTITY_EMAIL) && (input === "email" || question.includes("eposta") || question === "email" || question === "mail")) {
    return IDENTITY_EMAIL;
  }
  if (!used.has(IDENTITY_LAST_NAME) && (question.includes("soyad") || question === "lastname" || question === "surname")) {
    return IDENTITY_LAST_NAME;
  }
  if (
    !used.has(IDENTITY_FIRST_NAME) &&
    (question === "ad" || question === "adiniz" || question === "isim" || question === "isminiz" || question === "firstname" || question === "name")
  ) {
    return IDENTITY_FIRST_NAME;
  }
  if (!used.has(IDENTITY_FIRST_NAME) && input === "name") return IDENTITY_FIRST_NAME;
  return null;
}

function stampIdentity(field, key) {
  const spec = IDENTITY_SPECS[key];
  const props = { ...(field.props ?? {}) };
  props.identity = key;
  props.required = true;
  props.inputType = spec.inputType;
  if (!props.question) props.question = spec.question;
  const next = { ...field, props };
  if (next.condition && Object.keys(next.condition).length > 0) {
    const { condition, ...rest } = next;
    return rest;
  }
  return next;
}

export function ensureEventIdentityFields(schema) {
  const source = Array.isArray(schema) ? schema.map((field) => ({ ...field, props: { ...(field.props ?? {}) } })) : [];
  const used = new Set();
  const byKey = {};
  const claimed = new Set();
  for (const field of source) {
    const key = guessIdentityKey(field, used);
    if (!key) continue;
    used.add(key);
    byKey[key] = stampIdentity(field, key);
    claimed.add(field.id);
  }
  const identity = EVENT_IDENTITY_KEYS.map((key) => {
    if (byKey[key]) return byKey[key];
    return stampIdentity(
      { id: `identity:${key}`, type: "short_text", props: { question: IDENTITY_SPECS[key].question } },
      key,
    );
  });
  const rest = source.filter((field) => !claimed.has(field.id));
  return [...identity, ...rest];
}
