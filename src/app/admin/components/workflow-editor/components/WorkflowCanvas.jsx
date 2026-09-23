"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, PencilLine, Plus, X } from "lucide-react";
import { TRIGGER, connectionError, depthMap, groupTransitions, triggersForNode } from "../workflow-graph";

const NODE_WIDTH = 212;
const HEAD_HEIGHT = 42;
const ROW_HEIGHT = 30;
const BORDER = 1;
const PORT_GAP = 6;
const TERMINAL_GAP = 30;
const LABEL_T = 0.42;
const TOAST_MS = 2000;

const TRIGGER_ROW = {
  [TRIGGER.SUBMITTED]: { label: "Gönderilince", Icon: ArrowRight, icon: "text-neutral-500", port: "border-neutral-500", stroke: "#595959", edgeLabel: "text-neutral-400 border-white/10" },
  [TRIGGER.APPROVED]: { label: "Onaylanınca", Icon: Check, icon: "text-emerald-400", port: "border-emerald-400/80", stroke: "rgba(52,211,153,0.7)", edgeLabel: "text-emerald-300 border-emerald-400/30" },
  [TRIGGER.DECLINED]: { label: "Reddedilince", Icon: X, icon: "text-red-400", port: "border-red-400/80", stroke: "rgba(248,113,113,0.7)", edgeLabel: "text-red-300 border-red-400/30" },
};

function cubicPoint({ p0, p1, p2, p3 }, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

function curve(p0, p3) {
  const dx = Math.max(36, Math.abs(p3.x - p0.x) * 0.5);
  return { p0, p1: { x: p0.x + dx, y: p0.y }, p2: { x: p3.x - dx, y: p3.y }, p3 };
}

function pathOf({ p0, p1, p2, p3 }) {
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
}

function positionOf(node) {
  return node?.position ?? { x: 0, y: 0 };
}

function portPosition(node, trigger) {
  const index = Math.max(0, triggersForNode(node).indexOf(trigger));
  const position = positionOf(node);
  return { x: position.x + NODE_WIDTH, y: position.y + BORDER + HEAD_HEIGHT + ROW_HEIGHT * index + ROW_HEIGHT / 2 };
}

function inputPosition(node) {
  const position = positionOf(node);
  return { x: position.x, y: position.y + BORDER + HEAD_HEIGHT / 2 };
}

function nodeHeight(node) {
  return HEAD_HEIGHT + ROW_HEIGHT * triggersForNode(node).length + BORDER * 2;
}

function terminalLabel(group, ending, labelForTransition) {
  if (ending.length === group.length) return "";
  if (ending.length > 1) return `${ending.length} yol`;
  const [route] = ending;
  return route.condition ? labelForTransition?.(route) ?? "" : "aksi halde";
}

export default function WorkflowCanvas({
  nodes, transitions, selectedKey, issuesByNode = {}, questionCounts = {}, loadingFormIds = null, name, onNameChange,
  onSelect, onMove, onAddStep, onConnect, onFocusRoute, onFocusPort, highlightedRouteId = null, labelForTransition,
  span = 8, isLgUp = true, overlay = null,
}) {
  const contentRef = useRef(null);
  const dragRef = useRef(null);
  const toastTimer = useRef(null);

  const [liveNodes, setLiveNodes] = useState(nodes);
  const [draggingKey, setDraggingKey] = useState(null);
  const [ghost, setGhost] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const [trackedNodes, setTrackedNodes] = useState(nodes);
  if (trackedNodes !== nodes && draggingKey === null) {
    setTrackedNodes(nodes);
    setLiveNodes(nodes);
  }

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const nodeByKey = useCallback((nodeKey) => liveNodes.find((node) => node.nodeKey === nodeKey) ?? null, [liveNodes]);

  const showToast = (message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  };

  const pointFromEvent = (event) => {
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const nodeKeyAt = (event) => document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-node-key]")?.dataset.nodeKey ?? null;

  const depths = depthMap(liveNodes, transitions);

  const contentWidth = liveNodes.reduce((max, node) => Math.max(max, positionOf(node).x + NODE_WIDTH), 0) + 200;
  const contentHeight = liveNodes.reduce((max, node) => Math.max(max, positionOf(node).y + nodeHeight(node)), 0) + 80;

  const handlePointerDown = (event, nodeKey) => {
    const element = event.currentTarget;
    const port = event.target.closest("[data-port]");

    if (port) {
      const trigger = Number(port.dataset.trigger);
      const start = portPosition(nodeByKey(nodeKey), trigger);
      dragRef.current = { type: "connect", nodeKey, trigger };
      setGhost({ from: start, to: { x: start.x + PORT_GAP, y: start.y } });
      element.setPointerCapture(event.pointerId);
      event.preventDefault();
      return;
    }

    onSelect?.(nodeKey);
    if (!event.target.closest("[data-drag-handle]")) return;

    const origin = { ...positionOf(nodeByKey(nodeKey)) };
    dragRef.current = { type: "move", nodeKey, startX: event.clientX, startY: event.clientY, origin, current: origin };
    element.setPointerCapture(event.pointerId);
    setDraggingKey(nodeKey);
  };

  const handlePointerMove = (event) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.type === "connect") {
      const point = pointFromEvent(event);
      setGhost((current) => (current ? { ...current, to: point } : current));
      const overKey = nodeKeyAt(event);
      setDropTarget(overKey && overKey !== drag.nodeKey
        ? { nodeKey: overKey, error: connectionError(drag.nodeKey, overKey, liveNodes, transitions) }
        : null);
      return;
    }

    const next = {
      x: Math.max(0, drag.origin.x + (event.clientX - drag.startX)),
      y: Math.max(0, drag.origin.y + (event.clientY - drag.startY)),
    };
    drag.current = next;
    setLiveNodes((current) => current.map((node) => (node.nodeKey === drag.nodeKey ? { ...node, position: next } : node)));
  };

  const handlePointerUp = (event) => {
    const drag = dragRef.current;
    dragRef.current = null;
    if (!drag) return;

    if (drag.type === "connect") {
      setGhost(null);
      setDropTarget(null);
      if (event.type === "pointercancel") return;

      const overKey = nodeKeyAt(event);
      const inSurface = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-canvas-surface]");
      let result = null;
      if (overKey && overKey !== drag.nodeKey) result = onConnect?.(drag.nodeKey, drag.trigger, overKey);
      else if (!overKey && inSurface) result = onConnect?.(drag.nodeKey, drag.trigger, null);
      if (result && !result.ok) showToast(result.reason);
      return;
    }

    setDraggingKey(null);
    if (drag.current.x !== drag.origin.x || drag.current.y !== drag.origin.y) {
      onMove?.(drag.nodeKey, drag.current);
    }
  };

  const handleKeyDown = (event, nodeKey) => {
    const deltas = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] };
    const delta = deltas[event.key];
    if (!delta) return;

    event.preventDefault();
    const position = positionOf(nodeByKey(nodeKey));
    onMove?.(nodeKey, { x: Math.max(0, position.x + delta[0]), y: Math.max(0, position.y + delta[1]) });
  };

  const edges = [];
  const labels = [];
  const terminals = [];

  liveNodes.forEach((node) => {
    triggersForNode(node).forEach((trigger) => {
      const style = TRIGGER_ROW[trigger] ?? TRIGGER_ROW[TRIGGER.SUBMITTED];
      const group = groupTransitions(transitions, node.nodeKey, trigger);
      const hasConditional = group.some((transition) => transition.condition);
      const port = portPosition(node, trigger);
      const ending = group.filter((transition) => !transition.targetNodeKey);

      if (group.length === 0 || ending.length > 0) {
        const route = ending[0] ?? null;
        const focusId = route ? route.localId : node.nodeKey === selectedKey ? `implicit-${trigger}` : null;
        terminals.push({
          key: `${node.nodeKey}:${trigger}`,
          nodeKey: node.nodeKey,
          trigger,
          route,
          implicit: group.length === 0,
          x: port.x + TERMINAL_GAP,
          y: port.y,
          fromX: port.x + PORT_GAP,
          stroke: style.stroke,
          label: route ? terminalLabel(group, ending, labelForTransition) : "",
          isHighlighted: Boolean(highlightedRouteId) && focusId === highlightedRouteId,
        });
      }

      group.forEach((transition) => {
        if (!transition.targetNodeKey) return;
        const target = nodeByKey(transition.targetNodeKey);
        if (!target) return;

        const shape = curve({ x: port.x + PORT_GAP, y: port.y }, inputPosition(target));
        const kind = transition.condition ? "cond" : hasConditional ? "fallback" : "always";
        const isHighlighted = highlightedRouteId === transition.localId;
        edges.push({ id: transition.localId, d: pathOf(shape), stroke: style.stroke, dashed: kind === "fallback", isHighlighted });

        if (kind !== "always") {
          const point = cubicPoint(shape, LABEL_T);
          labels.push({
            id: transition.localId,
            x: point.x,
            y: point.y - 11,
            text: kind === "cond" ? labelForTransition?.(transition) ?? "" : "aksi halde",
            italic: kind === "fallback",
            tone: isHighlighted ? "text-skylab-300 border-skylab-400/50" : style.edgeLabel,
          });
        }
      });
    });
  });

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

      <div data-canvas-surface className="relative min-h-0 flex-1 overflow-auto rounded-xl border-2 border-transparent bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-local bg-size-[22px_22px] scrollbar-hidden">
        <div ref={contentRef} className="relative" style={{ width: contentWidth, height: contentHeight, minWidth: "100%", minHeight: "100%" }}>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            {terminals.map((terminal) => (
              <path key={`line-${terminal.key}`} d={`M ${terminal.fromX} ${terminal.y} L ${terminal.x} ${terminal.y}`} fill="none"
                stroke={terminal.stroke} strokeWidth={1.4} strokeDasharray={terminal.implicit ? "3 3" : undefined} opacity={terminal.implicit ? 0.5 : 1}
              />
            ))}

            {edges.map((edge) => (
              <g key={edge.id}>
                <path d={edge.d} fill="none" stroke="transparent" strokeWidth={14} className="cursor-pointer" style={{ pointerEvents: "stroke" }}
                  onClick={() => onFocusRoute?.(edge.id)}
                />
                <path d={edge.d} fill="none" stroke={edge.isHighlighted ? "#ebd5ee" : edge.stroke} strokeWidth={edge.isHighlighted ? 2.4 : 1.5}
                  strokeDasharray={edge.dashed ? "4 4" : undefined} className="transition-[stroke-width] duration-150"
                />
              </g>
            ))}

            {ghost && (
              <path d={pathOf(curve({ x: ghost.from.x + PORT_GAP, y: ghost.from.y }, ghost.to))} fill="none"
                stroke={dropTarget?.error ? "#f87171" : "#ebd5ee"} strokeWidth={1.5} strokeDasharray="5 4"
              />
            )}
          </svg>

          {labels.map((label) => (
            <button key={`label-${label.id}`} type="button" onClick={() => onFocusRoute?.(label.id)}
              className={`absolute -translate-x-1/2 -translate-y-1/2 truncate rounded-[5px] border bg-neutral-900 px-1.5 py-px text-3xs transition-colors hover:border-white/25 hover:text-neutral-100 ${label.tone} ${label.italic ? "italic" : ""}`}
              style={{ left: label.x, top: label.y, maxWidth: 160 }}
            >
              {label.text}
            </button>
          ))}

          {terminals.map((terminal) => (
            <button key={`terminal-${terminal.key}`} type="button"
              onClick={() => (terminal.route ? onFocusRoute?.(terminal.route.localId) : onFocusPort?.(terminal.nodeKey, terminal.trigger))}
              title={terminal.implicit ? "Bu çıkışta yönlendirme yok; akış burada biter" : "Akış biter"}
              className={`absolute inline-flex h-5.5 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-md border border-dashed bg-neutral-900 px-2 text-3xs transition-colors ${
                terminal.isHighlighted ? "border-skylab-400/60 text-skylab-300"
                  : "border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
              } ${terminal.implicit && !terminal.isHighlighted ? "opacity-60" : ""}`}
              style={{ left: terminal.x, top: terminal.y }}
            >
              <span className="size-1.5 rounded-xs bg-neutral-600" />
              {terminal.implicit ? "biter" : "Akış biter"}
              {terminal.label ? <span className="max-w-32 truncate text-neutral-600">· {terminal.label}</span> : null}
            </button>
          ))}

          {liveNodes.map((node) => {
            const issues = issuesByNode[node.nodeKey] ?? [];
            const isSelected = node.nodeKey === selectedKey;
            const isDropTarget = dropTarget?.nodeKey === node.nodeKey;
            const depth = depths.get(node.nodeKey);
            const position = positionOf(node);

            return (
              <div key={node.nodeKey} data-node-key={node.nodeKey} role="button" tabIndex={0} aria-pressed={isSelected} aria-label={node.formTitle}
                onPointerDown={(event) => handlePointerDown(event, node.nodeKey)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onKeyDown={(event) => handleKeyDown(event, node.nodeKey)}
                className={`absolute w-53 touch-none select-none rounded-xl border bg-neutral-900 shadow-lg shadow-black/30 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${
                  isDropTarget ? (dropTarget.error ? "border-red-400/60 ring-2 ring-red-400/15" : "border-skylab-400/60 ring-2 ring-skylab-400/20")
                    : issues.length > 0 ? "border-red-400/50"
                    : isSelected ? "border-skylab-400/45 ring-1 ring-skylab-400/20"
                    : "border-white/10 hover:border-white/15"
                }`}
                style={{ left: position.x, top: position.y }}
              >
                {!node.isStart && (
                  <span className="absolute -left-1.25 top-5.25 size-2.25 -translate-y-1/2 rounded-full border-[1.5px] border-neutral-600 bg-neutral-900" />
                )}

                <div data-drag-handle className="flex h-10.5 cursor-grab items-center gap-2.5 border-b border-white/5 px-3 active:cursor-grabbing">
                  <span title={node.isStart ? "Başlangıç adımı" : depth ? undefined : "Başlangıçtan ulaşılamıyor"}
                    className={`grid size-6 shrink-0 place-items-center rounded-md border text-xs font-semibold ${
                      node.isStart ? "border-skylab-400/40 bg-skylab-500/10 text-skylab-300" : "border-white/10 bg-white/5 text-neutral-400"
                    }`}
                  >
                    {node.isStart ? 1 : depth ?? "?"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-200">{node.formTitle}</span>
                  {loadingFormIds?.has(node.formId)
                    ? <span aria-hidden="true" className="shimmer h-2.5 w-9 shrink-0 rounded" />
                    : <span className="shrink-0 text-3xs text-neutral-500">{questionCounts[node.formId] ?? "?"} soru</span>}
                </div>

                {triggersForNode(node).map((trigger, index) => {
                  const style = TRIGGER_ROW[trigger] ?? TRIGGER_ROW[TRIGGER.SUBMITTED];
                  const Icon = style.Icon;
                  return (
                    <div key={trigger} className={`relative flex h-7.5 items-center gap-1.5 px-3 text-2xs text-neutral-400 ${index > 0 ? "border-t border-dashed border-white/5" : ""}`}>
                      <Icon size={11} className={`shrink-0 ${style.icon}`} />
                      {style.label}
                      <span data-port data-trigger={trigger} title="Sürükleyip bir adıma bağla"
                        className={`absolute -right-1.5 top-1/2 size-2.75 -translate-y-1/2 cursor-crosshair rounded-full border-[1.5px] bg-neutral-900 transition-transform hover:scale-125 ${style.port}`}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}

          {liveNodes.length === 0 && (
            <div className="absolute inset-0 grid place-items-center">
              <button type="button" onClick={onAddStep}
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

      {liveNodes.length > 1 && !overlay && (
        <span className="pointer-events-none absolute bottom-5 left-5 hidden text-3xs text-neutral-600 lg:block">
          Adımın sağındaki noktadan sürükle: bir adıma bırakırsan bağlanır, boşluğa bırakırsan akış biter
        </span>
      )}

      {toast && (
        <div role="status" className="pointer-events-none absolute left-1/2 top-14 z-30 -translate-x-1/2 rounded-lg border border-red-400/30 bg-[#1f1414] px-3 py-1.5 text-2xs text-red-200 shadow-xl">
          {toast}
        </div>
      )}

      {overlay && <div className="absolute inset-x-4 bottom-4 z-20">{overlay}</div>}
    </motion.div>
  );
}
