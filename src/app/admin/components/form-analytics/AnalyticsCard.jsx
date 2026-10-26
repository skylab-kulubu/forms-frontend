"use client";

import { Fragment, useMemo } from "react";
import { motion } from "framer-motion";
import { Activity, ChartColumn, ChevronDown, CornerDownRight, Timer } from "lucide-react";
import { FormDisplayerHeader } from "@/app/components/form-displayer/components/FormDisplayerComponents";
import TaskBlock from "@/app/components/form-displayer/components/TaskBlock";
import { RichText } from "@/app/components/rich-text/RichText";
import { durationText, shortDuration } from "@/lib/form-timing";
import { CardShell, DeliverablesHeader, StepBar } from "../form-studio/StudioCard";
import { QuestionBadge } from "../form-studio/StudioField";
import { conditionLabel, questionNumbers } from "../form-studio/studio-schema";
import { formatDuration } from "../form-overview/components/FormMetrics";
import { askedCount, formatPercent, percentOf, questionStats } from "../form-overview/overview-stats";
import {
  Bars, ChoiceRows, Columns, Donut, EmptyNote, FunnelBars, HourColumns, KIND_LABEL, MatrixHeat, MonthColumns, NumberHistogram, SliderHistogram, ToggleSplit,
  durationBuckets, durationStats,
} from "./analytics-charts";

export const PARTICIPATION = "__participation";

const FADE = { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } };
const SELECTED = "bg-skylab-500/[0.04] ring-2 ring-skylab-400/50";
const HOVER = "cursor-pointer hover:ring-1 hover:ring-white/15";

export function ResultBody({ field, q, view }) {
  const kind = Number(q.kind);
  if (field.type === "multi_choice" || kind === 4) return <ChoiceRows field={field} q={q} />;
  if (field.type === "toggle" || kind === 5) return view === "pie" ? <Donut buckets={q.distribution} /> : <ToggleSplit field={field} q={q} />;
  if (kind === 6) return field.type === "slider" ? <SliderHistogram field={field} q={q} /> : <NumberHistogram q={q} />;
  if (kind === 7) return <MatrixHeat field={field} q={q} />;
  if (kind === 8) return <MonthColumns q={q} />;
  if (kind === 9) return <HourColumns q={q} />;
  if (kind === 3) return view === "pie" ? <Donut buckets={q.distribution} /> : <Bars buckets={q.distribution} />;
  return null;
}

function SummaryLine({ signal }) {
  if (Array.isArray(signal)) {
    return signal.map(([label, value], index) => (
      <Fragment key={label}>
        {index ? " · " : null}
        {label} <b className="font-medium text-neutral-300">{value}</b>
      </Fragment>
    ));
  }
  if (signal.text) return signal.text;
  return (
    <>
      {signal.lead} <b className="font-medium text-neutral-300">{signal.strong}</b>{signal.rest ? ` · ${signal.rest}` : null}
    </>
  );
}

function ParticipationBlock({ data, selected, phone, onClick }) {
  const stats = durationStats(data.durationMinutes ?? []);
  const minutes = (value) => shortDuration(value * 60_000);

  return (
    <div data-q={PARTICIPATION} onClick={onClick}
      className={`relative rounded-xl transition-[box-shadow,background-color] duration-150 ${phone ? "p-2" : "p-4"} ${selected ? SELECTED : HOVER}`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-white/5 pb-3 text-2xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5 text-amber-200/90"><Timer size={12} />Kişisel süre · {durationText(data.timeLimitMinutes)}</span>
        <span className="inline-flex items-center gap-1.5"><Activity size={12} />{data.opened} kişi formu açtı</span>
      </div>
      <p className="mt-4 text-sm font-medium text-neutral-100">Katılım ve süre</p>
      <div className="mt-3">
        <FunnelBars total={data.opened} items={[
          ["Formu açtı", data.opened],
          ["Görevi başlattı", data.started],
          ["Teslim etti", data.submitted],
          ["Geçici cevap", data.provisional, data.provisional > 0 ? "karar bekliyor" : null],
          ["Devam ediyor", data.running],
          ["Teslim yok", data.noSubmission],
        ]} />
      </div>
      <div className="mt-6 flex items-center gap-2">
        <span className="text-2xs font-medium text-neutral-400">Teslim süresi</span>
        <span className="h-px flex-1 bg-white/5" />
      </div>
      {stats ? (
        <>
          <p className="mt-2 text-2xs text-neutral-500">
            Ort <span className="font-semibold tabular-nums text-neutral-200">{minutes(stats.average)}</span> · Medyan <span className="font-semibold tabular-nums text-neutral-200">{minutes(stats.median)}</span>
            {" "}· Min <span className="font-semibold tabular-nums text-neutral-200">{minutes(stats.min)}</span> · Maks <span className="font-semibold tabular-nums text-neutral-200">{minutes(stats.max)}</span>
          </p>
          <Columns items={durationBuckets(stats.sorted, data.timeLimitMinutes)} height={64} />
          <p className="mt-2 text-3xs text-neutral-600">Görevi başlatmadan teslime kadar geçen süre; ek süre alanlar dahil.</p>
        </>
      ) : <EmptyNote>Henüz teslim yok</EmptyNote>}
    </div>
  );
}

function plainNote({ field, q, asked, total }) {
  const kind = Number(q?.kind ?? 0);
  const answered = q?.answeredCount ?? 0;
  const skipped = q?.skippedCount ?? 0;
  if (field.condition?.fieldId) {
    return asked != null && asked >= answered ? `${answered} cevap · ${asked} kişiye gösterildi` : `${answered} cevap · oran ${formatPercent(percentOf(answered, total))}`;
  }
  if (kind === 2) return `${answered} dosya · ${skipped} boş`;
  if (kind === 10) return `${answered} kişi doldurdu${skipped ? ` · ${skipped} boş` : ""}`;
  return `Analiz edilmez${skipped ? ` · ${skipped} boş` : ""}`;
}

function AnalyticsField({ field, q, number, condText, stats, asked, total, open, focused, view, isLast, phone, touch, onFocus, onToggle, onRead }) {
  const props = field.props ?? {};
  const separator = field.type === "separator";
  const aggregatable = Boolean(q?.aggregatable);
  const kind = Number(q?.kind ?? 0);
  const answered = q?.answeredCount ?? 0;

  if (separator) {
    return (
      <div data-q={field.id} className="relative">
        <div className={`relative flex flex-col rounded-xl ${phone ? "p-2" : "p-4"}`}>
          <div className="flex items-center gap-3">
            {props.title ? <RichText as="p" text={props.title} className="min-w-0 max-w-[70%] wrap-break-word text-lg font-medium text-neutral-100" /> : null}
            <div className="h-px flex-1 bg-white/10" />
          </div>
          {props.description ? <RichText as="p" text={props.description} className="mt-1 text-xs text-neutral-400" /> : null}
        </div>
      </div>
    );
  }

  const handleClick = touch
    ? (aggregatable ? () => (open ? onToggle(field.id) : onFocus(field.id)) : undefined)
    : () => onFocus(field.id);

  return (
    <div data-q={field.id} className={`relative ${isLast ? "" : "border-b border-white/5 pb-6"}`}>
      <div onClick={handleClick}
        className={`group/q relative flex flex-col rounded-xl transition-[box-shadow,background-color] duration-150 ${phone ? "p-2" : "p-4"} ${focused ? SELECTED : handleClick ? HOVER : ""}`}
      >
        {condText ? (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-skylab-400/20 bg-skylab-500/10 px-1.5 py-0.5 text-3xs text-skylab-300">
              <CornerDownRight size={10} />
              {condText}
            </span>
          </div>
        ) : null}

        <div className={`flex gap-3 ${aggregatable ? "" : "opacity-60"}`}>
          <QuestionBadge number={number} conditional={Boolean(field.condition?.fieldId)} />
          <div className="flex w-full min-w-0 flex-col">
            <p className="text-sm font-medium text-neutral-100">
              {props.question ? <RichText text={props.question} /> : <span className="font-normal text-neutral-500">Bu soru için metin yok</span>}
              {props.required ? <span className="ml-1 text-red-200/70">*</span> : null}
            </p>
            {props.description && aggregatable ? <RichText as="p" text={props.description} className="my-1 text-xs text-neutral-400" /> : null}
          </div>
          <div className="flex shrink-0 items-start gap-1.5 pt-0.5">
            {aggregatable ? (
              <>
                <span className="text-3xs tabular-nums text-neutral-500">{answered} cevap</span>
                <button type="button" onClick={(event) => { event.stopPropagation(); onToggle(field.id); }}
                  title={open ? "Kapat" : "Aç"} aria-label={open ? "Sonucu kapat" : "Sonucu aç"} aria-expanded={open}
                  className={`grid place-items-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200 ${touch ? "-my-2.5 -mr-2 size-10" : "-my-1 size-6"}`}
                >
                  <ChevronDown size={14} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                </button>
              </>
            ) : (
              <span className="text-3xs tabular-nums text-neutral-500">{KIND_LABEL[kind] ?? "Metin"} · {answered} cevap</span>
            )}
          </div>
        </div>

        {open && aggregatable ? (
          <motion.div key={`${field.id}-${view}`} {...FADE}><ResultBody field={field} q={q} view={view} /></motion.div>
        ) : aggregatable ? (
          <p className="mt-2 flex items-center gap-1.5 pl-9 text-2xs text-neutral-500">
            <span className="min-w-0 truncate">{stats?.signal ? <SummaryLine signal={stats.signal} /> : "Henüz cevap yok"}</span>
          </p>
        ) : (
          <p className="mt-1.5 flex items-center gap-1.5 pl-9 text-2xs text-neutral-500">
            <span className="min-w-0 truncate">{plainNote({ field, q, asked, total })}</span>
            {kind === 1 && onRead ? (
              <button type="button" onClick={(event) => { event.stopPropagation(); onRead(); }}
                className="ml-auto inline-flex min-h-8 shrink-0 items-center gap-1 text-neutral-400 underline decoration-white/20 underline-offset-2 transition-colors hover:text-neutral-100 sm:min-h-0"
              >
                Cevaplarda oku
              </button>
            ) : null}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AnalyticsCard({ form, analytics, participation = null, metrics = null, stepInfo = null, phone = false, touch = false, openIds, focus, viewOf, onFocus, onToggle, onRead }) {
  const schema = form?.schema;
  const fields = useMemo(() => (Array.isArray(schema) ? schema : []), [schema]);
  const numbers = useMemo(() => questionNumbers(fields), [fields]);
  const task = form?.task?.content?.trim() ? form.task : null;
  const total = analytics?.totalResponses ?? 0;
  const timed = Number(form?.timeLimitMinutes) > 0;

  const details = useMemo(() => {
    const byId = new Map((analytics?.questions ?? []).map((q) => [q.questionId, q]));
    const map = new Map();
    fields.forEach((field) => {
      if (field.type === "separator") return;
      const q = byId.get(field.id);
      map.set(field.id, {
        q,
        stats: q ? questionStats(field, q, { fields, byId, total }) : null,
        asked: q ? askedCount(field, fields, byId, total) : null,
      });
    });
    return map;
  }, [analytics, fields, total]);

  return (
    <CardShell phone={phone} active>
      {stepInfo ? <StepBar flowName={stepInfo.flowName} stage={stepInfo.stage} total={stepInfo.total} timeLimitMinutes={form?.timeLimitMinutes} /> : null}
      <FormDisplayerHeader title={form?.title || "Adsız form"} description={form?.description ?? ""} />
      {participation ? (
        <ParticipationBlock data={participation} selected={focus === PARTICIPATION} phone={phone} onClick={() => onFocus(PARTICIPATION)} />
      ) : task ? <TaskBlock task={task} title={form?.title} /> : null}
      {task && fields.length > 0 ? <DeliverablesHeader phone={phone} /> : null}

      {fields.length > 0 ? (
        <div className="flex flex-1 flex-col">
          {fields.map((field, index) => {
            const detail = details.get(field.id);
            return (
              <AnalyticsField key={field.id} field={field} q={detail?.q} number={numbers.get(field.id)} condText={conditionLabel(field, fields, numbers)}
                stats={detail?.stats} asked={detail?.asked} total={total} open={openIds.includes(field.id)} focused={focus === field.id} view={viewOf(field.id)}
                isLast={index === fields.length - 1} phone={phone} touch={touch} onFocus={onFocus} onToggle={onToggle} onRead={onRead}
              />
            );
          })}
        </div>
      ) : (
        <p className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-neutral-500">Bu formda henüz soru yok.</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-white/5 px-2 pt-5 text-2xs text-neutral-500 md:px-4">
        <ChartColumn size={12} className="shrink-0 text-neutral-600" />
        {total} cevap üzerinden
        {!timed && metrics?.averageCompletionTime != null ? (
          <> · ortalama süre <span className="tabular-nums text-neutral-300">{formatDuration(metrics.averageCompletionTime)}</span></>
        ) : null}
      </div>
    </CardShell>
  );
}
