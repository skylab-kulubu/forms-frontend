"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

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

const listVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

export default function SearchPicker({ items = [], itemsPerPage = 6, activeItemId = null, getItemId = (item) => item?.id, resetOnItemsChange = true,
  onSelect, renderItem, searchValue = "", onSearchChange, autoFocus = false, footerText = "", showClear = false, onClear, className = ""
}) {
  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!resetOnItemsChange) return;
    setPage(1);
  }, [items, resetOnItemsChange]);

  useEffect(() => {
    setPage((prev) => Math.min(Math.max(prev, 1), totalPages));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, page, itemsPerPage]);

  return (
    <motion.div className={`absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-neutral-900/80 p-3 text-neutral-100 shadow-xl backdrop-blur supports-backdrop-filter:bg-neutral-900/60 ${className}`}
      variants={panelVariants} initial="hidden" animate="visible" exit="exit" layout transition={{ layout: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } }}
    >
      <motion.div variants={contentVariants} layout>
        <motion.div variants={itemVariants} className="relative" layout="position">
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500">
            <Search size={14} />
          </span>
          <input autoFocus={autoFocus} type="text" value={searchValue} onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder={"Ara..."} readOnly={!onSearchChange}
            className="w-full rounded-md border border-white/10 bg-white/5 pl-7 pr-2 py-1.5 text-sm text-neutral-100 outline-none placeholder-neutral-500 focus:border-white/20"
          />
        </motion.div>

        <motion.div variants={itemVariants} animate={{ height: "auto" }} transition={{ duration: 0.2, ease: "easeInOut" }}
          className="mt-2 max-h-56 overflow-auto rounded-lg border border-white/10 bg-white/5" style={{ originY: 0 }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {items.length === 0 ? (
              <motion.div key="empty-state" variants={itemVariants} initial="hidden" animate="visible" exit="exit" className="px-3 py-2 text-[12px] text-neutral-400"
              >
                Eşleşme bulunamadı
              </motion.div>
            ) : (
              <motion.div key={page} variants={listVariants} initial="hidden" animate="visible" exit="exit">
                {pageItems.map((item, index) => {
                  const itemId = getItemId?.(item);
                  const active = itemId != null && activeItemId != null && itemId === activeItemId;
                  const onItemSelect = () => onSelect?.(item);
                  return (
                    <motion.div key={itemId ?? index} variants={itemVariants} layout="position">
                      {renderItem ? renderItem(item, { active, index, onSelect: onItemSelect, itemId }) : null}
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {totalPages > 1 ? (
          <motion.div  variants={itemVariants} initial="hidden" animate="visible" layout="position"
            className="mt-2 flex items-center justify-between gap-2 px-2 py-1 text-[11px] text-neutral-400" 
          >
            <button type="button" aria-label="Previous page" title="Previous" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}
              className={`flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-neutral-900/40 text-neutral-200 transition-colors ${(page <= 1) ? "cursor-not-allowed opacity-50" : "hover:border-white/20 hover:bg-white/10 hover:text-neutral-100"}`}
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">
              {page} / {totalPages}
            </span>
            <button type="button" aria-label="Next page" title="Next" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages}
              className={`flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-neutral-900/40 text-neutral-200 transition-colors ${(page >= totalPages) ? "cursor-not-allowed opacity-50" : "hover:border-white/20 hover:bg-white/10 hover:text-neutral-100"}`}
            >
              <ChevronRight size={14} />
            </button>
          </motion.div>
        ) : null}

        {(Boolean(footerText) || showClear) ? (
          <motion.div  variants={itemVariants} initial="hidden" animate="visible" layout="position" className="mt-2 flex items-center justify-between">
            {footerText ? (<span className="text-[11px] text-neutral-500">{footerText}</span>) : (null)}
            {showClear && onClear ? (
              <button type="button" onClick={onClear} className="text-[11px] text-neutral-400 transition-colors hover:text-neutral-200">
                Temizle
              </button>
            ) : null}
          </motion.div>
        ) : null}
      </motion.div>
    </motion.div>
  );
}