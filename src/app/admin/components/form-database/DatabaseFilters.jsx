"use client";

import { useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Users, UserX } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";
import { formatPersonName } from "../form-responses/response-data";
import { panelVariants, useDismissPanel } from "../utils/FormsFilterShell";
import { FLAG_KEYS, filterCount } from "./database-params";

const OPTION_ON = "border-skylab-400/40 bg-skylab-500/15 text-skylab-300";
const OPTION_OFF = "border-transparent text-neutral-400 hover:text-neutral-100";

function Segment({ options, value, onChange, label }) {
  return (
    <div role="group" aria-label={label} className="grid w-full rounded-lg border border-white/10 bg-neutral-900/60 p-0.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(([key, text, count]) => (
        <button key={String(key)} type="button" onClick={() => onChange(key)} aria-pressed={value === key}
          className={`flex h-7 min-w-0 items-center justify-center gap-1 rounded-md border px-1.5 text-2xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${value === key ? OPTION_ON : OPTION_OFF}`}
        >
          <span className="truncate">{text}</span>
          {count != null ? <span className="tabular-nums text-neutral-500">{count}</span> : null}
        </button>
      ))}
    </div>
  );
}

function OwnerRow({ selected, onClick, icon, label, count }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className={`flex h-9 w-full items-center gap-2.5 rounded-md border px-2 text-left text-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${selected ? OPTION_ON : "border-transparent text-neutral-300 hover:bg-white/5 hover:text-neutral-100"}`}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
      {count != null ? <span className="shrink-0 tabular-nums text-neutral-500">{count}</span> : null}
    </button>
  );
}

const ICON_BOX = "grid size-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-neutral-900/60 text-neutral-400";

export default function DatabaseFilters({ open, anchorRef, onClose, state, onChange, onClear, summary = null, owners = [], align = "right" }) {
  const panelRef = useRef(null);

  useDismissPanel({ open, anchorRef, panelRef, onClose });

  return (
    <AnimatePresence>
      {open ? (
        <motion.div ref={panelRef} role="dialog" aria-label="Veritabanı filtreleri" initial="hidden" animate="visible" exit="exit" variants={panelVariants}
          className={`absolute top-full z-30 mt-2 w-80 max-w-[calc(100vw-1.5rem)] ${align === "right" ? "right-0" : "left-1/2 -translate-x-1/2"} rounded-xl border border-white/15 bg-neutral-950/90 text-neutral-100 shadow-2xl backdrop-blur`}
        >
          <div className="flex flex-col gap-4 p-4">
            <div className="space-y-2">
              <p className="text-2xs font-medium text-neutral-500">Durum</p>
              <Segment label="Durum" options={statusOptions} value={state.status} onChange={(value) => onChange({ status: value })} />
            </div>

            <div className="space-y-2">
              <p className="text-2xs font-medium text-neutral-500">Sahip</p>
              <div className="max-h-56 space-y-0.5 overflow-y-auto pr-0.5 scrollbar">
                <OwnerRow selected={state.owner === "all"} onClick={() => onChange({ owner: "all" })} label="Herkes"
                  icon={<span className={ICON_BOX}><Users size={13} /></span>}
                />
                <OwnerRow selected={state.owner === "orphaned"} onClick={() => onChange({ owner: "orphaned" })} label="Sahipsiz" count={summary?.orphaned}
                  icon={<span className={ICON_BOX}><UserX size={13} /></span>}
                />
                {owners.map((owner) => {
                  const name = formatPersonName(owner.fullName) || owner.email || "Adsız kullanıcı";
                  return (
                    <OwnerRow key={owner.id} selected={state.owner === owner.id} onClick={() => onChange({ owner: owner.id })} label={name} count={owner.formCount}
                      icon={<Avatar name={name} email={owner.email} photoUrl={owner.profilePictureUrl} size="sm" />}
                    />
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-2xs font-medium text-neutral-500">Özellikler</p>
              <div className="space-y-1.5">
                {FLAG_KEYS.map(([key, label]) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-2xs text-neutral-300">{label}</span>
                    <div className="w-40 shrink-0">
                      <Segment label={label} options={[[null, "Hepsi"], [true, "Açık"], [false, "Kapalı"]]} value={state[key]} onChange={(value) => onChange({ [key]: value })} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-3">
              <span className="text-2xs text-neutral-500">{active ? `${active} filtre açık` : "Filtre yok"}</span>
              <button type="button" onClick={onClear} disabled={!active}
                className="rounded-md px-2 py-1 text-2xs font-medium text-neutral-300 transition-colors hover:bg-white/5 hover:text-neutral-100 disabled:pointer-events-none disabled:text-neutral-600"
              >
                Temizle
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
