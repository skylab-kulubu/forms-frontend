import { FORM_STATUS_OPEN, ensureEventIdentityFields } from "@/lib/event-handoff";

export function newFormDataOf(handoff) {
  if (!handoff?.eventLinked) return { title: "" };
  return {
    title: handoff.title || "Yeni Form",
    status: handoff.open ? FORM_STATUS_OPEN : 1,
    allowAnonymousResponses: true,
    allowMultipleResponses: true,
    schema: ensureEventIdentityFields([]),
  };
}

export function publishedQueries(queryClient, form) {
  if (!form?.id) return;
  queryClient.setQueryData(["form", form.id], { status: 200, data: form });
  queryClient.invalidateQueries({ queryKey: ["form-info", form.id] });
  queryClient.invalidateQueries({ queryKey: ["user-forms"] });
}

export function studioStatusOf(state) {
  return {
    dirty: state.dirty,
    draftSyncStatus: state.pending ? "saving" : state.failure ? "failed" : "idle",
    draftSavedAt: state.syncedAt,
    lastSavedAt: state.publishedAt,
    offline: Boolean(state.id) && state.pending && !state.online,
  };
}
