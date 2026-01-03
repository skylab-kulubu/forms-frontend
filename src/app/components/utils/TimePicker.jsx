"use client";

import { useEffect, useRef, useMemo } from "react";
import { motion } from "framer-motion";

function pad2(n) { return String(n).padStart(2, "0"); }

const panelVariants = {
  hidden: { opacity: 0, scale: 0.95, y: -8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.15, ease: "easeIn" } },
};

const staggerContainerVariants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.02, staggerChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10, filter: "blur(2px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: 5, filter: "blur(2px)", transition: { duration: 0.15 } },
};

export default function TimePicker({ hour, minute, onChange, onCancel, onConfirm, onClear, className = "" }) {
  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = useMemo(() => {
    const arr = [];
    for (let m = 0; m < 60; m += 5) arr.push(m);
    return arr;
  }, []);

  const hourContainerRef = useRef(null);
  const minuteContainerRef = useRef(null);

  useEffect(() => {
    const scrollOpts = { block: "center" };
    if (hourContainerRef.current) {
      const el = hourContainerRef.current.querySelector(`[data-active="true"]`);
      if (el) el.scrollIntoView(scrollOpts);
    }
    if (minuteContainerRef.current) {
      const el = minuteContainerRef.current.querySelector(`[data-active="true"]`);
      if (el) el.scrollIntoView(scrollOpts);
    }
  }, []);

  return (
    <motion.div variants={panelVariants} initial="hidden" animate="visible" exit="exit" onMouseDown={(e) => e.stopPropagation()}
      className={`absolute z-20 mt-2 w-[280px] rounded-xl border border-white/10 bg-neutral-900/40 p-2.5 shadow-lg backdrop-blur-md supports-backdrop-filter:bg-neutral-900/30 ${className}`}
    >
      <motion.div variants={staggerContainerVariants} className="flex flex-col">
        
        <motion.div variants={itemVariants} className="flex items-center justify-between gap-2 p-1 rounded-md bg-white/5">
          <div className="text-xs font-medium text-neutral-100">
            {pad2(hour)}:{pad2(minute)}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-2 grid grid-cols-2 gap-1.5">
          
          <div className="max-h-40 overflow-auto rounded-md border border-white/10 bg-white/5 p-1 no-scrollbar" ref={hourContainerRef}>
            {hours.map((h) => (
              <button key={h} data-active={h === hour} type="button" onClick={() => onChange(h, minute)}
                className={`block w-full rounded-md px-1.5 py-1 text-left text-xs transition hover:bg-white/10 ${h === hour ? "bg-white/15 text-neutral-100 ring-1 ring-white/20" : "text-neutral-200"}`}
              >
                {pad2(h)}
              </button>
            ))}
          </div>

          <div className="max-h-40 overflow-auto rounded-md border border-white/10 bg-white/5 p-1 no-scrollbar" ref={minuteContainerRef}>
            {minutes.map((m) => (
              <button key={m} data-active={m === minute} type="button" onClick={() => onChange(hour, m)}
                className={`block w-full rounded-md px-1.5 py-1 text-left text-xs transition hover:bg-white/10 ${m === minute ? "bg-white/15 text-neutral-100 ring-1 ring-white/20" : "text-neutral-200"}`}
              >
                {pad2(m)}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="mt-2 flex items-center justify-between">
          <button type="button" onClick={onClear} className="text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors">
            Temizle
          </button>
          
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-neutral-200 hover:bg-white/10 transition-colors">
              İptal
            </button>
            <button type="button" onClick={onConfirm} className="rounded-md border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs text-neutral-100 hover:bg-white/15 transition-colors">
              Seç
            </button>
          </div>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}