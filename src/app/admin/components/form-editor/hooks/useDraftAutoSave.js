import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { request } from "@/lib/apiClient";

const DEBOUNCE_MS = 2000;

const saveFormDraft = (formId, data) =>
  request(`/api/admin/forms/${formId}/draft`, {
    method: "POST",
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
  const saveFnRef = useRef(null);

  const { mutate } = useMutation({
    mutationFn: (data) => saveFormDraft(formId, data),
  });

  saveFnRef.current = mutate;

  useEffect(() => {
    if (!formId || state.isSaved) return;

    const timer = setTimeout(() => {
      saveFnRef.current?.({
        title: state.title,
        description: state.description,
        schema: state.schema,
        allowAnonymousResponses: state.allowAnonymousResponses,
        allowMultipleResponses: state.allowMultipleResponses,
        requiresManualReview: state.requiresManualReview,
        status: state.status,
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [formId, state]);
}