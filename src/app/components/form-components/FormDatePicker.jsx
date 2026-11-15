"use client";

import { useMemo, useState } from "react";
import { DatePicker } from "@skylab-kulubu/skylcn-ui";
import { FieldShell } from "./FieldShell";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { CompactField } from "./CompactField";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";
import { QuestionField, pickerLabel } from "./QuestionParts";

function pad2(n) { return String(n).padStart(2, "0"); }

function toYMD(d) {
  if (!(d instanceof Date) || isNaN(d)) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYMD(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

export function CreateFormDatePicker({ questionNumber, props, onPropsChange, readOnly, compact = false, ...rest }) {
  const { prop, bind, toggle } = useProp(props, onPropsChange, readOnly);

  return (
    <FieldShell number={questionNumber} title="Tarih Seçici" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)} compact={compact} {...rest}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dp-question" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <AutoResizeTextarea id="dp-question" {...bind("question")}
          className="block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      {!compact && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="dp-description" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
            Açıklama
          </label>
          <AutoResizeTextarea id="dp-description" {...bind("description")}
            className="block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
            placeholder="Açıklamanızı buraya yazın."
          />
        </div>
      )}
    </FieldShell>
  );
}

export function DisplayFormDatePicker({ question, questionNumber, description, required = false, compact = false, value, onChange, missing = false }) {
  const [internalValue, setInternalValue] = useState(value ?? "");

  const selected = useMemo(() => parseYMD(value ?? internalValue), [value, internalValue]);

  const commit = (next) => {
    if (onChange) onChange({ target: { value: next } });
    else setInternalValue(next);
  };

  const chosen = selected?.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  const control = (
    <DatePicker value={selected} onValueChange={(date) => commit(date ? toYMD(date) : "")} placeholder="Tarih seçin"
      aria-label={pickerLabel(question, chosen)} className={missing ? "border-destructive/50" : undefined}
    />
  );

  if (compact) {
    return <CompactField question={question} required={required} missing={missing}>{control}</CompactField>;
  }

  return (
    <QuestionField question={question} questionNumber={questionNumber} description={description} required={required} missing={missing}>
      {control}
    </QuestionField>
  );
}
