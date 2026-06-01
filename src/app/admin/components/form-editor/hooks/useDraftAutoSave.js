import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { request } from "@/lib/apiClient";
import { useReliableSave } from "@/lib/hooks/useReliableSave";

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

export function useDraftAutoSave(formId, state) {
  const { data: session } = useSession();
  const tokenRef = useRef(session?.accessToken);
  tokenRef.current = session?.accessToken;

  const { schedule, cancel } = useReliableSave({
    debounceMs: DEBOUNCE_MS,
    save: (data, opts) => saveFormDraft(formId, data, { ...opts, token: tokenRef.current }),
  });

  useEffect(() => {
    if (!formId || state.isSaved) {
      if (state.isSaved) cancel();
      return;
    }

    schedule({
      title: state.title,
      description: state.description,
      schema: state.schema,
      allowAnonymousResponses: state.allowAnonymousResponses,
      allowMultipleResponses: state.allowMultipleResponses,
      requiresManualReview: state.requiresManualReview,
      status: state.status,
    });
  }, [formId, state, schedule, cancel]);

  return { cancel };
}
