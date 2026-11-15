"use client";

import { ArrowDown, ArrowUp, ClipboardCheck, Crown, Eye, PencilLine, Repeat2, UserX, Users } from "lucide-react";
import { Button, FilterPills, SegmentedControl } from "@skylab-kulubu/skylcn-ui";

const SORT_OPTIONS = [
  { value: "desc", label: "Azalan", icon: ArrowDown },
  { value: "asc", label: "Artan", icon: ArrowUp },
];

const ROLE_OPTIONS = [
  { value: "all", label: "Hepsi", icon: Users },
  { value: "viewer", label: "Okuyucu", icon: Eye },
  { value: "editor", label: "Editör", icon: PencilLine },
  { value: "owner", label: "Sahip", icon: Crown },
];

const nextOf = (value) => (value === null ? true : value === true ? false : null);
const stateOf = (value) => (value === true ? "açık olanlar" : value === false ? "kapalı olanlar" : "hepsi");

export function FilterGroup({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-2xs font-medium text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

// Each press steps through all, on and off; the colour and the label say which one holds
function TriStateButton({ value, onChange, icon: Icon, label }) {
  const text = `${label}: ${stateOf(value)}`;
  return (
    <Button size="sm" variant={value === true ? "primary" : value === false ? "destructive" : "outline"} aria-label={text} title={text}
      onClick={() => onChange?.(nextOf(value))} className="flex-1"
    >
      <Icon aria-hidden="true" />
    </Button>
  );
}

/** The forms list's filters, drawn in the header's filter popover. */
export default function FormsFilterShell({ sortValue = "desc", onSortChange, roleValue = "all", onRoleChange,
  allowAnonymous = null, onAllowAnonymousChange, allowMultiple = null, onAllowMultipleChange,
  requiresManualReview = null, onRequiresManualReviewChange, stateOptions = null, stateCounts = null, stateValue = "all", onStateChange
}) {
  return (
    <div className="flex flex-col gap-4">
      {stateOptions ? (
        <FilterGroup label="Form Durumu">
          <FilterPills aria-label="Form Durumu" value={stateValue} onValueChange={onStateChange} className="w-full justify-between overflow-x-auto scrollbar-hidden"
            options={stateOptions.map((option) => ({ value: option.id, label: option.label, count: stateCounts?.[option.id] ?? 0 }))}
          />
        </FilterGroup>
      ) : null}

      <FilterGroup label="Tarih Sıralaması">
        <SegmentedControl aria-label="Tarih Sıralaması" options={SORT_OPTIONS} value={sortValue} onValueChange={onSortChange} className="w-full" />
      </FilterGroup>

      <FilterGroup label="Form Yetkisi">
        <SegmentedControl aria-label="Form Yetkisi" options={ROLE_OPTIONS} value={roleValue} onValueChange={onRoleChange} className="w-full" />
      </FilterGroup>

      <FilterGroup label="Form Özellikleri">
        <div className="flex items-center gap-2">
          <TriStateButton value={allowAnonymous} onChange={onAllowAnonymousChange} icon={UserX} label="Anonim cevap" />
          <TriStateButton value={allowMultiple} onChange={onAllowMultipleChange} icon={Repeat2} label="Coklu cevap" />
          <TriStateButton value={requiresManualReview} onChange={onRequiresManualReviewChange} icon={ClipboardCheck} label="Manuel onay" />
        </div>
      </FilterGroup>
    </div>
  );
}
