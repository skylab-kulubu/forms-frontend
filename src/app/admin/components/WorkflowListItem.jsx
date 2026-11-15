"use client";

import { Fragment } from "react";
import Link from "next/link";
import { ChevronRight, PencilLine, Workflow } from "lucide-react";
import { DataList, DataListTitle, IconButton, StatusDot } from "@skylab-kulubu/skylcn-ui";
import { IconTile, formatUpdatedAt } from "./ListItem";
import { workflowEditHref } from "@/lib/workflow-links";

function stateOf(workflow) {
  const status = Number(workflow.status);
  const intake = Number(workflow.intake ?? 0);
  if (status === 2) return { tone: "neutral", label: "Arşivde", subtitle: "Arşivlendi", warn: false };
  if (!workflow.publishedVersion) return { tone: "warning", label: "Taslak", subtitle: "Henüz kaydedilmedi", warn: false };
  if (intake === 2) return { tone: "danger", label: "Kapalı", subtitle: "Başvurular kapalı", warn: false };
  if (intake === 1) return { tone: "success", label: "Yayında", subtitle: "Yeni başvuru alınmıyor", warn: true };
  return {
    tone: "success",
    label: "Yayında",
    subtitle: workflow.hasUnpublishedChanges ? "Başvurular açık · kaydedilmemiş değişiklik var" : "Başvurular açık",
    warn: false,
  };
}

const isDraft = (workflow) => !workflow.publishedVersion;
const stepsOf = (workflow) => (workflow.runs?.steps ?? []).filter((step) => !step.isRemoved || step.count > 0);

function Count({ value, warn = false, muted }) {
  if (muted || !value) return <span className="text-faint-foreground">—</span>;
  return <span className={`font-medium ${warn ? "text-warning" : "text-secondary-foreground"}`}>{value}</span>;
}

function NameCell({ workflow }) {
  const state = stateOf(workflow);
  const runs = workflow.runs ?? null;
  return (
    <DataListTitle leading={<IconTile icon={Workflow} />} title={workflow.name || "Adsız akış"}
      subtitle={
        <span className="min-w-0">
          <span className={`block truncate ${state.warn ? "text-warning" : ""}`}>{state.subtitle}</span>
          {!isDraft(workflow) && runs ? (
            <span className="mt-1 flex flex-wrap items-center gap-x-2.5 md:hidden">
              <span className="text-muted-foreground"><span className="font-medium tabular-nums text-foreground">{runs.activeRunCount}</span> devam eden</span>
              {runs.awaitingReviewCount > 0 ? <span className="text-warning"><span className="font-medium tabular-nums">{runs.awaitingReviewCount}</span> onay bekliyor</span> : null}
            </span>
          ) : null}
        </span>
      }
    />
  );
}

function StepsCell({ workflow }) {
  const steps = stepsOf(workflow);
  const draft = isDraft(workflow);
  if (steps.length === 0) return <span className="text-2xs text-faint-foreground">—</span>;
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
      {steps.map((step, index) => (
        <Fragment key={step.nodeKey}>
          {index > 0 ? <ChevronRight size={12} className="shrink-0 text-faint-foreground" aria-hidden="true" /> : null}
          <span className="inline-flex min-w-0 items-center gap-1.5 text-2xs" title={step.isRemoved ? `${step.formTitle} (akıştan çıkarıldı)` : step.formTitle}>
            <span className="grid size-4 shrink-0 place-items-center rounded border border-border bg-muted text-4xs font-semibold text-muted-foreground">{step.isRemoved ? "–" : step.depth || index + 1}</span>
            <span className="max-w-24 truncate text-muted-foreground">{step.formTitle}</span>
            <span className={`font-medium tabular-nums ${draft ? "text-faint-foreground" : "text-foreground"}`}>{draft ? "—" : step.count}</span>
            {!draft && step.awaitingReview > 0 ? <StatusDot tone="warning" glow={false} label={`${step.awaitingReview} onay bekliyor`} /> : null}
          </span>
        </Fragment>
      ))}
    </div>
  );
}

const COLUMNS = [
  {
    id: "status", width: "1.5rem", align: "center", label: "Durum",
    cell: (workflow) => {
      const state = stateOf(workflow);
      return <StatusDot tone={state.tone} glow={state.tone !== "neutral"} label={state.label} />;
    },
  },
  { id: "name", width: { base: "minmax(0,1.5fr)", md: "minmax(0,1.2fr)", xl: "minmax(0,1.1fr)" }, header: "Akış", cell: (workflow) => <NameCell workflow={workflow} /> },
  { id: "steps", width: { base: "minmax(0,1.8fr)", xl: "minmax(0,1.9fr)" }, from: "md", header: "Adımlarda şu an", cell: (workflow) => <StepsCell workflow={workflow} /> },
  {
    id: "review", width: "5.5rem", from: "xl", align: "center", header: "Onay bekleyen", className: "text-sm tabular-nums",
    cell: (workflow) => <Count value={workflow.runs?.awaitingReviewCount} warn muted={isDraft(workflow)} />,
  },
  {
    id: "active", width: "5.5rem", from: "xl", align: "center", header: "Devam eden", className: "text-sm tabular-nums",
    cell: (workflow) => <Count value={workflow.runs?.activeRunCount} muted={isDraft(workflow)} />,
  },
  {
    id: "updated", width: "6rem", from: "xl", align: "center", header: "Güncellendi", className: "text-2xs tabular-nums text-subtle-foreground",
    cell: (workflow) => formatUpdatedAt(workflow.updatedAt),
  },
  {
    id: "actions", width: { base: "auto", xl: "4.5rem" }, align: "end", header: "İşlem", interactive: true,
    cell: (workflow) => (
      <span className="flex items-center gap-0.5">
        <IconButton icon={PencilLine} label="Düzenle" variant="ghost" size="icon-sm" render={<Link href={workflowEditHref(workflow)} />} />
        <ChevronRight size={17} aria-hidden="true" className="mx-1 text-muted-foreground transition-transform group-hover/row:translate-x-0.5" />
      </span>
    ),
  },
];

/** The workflows list: one row per flow, the whole row opening it. */
export default function WorkflowList({ workflows, loading = false, empty }) {
  return (
    <DataList aria-label="Akışlar" rows={workflows} columns={COLUMNS} getRowId={(workflow) => String(workflow.id)}
      rowHref={(workflow) => `/admin/workflows/${workflow.id}`} rowLabel={(workflow) => workflow.name || "Adsız akış"}
      loading={loading} skeletonRows={5} empty={empty}
    />
  );
}
