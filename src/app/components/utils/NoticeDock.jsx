"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

export default function NoticeDock({ icon: Icon, tone = "text-skylab-300", action = null, onClose, role = "status", children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]"
    >
      <div role={role}
        className={`pointer-events-auto flex max-w-xl items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/90 py-2.5 pl-4 shadow-lg backdrop-blur ${action || onClose ? "pr-2" : "pr-4"}`}
      >
        <div className="flex min-w-0 flex-1 items-start gap-2 text-xs leading-5 text-neutral-200">
          {Icon && <Icon size={14} className={`mt-0.5 shrink-0 ${tone}`} />}
          <span className="min-w-0">{children}</span>
        </div>
        {action}
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Kapat"
            className="grid size-7 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
