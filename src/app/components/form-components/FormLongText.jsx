"use client";

import { useState } from "react";
import { Textarea } from "@skylab-kulubu/skylcn-ui";
import { FieldShell } from "./FieldShell";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { CompactField } from "./CompactField";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";
import { QuestionField } from "./QuestionParts";

// field-sizing grows the box where it is supported; this keeps it growing in browsers without it
function growToContent(event) {
  const box = event.currentTarget;
  box.style.height = "auto";
  box.style.height = `${box.scrollHeight + box.offsetHeight - box.clientHeight}px`;
}

export function CreateFormLongText({ questionNumber, props, onPropsChange, readOnly, compact = false, ...rest }) {
  const {prop, bind, toggle} = useProp(props, onPropsChange, readOnly);

  return (
    <FieldShell number={questionNumber} title="Uzun Yanıt" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)} compact={compact} {...rest}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="short-question" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <AutoResizeTextarea id="short-question" {...bind("question")}
          className="block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      {!compact && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="short-description" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
            Açıklama
          </label>
          <AutoResizeTextarea id="short-description" {...bind("description")}
            className="block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
            placeholder="Açıklamanızı buraya yazın."
          />
        </div>
      )}
    </FieldShell>
  );
}

export function DisplayFormLongText({ question, questionNumber, description, required = false, compact = false, value, onChange, missing = false }) {
  const [internalValue, setInternalValue] = useState(value ?? "");
  const currentValue = value !== undefined ? value : internalValue;
  const handleChange = onChange !== undefined ? onChange : (e) => setInternalValue(e.target.value);

  const control = (
    <Textarea name="long_text" rows={3} aria-required={required || undefined}
      value={currentValue ?? ""} onChange={handleChange} onInput={growToContent}
      placeholder="Cevabınızı buraya yazın."
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
