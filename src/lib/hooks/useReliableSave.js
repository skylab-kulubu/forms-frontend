import { useCallback, useEffect, useRef } from "react";

const RETRY_DELAY_MS = 1500;
const DEFAULT_MAX_RETRIES = 2;

export function useReliableSave({ save, debounceMs, maxRetries = DEFAULT_MAX_RETRIES }) {
  const saveRef = useRef(save);
  saveRef.current = save;
  const debounceMsRef = useRef(debounceMs);
  debounceMsRef.current = debounceMs;
  const maxRetriesRef = useRef(maxRetries);
  maxRetriesRef.current = maxRetries;

  const pendingRef = useRef(null);
  const runningRef = useRef(false);
  const retriesRef = useRef(0);
  const debounceTimer = useRef(null);
  const retryTimer = useRef(null);

  const run = useCallback(() => {
    if (runningRef.current) return;
    const job = pendingRef.current;
    if (!job) return;
    runningRef.current = true;

    const release = (rerun) => {
      runningRef.current = false;
      if (rerun) run();
    };

    saveRef.current(job.data, { keepalive: false })
      .then(() => {
        retriesRef.current = 0;
        job.onSaved?.();
        const superseded = pendingRef.current !== job;
        if (!superseded) pendingRef.current = null;
        release(superseded);
      })
      .catch(() => {
        if (retriesRef.current < maxRetriesRef.current) {
          retriesRef.current += 1;
          runningRef.current = false;
          clearTimeout(retryTimer.current);
          retryTimer.current = setTimeout(run, RETRY_DELAY_MS);
          return;
        }
        retriesRef.current = 0;
        const superseded = pendingRef.current !== job;
        if (!superseded) pendingRef.current = null;
        release(superseded);
      });
  }, []);

  const schedule = useCallback((data, onSaved) => {
    pendingRef.current = { data, onSaved };
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(run, debounceMsRef.current);
  }, [run]);

  const cancel = useCallback(() => {
    clearTimeout(debounceTimer.current);
    clearTimeout(retryTimer.current);
    pendingRef.current = null;
    retriesRef.current = 0;
  }, []);

  const flush = useCallback(() => {
    clearTimeout(debounceTimer.current);
    clearTimeout(retryTimer.current);
    const job = pendingRef.current;
    if (!job) return;
    pendingRef.current = null;
    try { saveRef.current(job.data, { keepalive: true }); } catch { }
  }, []);

  useEffect(() => {
    const onHide = () => flush();
    window.addEventListener("pagehide", onHide);
    window.addEventListener("beforeunload", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      window.removeEventListener("beforeunload", onHide);
      flush();
    };
  }, [flush]);

  return { schedule, cancel, flush };
}
