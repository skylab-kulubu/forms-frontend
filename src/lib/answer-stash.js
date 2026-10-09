const ANSWERS_PREFIX = "skyforms:answers:";
const ANSWERS_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function read(key) {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}

function write(key, value) {
  try { sessionStorage.setItem(key, JSON.stringify(value)); } catch { }
}

function remove(key) {
  try { sessionStorage.removeItem(key); } catch { }
}

export function saveAnswers(formId, { values, files }, reason) {
  if (!formId) return;
  if (!Object.keys(values).length && !files.length) {
    remove(ANSWERS_PREFIX + formId);
    return;
  }
  write(ANSWERS_PREFIX + formId, { v: 1, reason, savedAt: Date.now(), values, files });
}

export function loadAnswers(formId) {
  if (!formId) return null;
  const stash = read(ANSWERS_PREFIX + formId);
  if (stash?.v !== 1 || !stash.values || Date.now() - stash.savedAt > ANSWERS_MAX_AGE_MS) return null;
  return { reason: stash.reason, values: stash.values, files: Array.isArray(stash.files) ? stash.files : [] };
}

export function clearAnswers(formId) {
  if (formId) remove(ANSWERS_PREFIX + formId);
}

