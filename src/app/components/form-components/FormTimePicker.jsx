"use client";

import { useState } from "react";
import { TimePicker } from "@skylab-kulubu/skylcn-ui";
import { FieldShell } from "./FieldShell";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { CompactField } from "./CompactField";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";
import { QuestionField, pickerLabel } from "./QuestionParts";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseTime(str) {
  if (!str || typeof str !== "string") return null;
  const m = str.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

function formatTime24({ h, m }) {
  return `${pad2(h)}:${pad2(m)}`;
}

export function CreateFormTimePicker({ questionNumber, props, onPropsChange, readOnly, compact = false, ...rest }) {
  const {prop, bind, toggle} = useProp(props, onPropsChange, readOnly);

  return (
    <FieldShell number={questionNumber} title="Zaman Seçici" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)} compact={compact} {...rest}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tp-question" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <AutoResizeTextarea id="tp-question" {...bind("question")}
          className="block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      {!compact && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="tp-description" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
            Açıklama
          </label>
          <AutoResizeTextarea id="tp-description" {...bind("description")}
            className="block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
            placeholder="Açıklamanızı buraya yazın."
          />
        </div>
      )}
    </FieldShell>
  );
}

export function DisplayFormTimePicker({ question, questionNumber, description, required = false, compact = false, value, onChange, missing = false }) {
  const [internalValue, setInternalValue] = useState(value ?? "");

  const currentValue = value !== undefined ? (value ?? "") : internalValue;
  const parsed = parseTime(currentValue);
  const chosen = parsed ? formatTime24(parsed) : null;

  const commit = (nextStr) => {
    if (onChange) onChange({ target: { value: nextStr } });
    else setInternalValue(nextStr);
  };

  const control = (
    <TimePicker value={chosen} onValueChange={(next) => commit(next ?? "")} minuteStep={5} placeholder="Saat seçin"
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
