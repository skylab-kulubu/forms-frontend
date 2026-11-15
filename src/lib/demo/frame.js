import { DEMO_BINDING, DEMO_PARAM } from "./protocol";

function detect() {
  if (typeof window === "undefined") return null;
  let host = null;
  try {
    host = window.frameElement;
  } catch {
    host = null;
  }
  const binding = host?.[DEMO_BINDING] ?? null;
  const marked = new URLSearchParams(window.location.search).has(DEMO_PARAM);
  return binding || marked ? { binding } : null;
}

const frame = detect();

export function demoFrame() {
  return frame;
}

export function exposeToTour(name, handle) {
  if (!frame?.binding) return;
  window.__formsTour = { ...window.__formsTour, [name]: handle };
}
