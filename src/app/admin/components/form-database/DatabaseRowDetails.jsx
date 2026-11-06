"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Check, Copy } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";
import { RichText } from "@/app/components/rich-text/RichText";
import { formAnalyticsQuery, formMetricsQuery } from "@/lib/hooks/useFormAdmin";
import { formResponsesQuery } from "@/lib/hooks/useResponse";
import { ROW_STATUS } from "@/lib/attempt-status";
import { effectiveFormSettings } from "@/lib/form-settings";
import { currentTime, shortDuration } from "@/lib/form-timing";
import { decisionRows, lifeSeries } from "../form-overview/overview-stats";
import { LifeBars, TrendArea, TrendBadge } from "../form-overview/components/FormMetrics";
import { personOf, rowKind, statusView } from "../form-responses/response-data";
import { elapsed } from "../workflow-page/journey-data";

const FRESH = 30_000;
const CHOICE_KINDS = [3, 4, 5];
const BAR_LIMIT = 5;
const STAT_ORDER = ["pending", "approved", "declined", "flagged"];
const STAT_LABEL = { pending: "bekleyen", approved: "onaylanan", declined: "reddedilen", flagged: "doğrulanmadı" };

function Shimmer({ className = "" }) {
  return <span aria-hidden="true" className={`shimmer block rounded-md ${className}`} />;
}

function PanelTitle({ title, children = null }) {
  return (
    <div className="mb-2.5 flex h-4 items-center gap-2">
      <span className="shrink-0 text-2xs font-medium text-neutral-500">{title}</span>
      <span className="h-px flex-1 bg-white/5" />
      {children}
    </div>
  );
}

function PanelLink({ href, label }) {
  return (
    <Link href={href} className="-my-2 inline-flex shrink-0 items-center gap-0.5 py-2 text-3xs font-medium text-neutral-500 transition-colors hover:text-skylab-300 sm:my-0 sm:py-0">
      {label}
      <ArrowRight size={10} />
    </Link>
  );
}

function Stat({ dot, tone, value, label }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
      <span className={`text-sm font-semibold tabular-nums ${tone}`}>{value}</span>
      <span className="truncate text-3xs text-neutral-500">{label}</span>
    </div>
  );
}

function Fact({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-neutral-500">{label}</span>
      <span className="font-medium tabular-nums text-neutral-300">{children}</span>
    </div>
  );
}

function CopyId({ id }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  return (
    <button type="button" onClick={copy} title={`ID'yi kopyala: ${id}`} className="inline-flex items-center gap-1 font-mono transition-colors hover:text-neutral-100">
      {String(id).slice(0, 8)}
      {copied ? <Check size={10} className="text-emerald-300" /> : <Copy size={10} className="text-neutral-500" />}
    </button>
  );
}

function Responses({ id, metrics, reviewed }) {
  const rows = new Map(decisionRows(metrics));
  const median = metrics.medianCompletionTime ?? null;
  const seconds = median ?? metrics.averageCompletionTime ?? null;
  const registered = metrics.sourceBreakdown?.registered ?? 0;
  const anonymous = metrics.sourceBreakdown?.anonymous ?? 0;

  return (
    <>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <Stat dot="bg-neutral-500" tone="text-neutral-100" value={metrics.totalResponses ?? 0} label="toplam" />
        {reviewed ? STAT_ORDER.filter((kind) => rows.has(kind)).map((kind) => (
          <Stat key={kind} dot={ROW_STATUS[kind].dot} tone={ROW_STATUS[kind].text} value={rows.get(kind)} label={STAT_LABEL[kind]} />
        )) : <p className="col-span-2 text-3xs text-neutral-600">Bu formda onay adımı yok.</p>}
      </div>
      <div className="mt-3 space-y-1 text-3xs">
        <Fact label={median != null ? "Medyan süre" : "Ortalama süre"}>{seconds != null ? shortDuration(seconds * 1000) : "--"}</Fact>
        <Fact label="Kayıtlı / anonim">{registered} / {anonymous}</Fact>
        <Fact label="Form ID"><CopyId id={id} /></Fact>
      </div>
    </>
  );
}

function Recent({ formId, rows }) {
  if (!rows.length) return <p className="text-3xs text-neutral-600">Henüz cevap yok.</p>;

  return (
    <div className="-mx-1.5 space-y-0.5">
      {rows.map((row) => {
        const person = personOf(row);
        const kind = rowKind(row);
        const view = statusView(kind);
        return (
          <Link key={row.id} href={`/admin/forms/${formId}/responses/${row.id}`}
            className="flex items-center gap-2.5 rounded-md px-1.5 py-1 transition-colors hover:bg-white/5"
          >
            <Avatar name={person.known ? person.name : ""} photoUrl={person.photoUrl} size="sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-2xs font-medium text-neutral-200">{person.name}</span>
              <span className="block truncate text-3xs text-neutral-500">{elapsed(row.submittedAt)} önce</span>
            </span>
            {kind === "submitted" ? null : (
              <span className={`flex shrink-0 items-center gap-1.5 text-3xs font-medium ${view.text}`}>
                <span className={`size-1.5 rounded-full ${view.dot}`} />
                {view.label}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function QuestionBars({ q }) {
  const buckets = q.distribution ?? [];
  const hidden = buckets.length - BAR_LIMIT;

  return (
    <div className="min-w-0">
      <p className="mb-2 truncate text-2xs font-medium text-neutral-300"><RichText text={q.question} /></p>
      <div className="space-y-1.5">
        {buckets.slice(0, BAR_LIMIT).map((bucket) => (
          <div key={bucket.value} className="grid grid-cols-[minmax(0,7.5rem)_minmax(0,1fr)_2.25rem] items-center gap-2">
            <span className="truncate text-3xs text-neutral-400" title={bucket.value}>{bucket.value}</span>
            <span className="relative h-1.5">
              <span className="absolute inset-y-0 left-0 rounded-r-[3px] bg-skylab-500" style={{ width: `${Math.min(100, Number(bucket.percentage) || 0)}%` }} />
            </span>
            <span className="text-right text-3xs tabular-nums text-neutral-500">%{Math.round(Number(bucket.percentage) || 0)}</span>
          </div>
        ))}
      </div>
      {hidden > 0 ? <p className="mt-1.5 text-3xs text-neutral-600">{hidden} seçenek daha</p> : null}
      {Number(q.kind) === 4 ? <p className="mt-1.5 text-3xs text-neutral-600">Birden fazla seçilebiliyor; toplam %100&apos;ü aşabilir.</p> : null}
    </div>
  );
}

function questionsOf(analytics) {
  const usable = (analytics?.questions ?? []).filter((q) => q.aggregatable && (q.answeredCount ?? 0) > 0 && (q.distribution ?? []).length > 0);
  return [
    ...usable.filter((q) => CHOICE_KINDS.includes(Number(q.kind))),
    ...usable.filter((q) => Number(q.kind) === 6),
  ].slice(0, 2);
}

export default function DatabaseRowDetails({ form }) {
  const id = form.id;
  const metricsResult = useQuery({ ...formMetricsQuery(id), staleTime: FRESH });
  const analyticsResult = useQuery({ ...formAnalyticsQuery(id), staleTime: FRESH });
  const responsesResult = useQuery({ ...formResponsesQuery(id, { page: 1 }), staleTime: FRESH });
  const metrics = metricsResult.data?.data ?? null;
  const analytics = analyticsResult.data?.data ?? null;
  const recent = (responsesResult.data?.data?.paginationData?.items ?? []).filter((row) => row.status != null).slice(0, 3);
  const reviewed = effectiveFormSettings(form).requiresManualReview;
  const days = metrics?.dailyTrend ?? [];
  const hasWeek = days.some((day) => (day.count ?? 0) > 0);
  const life = metrics && !hasWeek ? lifeSeries(metrics.lifetime, currentTime()) : null;
  const questions = questionsOf(analytics);
  const failed = <p className="text-3xs text-neutral-600">Yüklenemedi.</p>;

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden"
    >
      <div className="px-3 pb-5 pt-1 sm:pl-11">
        <div className="grid gap-x-8 gap-y-5 md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.15fr)]">
          <section className="min-w-0">
            <PanelTitle title="Cevaplar"><PanelLink href={`/admin/forms/${id}`} label="Genel bakış" /></PanelTitle>
            {metrics ? <Responses id={id} metrics={metrics} reviewed={reviewed} /> : metricsResult.isError ? failed : <Shimmer className="h-24 w-full" />}
          </section>
          <section className="min-w-0">
            <PanelTitle title={life ? "Formun ömrü" : "Son 7 gün"}>
              {metrics && hasWeek ? <span title="Son 7 gün, önceki 7 güne göre"><TrendBadge value={metrics.dailyTrendPercentage} /></span> : null}
            </PanelTitle>
            {metrics ? (hasWeek ? <TrendArea data={days} className="h-20 w-full" /> : life ? <LifeBars life={life} height={80} /> : <p className="text-3xs text-neutral-600">Cevap gelince burada görünür.</p>) : metricsResult.isError ? failed : <Shimmer className="h-20 w-full" />}
          </section>
          <section className="min-w-0 md:col-span-2 xl:col-span-1">
            <PanelTitle title="Son cevaplar"><PanelLink href={`/admin/forms/${id}/responses`} label="Tümü" /></PanelTitle>
            {responsesResult.data ? <Recent formId={id} rows={recent} /> : responsesResult.isError ? failed : <Shimmer className="h-24 w-full" />}
          </section>
        </div>
        {questions.length ? (
          <section className="mt-5">
            <PanelTitle title="Sorular"><PanelLink href={`/admin/forms/${id}/analytics`} label="Analitik" /></PanelTitle>
            <div className="grid gap-x-8 gap-y-5 md:grid-cols-2">
              {questions.map((q) => <QuestionBars key={q.questionId} q={q} />)}
            </div>
          </section>
        ) : null}
      </div>
    </motion.div>
  );
}
