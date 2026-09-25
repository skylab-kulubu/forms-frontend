import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { deleteResponseDraft, saveResponseDraft } from "@/lib/hooks/useDraft";
import { useReliableSave } from "@/lib/hooks/useReliableSave";

const DEBOUNCE_MS = 1000;

export function useResponseDraftAutoSave(formId, answers, savedDraft, startTimeRef, enabled, onSynced) {
  const [lastSavedAt, setLastSavedAt] = useState(null);

  const { data: session } = useSession();
  const tokenRef = useRef(session?.accessToken);
  useEffect(() => {
    tokenRef.current = session?.accessToken;
  }, [session?.accessToken]);

  const onSyncedRef = useRef(onSynced);
  useEffect(() => {
    onSyncedRef.current = onSynced;
  }, [onSynced]);

  const { schedule, cancel } = useReliableSave({
    debounceMs: DEBOUNCE_MS,
    save: (draft, opts) => {
      const options = { ...opts, token: tokenRef.current };
      return draft.responses.length
        ? saveResponseDraft(draft, options)
        : deleteResponseDraft(draft.formId, options);
    },
  });

  const serialized = useMemo(() => JSON.stringify(answers), [answers]);

  useEffect(() => {
    if (!enabled || !formId || serialized === savedDraft) {
      cancel();
      return;
    }

    const timeSpent = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000);

    schedule({ formId, responses: answers, timeSpent }, () => {
      onSyncedRef.current?.(serialized);
      setLastSavedAt(answers.length ? new Date() : null);
    });
  }, [enabled, formId, answers, serialized, savedDraft, startTimeRef, schedule, cancel]);

  return { lastSavedAt, cancel };
}
