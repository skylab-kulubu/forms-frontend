import { applyAll, applyTracked, deepEqual, normalizeDocument, normalizeOpValue } from "./doc-ops.js";
import { createHistory } from "./doc-history.js";
import { schemaOps } from "./schema-ops.js";

const EVENT_ONLY_IDENTITY = ["firstName", "lastName"];
const NEW_DRAFT_KEY = "skyforms:templateDraft:new";

export const UNTITLED_TEMPLATE = "Adsız şablon";

function readNewDraft() {
  try {
    const raw = window.sessionStorage.getItem(NEW_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeNewDraft(document) {
  try {
    if (document) window.sessionStorage.setItem(NEW_DRAFT_KEY, JSON.stringify({ title: document.title, description: document.description, schema: document.schema }));
    else window.sessionStorage.removeItem(NEW_DRAFT_KEY);
  } catch {
    return;
  }
}

export function templateFieldsOf(schema) {
  if (!Array.isArray(schema)) return [];
  return schema.map((field) => {
    if (!EVENT_ONLY_IDENTITY.includes(field?.props?.identity)) return field;
    const { identity, ...props } = field.props;
    return { ...field, props };
  });
}

function documentOf(group) {
  return normalizeDocument({ title: group?.title ?? "", description: group?.description ?? "", schema: templateFieldsOf(group?.schema) });
}

export function createTemplateDoc(group = null, draft = null) {
  const listeners = new Set();
  const history = createHistory();

  let id = group?.id ?? null;
  let saved = documentOf(group);
  let view = saved;
  let savedAt = null;
  let cached = null;
  let restored = false;

  const stored = id ? draft : readNewDraft();
  if (stored && !deepEqual(documentOf(stored), saved)) {
    view = documentOf(stored);
    restored = true;
  }

  const keepNewDraft = () => {
    if (!id) writeNewDraft(deepEqual(view, saved) ? null : view);
  };

  function emit() {
    cached = null;
    listeners.forEach((listener) => listener());
  }

  function getSnapshot() {
    if (!cached) {
      cached = {
        id, view,
        version: 0,
        dirty: !deepEqual(view, saved),
        form: null,
        team: [],
        canEdit: true,
        online: true,
        syncedAt: null,
        publishedAt: savedAt,
        failure: null,
        pending: false,
        canUndo: history.canUndo(),
        canRedo: history.canRedo(),
        neverPublished: !id,
        restored,
      };
    }
    return cached;
  }

  function edit(ops, { record = true, group: grouped = true } = {}) {
    if (!ops.length) return false;
    const result = applyTracked(view, ops, saved);
    if (!result.applied.length) return false;
    if (record) history.record(result.inverse, result.applied, { group: grouped });
    view = result.document;
    keepNewDraft();
    emit();
    return true;
  }

  function travel(direction) {
    const result = direction < 0 ? history.undo(view, saved) : history.redo(view, saved);
    if (!result) return;
    if (result.ops.length) view = applyAll(view, result.ops, saved);
    keepNewDraft();
    emit();
  }

  return {
    get id() {
      return id;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot,
    getView: () => view,
    edit,
    set: (path, value) => edit([{ op: "set", path, value: normalizeOpValue(path, value) }]),
    setSchema: (next) => edit(schemaOps(view.schema, next)),
    discard: () => edit([{ op: "reset" }], { group: false }),
    clearRestored() {
      restored = false;
      emit();
    },
    undo: () => travel(-1),
    redo: () => travel(1),
    payload: () => ({ Id: id, Title: view.title?.trim() || UNTITLED_TEMPLATE, Description: view.description ?? "", Schema: view.schema }),
    markSaved(result, sent = view) {
      writeNewDraft(null);
      restored = false;
      id = result?.id ?? id;
      const title = result?.title ?? sent.title;
      saved = { ...sent, title };
      if (!view.title?.trim()) view = { ...view, title };
      savedAt = new Date();
      emit();
    },
  };
}
