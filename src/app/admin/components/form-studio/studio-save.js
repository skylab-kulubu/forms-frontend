import { FORM_STATUS_OPEN, ensureEventIdentityFields, hasEventIdentity } from "@/lib/event-handoff";
import { migrateSchema } from "@/app/components/form-migrate";

export function editorDataOf(form) {
  if (!form) return null;
  return {
    id: form.id,
    schema: migrateSchema(form.schema),
    title: form.title || "Yeni Form",
    description: form.description || "",
    allowMultipleResponses: form.allowMultipleResponses || false,
    allowAnonymousResponses: form.allowAnonymousResponses || false,
    requiresManualReview: form.requiresManualReview || false,
    task: form.task ?? null,
    closesAt: form.closesAt ?? null,
    timeLimitMinutes: form.timeLimitMinutes ?? null,
    editors: form.collaborators || [],
    status: form.status || 1,
    userRole: form.userRole ?? 0,
    workflow: form.workflow ?? null,
  };
}

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

export function formPayloadOf(state, eventLinked = hasEventIdentity(state.schema)) {
  return {
    Id: state.id || null,
    Title: state.title?.trim() ? state.title : "Adsız form",
    Description: state.description,
    Schema: eventLinked ? ensureEventIdentityFields(state.schema) : state.schema,
    Status: state.status,
    AllowMultipleResponses: eventLinked || state.allowAnonymousResponses ? true : state.allowMultipleResponses,
    AllowAnonymousResponses: eventLinked ? true : state.allowAnonymousResponses,
    RequiresManualReview: state.requiresManualReview,
    Collaborators: (state.editors ?? []).map((editor) => ({ UserId: editor.user.id, Role: Number(editor.role) })),
    Task: state.task?.content?.trim() ? state.task : null,
    ClosesAt: state.closesAt ?? null,
    TimeLimitMinutes: eventLinked || state.allowAnonymousResponses ? null : state.timeLimitMinutes ?? null,
  };
}

export function liveFormOf(state) {
  return {
    id: state.id,
    title: state.title,
    description: state.description,
    schema: state.schema,
    task: state.task,
    timeLimitMinutes: state.timeLimitMinutes,
    requiresManualReview: state.requiresManualReview,
    status: state.status,
  };
}
