"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TURNSTILE_SITE_KEY, loadTurnstile } from "@/lib/turnstile";

const TOKEN_WAIT_MS = 20000;
const TOKEN_FRESH_MS = 240000;

function turnstileError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

export function useTurnstile({ action, enabled }) {
  const active = Boolean(enabled && TURNSTILE_SITE_KEY);
  const [run, setRun] = useState(0);
  const [reported, setReported] = useState({ key: null, status: "loading" });
  const runKey = `${action}:${run}`;
  const status = !active ? "off" : reported.key === runKey ? reported.status : "loading";

  const keyRef = useRef(runKey);
  const statusRef = useRef("loading");
  const widgetRef = useRef(null);
  const tokenRef = useRef(null);
  const waitersRef = useRef([]);

  const report = useCallback((next) => {
    statusRef.current = next;
    setReported({ key: keyRef.current, status: next });
  }, []);

  const rejectWaiters = useCallback((code) => {
    const waiters = waitersRef.current;
    waitersRef.current = [];
    waiters.forEach((waiter) => waiter.reject(turnstileError(code)));
  }, []);

  const resetWidget = useCallback(() => {
    const widgetId = widgetRef.current;
    if (widgetId == null) return false;
    setTimeout(() => {
      try { window.turnstile?.reset(widgetId); } catch { }
    }, 0);
    return true;
  }, []);

  useEffect(() => {
    if (!active) return undefined;

    let cancelled = false;
    let container = null;
    keyRef.current = `${action}:${run}`;
    statusRef.current = "loading";

    const update = (next) => {
      if (!cancelled) report(next);
    };

    loadTurnstile()
      .then((turnstile) => {
        if (cancelled) return;
        container = document.createElement("div");
        container.className = "sr-only";
        container.setAttribute("aria-hidden", "true");
        document.body.appendChild(container);

        widgetRef.current = turnstile.render(container, {
          sitekey: TURNSTILE_SITE_KEY,
          action,
          "refresh-expired": "auto",
          callback: (token) => {
            const waiter = waitersRef.current.shift();
            if (waiter) {
              waiter.resolve(token);
              resetWidget();
              update("loading");
              return;
            }
            tokenRef.current = { value: token, at: Date.now() };
            update("ready");
          },
          "expired-callback": () => {
            tokenRef.current = null;
            update("loading");
          },
          "error-callback": () => {
            tokenRef.current = null;
            update("failed");
            rejectWaiters("failed");
            return true;
          },
          "unsupported-callback": () => {
            tokenRef.current = null;
            update("failed");
            rejectWaiters("failed");
          },
        });
      })
      .catch(() => {
        if (cancelled) return;
        update("blocked");
        rejectWaiters("blocked");
      });

    return () => {
      cancelled = true;
      if (widgetRef.current != null) {
        try { window.turnstile?.remove(widgetRef.current); } catch { }
      }
      widgetRef.current = null;
      tokenRef.current = null;
      container?.remove();
    };
  }, [active, action, run, report, rejectWaiters, resetWidget]);

  useEffect(() => () => rejectWaiters("cancelled"), [rejectWaiters]);

  const retry = useCallback(() => {
    if (!active) return;
    tokenRef.current = null;
    if (statusRef.current === "blocked" || !resetWidget()) {
      statusRef.current = "loading";
      setRun((value) => value + 1);
      return;
    }
    report("loading");
  }, [active, report, resetWidget]);

  useEffect(() => {
    if (status !== "blocked") return undefined;
    window.addEventListener("focus", retry);
    return () => window.removeEventListener("focus", retry);
  }, [status, retry]);

  const getToken = useCallback(() => {
    if (!active) return Promise.resolve(null);

    const token = tokenRef.current;
    tokenRef.current = null;
    if (token && Date.now() - token.at < TOKEN_FRESH_MS) {
      resetWidget();
      report("loading");
      return Promise.resolve(token.value);
    }

    return new Promise((resolve, reject) => {
      let timer = null;
      const entry = {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      };
      timer = setTimeout(() => {
        waitersRef.current = waitersRef.current.filter((waiter) => waiter !== entry);
        reject(turnstileError("timeout"));
      }, TOKEN_WAIT_MS);
      waitersRef.current.push(entry);
      if (token || statusRef.current === "failed" || statusRef.current === "blocked") retry();
    });
  }, [active, report, resetWidget, retry]);

  return { status, getToken, retry };
}
