import { useSyncExternalStore } from "react";
import { getSession } from "next-auth/react";

export const SESSION_RESTORED_EVENT = "skyforms:session-restored";
export const AUTH_DONE_PATH = "/auth/silent/done";

const SILENT_PATH = "/auth/silent";
const SILENT_FRAME_NAME = "skyforms-silent-auth";
const AUTH_RESULT = "skyforms:auth-result";
const AUTH_CHANNEL = "skyforms-auth";
const SILENT_TIMEOUT_MS = 12 * 1000;
const SILENT_COOLDOWN_MS = 20 * 1000;
const RETRY_GUARD_KEY = "authErrorRetryAt";
const RETRY_GUARD_MS = 20 * 1000;

let status = "idle";
let attempt = null;
let lastAttemptAt = 0;
let popupWait = null;
const listeners = new Set();

function setStatus(next) {
  if (status === next) return;
  status = next;
  listeners.forEach((listener) => listener());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useRecoveryStatus() {
  return useSyncExternalStore(subscribe, () => status, () => "idle");
}

export function settleRecovery(next = "idle") {
  setStatus(next);
}

export function inSilentFrame() {
  try {
    return window.name === SILENT_FRAME_NAME && window.parent !== window;
  } catch {
    return false;
  }
}

export function reportAuthResult(ok) {
  const message = { type: AUTH_RESULT, ok };
  if (inSilentFrame()) {
    window.parent.postMessage(message, window.location.origin);
    return "frame";
  }
  try {
    const channel = new BroadcastChannel(AUTH_CHANNEL);
    channel.postMessage(message);
    channel.close();
  } catch { }
  try { window.opener?.postMessage(message, window.location.origin); } catch { }
  return "window";
}

function withLock(task) {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("skyforms-session-recovery", task);
  }
  return task();
}

function signInInFrame() {
  return new Promise((resolve) => {
    const frame = document.createElement("iframe");
    frame.name = SILENT_FRAME_NAME;
    frame.hidden = true;
    frame.tabIndex = -1;
    frame.setAttribute("aria-hidden", "true");

    const finish = (ok) => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timer);
      frame.remove();
      resolve(ok);
    };
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.source !== frame.contentWindow) return;
      if (event.data?.type !== AUTH_RESULT) return;
      finish(event.data.ok === true);
    };
    const timer = setTimeout(() => finish(false), SILENT_TIMEOUT_MS);

    window.addEventListener("message", onMessage);
    frame.src = SILENT_PATH;
    document.body.appendChild(frame);
  });
}

async function recover() {
  const current = await getSession({ broadcast: false });
  if (current?.user && !current.error) return true;
  return signInInFrame();
}

export function silentReauth() {
  if (attempt) return attempt;
  if (Date.now() - lastAttemptAt < SILENT_COOLDOWN_MS) {
    setStatus("failed");
    return Promise.resolve(false);
  }

  lastAttemptAt = Date.now();
  setStatus("recovering");
  attempt = withLock(recover)
    .catch(() => false)
    .then((ok) => {
      setStatus(ok ? "idle" : "failed");
      return ok;
    })
    .finally(() => { attempt = null; });
  return attempt;
}

export function popupReauth() {
  const popup = window.open(`/auth/signin?callbackUrl=${encodeURIComponent(AUTH_DONE_PATH)}`, "skyforms-auth", "popup,width=520,height=720");
  if (!popup) return null;
  try { popup.focus(); } catch { }

  if (!popupWait) {
    popupWait = new Promise((resolve) => {
      const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(AUTH_CHANNEL);
      const finish = () => {
        channel?.close();
        window.removeEventListener("message", onMessage);
        popupWait = null;
        resolve(true);
      };
      const onMessage = (event) => {
        if (event.origin === window.location.origin && event.data?.type === AUTH_RESULT && event.data.ok) finish();
      };
      if (channel) channel.onmessage = (event) => { if (event.data?.type === AUTH_RESULT && event.data.ok) finish(); };
      window.addEventListener("message", onMessage);
    });
  }
  return popupWait;
}

export function claimAuthRetry() {
  try {
    const last = Number(sessionStorage.getItem(RETRY_GUARD_KEY)) || 0;
    if (Date.now() - last < RETRY_GUARD_MS) return false;
    sessionStorage.setItem(RETRY_GUARD_KEY, String(Date.now()));
  } catch { }
  return true;
}

export function releaseAuthRetry() {
  try { sessionStorage.removeItem(RETRY_GUARD_KEY); } catch { }
}
