export function startFormIdOf(workflow) {
  if (workflow?.startForm?.id) return workflow.startForm.id;
  const nodes = (workflow?.draft ?? workflow?.published)?.nodes ?? [];
  return (nodes.find((node) => node.isStart) ?? nodes[0])?.formId ?? null;
}

export function workflowEditHref(workflow, { view } = {}) {
  const formId = startFormIdOf(workflow);
  if (!formId) return `/admin/workflows/${workflow.id}/edit`;
  return `/admin/forms/${formId}/edit${view === "map" ? "?view=map" : ""}`;
}
