"use client";

import { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from "react";
import { useSession } from "next-auth/react";
import { announceSessionExpired, getAccessToken } from "@/lib/apiClient";
import { SESSION_RESTORED_EVENT } from "@/lib/session-recovery";
import { createStudioSession } from "@/lib/studio/studio-session";
import { studioApi } from "@/lib/studio/studio-api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const StudioSessionContext = createContext(null);

const noSubscribe = () => () => {};
const noSnapshot = () => null;

function docStatesStore(docs) {
  let last = null;
  return {
    subscribe(listener) {
      const stops = docs.map((doc) => doc.subscribe(listener));
      return () => stops.forEach((stop) => stop());
    },
    getSnapshot() {
      const next = docs.map((doc) => doc.getSnapshot());
      if (last && last.length === next.length && last.every((snapshot, index) => snapshot === next[index])) return last;
      last = next;
      return next;
    },
  };
}

export function StudioSessionProvider({ onNotice, fallback = null, children }) {
  const { data: auth } = useSession();
  const userId = auth?.user?.id ?? null;

  const session = useMemo(() => (userId
    ? createStudioSession({ baseUrl: BASE_URL, userId, http: studioApi, getToken: getAccessToken, onSessionExpired: announceSessionExpired })
    : null), [userId]);

  useEffect(() => {
    session?.setNoticeHandler(onNotice);
  });

  useEffect(() => {
    if (!session) return undefined;
    session.hold();
    const restart = () => session.restart();
    window.addEventListener(SESSION_RESTORED_EVENT, restart);
    return () => {
      window.removeEventListener(SESSION_RESTORED_EVENT, restart);
      session.release();
    };
  }, [session]);

  if (!session) return fallback;

  return <StudioSessionContext.Provider value={session}>{children}</StudioSessionContext.Provider>;
}

export function useStudioSession() {
  const session = useContext(StudioSessionContext);
  if (!session) throw new Error("useStudioSession must be used within a StudioSessionProvider");
  return session;
}

export function useDocState(doc) {
  return useSyncExternalStore(doc ? doc.subscribe : noSubscribe, doc ? doc.getSnapshot : noSnapshot, doc ? doc.getSnapshot : noSnapshot);
}

export function useDocStates(docs) {
  const store = useMemo(() => docStatesStore(docs), [docs]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}

export function useConnectionStatus(session) {
  return useSyncExternalStore(session.onStatus, session.status, session.status);
}

export function usePresenceBroadcast(session, formId, selection) {
  const ids = selection?.kind === "fields" ? selection.ids : [];
  const key = ids.join("|");

  useEffect(() => {
    if (!formId) return;
    session.sendPresence(formId, { selection: key ? key.split("|") : [], editing: null });
  }, [session, formId, key]);
}
