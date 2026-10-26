import { ArrowRight, Check, TimerOff, X } from "lucide-react";
import { TRIGGER, connectionError, depthMap, flowOrder, groupTransitions } from "../workflow-editor/workflow-graph";
import { COMPARISON_SYMBOL, CONNECTION_COPY, VALUELESS_COMPARISONS, fieldQuestionLabel } from "../workflow-editor/workflow-copy";

export const END_TARGET = "__end";
export const NEW_TARGET = "__new";

export const TRIGGER_STYLE = {
  [TRIGGER.SUBMITTED]: { label: "Gönderilince", Icon: ArrowRight, icon: "text-neutral-500", port: "border-neutral-500", portFill: "bg-neutral-500 ring-2 ring-neutral-500/15", stroke: "#595959", edgeLabel: "text-neutral-400 border-white/10" },
  [TRIGGER.APPROVED]: { label: "Onaylanınca", Icon: Check, icon: "text-emerald-400", port: "border-emerald-400/80", portFill: "bg-emerald-400 ring-2 ring-emerald-400/15", stroke: "rgba(52,211,153,0.7)", edgeLabel: "text-emerald-300 border-emerald-400/30" },
  [TRIGGER.DECLINED]: { label: "Reddedilince", Icon: X, icon: "text-red-400", port: "border-red-400/80", portFill: "bg-red-400 ring-2 ring-red-400/15", stroke: "rgba(248,113,113,0.7)", edgeLabel: "text-red-300 border-red-400/30" },
  [TRIGGER.TIMED_OUT]: { label: "Süre dolunca", Icon: TimerOff, icon: "text-amber-400", text: "text-amber-100/80", port: "border-amber-400/80", portFill: "bg-amber-400 ring-2 ring-amber-400/15", stroke: "rgba(251,191,36,0.75)", edgeLabel: "text-amber-300 border-amber-400/30" },
};

export const TRIGGER_LABEL = {
  [TRIGGER.SUBMITTED]: "gönderilince",
  [TRIGGER.APPROVED]: "onaylanırsa",
  [TRIGGER.DECLINED]: "reddedilirse",
  [TRIGGER.TIMED_OUT]: "süre dolunca",
};

export function transitionLabel(transition, { nodes, transitions, schemaOf }) {
  const group = groupTransitions(transitions, transition.sourceNodeKey, transition.trigger);
  const hasConditional = group.some((item) => item.condition);

  if (!transition.condition) return hasConditional ? "aksi halde" : TRIGGER_LABEL[transition.trigger];

  const rules = transition.condition.rules ?? [];
  const rule = rules[0];
  if (!rule?.questionId) return "koşul eksik";

  const sourceNode = rule.nodeKey
    ? nodes.find((node) => node.nodeKey === rule.nodeKey)
    : nodes.find((node) => node.nodeKey === transition.sourceNodeKey);

  const field = schemaOf(sourceNode?.formId)?.find((item) => item.id === rule.questionId);
  const question = field ? fieldQuestionLabel(field) : rule.questionId;
  const comparison = Number(rule.comparison);
  const value = Array.isArray(rule.values) && rule.values.length > 0 ? rule.values.join(", ") : rule.value;
  const summary = VALUELESS_COMPARISONS.includes(comparison)
    ? `${question} ${COMPARISON_SYMBOL[comparison]}`
    : `${question} ${COMPARISON_SYMBOL[comparison]} ${value || "?"}`;

  return rules.length > 1 ? `${summary} +${rules.length - 1}` : summary;
}

export function triggerStyle(trigger) {
  return TRIGGER_STYLE[Number(trigger)] ?? TRIGGER_STYLE[TRIGGER.SUBMITTED];
}

export function targetOptions(sourceKey, nodes, transitions, { allowNew = false } = {}) {
  return [
    ...nodes
      .filter((node) => node.nodeKey !== sourceKey)
      .map((node) => {
        const error = connectionError(sourceKey, node.nodeKey, nodes, transitions);
        return { value: node.nodeKey, label: node.formTitle || "Adsız form", disabled: Boolean(error), hint: error ? CONNECTION_COPY[error].hint : null };
      }),
    { value: END_TARGET, label: "Akış biter" },
    ...(allowNew ? [{ value: NEW_TARGET, label: "Yeni adım ekle…" }] : []),
  ];
}

export function stagesOf(nodes, transitions) {
  const depths = depthMap(nodes, transitions);
  const total = Math.max(1, ...nodes.map((node) => depths.get(node.nodeKey) ?? 1));
  return { depths, total, ordered: flowOrder(nodes, transitions) };
}

function placeOf(stages, formId) {
  const columnOf = (node) => stages.depths.get(node.nodeKey) ?? stages.total + 1;
  const node = stages.ordered.find((item) => item.formId === formId);
  if (!node) return null;
  const column = columnOf(node);
  return { column, row: stages.ordered.filter((item) => columnOf(item) === column).indexOf(node) };
}

export function slideDirection(stages, fromFormId, toFormId) {
  const from = placeOf(stages, fromFormId);
  const to = placeOf(stages, toFormId);
  if (!from || !to) return { x: 1, y: 0 };
  if (from.column !== to.column) return { x: Math.sign(to.column - from.column), y: 0 };
  return { x: 0, y: to.row < from.row ? -1 : 1 };
}
