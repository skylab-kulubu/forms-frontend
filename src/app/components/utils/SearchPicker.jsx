"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";

const LIST_MAX_HEIGHT = 224;

const panelVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1], when: "beforeChildren" } },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.18, ease: [0.4, 0, 0.2, 1], when: "afterChildren" } },
};

const contentVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.02 } },
  exit: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -4, transition: { duration: 0.12, ease: [0.4, 0, 0.2, 1] } },
};

export default function SearchPicker({ items = [], itemsPerPage = 6, activeItemId = null, getItemId = (item) => item?.id, resetOnItemsChange = true,
  onSelect, renderItem, searchValue = "", onSearchChange, searchable = "auto", createLabel = "", loading = false, autoFocus = false,
  footerText = "", showClear = false, onClear, className = ""
}) {
  const lastFilledRef = useRef(items);
  if (items.length > 0) lastFilledRef.current = items;
  const listItems = loading && items.length === 0 ? lastFilledRef.current : items;

  const totalPages = Math.max(1, Math.ceil(listItems.length / itemsPerPage));

  const [page, setPage] = useState(1);
  const [tracked, setTracked] = useState({ search: searchValue, count: listItems.length });

  if (tracked.search !== searchValue || (resetOnItemsChange && tracked.count !== listItems.length)) {
    setTracked({ search: searchValue, count: listItems.length });
    setPage(1);
  }

  const safePage = Math.min(Math.max(page, 1), totalPages);

  const baselineCountRef = useRef(items.length);
  if (!searchValue) baselineCountRef.current = items.length;

  const canSearch = Boolean(onSearchChange);
  const needsSearch = baselineCountRef.current > itemsPerPage;
  const createMode = Boolean(createLabel) && !needsSearch;
  const showSearch = canSearch && (
    searchable === "auto"
      ? needsSearch || createMode || Boolean(searchValue)
      : Boolean(searchable)
  );

  const listRef = useRef(null);
  const listContentRef = useRef(null);

  useLayoutEffect(() => {
    const box = listRef.current;
    const content = listContentRef.current;
    if (!box || !content) return;

    const apply = () => {
      const border = box.offsetHeight - box.clientHeight;
      box.style.height = `${Math.min(content.offsetHeight + border, LIST_MAX_HEIGHT)}px`;
    };

    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(content);
    return () => observer.disconnect();
  }, []);

  const pageItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return listItems.slice(start, start + itemsPerPage);
  }, [listItems, safePage, itemsPerPage]);

  return (
    <motion.div className={`absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-neutral-900/80 p-3 text-neutral-100 shadow-xl backdrop-blur supports-backdrop-filter:bg-neutral-900/60 ${className}`}
      variants={panelVariants} initial="hidden" animate="visible" exit="exit"
    >
      <motion.div variants={contentVariants}>
        {showSearch ? (
          <motion.div variants={itemVariants} className="relative">
            <span className={`pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 ${createMode ? "text-skylab-300/70" : "text-neutral-500"}`}>
              {createMode ? <Plus size={14} /> : <Search size={14} />}
            </span>
            <input autoFocus={autoFocus} type="text" value={searchValue} onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder={createMode ? createLabel : "Ara..."} readOnly={!onSearchChange}
              className="w-full rounded-md border border-white/10 bg-white/5 pl-7 pr-2 py-1.5 text-sm text-neutral-100 outline-none placeholder-neutral-500 focus:border-skylab-400/50"
            />
          </motion.div>
        ) : null}

        <motion.div variants={itemVariants} ref={listRef}
          className={`${showSearch ? "mt-2 " : ""}scrollbar overflow-y-auto rounded-lg border border-white/10 bg-white/5 transition-[height] duration-200 ease-out`}
        >
          <div ref={listContentRef} className={`transition-opacity duration-150 ${loading ? "opacity-60" : "opacity-100"}`}>
            {pageItems.length === 0 ? (
              <div className="px-3 py-2 text-xs text-neutral-400">
                {loading ? "Aranıyor..." : "Eşleşme bulunamadı"}
              </div>
            ) : (
              pageItems.map((item, index) => {
                const itemId = getItemId?.(item);
                const active = itemId != null && activeItemId != null && itemId === activeItemId;
                const onItemSelect = () => onSelect?.(item);
                return (
                  <div key={itemId ?? index}>
                    {renderItem ? renderItem(item, { active, index, onSelect: onItemSelect, itemId }) : null}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {totalPages > 1 ? (
          <motion.div variants={itemVariants} initial="hidden" animate="visible"
            className="mt-2 flex items-center justify-between gap-2 px-2 py-1 text-2xs text-neutral-400"
          >
            <button type="button" aria-label="Previous page" title="Previous" onClick={() => setPage(Math.max(1, safePage - 1))} disabled={safePage <= 1}
              className={`flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-neutral-900/40 text-neutral-200 transition-colors ${(safePage <= 1) ? "cursor-not-allowed opacity-50" : "hover:border-white/20 hover:bg-white/10 hover:text-neutral-100"}`}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-3xs uppercase tracking-[0.2em] text-neutral-500">
              {safePage} / {totalPages}
            </span>
            <button type="button" aria-label="Next page" title="Next" onClick={() => setPage(Math.min(totalPages, safePage + 1))} disabled={safePage >= totalPages}
              className={`flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-neutral-900/40 text-neutral-200 transition-colors ${(safePage >= totalPages) ? "cursor-not-allowed opacity-50" : "hover:border-white/20 hover:bg-white/10 hover:text-neutral-100"}`}
            >
              <ChevronRight size={14} />
            </button>
          </motion.div>
        ) : null}

        {(Boolean(footerText) || showClear) ? (
          <motion.div variants={itemVariants} initial="hidden" animate="visible" className="mt-2 flex items-center justify-between">
            {footerText ? (<span className="text-2xs text-neutral-500">{footerText}</span>) : (null)}
            {showClear && onClear ? (
              <button type="button" onClick={onClear} className="text-2xs text-neutral-400 transition-colors hover:text-neutral-200">
                Temizle
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}
