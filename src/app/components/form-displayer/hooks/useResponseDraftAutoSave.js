import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { saveResponseDraft } from "@/lib/hooks/useDraft";
import { useReliableSave } from "@/lib/hooks/useReliableSave";

const DEBOUNCE_MS = 1000;

export function useResponseDraftAutoSave(formId, formValues, schema, startTimeRef, enabled) {
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const { data: session } = useSession();
  const tokenRef = useRef(session?.accessToken);
  tokenRef.current = session?.accessToken;

  const { schedule, cancel } = useReliableSave({
    debounceMs: DEBOUNCE_MS,
    save: (payload, opts) => saveResponseDraft(payload, { ...opts, token: tokenRef.current }),
  });

  const baselineRef = useRef(JSON.stringify(formValues));
  const formIdRef = useRef(formId);

  useEffect(() => {
    const serialized = JSON.stringify(formValues);

    if (formIdRef.current !== formId) {
      formIdRef.current = formId;
      baselineRef.current = serialized;
      cancel();
      return;
    }

    if (!enabled || !formId) {
      baselineRef.current = serialized;
      cancel();
      return;
    }

    if (serialized === baselineRef.current) return;

    const responses = Object.entries(formValues).map(([id, value]) => {
      const field = schema.find((f) => f.id === id);
      return {
        id,
        type: field?.type || "",
        question: field?.props?.question || "",
        answer: value !== undefined && value !== null ? JSON.stringify(value) : "",
      };
    });
    const timeSpent = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);

    schedule({ formId, responses, timeSpent }, () => {
      baselineRef.current = serialized;
      setLastSavedAt(new Date());
    });
  }, [enabled, formId, formValues, schema, schedule, cancel]);

  return { lastSavedAt };
}
