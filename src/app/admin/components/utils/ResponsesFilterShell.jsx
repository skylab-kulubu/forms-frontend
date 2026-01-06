"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, ArchiveX, ArrowDown, ArrowUp, CheckCircle2, Clock, SlidersHorizontal, User, UserX, Users, XCircle } from "lucide-react";

function SegmentedControl({ options = [], value, onChange, ariaLabel }) {
  const count = Math.max(options.length, 1);
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const indicatorStyle = {
    width: `calc((100% - 0.5rem) / ${count})`,
    transform: `translateX(${activeIndex * 100}%)`,
  };

  return (
    <div className="relative grid w-full rounded-lg border border-white/10 bg-neutral-900/60 p-1 text-[11px]"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span className="absolute inset-y-1 left-1 rounded-md border border-indigo-400/40 bg-indigo-500/15 shadow-sm transition-transform duration-200"
        style={indicatorStyle}
      />
      {options.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;
        return (
          <button type="button" key={option.value} onClick={() => onChange?.(option.value)} aria-pressed={isActive}
            aria-label={ariaLabel ? `${ariaLabel}: ${option.label}` : option.label} title={option.label}
            className={`relative z-10 flex h-7 w-full items-center justify-center rounded-md px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${isActive ? "text-indigo-100" : "text-neutral-300 hover:text-indigo-300"}`}
          >
            {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : <span className="block truncate">{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

function TwoStateIconButton({ value = false, onChange, icon: Icon, label }) {
  const nextValue = !value;

  const stateClass = value ? "border-indigo-400/40 bg-indigo-500/15 text-indigo-100" : "border-white/10 bg-neutral-900/60 text-neutral-300 hover:text-indigo-300";

  return (
    <button type="button" onClick={() => onChange?.(nextValue)} aria-label={label} title={label} aria-pressed={value}
      className={`flex h-9 w-full items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40 ${stateClass}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}


const panelVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } },
};

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -8, height: 0 },
  visible: { opacity: 1, y: 0, height: "auto", transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
};

export default function ResponsesFilterShell({ open, anchorRef, onClose, sortValue = "desc", onSortChange, statusValue = "all", onStatusChange, respondentValue = "all", onRespondentChange, showArchived = false, onShowArchivedChange, className = "" }) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (event) => {
      const target = event.target;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef?.current?.contains(target)) return;
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

  const sortOptions = [
    { value: "desc", label: "Azalan", icon: ArrowDown },
    { value: "asc", label: "Artan", icon: ArrowUp },
  ];

  const statusOptions = [
    { value: "all", label: "Hepsi", icon: SlidersHorizontal },
    { value: "pending", label: "Beklemede", icon: Clock },
    { value: "approved", label: "Onayli", icon: CheckCircle2 },
    { value: "rejected", label: "Reddedilen", icon: XCircle },
  ];

  const respondentOptions = [
    { value: "all", label: "Hepsi", icon: Users },
    { value: "anonymous", label: "Anonim", icon: UserX },
    { value: "registered", label: "Kayitli", icon: User },
  ];

  return (
    <AnimatePresence>
      {open ? (
        <motion.div ref={panelRef} role="dialog" aria-label="Responses filters" layout
          initial="hidden" animate="visible" exit="exit" variants={panelVariants}
          transition={{ layout: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
          className={`absolute left-1/2 top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-white/15 bg-neutral-950/50 text-neutral-100 shadow-2xl backdrop-blur ${className}`}
        >
          <motion.div variants={contentVariants} className="flex flex-col text-center p-4">
            <motion.div variants={itemVariants} className="overflow-hidden">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Tarih Sıralaması
                </p>
                <SegmentedControl options={sortOptions} value={sortValue} onChange={onSortChange} ariaLabel="Tarih Sıralaması" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="overflow-hidden">
              <div className="space-y-2 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Arşiv Durumu
                </p>
                <TwoStateIconButton value={showArchived} onChange={onShowArchivedChange} icon={showArchived ? ArchiveX : Archive} label={showArchived ? "Arşiv dahil" : "Arşiv hariç"}/>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="overflow-hidden">
              <div className="space-y-2 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Cevap Durumu
                </p>
                <SegmentedControl options={statusOptions} value={statusValue} onChange={onStatusChange} ariaLabel="Cevap Durumu" />
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="overflow-hidden">
              <div className="space-y-2 pt-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-400">
                  Anonimlik Durumu
                </p>
                <SegmentedControl options={respondentOptions} value={respondentValue} onChange={onRespondentChange} ariaLabel="Anonimlik Durumu" />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}