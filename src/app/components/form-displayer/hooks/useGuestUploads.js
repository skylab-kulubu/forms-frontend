"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTurnstile } from "@/lib/hooks/useTurnstile";
import { TURNSTILE_SITE_KEY } from "@/lib/turnstile";
import { createGuestUploadSession, fetchGuestUploadStatus, guestReasonOf, uploadGuestFile } from "@/lib/guest-uploads";

const SESSION_MARGIN_MS = 60000;
const POLL_LIMIT = 120;
const PROBLEMS = new Set(["rejected", "expired", "invalid"]);

function pollDelay(attempt) {
  if (attempt < 15) return 2000;
  if (attempt < 40) return 5000;
  return 15000;
}

function clientError(reason) {
  const error = new Error(reason);
  error.reason = reason;
  return error;
}

export function useGuestUploads({ formId, capability, isGuest, hasFileQuestion, onInvalidate }) {
  const available = Boolean(isGuest && capability && TURNSTILE_SITE_KEY && formId);
  const { status: turnstileStatus, getToken, retry: retryTurnstile } = useTurnstile({ action: "guest-upload", enabled: available && hasFileQuestion });
  const [files, setFiles] = useState({});
  const sessionRef = useRef(null);
  const pendingSessionRef = useRef(null);
  const currentRef = useRef({});
  const timersRef = useRef({});
  const invalidateRef = useRef(onInvalidate);

  useEffect(() => { invalidateRef.current = onInvalidate; }, [onInvalidate]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const setFile = useCallback((questionId, value) => {
    setFiles((current) => {
      if (value) return { ...current, [questionId]: { ...current[questionId], ...value } };
      if (!(questionId in current)) return current;
      return Object.fromEntries(Object.entries(current).filter(([key]) => key !== questionId));
    });
  }, []);

  const stopPolling = useCallback((questionId) => {
    clearTimeout(timersRef.current[questionId]);
    delete timersRef.current[questionId];
  }, []);

  const settle = useCallback((questionId, mediaId, status, scanResult = null) => {
    if (currentRef.current[questionId] !== mediaId) return;
    stopPolling(questionId);
    setFile(questionId, { status, scanResult });
    if (PROBLEMS.has(status)) invalidateRef.current?.(questionId);
  }, [setFile, stopPolling]);

  const poll = useCallback(function pollStatus(questionId, mediaId, attempt = 0) {
    stopPolling(questionId);
    if (attempt >= POLL_LIMIT) return;

    timersRef.current[questionId] = setTimeout(async () => {
      const sessionId = sessionRef.current?.id;
      if (!sessionId || currentRef.current[questionId] !== mediaId) return;

      try {
        const response = await fetchGuestUploadStatus(formId, sessionId, mediaId);
        const data = response?.data;
        if (data?.status === "scanning") {
          pollStatus(questionId, mediaId, attempt + 1);
          return;
        }
        const status = data?.status === "ready" ? "ready" : data?.status === "rejected" ? "rejected" : "expired";
        settle(questionId, mediaId, status, data?.scanResult ?? null);
      } catch (error) {
        const reason = guestReasonOf(error);
        if (reason === "sessionExpired" || reason === "fileExpired" || error?.status === 404) {
          settle(questionId, mediaId, "expired");
          return;
        }
        pollStatus(questionId, mediaId, attempt + 1);
      }
    }, pollDelay(attempt));
  }, [formId, settle, stopPolling]);

  const openSession = useCallback(async () => {
    let token;
    try {
      token = await getToken();
    } catch (error) {
      throw clientError(error?.code === "blocked" ? "blocked" : "verificationFailed");
    }
    const response = await createGuestUploadSession(formId, token);
    const data = response?.data;
    sessionRef.current = { id: data?.sessionId ?? null, expiresAt: Date.parse(data?.expiresAt ?? "") || 0 };
    return sessionRef.current.id;
  }, [formId, getToken]);

  const ensureSession = useCallback((fresh = false) => {
    const session = sessionRef.current;
    if (!fresh && session?.id && session.expiresAt - Date.now() > SESSION_MARGIN_MS) return Promise.resolve(session.id);

    if (!pendingSessionRef.current) {
      pendingSessionRef.current = (async () => {
        try {
          return await openSession();
        } catch (error) {
          if ((error.reason ?? guestReasonOf(error)) !== "verificationFailed") throw error;
          return await openSession();
        }
      })().finally(() => { pendingSessionRef.current = null; });
    }

    return pendingSessionRef.current;
  }, [openSession]);

  const upload = useCallback(async (questionId, file, onProgress) => {
    stopPolling(questionId);
    delete currentRef.current[questionId];
    setFile(questionId, null);

    const send = (sessionId) => uploadGuestFile({ formId, sessionId, questionId, file, onProgress });
    let response;
    try {
      response = await send(await ensureSession());
    } catch (error) {
      if (guestReasonOf(error) !== "sessionExpired") throw error;
      sessionRef.current = null;
      onProgress?.(0);
      response = await send(await ensureSession(true));
    }

    const media = response?.data ?? {};
    const status = media.status === "scanning" ? "scanning" : media.status === "rejected" ? "rejected" : "ready";
    currentRef.current[questionId] = media.id;
    setFile(questionId, {
      mediaId: media.id, name: media.name || file.name, size: media.size ?? file.size, type: media.type ?? file.type,
      status, scanResult: media.scanResult ?? null,
    });
    if (status === "scanning") poll(questionId, media.id);
    return { ...media, status };
  }, [formId, ensureSession, poll, setFile, stopPolling]);

  const remove = useCallback((questionId) => {
    stopPolling(questionId);
    delete currentRef.current[questionId];
    setFile(questionId, null);
  }, [setFile, stopPolling]);

  const flag = useCallback((questionId, reason, scanResult = null) => {
    const mediaId = currentRef.current[questionId];
    if (!mediaId) return false;
    if (reason === "fileScanning") {
      setFile(questionId, { status: "scanning", scanResult: null });
      poll(questionId, mediaId);
      return true;
    }
    const status = reason === "fileRejected" ? "rejected" : reason === "fileExpired" ? "expired" : "invalid";
    settle(questionId, mediaId, status, scanResult);
    return true;
  }, [poll, setFile, settle]);

  const isScanning = useCallback((questionIds) => questionIds.some((id) => files[id]?.status === "scanning"), [files]);

  const problemIn = useCallback((questionIds) => {
    const questionId = questionIds.find((id) => PROBLEMS.has(files[id]?.status));
    return questionId ? { questionId, ...files[questionId] } : null;
  }, [files]);

  const sessionId = useCallback(() => sessionRef.current?.id ?? null, []);

  return useMemo(() => ({
    available, turnstileStatus, files, upload, remove, flag, isScanning, problemIn, sessionId, retryVerification: retryTurnstile,
  }), [available, turnstileStatus, files, upload, remove, flag, isScanning, problemIn, sessionId, retryTurnstile]);
}
