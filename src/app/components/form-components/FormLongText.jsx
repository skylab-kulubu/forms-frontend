"use client";

import { useState, useRef } from "react";
import { FieldShell } from "./FieldShell";
import { useProp } from "@/app/admin/components/form-editor/components/useProp";

export function CreateFormLongText({ questionNumber, props, onPropsChange, readOnly }) {
  const {prop, bind, toggle} = useProp(props, onPropsChange, readOnly);

  return (
    <FieldShell number={questionNumber} title="Uzun Yanıt" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="short-question" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <input id="short-question" type="text" {...bind("question")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="short-description" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Açıklama
        </label>
        <input id="short-description" type="text" {...bind("description")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Açıklamanızı buraya yazın."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="short-answer" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Cevap
        </label>
        <textarea id="short-answer" rows={2}
          className="block w-full resize-y rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-center text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:border-white/5 disabled:bg-neutral-900/40"
          placeholder="Cevap buraya yazılacak"
          disabled
        />
        <span className="px-0.5 text-[11px] text-neutral-500">Uzun yanıt bekleniyor</span>
      </div>
    </FieldShell>
  );
}

export function DisplayFormLongText({ question, questionNumber, description, required = false, value, onChange, missing = false }) {
  const [internalValue, setInternalValue] = useState(value ?? "");
  const currentValue = value !== undefined ? value : internalValue;
  const handleChange = onChange !== undefined ? onChange : (e) => setInternalValue(e.target.value);

  const textareaRef = useRef(null);

  const handleInput = (e) => {
    const textarea = textareaRef.current;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <div className="flex flex-col p-2 md:p-4">
        <div className="flex gap-3">
          {questionNumber != null && (
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-300">
              {questionNumber}
            </div>
          )}

          <div className="flex flex-col">
            <p className="text-sm font-medium text-neutral-100">
              {question}{" "} {required && <span className="ml-1 text-xs text-red-200/70">*</span>}
            </p>
            {description && ( <p className="my-1 text-xs text-neutral-400">{description}</p>)}
          </div>
        </div>

        <textarea name="long_text" rows={3} aria-required={required}
          value={currentValue} ref={textareaRef}
          onChange={handleChange} onInput={handleInput}
          placeholder="Cevabınızı buraya yazın."
          className={`block overflow-hidden w-full resize-y rounded-lg border bg-neutral-900/60 px-3 py-2 mt-3 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:ring-2 focus:ring-white/20 ${missing ? "border-red-400/60 focus:border-red-400/80" : "border-white/10 focus:border-white/30"}`}
        />

        {required && (
          <span className="px-0.5 text-[11px] text-neutral-500 mt-1">Zorunlu alan</span>
        )}
      </div>
    </div>
  );
}
