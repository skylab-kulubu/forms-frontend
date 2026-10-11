export const WORKFLOW_INTAKE = { OPEN: 0, NEW_RUNS_CLOSED: 1, CLOSED: 2 };

export function effectiveFormSettings(form) {
  const workflow = form?.workflow;
  const managedByWorkflow = Boolean(workflow?.isPublished);
  const intake = Number(workflow?.intake ?? WORKFLOW_INTAKE.OPEN);

  return {
    allowAnonymousResponses: Boolean(form?.allowAnonymousResponses),
    allowMultipleResponses: Boolean(managedByWorkflow ? workflow.allowMultipleRuns : form?.allowMultipleResponses),
    requiresManualReview: Boolean(managedByWorkflow ? workflow.requiresManualReview : form?.requiresManualReview),
    isOpen: managedByWorkflow
      ? (workflow.isStart ? intake === WORKFLOW_INTAKE.OPEN : intake !== WORKFLOW_INTAKE.CLOSED)
      : Number(form?.status) === 2,
    managedByWorkflow,
  };
}
