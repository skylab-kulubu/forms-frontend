"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Timer, X } from "lucide-react";

const ENDED_STATES = new Set(["completed", "approved", "fullyCompleted", "declined"]);

function getCurrentStage(stage, submissionState) {
  if (submissionState === "pending") return { key: "timer", content: <Timer className="h-4 w-4" />, label: "İnceleniyor" };
  if (submissionState === "declined") return { key: "declined", content: <X className="h-4 w-4" />, label: "Reddedildi" };
  if (ENDED_STATES.has(submissionState)) return { key: "check", content: <Check className="h-4 w-4" />, label: "Tamamlandı" };
  return { key: `stage-${stage}`, content: stage, label: `${stage}. adım` };
}

function StageDot({ iconKey, pulse = false, children }) {
  return (
    <motion.span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold text-white"
      initial={false} animate={{ scale: pulse ? [1, 1.2, 1] : 1, borderColor: "#ae7eb6", backgroundColor: "#c8a4ce" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span key={iconKey} className="flex items-center justify-center" initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }} exit={{ scale: 0.5, opacity: 0, rotate: 90 }} transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          {children}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

export function FormResponseStatus({ stage, isWorkflow = false, submissionState = null }) {
  if (!isWorkflow) return null;

  const currentStage = Math.max(1, Number(stage) || 1);
  const current = getCurrentStage(currentStage, submissionState);
  const isOpenEnded = !ENDED_STATES.has(submissionState);

  return (
    <div className="w-full rounded-xl px-4 py-4">
      <ol className="flex w-full items-center" aria-label="Başvuru adımları">
        {Array.from({ length: currentStage - 1 }, (_, idx) => (
          <li key={idx} className="flex items-center">
            <StageDot iconKey="check"><Check className="h-4 w-4" /></StageDot>
            <span className="mx-2 h-0.5 w-6 rounded-full bg-skylab-600 sm:mx-4 sm:w-12" />
          </li>
        ))}
        <li className="flex min-w-0 flex-1 items-center" aria-current="step">
          <StageDot key={currentStage} iconKey={current.key} pulse>{current.content}</StageDot>
          <span className="ml-3 whitespace-nowrap text-sm font-medium text-neutral-100">{current.label}</span>
          {isOpenEnded && <span className="ml-3 h-0 flex-1 border-t border-dashed border-neutral-700 sm:ml-4" />}
        </li>
      </ol>
    </div>
  );
}
