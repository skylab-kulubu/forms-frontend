"use client";

import { Fragment, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search } from "lucide-react";
import { Floating } from "@/app/components/utils/Floating";

export const FOCUS_RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40";
export const PANEL_STACK = "flex flex-col divide-y divide-neutral-800/60 p-4 text-sm text-neutral-200";
export const PANEL_SECTION = "space-y-4 py-6 first:pt-0";
export const ROW = "rounded-lg border transition-[border-color,background-color,box-shadow] duration-200";
export const ROW_HOVER = "hover:border-white/20 hover:bg-white/3";
export const TILE = "grid size-9 shrink-0 place-items-center rounded-lg border bg-neutral-900/60 text-xs font-semibold";
export const ACTION_ICON = "shrink-0 opacity-70 transition-opacity group-hover:opacity-100";
export const PANEL_BOX = "rounded-lg border border-white/10 bg-neutral-900/60 transition-[border-color,box-shadow] focus-within:border-skylab-400/50 focus-within:ring-2 focus-within:ring-skylab-400/20";

export const PILL_TONE = {
  skylab: "border-skylab-400/30 text-skylab-300/80",
  neutral: "border-white/10 text-neutral-400",
  amber: "border-amber-400/35 text-amber-300",
  red: "border-red-400/35 text-red-300",
};

const NOTICE_TONE = {
  amber: "border-amber-400/40 bg-amber-500/10 text-amber-100",
  red: "border-red-400/40 bg-red-500/10 text-red-100",
};

const HEADER_ROW = "flex h-10 min-w-0 shrink-0 items-center border-b border-neutral-800 px-4 text-sm font-semibold tracking-wide";
const ACTION_BASE = `group flex h-7 items-center justify-center gap-2 rounded-lg border px-3 text-2xs font-medium transition-colors ${FOCUS_RING} disabled:pointer-events-none disabled:opacity-40`;
const PILL_BASE = "flex min-w-22 max-w-36 shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-2xs";

export function panelShellClass(layout) {
  const size = layout === "drawer" ? "h-full w-full pt-8" : "col-span-4 h-[calc(100dvh-5.5rem)]";
  return `relative flex min-w-0 max-w-xl overflow-hidden rounded-xl p-2 ${size}`;
}

export function actionClass({ danger = false, active = false } = {}) {
  if (active) return `${ACTION_BASE} border-skylab-400/30 bg-skylab-500/10 text-skylab-300`;
  const hover = danger
    ? "hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300"
    : "hover:border-skylab-400/30 hover:bg-skylab-500/10 hover:text-skylab-300";
  return `${ACTION_BASE} border-white/10 bg-white/5 text-neutral-300 ${hover}`;
}

export function PanelTabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" className={HEADER_ROW}>
      {tabs.map((tab, index) => (
        <Fragment key={tab.id}>
          {index > 0 ? <span className="mx-2 h-3 w-px shrink-0 bg-neutral-800" /> : null}
          <button type="button" role="tab" aria-selected={tab.id === active} onClick={() => onChange(tab.id)} title={tab.title}
            className={`w-full min-w-0 truncate rounded transition-colors ${FOCUS_RING} ${tab.id === active ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            {tab.label}
          </button>
        </Fragment>
      ))}
    </div>
  );
}

export function StatePill({ tone = "skylab", children }) {
  return (
    <span className={`shrink-0 rounded-full border px-3 py-0.5 text-3xs font-semibold uppercase tracking-[0.18em] ${PILL_TONE[tone] ?? PILL_TONE.neutral}`}>
      {children}
    </span>
  );
}

export function SectionHeader({ title, description, pill, pillTone = "skylab", dot, expanded, onToggle }) {
  const heading = (
    <div className="min-w-0">
      <p className="flex items-center gap-2 font-semibold text-neutral-100">
        {dot ? <span className={`size-1.5 shrink-0 rounded-full ${dot}`} /> : null}
        <span className="min-w-0 truncate">{title}</span>
        {onToggle ? (
          <ChevronDown size={14} className={`shrink-0 text-neutral-500 transition-transform duration-200 group-hover:text-neutral-300 ${expanded ? "" : "-rotate-90"}`} />
        ) : null}
      </p>
      {description ? <p className="mt-1 text-2xs leading-relaxed text-neutral-500">{description}</p> : null}
    </div>
  );
  const status = pill ? <StatePill tone={pillTone}>{pill}</StatePill> : null;

  if (onToggle) {
    return (
      <button type="button" onClick={onToggle} aria-expanded={expanded}
        className={`group flex w-full items-start justify-between gap-4 rounded text-left ${FOCUS_RING}`}
      >
        {heading}
        {status}
      </button>
    );
  }

  return (
    <div className="flex items-start justify-between gap-4">
      {heading}
      {status}
    </div>
  );
}

export function Switch({ checked, onChange, label, disabled = false, className = "" }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} disabled={disabled}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border px-1 transition disabled:cursor-not-allowed ${checked ? "border-skylab-400/50 bg-skylab-400/20" : "border-white/10 bg-white/5"} ${className}`}
    >
      <span className={`h-5 w-5 rounded-full bg-white/90 shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

export function ToggleRow({ title, description, checked, onChange, disabled = false, dimmed = false, adornment = null }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5 transition-opacity duration-300 ${dimmed ? "opacity-40" : ""}`}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-100">{title}</p>
        <p className="text-2xs text-neutral-500">{description}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {adornment}
        <Switch checked={checked} onChange={onChange} disabled={disabled} label={title} className={dimmed ? "" : "disabled:opacity-50"} />
      </div>
    </div>
  );
}

export function PanelButton({ icon: Icon, iconClassName = "", children, danger = false, active = false, chevron = false, className = "", ...props }) {
  return (
    <button type="button" className={`${actionClass({ danger, active })} ${className}`} {...props}>
      {Icon ? <Icon size={13} className={`${ACTION_ICON} ${iconClassName}`} /> : null}
      {children}
      {chevron ? <ChevronDown size={12} className={`-ml-0.5 shrink-0 opacity-70 transition-transform duration-200 ${active ? "rotate-180" : ""}`} /> : null}
    </button>
  );
}

export function PanelInput({ icon: Icon = Search, className = "", ...props }) {
  return (
    <div className={`relative ${className}`}>
      <Icon size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
      <input type="text" {...props}
        className="h-8 w-full rounded-lg border border-white/10 bg-neutral-900/60 pl-8 pr-3 text-xs text-neutral-200 outline-none transition-[border-color,box-shadow] placeholder:text-neutral-600 focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
      />
    </div>
  );
}

export function PanelTextarea({ className = "", ...props }) {
  return (
    <div className={`${PANEL_BOX} ${className}`}>
      <textarea {...props}
        className="block w-full resize-y rounded-lg bg-transparent px-3 py-2 text-sm leading-relaxed text-neutral-100 outline-none placeholder:text-neutral-600"
      />
    </div>
  );
}

export function PanelNotice({ tone = "amber", className = "", children }) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-xs shadow-sm ${NOTICE_TONE[tone] ?? NOTICE_TONE.amber} ${className}`}>
      {children}
    </div>
  );
}

export function PillBadge({ children }) {
  return <span className={`${PILL_BASE} justify-center border-white/10 bg-white/5 text-neutral-300`}>{children}</span>;
}

export function MenuPill({ value, options, onSelect, placeholder = "", italic = false, onDelete, deleteLabel = "Kaldır", deleteHint, open: controlledOpen, onOpenChange }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const anchorRef = useRef(null);

  const current = options.find((option) => option.value === value);
  const stop = (event) => event.stopPropagation();

  const choose = (option) => {
    if (option.disabled) return;
    setOpen(false);
    if (option.value !== value) onSelect(option.value);
  };

  return (
    <>
      <button ref={anchorRef} type="button" aria-haspopup="menu" aria-expanded={open}
        onClick={(event) => { event.stopPropagation(); setOpen(!open); }} onKeyDown={stop}
        className={`${PILL_BASE} justify-between transition-colors ${FOCUS_RING} ${italic ? "italic" : ""} ${
          open ? "border-white/20 bg-[#1e1e1e] text-neutral-50"
            : `border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:text-neutral-50 ${italic ? "text-neutral-400" : "text-neutral-300"}`
        }`}
      >
        <span className="truncate">{current?.label ?? placeholder}</span>
        <ChevronDown size={11} className={`shrink-0 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <Floating anchor={anchorRef} onDismiss={() => setOpen(false)} placement="bottom-end" offset={6}>
            <motion.div role="menu" onClick={stop} onKeyDown={stop}
              initial={{ opacity: 0, y: 4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.1 }}
              className="max-h-72 min-w-44 max-w-64 overflow-y-auto rounded-[10px] border border-white/20 bg-[#1e1e1e] p-1.5 shadow-xl scrollbar"
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button key={option.value} type="button" role="menuitem" disabled={option.disabled} onClick={() => choose(option)}
                    className={`flex w-full items-center justify-between gap-2.5 rounded-md px-2 py-1.5 text-left text-2xs transition-colors ${
                      option.disabled ? "cursor-not-allowed text-neutral-600"
                        : isSelected ? "bg-skylab-500/10 text-skylab-300"
                        : "text-neutral-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? <Check size={12} className="shrink-0" /> : option.hint ? <span className="shrink-0 text-3xs text-neutral-600">{option.hint}</span> : null}
                  </button>
                );
              })}

              {onDelete !== undefined && (
                <>
                  {options.length > 0 ? <div className="mx-1 my-1 h-px bg-white/10" /> : null}
                  <button type="button" role="menuitem" disabled={!onDelete} onClick={() => { setOpen(false); onDelete?.(); }}
                    className="flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left text-2xs text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:text-neutral-600 disabled:hover:bg-transparent"
                  >
                    {deleteLabel}
                    {!onDelete && deleteHint ? <span className="text-3xs text-neutral-600">{deleteHint}</span> : null}
                  </button>
                </>
              )}
            </motion.div>
          </Floating>
        )}
      </AnimatePresence>
    </>
  );
}
