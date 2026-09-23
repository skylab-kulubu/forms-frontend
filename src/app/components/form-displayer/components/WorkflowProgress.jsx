"use client";

import { motion } from "framer-motion";

const TONE = {
  active: { fill: "bg-skylab-500", label: "Başvurunuz devam ediyor" },
  pending: { fill: "bg-amber-400", label: "İncelemede" },
  declined: { fill: "bg-red-400", label: "Sonuçlandı" },
  done: { fill: "bg-emerald-400", label: "Tamamlandı" },
};

export function workflowProgressStatus(submissionState) {
  switch (submissionState) {
    case "pending": return "pending";
    case "declined": return "declined";
    case "completed":
    case "approved":
    case "fullyCompleted": return "done";
    default: return null;
  }
}

export default function WorkflowProgress({ stage, status = "active", answered = 0, total = 0, className = "" }) {
  const tone = TONE[status] ?? TONE.active;
  const current = Math.max(1, Number(stage) || 1);
  const isActive = status === "active";
  const continues = isActive || status === "pending";
  const fill = isActive ? (total > 0 ? Math.max(0.06, answered / total) : 0.06) : 1;
  const label = isActive && total > 0 ? `${answered}/${total} soru` : tone.label;

  return (
    <div className={`w-full ${className}`} role="group" aria-label={`Başvurunun ${current}. adımı: ${tone.label}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-3xs text-neutral-500">
        <span className="font-semibold uppercase tracking-[0.14em] text-neutral-300">Adım {current}</span>
        <span className="truncate tabular-nums">{label}</span>
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: current - 1 }, (_, index) => (
          <span key={index} className="h-1 flex-1 rounded-full bg-skylab-600" />
        ))}
        <span key={`stage-${current}`} className="relative h-1 flex-1 overflow-hidden rounded-full bg-skylab-500/25">
          <motion.span className={`absolute inset-y-0 left-0 rounded-full ${tone.fill}`}
            initial={{ width: 0 }} animate={{ width: `${fill * 100}%` }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
        </span>
        {continues && <span className="ml-1 h-0 w-10 shrink-0 border-t border-dashed border-neutral-700" />}
      </div>
    </div>
  );
}
