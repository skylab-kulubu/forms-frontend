"use client";

import { useState } from "react";
import { RichText } from "@/app/components/rich-text/RichText";
import { QuestionNumber, QuestionHint } from "./QuestionParts";

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
          <QuestionNumber number={questionNumber} missing={missing} />
          <div className="flex flex-col w-full">
            <p className="text-sm font-medium text-neutral-100">
              {question ? <RichText text={question} /> : <span className="font-normal italic text-neutral-500">Bu soru için metin yok</span>} {required && <span className="ml-1 text-red-200/70">*</span>}
            </p>
            {description && ( <RichText as="p" text={description} className="my-1 text-xs text-neutral-400" />)}
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

        <QuestionHint required={required} missing={missing} className="mt-1.5" />
      </div>
    </div>
  );
}