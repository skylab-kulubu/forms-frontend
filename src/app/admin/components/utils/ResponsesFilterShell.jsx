"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { STATUS_FILTERS } from "@/lib/attempt-status";

export function SegmentedControl({ options = [], value, onChange, ariaLabel }) {
  const count = Math.max(options.length, 1);
  const activeIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const indicatorStyle = {
    width: `calc((100% - 0.5rem) / ${count})`,
    transform: `translateX(${activeIndex * 100}%)`,
  };

  return (
    <div className="relative grid w-full rounded-lg border border-white/10 bg-neutral-900/60 p-1 text-2xs"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span className="absolute inset-y-1 left-1 rounded-md border border-skylab-400/40 bg-skylab-500/15 shadow-sm transition-transform duration-200"
        style={indicatorStyle}
      />
      {options.map((option) => {
        const isActive = option.value === value;
        const Icon = option.icon;
        return (
          <button type="button" key={option.value} onClick={() => onChange?.(option.value)} aria-pressed={isActive}
            aria-label={ariaLabel ? `${ariaLabel}: ${option.label}` : option.label} title={option.label}
            className={`relative z-10 flex h-7 w-full items-center justify-center rounded-md px-2 text-2xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${isActive ? "text-skylab-300" : "text-neutral-300 hover:text-skylab-300"}`}
          >
            {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : <span className="block truncate">{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function TwoStateIconButton({ value = false, onChange, icon: Icon, label }) {
  const nextValue = !value;

  const stateClass = value ? "border-skylab-400/40 bg-skylab-500/15 text-skylab-300" : "border-white/10 bg-neutral-900/60 text-neutral-300 hover:text-skylab-300";

  return (
    <button type="button" onClick={() => onChange?.(nextValue)} aria-label={label} title={label} aria-pressed={value}
      className={`flex h-9 w-full items-center justify-center rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${stateClass}`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

const panelVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -6, scale: 0.98, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } },
};

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

const SORT_OPTIONS = [
  { value: "desc", label: "Yeni önce" },
  { value: "asc", label: "Eski önce" },
];

const RESPONDENT_OPTIONS = [
  { value: "all", label: "Hepsi" },
  { value: "registered", label: "Kayıtlı" },
  { value: "anonymous", label: "Anonim" },
];

const TIME_OPTIONS = [
  { value: "all", label: "Hepsi" },
  { value: "extended", label: "Uzatılanlar" },
  { value: "soon", label: "Bitmek üzere" },
];

const ARCHIVE_OPTIONS = [
  { value: "out", label: "Hariç" },
  { value: "in", label: "Dahil" },
];

function FilterSection({ label, children }) {
  return (
    <motion.div variants={itemVariants} className="space-y-2">
      <p className="text-2xs font-medium text-neutral-500">{label}</p>
      {children}
    </motion.div>
  );
}

export default function ResponsesFilterShell({ open, anchorRef, onClose, sortValue = "desc", onSortChange, statusValue = "all", onStatusChange,
  respondentValue = "all", onRespondentChange, showArchived = false, onShowArchivedChange, timeValue = "all", onTimeChange,
  counts = null, timed = false, className = "", align = "center"
}) {
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

  const statusOptions = STATUS_FILTERS.filter((option) => (timed || !option.timed)
    && (!option.whenPresent || option.value === statusValue || option.count(counts) > 0));

  return (
    <AnimatePresence>
      {open ? (
        <motion.div ref={panelRef} role="dialog" aria-label="Cevap filtreleri"
          initial="hidden" animate="visible" exit="exit" variants={panelVariants}
          className={`absolute top-full z-30 mt-2 w-80 max-w-[calc(100vw-2rem)] ${align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"} rounded-xl border border-white/15 bg-neutral-950/90 text-neutral-100 shadow-2xl backdrop-blur ${className}`}
        >
          <motion.div variants={contentVariants} className="flex flex-col gap-4 p-4">
            <FilterSection label="Sıralama">
              <SegmentedControl options={SORT_OPTIONS} value={sortValue} onChange={onSortChange} ariaLabel="Sıralama" />
            </FilterSection>

            <FilterSection label="Durum">
              <div className="grid grid-cols-2 gap-1.5">
                {statusOptions.map((option) => {
                  const selected = statusValue === option.value;
                  const count = option.count(counts);
                  return (
                    <button key={option.value} type="button" onClick={() => onStatusChange?.(option.value)} aria-pressed={selected}
                      className={`flex h-7 items-center gap-1.5 rounded-md border px-2 text-2xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40
                        ${selected ? "border-skylab-400/40 bg-skylab-500/15 text-skylab-300" : "border-white/10 bg-neutral-900/60 text-neutral-300 hover:text-skylab-300"}`}
                    >
                      {option.dot && <span className={`size-1.5 shrink-0 rounded-full ${option.dot}`} />}
                      <span className="min-w-0 flex-1 truncate text-left">{option.label}</span>
                      {count != null && <span className={`tabular-nums ${selected ? "text-skylab-300/70" : "text-neutral-500"}`}>{count}</span>}
                    </button>
                  );
                })}
              </div>
            </FilterSection>

            <FilterSection label="Kimlik">
              <SegmentedControl options={RESPONDENT_OPTIONS} value={respondentValue} onChange={onRespondentChange} ariaLabel="Kimlik" />
            </FilterSection>

            {timed && (
              <FilterSection label="Süre">
                <SegmentedControl options={TIME_OPTIONS} value={timeValue} onChange={onTimeChange} ariaLabel="Süre" />
              </FilterSection>
            )}

            <FilterSection label="Arşiv">
              <SegmentedControl options={ARCHIVE_OPTIONS} value={showArchived ? "in" : "out"} onChange={(value) => onShowArchivedChange?.(value === "in")} ariaLabel="Arşiv" />
            </FilterSection>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
