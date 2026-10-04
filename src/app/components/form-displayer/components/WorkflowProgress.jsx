"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { stepBarModel } from "@/lib/workflow-journey";

const STICKY_TOP = 10;
const EASE = [0.22, 1, 0.36, 1];

function Segment({ kind, fill }) {
  if (kind === "done") {
    return (
      <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-skylab-500/25">
        <motion.span className="absolute inset-0 origin-left rounded-full bg-skylab-600"
          initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.55, ease: EASE, delay: 0.1 }}
        />
      </span>
    );
  }

  if (kind === "current") {
    return (
      <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-skylab-500/25">
        <motion.span className="absolute inset-y-0 left-0 rounded-full bg-skylab-500"
          initial={{ width: 0 }} animate={{ width: `${fill}%` }} transition={{ duration: 0.5, ease: EASE, delay: 0.25 }}
        />
      </span>
    );
  }

  if (kind === "maybe") {
    return <span className="h-1 flex-1 rounded-full bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.16)_0_6px,transparent_6px_11px)]" />;
  }

  return <span className="h-1 flex-1 rounded-full bg-white/8" />;
}

function useStuck() {
  const sentinelRef = useRef(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(([entry]) => {
      setStuck(!entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0));
    }, { rootMargin: `-${STICKY_TOP + 9}px 0px 0px 0px`, threshold: [0, 1] });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return { sentinelRef, stuck };
}

function StickyShell({ zIndex, label, stuck, sentinelRef, children }) {
  return (
    <>
      <div ref={sentinelRef} aria-hidden className="-mb-6 h-px" />
      <div className="sticky top-2.5 -mx-3.5 -my-2.5" style={{ zIndex }}>
        <div role="group" aria-label={label}
          className={`rounded-2xl border px-3.5 py-2.5 transition-[background-color,border-color,box-shadow] duration-200
            ${stuck ? "border-white/10 bg-neutral-900/95 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl" : "border-transparent"}`}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export function TimerBar({ title, timer, zIndex = 30 }) {
  const { sentinelRef, stuck } = useStuck();

  return (
    <StickyShell zIndex={zIndex} label="Kalan süre" stuck={stuck} sentinelRef={sentinelRef}>
      <div className="flex items-center justify-between gap-3">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-300">{title}</span>
        {timer}
      </div>
    </StickyShell>
  );
}

export default function WorkflowProgress({ workflow, stage, formTitle, fill = 0, zIndex = 30, timer = null }) {
  const model = stepBarModel(workflow, stage);
  const { sentinelRef, stuck } = useStuck();

  const total = model.total == null ? null : model.uncertain ? `en fazla ${model.total}` : model.total;
  const label = total == null ? `Başvurunun ${model.stage}. adımı` : `Başvurunun ${model.stage}. adımı, ${total} adımdan`;

  return (
    <StickyShell zIndex={zIndex} label={label} stuck={stuck} sentinelRef={sentinelRef}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="relative h-4 min-w-0 flex-1">
          <span className={`absolute inset-0 truncate text-xs font-medium text-neutral-300 transition duration-200 ${stuck ? "-translate-y-1.5 opacity-0" : ""}`}>
            {workflow?.title}
          </span>
          <span className={`absolute inset-0 truncate text-xs font-medium text-neutral-100 transition duration-200 ${stuck ? "" : "translate-y-1.5 opacity-0"}`}>
            {formTitle}
          </span>
        </span>
        {timer}
        <span className="shrink-0 whitespace-nowrap text-3xs font-semibold uppercase tracking-[0.14em] tabular-nums text-neutral-300">
          Adım {model.stage}
          {total != null && <span className="text-neutral-500"> / {total}</span>}
        </span>
      </div>

      <div className="flex items-center gap-1">
        {model.segments.map((kind, index) => <Segment key={index} kind={kind} fill={fill} />)}
        {model.tail && <span className="ml-1 h-0 w-10 shrink-0 border-t border-dashed border-neutral-700" />}
      </div>
    </StickyShell>
  );
}
