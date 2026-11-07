"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { LayoutTemplate, Plus, Search } from "lucide-react";
import { Floating } from "@/app/components/utils/Floating";
import { useGroupsQuery } from "@/lib/hooks/useGroupAdmin";
import { POPOVER_MOTION } from "../form-studio/studio-motion";

function paletteAnchor() {
  const row = document.querySelector("[data-studio-root] [data-palette-anchor]")?.parentElement;
  if (row && row.getClientRects().length > 0) return row;
  const rect = document.querySelector("[data-studio-root]")?.getBoundingClientRect();
  return { top: (rect?.top ?? 56) + 10, left: rect ? rect.left + rect.width / 2 : window.innerWidth / 2, width: 0, height: 0 };
}

export default function TemplatePalette({ currentId, name, onNavigate, onClose }) {
  const [anchor] = useState(paletteAnchor);
  const docked = anchor?.nodeType === 1;
  const inputRef = useRef(null);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const { data } = useGroupsQuery({ pageSize: 50 });

  const items = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    const matches = (text) => !query || (text ?? "").toLocaleLowerCase("tr-TR").includes(query);
    const groups = data?.data?.items ?? [];
    const rows = groups.map((group) => ({
      key: group.id,
      href: `/admin/templates/${group.id}`,
      label: group.id === currentId ? name : group.title || "Adsız şablon",
      meta: group.id === currentId ? "açık" : `${Array.isArray(group.schema) ? group.schema.length : 0} bileşen`,
      Icon: LayoutTemplate,
      group: "Şablonların",
    }));
    return [...rows, { key: "new", href: "/admin/templates/new-template", label: "Yeni şablon", meta: "", Icon: Plus, group: "Oluştur" }].filter((item) => matches(item.label));
  }, [data, search, currentId, name]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  const choose = (item) => {
    if (item) onNavigate(item.href);
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
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <Floating anchor={anchor} onDismiss={onClose} placement={docked ? "bottom-start" : "bottom"} matchWidth={docked} offset={docked ? 4 : 6}>
      <motion.div role="dialog" aria-label="Şablon aç" {...POPOVER_MOTION}
        className={`${docked ? "w-full" : "w-[min(24rem,calc(100vw-1rem))]"} rounded-[10px] border border-white/20 bg-[#1e1e1e] p-1.5 shadow-2xl shadow-black/50`}
      >
        <div className="relative mb-1">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input ref={inputRef} value={search} onChange={(event) => { setSearch(event.target.value); setActiveIndex(0); }} onKeyDown={handleKeyDown}
            placeholder="Şablon ara..." aria-label="Şablon ara"
            className="h-8 w-full rounded-md border border-white/10 bg-neutral-900/60 pl-8 pr-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-skylab-400/50"
          />
        </div>
        <div className="max-h-72 overflow-y-auto scrollbar">
          {items.length === 0 ? <p className="px-2 py-3 text-center text-2xs text-neutral-600">Eşleşen şablon yok.</p> : null}
          {items.map((item, index) => (
            <Fragment key={item.key}>
              {index === 0 || items[index - 1].group !== item.group ? <p className="px-2 pb-1 pt-2 text-3xs text-neutral-500">{item.group}</p> : null}
              <button type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(item)}
                className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-2xs transition-colors ${index === activeIndex ? "bg-white/6 text-white" : "text-neutral-300"}`}
              >
                <item.Icon size={14} className="shrink-0 text-neutral-500" />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.meta ? <span className="max-w-24 shrink-0 truncate text-3xs text-neutral-600">{item.meta}</span> : null}
              </button>
            </Fragment>
          ))}
        </div>
        <p className="mt-1 border-t border-white/5 px-2 pt-1.5 text-3xs text-neutral-600 pointer-coarse:hidden">↑↓ seç · Enter aç · Esc kapat</p>
      </motion.div>
    </Floating>
  );
}
