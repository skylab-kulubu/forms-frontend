"use client";

import { useState } from "react";
import { FieldShell } from "./FieldShell";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";

export function CreateFormSlider({ questionNumber, props, onPropsChange, readOnly, ...rest }) {
  const { prop, bind, toggle } = useProp(props, onPropsChange, readOnly);

  const min = prop.min ?? 0;
  const max = prop.max ?? 100;

  return (
    <FieldShell number={questionNumber} title="Aralık" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)} {...rest}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="slider-question" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <input id="slider-question" type="text" {...bind("question")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="slider-description" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Açıklama
        </label>
        <input id="slider-description" type="text" {...bind("description")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Açıklamanızı buraya yazın."
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Min. Değer</label>
          <input type="number" {...bind("min")}
            className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-white/30"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Max. Değer</label>
          <input type="number" {...bind("max")}
            className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-white/30"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Artış (Step)</label>
          <input type="number" {...bind("step")}
            className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 outline-none transition focus:border-white/30"
          />
        </div>
      </div>
    </FieldShell>
  );
}

export function DisplayFormSlider({ question, questionNumber, description, required = false, min = 0, max = 100, step = 1, value, onChange, missing = false }) {
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : (Number(min) + (Number(max) - Number(min)) / 2));
  const currentValue = value !== undefined ? value : internalValue;
  const optionBorderClass = missing ? "border-red-400/60" : "border-white/10";

  const commit = (next) => {
    if (onChange) {
      onChange({ target: { value: next } });
    } else {
      setInternalValue(next);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <div className="flex flex-col p-2 md:p-4">
        
        <div className="flex gap-3">
          {questionNumber != null && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-300">
              {questionNumber}
            </div>
          )}
          <div className="flex flex-col w-full">
            <p className="text-sm font-medium text-neutral-100">
              {question} {required && <span className="ml-1 text-red-200/70">*</span>}
            </p>
            {description && ( <p className="my-1 text-xs text-neutral-400">{description}</p>)}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2">
          <div className={`flex items-center gap-4 w-full rounded-lg border ${optionBorderClass} bg-neutral-900/60 px-4 py-2.5`}>
            <span className="text-xs font-medium text-neutral-500 w-6 text-right shrink-0">{min}</span>
            
            <input type="range" min={min} max={max} step={step} value={currentValue} onChange={(e) => commit(Number(e.target.value))}
              className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-pink-400/40 hover:accent-pink-300 transition-all"
            />
            
            <span className="text-xs font-medium text-neutral-500 w-6 text-left shrink-0">{max}</span>
            
            <div className="w-px h-5 bg-white/10 mx-1 shrink-0"></div>
            
            <div className="flex items-center justify-center min-w-10 shrink-0">
              <span className="text-sm text-neutral-200">{currentValue}</span>
            </div>
          </div>
        </div>

        {required && <span className="px-0.5 text-[11px] text-neutral-500 mt-1.5">Zorunlu alan</span>}
      </div>
    </div>
  );
}