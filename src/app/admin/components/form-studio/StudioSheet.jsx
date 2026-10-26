"use client";

import { AnimatePresence, motion, useDragControls } from "framer-motion";

export default function StudioSheet({ open, onClose, label, header = null, children }) {
  const controls = useDragControls();

  return (
    <AnimatePresence>
      {open ? (
        <div className="absolute inset-0 z-50 flex flex-col justify-end overflow-hidden">
          <motion.div className="absolute inset-0 bg-black/50" onClick={onClose}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
          />
          <motion.div role="dialog" aria-modal="true" aria-label={label}
            drag="y" dragListener={false} dragControls={controls} dragConstraints={{ top: 0, bottom: 0 }} dragElastic={{ top: 0, bottom: 0.8 }}
            onDragEnd={(event, info) => { if (info.offset.y > 96 || info.velocity.y > 500) onClose(); }}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 420, damping: 42, mass: 0.8 }}
            className="relative mx-auto flex h-[86%] w-full max-w-xl flex-col overflow-hidden rounded-t-2xl border border-b-0 border-white/10 bg-neutral-900 shadow-2xl shadow-black/60"
          >
            <div onPointerDown={(event) => controls.start(event)} className="shrink-0 cursor-grab touch-none active:cursor-grabbing">
              <div className="flex justify-center pb-1.5 pt-2.5"><span className="h-1 w-10 rounded-full bg-white/20" /></div>
              {header}
            </div>
            <div className="flex min-h-0 flex-1 flex-col">{children}</div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
