"use client";

import { Users, UserX } from "lucide-react";
import { Button, FilterPills, SegmentedControl } from "@skylab-kulubu/skylcn-ui";
import Avatar from "@/app/components/utils/Avatar";
import { formatPersonName } from "../form-responses/response-data";
import { FilterGroup } from "../utils/FormsFilterShell";
import { FLAG_KEYS, filterCount } from "./database-params";

const FLAG_OPTIONS = [
  { value: "all", label: "Hepsi" },
  { value: "on", label: "Açık" },
  { value: "off", label: "Kapalı" },
];

const flagValue = (value) => (value === true ? "on" : value === false ? "off" : "all");
const flagOf = (value) => (value === "on" ? true : value === "off" ? false : null);

function OwnerRow({ selected, onClick, icon, label, count }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected}
      className={`flex h-9 w-full items-center gap-2.5 rounded-md border px-2 text-left text-2xs outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-border bg-accent-strong text-foreground" : "border-transparent text-secondary-foreground hover:bg-accent hover:text-foreground"}`}
    >
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count != null ? <span className="shrink-0 tabular-nums text-subtle-foreground">{count}</span> : null}
    </button>
  );
}

const ICON_BOX = "grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground";

/** The database's filters, drawn in the header's filter popover. */
export default function DatabaseFilters({ state, onChange, onClear, summary = null, owners = [] }) {
  const active = filterCount(state);
  const statusOptions = [
    { value: "all", label: "Hepsi" },
    { value: "open", label: "Açık" },
    { value: "closed", label: "Kapalı" },
    { value: "deleted", label: "Silinen", count: summary?.deleted ?? undefined },
  ];

  return (
    <>
      <FilterGroup label="Durum">
        <FilterPills aria-label="Durum" options={statusOptions} value={state.status} onValueChange={(value) => onChange({ status: value })} className="w-full justify-between" />
      </FilterGroup>

      <FilterGroup label="Sahip">
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
      </FilterGroup>

      <FilterGroup label="Özellikler">
        <div className="space-y-1.5">
          {FLAG_KEYS.map(([key, label]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="min-w-0 flex-1 truncate text-2xs text-secondary-foreground">{label}</span>
              <SegmentedControl aria-label={label} options={FLAG_OPTIONS} value={flagValue(state[key])} onValueChange={(value) => onChange({ [key]: flagOf(value) })} className="w-40 shrink-0" />
            </div>
          ))}
        </div>
      </FilterGroup>

      <div className="flex items-center justify-between border-t border-border-subtle pt-3">
        <span className="text-2xs text-subtle-foreground">{active ? `${active} filtre açık` : "Filtre yok"}</span>
        <Button variant="ghost" size="sm" onClick={onClear} disabled={!active}>Temizle</Button>
      </div>
    </>
  );
}
