"use client";

import { Fragment, useEffect, useRef } from "react";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, LayoutTemplate, Share2 } from "lucide-react";
import { DataListActions, IconButton, Skeleton } from "@skylab-kulubu/skylcn-ui";
import { COLUMN_LABEL, IconTile, SortHeader, formatUpdatedAt } from "../ListItem";
import TemplatePeek from "./TemplatePeek";
import Highlight from "./Highlight";
import { previewOf } from "./template-data";

// Container steps rather than DataList's viewport ones; the last track holds skylcn's 28px icon buttons
const TABLE_GRID = "grid items-center gap-3 grid-cols-[minmax(0,1fr)_1.75rem] @2xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem_3.75rem] @4xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3.5rem_6.5rem_5.5rem] @6xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)_3.5rem_6.5rem_5.5rem]";

function TitleCell({ row, query, open }) {
  const updated = formatUpdatedAt(row.updatedAt);
  return (
    <div className="flex min-w-0 items-center gap-3">
      <IconTile icon={LayoutTemplate} />
      <div className="min-w-0">
        <h3 className="truncate text-sm font-medium text-secondary-foreground transition-colors group-hover/row:text-foreground-strong"><Highlight text={row.title} query={query} /></h3>
        <div className="mt-0.5 flex min-h-3.5 min-w-0 items-center gap-2 text-3xs text-subtle-foreground">
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
    <p className="hidden min-w-0 truncate text-2xs text-subtle-foreground @2xl:block">
      {items.length ? items.map((item, index) => (
        <Fragment key={item.id}>
          {index ? <span className="text-faint-foreground"> · </span> : null}
          {item.hit ? <span className="text-secondary-foreground"><Highlight text={item.label} query={query} /></span> : item.label}
        </Fragment>
      )) : <span className="text-faint-foreground">Henüz soru yok</span>}
    </p>
  );
}

function RowActions({ row, open, onToggle, onShare }) {
  const toggleLabel = `Soruları ${open ? "kapat" : "aç"}`;
  return (
    <div className="flex items-center justify-end gap-0.5">
      {/* From @4xl sharing opens out while the row is hovered or focused; touch screens always show it */}
      <div className="hidden @4xl:block">
        <DataListActions>
          <IconButton icon={Share2} label={`${row.title}: paylaş`} title="Paylaş" variant="ghost" size="icon-sm" onClick={onShare} />
        </DataListActions>
      </div>
      <IconButton icon={ChevronDown} label={`${row.title}: ${toggleLabel}`} title={toggleLabel} variant="ghost" size="icon-sm" aria-expanded={open} onClick={onToggle}
        className={`relative z-10 [&_svg]:transition-transform [&_svg]:duration-200 ${open ? "text-secondary-foreground [&_svg]:rotate-180" : ""}`}
      />
      <IconButton icon={ChevronRight} label={`${row.title}: aç`} title="Aç" variant="ghost" size="icon-sm" render={<Link href={row.href} />}
        className="relative z-10 hidden @2xl:inline-flex [&_svg]:transition-transform group-hover/row:[&_svg]:translate-x-0.5"
      />
    </div>
  );
}

function Row({ row, open, onToggle, onShare, query, matched, fresh }) {
  const ref = useRef(null);

  useEffect(() => {
    if (fresh) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [fresh]);

  return (
    <div ref={ref} data-table-row={row.key} className={`group/row relative transition-colors duration-700 ${fresh ? "bg-skylab-500/10" : open ? "bg-row-highlight" : "hover:bg-row-highlight"}`}>
      <Link href={row.href} className="absolute inset-0 z-0 outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" aria-label={row.title} />
      <div className={`${TABLE_GRID} px-3 py-2.5`}>
        <TitleCell row={row} query={query} open={open} />
        <QuestionsCell row={row} matched={matched} query={query} />
        <span className={`hidden text-right text-sm font-medium tabular-nums @2xl:block ${row.count ? "text-secondary-foreground" : "text-faint-foreground"}`}>{row.count}</span>
        <span className="hidden text-center text-2xs tabular-nums text-subtle-foreground @4xl:block">{formatUpdatedAt(row.updatedAt)}</span>
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
    <div className={`${TABLE_GRID} sticky top-0 z-20 border-b border-border bg-background px-3 pb-2`}>
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
    <div aria-hidden="true" className="divide-y divide-border-subtle">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-2.5">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <Skeleton className="h-3.5 w-52 max-w-full" />
        </div>
      ))}
    </div>
  );
}
