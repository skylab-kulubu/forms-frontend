"use client";

import { Fragment } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, PencilLine, Workflow } from "lucide-react";
import { formatUpdatedAt } from "./ListItem";
import { workflowEditHref } from "@/lib/workflow-links";

const WORKFLOW_GRID = [
  "grid items-center gap-3",
  "grid-cols-[1.5rem_minmax(0,1.5fr)_auto]",
  "md:grid-cols-[1.5rem_minmax(0,1.2fr)_minmax(0,1.8fr)_auto]",
  "xl:grid-cols-[1.5rem_minmax(0,1.1fr)_minmax(0,1.9fr)_5.5rem_5.5rem_6rem_4.5rem]",
].join(" ");

const COLUMN_LABEL = "text-3xs font-medium text-neutral-600";

const STATUS_DOT = {
  live: "bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/40",
  draft: "bg-amber-400 shadow-[0_0_6px] shadow-amber-400/40",
  closed: "bg-red-400 shadow-[0_0_6px] shadow-red-400/40",
  archived: "bg-neutral-600",
};

function SkeletonBlock({ className = "" }) {
  return <div aria-hidden="true" className={`shimmer ${className}`} />;
}

export function WorkflowListHeader() {
  return (
    <div className={`${WORKFLOW_GRID} sticky top-0 z-20 border-b border-white/10 bg-neutral-900 px-3 pb-2`}>
      <span />
      <span className={COLUMN_LABEL}>Akış</span>
      <span className={`hidden md:block ${COLUMN_LABEL}`}>Adımlarda şu an</span>
      <span className={`hidden text-center xl:block ${COLUMN_LABEL}`}>Onay bekleyen</span>
      <span className={`hidden text-center xl:block ${COLUMN_LABEL}`}>Devam eden</span>
      <span className={`hidden text-center xl:block ${COLUMN_LABEL}`}>Güncellendi</span>
      <span className={`text-right ${COLUMN_LABEL}`}>İşlem</span>
    </div>
  );
}

export function WorkflowListItemSkeleton({ count = 4, className = "" }) {
  return (
    <div className={`divide-y divide-white/5 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={`${WORKFLOW_GRID} px-3 py-3`}>
          <div className="flex justify-center"><SkeletonBlock className="size-1.5 rounded-full" /></div>
          <div className="flex min-w-0 items-center gap-3">
            <SkeletonBlock className="h-9 w-9 shrink-0 rounded-lg" />
            <SkeletonBlock className="h-3.5 w-36 rounded-md" />
          </div>
          <SkeletonBlock className="hidden h-4 w-56 max-w-full rounded-md md:block" />
          <div className="hidden justify-center xl:flex"><SkeletonBlock className="h-3.5 w-5 rounded-md" /></div>
          <div className="hidden justify-center xl:flex"><SkeletonBlock className="h-3.5 w-5 rounded-md" /></div>
          <div className="hidden justify-center xl:flex"><SkeletonBlock className="h-3 w-16 rounded-md" /></div>
          <div className="flex items-center justify-end"><SkeletonBlock className="h-4 w-10 rounded" /></div>
        </div>
      ))}
    </div>
  );
}

function stateOf(workflow) {
  const status = Number(workflow.status);
  const intake = Number(workflow.intake ?? 0);
  if (status === 2) return { dot: STATUS_DOT.archived, label: "Arşivde", subtitle: "Arşivlendi", tone: "text-neutral-500" };
  if (!workflow.publishedVersion) return { dot: STATUS_DOT.draft, label: "Taslak", subtitle: "Henüz yayınlanmadı", tone: "text-neutral-500" };
  if (intake === 2) return { dot: STATUS_DOT.closed, label: "Kapalı", subtitle: "Başvurular kapalı", tone: "text-neutral-500" };
  if (intake === 1) return { dot: STATUS_DOT.live, label: "Yayında", subtitle: "Yeni başvuru alınmıyor", tone: "text-amber-300/80" };
  return {
    dot: STATUS_DOT.live,
    label: "Yayında",
    subtitle: workflow.hasUnpublishedChanges ? `Yayında · v${workflow.publishedVersion} · yayınlanmamış değişiklik var` : `Yayında · v${workflow.publishedVersion}`,
    tone: "text-neutral-500",
  };
}

function Count({ value, tone = "text-neutral-200", muted }) {
  if (muted || !value) return <span className="text-neutral-600">—</span>;
  return <span className={`font-medium ${tone}`}>{value}</span>;
}

export default function WorkflowListItem({ workflow, className = "" }) {
  const router = useRouter();
  if (!workflow) return null;

  const state = stateOf(workflow);
  const href = `/admin/workflows/${workflow.id}`;
  const editHref = workflowEditHref(workflow);
  const runs = workflow.runs ?? null;
  const draft = !workflow.publishedVersion;
  const steps = (runs?.steps ?? []).filter((step) => !step.isRemoved || step.count > 0);

  return (
    <div role="link" tabIndex={0} onClick={() => router.push(href)} onKeyDown={(event) => { if (event.key === "Enter") router.push(href); }}
      className={`group/row relative cursor-pointer transition-colors hover:bg-white/3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-skylab-400/40 ${className}`}
    >
      <div className={`${WORKFLOW_GRID} px-3 py-3`}>
        <div className="flex justify-center">
          <span title={state.label} className={`size-1.5 shrink-0 rounded-full ${state.dot}`} />
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/3">
            <Workflow className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-medium text-neutral-200 transition-colors group-hover/row:text-neutral-50">{workflow.name || "Adsız akış"}</h3>
            <p className={`mt-0.5 truncate text-3xs ${state.tone}`}>{state.subtitle}</p>
            {!draft && runs ? (
              <p className="mt-1 flex flex-wrap items-center gap-x-2.5 text-3xs md:hidden">
                <span className="text-neutral-400"><span className="font-medium tabular-nums text-neutral-100">{runs.activeRunCount}</span> devam eden</span>
                {runs.awaitingReviewCount > 0 ? <span className="text-amber-200/90"><span className="font-medium tabular-nums">{runs.awaitingReviewCount}</span> onay bekliyor</span> : null}
              </p>
            ) : null}
          </div>
        </div>

        <div className="hidden min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1 md:flex">
          {steps.length === 0 ? <span className="text-2xs text-neutral-700">—</span> : null}
          {steps.map((step, index) => (
            <Fragment key={step.nodeKey}>
              {index > 0 ? <ChevronRight size={12} className="shrink-0 text-neutral-700" /> : null}
              <span className="inline-flex min-w-0 items-center gap-1.5 text-2xs" title={step.isRemoved ? `${step.formTitle} (eski sürümde)` : step.formTitle}>
                <span className="grid size-4 shrink-0 place-items-center rounded border border-white/10 bg-white/5 text-4xs font-semibold text-neutral-400">{step.isRemoved ? "–" : step.depth || index + 1}</span>
                <span className="max-w-24 truncate text-neutral-400">{step.formTitle}</span>
                <span className={`font-medium tabular-nums ${draft ? "text-neutral-600" : "text-neutral-100"}`}>{draft ? "—" : step.count}</span>
                {!draft && step.awaitingReview > 0 ? <span title={`${step.awaitingReview} onay bekliyor`} className="size-1.5 shrink-0 rounded-full bg-amber-400" /> : null}
              </span>
            </Fragment>
          ))}
        </div>

        <div className="hidden text-center text-sm tabular-nums xl:block"><Count value={runs?.awaitingReviewCount} tone="text-amber-200" muted={draft} /></div>
        <div className="hidden text-center text-sm tabular-nums xl:block"><Count value={runs?.activeRunCount} muted={draft} /></div>
        <span className="hidden text-center text-2xs tabular-nums text-neutral-500 xl:block">{formatUpdatedAt(workflow.updatedAt)}</span>

        <div className="flex items-center justify-end gap-0.5">
          <Link href={editHref} title="Düzenle" aria-label="Düzenle" onClick={(event) => event.stopPropagation()}
            className="grid size-7 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-100"
          >
            <PencilLine size={14} />
          </Link>
          <span className="grid size-7 place-items-center text-neutral-400">
            <ChevronRight size={17} className="transition-transform group-hover/row:translate-x-0.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
