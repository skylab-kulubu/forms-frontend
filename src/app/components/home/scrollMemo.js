const memo = new WeakMap();
const watchers = new WeakMap();

export function remember(box) {
  memo.set(box, box.scrollTop);
  watchers.get(box)?.forEach((run) => run());
}

export function recall(box) {
  return memo.has(box) ? memo.get(box) : box.scrollTop;
}

export function watch(box, run) {
  const list = watchers.get(box) ?? new Set();
  watchers.set(box, list);
  list.add(run);
  return () => list.delete(run);
}
