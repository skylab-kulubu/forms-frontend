"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, FileText, Loader2, RotateCcw, UserX, Workflow } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";
import { isDeletedUser } from "@/lib/deleted-user";
import { COLUMN_LABEL, FeatureIcons, SortHeader, StatusDot, formatUpdatedAt } from "../ListItem";
import { formatPersonName } from "../form-responses/response-data";

const DatabaseRowDetails = dynamic(() => import("./DatabaseRowDetails"));

export const DB_GRID = [
  "grid items-center gap-3",
  "grid-cols-[1.25rem_minmax(0,1fr)_auto]",
  "sm:grid-cols-[1.25rem_minmax(0,1fr)_3.5rem_6.5rem]",
  "md:grid-cols-[1.25rem_minmax(0,1.5fr)_minmax(0,1fr)_3.5rem_6.5rem]",
  "lg:grid-cols-[1.25rem_minmax(0,1.5fr)_minmax(0,1fr)_3.5rem_4.5rem_6.5rem]",
  "xl:grid-cols-[1.25rem_minmax(0,1.6fr)_minmax(0,1fr)_3.5rem_4.5rem_6rem_6.5rem]",
  "2xl:grid-cols-[1.25rem_minmax(0,1.6fr)_minmax(0,1fr)_3.5rem_4.5rem_6rem_6rem_6.5rem]",
].join(" ");

const SORT_TITLES = {
  status: "Duruma göre sırala",
  title: "Ada göre sırala",
  owner: "Sahibe göre sırala",
  responseCount: "Yanıt sayısına göre sırala",
  pendingCount: "Bekleyen cevaba göre sırala",
  lastResponseAt: "Son cevaba göre sırala",
  updatedAt: "Güncellenme tarihine göre sırala",
};

const orphanOf = (form) => Boolean(form.isOrphaned) || isDeletedUser(form.createdBy?.id);
const ownerNameOf = (owner) => formatPersonName(owner?.fullName) || owner?.email || "Adsız kullanıcı";

export function DatabaseListHeader({ sort, dir, onSort }) {
  const props = { sortField: sort, sortDirection: dir, onSort };
  return (
    <div className={`${DB_GRID} sticky top-0 z-20 border-b border-white/10 bg-neutral-900 px-3 pb-2`}>
      <SortHeader field="status" title={SORT_TITLES.status} {...props} />
      <SortHeader label="Form" field="title" align="left" title={SORT_TITLES.title} {...props} />
      <SortHeader label="Sahip" field="owner" align="left" visibility="hidden md:flex" title={SORT_TITLES.owner} {...props} />
      <SortHeader label="Yanıt" field="responseCount" visibility="hidden sm:flex" title={SORT_TITLES.responseCount} {...props} />
      <SortHeader label="Bekleyen" field="pendingCount" visibility="hidden lg:flex" title={SORT_TITLES.pendingCount} {...props} />
      <SortHeader label="Son cevap" field="lastResponseAt" visibility="hidden xl:flex" title={SORT_TITLES.lastResponseAt} {...props} />
      <SortHeader label="Güncellendi" field="updatedAt" visibility="hidden 2xl:flex" title={SORT_TITLES.updatedAt} {...props} />
      <span className={`text-right ${COLUMN_LABEL}`}>İşlem</span>
    </div>
  );
}

function FlowTag({ workflow }) {
  const name = workflow.name || "Adsız akış";
  return (
    <Link href={`/admin/workflows/${workflow.id}`} title={`Akışa git: ${name}`}
      className="relative z-10 inline-flex min-w-0 max-w-56 items-center gap-1 rounded border border-white/10 bg-white/3 px-1.5 py-px text-3xs text-neutral-400 transition-colors hover:border-white/20 hover:text-neutral-200"
    >
      <Workflow size={10} className="shrink-0 text-neutral-500" />
      <span className="truncate">{name}</span>
      <span className="shrink-0 text-neutral-600">· {workflow.isStart ? "başlangıç" : "adım"}</span>
    </Link>
  );
}

function OrphanChip({ compact = false }) {
  return (
    <Link href="/admin/ownership" title="Sahibinin hesabı silinmiş. Sahipsiz içeriklerden yeni sahibine devredin."
      className={`relative z-10 inline-flex min-w-0 items-center gap-1 rounded-md border border-amber-400/25 bg-amber-400/5 text-amber-200/90 transition-colors hover:border-amber-300/40 hover:bg-amber-400/10 ${compact ? "px-1.5 py-px text-3xs" : "h-7 px-2 text-2xs"}`}
    >
      <UserX size={compact ? 10 : 12} className="shrink-0" />
      <span className="truncate">Silinmiş kullanıcı</span>
    </Link>
  );
}

function OwnerCell({ form }) {
  if (orphanOf(form)) return <OrphanChip />;
  const owner = form.createdBy;
  const name = ownerNameOf(owner);
  return (
    <span className="flex min-w-0 items-center gap-2" title={owner?.email || name}>
      <Avatar name={name} email={owner?.email} photoUrl={owner?.profilePictureUrl} size="sm" />
      <span className="min-w-0 truncate text-2xs text-neutral-300">{name}</span>
    </span>
  );
}

function DeletedDot() {
  return <span title="Silinmiş form" className="relative z-10 size-1.5 shrink-0 rounded-full border border-neutral-500 bg-transparent" />;
}

export function DatabaseRow({ form, open, onToggle, onRestore, restoring = false }) {
  const deleted = Number(form.status) === 0;
  const orphaned = orphanOf(form);
  const title = form.title || "Adsız form";
  const pending = form.pendingCount ?? 0;
  const responses = form.responseCount ?? 0;

  return (
    <div className={open ? "bg-white/2.5" : ""}>
      <div className={`group/row relative transition-colors ${open ? "" : "hover:bg-white/3"}`}>
        {deleted ? null : (
          <button type="button" onClick={onToggle} aria-expanded={open} aria-label={`${title}: ${open ? "ayrıntıyı kapat" : "ayrıntıyı aç"}`}
            className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-skylab-400/40"
          />
        )}
        <div className={`${DB_GRID} px-3 py-2.5`}>
          <div className="flex justify-center">{deleted ? <DeletedDot /> : <StatusDot form={form} />}</div>

          <div className="flex min-w-0 items-center gap-3">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/3 ${deleted ? "opacity-50" : ""}`}>
              <FileText className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className={`truncate text-sm font-medium transition-colors ${deleted ? "text-neutral-500" : open ? "text-neutral-50" : "text-neutral-200 group-hover/row:text-neutral-50"}`}>{title}</h3>
                {deleted ? <span className="shrink-0 rounded-md border border-white/10 px-1 py-0.5 text-4xs uppercase tracking-[0.18em] text-neutral-500">Silindi</span> : null}
              </div>
              <div className="mt-0.5 flex min-h-4 min-w-0 flex-wrap items-center gap-x-2 gap-y-1 md:flex-nowrap">
                <FeatureIcons form={form} />
                {form.workflow ? <FlowTag workflow={form.workflow} /> : null}
                <span className="text-3xs tabular-nums text-neutral-500 sm:hidden">{responses} yanıt</span>
                {pending > 0 ? <span className="inline-flex items-center gap-1 text-3xs tabular-nums text-amber-300/90 lg:hidden"><span className="size-1 rounded-full bg-amber-400" />{pending} bekliyor</span> : null}
                <span className="min-w-0 md:hidden">
                  {orphaned ? <OrphanChip compact /> : <span className="block truncate text-3xs text-neutral-500">{ownerNameOf(form.createdBy)}</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden min-w-0 md:block"><OwnerCell form={form} /></div>

          <span className="hidden text-center text-sm font-medium tabular-nums text-neutral-200 sm:block">{responses}</span>

          <span className="hidden items-center justify-center gap-1.5 text-sm tabular-nums lg:flex">
            {pending > 0 ? (
              <>
                <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_6px] shadow-amber-400/40" />
                <span className="font-medium text-amber-200">{pending}</span>
              </>
            ) : <span className="text-neutral-700">—</span>}
          </span>

          <span className="hidden text-center text-2xs tabular-nums text-neutral-500 xl:block">{form.lastResponseAt ? formatUpdatedAt(form.lastResponseAt) : "—"}</span>

          <span className="hidden text-center text-2xs tabular-nums text-neutral-500 2xl:block">{formatUpdatedAt(form.updatedAt ?? form.createdAt)}</span>

          <div className="flex items-center justify-end gap-1">
            {deleted ? (
              <button type="button" onClick={onRestore} disabled={restoring} title="Formu geri yükle; kapalı olarak döner"
                className="relative z-10 inline-flex h-8 items-center gap-1.5 rounded-md border border-white/10 px-2 text-2xs font-medium text-neutral-200 transition-colors hover:border-skylab-400/40 hover:bg-skylab-500/10 hover:text-skylab-300 disabled:opacity-60"
              >
                {restoring ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />}
                <span className="hidden sm:inline">Geri yükle</span>
              </button>
            ) : (
              <>
                <ChevronDown aria-hidden="true" className={`hidden h-4 w-4 transition-[transform,color] sm:block ${open ? "rotate-180 text-neutral-300" : "text-neutral-600 group-hover/row:text-neutral-400"}`} />
                <Link href={`/admin/forms/${form.id}`} title="Formu aç" aria-label={`${title} formunu aç`}
                  className="relative z-10 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-skylab-300"
                >
                  <ChevronRight className="h-4.5 w-4.5 transition-transform group-hover/row:translate-x-0.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && !deleted ? <DatabaseRowDetails key="details" form={form} /> : null}
      </AnimatePresence>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div aria-hidden="true" className={`shimmer ${className}`} />;
}

export function DatabaseSkeleton({ count = 6 }) {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={`${DB_GRID} px-3 py-2.5`}>
          <div className="flex justify-center"><SkeletonBlock className="size-1.5 rounded-full" /></div>
          <div className="flex min-w-0 items-center gap-3">
            <SkeletonBlock className="h-9 w-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <SkeletonBlock className="h-3.5 w-48 max-w-full rounded-md" />
              <SkeletonBlock className="h-2.5 w-24 rounded" />
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <SkeletonBlock className="h-7 w-7 shrink-0 rounded-lg" />
            <SkeletonBlock className="h-3 w-24 rounded-md" />
          </div>
          <div className="hidden justify-center sm:flex"><SkeletonBlock className="h-3.5 w-6 rounded-md" /></div>
          <div className="hidden justify-center lg:flex"><SkeletonBlock className="h-3.5 w-5 rounded-md" /></div>
          <div className="hidden justify-center xl:flex"><SkeletonBlock className="h-3 w-14 rounded-md" /></div>
          <div className="hidden justify-center 2xl:flex"><SkeletonBlock className="h-3 w-14 rounded-md" /></div>
          <div className="flex items-center justify-end"><SkeletonBlock className="h-4 w-8 rounded" /></div>
        </div>
      ))}
    </div>
  );
}
