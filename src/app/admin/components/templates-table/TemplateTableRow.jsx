"use client";

import { Fragment, useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, LayoutTemplate, Share2 } from "lucide-react";
import { COLUMN_LABEL, SortHeader, formatUpdatedAt } from "../ListItem";
import TemplatePeek from "./TemplatePeek";
import Highlight from "./Highlight";
import { previewOf } from "./template-data";

const TABLE_GRID = "grid items-center gap-3 grid-cols-[minmax(0,1fr)_1.75rem] @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem_3.75rem] @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem_6.5rem_5.25rem] @6xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)_3.5rem_6.5rem_5.25rem]";

const ROW_ICON = "relative z-10 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors";

function TitleCell({ row, query, open }) {
  const updated = formatUpdatedAt(row.updatedAt);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/3">
        <LayoutTemplate className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium text-neutral-200 transition-colors group-hover/row:text-neutral-50"><Highlight text={row.title} query={query} /></h3>
        <div className="mt-0.5 flex min-h-3.5 min-w-0 items-center gap-2 text-3xs text-neutral-500">
          <span className="shrink-0 whitespace-nowrap tabular-nums @2xl:hidden">{row.count} soru{updated ? ` · ${updated}` : ""}</span>
          {row.description && !open ? <span className="hidden min-w-0 truncate @2xl:inline"><Highlight text={row.description} query={query} /></span> : null}
          {updated ? <span className="hidden shrink-0 whitespace-nowrap tabular-nums @2xl:inline @4xl:hidden">{row.description && !open ? "· " : ""}{updated}</span> : null}
        </div>
      </div>
    </div>
  );
}

function QuestionsCell({ row, matched, query }) {
  const items = previewOf(row, matched);
  return (
    <p className="hidden min-w-0 truncate text-2xs text-neutral-500 @2xl:block">
      {items.length ? items.map((item, index) => (
        <Fragment key={item.id}>
          {index ? <span className="text-neutral-700"> · </span> : null}
          {item.hit ? <span className="text-neutral-300"><Highlight text={item.label} query={query} /></span> : item.label}
        </Fragment>
      )) : <span className="text-neutral-600">Henüz soru yok</span>}
    </p>
  );
}

function RowActions({ row, open, onToggle, onShare }) {
  const toggleLabel = `Soruları ${open ? "kapat" : "aç"}`;
  return (
    <div className="flex items-center justify-end gap-0.5">
      <div className="hidden items-center gap-1 overflow-hidden transition-all duration-200 ease-out @4xl:flex @4xl:max-w-0 @4xl:opacity-0 @4xl:group-hover/row:max-w-8 @4xl:group-hover/row:opacity-100">
        <button type="button" onClick={onShare} title="Paylaş" aria-label={`${row.title}: paylaş`} className={`${ROW_ICON} border-white/10 text-neutral-400 hover:bg-white/5 hover:text-neutral-200`}>
          <Share2 className="h-3 w-3" />
        </button>
      </div>
      <button type="button" onClick={onToggle} aria-expanded={open} aria-label={`${row.title}: ${toggleLabel}`} title={toggleLabel}
        className="relative z-10 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
      >
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180 text-neutral-300" : ""}`} />
      </button>
      <Link href={row.href} title="Aç" aria-label={`${row.title}: aç`} className="relative z-10 hidden h-7 w-7 shrink-0 items-center justify-center text-neutral-400 transition-colors hover:text-skylab-300 @2xl:inline-flex">
        <ChevronRight className="h-4.5 w-4.5 transition-transform group-hover/row:translate-x-0.5" />
      </Link>
    </div>
  );
}

function Row({ row, open, onToggle, onShare, query, matched, fresh }) {
  const ref = useRef(null);

  useEffect(() => {
    if (fresh) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [fresh]);

  return (
    <div ref={ref} data-table-row={row.key} className={`group/row relative transition-colors duration-700 ${fresh ? "bg-skylab-500/10" : open ? "bg-white/2.5" : "hover:bg-white/3"}`}>
      <Link href={row.href} className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-skylab-400/40" aria-label={row.title} />
      <div className={`${TABLE_GRID} px-3 py-2.5`}>
        <TitleCell row={row} query={query} open={open} />
        <QuestionsCell row={row} matched={matched} query={query} />
        <span className={`hidden text-right text-sm font-medium tabular-nums @2xl:block ${row.count ? "text-neutral-200" : "text-neutral-600"}`}>{row.count}</span>
        <span className="hidden text-center text-2xs tabular-nums text-neutral-500 @4xl:block">{formatUpdatedAt(row.updatedAt)}</span>
        <RowActions row={row} open={open} onToggle={onToggle} onShare={onShare} />
      </div>
    </div>
  );
}

export function TableRow({ row, open, onToggle, query, matched, fresh, onShare, onCopy, onDelete, copying }) {
  return (
    <div>
      <Row row={row} open={open} onToggle={onToggle} onShare={onShare} query={query} matched={matched} fresh={fresh} />
      <AnimatePresence initial={false}>
        {open ? <TemplatePeek key="peek" row={row} matched={matched} query={query} onShare={onShare} onCopy={onCopy} onDelete={onDelete} copying={copying} /> : null}
      </AnimatePresence>
    </div>
  );
}

export function TableHead({ sortField, sortDirection, onSort }) {
  const props = { sortField, sortDirection, onSort };
  return (
    <div className={`${TABLE_GRID} sticky top-0 z-20 border-b border-white/10 bg-neutral-900 px-3 pb-2`}>
      <SortHeader label="Şablon" field="title" align="left" title="Ada göre sırala" {...props} />
      <span className={`hidden ${COLUMN_LABEL} @2xl:block`}>Sorular</span>
      <SortHeader label="Soru" field="count" align="right" visibility="hidden @2xl:flex" title="Soru sayısına göre sırala" {...props} />
      <SortHeader label="Güncellendi" field="updatedAt" visibility="hidden @4xl:flex" title="Güncellenme tarihine göre sırala" {...props} />
      <span />
    </div>
  );
}

export function TableSkeleton({ count = 6 }) {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-2.5">
          <span className="shimmer h-9 w-9 shrink-0 rounded-lg" />
          <span className="shimmer h-3.5 w-52 max-w-full rounded-md" />
        </div>
      ))}
    </div>
  );
}
