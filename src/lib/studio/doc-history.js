import { applyOp, holds, inverseOf, withoutExpect } from "./doc-ops.js";

const GROUP_MS = 1000;
const LIMIT = 100;

const groupKeyOf = (ops) => (ops.length === 1 && ops[0].op === "set" ? ops[0].path.join("\u0000") : null);

export function createHistory() {
  const undo = [];
  const redo = [];
  let last = null;

  function record(inverse, applied, { group = true } = {}) {
    if (!inverse.length) return;
    const key = group ? groupKeyOf(applied) : null;
    const now = Date.now();
    const top = undo[undo.length - 1];

    if (key && top && last?.key === key && now - last.at < GROUP_MS) {
      top.ops = top.ops.map((op) => ({ ...op, expect: applied[0].value ?? null }));
    } else {
      undo.push({ ops: inverse });
      if (undo.length > LIMIT) undo.shift();
    }

    last = { key, at: now };
    redo.length = 0;
  }

  function travel(from, to, document, published) {
    const entry = from.pop();
    if (!entry) return null;

    let current = document;
    const ops = [];
    const back = [];

    entry.ops.forEach((op) => {
      if (!holds(current, op)) return;
      const plain = withoutExpect(op);
      const next = applyOp(current, plain, published);
      if (!next) return;
      back.unshift(inverseOf(current, plain, published));
      ops.push(plain);
      current = next;
    });

    if (ops.length) to.push({ ops: back });
    last = null;
    return { ops, skipped: entry.ops.length - ops.length };
  }

  return {
    record,
    undo: (document, published) => travel(undo, redo, document, published),
    redo: (document, published) => travel(redo, undo, document, published),
    breakGroup: () => { last = null; },
    canUndo: () => undo.length > 0,
    canRedo: () => redo.length > 0,
  };
}
