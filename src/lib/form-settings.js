export function effectiveFormSettings(form) {
  const workflow = form?.workflow;
  const managedByWorkflow = Boolean(workflow?.isPublished);

  return {
    allowAnonymousResponses: Boolean(form?.allowAnonymousResponses),
    allowMultipleResponses: Boolean(managedByWorkflow ? workflow.allowMultipleRuns : form?.allowMultipleResponses),
    requiresManualReview: Boolean(managedByWorkflow ? workflow.requiresManualReview : form?.requiresManualReview),
    managedByWorkflow,
  };
}
