"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { SegmentedControl, ToggleRow } from "@skylab-kulubu/skylcn-ui";
import { FilterGroup } from "./FormsFilterShell";

const SORT_OPTIONS = [
  { value: "desc", label: "Azalan", icon: ArrowDown },
  { value: "asc", label: "Artan", icon: ArrowUp },
];

/** The workflows list's filters, drawn in the header's filter popover. */
export default function WorkflowsFilterShell({ sortValue = "desc", onSortChange, showArchived = false, onShowArchivedChange }) {
  return (
    <>
      <FilterGroup label="Tarih Sıralaması">
        <SegmentedControl aria-label="Tarih Sıralaması" options={SORT_OPTIONS} value={sortValue} onValueChange={onSortChange} className="w-full" />
      </FilterGroup>

      <FilterGroup label="Arşiv Durumu">
        <ToggleRow title="Arşiv hariç" checkedTitle="Arşiv dahil" checked={showArchived} onCheckedChange={(checked) => onShowArchivedChange?.(checked)} />
      </FilterGroup>
    </>
  );
}
