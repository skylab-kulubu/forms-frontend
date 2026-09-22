"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ClipboardCheck, PencilLine, Plus } from "lucide-react";
import { END_NODE_KEY, TRIGGER, depthMap, endNodePosition } from "../workflow-graph";

const NODE_WIDTH = 178;
const NODE_HEIGHT = 74;
const END_WIDTH = 96;
const END_HEIGHT = 28;

const EDGE_TONE = {
  [TRIGGER.SUBMITTED]: { stroke: "#525252", marker: "wf-arrow", label: "text-neutral-400 border-white/10" },
  [TRIGGER.APPROVED]: { stroke: "#34d399", marker: "wf-arrow-ok", label: "text-emerald-300 border-emerald-400/30" },
  [TRIGGER.DECLINED]: { stroke: "#f87171", marker: "wf-arrow-no", label: "text-red-300 border-red-400/30" },
};

const LABEL_T = 0.42;

function cubicPoint(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

function edgeGeometry(from, to, fromSize, toSize) {
  const p0 = { x: from.x + fromSize.width, y: from.y + fromSize.height / 2 };
  const p3 = { x: to.x, y: to.y + toSize.height / 2 };
  const dx = Math.max(40, Math.abs(p3.x - p0.x) * 0.5);
  const p1 = { x: p0.x + dx, y: p0.y };
  const p2 = { x: p3.x - dx, y: p3.y };
  const labelPoint = cubicPoint(p0, p1, p2, p3, LABEL_T);

  return {
    path: `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`,
    midX: labelPoint.x,
    midY: labelPoint.y - 12,
  };
}

export default function WorkflowCanvas({
  nodes, transitions, selectedKey, issuesByNode = {}, questionCounts = {}, name, onNameChange,
  onSelect, onMove, onAddStep, labelForTransition, span = 8, isLgUp = true, overlay = null,
}) {
  const nodeRefs = useRef({});
  const dragRef = useRef(null);
  const [liveNodes, setLiveNodes] = useState(nodes);
  const [draggingKey, setDraggingKey] = useState(null);

  const [trackedNodes, setTrackedNodes] = useState(nodes);
  if (trackedNodes !== nodes && draggingKey === null) {
    setTrackedNodes(nodes);
    setLiveNodes(nodes);
  }

  const positionOf = useCallback((nodeKey) => {
    const node = liveNodes.find((item) => item.nodeKey === nodeKey);
    return node?.position ?? { x: 0, y: 0 };
  }, [liveNodes]);

  const depths = depthMap(liveNodes, transitions);
  const endPosition = endNodePosition(liveNodes);
  const endsFlow = transitions.some((transition) => !transition.targetNodeKey);

  const contentWidth = liveNodes.reduce((max, node) => Math.max(max, (node.position?.x ?? 0) + NODE_WIDTH), 0) + (endsFlow ? END_WIDTH + 120 : 120);
  const contentHeight = liveNodes.reduce((max, node) => Math.max(max, (node.position?.y ?? 0) + NODE_HEIGHT), 0) + 80;

  const handlePointerDown = (event, nodeKey) => {
    const element = nodeRefs.current[nodeKey];
    if (!element) return;

    onSelect?.(nodeKey);

    const node = liveNodes.find((item) => item.nodeKey === nodeKey);
    const origin = { ...(node?.position ?? { x: 0, y: 0 }) };

    dragRef.current = { nodeKey, startX: event.clientX, startY: event.clientY, origin, current: origin };

    element.setPointerCapture(event.pointerId);
    setDraggingKey(nodeKey);
  };

  const handlePointerMove = (event, nodeKey) => {
    const drag = dragRef.current;
    if (!drag || drag.nodeKey !== nodeKey) return;

    const next = {
      x: Math.max(0, drag.origin.x + (event.clientX - drag.startX)),
      y: Math.max(0, drag.origin.y + (event.clientY - drag.startY)),
    };

    drag.current = next;
    setLiveNodes((current) => current.map((node) => (node.nodeKey === nodeKey ? { ...node, position: next } : node)));
  };

  const endDrag = (nodeKey) => {
    const drag = dragRef.current;
    setDraggingKey(null);
    if (!drag || drag.nodeKey !== nodeKey) return;

    dragRef.current = null;
    if (drag.current.x !== drag.origin.x || drag.current.y !== drag.origin.y) {
      onMove?.(nodeKey, drag.current);
    }
  };

  const handleKeyDown = (event, nodeKey) => {
    const deltas = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] };
    const delta = deltas[event.key];
    if (!delta) return;

    event.preventDefault();
    const position = positionOf(nodeKey);
    onMove?.(nodeKey, { x: Math.max(0, position.x + delta[0]), y: Math.max(0, position.y + delta[1]) });
  };

  const spanClass = span === 12 ? "col-span-12" : span === 11 ? "col-span-11" : "col-span-8";

  return (
    <motion.div className={`${spanClass} relative flex h-[calc(100dvh-5.5rem)] min-h-0 flex-col p-2`}
      initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
    >
      <div className="mx-auto flex h-10 w-full max-w-3xl items-center gap-2 border-b border-white/10 px-4">
        <div className="relative min-w-0 flex-1">
          <input id="workflow-title" type="text" placeholder="Yeni Akış" value={name ?? ""}
            onChange={(event) => onNameChange?.(event.target.value)}
            className="w-full bg-transparent pr-5 text-sm font-semibold leading-none tracking-wide text-neutral-200 outline-none placeholder-neutral-600"
          />
          {name?.trim() && (
            <PencilLine size={12} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-neutral-500" />
          )}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto rounded-xl border-2 border-transparent bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-local bg-size-[22px_22px] scrollbar-hidden">
        <div className="relative" style={{ width: contentWidth, height: contentHeight, minWidth: "100%", minHeight: "100%" }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <defs>
              <marker id="wf-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#525252" />
              </marker>
              <marker id="wf-arrow-ok" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#34d399" />
              </marker>
              <marker id="wf-arrow-no" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f87171" />
              </marker>
            </defs>

            {transitions.map((transition) => {
              const from = positionOf(transition.sourceNodeKey);
              const to = transition.targetNodeKey ? positionOf(transition.targetNodeKey) : endPosition;
              const toSize = transition.targetNodeKey ? { width: NODE_WIDTH, height: NODE_HEIGHT } : { width: END_WIDTH, height: END_HEIGHT };
              const tone = EDGE_TONE[transition.trigger] ?? EDGE_TONE[TRIGGER.SUBMITTED];
              const geometry = edgeGeometry(from, to, { width: NODE_WIDTH, height: NODE_HEIGHT }, toSize);

              return (
                <path key={transition.localId} d={geometry.path} fill="none" stroke={tone.stroke}
                  strokeWidth={transition.condition ? 1.5 : 1.2} strokeDasharray={transition.condition ? undefined : "4 4"}
                  markerEnd={`url(#${tone.marker})`}
                />
              );
            })}
          </svg>

          {transitions.map((transition) => {
            const from = positionOf(transition.sourceNodeKey);
            const to = transition.targetNodeKey ? positionOf(transition.targetNodeKey) : endPosition;
            const toSize = transition.targetNodeKey ? { width: NODE_WIDTH, height: NODE_HEIGHT } : { width: END_WIDTH, height: END_HEIGHT };
            const tone = EDGE_TONE[transition.trigger] ?? EDGE_TONE[TRIGGER.SUBMITTED];
            const geometry = edgeGeometry(from, to, { width: NODE_WIDTH, height: NODE_HEIGHT }, toSize);
            const label = labelForTransition?.(transition) ?? "";

            if (!label) return null;

            return (
              <span key={`${transition.localId}-label`}
                className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 truncate rounded-[5px] border bg-neutral-900 px-1.5 py-px text-3xs ${tone.label} ${transition.condition ? "" : "italic"}`}
                style={{ left: geometry.midX, top: geometry.midY, maxWidth: 150 }}
              >
                {label}
              </span>
            );
          })}

          {liveNodes.map((node) => {
            const issues = issuesByNode[node.nodeKey] ?? [];
            const isSelected = node.nodeKey === selectedKey;
            const depth = depths.get(node.nodeKey);

            return (
              <div key={node.nodeKey} ref={(element) => { nodeRefs.current[node.nodeKey] = element; }}
                data-node={node.nodeKey} role="button" tabIndex={0} aria-pressed={isSelected}
                onPointerDown={(event) => handlePointerDown(event, node.nodeKey)}
                onPointerMove={(event) => handlePointerMove(event, node.nodeKey)}
                onPointerUp={() => endDrag(node.nodeKey)}
                onPointerCancel={() => endDrag(node.nodeKey)}
                onKeyDown={(event) => handleKeyDown(event, node.nodeKey)}
                className={`absolute w-[178px] cursor-grab touch-none select-none rounded-lg border bg-neutral-800/90 px-2.5 py-2 shadow-lg transition-colors active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${
                  issues.length > 0 ? "border-red-400/50" : isSelected ? "border-skylab-400/55 ring-1 ring-skylab-400/25" : "border-white/10 hover:border-white/20"
                }`}
                style={{ left: node.position?.x ?? 0, top: node.position?.y ?? 0 }}
              >
                <div className="flex items-center gap-1.5">
                  {node.isStart
                    ? <span title="Başlangıç adımı" className="size-1.5 shrink-0 rounded-full bg-skylab-500" />
                    : <span className="rounded border border-white/10 px-1 text-4xs leading-3.5 text-neutral-500 tabular-nums">{depth ?? "?"}</span>}
                  <span className="truncate text-xs font-semibold text-neutral-100">{node.formTitle}</span>
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-3xs text-neutral-500">
                  <span>{questionCounts[node.formId] ?? "?"} soru</span>
                  <span className="text-neutral-700">·</span>
                  {node.requiresManualReview
                    ? <span className="inline-flex items-center gap-1 text-amber-300"><ClipboardCheck size={9} />manuel onay</span>
                    : <span>onay yok</span>}
                </div>

                <div className="mt-1.5 border-t border-white/5 pt-1 text-3xs text-neutral-400">
                  {node.requiresManualReview ? "Onay / red" : "Gönderildiğinde"}
                </div>

                <span className="absolute -left-1 top-1/2 size-2 -translate-y-1/2 rounded-full border-[1.5px] border-neutral-600 bg-neutral-800" />
                <span className="absolute -right-1 top-1/2 size-2 -translate-y-1/2 rounded-full border-[1.5px] border-skylab-700 bg-neutral-800" />
              </div>
            );
          })}

          {endsFlow && (
            <span key={END_NODE_KEY} data-node={END_NODE_KEY}
              className="absolute inline-flex items-center rounded-lg border border-dashed border-neutral-700 px-2.5 py-1 text-2xs text-neutral-500"
              style={{ left: endPosition.x, top: endPosition.y }}
            >
              Akış biter
            </span>
          )}

          {liveNodes.length === 0 && (
            <div className="absolute inset-0 grid place-items-center">
              <button type="button" onClick={onAddStep} data-node="empty"
                className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 px-8 py-7 text-center transition-colors hover:border-skylab-400/40 hover:bg-white/3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
              >
                <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/3 text-neutral-500">
                  <Plus size={18} />
                </span>
                <span className="space-y-1">
                  <span className="block text-sm font-medium text-neutral-200">İlk adımı ekleyin</span>
                  <span className="block text-2xs text-neutral-500">
                    {isLgUp ? "Akışın başlangıç formunu seçerek başlayın." : "Adım panelini açıp başlangıç formunu seçin."}
                  </span>
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {overlay && <div className="absolute inset-x-4 bottom-4 z-20">{overlay}</div>}
    </motion.div>
  );
}
