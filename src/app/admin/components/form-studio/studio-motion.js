import { flushSync } from "react-dom";

export const ARRIVAL_MS = 380;
export const ARRIVAL_EASE = [0.22, 1, 0.36, 1];
export const COLLAPSE_MS = 440;
export const COLLAPSE_EASING = "cubic-bezier(0.65, 0, 0.35, 1)";
export const SLIDE_PX = 40;
export const SLIDE_OUT_MS = 140;
export const SLIDE_IN_MS = 280;
export const SLIDE_OUT_EASING = "cubic-bezier(0.4, 0, 1, 1)";
export const SLIDE_IN_EASING = "cubic-bezier(0, 0, 0.2, 1)";

export const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function swapView(update, { duration = 180, variant = null } = {}) {
  let release;
  const done = new Promise((resolve) => { release = resolve; });
  if (typeof document === "undefined" || !document.startViewTransition || prefersReducedMotion()) {
    update(done);
    release();
    return done;
  }
  const root = document.documentElement;
  const classes = variant ? ["studio-swap", `studio-${variant}`] : ["studio-swap"];
  root.classList.add(...classes);
  root.style.setProperty("--studio-swap-ms", `${duration}ms`);
  const transition = document.startViewTransition(() => flushSync(() => update(done)));
  const finish = () => {
    root.classList.remove(...classes);
    root.style.removeProperty("--studio-swap-ms");
    release();
  };
  transition.finished.then(finish, finish);
  return done;
}

export const POPOVER_MOTION = {
  initial: { opacity: 0, scale: 0.96 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.1, ease: [0.4, 0, 1, 1] } },
  style: { transformOrigin: "var(--floating-origin, top center)" },
};
