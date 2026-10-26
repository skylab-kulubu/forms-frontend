"use client";

import { Fragment, useMemo } from "react";
import { ArrowRight, ChartColumn, ChevronRight, CornerDownRight } from "lucide-react";
import { FormDisplayerHeader } from "@/app/components/form-displayer/components/FormDisplayerComponents";
import TaskBlock from "@/app/components/form-displayer/components/TaskBlock";
import { RichText } from "@/app/components/rich-text/RichText";
import { CardShell, DeliverablesHeader, StepBar } from "../form-studio/StudioCard";
import { ControlPreview, QuestionBadge } from "../form-studio/StudioField";
import { conditionLabel, questionNumbers } from "../form-studio/studio-schema";
import { formatPercent, questionStats } from "./overview-stats";

const NO_VALUES = [];
const NO_API = {};

function RateMini({ value, grey }) {
  return (
    <span className="flex shrink-0 flex-col items-end gap-1 pt-0.5" title="Cevaplanma oranı">
      <span className="text-3xs tabular-nums text-neutral-500">{formatPercent(value)}</span>
      <span className="h-1 w-9 overflow-hidden rounded-full bg-white/5">
        <span className={`block h-full rounded-full ${grey ? "bg-neutral-600" : "bg-skylab-500/80"}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </span>
    </span>
  );
}

function SignalText({ signal }) {
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

function SummaryField({ field, number, condText, stats, isLast, phone, touch, onOpen }) {
  const props = field.props ?? {};
  const separator = field.type === "separator";
  const clickable = !touch && !separator && Boolean(onOpen);

  return (
    <div data-q={field.id} className={`relative ${!isLast && !separator ? "border-b border-white/5 pb-6" : ""}`}>
      <div onClick={clickable ? () => onOpen(field.id) : undefined}
        className={`group/q relative flex flex-col rounded-xl transition-[box-shadow,background-color] duration-150 ${phone ? "p-2" : "p-4"} ${
          clickable ? "cursor-pointer hover:ring-1 hover:ring-white/15" : ""
        }`}
      >
        {condText ? (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-skylab-400/20 bg-skylab-500/10 px-1.5 py-0.5 text-3xs text-skylab-300">
              <CornerDownRight size={10} />
              {condText}
            </span>
          </div>
        ) : null}

        {separator ? (
          <>
            <div className="flex items-center gap-3">
              {props.title ? <RichText as="p" text={props.title} className="min-w-0 max-w-[70%] wrap-break-word text-lg font-medium text-neutral-100" /> : null}
              <div className="h-px flex-1 bg-white/10" />
            </div>
            {props.description ? <RichText as="p" text={props.description} className="mt-1 text-xs text-neutral-400" /> : null}
          </>
        ) : (
          <>
            <div className="flex gap-3">
              <QuestionBadge number={number} conditional={Boolean(field.condition?.fieldId)} />
              <div className="flex w-full min-w-0 flex-col">
                <p className="text-sm font-medium text-neutral-100">
                  {props.question ? <RichText text={props.question} /> : <span className="font-normal text-neutral-500">Bu soru için metin yok</span>}
                  {props.required ? <span className="ml-1 text-red-200/70">*</span> : null}
                </p>
                {props.description ? <RichText as="p" text={props.description} className="my-1 text-xs text-neutral-400" /> : null}
              </div>
              {stats ? <RateMini value={stats.rate} grey={stats.grey} /> : null}
            </div>
            <div className="pointer-events-none select-none">
              <ControlPreview field={field} selected={false} readOnly lockedValues={NO_VALUES} api={NO_API} />
            </div>
            {stats?.signal ? (
              touch && onOpen ? (
                <button type="button" onClick={() => onOpen(field.id)}
                  className="mt-2 flex min-h-10 w-full items-center gap-1.5 rounded-lg text-left text-2xs text-neutral-500"
                >
                  <ChartColumn size={11} className="shrink-0 text-neutral-600" />
                  <span className="min-w-0 flex-1 truncate"><SignalText signal={stats.signal} /></span>
                  <span className="flex shrink-0 items-center gap-0.5 text-3xs text-neutral-400">Analitik<ChevronRight size={12} /></span>
                </button>
              ) : (
                <p className="mt-2.5 flex items-center gap-1.5 text-2xs text-neutral-500">
                  <ChartColumn size={11} className="shrink-0 text-neutral-600" />
                  <span className="min-w-0 truncate"><SignalText signal={stats.signal} /></span>
                  {clickable ? (
                    <span className="ml-auto hidden shrink-0 items-center gap-0.5 text-3xs text-neutral-500 group-hover/q:flex">Analitik<ArrowRight size={10} /></span>
                  ) : null}
                </p>
              )
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export default function OverviewCard({ form, analytics, stepInfo = null, phone = false, touch = false, onOpenQuestion }) {
  const schema = form?.schema;
  const fields = useMemo(() => (Array.isArray(schema) ? schema : []), [schema]);
  const task = form?.task?.content?.trim() ? form.task : null;
  const numbers = useMemo(() => questionNumbers(fields), [fields]);

  const statsById = useMemo(() => {
    const byId = new Map((analytics?.questions ?? []).map((q) => [q.questionId, q]));
    const total = analytics?.totalResponses ?? 0;
    const map = new Map();
    if (!analytics) return map;
    fields.forEach((field) => {
      if (field.type !== "separator") map.set(field.id, questionStats(field, byId.get(field.id), { fields, byId, total }));
    });
    return map;
  }, [analytics, fields]);

  return (
    <CardShell phone={phone} active>
      {stepInfo ? <StepBar flowName={stepInfo.flowName} stage={stepInfo.stage} total={stepInfo.total} timeLimitMinutes={form?.timeLimitMinutes} /> : null}
      <FormDisplayerHeader title={form?.title || "Adsız form"} description={form?.description ?? ""} />
      {task ? <TaskBlock task={task} title={form?.title} /> : null}
      {task && fields.length > 0 ? <DeliverablesHeader phone={phone} /> : null}

      {fields.length > 0 ? (
        <div className="flex flex-1 flex-col">
          {fields.map((field, index) => (
            <SummaryField key={field.id} field={field} number={numbers.get(field.id)} condText={conditionLabel(field, fields, numbers)}
              stats={statsById.get(field.id) ?? null} isLast={index === fields.length - 1} phone={phone} touch={touch} onOpen={onOpenQuestion}
            />
          ))}
        </div>
      ) : (
        <p className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-neutral-500">Bu formda henüz soru yok.</p>
      )}

      <div className="mt-auto border-t border-white/5 px-2 pt-6 md:px-4">
        <div className="flex justify-end">
          <span className="inline-flex min-w-30 items-center justify-center rounded-xl border-[1.5px] border-skylab-300/50 bg-skylab-400/40 px-8 py-3 text-sm font-semibold">Gönder</span>
        </div>
      </div>
    </CardShell>
  );
}
