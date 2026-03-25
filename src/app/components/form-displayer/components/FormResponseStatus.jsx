"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Timer, X } from "lucide-react";
import { FORM_ACCESS_STATUS } from "../../FormStatusHandler";

const steps = [
  { key: "parent", label: "Ana Form" },
  { key: "child", label: "Bağlantılı Form" },
  { key: "completed", label: "Tamamlandı" },
];

function StepIcon({ isCompleted, isActive, isLastStep, currentStep, status, index }) {
  let iconKey = "number";
  let content = index + 1;

  if (isCompleted || (isActive && isLastStep && currentStep >= 5)) {
    iconKey = "check";
    content = <Check className="h-4 w-4" />;
  } else if (isActive && status === FORM_ACCESS_STATUS.PENDING_APPROVAL) {
    iconKey = "timer";
    content = <Timer className="h-4 w-4" />;
  } else if (isActive && status === FORM_ACCESS_STATUS.DECLINED) {
    iconKey = "declined";
    content = <X className="h-4 w-4" />;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.span key={iconKey} className="flex items-center justify-center" initial={{ scale: 0.5, opacity: 0, rotate: -90 }} 
        animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.5, opacity: 0, rotate: 90 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}
      >
        {content}
      </motion.span>
    </AnimatePresence>
  );
}

export function FormResponseStatus({ step, status }) {
  const currentStep = Number.isFinite(Number(step)) ? Number(step) : 0;

  const isVisible = currentStep > 0;
  const activeIndex = currentStep <= 2 ? 0 : currentStep <= 4 ? 1 : 2;

  return (
    <div className={`w-full rounded-xl px-4 py-4 ${!isVisible ? "invisible" : ""}`} aria-hidden={!isVisible || undefined}>
      <ol className="flex w-full items-center justify-between">
        {steps.map((s, idx) => {
          const isCompleted = idx < activeIndex;
          const isActive = idx === activeIndex;
          const isOn = isActive || isCompleted;
          const isLastStep = idx === steps.length - 1;

          return (
            <li key={s.key} className={`flex items-center ${isLastStep ? "w-auto" : "w-full"}`}>
              <div className="flex items-center gap-3 relative">
                <motion.span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold text-white ${isOn ? "border-indigo-500 bg-indigo-400" : "border-neutral-700 bg-neutral-900 text-neutral-500"}`}
                  animate={isOn ? { scale: [1, 1.2, 1], borderColor: "rgb(99 102 241)", backgroundColor: "rgb(129 140 248)" } : { scale: 1, borderColor: "rgb(64 64 64)", backgroundColor: "rgb(23 23 23)" }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <StepIcon isCompleted={isCompleted} isActive={isActive} isLastStep={isLastStep} currentStep={currentStep} status={status} index={idx}/>
                </motion.span>
                <span className={`whitespace-nowrap text-sm font-medium transition-colors duration-300 ${isOn ? "text-neutral-100" : "text-neutral-500"} ${isActive ? "block" : "hidden sm:block"}`}>
                  {s.label}
                </span>
              </div>
              {!isLastStep && (
                <div className="flex-1 mx-2 sm:mx-4">
                  <div className="relative h-0.5 w-full rounded-full bg-neutral-800 overflow-hidden">
                    <motion.div className="absolute inset-y-0 left-0 rounded-full bg-indigo-400"
                      initial={false} animate={{ width: isCompleted ? "100%" : "0%" }} transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                    />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}