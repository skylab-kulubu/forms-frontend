import { stagesOf } from "../form-studio/studio-flow";

export const ROOM_LINKS = {
  form: (form) => `/admin/forms/${form.id}`,
  workflow: (workflow) => `/admin/workflows/${workflow.id}`,
};

const FORM_ROUTES = ["new-form", "all"];

export const EMPTY_ROUTE = { mode: "overview", formId: null, responseId: null, attempt: false, workflowId: null, step: null, focus: null, status: null };

export function roomRouteOf(pathname, search = "") {
  const parts = (pathname ?? "").split("/").filter(Boolean);
  const params = new URLSearchParams(search);
  if (parts[0] !== "admin") return null;

  if (parts[1] === "forms" && parts[2] && !FORM_ROUTES.includes(parts[2])) {
    const base = { ...EMPTY_ROUTE, formId: parts[2] };
    if (parts.length === 3) return { ...base, mode: "overview" };
    if (parts[3] === "analytics" && parts.length === 4) return { ...base, mode: "analytics", focus: params.get("q") };
    if (parts[3] === "responses" && parts.length === 4) return { ...base, mode: "response", status: params.get("status") };
    if (parts[3] === "responses" && parts.length === 5 && !params.get("token")) {
      return { ...base, mode: "response", responseId: parts[4], attempt: params.get("attempt") === "1" };
    }
    return null;
  }

  if (parts[1] === "workflows" && parts[2] && parts[2] !== "new-workflow" && parts.length === 3) {
    return { ...EMPTY_ROUTE, mode: "workflow", workflowId: parts[2], step: params.get("step") };
  }

  return null;
}

export function hrefOfRoute(route) {
  switch (route?.mode) {
    case "overview": return `/admin/forms/${route.formId}`;
    case "analytics": return `/admin/forms/${route.formId}/analytics`;
    case "response": {
      const base = `/admin/forms/${route.formId}/responses`;
      return route.responseId ? `${base}/${route.responseId}${route.attempt ? "?attempt=1" : ""}` : base;
    }
    case "workflow": return `/admin/workflows/${route.workflowId}${route.step ? `?step=${encodeURIComponent(route.step)}` : ""}`;
    default: return null;
  }
}

export function sameId(a, b) {
  return Boolean(a) && Boolean(b) && String(a).toLowerCase() === String(b).toLowerCase();
}

function definitionFor(workflow, formId) {
  const published = workflow?.published ?? null;
  if (!formId || published?.nodes?.some((node) => sameId(node.formId, formId))) return published ?? workflow?.draft ?? null;
  return workflow?.draft ?? published;
}

export function roomFlowOf(workflow, formId) {
  const definition = definitionFor(workflow, formId);
  const nodes = definition?.nodes ?? [];
  if (!workflow || nodes.length === 0) return null;

  const transitions = definition.transitions ?? [];
  const stages = stagesOf(nodes, transitions);
  const columns = new Map();
  stages.ordered.forEach((node) => {
    const depth = stages.depths.get(node.nodeKey) ?? stages.total + 1;
    columns.set(depth, [...(columns.get(depth) ?? []), node]);
  });
  const start = nodes.find((item) => item.isStart) ?? stages.ordered[0] ?? null;

  return {
    id: workflow.id,
    name: workflow.name || "Adsız akış",
    workflow,
    version: definition,
    nodes,
    transitions,
    stages,
    columns: [...columns.entries()].sort(([a], [b]) => a - b).map(([, group]) => group),
    node: (formId ? nodes.find((item) => sameId(item.formId, formId)) : null) ?? null,
    start,
    order: stages.ordered.map((item) => item.formId),
    nodeOf: (key) => nodes.find((item) => item.nodeKey === key) ?? null,
    nodeOfForm: (id) => nodes.find((item) => sameId(item.formId, id)) ?? null,
  };
}
