import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { request } from "@/lib/apiClient";
import { useReliableSave } from "@/lib/hooks/useReliableSave";
import { hasDraftChanges } from "../FormEditorContext";

const DEBOUNCE_MS = 2000;

const saveFormDraft = (formId, data, { token, keepalive } = {}) =>
  request(`/api/admin/forms/${formId}/draft`, {
    method: "POST",
    token,
    keepalive,
    body: {
      formId,
      data: {
        title: data.title,
        description: data.description,
        schema: data.schema,
        allowAnonymousResponses: data.allowAnonymousResponses,
        allowMultipleResponses: data.allowMultipleResponses,
        requiresManualReview: data.requiresManualReview,
        status: data.status,
        savedAt: new Date().toISOString(),
      },
    },
  });

const deleteFormDraft = (formId, { token, keepalive } = {}) =>
  request(`/api/admin/forms/${formId}/draft`, { method: "DELETE", token, keepalive });

export function useDraftAutoSave(formId, state, hasInitialDraft = false) {
  const { data: session } = useSession();
  const tokenRef = useRef(session?.accessToken);
  useEffect(() => {
    tokenRef.current = session?.accessToken;
  }, [session?.accessToken]);

  const [syncStatus, setSyncStatus] = useState("idle");
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [hasServerDraft, setHasServerDraft] = useState(hasInitialDraft);
  const serverDraftRef = useRef(hasInitialDraft);

  const markServerDraft = useCallback((exists) => {
    serverDraftRef.current = exists;
    setHasServerDraft(exists);
  }, []);

  const { schedule, cancel } = useReliableSave({
    debounceMs: DEBOUNCE_MS,
    save: (data, opts) => {
      const options = { ...opts, token: tokenRef.current };
      return data ? saveFormDraft(formId, data, options) : deleteFormDraft(formId, options);
    },
    onStatusChange: (next, data) => {
      if (!data) return;
      setSyncStatus(next);
      if (next === "saved") setDraftSavedAt(new Date());
    },
  });

  const isDirty = hasDraftChanges(state);

  useEffect(() => {
    if (!formId) return;

    if (isDirty) {
      schedule({
        title: state.title,
        description: state.description,
        schema: state.schema,
        allowAnonymousResponses: state.allowAnonymousResponses,
        allowMultipleResponses: state.allowMultipleResponses,
        requiresManualReview: state.requiresManualReview,
        status: state.status,
      }, () => markServerDraft(true));
      return;
    }

    if (serverDraftRef.current) schedule(null, () => markServerDraft(false));
    else cancel();
  }, [formId, state, isDirty, schedule, cancel, markServerDraft]);

  return { hasServerDraft, syncStatus, draftSavedAt };
}
