"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const LINE_TONE = { "text-red-300": "bg-red-300/70", "text-amber-300": "bg-amber-300/70" };
const COARSE_POINTER = "(pointer: coarse)";

function useMatches(query) {
  const subscribe = useCallback((onChange) => {
    const media = window.matchMedia(query);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

function subscribeVisibility(onChange) {
  document.addEventListener("visibilitychange", onChange);
  return () => document.removeEventListener("visibilitychange", onChange);
}

function usePageHidden() {
  return useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "hidden", () => false);
}

export default function NoticeDock({ icon: Icon, tone = "text-skylab-300", action = null, onClose, duration = null, paused = false, role = "status", children }) {
  const swipe = useMatches(COARSE_POINTER) && Boolean(onClose);
  const hidden = usePageHidden();
  const [dragging, setDragging] = useState(false);
  const halted = paused || hidden || dragging;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
    >
      <motion.div role={role}
        drag={swipe ? "y" : false} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.6 }} dragSnapToOrigin
        onDragStart={() => setDragging(true)}
        onDragEnd={(event, info) => {
          setDragging(false);
          if (info.offset.y > 40 || info.velocity.y > 500) onClose();
        }}
        className={`notice pointer-events-auto relative flex max-w-xl flex-col rounded-xl border border-white/10 bg-neutral-900/90 py-2.5 pl-4 shadow-lg backdrop-blur ${onClose ? "pr-3 pointer-coarse:pr-4" : "pr-4"} ${swipe ? "touch-none" : ""}`}
      >
        <div className="flex items-start gap-2 sm:items-center sm:gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex min-w-0 flex-1 items-start gap-2 text-xs leading-5 text-neutral-200">
              {Icon && <Icon size={14} className={`mt-0.5 shrink-0 ${tone}`} />}
              <span className="min-w-0">{children}</span>
            </div>
            {action && <div className="flex shrink-0 *:w-full sm:*:w-auto">{action}</div>}
          </div>
          {onClose && (
            <button type="button" onClick={onClose} aria-label="Kapat"
              className="-mr-1 grid size-5 shrink-0 place-items-center rounded text-neutral-500 transition-colors hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 pointer-coarse:hidden"
            >
              <X size={12} />
            </button>
          )}
        </div>
        {duration && onClose && (
          <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl">
            <span onAnimationEnd={onClose}
              className={`notice-countdown absolute inset-x-0 bottom-0 h-0.5 origin-left ${LINE_TONE[tone] ?? "bg-skylab-400/60"}`}
              style={{ "--notice-duration": `${duration}s`, ...(halted ? { animationPlayState: "paused" } : {}) }}
            />
          </span>
        )}
      </motion.div>
    </motion.div>
  );
}
