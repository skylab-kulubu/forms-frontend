"use client";

import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ChartColumn, ChevronDown, ChevronRight, FileText, PencilLine, Workflow } from "lucide-react";
import { Badge, CopyButton, DataListActions, IconButton, Skeleton } from "@skylab-kulubu/skylcn-ui";
import Avatar from "@/app/components/utils/Avatar";
import { effectiveFormSettings } from "@/lib/form-settings";
import { eventRefFromForm, publicFormUrl } from "@/lib/return-to";
import { COLUMN_LABEL, EventChip, FeatureIcons, IconTile, ROLE_MARK, SortHeader, StatusDot, formatUpdatedAt } from "../ListItem";
import ColumnMenu from "./ColumnMenu";
import RowPeek from "./RowPeek";
import { agoText, closingNote } from "./table-data";

// Container steps rather than DataList's viewport ones: the table answers to its own width, which the sidebar rail changes
const TABLE_GRID = "grid items-center gap-3 grid-cols-[var(--table-0)] @2xl:grid-cols-[var(--table-2)] @4xl:grid-cols-[var(--table-4)] @5xl:grid-cols-[var(--table-5)] @6xl:grid-cols-[var(--table-6)]";

function WeekBars({ values, peak }) {
  const today = values.length - 1;
  return (
    <span role="img" aria-label={`Son 7 gün: ${values.join(", ")}`} title={`Son 7 gün: ${values.join(", ")}`} className="flex h-5 items-end gap-0.5 @6xl:gap-1">
      {values.map((value, index) => (
        <span key={index} className={`w-1.5 rounded-[1px] @6xl:w-2 ${value ? (index === today ? "bg-skylab-400" : "bg-skylab-500/50") : "bg-border"}`}
          style={{ height: value ? `${Math.max(12, Math.sqrt(value / peak) * 100)}%` : 1 }}
        />
      ))}
    </span>
  );
}

function OwnerCell({ row }) {
  const mine = row.role >= 3;
  return (
    <span className="hidden min-w-0 items-center gap-2 @5xl:flex" title={row.owner?.email || row.ownerName}>
      <Avatar name={row.ownerName} email={row.owner?.email} photoUrl={row.owner?.profilePictureUrl} size="sm" />
      <span className={`min-w-0 truncate text-2xs ${mine ? "text-subtle-foreground" : "text-secondary-foreground"}`}>{mine ? "Sen" : row.ownerName}</span>
    </span>
  );
}

function RoleMark({ role }) {
  const { label, Icon, text, icon } = ROLE_MARK[role] ?? ROLE_MARK[1];
  return (
    <span title={`Bu formdaki yetkin: ${label}`} className={`hidden min-w-0 items-center gap-1.5 text-2xs @5xl:flex ${text}`}>
      <Icon size={12} strokeWidth={1.75} className={`shrink-0 ${icon}`} />
      <span className="hidden truncate @6xl:inline">{label}</span>
    </span>
  );
}

function DraftDot() {
  return <span title="Taslak: henüz yayınlanmadı" className="relative z-10 size-1.5 shrink-0 rounded-full border border-subtle-foreground bg-transparent" />;
}

function TitleCell({ row, ownerShown }) {
  const event = eventRefFromForm(row.form);
  const closing = closingNote(row);

  return (
    <div className="flex min-w-0 items-center gap-3">
      <IconTile icon={row.kind === "flow" ? Workflow : FileText} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <h3 className="truncate text-sm font-medium text-secondary-foreground transition-colors group-hover/row:text-foreground-strong">{row.title}</h3>
          {row.draft ? <Badge size="xs" className="hidden @2xl:inline-flex">Taslak</Badge> : null}
          {event?.href ? <EventChip event={event} /> : null}
        </div>
        <div className="mt-0.5 flex min-h-3.5 min-w-0 items-center gap-2">
          {row.flowName ? <span className="truncate text-3xs text-subtle-foreground">{row.flowName}</span> : null}
          <span className="shrink-0 whitespace-nowrap text-3xs tabular-nums text-subtle-foreground @2xl:hidden">{row.draft ? "Taslak" : `${row.responses} cevap${row.pending ? ` · ${row.pending} bekliyor` : ""}`}</span>
          {row.steps ? <span className="hidden shrink-0 text-3xs text-subtle-foreground @2xl:inline">{row.steps.length} adım</span> : null}
          {closing ? <span className="shrink-0 whitespace-nowrap text-3xs text-warning">{closing}</span> : null}
          {row.role < 3 ? <span className={`min-w-0 truncate text-3xs text-subtle-foreground ${ownerShown ? "@5xl:hidden" : ""}`}>{row.ownerName}</span> : null}
          <FeatureIcons form={row.form} className="hidden @2xl:flex" />
        </div>
      </div>
    </div>
  );
}

function RowActions({ row, open, onToggle }) {
  const canEdit = row.role >= 2;
  const sharable = !row.draft && effectiveFormSettings(row.form).isOpen && (!row.form.workflow || row.form.workflow.isStart);
  const opens = row.steps ? "Adımları ve özeti" : "Özeti";
  const toggleLabel = `${opens} ${open ? "kapat" : "aç"}`;

  return (
    <div className="flex items-center justify-end gap-0.5">
      {/* From @4xl the quick actions open out while the row is hovered or focused; touch screens always show them */}
      <div className="hidden @4xl:block">
        <DataListActions>
          {sharable ? <CopyButton value={publicFormUrl(row.form.id)} label="Linki kopyala" variant="ghost" size="icon-sm" /> : null}
          {row.responsesHref ? <IconButton icon={ChartColumn} label="Cevaplar" variant="ghost" size="icon-sm" render={<Link href={row.responsesHref} />} /> : null}
          {canEdit ? <IconButton icon={PencilLine} label="Düzenle" variant="primary" size="icon-sm" render={<Link href={row.editHref} />} /> : null}
        </DataListActions>
      </div>
      {row.draft ? <span className="hidden size-7 shrink-0 @2xl:block" /> : (
        <IconButton icon={ChevronDown} label={`${row.title}: ${toggleLabel}`} title={toggleLabel} variant="ghost" size="icon-sm" aria-expanded={open} onClick={onToggle}
          className={`relative z-10 [&_svg]:transition-transform [&_svg]:duration-200 ${open ? "text-secondary-foreground [&_svg]:rotate-180" : ""}`}
        />
      )}
      <IconButton icon={ChevronRight} label={`${row.title}: aç`} title="Aç" variant="ghost" size="icon-sm" render={<Link href={row.href} />}
        className="relative z-10 hidden @2xl:inline-flex [&_svg]:transition-transform group-hover/row:[&_svg]:translate-x-0.5"
      />
    </div>
  );
}

function Row({ row, peak, open, onToggle, shown }) {
  return (
    <div data-table-row={row.key} className={`group/row relative transition-colors ${open ? "bg-row-highlight" : "hover:bg-row-highlight"}`}>
      <Link href={row.href} className="absolute inset-0 z-0 outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" aria-label={row.title} />
      <div className={`${TABLE_GRID} px-3 py-2.5`}>
        <div className="flex justify-center">{row.draft ? <DraftDot /> : <StatusDot form={row.form} />}</div>
        <TitleCell row={row} ownerShown={shown.has("owner")} />
        {shown.has("owner") ? <OwnerCell row={row} /> : null}
        {shown.has("updated") ? <span className="hidden text-center text-2xs tabular-nums text-subtle-foreground @4xl:block">{formatUpdatedAt(row.updatedAt)}</span> : null}
        {shown.has("last") ? <span className="hidden text-center text-2xs tabular-nums text-subtle-foreground @4xl:block">{agoText(row.lastAt) ?? ""}</span> : null}
        {shown.has("role") ? <RoleMark role={row.role} /> : null}
        {shown.has("pending") ? <span className="hidden text-right text-sm font-medium tabular-nums text-warning @2xl:block">{row.pending || ""}</span> : null}
        {shown.has("responses") ? <span className={`hidden text-right text-sm font-medium tabular-nums @2xl:block ${row.responses ? "text-secondary-foreground" : "text-faint-foreground"}`}>{row.draft ? "" : row.responses}</span> : null}
        {shown.has("week") ? <div className="hidden pl-2 @4xl:block">{row.draft ? null : <WeekBars values={row.days} peak={peak} />}</div> : null}
        <RowActions row={row} open={open} onToggle={onToggle} />
      </div>
    </div>
  );
}

export function TableRow({ row, peak, open, onToggle, shown }) {
  return (
    <div>
      <Row row={row} peak={peak} open={open} onToggle={onToggle} shown={shown} />
      <AnimatePresence initial={false}>
        {open && !row.draft ? <RowPeek key="peek" row={row} /> : null}
      </AnimatePresence>
    </div>
  );
}

export function TableHead({ sortField, sortDirection, onSort, shown, hidden, onToggleColumn, onResetColumns }) {
  const props = { sortField, sortDirection, onSort };
  return (
    <div className={`${TABLE_GRID} sticky top-0 z-20 border-b border-border bg-background px-3 pb-2`}>
      <SortHeader field="status" title="Duruma göre sırala" {...props} />
      <span className={COLUMN_LABEL}>Form Adı</span>
      {shown.has("owner") ? <SortHeader label="Sahip" field="owner" align="left" visibility="hidden @5xl:flex" title="Sahibe göre sırala" {...props} /> : null}
      {shown.has("updated") ? <SortHeader label="Güncellendi" field="updatedAt" visibility="hidden @4xl:flex" title="Güncellenme tarihine göre sırala" {...props} /> : null}
      {shown.has("last") ? <SortHeader label="Son cevap" field="lastAt" visibility="hidden @4xl:flex" title="Son cevaba göre sırala" {...props} /> : null}
      {shown.has("role") ? (
        <>
          <span className="hidden @5xl:block @6xl:hidden" />
          <SortHeader label="Yetki" field="role" align="left" visibility="hidden @6xl:flex" title="Yetkiye göre sırala" {...props} />
        </>
      ) : null}
      {shown.has("pending") ? <SortHeader label="Bekleyen" field="pending" align="right" visibility="hidden @2xl:flex" title="Bekleyen cevaba göre sırala" {...props} /> : null}
      {shown.has("responses") ? <SortHeader label="Cevap" field="responses" align="right" visibility="hidden @2xl:flex" title="Cevap sayısına göre sırala" {...props} /> : null}
      {shown.has("week") ? <SortHeader label="7 gün" field="week" align="left" visibility="hidden pl-2 @4xl:flex" title="Son 7 günün cevabına göre sırala" {...props} /> : null}
      <div className="invisible flex justify-end @4xl:visible"><ColumnMenu hidden={hidden} onToggle={onToggleColumn} onReset={onResetColumns} /></div>
    </div>
  );
}

export function TableSkeleton({ count = 6 }) {
  return (
    <div aria-hidden="true" className="divide-y divide-border-subtle">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-3 px-3 py-2.5 pl-12">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <Skeleton className="h-3.5 w-52 max-w-full" />
        </div>
      ))}
    </div>
  );
}
