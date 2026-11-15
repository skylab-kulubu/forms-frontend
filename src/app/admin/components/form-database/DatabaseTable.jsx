"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, FileText, RotateCcw, UserX, Workflow } from "lucide-react";
import { Badge, Button, IconButton, Skeleton, StatusDot as Dot, badgeVariants, cn } from "@skylab-kulubu/skylcn-ui";
import Avatar from "@/app/components/utils/Avatar";
import { isDeletedUser } from "@/lib/deleted-user";
import { COLUMN_LABEL, FeatureIcons, IconTile, SortHeader, StatusDot, formatUpdatedAt } from "../ListItem";
import { formatPersonName } from "../form-responses/response-data";

const DatabaseRowDetails = dynamic(() => import("./DatabaseRowDetails"));

// Viewport steps up to 2xl, which DataList does not have, so the list keeps its own grid
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
    <div className={`${DB_GRID} sticky top-0 z-20 border-b border-border bg-background px-3 pb-2`}>
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
      className="relative z-10 inline-flex min-w-0 max-w-56 items-center gap-1 rounded border border-border bg-muted px-1.5 py-px text-3xs text-muted-foreground transition-colors hover:border-border-strong hover:text-secondary-foreground"
    >
      <Workflow size={10} className="shrink-0 text-subtle-foreground" />
      <span className="truncate">{name}</span>
      <span className="shrink-0 text-faint-foreground">· {workflow.isStart ? "başlangıç" : "adım"}</span>
    </Link>
  );
}

function OrphanChip({ compact = false }) {
  return (
    <Link href="/admin/ownership" title="Sahibinin hesabı silinmiş. Sahipsiz içeriklerden yeni sahibine devredin."
      className={cn(badgeVariants({ tone: "warning", size: compact ? "sm" : "md" }), "relative z-10 min-w-0 shrink transition-colors hover:bg-warning/15", compact ? "py-px" : "h-7")}
    >
      <UserX className="shrink-0" />
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
      <span className="min-w-0 truncate text-2xs text-secondary-foreground">{name}</span>
    </span>
  );
}

function DeletedDot() {
  return <span title="Silinmiş form" className="relative z-10 size-1.5 shrink-0 rounded-full border border-subtle-foreground bg-transparent" />;
}

export function DatabaseRow({ form, open, onToggle, onRestore, restoring = false }) {
  const deleted = Number(form.status) === 0;
  const orphaned = orphanOf(form);
  const title = form.title || "Adsız form";
  const pending = form.pendingCount ?? 0;
  const responses = form.responseCount ?? 0;

  return (
    <div className={open ? "bg-row-highlight" : ""}>
      <div className={`group/row relative transition-colors ${open ? "" : "hover:bg-row-highlight"}`}>
        {deleted ? null : (
          <button type="button" onClick={onToggle} aria-expanded={open} aria-label={`${title}: ${open ? "ayrıntıyı kapat" : "ayrıntıyı aç"}`}
            className="absolute inset-0 z-0 cursor-pointer outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          />
        )}
        <div className={`${DB_GRID} px-3 py-2.5`}>
          <div className="flex justify-center">{deleted ? <DeletedDot /> : <StatusDot form={form} />}</div>

          <div className="flex min-w-0 items-center gap-3">
            <IconTile icon={FileText} className={deleted ? "opacity-50" : ""} />
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className={`truncate text-sm font-medium transition-colors ${deleted ? "text-subtle-foreground" : open ? "text-foreground-strong" : "text-secondary-foreground group-hover/row:text-foreground-strong"}`}>{title}</h3>
                {deleted ? <Badge size="xs">Silindi</Badge> : null}
              </div>
              <div className="mt-0.5 flex min-h-4 min-w-0 flex-wrap items-center gap-x-2 gap-y-1 md:flex-nowrap">
                <FeatureIcons form={form} />
                {form.workflow ? <FlowTag workflow={form.workflow} /> : null}
                <span className="text-3xs tabular-nums text-subtle-foreground sm:hidden">{responses} yanıt</span>
                {pending > 0 ? <span className="inline-flex items-center gap-1 text-3xs tabular-nums text-warning lg:hidden"><Dot tone="warning" glow={false} className="size-1" />{pending} bekliyor</span> : null}
                <span className="min-w-0 md:hidden">
                  {orphaned ? <OrphanChip compact /> : <span className="block truncate text-3xs text-subtle-foreground">{ownerNameOf(form.createdBy)}</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden min-w-0 md:block"><OwnerCell form={form} /></div>

          <span className="hidden text-center text-sm font-medium tabular-nums text-secondary-foreground sm:block">{responses}</span>

          <span className="hidden items-center justify-center gap-1.5 text-sm tabular-nums lg:flex">
            {pending > 0 ? (
              <>
                <Dot tone="warning" />
                <span className="font-medium text-warning">{pending}</span>
              </>
            ) : <span className="text-faint-foreground">—</span>}
          </span>

          <span className="hidden text-center text-2xs tabular-nums text-subtle-foreground xl:block">{form.lastResponseAt ? formatUpdatedAt(form.lastResponseAt) : "—"}</span>

          <span className="hidden text-center text-2xs tabular-nums text-subtle-foreground 2xl:block">{formatUpdatedAt(form.updatedAt ?? form.createdAt)}</span>

          <div className="flex items-center justify-end gap-1">
            {deleted ? (
              <Button variant="outline" onClick={onRestore} pending={restoring} title="Formu geri yükle; kapalı olarak döner" className="relative z-10">
                <RotateCcw aria-hidden="true" />
                <span className="hidden sm:inline">Geri yükle</span>
              </Button>
            ) : (
              <>
                <ChevronDown aria-hidden="true" className={`hidden size-4 transition-[transform,color] sm:block ${open ? "rotate-180 text-secondary-foreground" : "text-faint-foreground group-hover/row:text-muted-foreground"}`} />
                <IconButton icon={ChevronRight} label={`${title} formunu aç`} title="Formu aç" variant="ghost" className="relative z-10" render={<Link href={`/admin/forms/${form.id}`} />} />
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

export function DatabaseSkeleton({ count = 6 }) {
  return (
    <div aria-hidden="true" className="divide-y divide-border-subtle">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={`${DB_GRID} px-3 py-2.5`}>
          <div className="flex justify-center"><Skeleton className="size-1.5 rounded-full" /></div>
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-48 max-w-full" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Skeleton className="size-7 shrink-0 rounded-lg" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="hidden justify-center sm:flex"><Skeleton className="h-3.5 w-6" /></div>
          <div className="hidden justify-center lg:flex"><Skeleton className="h-3.5 w-5" /></div>
          <div className="hidden justify-center xl:flex"><Skeleton className="h-3 w-14" /></div>
          <div className="hidden justify-center 2xl:flex"><Skeleton className="h-3 w-14" /></div>
          <div className="flex items-center justify-end"><Skeleton className="h-4 w-8" /></div>
        </div>
      ))}
    </div>
  );
}
