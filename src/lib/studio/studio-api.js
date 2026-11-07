import { request } from "@/lib/apiClient";

const dataOf = (payload) => payload?.data ?? payload;

export const studioSnapshotPath = (formId) => `/api/admin/forms/${formId}/studio`;

const commentsPath = (formId) => `/api/admin/forms/${formId}/comments`;

export const studioApi = {
  start: (document) => request("/api/admin/forms/studio", { method: "POST", body: { document } }).then(dataOf),
  snapshot: (formId) => request(studioSnapshotPath(formId)).then(dataOf),
  publish: (formId, workingVersion) => request(`${studioSnapshotPath(formId)}/publish`, { method: "POST", body: { workingVersion } }).then(dataOf),
  team: (formId, collaborators) => request(`/api/admin/forms/${formId}/collaborators`, { method: "PUT", body: { collaborators } }).then(dataOf),
  deleteLegacyDraft: (formId) => request(`/api/admin/forms/${formId}/draft`, { method: "DELETE" }).catch(() => null),
  comments: (formId) => request(commentsPath(formId)).then(dataOf),
  startThread: (formId, fieldId, body) => request(commentsPath(formId), { method: "POST", body: { fieldId, body } }).then(dataOf),
  replyThread: (formId, threadId, body) => request(`${commentsPath(formId)}/${threadId}/replies`, { method: "POST", body: { body } }).then(dataOf),
  editComment: (formId, commentId, body) => request(`${commentsPath(formId)}/${commentId}`, { method: "PUT", body: { body } }).then(dataOf),
  deleteComment: (formId, commentId) => request(`${commentsPath(formId)}/${commentId}`, { method: "DELETE" }).then(dataOf),
  resolveThread: (formId, threadId, resolved) => request(`${commentsPath(formId)}/${threadId}/${resolved ? "resolve" : "reopen"}`, { method: "POST" }).then(dataOf),
};
