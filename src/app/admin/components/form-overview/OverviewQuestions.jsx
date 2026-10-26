"use client";

import { useMemo } from "react";
import { CornerDownRight } from "lucide-react";
import { conditionPhrase, fieldLabel, fieldTypeOf, questionNumbers } from "../form-studio/studio-schema";
import { askedCount, formatPercent, percentOf } from "./overview-stats";

export default function OverviewQuestions({ form, analytics, onPick }) {
  const schema = form?.schema;
  const fields = useMemo(() => (Array.isArray(schema) ? schema : []), [schema]);
  const numbers = useMemo(() => questionNumbers(fields), [fields]);
  const total = analytics?.totalResponses ?? 0;
  const byId = useMemo(() => new Map((analytics?.questions ?? []).map((q) => [q.questionId, q])), [analytics]);

  const rateOf = (field) => {
    const q = byId.get(field.id);
    if (!q) return null;
    const asked = askedCount(field, fields, byId, total);
    return { value: percentOf(q.answeredCount, asked != null && asked >= q.answeredCount ? asked : total), aggregatable: q.aggregatable };
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-3">
        <span className="text-2xs font-medium text-neutral-500">Sorular</span>
        <span className="h-px flex-1 bg-white/5" />
        {analytics ? <span className="text-3xs tabular-nums text-neutral-600">{total} cevap</span> : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2 scrollbar">
        {fields.length === 0 ? <p className="px-2 py-3 text-2xs text-neutral-600">Henüz soru yok.</p> : null}
        {fields.map((field) => {
          if (field.type === "separator") {
            return (
              <button key={field.id} type="button" onClick={() => onPick(field.id)} className="flex w-full items-start gap-2 px-2 pb-1 pt-3 text-left">
                <span className="w-4 shrink-0" />
                <span className="min-w-0 truncate text-2xs font-medium text-neutral-500">{fieldLabel(field)}</span>
                <span className="mt-2 h-px flex-1 bg-white/5" />
              </button>
            );
          }

          const type = fieldTypeOf(field);
          const phrase = field.condition?.fieldId ? conditionPhrase(field.condition, fields) : null;
          const rate = rateOf(field);
          return (
            <button key={field.id} type="button" onClick={() => onPick(field.id)}
              className="group flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/4"
            >
              <span className="mt-px w-4 shrink-0 text-right text-3xs tabular-nums text-neutral-600">{numbers.get(field.id)}</span>
              <type.Icon size={13} className="mt-0.5 shrink-0 text-neutral-500" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs text-neutral-300">
                  {field.props?.question ? fieldLabel(field) : <span className="text-neutral-600">Soru metni yok</span>}
                  {field.props?.required ? <span className="ml-0.5 text-red-200/70">*</span> : null}
                </span>
                {phrase ? (
                  <span className="mt-0.5 flex min-w-0 items-center gap-1 text-3xs text-neutral-500">
                    <CornerDownRight size={10} className="shrink-0 text-skylab-400/70" />
                    <span className="truncate">{numbers.get(field.condition.fieldId)} · <span className="text-neutral-300">{phrase}</span></span>
                  </span>
                ) : null}
              </span>
              {rate ? (
                <span className={`mt-px shrink-0 text-3xs tabular-nums ${rate.aggregatable ? "text-neutral-500" : "text-neutral-600"}`}>{formatPercent(rate.value)}</span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
