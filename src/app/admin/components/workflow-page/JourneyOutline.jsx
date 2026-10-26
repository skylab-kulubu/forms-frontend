"use client";

import { CircleCheck, SlidersHorizontal, Timer } from "lucide-react";
import { isTimedNode } from "../workflow-editor/workflow-graph";
import { StepBadge } from "../form-room/RoomCanvas";
import { OutlineFooter } from "../form-room/RoomOutline";

const row = (active) => `group flex min-h-8 w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`;
const text = (active) => `min-w-0 flex-1 truncate text-xs ${active ? "text-neutral-100" : "text-neutral-400 group-hover:text-neutral-200"}`;

export default function JourneyOutline({ head, flow, counts, removed, selected, finishedCount, pill, overview, onPick, onFinished, onOps }) {
  return (
    <>
      {head}
      <div className="shrink-0 border-b border-neutral-800/60 px-1.5 pb-2 pt-2.5">
        <div className="mb-1 flex items-center gap-2 px-1.5">
          <span className="text-2xs font-medium text-neutral-500">Adımlar</span>
          <span className="h-px flex-1 bg-white/5" />
          <span title="Önceki ve sonraki adım" className="font-mono text-3xs text-neutral-600 pointer-coarse:hidden">← →</span>
        </div>
        {flow.stages.ordered.map((node) => {
          const active = selected === node.nodeKey;
          const step = counts[node.nodeKey];
          return (
            <button key={node.nodeKey} type="button" onClick={() => onPick(node.nodeKey)} aria-pressed={active} className={row(active)}>
              <StepBadge depth={flow.stages.depths.get(node.nodeKey)} isStart={node.isStart} size="md" />
              <span className={text(active)}>{node.formTitle || "Adsız form"}</span>
              {isTimedNode(node) ? <Timer size={11} className="shrink-0 text-amber-300/70" /> : null}
              {step?.awaitingReview ? <span title="Onay bekliyor" className="shrink-0 text-3xs tabular-nums text-amber-200/80">{step.awaitingReview}</span> : null}
              <span title="Bu adımda" className="w-5 shrink-0 text-right text-3xs tabular-nums text-neutral-500">{step?.count ?? ""}</span>
            </button>
          );
        })}
        <button type="button" onClick={onFinished} className={row(false)}>
          <span className="grid size-5 shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 text-neutral-400"><CircleCheck size={11} /></span>
          <span className={text(false)}>Bitenler</span>
          <span className="w-5 shrink-0 text-right text-3xs tabular-nums text-neutral-500">{finishedCount}</span>
        </button>
        {removed.map((step) => {
          const active = selected === step.nodeKey;
          return (
            <button key={step.nodeKey} type="button" onClick={() => onPick(step.nodeKey)} aria-pressed={active} className={row(active)} title="Eski sürümdeki adım">
              <span className="grid size-5 shrink-0 place-items-center rounded-md border border-dashed border-white/15 text-3xs text-neutral-500">–</span>
              <span className={text(active)}>{step.formTitle || "Adsız form"}</span>
              {step.awaitingReview ? <span className="shrink-0 text-3xs tabular-nums text-amber-200/80">{step.awaitingReview}</span> : null}
              <span className="w-5 shrink-0 text-right text-3xs tabular-nums text-neutral-500">{step.count}</span>
            </button>
          );
        })}
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-1.5 pb-2 pt-2.5 scrollbar">
        <div className="mb-1 flex items-center gap-2 px-1.5">
          <span className="text-2xs font-medium text-neutral-500">Akış</span>
          <span className="h-px flex-1 bg-white/5" />
        </div>
        <button type="button" onClick={onOps} className={row(false)}>
          <span className="grid size-5 shrink-0 place-items-center"><SlidersHorizontal size={12} className="text-neutral-500" /></span>
          <span className={text(false)}>Ayarlar</span>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-3xs text-neutral-400"><span className={`size-1.5 rounded-full ${pill.dot}`} />{pill.label}</span>
        </button>
        <p className="px-2 pt-3 text-3xs leading-relaxed text-neutral-600">Sarı sayı onay bekleyenler, gri sayı adımdaki herkes. Bir adım seçince sağdaki liste o adıma iner.</p>
      </div>
      <OutlineFooter hint="← → adım · M ya da Esc geri">
        {overview?.activeRunCount ?? 0} devam eden · {overview?.awaitingReviewCount ?? 0} onay bekliyor
      </OutlineFooter>
    </>
  );
}
