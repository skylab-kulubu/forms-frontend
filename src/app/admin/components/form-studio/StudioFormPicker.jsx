"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, FilePlus, FileText, Search } from "lucide-react";
import { Floating } from "@/app/components/utils/Floating";
import { eligibilityReason } from "../workflow-editor/workflow-copy";
import { POPOVER_MOTION } from "./studio-motion";

export const NEW_FORM = "__new-form";

export default function StudioFormPicker({ anchor, heading, forms = [], isLoading = false, excludeIds = [], usedIds = [], onPick, onClose, placement = "bottom" }) {
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  const items = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    const list = forms
      .filter((form) => !excludeIds.includes(form.id))
      .filter((form) => !query || (form.title ?? "").toLocaleLowerCase("tr-TR").includes(query))
      .map((form) => {
        const used = usedIds.includes(form.id) || form.isUsedInThisWorkflow;
        return { ...form, disabled: used || form.isEligible === false, hint: used ? "Bu akışta zaten var" : form.isEligible === false ? eligibilityReason(form.reason) : null };
      })
      .sort((a, b) => Number(a.disabled) - Number(b.disabled));
    return [{ id: NEW_FORM, title: "Yeni boş form", isNew: true }, ...list];
  }, [forms, search, excludeIds, usedIds]);

  const choose = (item) => {
    if (!item || item.disabled) return;
    onPick(item.isNew ? NEW_FORM : item);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(items.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(items[activeIndex]);
    }
  };

  return (
    <Floating anchor={anchor} onDismiss={onClose} placement={placement} offset={8}>
      <motion.div data-studio-menu role="menu" onPointerDown={(event) => event.stopPropagation()} {...POPOVER_MOTION}
        className="w-72 rounded-[10px] border border-white/20 bg-[#1e1e1e] p-1.5 shadow-2xl shadow-black/50"
      >
        {heading ? <p className="px-2 pb-1.5 pt-1 text-3xs text-neutral-500">{heading}</p> : null}
        <div className="relative mb-1">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input ref={inputRef} value={search} onChange={(event) => { setSearch(event.target.value); setActiveIndex(0); }} onKeyDown={handleKeyDown}
            placeholder="Form ara..." aria-label="Form ara"
            className="h-8 w-full rounded-md border border-white/10 bg-neutral-900/60 pl-8 pr-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-skylab-400/50"
          />
        </div>
        <div className="max-h-72 overflow-y-auto scrollbar">
          {items.map((item, index) => (
            <div key={item.id}>
              {index === 1 ? <div className="mx-1 my-1 h-px bg-white/10" /> : null}
              {index === 1 ? <p className="px-2 pb-1 pt-1 text-3xs text-neutral-500">Var olan formlar</p> : null}
              <button type="button" role="menuitem" disabled={item.disabled} onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(item)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-2xs transition-colors ${
                  item.disabled ? "cursor-not-allowed text-neutral-600" : index === activeIndex ? "bg-white/[0.06] text-white" : "text-neutral-300"
                }`}
              >
                {item.isNew ? <FilePlus size={13} className="shrink-0 text-neutral-500" /> : <FileText size={13} className="shrink-0 text-neutral-500" />}
                <span className="min-w-0 flex-1 truncate">{item.title || "Adsız form"}</span>
                {item.requiresManualReview && !item.disabled ? <ClipboardCheck size={11} className="shrink-0 text-amber-300" /> : null}
                {item.hint ? <span className="shrink-0 text-3xs text-neutral-600">{item.hint}</span> : null}
              </button>
            </div>
          ))}
          {isLoading ? <p className="px-2 py-2 text-2xs text-neutral-600">Formlar yükleniyor...</p> : null}
        </div>
      </motion.div>
    </Floating>
  );
}
