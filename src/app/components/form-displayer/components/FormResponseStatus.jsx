"use client";

import { Check, Timer, X } from "lucide-react";

const steps = [
  { key: "parent", label: "Ana Form" },
  { key: "child", label: "Bağlantılı Form" },
  { key: "completed", label: "Tamamlandı" },
];

export function FormResponseStatus({ step, status }) {
  const currentStep = Number.isFinite(Number(step)) ? Number(step) : 0;

  if (currentStep <= 0) return null;

  const activeIndex = Math.min(currentStep - 1, steps.length - 1);

  return (
    <div className="w-full rounded-xl px-4 py-4">
      <ol className="flex w-full items-center justify-between">
        {steps.map((step, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          const isOn = isActive || isCompleted;
          const isLastStep = idx === steps.length - 1;

          return (
            <li key={step.key} className={`flex items-center ${isLastStep ? "w-auto" : "w-full"}`}>
              <div className="flex items-center gap-3 relative">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300 text-white ${ isOn ? "border-indigo-500 bg-indigo-400" : "border-neutral-700 bg-neutral-900 text-neutral-500" }`}>
                  {isCompleted || (isActive && isLastStep && currentStep === 3) ? ( <Check className="h-4 w-4" /> ) : (isActive && status === 10) ? ( <Timer className="h-4 w-4" /> ) : (isActive && status === 21) ? (<X className="h-4 w-4"/>) : ( idx + 1 )}
                </span>
                <span className={`whitespace-nowrap text-sm font-medium transition-colors ${ isOn ? "text-neutral-100" : "text-neutral-500"} ${ isActive ? "block" : "hidden sm:block" }`}>
                  {step.label}
                </span>
              </div>
              {!isLastStep && (
                <div className="flex-1 mx-2 sm:mx-4">
                   <div className={`h-0.5 w-full rounded-full transition-all duration-500 ${ isCompleted ? "bg-indigo-400" : "bg-neutral-800" }`}/>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}