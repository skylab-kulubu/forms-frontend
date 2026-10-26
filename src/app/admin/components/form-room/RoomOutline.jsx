"use client";

import { Timer, Workflow } from "lucide-react";
import { isTimedNode } from "../workflow-editor/workflow-graph";
import { StepBadge } from "./RoomCanvas";
import { sameId } from "./room-flow";

export function RoomSteps({ flow, activeFormId, countOf = () => null, keysHint = true, onPick, onFlow }) {
  return (
    <div className="shrink-0 border-b border-neutral-800/60 px-1.5 pb-2 pt-2.5">
      <div className="mb-1 flex items-center gap-2 px-1.5">
        <span className="text-2xs font-medium text-neutral-500">Adımlar</span>
        <span className="h-px flex-1 bg-white/5" />
        {keysHint ? <span title="Önceki ve sonraki adım" className="font-mono text-3xs text-neutral-600 pointer-coarse:hidden">← →</span> : null}
        <button type="button" title="Akışta gör (M)" onClick={onFlow}
          className="flex h-6 items-center gap-1 rounded px-1.5 text-3xs text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
        >
          <Workflow size={12} />
          Akış
        </button>
      </div>
      {flow.stages.ordered.map((node) => {
        const active = sameId(node.formId, activeFormId);
        const count = countOf(node);
        return (
          <button key={node.nodeKey} type="button" onClick={() => onPick(node.formId)} aria-current={active ? "step" : undefined}
            className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
          >
            <StepBadge depth={flow.stages.depths.get(node.nodeKey)} isStart={node.isStart} size="md" />
            <span className={`min-w-0 flex-1 truncate text-xs transition-colors ${active ? "text-neutral-100" : "text-neutral-400 group-hover:text-neutral-200"}`}>
              {node.formTitle || "Adsız form"}
            </span>
            {isTimedNode(node) ? <Timer size={11} className="shrink-0 text-amber-300/70" /> : null}
            {count ? (
              <span className={`flex shrink-0 items-center gap-1 text-3xs tabular-nums ${count.tone ?? "text-neutral-600"}`}>
                {count.dot ? <span className={`size-1 rounded-full ${count.dot}`} /> : null}
                {count.text}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function OutlineFooter({ children, hint = null }) {
  return (
    <div className="shrink-0 border-t border-neutral-800 px-3 py-2.5 text-3xs leading-relaxed text-neutral-600">
      {children}
      {hint ? <span className="block pointer-coarse:hidden">{hint}</span> : null}
    </div>
  );
}
