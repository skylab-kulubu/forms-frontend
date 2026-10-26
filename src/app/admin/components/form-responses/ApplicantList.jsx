"use client";

import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Archive, ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";
import { STATUS_FILTERS } from "@/lib/attempt-status";
import { currentTime, leftText, shortDuration } from "@/lib/form-timing";
import { FILTER_DEFAULTS, isAttemptRow, matchesSearch, personOf, rowKind, searchKey, shortWhen, statusFilterOf, statusView } from "./response-data";

const WHO_LABEL = { registered: "Kayıtlı", anonymous: "Anonim" };
const TIME_LABEL = { extended: "Uzatılanlar", soon: "Bitmek üzere" };

function Segment({ options, value, onChange }) {
  return (
    <div className="grid w-full rounded-lg border border-white/10 bg-neutral-900/60 p-1 text-2xs" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map(([key, label]) => (
        <button key={key} type="button" onClick={() => onChange(key)} aria-pressed={value === key}
          className={`flex h-7 items-center justify-center rounded-md px-2 font-medium transition-colors ${value === key ? "border border-skylab-400/40 bg-skylab-500/15 text-skylab-300" : "text-neutral-300 hover:text-skylab-300"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function FilterPopover({ filters, setFilters, counts, timed, inline, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const down = (event) => {
      if (!ref.current?.contains(event.target) && !event.target.closest?.("[data-filter-anchor]")) onClose();
    };
    const key = (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key, true);
    };
  }, [onClose]);

  const statusOptions = STATUS_FILTERS.filter((item) => (item.timed ? timed : true) && (!item.whenPresent || (item.count(counts) ?? 0) > 0 || filters.status === item.value));

  return (
    <div ref={ref} role="dialog" aria-label="Cevap filtreleri"
      className={`rounded-xl border border-white/15 bg-neutral-950/95 text-neutral-100 ${inline ? "mt-1" : "absolute left-2 right-2 top-full z-40 mt-1.5 shadow-2xl backdrop-blur"}`}
    >
      <div className="flex flex-col gap-4 p-4">
        <div className="space-y-2">
          <p className="text-2xs font-medium text-neutral-500">Sıralama</p>
          <Segment options={[["desc", "Yeni önce"], ["asc", "Eski önce"]]} value={filters.sort} onChange={(value) => setFilters({ ...filters, sort: value })} />
        </div>
        <div className="space-y-2">
          <p className="text-2xs font-medium text-neutral-500">Durum</p>
          <div className="grid grid-cols-2 gap-1.5">
            {statusOptions.map((item) => (
              <button key={item.value} type="button" onClick={() => setFilters({ ...filters, status: item.value })} aria-pressed={filters.status === item.value}
                className={`flex h-7 items-center gap-1.5 rounded-md border px-2 text-2xs font-medium transition-colors ${
                  filters.status === item.value ? "border-skylab-400/40 bg-skylab-500/15 text-skylab-300" : "border-white/10 bg-neutral-900/60 text-neutral-300 hover:text-skylab-300"
                }`}
              >
                {item.dot ? <span className={`size-1.5 shrink-0 rounded-full ${item.dot}`} /> : null}
                <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>
                <span className="tabular-nums text-neutral-500">{item.count(counts) ?? ""}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-2xs font-medium text-neutral-500">Yanıtlayan</p>
          <Segment options={[["all", "Hepsi"], ["registered", "Kayıtlı"], ["anonymous", "Anonim"]]} value={filters.who} onChange={(value) => setFilters({ ...filters, who: value })} />
        </div>
        {timed ? (
          <div className="space-y-2">
            <p className="text-2xs font-medium text-neutral-500">Süre</p>
            <Segment options={[["all", "Hepsi"], ["extended", "Uzatılanlar"], ["soon", "Bitmek üzere"]]} value={filters.time} onChange={(value) => setFilters({ ...filters, time: value })} />
          </div>
        ) : null}
        <div className="space-y-2">
          <p className="text-2xs font-medium text-neutral-500">Arşiv</p>
          <Segment options={[["out", "Hariç"], ["in", "Dahil"]]} value={filters.archived ? "in" : "out"} onChange={(value) => setFilters({ ...filters, archived: value === "in" })} />
        </div>
      </div>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-2.5 px-2 py-2">
      <span className="shimmer size-1.5 rounded-full" />
      <span className="shimmer size-7 rounded-lg" />
      <span className="min-w-0 flex-1 space-y-1.5">
        <span className="shimmer block h-3 w-28 rounded" />
        <span className="shimmer block h-2.5 w-16 rounded" />
      </span>
    </div>
  );
}

export default function ApplicantList({
  rows, counts, timed, filters, setFilters, search, setSearch, isSelected, onSelect, pagination, onPage, loading = false, error = false, touch = false,
}) {
  const [open, setOpen] = useState(false);
  const listRef = useRef(null);
  const selectedIndex = rows.findIndex((row) => isSelected(row));

  useLayoutEffect(() => {
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const active = [filters.sort !== "desc", filters.status !== "all" && filters.status !== "pending", filters.who !== "all", filters.time !== "all", filters.archived].filter(Boolean).length;
  const chips = [
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
      <div className="relative shrink-0 space-y-2 px-3 pb-2 pt-3">
        <div className="relative">
          <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Bu sayfada ara" aria-label="Bu sayfadaki başvuranlarda ara"
            className={`w-full rounded-lg border border-white/10 bg-neutral-900/60 pl-8 pr-3 text-xs text-neutral-200 outline-none transition-[border-color,box-shadow] placeholder:text-neutral-600 focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20 ${touch ? "h-10" : "h-8"}`}
          />
        </div>
        <div className="flex items-center gap-1">
          <div className="flex min-w-0 flex-1 items-center text-2xs">
            {[["all", "Hepsi"], ["pending", "Beklemede"]].map(([value, label], index) => (
              <Fragment key={value}>
                {index ? <span className="mx-2 h-3 w-px shrink-0 bg-neutral-800" /> : null}
                <button type="button" onClick={() => setFilters({ ...filters, status: value })} aria-pressed={filters.status === value}
                  className={`flex items-center gap-1.5 rounded transition-colors ${touch ? "min-h-10" : ""} ${filters.status === value ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-300"}`}
                >
                  {value === "pending" ? <span className="size-1.5 rounded-full bg-amber-400" /> : null}
                  {label}
                  <span className="tabular-nums text-neutral-500">{counts ? (value === "all" ? STATUS_FILTERS[0].count(counts) : counts.pending) : ""}</span>
                </button>
              </Fragment>
            ))}
          </div>
          <button type="button" data-filter-anchor onClick={() => setOpen((value) => !value)} title={active ? `Filtreler (${active})` : "Filtreler"} aria-label="Filtreler" aria-expanded={open}
            className={`relative grid place-items-center rounded-lg border transition-colors ${touch ? "size-10" : "size-7"} ${
              open || active ? "border-skylab-400/40 bg-skylab-500/15 text-skylab-300" : "border-white/10 bg-white/5 text-neutral-400 hover:text-neutral-100"
            }`}
          >
            <SlidersHorizontal size={13} />
            {active ? <span className="absolute -right-1 -top-1 grid size-3.5 place-items-center rounded-full bg-skylab-400 text-4xs font-semibold text-neutral-900">{active}</span> : null}
          </button>
        </div>
        {chips.length ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {chips.map(([key, label, clear]) => (
              <span key={key} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 py-0.5 pl-2 pr-1 text-2xs text-neutral-300">
                {label}
                <button type="button" onClick={clear} aria-label={`${label} filtresini kaldır`} className="grid size-4 place-items-center rounded text-neutral-500 hover:bg-white/10 hover:text-neutral-200"><X size={11} /></button>
              </span>
            ))}
          </div>
        ) : null}
        {open ? <FilterPopover filters={filters} setFilters={setFilters} counts={counts} timed={timed} inline={touch} onClose={() => setOpen(false)} /> : null}
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
                  className={`group flex w-full items-center gap-2.5 rounded-md px-2 text-left transition-colors ${touch ? "py-2.5" : "py-1.5"} ${selected ? "bg-skylab-500/10" : "hover:bg-white/4"}`}
                >
                  <span className={`size-1.5 shrink-0 rounded-full ${status.dot}`} title={status.label} />
                  <Avatar name={person.known ? person.name : ""} photoUrl={person.photoUrl} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-xs ${selected ? "text-neutral-50" : "text-neutral-200 group-hover:text-neutral-50"}`}>{person.name}</span>
                    <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-3xs">
                      {row.isArchived ? <Archive size={10} className="shrink-0 text-skylab-500/70" /> : null}
                      <span className={`shrink-0 ${status.text}`}>{status.label}</span>
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
          <button type="button" onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Önceki sayfa"
            className={`grid place-items-center rounded transition-colors ${touch ? "size-10" : "size-6"} ${page > 1 ? "text-neutral-400 hover:bg-white/5 hover:text-neutral-100" : "text-neutral-700"}`}
          >
            <ChevronLeft size={13} />
          </button>
          <span className="px-1 tabular-nums text-neutral-400">{page} / {totalPages}</span>
          <button type="button" onClick={() => onPage(page + 1)} disabled={page >= totalPages} aria-label="Sonraki sayfa"
            className={`grid place-items-center rounded transition-colors ${touch ? "size-10" : "size-6"} ${page < totalPages ? "text-neutral-400 hover:bg-white/5 hover:text-neutral-100" : "text-neutral-700"}`}
          >
            <ChevronRight size={13} />
          </button>
        </span>
      </div>
    </div>
  );
}
