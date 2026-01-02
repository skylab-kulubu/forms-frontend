"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function Pagination({ current = 1, totalPages = 1, onPageChange, className = "" }) {
  const safeTotalPages = Math.max(1, Number(totalPages) || 1);
  const safeCurrent = Math.min(Math.max(1, Number(current) || 1), safeTotalPages);

  if (safeTotalPages <= 1) return null;

  const goTo = (page) => {
    if (!onPageChange) return;
    const next = Math.min(Math.max(page, 1), safeTotalPages);
    if (next !== safeCurrent) onPageChange(next);
  };

  const pageNumbers = (() => {
    const pages = [];
    if (safeTotalPages <= 5) {
      for (let i = 1; i <= safeTotalPages; i += 1) pages.push(i);
    } else if (safeCurrent <= 3) {
      pages.push(1, 2, 3, 4);
      pages.push("ellipsis1", safeTotalPages);
    } else if (safeCurrent >= safeTotalPages - 2) {
      pages.push(1, "ellipsis1");
      for (let i = safeTotalPages - 3; i <= safeTotalPages; i += 1) {
        if (i > 1) pages.push(i);
      }
    } else {
      pages.push(1, "ellipsis1", safeCurrent - 1, safeCurrent, safeCurrent + 1, "ellipsis2", safeTotalPages);
    }
    return pages;
  })();


  return (
    <div className="sticky bottom-0 z-20 bg-neutral-900">
      <motion.div layout="position" className={`flex flex-wrap items-center justify-center gap-1 pt-3 ${className}`}
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.35, ease: "easeOut" }}
      >
        <button type="button" onClick={() => goTo(safeCurrent - 1)} aria-label="Onceki sayfa"
          disabled={safeCurrent <= 1}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-all
          ${safeCurrent <= 1
            ? "cursor-not-allowed border-white/10 bg-white/5 text-neutral-500 opacity-60"
            : "border-white/8 bg-neutral-950/20 text-neutral-200 hover:border-indigo-400/40 hover:bg-indigo-500/10"}`}
        >
          <ArrowLeft size={16} />
        </button>

        <div className="flex items-center gap-1 rounded-xl border border-white/8 bg-neutral-950/20 px-1 py-1 shadow-sm">
          {pageNumbers.map((pageNum) => {
            if (typeof pageNum === "string") {
              return (
                <span key={pageNum} className="px-1 text-sm text-neutral-500">
                  ...
                </span>
              );
            }

            const isCurrentPage = pageNum === safeCurrent;
            return (
              <button type="button" key={pageNum} onClick={() => goTo(pageNum)} aria-label={`Sayfa ${pageNum}`}
                className={`h-8 w-8 rounded-lg text-sm font-semibold transition-all
                ${isCurrentPage ? "border border-indigo-400/40 bg-indigo-500/15 text-indigo-100" : "text-neutral-300 hover:bg-white/10 hover:text-neutral-100"}`}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        <button type="button" onClick={() => goTo(safeCurrent + 1)} aria-label="Sonraki sayfa"
          disabled={safeCurrent >= safeTotalPages}
          className={`flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-all
          ${safeCurrent >= safeTotalPages
            ? "cursor-not-allowed border-white/10 bg-white/5 text-neutral-500 opacity-60"
            : "border-white/8 bg-neutral-950/20 text-neutral-200 hover:border-indigo-400/40 hover:bg-indigo-500/10"}`}
        >
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
}
