"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, LayoutTemplate, Search } from "lucide-react";
import { Floating } from "@/app/components/utils/Floating";
import { useGroupsQuery } from "@/lib/hooks/useGroupAdmin";
import { FIELD_TYPES, INSERT_CATEGORIES } from "./studio-schema";
import { STARTER_TEMPLATES } from "./studio-presets";
import { POPOVER_MOTION } from "./studio-motion";

const CATEGORY_ITEMS = INSERT_CATEGORIES.flatMap((category) => category.types.map((type) => ({
  kind: "type", type, group: category.label, label: FIELD_TYPES[type].label, Icon: FIELD_TYPES[type].Icon,
})));
const REPEATER_ITEM = { kind: "type", type: "repeater", group: "Hazır", label: FIELD_TYPES.repeater.label, Icon: FIELD_TYPES.repeater.Icon };
const TEMPLATES_ITEM = { kind: "templates", group: "Hazır", label: "Şablon ekle", Icon: LayoutTemplate };

function templateItem(group) {
  return {
    kind: "template",
    group: "Şablonlar",
    label: group.title || "Adsız şablon",
    Icon: LayoutTemplate,
    hint: `${Array.isArray(group.schema) ? group.schema.length : 0} bileşen`,
    template: group,
  };
}

function matchItems(items, search) {
  const query = search.trim().toLocaleLowerCase("tr-TR");
  return query ? items.filter((item) => item.label.toLocaleLowerCase("tr-TR").includes(query)) : items;
}

export function useStudioTemplates() {
  const { data, isLoading } = useGroupsQuery({ pageSize: 50 });
  const templates = useMemo(() => {
    const own = data?.data?.items ?? [];
    return own.length || isLoading ? own : STARTER_TEMPLATES;
  }, [data, isLoading]);
  return { templates, isLoading };
}

function itemsOf({ templates, view }) {
  if (view === "templates") return templates.map(templateItem);
  return [...CATEGORY_ITEMS, TEMPLATES_ITEM, REPEATER_ITEM];
}

export default function StudioInsertMenu({ anchor, initialView = "root", placement = "bottom", matchWidth = false, onPick, onHover, onClose }) {
  const [search, setSearch] = useState("");
  const [view, setView] = useState(initialView);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const { templates, isLoading } = useStudioTemplates();

  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [view]);

  const items = matchItems(itemsOf({ templates, view }), search);

  const activate = (index) => {
    setActiveIndex(index);
    onHover?.(items[index] ?? null);
  };

  const showView = (next) => {
    setView(next);
    setSearch("");
    setActiveIndex(0);
    onHover?.(null);
  };

  const choose = (item) => {
    if (!item || item.disabled) return;
    if (item.kind === "templates") showView("templates");
    else onPick(item);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      activate(Math.min(items.length - 1, activeIndex + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      activate(Math.max(0, activeIndex - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(items[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (view !== "root") showView("root");
      else onClose();
    } else if (event.key === "Backspace" && !search && view !== "root") {
      showView("root");
    }
  };

  return (
    <Floating anchor={anchor} onDismiss={onClose} placement={placement} matchWidth={matchWidth} offset={matchWidth ? 4 : 8}>
      <motion.div data-studio-menu role="menu" onPointerDown={(event) => event.stopPropagation()} {...POPOVER_MOTION}
        className={`${matchWidth ? "w-full" : "w-64"} rounded-[10px] border border-white/20 bg-[#1e1e1e] p-1.5 shadow-2xl shadow-black/50`}
      >
        <div className="relative mb-1">
          {view !== "root" ? (
            <button type="button" aria-label="Geri" onClick={() => showView("root")}
              className="absolute left-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-neutral-500 hover:text-neutral-200"
            >
              <ChevronLeft size={14} />
            </button>
          ) : (
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          )}
          <input ref={inputRef} value={search} onChange={(event) => { setSearch(event.target.value); setActiveIndex(0); onHover?.(null); }} onKeyDown={handleKeyDown}
            placeholder={view === "templates" ? "Şablon ara..." : "Bileşen ara..."} aria-label="Bileşen ara"
            className="h-8 w-full rounded-md border border-white/10 bg-neutral-900/60 pl-8 pr-2 text-xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-skylab-400/50"
          />
        </div>

        <div className="max-h-72 overflow-y-auto scrollbar">
          {items.length === 0 && (
            <p className="px-2 py-3 text-center text-2xs text-neutral-600">
              {view === "templates" ? (isLoading ? "Şablonlar yükleniyor..." : "Şablon bulunamadı.") : "Eşleşen bileşen yok."}
            </p>
          )}
          {items.map((item, index) => {
            const head = index === 0 || items[index - 1].group !== item.group ? <p className="px-2 pb-1 pt-2 text-3xs text-neutral-500">{item.group}</p> : null;
            return (
              <Fragment key={`${item.kind}-${item.type ?? item.template?.id ?? item.label}`}>
                {head}
                <button type="button" role="menuitem" disabled={item.disabled} onMouseEnter={() => activate(index)} onClick={() => choose(item)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-2xs transition-colors ${
                    item.disabled ? "cursor-not-allowed text-neutral-600" : index === activeIndex ? "bg-white/[0.06] text-white" : "text-neutral-300"
                  }`}
                >
                  <item.Icon size={14} className={item.disabled ? "text-neutral-700" : "text-neutral-500"} />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.hint ? <span className="text-3xs text-neutral-600">{item.hint}</span> : null}
                  {item.kind === "templates" ? <ChevronRight size={13} className="text-neutral-500" /> : null}
                </button>
              </Fragment>
            );
          })}
        </div>
      </motion.div>
    </Floating>
  );
}
