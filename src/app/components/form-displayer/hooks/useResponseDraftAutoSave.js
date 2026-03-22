import { useEffect, useRef, useState } from "react";
import { useSaveResponseDraftMutation } from "@/lib/hooks/useDraft";

const DEBOUNCE_MS = 1000;

export function useResponseDraftAutoSave(formId, formValues, schema, startTimeRef, enabled) {
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const saveFnRef = useRef(null);
  const prevValuesRef = useRef(null);

  const { mutate } = useSaveResponseDraftMutation();
  saveFnRef.current = mutate;

  useEffect(() => {
    if (!enabled || !formId) return;

    const hasValues = Object.keys(formValues).length > 0;
    if (!hasValues) return;

    const serialized = JSON.stringify(formValues);
    if (prevValuesRef.current === null) {
      prevValuesRef.current = serialized;
      return;
    }
    if (prevValuesRef.current === serialized) return;

    const timer = setTimeout(() => {
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

      saveFnRef.current?.({ formId, responses, timeSpent }, {
        onSuccess: () => {
          prevValuesRef.current = JSON.stringify(formValues);
          setLastSavedAt(new Date());
        },
      });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [enabled, formId, formValues, schema]);

  return { lastSavedAt };
}