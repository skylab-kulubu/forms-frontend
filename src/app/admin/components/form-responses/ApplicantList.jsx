"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Archive, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ActiveFilters, Collapse, FilterButton, FilterPills, IconButton, Popover, PopoverContent, PopoverTrigger, SearchInput, SegmentedControl, Skeleton, StatusDot,
} from "@skylab-kulubu/skylcn-ui";
import Avatar from "@/app/components/utils/Avatar";
import { STATUS_FILTERS } from "@/lib/attempt-status";
import { currentTime, leftText, shortDuration } from "@/lib/form-timing";
import { FILTER_DEFAULTS, isAttemptRow, matchesSearch, personOf, rowKind, searchKey, shortWhen, statusFilterOf, statusView } from "./response-data";

const WHO_LABEL = { registered: "Kayıtlı", anonymous: "Anonim" };
const TIME_LABEL = { extended: "Uzatılanlar", soon: "Bitmek üzere" };

function Segment({ label, options, value, onChange }) {
  return (
    <div className="space-y-2">
      <p className="text-2xs font-medium text-neutral-500">{label}</p>
      <SegmentedControl aria-label={label} options={options.map(([key, text]) => ({ value: key, label: text }))} value={value} onValueChange={onChange} className="w-full" />
    </div>
  );
}

// The panel's groups, handed to the popover or the phone's in-page panel as direct children, so they step in one by one
function FilterGroups({ filters, setFilters, counts, timed }) {
  const statusOptions = STATUS_FILTERS.filter((item) => (item.timed ? timed : true) && (!item.whenPresent || (item.count(counts) ?? 0) > 0 || filters.status === item.value));

  return (
    <>
      <Segment label="Sıralama" options={[["desc", "Yeni önce"], ["asc", "Eski önce"]]} value={filters.sort} onChange={(value) => setFilters({ ...filters, sort: value })} />
      <div className="space-y-2">
        <p className="text-2xs font-medium text-neutral-500">Durum</p>
        <div className="grid grid-cols-2 gap-1.5">
          {statusOptions.map((item) => (
            <button key={item.value} type="button" onClick={() => setFilters({ ...filters, status: item.value })} aria-pressed={filters.status === item.value}
              className={`flex h-7 items-center gap-1.5 rounded-md border px-2 text-2xs transition-colors ${
                filters.status === item.value ? "border-border-strong bg-accent-strong text-foreground" : "border-border bg-muted text-secondary-foreground hover:text-foreground"
              }`}
            >
              {item.dot ? <span className={`size-1.5 shrink-0 rounded-full ${item.dot}`} /> : null}
              <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
              <span className="tabular-nums text-subtle-foreground">{item.count(counts) ?? ""}</span>
            </button>
          ))}
        </div>
      </div>
      <Segment label="Yanıtlayan" options={[["all", "Hepsi"], ["registered", "Kayıtlı"], ["anonymous", "Anonim"]]} value={filters.who} onChange={(value) => setFilters({ ...filters, who: value })} />
      {timed ? (
        <Segment label="Süre" options={[["all", "Hepsi"], ["extended", "Uzatılanlar"], ["soon", "Bitmek üzere"]]} value={filters.time} onChange={(value) => setFilters({ ...filters, time: value })} />
      ) : null}
      <Segment label="Arşiv" options={[["out", "Hariç"], ["in", "Dahil"]]} value={filters.archived ? "in" : "out"} onChange={(value) => setFilters({ ...filters, archived: value === "in" })} />
    </>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-2">
      <Skeleton className="size-1.5 rounded-full" />
      <Skeleton className="size-7 rounded-lg" />
      <span className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3 w-28 rounded" />
        <Skeleton className="h-2.5 w-16 rounded" />
      </span>
    </div>
  );
}

export default function ApplicantList({
  rows, counts, timed, filters, setFilters, search, setSearch, isSelected, onSelect, pagination, onPage, loading = false, error = false, touch = false, answerLabel = null,
}) {
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);
  const toolbarRef = useRef(null);
  const selectedIndex = rows.findIndex((row) => isSelected(row));

  useLayoutEffect(() => {
    const list = listRef.current;
    const row = list?.querySelector('[data-selected="true"]');
    if (!row) return;
    const box = list.getBoundingClientRect();
    const { top, bottom } = row.getBoundingClientRect();
    if (top < box.top) list.scrollTop -= box.top - top;
    else if (bottom > box.bottom) list.scrollTop += bottom - box.bottom;
  }, [selectedIndex]);

  const active = [filters.sort !== "desc", filters.status !== "all" && filters.status !== "pending", filters.who !== "all", filters.time !== "all", filters.archived, Boolean(filters.answer)].filter(Boolean).length;
  const chips = [
    filters.answer && ["answer", answerLabel ?? "Cevap süzgeci", () => setFilters({ ...filters, answer: null })],
    filters.sort === "asc" && ["sort", "Eski önce", () => setFilters({ ...filters, sort: "desc" })],
    filters.status !== "all" && filters.status !== "pending" && ["status", statusFilterOf(filters.status).label, () => setFilters({ ...filters, status: "all" })],
    filters.who !== "all" && ["who", WHO_LABEL[filters.who], () => setFilters({ ...filters, who: "all" })],
    filters.time !== "all" && ["time", TIME_LABEL[filters.time], () => setFilters({ ...filters, time: "all" })],
    filters.archived && ["archived", "Arşiv dahil", () => setFilters({ ...filters, archived: false })],
  ].filter(Boolean);
  const query = searchKey(search);
  const visible = query ? rows.filter((row) => matchesSearch(row, query)) : rows;
  const filtered = Object.keys(FILTER_DEFAULTS).some((key) => filters[key] !== FILTER_DEFAULTS[key]);
  const page = pagination?.page ?? 1;
  const pageSize = pagination?.pageSize ?? rows.length;
  const total = pagination?.totalCount ?? rows.length;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);
  const from = rows.length ? (page - 1) * pageSize + 1 : 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={toolbarRef} className="relative shrink-0 space-y-2 px-3 pb-2 pt-3">
        <SearchInput size="sm" value={search} onValueChange={setSearch} placeholder="Bu sayfada ara" aria-label="Bu sayfadaki başvuranlarda ara" className="max-w-none" />
        <div className="flex items-center gap-1">
          <FilterPills aria-label="Durum" value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })} className="min-w-0"
            options={[
              { value: "all", label: "Hepsi", count: counts ? STATUS_FILTERS[0].count(counts) : undefined },
              { value: "pending", label: <><StatusDot tone="warning" glow={false} />Beklemede</>, count: counts?.pending },
            ]}
          />
          {touch ? (
            <FilterButton iconOnly count={active} size="icon" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="ml-auto" />
          ) : (
            // Hung from the whole toolbar, as wide as it, as the panel has always opened
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger render={<FilterButton iconOnly count={active} size="icon-sm" className="ml-auto" />} />
              <PopoverContent stagger anchor={toolbarRef} align="start" alignOffset={8} sideOffset={-2} aria-label="Cevap filtreleri"
                className="flex w-[calc(var(--anchor-width)-1rem)] flex-col gap-4 p-4"
              >
                <FilterGroups filters={filters} setFilters={setFilters} counts={counts} timed={timed} />
              </PopoverContent>
            </Popover>
          )}
        </div>
        <ActiveFilters filters={chips.map(([key, label, onRemove]) => ({ key, label, onRemove }))} />
        {touch ? (
          <Collapse open={open}>
            <div role="group" aria-label="Cevap filtreleri" className="mt-1 flex stagger-items flex-col gap-4 rounded-xl border border-border-strong bg-popover/95 p-4 text-foreground">
              <FilterGroups filters={filters} setFilters={setFilters} counts={counts} timed={timed} />
            </div>
          </Collapse>
        ) : null}
      </div>

      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2 scrollbar">
        {loading ? Array.from({ length: 8 }, (_, index) => <RowSkeleton key={index} />)
          : error ? <p className="px-3 py-8 text-center text-2xs text-neutral-500">Cevaplar yüklenemedi.</p>
            : visible.length === 0 ? (
              <p className="px-3 py-8 text-center text-2xs text-neutral-500">
                {query ? "Bu sayfada aranan kişi yok." : filtered ? "Verilen filtrelere uygun cevap bulunamadı." : "Bu forma henüz cevap gelmedi."}
              </p>
            ) : visible.map((row) => {
              const kind = rowKind(row);
              const status = statusView(kind);
              const person = personOf(row);
              const selected = isSelected(row);
              const attempt = row.attempt;
              const deadline = attempt?.deadlineAt ? new Date(attempt.deadlineAt).getTime() : null;
              const when = row.submittedAt ?? (isAttemptRow(row) ? attempt.openedAt : null);
              return (
                <button key={isAttemptRow(row) ? `a-${attempt.id}` : row.id} type="button" data-selected={selected} onClick={() => onSelect(row)}
                  className={`group flex w-full items-center gap-2.5 rounded-md px-2 text-left transition-colors ${touch ? "py-2.5" : "py-1.5"} ${selected ? "bg-skylab-500/10" : "hover:bg-ink/4"}`}
                >
                  <span className={`size-1.5 shrink-0 rounded-full ${status.dot}`} title={status.label} />
                  <Avatar name={person.known ? person.name : ""} photoUrl={person.photoUrl} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-xs ${selected ? "text-neutral-50" : "text-neutral-200 group-hover:text-neutral-50"}`}>{person.name}</span>
                    <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-3xs">
                      {row.isArchived ? <Archive size={10} className="shrink-0 text-skylab-500/70" /> : null}
                      <span className={`shrink-0 ${status.text}`}>{status.label}</span>
                      {Number(row.workflow?.round) > 1 ? <span className="shrink-0 text-neutral-500">· {row.workflow.round}. gönderim</span> : null}
                      {kind === "running" && deadline ? <span className="truncate text-neutral-500">· {leftText(deadline - currentTime())}</span> : null}
                      {attempt?.extendedMinutes > 0 ? (
                        <span title="Ek süre verildi" className="rounded border border-skylab-400/30 px-1 text-skylab-300/80">+{shortDuration(attempt.extendedMinutes * 60_000)}</span>
                      ) : null}
                    </span>
                  </span>
                  <span className="shrink-0 self-start pt-0.5 text-3xs tabular-nums text-neutral-500">{shortWhen(when)}</span>
                </button>
              );
            })}
      </div>

      <div className="flex shrink-0 items-center justify-between border-t border-neutral-800 px-3 py-2 text-3xs text-neutral-600">
        <span className="tabular-nums">{rows.length ? `${from}-${from + rows.length - 1} / ${total}` : `0 / ${total}`}</span>
        <span className="flex items-center gap-0.5">
          <IconButton icon={ChevronLeft} label="Önceki sayfa" variant="ghost" size="icon-sm" onClick={() => onPage(page - 1)} disabled={page <= 1} />
          <span className="px-1 tabular-nums text-neutral-400">{page} / {totalPages}</span>
          <IconButton icon={ChevronRight} label="Sonraki sayfa" variant="ghost" size="icon-sm" onClick={() => onPage(page + 1)} disabled={page >= totalPages} />
        </span>
      </div>
    </div>
  );
}
