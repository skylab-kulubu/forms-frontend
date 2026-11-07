import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { deleteGroupDraft, saveGroupDraft } from "@/lib/hooks/useGroupAdmin";
import { useReliableSave } from "@/lib/hooks/useReliableSave";

const DEBOUNCE_MS = 2000;

export function useTemplateDraftAutoSave(state, initialDraft) {
  const { id, title, description, schema, dirty } = state;

  const { data: session } = useSession();
  const tokenRef = useRef(session?.accessToken);
  useEffect(() => {
    tokenRef.current = session?.accessToken;
  }, [session?.accessToken]);

  const [syncStatus, setSyncStatus] = useState("idle");
  const [draftSavedAt, setDraftSavedAt] = useState(() => (initialDraft?.savedAt ? new Date(initialDraft.savedAt) : null));
  const serverDraftRef = useRef(Boolean(initialDraft));

  const { schedule, cancel } = useReliableSave({
    debounceMs: DEBOUNCE_MS,
    save: (draft, options) => {
      const request = { ...options, token: tokenRef.current };
      return draft ? saveGroupDraft(id, draft, request) : deleteGroupDraft(id, request);
    },
    onStatusChange: (next, draft) => {
      if (!draft) return;
      setSyncStatus(next);
      if (next === "saved") setDraftSavedAt(new Date());
    },
  });

  useEffect(() => {
    if (!id) return;

    if (dirty) {
      schedule({ title, description, schema }, () => {
        serverDraftRef.current = true;
      });
      return;
    }

    if (serverDraftRef.current) {
      schedule(null, () => {
        serverDraftRef.current = false;
      });
    } else {
      cancel();
    }
  }, [id, dirty, title, description, schema, schedule, cancel]);

  return { syncStatus: dirty ? syncStatus : "idle", draftSavedAt };
}
