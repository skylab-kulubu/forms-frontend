"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArchiveX, ArrowDown, ArrowUp } from "lucide-react";
import { SegmentedControl, TwoStateIconButton } from "./ResponsesFilterShell";

const panelVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } },
};

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -8, height: 0 },
  visible: { opacity: 1, y: 0, height: "auto", transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

const SORT_OPTIONS = [
  { value: "desc", label: "Azalan", icon: ArrowDown },
  { value: "asc", label: "Artan", icon: ArrowUp },
];

export default function WorkflowsFilterShell({ open, anchorRef, onClose, sortValue = "desc", onSortChange, showArchived = false, onShowArchivedChange, align = "center" }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      if (panelRef.current?.contains(event.target)) return;
      if (anchorRef?.current?.contains(event.target)) return;
      onClose?.();
    };
    const handleKey = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose, anchorRef]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div ref={panelRef} role="dialog" aria-label="Akış filtreleri" layout
          initial="hidden" animate="visible" exit="exit" variants={panelVariants}
          transition={{ layout: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
          className={`absolute top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] ${align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"} rounded-xl border border-white/15 bg-neutral-950/50 text-neutral-100 shadow-2xl backdrop-blur`}
        >
          <motion.div variants={contentVariants} className="flex flex-col p-4 text-center">
            <motion.div variants={itemVariants} className="overflow-hidden">
              <div className="space-y-2">
                <p className="text-3xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Tarih Sıralaması</p>
                <SegmentedControl options={SORT_OPTIONS} value={sortValue} onChange={onSortChange} ariaLabel="Tarih Sıralaması" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="overflow-hidden">
              <div className="space-y-2 pt-4">
                <p className="text-3xs font-semibold uppercase tracking-[0.18em] text-neutral-400">Arşiv Durumu</p>
                <TwoStateIconButton value={showArchived} onChange={onShowArchivedChange}
                  icon={showArchived ? ArchiveX : Archive} label={showArchived ? "Arşiv dahil" : "Arşiv hariç"}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
