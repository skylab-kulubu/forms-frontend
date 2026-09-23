export const TRIGGER = { SUBMITTED: 0, APPROVED: 1, DECLINED: 2 };

export const MAX_ROUTE_LENGTH = 3;

const COLUMN_WIDTH = 330;
const ROW_HEIGHT = 140;
const ORIGIN_X = 24;
const ORIGIN_Y = 32;

const TR_MAP = { ç: "c", ğ: "g", ı: "i", İ: "i", ö: "o", ş: "s", ü: "u" };

export function slugifyNodeKey(title, takenKeys = []) {
  const base = String(title || "adim")
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıİöşü]/g, (char) => TR_MAP[char] ?? char)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "adim";

  if (!takenKeys.includes(base)) return base;

  let index = 2;
  while (takenKeys.includes(`${base}-${index}`)) index += 1;
  return `${base}-${index}`;
}

export function triggersForNode(node) {
  return node?.requiresManualReview ? [TRIGGER.APPROVED, TRIGGER.DECLINED] : [TRIGGER.SUBMITTED];
}

function outgoing(transitions, nodeKey) {
  return transitions.filter((transition) => transition.sourceNodeKey === nodeKey && transition.targetNodeKey);
}

export function descendantsOf(nodeKey, transitions) {
  const seen = new Set();
  const stack = [nodeKey];

  while (stack.length > 0) {
    const current = stack.pop();
    for (const transition of outgoing(transitions, current)) {
      if (seen.has(transition.targetNodeKey)) continue;
      seen.add(transition.targetNodeKey);
      stack.push(transition.targetNodeKey);
    }
  }

  return seen;
}

export function wouldCreateCycle(sourceKey, targetKey, transitions) {
  return sourceKey === targetKey || descendantsOf(targetKey, transitions).has(sourceKey);
}

export function hasCycle(nodes, transitions) {
  return nodes.some((node) => descendantsOf(node.nodeKey, transitions).has(node.nodeKey));
}

export function depthMap(nodes, transitions) {
  const startNode = nodes.find((node) => node.isStart);
  const depths = new Map();
  if (!startNode) return depths;

  depths.set(startNode.nodeKey, 1);
  const queue = [startNode.nodeKey];
  let guard = nodes.length * transitions.length + nodes.length + 1;

  while (queue.length > 0 && guard > 0) {
    guard -= 1;
    const current = queue.shift();
    const currentDepth = depths.get(current) ?? 1;

    for (const transition of outgoing(transitions, current)) {
      const target = transition.targetNodeKey;
      const next = currentDepth + 1;
      if ((depths.get(target) ?? 0) >= next) continue;
      depths.set(target, next);
      queue.push(target);
    }
  }

  return depths;
}

export function wouldExceedDepth(sourceKey, targetKey, nodes, transitions) {
  const depths = depthMap(nodes, transitions);
  const sourceDepth = depths.get(sourceKey);
  if (!sourceDepth) return false;

  const tailLength = longestTail(targetKey, transitions, new Set());
  return sourceDepth + 1 + tailLength > MAX_ROUTE_LENGTH;
}

function longestTail(nodeKey, transitions, visiting) {
  if (visiting.has(nodeKey)) return 0;
  visiting.add(nodeKey);

  let longest = 0;
  for (const transition of outgoing(transitions, nodeKey)) {
    longest = Math.max(longest, 1 + longestTail(transition.targetNodeKey, transitions, visiting));
  }

  visiting.delete(nodeKey);
  return longest;
}

export function connectionError(sourceKey, targetKey, nodes, transitions) {
  if (!targetKey) return null;
  if (wouldCreateCycle(sourceKey, targetKey, transitions)) return "cycle";
  if (wouldExceedDepth(sourceKey, targetKey, nodes, transitions)) return "depth";
  return null;
}

/**
 * Bir adımı okuyan koşulun güvenli olması için o adımın başlangıçtan gelen
 * HER rotada bulunması gerekir (backend: conditionNodeNotGuaranteed).
 */
export function guaranteedAncestors(nodeKey, nodes, transitions) {
  const startNode = nodes.find((node) => node.isStart);
  if (!startNode) return [];

  const keys = nodes.map((node) => node.nodeKey);
  const dominators = new Map();
  dominators.set(startNode.nodeKey, new Set([startNode.nodeKey]));

  for (const key of keys) {
    if (key === startNode.nodeKey) continue;
    dominators.set(key, new Set(keys));
  }

  const predecessors = new Map(keys.map((key) => [key, []]));
  for (const transition of transitions) {
    if (!transition.targetNodeKey) continue;
    predecessors.get(transition.targetNodeKey)?.push(transition.sourceNodeKey);
  }

  let changed = true;
  let guard = keys.length * keys.length + 1;

  while (changed && guard > 0) {
    changed = false;
    guard -= 1;

    for (const key of keys) {
      if (key === startNode.nodeKey) continue;
      const preds = predecessors.get(key) ?? [];
      if (preds.length === 0) continue;

      let intersection = null;
      for (const pred of preds) {
        const predDoms = dominators.get(pred) ?? new Set();
        intersection = intersection === null ? new Set(predDoms) : new Set([...intersection].filter((item) => predDoms.has(item)));
      }

      const next = new Set(intersection ?? []);
      next.add(key);

      const current = dominators.get(key) ?? new Set();
      if (next.size !== current.size || [...next].some((item) => !current.has(item))) {
        dominators.set(key, next);
        changed = true;
      }
    }
  }

  const own = dominators.get(nodeKey) ?? new Set();
  return nodes.filter((node) => node.nodeKey !== nodeKey && own.has(node.nodeKey));
}

function routeOrder(a, b) {
  const byTrigger = Number(a.trigger) - Number(b.trigger);
  if (byTrigger !== 0) return byTrigger;
  if (Boolean(a.condition) !== Boolean(b.condition)) return a.condition ? -1 : 1;
  return (a.priority ?? 0) - (b.priority ?? 0);
}

export function flowOrder(nodes, transitions) {
  const depths = depthMap(nodes, transitions);
  const discovered = new Map();
  const startNode = nodes.find((node) => node.isStart);

  if (startNode) {
    discovered.set(startNode.nodeKey, 0);
    const queue = [startNode.nodeKey];

    while (queue.length > 0) {
      const current = queue.shift();
      const routes = outgoing(transitions, current).sort(routeOrder);

      for (const route of routes) {
        if (discovered.has(route.targetNodeKey)) continue;
        discovered.set(route.targetNodeKey, discovered.size);
        queue.push(route.targetNodeKey);
      }
    }
  }

  const inserted = new Map(nodes.map((node, index) => [node.nodeKey, index]));

  return [...nodes].sort((a, b) => {
    const depthA = depths.get(a.nodeKey) ?? Infinity;
    const depthB = depths.get(b.nodeKey) ?? Infinity;
    if (depthA !== depthB) return depthA - depthB;

    const seenA = discovered.get(a.nodeKey) ?? Infinity;
    const seenB = discovered.get(b.nodeKey) ?? Infinity;
    if (seenA !== seenB) return seenA - seenB;

    return inserted.get(a.nodeKey) - inserted.get(b.nodeKey);
  });
}

export function autoLayout(nodes, transitions) {
  const depths = depthMap(nodes, transitions);
  const maxDepth = nodes.reduce((max, node) => Math.max(max, depths.get(node.nodeKey) ?? 0), 0);
  const columns = new Map();

  flowOrder(nodes, transitions).forEach((node) => {
    const depth = depths.get(node.nodeKey) ?? maxDepth + 1;
    columns.set(depth, [...(columns.get(depth) ?? []), node.nodeKey]);
  });

  const tallest = Math.max(1, ...[...columns.values()].map((rows) => rows.length));
  const centerY = ORIGIN_Y + ((tallest - 1) * ROW_HEIGHT) / 2;
  const positions = {};

  columns.forEach((rows, depth) => {
    rows.forEach((nodeKey, index) => {
      positions[nodeKey] = {
        x: ORIGIN_X + (depth - 1) * COLUMN_WIDTH,
        y: Math.round(centerY + (index - (rows.length - 1) / 2) * ROW_HEIGHT),
      };
    });
  });

  return positions;
}

export function nextNodePosition(nodes) {
  if (nodes.length === 0) return { x: ORIGIN_X, y: ORIGIN_Y + ROW_HEIGHT };
  const rightMost = nodes.reduce((max, node) => Math.max(max, node.position?.x ?? 0), 0);
  return { x: rightMost + COLUMN_WIDTH, y: ORIGIN_Y + (nodes.length % 3) * ROW_HEIGHT };
}

export function withPositions(nodes, transitions) {
  const missing = nodes.some((node) => !node.position || typeof node.position.x !== "number");
  if (!missing) return nodes;

  const layout = autoLayout(nodes, transitions);
  return nodes.map((node) => (node.position && typeof node.position.x === "number" ? node : { ...node, position: layout[node.nodeKey] ?? { x: ORIGIN_X, y: ORIGIN_Y } }));
}

export function groupTransitions(transitions, nodeKey, trigger) {
  return transitions
    .filter((transition) => transition.sourceNodeKey === nodeKey && Number(transition.trigger) === trigger)
    .sort((a, b) => {
      const aDefault = !a.condition;
      const bDefault = !b.condition;
      if (aDefault !== bDefault) return aDefault ? 1 : -1;
      return (a.priority ?? 0) - (b.priority ?? 0);
    });
}

export function toDefinitionPayload(nodes, transitions) {
  return {
    nodes: nodes.map((node) => ({
      nodeKey: node.nodeKey,
      formId: node.formId,
      isStart: Boolean(node.isStart),
      requiresManualReview: Boolean(node.requiresManualReview),
      position: node.position ? { x: Math.round(node.position.x), y: Math.round(node.position.y) } : null,
    })),
    transitions: transitions.map((transition, index) => ({
      sourceNodeKey: transition.sourceNodeKey,
      targetNodeKey: transition.targetNodeKey ?? null,
      trigger: Number(transition.trigger),
      priority: transition.priority ?? index,
      condition: transition.condition ?? null,
    })),
  };
}
