"use client";

import Link from "next/link";
import { ChevronRight, FileText, Workflow } from "lucide-react";
import { formatUpdatedAt } from "./ListItem";

const WORKFLOW_GRID = [
  "grid items-center gap-3",
  "grid-cols-[1.5rem_minmax(0,1.5fr)_minmax(0,1fr)_auto]",
  "sm:grid-cols-[1.5rem_minmax(0,1.5fr)_minmax(0,1fr)_4rem_auto]",
  "lg:grid-cols-[1.5rem_minmax(0,1.5fr)_minmax(0,1fr)_4rem_6rem_6.5rem_auto]",
].join(" ");

const COLUMN_LABEL = "text-3xs font-medium text-neutral-600";

const WORKFLOW_STATUS = {
  0: { label: "Taslak", dot: "bg-amber-400 shadow-[0_0_6px] shadow-amber-400/40" },
  1: { label: "Canlı", dot: "bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/40" },
  2: { label: "Arşiv", dot: "bg-neutral-600" },
};

function SkeletonBlock({ className = "" }) {
  return <div aria-hidden="true" className={`shimmer ${className}`} />;
}

export function WorkflowListHeader() {
  return (
    <div className={`${WORKFLOW_GRID} sticky top-0 z-20 border-b border-white/10 bg-neutral-900 px-3 pb-2`}>
      <span />
      <span className={COLUMN_LABEL}>Akış</span>
      <span className={COLUMN_LABEL}>Başlangıç formu</span>
      <span className={`text-center ${COLUMN_LABEL}`}>Adım</span>
      <span className={`hidden text-center lg:block ${COLUMN_LABEL}`}>Sürüm</span>
      <span className={`hidden text-center lg:block ${COLUMN_LABEL}`}>Güncellendi</span>
      <span className={`text-right ${COLUMN_LABEL}`}>İşlem</span>
    </div>
  );
}

export function WorkflowListItemSkeleton({ count = 4, className = "" }) {
  return (
    <div className={`divide-y divide-white/5 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={`${WORKFLOW_GRID} px-3 py-2.5`}>
          <div className="flex justify-center"><SkeletonBlock className="size-1.5 rounded-full" /></div>
          <div className="flex min-w-0 items-center gap-3">
            <SkeletonBlock className="h-9 w-9 shrink-0 rounded-lg" />
            <SkeletonBlock className="h-3.5 w-36 rounded-md" />
          </div>
          <SkeletonBlock className="h-7 w-36 max-w-full rounded-md" />
          <div className="flex justify-center"><SkeletonBlock className="h-3.5 w-5 rounded-md" /></div>
          <div className="hidden justify-center lg:flex"><SkeletonBlock className="h-3 w-12 rounded-md" /></div>
          <div className="hidden justify-center lg:flex"><SkeletonBlock className="h-3 w-16 rounded-md" /></div>
          <div className="flex items-center justify-end"><SkeletonBlock className="h-4 w-4 rounded" /></div>
        </div>
      ))}
    </div>
  );
}

export default function WorkflowListItem({ workflow, className = "" }) {
  if (!workflow) return null;

  const status = WORKFLOW_STATUS[Number(workflow.status)] ?? WORKFLOW_STATUS[0];
  const href = `/admin/workflows/${workflow.id}`;
  const startForm = workflow.startForm ?? null;
  const versionLabel = workflow.publishedVersion ? `v${workflow.publishedVersion}` : "--";

  const subtitle = workflow.hasUnpublishedChanges
    ? "Yayınlanmamış değişiklik var"
    : workflow.publishedVersion
      ? "Yayında"
      : "Henüz yayınlanmadı";

  return (
    <div className={`group/row relative transition-colors hover:bg-white/3 ${className}`}>
      <Link href={href} className="absolute inset-0 z-0" aria-label={workflow.name ?? "Akış"} tabIndex={-1} />
      <div className={`${WORKFLOW_GRID} px-3 py-2.5`}>

        <div className="flex justify-center">
          <span title={status.label} className={`relative z-10 size-1.5 shrink-0 rounded-full ${status.dot}`} />
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/3">
            <Workflow className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-neutral-200 transition-colors group-hover/row:text-neutral-50">
              {workflow.name || "Adsız akış"}
            </h3>
            <p className="mt-0.5 truncate text-3xs text-neutral-500">{subtitle}</p>
          </div>
        </div>

        <div className="min-w-0">
          {startForm ? (
            <Link href={`/admin/forms/${startForm.id}`} title={`Forma git: ${startForm.title}`}
              className="relative z-10 flex w-full min-w-0 max-w-60 items-center gap-2 rounded-md border border-white/10 bg-white/3 px-2 py-1 transition-colors hover:border-white/20 hover:bg-white/5"
            >
              <FileText size={12} className="shrink-0 text-neutral-500" />
              <span className="truncate text-2xs font-medium text-neutral-200">{startForm.title || "Adsız form"}</span>
            </Link>
          ) : (
            <span className="pl-1 text-2xs text-neutral-700">—</span>
          )}
        </div>

        <div className="text-center text-sm font-medium tabular-nums text-neutral-200">
          {workflow.nodeCount ?? 0}
        </div>

        <div className="hidden text-center text-2xs text-neutral-400 lg:block">
          {versionLabel}
        </div>

        <span className="hidden text-center text-2xs tabular-nums text-neutral-500 lg:block">
          {formatUpdatedAt(workflow.updatedAt)}
        </span>

        <div className="flex items-center justify-end">
          <Link href={href} title="Akışı aç" aria-label="Akışı aç"
            className="relative z-10 inline-flex h-6 w-6 shrink-0 items-center justify-center text-neutral-400 transition-colors hover:text-skylab-300"
          >
            <ChevronRight className="h-4.5 w-4.5 transition-transform group-hover/row:translate-x-0.5" />
          </Link>
        </div>

      </div>
    </div>
  );
}
