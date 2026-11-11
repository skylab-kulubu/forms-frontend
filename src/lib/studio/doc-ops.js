export const SETTING_KEYS = [
  "title", "description", "status", "allowAnonymousResponses", "allowMultipleResponses", "requiresManualReview", "task", "closesAt", "timeLimitMinutes", "brand",
];

const FIELD_PARTS = new Set(["type", "props", "condition"]);
const RESERVED_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const MAX_KEY_LENGTH = 64;
const BRAND_KEY = /^[a-z0-9-]{1,32}$/;

export const isKey = (key) => typeof key === "string" && key.length > 0 && key.length <= MAX_KEY_LENGTH && !RESERVED_KEYS.has(key);

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

export function deepEqual(left, right) {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return (left ?? null) === (right ?? null);
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  if (Array.isArray(left)) return left.length === right.length && left.every((item, index) => deepEqual(item, right[index]));
  const leftKeys = Object.keys(left).filter((key) => left[key] !== undefined);
  const rightKeys = Object.keys(right).filter((key) => right[key] !== undefined);
  return leftKeys.length === rightKeys.length && leftKeys.every((key) => Object.hasOwn(right, key) && deepEqual(left[key], right[key]));
}

export function normalizeDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function normalizeTask(task) {
  if (!isObject(task) || typeof task.content !== "string") return null;
  return {
    content: task.content,
    collapsible: typeof task.collapsible === "boolean" ? task.collapsible : true,
    downloadable: typeof task.downloadable === "boolean" ? task.downloadable : true,
  };
}

export function normalizeSetting(key, value) {
  switch (key) {
    case "title":
      return typeof value === "string" ? value : "";
    case "description":
      return typeof value === "string" ? value : null;
    case "status":
      return Number(value) === 2 ? 2 : 1;
    case "allowAnonymousResponses":
    case "allowMultipleResponses":
    case "requiresManualReview":
      return Boolean(value);
    case "task":
      return normalizeTask(value);
    case "closesAt":
      return normalizeDate(value);
    case "timeLimitMinutes":
      return Number.isInteger(value) ? value : null;
    case "brand":
      return typeof value === "string" && BRAND_KEY.test(value) ? value : null;
    default:
      return value ?? null;
  }
}

export function normalizeProps(props) {
  const next = {};
  if (!isObject(props)) return next;
  Object.entries(props).forEach(([key, value]) => {
    if (isKey(key) && value !== null && value !== undefined) next[key] = value;
  });
  return next;
}

export function normalizeField(field) {
  if (!isObject(field) || typeof field.id !== "string" || typeof field.type !== "string") return null;
  let type = field.type;
  let props = normalizeProps(field.props);
  if (type === "link") {
    type = "short_text";
    props = { ...props, inputType: "link", allowMultiple: props.allowMultiple ?? false };
  }
  const next = { id: field.id, type, props };
  if (isObject(field.condition) && Object.keys(field.condition).length > 0) next.condition = field.condition;
  return next;
}

export function normalizeDocument(source = {}) {
  const document = {};
  SETTING_KEYS.forEach((key) => {
    document[key] = normalizeSetting(key, source?.[key]);
    if (key === "description") document.schema = (Array.isArray(source?.schema) ? source.schema : []).map(normalizeField).filter(Boolean);
  });
  return document;
}

export function normalizeOpValue(path, value) {
  if (path.length === 1) return normalizeSetting(path[0], value);
  if (path[2] === "props") return path.length === 3 ? normalizeProps(value) : value ?? null;
  if (path[2] === "condition") return isObject(value) && Object.keys(value).length > 0 ? value : null;
  return value ?? null;
}

const indexOf = (document, id) => document.schema.findIndex((field) => field?.id === id);

const fieldAt = (document, id) => document.schema[indexOf(document, id)] ?? null;

const predecessorOf = (document, id) => {
  const index = indexOf(document, id);
  return index > 0 ? document.schema[index - 1].id : null;
};

function validPath(path) {
  if (!Array.isArray(path) || !path.every((part) => typeof part === "string")) return false;
  if (path.length === 1) return SETTING_KEYS.includes(path[0]);
  if (path[0] !== "schema" || !isKey(path[1])) return false;
  if (path.length === 3) return FIELD_PARTS.has(path[2]);
  return path.length === 4 && path[2] === "props" && isKey(path[3]);
}

function valueAt(document, path) {
  if (path.length === 1) return document[path[0]] ?? null;
  const field = fieldAt(document, path[1]);
  if (!field) return undefined;
  if (path.length === 3) return field[path[2]] ?? null;
  return field.props?.[path[3]] ?? null;
}

function applySet(document, path, value) {
  if (!validPath(path)) return null;
  if (path.length === 1) return { ...document, [path[0]]: value };

  const index = indexOf(document, path[1]);
  if (index < 0) return null;

  const field = document.schema[index];
  let next;

  if (path.length === 3) {
    if (value === null || value === undefined) {
      next = { ...field };
      delete next[path[2]];
    } else {
      next = { ...field, [path[2]]: value };
    }
  } else {
    const props = { ...(field.props ?? {}) };
    if (value === null || value === undefined) delete props[path[3]];
    else props[path[3]] = value;
    next = { ...field, props };
  }

  const schema = document.schema.slice();
  schema[index] = next;
  return { ...document, schema };
}

function applyInsert(document, field, after) {
  if (!field || !isKey(field.id) || indexOf(document, field.id) >= 0) return null;
  const anchor = after == null ? -1 : indexOf(document, after);
  const at = after == null ? 0 : anchor >= 0 ? anchor + 1 : document.schema.length;
  const schema = document.schema.slice();
  schema.splice(at, 0, field);
  return { ...document, schema };
}

function applyRemove(document, id) {
  const index = indexOf(document, id);
  if (index < 0) return null;
  return { ...document, schema: document.schema.filter((_, position) => position !== index) };
}

function applyMove(document, id, after) {
  const from = indexOf(document, id);
  if (from < 0 || id === after || (after != null && indexOf(document, after) < 0)) return null;
  const schema = document.schema.slice();
  const [field] = schema.splice(from, 1);
  const anchor = after == null ? -1 : schema.findIndex((item) => item.id === after);
  schema.splice(anchor + 1, 0, field);
  return { ...document, schema };
}

export function applyOp(document, op, published = null) {
  switch (op?.op) {
    case "set":
      return applySet(document, op.path, op.value);
    case "insert":
      return applyInsert(document, op.field, op.after ?? null);
    case "remove":
      return applyRemove(document, op.id);
    case "move":
      return applyMove(document, op.id, op.after ?? null);
    case "replace":
      return isObject(op.document) ? op.document : null;
    case "reset":
      return published ?? null;
    default:
      return null;
  }
}

export const applyAll = (document, ops, published = null) => ops.reduce((current, op) => applyOp(current, op, published) ?? current, document);

export function inverseOf(document, op, published = null) {
  switch (op.op) {
    case "set":
      return { op: "set", path: op.path, value: valueAt(document, op.path) ?? null, expect: op.value ?? null };
    case "insert":
      return { op: "remove", id: op.field.id, expect: op.field };
    case "remove":
      return { op: "insert", field: fieldAt(document, op.id), after: predecessorOf(document, op.id), expect: null };
    case "move":
      return { op: "move", id: op.id, after: predecessorOf(document, op.id), expect: op.after ?? null };
    case "replace":
      return { op: "replace", document, expect: op.document };
    case "reset":
      return { op: "replace", document, expect: published };
    default:
      return null;
  }
}

export function holds(document, inverse) {
  switch (inverse.op) {
    case "set":
      return valueAt(document, inverse.path) !== undefined && deepEqual(valueAt(document, inverse.path) ?? null, inverse.expect ?? null);
    case "remove":
      return deepEqual(fieldAt(document, inverse.id), inverse.expect);
    case "insert":
      return indexOf(document, inverse.field.id) < 0;
    case "move":
      return indexOf(document, inverse.id) >= 0 && predecessorOf(document, inverse.id) === (inverse.expect ?? null);
    case "replace":
      return inverse.expect != null && deepEqual(document, inverse.expect);
    default:
      return false;
  }
}

export const withoutExpect = ({ expect, ...op }) => op;

export function applyTracked(document, ops, published = null) {
  let current = document;
  const applied = [];
  const inverse = [];
  ops.forEach((op) => {
    const next = applyOp(current, op, published);
    if (!next) return;
    inverse.unshift(inverseOf(current, op, published));
    applied.push(op);
    current = next;
  });
  return { document: current, applied, inverse };
}

export function compact(ops) {
  return ops.reduce((merged, op) => {
    const last = merged[merged.length - 1];
    if (last?.op === "set" && op.op === "set" && last.path.length === op.path.length && last.path.every((part, index) => part === op.path[index])) {
      merged[merged.length - 1] = op;
    } else {
      merged.push(op);
    }
    return merged;
  }, []);
}

const overlaps = (path, other) => path.every((part, index) => index >= other.length || part === other[index]);

export function overwrittenPaths(ops, theirs, document) {
  const latest = new Map();
  ops.forEach((op) => {
    if (op.op === "set") latest.set(op.path.join("/"), op);
  });

  return [...latest.values()]
    .filter(({ path, value }) => {
      const current = valueAt(document, path);
      if (current === undefined || deepEqual(current ?? null, value ?? null)) return false;
      return theirs.some((op) => op.op === "replace" || op.op === "reset" || (op.op === "set" && overlaps(path, op.path)));
    })
    .map(({ path }) => path);
}

export function isTrustedOp(op) {
  switch (op?.op) {
    case "set":
      return validPath(op.path);
    case "insert":
      return isObject(op.field) && isKey(op.field.id) && Object.keys(op.field.props ?? {}).every(isKey);
    case "remove":
    case "move":
      return isKey(op.id) && (op.after == null || isKey(op.after));
    case "replace":
      return isObject(op.document) && Array.isArray(op.document.schema);
    case "reset":
      return true;
    default:
      return false;
  }
}
