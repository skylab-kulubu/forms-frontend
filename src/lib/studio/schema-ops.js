import { normalizeField, normalizeOpValue } from "./doc-ops.js";

function stableIds(positions) {
  const tails = [];
  const tailIndex = [];
  const previous = new Array(positions.length).fill(-1);

  positions.forEach((position, index) => {
    let low = 0;
    let high = tails.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (tails[middle] < position) low = middle + 1;
      else high = middle;
    }
    tails[low] = position;
    tailIndex[low] = index;
    previous[index] = low > 0 ? tailIndex[low - 1] : -1;
  });

  const kept = new Set();
  for (let index = tails.length ? tailIndex[tails.length - 1] : -1; index >= 0; index = previous[index]) kept.add(index);
  return kept;
}

function fieldOps(old, field) {
  const path = ["schema", field.id];
  const ops = [];

  if (old.type !== field.type) {
    ops.push({ op: "set", path: [...path, "type"], value: field.type });
    ops.push({ op: "set", path: [...path, "props"], value: normalizeOpValue([...path, "props"], field.props) });
  } else if (old.props !== field.props) {
    const before = old.props ?? {};
    const after = field.props ?? {};
    new Set([...Object.keys(before), ...Object.keys(after)]).forEach((key) => {
      if ((before[key] ?? null) === (after[key] ?? null)) return;
      ops.push({ op: "set", path: [...path, "props", key], value: after[key] ?? null });
    });
  }

  if (old.condition !== field.condition) {
    const value = normalizeOpValue([...path, "condition"], field.condition);
    if ((old.condition ?? null) !== value) ops.push({ op: "set", path: [...path, "condition"], value });
  }

  return ops;
}

export function schemaOps(previous, next) {
  const ops = [];
  const before = new Map(previous.map((field, index) => [field.id, { field, index }]));
  const nextIds = new Set(next.map((field) => field.id));

  previous.forEach((field) => {
    if (!nextIds.has(field.id)) ops.push({ op: "remove", id: field.id });
  });

  const keptOrder = next.filter((field) => before.has(field.id));
  const stable = stableIds(keptOrder.map((field) => before.get(field.id).index));
  const stableSet = new Set([...stable].map((index) => keptOrder[index].id));

  next.forEach((field, index) => {
    const after = index === 0 ? null : next[index - 1].id;
    const old = before.get(field.id);

    if (!old) {
      const normalized = normalizeField(field);
      if (normalized) ops.push({ op: "insert", field: normalized, after });
      return;
    }

    if (!stableSet.has(field.id)) ops.push({ op: "move", id: field.id, after });
    if (old.field !== field) ops.push(...fieldOps(old.field, field));
  });

  return ops;
}
