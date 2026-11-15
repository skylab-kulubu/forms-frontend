"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChartColumn, List, ListChecks, PencilLine, Share2, Workflow } from "lucide-react";
import { Button, Section, Skeleton } from "@skylab-kulubu/skylcn-ui";
import { ROW_STATUS } from "@/lib/attempt-status";
import { effectiveFormSettings } from "@/lib/form-settings";
import { shortDuration } from "@/lib/form-timing";
import { formMetricsQuery } from "@/lib/hooks/useFormAdmin";
import { formResponsesQuery } from "@/lib/hooks/useResponse";
import { decisionRows } from "../form-overview/overview-stats";
import { personOf, rowKind, statusView } from "../form-responses/response-data";
import FormShareDialog from "../share/FormShareDialog";
import FlowStrip from "./FlowStrip";
import { agoText, closingText } from "./table-data";
import { elapsed, finishedTotal, possessive } from "../workflow-page/journey-data";

const FRESH = 30_000;

const solid = (kind) => ROW_STATUS[kind].dot.split(" ")[0];

function Count({ value }) {
  return <span className="font-medium tabular-nums text-foreground">{value}</span>;
}

function formParts(metrics, reviewed) {
  if (!reviewed) return [];
  return decisionRows(metrics).map(([kind, count]) => ({ key: kind, count, color: solid(kind), label: ROW_STATUS[kind].label }));
}

function flowParts(runs) {
  const finished = runs?.finished ?? {};
  const waiting = runs?.awaitingReviewCount ?? 0;
  const others = (finished.timedOut ?? 0) + (finished.voided ?? 0) + (finished.stopped ?? 0);
  return [
    { key: "waiting", count: waiting, color: "bg-amber-400", label: "Onay bekliyor" },
    { key: "active", count: Math.max(0, (runs?.activeRunCount ?? 0) - waiting), color: "bg-skylab-400", label: "Devam ediyor" },
    { key: "completed", count: finished.completed ?? 0, color: "bg-emerald-400", label: "Tamamlandı" },
    { key: "declined", count: finished.declined ?? 0, color: "bg-red-400", label: "Elendi" },
    { key: "others", count: others, color: "bg-neutral-500", label: "Diğer" },
  ];
}

function Proportion({ parts }) {
  const shown = parts.filter((part) => part.count > 0);
  const total = shown.reduce((sum, part) => sum + part.count, 0);
  if (!total) return null;

  return (
    <div>
      <div className="flex h-1 w-full max-w-sm gap-px overflow-hidden rounded-full">
        {shown.map((part) => <span key={part.key} title={`${part.label}: ${part.count}`} className={`h-full opacity-70 ${part.color}`} style={{ width: `${(part.count / total) * 100}%` }} />)}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-subtle-foreground">
        {shown.map((part) => (
          <span key={part.key} className="inline-flex items-center gap-1.5">
            <span className={`size-1.5 rounded-full opacity-70 ${part.color}`} />
            <span className="tabular-nums text-secondary-foreground">{part.count}</span>
            {part.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function FormSentence({ metrics, parts }) {
  const total = metrics.totalResponses ?? 0;
  const waiting = parts[0]?.key === "pending" ? parts[0].count : 0;
  if (!total) return <>Henüz cevap gelmedi.</>;
  return <><Count value={total} /> cevap geldi{waiting ? <>, <Count value={waiting} />{possessive(waiting)} onay bekliyor</> : null}.</>;
}

function FlowSentence({ runs }) {
  const active = runs?.activeRunCount ?? 0;
  const waiting = runs?.awaitingReviewCount ?? 0;
  const done = finishedTotal(runs?.finished);
  if (!active && !done) return <>Henüz başvuru yok.</>;

  return (
    <>
      {active ? <><Count value={active} /> kişinin başvurusu sürüyor{waiting ? <>, <Count value={waiting} />{possessive(waiting)} onay bekliyor</> : null}. </> : null}
      {done ? <><Count value={done} /> başvuru bitti.</> : null}
    </>
  );
}

function factsOf(row, metrics) {
  const seconds = metrics?.medianCompletionTime ?? metrics?.averageCompletionTime ?? null;
  return [
    closingText(row.closesAt),
    row.lastAt ? `Son cevap ${agoText(row.lastAt)}` : null,
    seconds != null ? `Medyan süre ${shortDuration(seconds * 1000)}` : null,
  ].filter(Boolean);
}

function Actions({ row, form, onShare }) {
  const live = effectiveFormSettings(form).isOpen;

  return (
    <div className="-ml-2.5 flex flex-wrap items-center gap-0.5">
      {row.pending > 0 && row.reviewHref ? <Button variant="ghost" size="sm" render={<Link href={row.reviewHref} />}><ListChecks aria-hidden="true" />Bekleyenleri incele</Button> : null}
      {row.kind === "flow" ? <Button variant="ghost" size="sm" render={<Link href={row.href} />}><Workflow aria-hidden="true" />Akışı aç</Button> : null}
      {row.responsesHref ? <Button variant="ghost" size="sm" render={<Link href={row.responsesHref} />}><List aria-hidden="true" />Cevaplar</Button> : null}
      {row.kind === "form" ? <Button variant="ghost" size="sm" render={<Link href={`${row.href}/analytics`} />}><ChartColumn aria-hidden="true" />Analitik</Button> : null}
      {row.role >= 2 ? <Button variant="ghost" size="sm" render={<Link href={row.editHref} />}><PencilLine aria-hidden="true" />Düzenle</Button> : null}
      {live ? <Button variant="ghost" size="sm" onClick={onShare}><Share2 aria-hidden="true" />Paylaş</Button> : null}
    </div>
  );
}

function PersonLine({ formId, row }) {
  const person = personOf(row);
  const kind = rowKind(row);
  const view = statusView(kind);

  return (
    <Link href={`/admin/forms/${formId}/responses/${row.id}`} className="-mx-1.5 flex items-center gap-2 rounded-md px-1.5 py-0.5 text-2xs transition-colors hover:bg-accent">
      <span title={view.label} className={`size-1.5 shrink-0 rounded-full opacity-70 ${view.dot.split(" ")[0]}`} />
      <span className="min-w-0 flex-1 truncate text-secondary-foreground">{person.name}</span>
      <span className="shrink-0 tabular-nums text-faint-foreground">{elapsed(row.submittedAt)} önce</span>
    </Link>
  );
}

function People({ row, result, className = "" }) {
  const rows = (result.data?.data?.paginationData?.items ?? []).filter((item) => item.status != null).slice(0, 3);

  return (
    <Section level={3} title="Son cevaplar" className={`hidden @2xl:flex ${className}`}
      action={
        <Link href={`/admin/forms/${row.details.id}/responses`} className="inline-flex shrink-0 items-center gap-0.5 text-3xs font-medium text-subtle-foreground transition-colors hover:text-skylab-300">
          Tümü
          <ArrowRight size={10} />
        </Link>
      }
    >
      {result.data ? (
        rows.length ? rows.map((item) => <PersonLine key={item.id} formId={row.details.id} row={item} />) : <p className="text-2xs text-faint-foreground">Henüz cevap yok.</p>
      ) : <Skeleton className="h-16 w-full" />}
    </Section>
  );
}

export default function RowPeek({ row }) {
  const [shareOpen, setShareOpen] = useState(false);
  const flow = row.kind === "flow";
  const form = row.details;
  const settings = effectiveFormSettings(form);
  const metricsResult = useQuery({ ...formMetricsQuery(form.id), staleTime: FRESH, enabled: !flow });
  const responsesResult = useQuery({ ...formResponsesQuery(form.id, { page: 1 }), staleTime: FRESH });
  const metrics = metricsResult.data?.data ?? null;
  const parts = flow ? flowParts(row.flow?.runs) : metrics ? formParts(metrics, settings.requiresManualReview) : [];
  const ready = flow || Boolean(metrics);
  const facts = factsOf(row, metrics);
  const sentence = flow ? <FlowSentence runs={row.flow?.runs} /> : <FormSentence metrics={metrics} parts={parts} />;

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden bg-row-highlight">
      <div className="flex flex-col gap-4 px-3 pb-3.5 pt-1 @2xl:flex-row @2xl:flex-wrap @2xl:items-start @2xl:gap-x-8 @2xl:pl-24">
        {row.steps ? <div className="min-w-0 max-w-full"><FlowStrip row={row} /></div> : null}
        <div className="flex min-w-0 flex-col gap-x-8 gap-y-4 @2xl:grow @2xl:basis-88 @2xl:flex-row @2xl:flex-wrap @2xl:items-start @[90rem]:justify-end">
          <div className="flex min-w-0 flex-col gap-2.5 @2xl:w-88 @2xl:max-w-full">
            {ready ? (
              <p className="text-xs leading-5 text-muted-foreground">{sentence}</p>
            ) : <Skeleton className="h-5 w-56 max-w-full" />}
            <Proportion parts={parts} />
            {facts.length ? <p className="text-2xs text-subtle-foreground">{facts.join(" · ")}</p> : null}
            <Actions row={row} form={form} onShare={() => setShareOpen(true)} />
          </div>
          <People row={row} result={responsesResult} className="@2xl:w-52" />
        </div>
      </div>
      <FormShareDialog open={shareOpen} onClose={() => setShareOpen(false)} formId={form.id} formTitle={form.title}
        formStatus={settings.isOpen ? 2 : 1} allowAnonymous={settings.allowAnonymousResponses} canEdit={row.role >= 2}
      />
    </motion.div>
  );
}
