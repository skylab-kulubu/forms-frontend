"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Columns3 } from "lucide-react";
import { Floating } from "@/app/components/utils/Floating";
import { TABLE_COLUMNS, isDefaultHidden } from "./table-data";

export default function ColumnMenu({ hidden, onToggle, onReset }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);

  return (
    <>
      <button ref={anchorRef} type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Sütunlar" title="Sütunlar" onClick={() => setOpen((prev) => !prev)}
        className={`inline-grid size-6 place-items-center rounded-md outline-none transition-colors hover:bg-white/5 hover:text-neutral-200 focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${open ? "bg-white/5 text-neutral-200" : "text-neutral-500"}`}
      >
        <Columns3 size={14} strokeWidth={1.75} />
      </button>
      <AnimatePresence>
        {open ? (
          <Floating anchor={anchorRef} onDismiss={() => setOpen(false)} placement="bottom-end" offset={6}>
            <motion.div role="menu" aria-label="Sütunlar" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
              className="w-44 rounded-xl border border-white/10 bg-neutral-800 p-1.5 shadow-xl shadow-black/40"
            >
              {TABLE_COLUMNS.map((column) => {
                const shown = !hidden.has(column.id);
                return (
                  <button key={column.id} type="button" role="menuitemcheckbox" aria-checked={shown} onClick={() => onToggle(column.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-2xs transition-colors hover:bg-white/5 ${shown ? "text-neutral-100" : "text-neutral-500"}`}
                  >
                    <span className={`grid size-3.5 shrink-0 place-items-center rounded-sm border ${shown ? "border-skylab-400/50 bg-skylab-500/15 text-skylab-300" : "border-white/15"}`}>
                      {shown ? <Check size={10} strokeWidth={2.5} /> : null}
                    </span>
                    {column.label}
                  </button>
                );
              })}
              {isDefaultHidden(hidden) ? null : (
                <>
                  <div className="mx-1 my-1 h-px bg-white/10" />
                  <button type="button" onClick={onReset} className="w-full rounded-md px-2 py-1.5 text-left text-2xs text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100">
                    Varsayılana dön
                  </button>
                </>
              )}
            </motion.div>
          </Floating>
        ) : null}
      </AnimatePresence>
    </>
  );
}
