"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useMediaQuery } from "../form-studio/useMediaQuery";

const SIDE_MOTION = { type: "tween", duration: 0.3, ease: [0.22, 1, 0.36, 1] };
const BOTTOM_MOTION = { type: "spring", stiffness: 420, damping: 42, mass: 0.8 };

export default function RoomSheet({ open, onClose, label, side = "bottom", header = null, children }) {
  const wide = useMediaQuery("(min-width: 768px)");
  const placement = wide && side !== "bottom" ? side : "bottom";
  const bottom = placement === "bottom";
  const controls = useDragControls();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const frame = requestAnimationFrame(() => panelRef.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  const away = placement === "left" ? { x: "-104%" } : placement === "right" ? { x: "104%" } : { y: "100%" };
  const home = bottom ? { y: 0 } : { x: 0 };
  const drag = bottom ? {
    drag: "y",
    dragListener: false,
    dragControls: controls,
    dragConstraints: { top: 0, bottom: 0 },
    dragElastic: { top: 0, bottom: 0.8 },
    onDragEnd: (event, info) => { if (info.offset.y > 80 || info.velocity.y > 500) onClose(); },
  } : {};

  return (
    <AnimatePresence>
      {open ? (
        <div key="room-sheet" className={`absolute inset-0 z-50 overflow-hidden ${bottom ? "flex flex-col justify-end" : ""}`}>
          <motion.div className="absolute inset-0 bg-black/50" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          />
          <motion.div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} {...drag}
            initial={away} animate={home} exit={away} transition={bottom ? BOTTOM_MOTION : SIDE_MOTION}
            className={bottom
              ? "relative mx-auto flex max-h-[86%] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-neutral-900 shadow-2xl shadow-black/60 outline-none"
              : `absolute inset-y-2 flex w-[min(22rem,calc(100%-3rem))] flex-col overflow-hidden rounded-xl border border-white/10 bg-neutral-900 shadow-2xl shadow-black/60 outline-none ${placement === "left" ? "left-2" : "right-2"}`}
          >
            {bottom ? (
              <div onPointerDown={(event) => controls.start(event)} className="shrink-0 cursor-grab touch-none active:cursor-grabbing">
                <button type="button" onClick={onClose} aria-label="Kapat" className="flex h-7 w-full items-center justify-center">
                  <span className="h-1 w-10 rounded-full bg-white/20" />
                </button>
                {header}
              </div>
            ) : header ? <div className="shrink-0">{header}</div> : null}
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
