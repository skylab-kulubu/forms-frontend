"use client";

import { useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { ClipboardCheck } from "lucide-react";
import SearchPicker from "@/app/components/utils/SearchPicker";
import { eligibilityReason } from "../workflow-copy";

export default function AddStepPicker({ open, forms = [], usedFormIds = [], isLoading, onSelect, onClose }) {
  const [search, setSearch] = useState("");

  const items = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    return forms
      .map((form) => ({ ...form, isUsed: usedFormIds.includes(form.id) }))
      .filter((form) => (query ? (form.title ?? "").toLocaleLowerCase("tr-TR").includes(query) : true))
      .sort((a, b) => Number(b.isEligible && !b.isUsed) - Number(a.isEligible && !a.isUsed));
  }, [forms, search, usedFormIds]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="absolute inset-x-0 top-full z-30">
          <button type="button" aria-label="Kapat" onClick={onClose} className="fixed inset-0 cursor-default" />
          <div className="relative w-full">
            <SearchPicker searchValue={search} onSearchChange={setSearch} searchable autoFocus loading={isLoading}
              items={items} itemsPerPage={5} getItemId={(form) => form.id}
              footerText="Bir form yalnızca tek bir yayındaki akışta kullanılabilir."
              onSelect={(form) => {
                if (!form.isEligible || form.isUsed) return;
                onSelect?.(form);
              }}
              renderItem={(form, { onSelect: select }) => {
                const disabled = !form.isEligible || form.isUsed;
                const reason = form.isUsed ? "Bu akışta zaten var" : form.isEligible ? null : eligibilityReason(form.reason);

                return (
                  <button type="button" onClick={select} disabled={disabled}
                    className={`flex w-full items-start gap-2 px-3 py-2 text-left transition-colors ${
                      disabled ? "cursor-not-allowed opacity-50" : "hover:bg-white/10"
                    }`}
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-skylab-400/70" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium leading-tight text-neutral-200">{form.title || "Adsız form"}</span>
                        {form.requiresManualReview ? <ClipboardCheck size={11} className="shrink-0 text-amber-300" /> : null}
                      </span>
                      <span className="block truncate text-2xs text-neutral-500">{reason ?? form.id}</span>
                    </span>
                  </button>
                );
              }}
            />
          </div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
