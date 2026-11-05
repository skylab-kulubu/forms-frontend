import { request } from "@/lib/apiClient";

const dataOf = (payload) => payload?.data ?? payload;

export const studioSnapshotPath = (formId) => `/api/admin/forms/${formId}/studio`;

export const studioApi = {
  start: (document) => request("/api/admin/forms/studio", { method: "POST", body: { document } }).then(dataOf),
  snapshot: (formId) => request(studioSnapshotPath(formId)).then(dataOf),
  publish: (formId, workingVersion) => request(`${studioSnapshotPath(formId)}/publish`, { method: "POST", body: { workingVersion } }).then(dataOf),
  team: (formId, collaborators) => request(`/api/admin/forms/${formId}/collaborators`, { method: "PUT", body: { collaborators } }).then(dataOf),
  deleteLegacyDraft: (formId) => request(`/api/admin/forms/${formId}/draft`, { method: "DELETE" }).catch(() => null),
};
