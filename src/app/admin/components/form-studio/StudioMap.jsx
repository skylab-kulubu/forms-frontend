"use client";

import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Maximize2, Minus, Plus, Timer } from "lucide-react";
import { shortDuration } from "@/lib/form-timing";
import { depthMap, flowOrder, groupTransitions, isTimedNode, triggersForNode } from "../workflow-editor/workflow-graph";
import { StaticCard } from "./StudioCard";
import { OverviewButton, SheetButtons, TOOLBAR_CLASS, TOOL_DIVIDER, ToolButton, pageCardRect } from "./StudioPage";
import { triggerStyle } from "./studio-flow";
import { prefersReducedMotion } from "./studio-motion";

const FRAME_WIDTH = 672;
const OUT_WIDTH = 132;
const GAP_X = 300;
const GAP_Y = 160;
const OUT_TOP = 40;
const ROW_HEIGHT = 30;
const IN_Y = 56;
const PORT_GAP = 6;
const TERMINAL_GAP = 30;
const FORK_RUN = 56;
const FORK_CLEARANCE = 24;
const LABEL_T = 0.42;
const DEFAULT_HEIGHT = 1400;
const MIN_ZOOM = 0.06;
const MAX_ZOOM = 1.6;
const ZOOM_OUT_MS = 520;
const ZOOM_IN_MS = 440;
const MAX_FRAME_MS = 34;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const easeOut = (t) => 1 - (1 - t) ** 3;
const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);

function viewForRect(position, rect, frameWidth) {
  const z = rect.width / frameWidth;
  return { z, x: rect.left - position.x * z, y: rect.top - position.y * z };
}

function rectForView(position, view, frameWidth) {
  return { left: view.x + position.x * view.z, top: view.y + position.y * view.z, width: frameWidth * view.z };
}

function cubicPoint({ p0, p1, p2, p3 }, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

function curve(p0, p3) {
  const dx = Math.max(60, Math.abs(p3.x - p0.x) * 0.5);
  return { p0, p1: { x: p0.x + dx, y: p0.y }, p2: { x: p3.x - dx, y: p3.y }, p3 };
}

function pathOf({ p0, p1, p2, p3 }) {
  return `M ${p0.x} ${p0.y} C ${p1.x} ${p1.y}, ${p2.x} ${p2.y}, ${p3.x} ${p3.y}`;
}

function forkedEdge(p0, p3) {
  const dy = p3.y - p0.y;
  const riseY = Math.abs(dy) >= FORK_CLEARANCE ? p3.y : p0.y + (dy > 0 ? 1 : -1) * FORK_CLEARANCE;
  const q = { x: p0.x + FORK_RUN, y: riseY };
  const midX = p0.x + FORK_RUN / 2;
  const rest = curve(q, p3);
  return {
    d: `M ${p0.x} ${p0.y} C ${midX} ${p0.y}, ${midX} ${riseY}, ${q.x} ${q.y} C ${rest.p1.x} ${rest.p1.y}, ${rest.p2.x} ${rest.p2.y}, ${p3.x} ${p3.y}`,
    labelAt: cubicPoint(rest, LABEL_T),
  };
}

function terminalLabel(group, ending, labelForTransition) {
  if (ending.length === group.length) return "";
  if (ending.length > 1) return `${ending.length} yol`;
  const [route] = ending;
  return route.condition ? labelForTransition(route) : "aksi halde";
}

function layoutOf(nodes, transitions, heights, frameWidth) {
  const depths = depthMap(nodes, transitions);
  const maxDepth = nodes.reduce((max, node) => Math.max(max, depths.get(node.nodeKey) ?? 0), 0);
  const columns = new Map();

  flowOrder(nodes, transitions).forEach((node) => {
    const depth = depths.get(node.nodeKey) ?? maxDepth + 1;
    columns.set(depth, [...(columns.get(depth) ?? []), node]);
  });

  const positions = {};
  [...columns.keys()].sort((a, b) => a - b).forEach((depth, columnIndex) => {
    let y = 0;
    columns.get(depth).forEach((node) => {
      positions[node.nodeKey] = { x: columnIndex * (frameWidth + OUT_WIDTH + GAP_X), y };
      y += (heights[node.formId] ?? DEFAULT_HEIGHT) + GAP_Y;
    });
  });

  return { positions, depths };
}

const OUT_PANEL = "rounded-r-lg border border-l-0 border-white/10 bg-neutral-900 shadow-lg shadow-black/30";

function PortRow({ trigger, index, routed, interactive = false, onSelect, onPortDown }) {
  const style = triggerStyle(trigger);

  return (
    <div onClick={onSelect}
      className={`relative flex h-7.5 items-center gap-1.5 pl-3 pr-2.5 text-2xs ${interactive ? "cursor-pointer transition-colors hover:bg-white/3" : ""} ${style.text ?? "text-neutral-400"} ${
        index > 0 ? "border-t border-dashed border-white/5" : ""
      }`}
    >
      <style.Icon size={11} className={`shrink-0 ${style.icon}`} />
      {style.label}
      <span title={interactive ? "Sürükleyip bir adıma bırak; boşluğa bırakırsan akış biter" : undefined} onPointerDown={onPortDown}
        className={`absolute -right-1.5 top-1/2 size-2.75 -translate-y-1/2 rounded-full border-[1.5px] ${interactive ? "cursor-crosshair transition-[transform,opacity] hover:scale-125" : ""} ${style.port} ${
          routed ? style.portFill : `bg-neutral-900 opacity-50 ${interactive ? "hover:opacity-100" : ""}`
        }`}
      />
    </div>
  );
}

export function FlowCardDecor({ node, transitions }) {
  const triggers = triggersForNode(node, transitions);
  const incoming = transitions.some((transition) => transition.targetNodeKey === node.nodeKey);

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden select-none md:block">
      {incoming ? (
        <>
          <span className="absolute right-full h-[1.5px] w-screen -translate-y-1/2 bg-[#595959]" style={{ top: IN_Y }} />
          <span className="absolute left-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.5px] border-neutral-500 bg-neutral-900" style={{ top: IN_Y }} />
        </>
      ) : null}
      <div className="absolute left-full flex w-max" style={{ top: OUT_TOP }}>
        <div className={OUT_PANEL} style={{ width: OUT_WIDTH }}>
          {triggers.map((trigger, index) => (
            <PortRow key={trigger} trigger={trigger} index={index} routed={groupTransitions(transitions, node.nodeKey, trigger).length > 0} />
          ))}
        </div>
        <div className="flex flex-col" style={{ paddingLeft: PORT_GAP }}>
          {triggers.map((trigger) => {
            const style = triggerStyle(trigger);
            const group = groupTransitions(transitions, node.nodeKey, trigger);
            if (group.some((transition) => transition.targetNodeKey)) {
              return <div key={trigger} className="flex h-7.5 items-center"><span className="h-[1.5px] w-screen" style={{ background: style.stroke }} /></div>;
            }
            return (
              <div key={trigger} className={`flex h-7.5 items-center ${group.length ? "" : "opacity-60"}`}>
                <svg width={TERMINAL_GAP - PORT_GAP} height="2" className="shrink-0">
                  <line x1="0" y1="1" x2={TERMINAL_GAP - PORT_GAP} y2="1" stroke={style.stroke} strokeWidth="1.5" strokeDasharray={group.length ? undefined : "2 3"} />
                </svg>
                <span className="inline-flex h-5.5 items-center gap-1.5 whitespace-nowrap rounded-md border border-dashed border-neutral-700 bg-neutral-900 px-2 text-3xs text-neutral-500">
                  <span className="size-1.5 rounded-xs bg-neutral-600" />
                  biter
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const MAP_QUESTION_LIMIT = 6;

const NodeCard = memo(function NodeCard({ form, active, flowName, stage, total, echo }) {
  return <StaticCard form={form} active={active} stepInfo={{ flowName, stage, total }} echo={echo} limit={MAP_QUESTION_LIMIT} />;
});

function FrameMeasure({ formId, onHeight, children }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => onHeight(formId, element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [formId, onHeight]);

  return <div ref={ref}>{children}</div>;
}

export default function StudioMap({
  wf, flowName, activeFormId, liveForm, selectedKey, entry = null, exitTo = null, onExitDone, onOpenForm, onSelectNode, onBack, onAddStep, onToast, onOverview = null,
}) {
  const { nodes, transitions } = wf.state;
  const canvasRef = useRef(null);
  const [heights, setHeights] = useState({});
  const [frameWidth, setFrameWidth] = useState(() => entry?.frameWidth ?? FRAME_WIDTH);
  const [view, setView] = useState(() => {
    const node = entry ? nodes.find((item) => item.formId === entry.formId) : null;
    const position = node ? layoutOf(nodes, transitions, {}, frameWidth).positions[node.nodeKey] : null;
    return position && entry.rect ? viewForRect(position, entry.rect, frameWidth) : { x: 40, y: 48, z: 0.4 };
  });
  const [connecting, setConnecting] = useState(null);
  const userMovedRef = useRef(false);
  const viewRef = useRef(view);
  const tweenRef = useRef(null);
  const positionsRef = useRef(null);
  const frameWidthRef = useRef(frameWidth);
  const fitViewRef = useRef(null);
  const enteredRef = useRef(null);
  const exitedRef = useRef(null);
  const onExitDoneRef = useRef(onExitDone);

  useEffect(() => {
    viewRef.current = view;
    onExitDoneRef.current = onExitDone;
  });

  const handleHeight = useCallback((formId, height) => {
    setHeights((current) => (current[formId] === height ? current : { ...current, [formId]: height }));
  }, []);

  useLayoutEffect(() => {
    const element = canvasRef.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => setFrameWidth(pageCardRect(element.clientWidth).width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const { positions, depths } = useMemo(() => layoutOf(nodes, transitions, heights, frameWidth), [nodes, transitions, heights, frameWidth]);
  const total = Math.max(1, ...nodes.map((node) => depths.get(node.nodeKey) ?? 1));

  const bounds = useMemo(() => {
    if (nodes.length === 0) return null;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    nodes.forEach((node) => {
      const position = positions[node.nodeKey];
      if (!position) return;
      minX = Math.min(minX, position.x - 40);
      minY = Math.min(minY, position.y - 40);
      maxX = Math.max(maxX, position.x + frameWidth + OUT_WIDTH + 160);
      maxY = Math.max(maxY, position.y + (heights[node.formId] ?? DEFAULT_HEIGHT));
    });
    return { minX, minY, maxX, maxY };
  }, [nodes, positions, heights, frameWidth]);

  const fitView = useCallback(() => {
    const element = canvasRef.current;
    if (!element || !bounds) return null;
    const width = element.clientWidth;
    const height = element.clientHeight;
    const z = clamp(Math.min((width - 64) / (bounds.maxX - bounds.minX), (height - 120) / (bounds.maxY - bounds.minY)), MIN_ZOOM, 1);
    return { z, x: (width - (bounds.maxX - bounds.minX) * z) / 2 - bounds.minX * z, y: 48 - bounds.minY * z };
  }, [bounds]);

  useEffect(() => {
    positionsRef.current = positions;
    frameWidthRef.current = frameWidth;
    fitViewRef.current = fitView;
  });

  const stopTween = useCallback(() => {
    if (tweenRef.current) cancelAnimationFrame(tweenRef.current);
    tweenRef.current = null;
  }, []);

  const runTween = useCallback((nodeKey, from, target, duration, ease, onDone) => {
    stopTween();
    let elapsed = 0;
    let last = null;
    const step = (now) => {
      const position = positionsRef.current?.[nodeKey];
      const to = target();
      if (!position || !to) {
        tweenRef.current = null;
        onDone?.();
        return;
      }
      if (last !== null) elapsed += Math.min(now - last, MAX_FRAME_MS);
      last = now;
      const t = Math.min(1, elapsed / duration);
      const eased = ease(t);
      setView(viewForRect(position, {
        left: from.left + (to.left - from.left) * eased,
        top: from.top + (to.top - from.top) * eased,
        width: from.width + (to.width - from.width) * eased,
      }, frameWidthRef.current));
      if (t < 1) {
        tweenRef.current = requestAnimationFrame(step);
      } else {
        tweenRef.current = null;
        onDone?.();
      }
    };
    tweenRef.current = requestAnimationFrame(step);
  }, [stopTween]);

  useEffect(() => stopTween, [stopTween]);

  useEffect(() => {
    if (!entry || enteredRef.current === entry) return undefined;
    const node = nodes.find((item) => item.formId === entry.formId);
    if (!node || !entry.rect || prefersReducedMotion()) return undefined;
    enteredRef.current = entry;
    let done = false;
    runTween(node.nodeKey, entry.rect, () => {
      const fit = fitViewRef.current?.();
      const position = positionsRef.current?.[node.nodeKey];
      return fit && position ? rectForView(position, fit, frameWidthRef.current) : null;
    }, ZOOM_OUT_MS, easeInOut, () => { done = true; });
    return () => {
      if (done || userMovedRef.current) return;
      stopTween();
      enteredRef.current = null;
    };
  }, [entry, nodes, runTween, stopTween]);

  useEffect(() => {
    if (!exitTo || exitedRef.current === exitTo) return;
    exitedRef.current = exitTo;
    const node = nodes.find((item) => item.formId === exitTo.formId);
    const position = node ? positionsRef.current?.[node.nodeKey] : null;
    const finish = () => onExitDoneRef.current?.(exitTo);
    if (!position || !exitTo.rect || prefersReducedMotion()) {
      finish();
      return;
    }
    userMovedRef.current = true;
    runTween(node.nodeKey, rectForView(position, viewRef.current, frameWidthRef.current), () => exitTo.rect, ZOOM_IN_MS, easeOut, finish);
  }, [exitTo, nodes, runTween]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (userMovedRef.current || tweenRef.current) return;
      const next = fitView();
      if (next) setView(next);
    });
    return () => cancelAnimationFrame(frame);
  }, [fitView]);

  useEffect(() => {
    const element = canvasRef.current;
    if (!element) return undefined;
    const onWheel = (event) => {
      event.preventDefault();
      stopTween();
      userMovedRef.current = true;
      const rect = element.getBoundingClientRect();
      if (event.ctrlKey || event.metaKey) {
        const factor = Math.exp(-event.deltaY * 0.0022);
        setView((current) => {
          const z = clamp(current.z * factor, MIN_ZOOM, MAX_ZOOM);
          const px = event.clientX - rect.left;
          const py = event.clientY - rect.top;
          const wx = (px - current.x) / current.z;
          const wy = (py - current.y) / current.z;
          return { z, x: px - wx * z, y: py - wy * z };
        });
      } else {
        setView((current) => ({ ...current, x: current.x - (event.shiftKey ? event.deltaY : event.deltaX), y: current.y - (event.shiftKey ? 0 : event.deltaY) }));
      }
    };
    element.addEventListener("wheel", onWheel, { passive: false });
    return () => element.removeEventListener("wheel", onWheel);
  }, [stopTween]);

  const zoomBy = (factor) => {
    stopTween();
    userMovedRef.current = true;
    const element = canvasRef.current;
    if (!element) return;
    setView((current) => {
      const z = clamp(current.z * factor, MIN_ZOOM, MAX_ZOOM);
      const px = element.clientWidth / 2;
      const py = element.clientHeight / 2;
      const wx = (px - current.x) / current.z;
      const wy = (py - current.y) / current.z;
      return { z, x: px - wx * z, y: py - wy * z };
    });
  };

  const handleBackgroundDown = (event) => {
    if (event.button !== 0 && event.button !== 1) return;
    if (event.target.closest("[data-map-frame], [data-map-ui], button")) return;
    event.preventDefault();
    stopTween();
    const start = { x: event.clientX, y: event.clientY, view: viewRef.current, moved: false };
    const move = (moveEvent) => {
      const dx = moveEvent.clientX - start.x;
      const dy = moveEvent.clientY - start.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) {
        start.moved = true;
        userMovedRef.current = true;
      }
      setView({ ...start.view, x: start.view.x + dx, y: start.view.y + dy });
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      if (!start.moved) onSelectNode(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const portPosition = (node, trigger) => {
    const position = positions[node.nodeKey];
    const index = Math.max(0, triggersForNode(node, transitions).indexOf(trigger));
    return { x: position.x + frameWidth + OUT_WIDTH, y: position.y + OUT_TOP + ROW_HEIGHT * index + ROW_HEIGHT / 2 };
  };

  const inputPosition = (node) => {
    const position = positions[node.nodeKey];
    return { x: position.x, y: position.y + IN_Y };
  };

  const startConnect = (event, node, trigger) => {
    event.preventDefault();
    event.stopPropagation();
    const element = canvasRef.current;
    const rect = element.getBoundingClientRect();
    const toWorld = (pointer) => {
      const current = viewRef.current;
      return { x: (pointer.clientX - rect.left - current.x) / current.z, y: (pointer.clientY - rect.top - current.y) / current.z };
    };
    const targetAt = (pointer) => document.elementFromPoint(pointer.clientX, pointer.clientY)?.closest("[data-map-frame]")?.dataset.mapFrame ?? null;
    const from = portPosition(node, trigger);

    setConnecting({ from, to: toWorld(event), target: null });

    const move = (moveEvent) => setConnecting((current) => (current ? { ...current, to: toWorld(moveEvent), target: targetAt(moveEvent) } : current));
    const up = (upEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      setConnecting(null);
      const targetKey = targetAt(upEvent);
      if (targetKey === node.nodeKey) {
        onToast("Adım kendine bağlanamaz", "red");
        return;
      }
      const inSurface = Boolean(document.elementFromPoint(upEvent.clientX, upEvent.clientY)?.closest("[data-map-surface]"));
      if (!targetKey && !inSurface) return;
      const result = wf.connect(node.nodeKey, trigger, targetKey);
      if (result && !result.ok) onToast(result.reason, "red");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  const highlightedRouteId = wf.state.focus?.localId ?? null;
  const edges = [];
  const labels = [];
  const terminals = [];
  const routedPorts = new Set();
  const incomingByKey = new Map();

  nodes.forEach((node) => {
    if (!positions[node.nodeKey]) return;
    triggersForNode(node, transitions).forEach((trigger) => {
      const style = triggerStyle(trigger);
      const group = groupTransitions(transitions, node.nodeKey, trigger);
      const hasConditional = group.some((transition) => transition.condition);
      const port = portPosition(node, trigger);
      const ending = group.filter((transition) => !transition.targetNodeKey);
      const isForked = ending.length > 0 && ending.length < group.length;

      if (group.length > 0) routedPorts.add(`${node.nodeKey}:${trigger}`);

      if (group.length === 0 || ending.length > 0) {
        const route = ending[0] ?? null;
        const isFallback = ending.length === 1 && !route.condition && hasConditional;
        const focusId = route ? route.localId : node.nodeKey === selectedKey ? `implicit-${trigger}` : null;
        terminals.push({
          key: `${node.nodeKey}:${trigger}`,
          nodeKey: node.nodeKey,
          trigger,
          route,
          implicit: group.length === 0,
          x: port.x + (isForked ? PORT_GAP + FORK_RUN : TERMINAL_GAP),
          y: port.y,
          fromX: port.x + PORT_GAP,
          stroke: style.stroke,
          dash: group.length === 0 ? "2 3" : isFallback ? "4 4" : undefined,
          label: route ? terminalLabel(group, ending, wf.labelForTransition) : "",
          italic: isFallback,
          isHighlighted: Boolean(highlightedRouteId) && focusId === highlightedRouteId,
        });
      }

      group.forEach((transition) => {
        if (!transition.targetNodeKey) return;
        const target = nodes.find((item) => item.nodeKey === transition.targetNodeKey);
        if (!target || !positions[target.nodeKey]) return;
        incomingByKey.set(target.nodeKey, [...(incomingByKey.get(target.nodeKey) ?? []), node]);

        const from = { x: port.x + PORT_GAP, y: port.y };
        const shape = curve(from, inputPosition(target));
        const fork = isForked ? forkedEdge(from, inputPosition(target)) : null;
        const kind = transition.condition ? "cond" : hasConditional ? "fallback" : "always";
        const isHighlighted = highlightedRouteId === transition.localId;
        edges.push({ id: transition.localId, d: fork ? fork.d : pathOf(shape), stroke: style.stroke, dashed: kind === "fallback", isHighlighted });

        if (kind !== "always") {
          const point = fork ? fork.labelAt : cubicPoint(shape, LABEL_T);
          labels.push({
            id: transition.localId,
            x: point.x,
            y: point.y - 14,
            text: kind === "cond" ? wf.labelForTransition(transition) : "aksi halde",
            italic: kind === "fallback",
            tone: isHighlighted ? "text-skylab-300 border-skylab-400/50" : style.edgeLabel,
          });
        }
      });
    });
  });

  const z = view.z;
  const inverse = 1 / z;
  const formOf = (node) => (node.formId === activeFormId && liveForm ? liveForm : wf.formsById[node.formId]);

  return (
    <div className="@container relative h-full min-h-0">
      <div ref={canvasRef} data-map-surface onPointerDown={handleBackgroundDown}
        className="studio-fade relative h-full overflow-hidden"
        style={{
          backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: `${22 * z}px ${22 * z}px`,
          backgroundPosition: `${view.x}px ${view.y}px`,
        }}
      >
        <div className="absolute left-0 top-0" style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${z})`, transformOrigin: "0 0" }}>
          <svg className="pointer-events-none absolute left-0 top-0 overflow-visible" width="1" height="1" aria-hidden="true">
            {terminals.map((terminal) => (
              <path key={`line-${terminal.key}`} d={`M ${terminal.fromX} ${terminal.y} L ${terminal.x} ${terminal.y}`} fill="none"
                stroke={terminal.stroke} strokeWidth={1.4} vectorEffect="non-scaling-stroke" strokeDasharray={terminal.dash} opacity={terminal.implicit ? 0.45 : 1}
              />
            ))}
            {edges.map((edge) => (
              <g key={edge.id}>
                <path d={edge.d} fill="none" stroke="transparent" strokeWidth={16} vectorEffect="non-scaling-stroke" style={{ pointerEvents: "stroke", cursor: "pointer" }}
                  onPointerDown={(event) => event.stopPropagation()} onClick={() => wf.dispatch({ type: "FOCUS_ROUTE", localId: edge.id })}
                />
                <path d={edge.d} fill="none" vectorEffect="non-scaling-stroke" stroke={edge.isHighlighted ? "#ebd5ee" : edge.stroke}
                  strokeWidth={edge.isHighlighted ? 2.4 : 1.5} strokeDasharray={edge.dashed ? "4 4" : undefined}
                />
              </g>
            ))}
            {connecting ? (
              <path d={pathOf(curve({ x: connecting.from.x + PORT_GAP, y: connecting.from.y }, connecting.to))} fill="none" vectorEffect="non-scaling-stroke"
                stroke="#ebd5ee" strokeWidth={1.5} strokeDasharray="5 4"
              />
            ) : null}
          </svg>

          {labels.map((label) => (
            <button key={`label-${label.id}`} type="button" data-map-ui onClick={() => wf.dispatch({ type: "FOCUS_ROUTE", localId: label.id })}
              className={`absolute truncate rounded-[5px] border bg-neutral-900 px-1.5 py-px text-3xs transition-colors hover:border-white/25 hover:text-neutral-100 ${label.tone} ${label.italic ? "italic" : ""}`}
              style={{ left: label.x, top: label.y, maxWidth: 200, transform: `translate(-50%, -50%) scale(${inverse})`, transformOrigin: "50% 50%" }}
            >
              {label.text}
            </button>
          ))}

          {terminals.map((terminal) => (
            <button key={`terminal-${terminal.key}`} type="button" data-map-ui
              onClick={() => (terminal.route ? wf.dispatch({ type: "FOCUS_ROUTE", localId: terminal.route.localId }) : wf.dispatch({ type: "FOCUS_PORT", nodeKey: terminal.nodeKey, trigger: terminal.trigger }))}
              title={terminal.implicit ? "Bu çıkışta yönlendirme yok; akış burada biter" : "Akış biter"}
              className={`absolute inline-flex h-5.5 items-center gap-1.5 whitespace-nowrap rounded-md border border-dashed bg-neutral-900 px-2 text-3xs transition-colors ${
                terminal.isHighlighted ? "border-skylab-400/60 text-skylab-300" : "border-neutral-700 text-neutral-500 hover:border-neutral-500 hover:text-neutral-300"
              } ${terminal.implicit && !terminal.isHighlighted ? "opacity-60" : ""}`}
              style={{ left: terminal.x, top: terminal.y, transform: `translateY(-50%) scale(${inverse})`, transformOrigin: "0 50%" }}
            >
              <span className="size-1.5 rounded-xs bg-neutral-600" />
              {terminal.label ? (
                <>
                  <span className={`max-w-40 truncate ${terminal.italic ? "italic" : ""} ${terminal.isHighlighted ? "" : "text-neutral-400"}`}>{terminal.label}</span>
                  <span className="text-neutral-600">·</span>
                </>
              ) : null}
              biter
            </button>
          ))}

          {nodes.map((node) => {
            const position = positions[node.nodeKey];
            if (!position) return null;
            const form = formOf(node);
            const issues = wf.issuesByNode[node.nodeKey] ?? [];
            const selected = node.nodeKey === selectedKey;
            const isTarget = connecting?.target === node.nodeKey;
            const sources = incomingByKey.get(node.nodeKey) ?? [];

            return (
              <div key={node.nodeKey}>
                <div data-map-ui className="absolute flex items-center gap-2 whitespace-nowrap"
                  style={{ left: position.x, top: position.y - 10, maxWidth: Math.max(96, (frameWidth + OUT_WIDTH / 2) * z), transform: `translateY(-100%) scale(${inverse})`, transformOrigin: "0 100%" }}
                >
                  <span className={`grid size-5 shrink-0 place-items-center rounded border text-3xs font-semibold ${node.isStart ? "border-skylab-400/40 bg-skylab-500/10 text-skylab-300" : "border-white/10 bg-white/5 text-neutral-400"}`}>
                    {depths.get(node.nodeKey) ?? "?"}
                  </span>
                  <button type="button" onClick={() => onSelectNode(node.nodeKey)}
                    className={`min-w-0 truncate text-xs font-medium transition-colors hover:text-neutral-100 ${selected ? "text-skylab-300" : "text-neutral-300"}`}
                  >
                    {node.formTitle || "Adsız form"}
                  </button>
                  {isTimedNode(node) ? (
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-3xs text-amber-300/90"><Timer size={10} />{shortDuration(node.timeLimitMinutes * 60_000)}</span>
                  ) : null}
                  {issues.length > 0 ? <span className="size-1.5 shrink-0 rounded-full bg-red-400" title={`${issues.length} sorun`} /> : null}
                </div>

                <div data-map-frame={node.nodeKey} className="absolute" style={{ left: position.x, top: position.y, width: frameWidth }}>
                  <FrameMeasure formId={node.formId} onHeight={handleHeight}>
                    <div className={`relative rounded-3xl transition-shadow ${isTarget ? "ring-[6px] ring-skylab-400/40" : selected ? "ring-[6px] ring-skylab-400/25" : issues.length > 0 ? "ring-4 ring-red-400/30" : ""}`}>
                      {form ? (
                        <NodeCard form={form} active={node.formId === activeFormId} flowName={flowName} stage={depths.get(node.nodeKey) ?? null} total={total}
                          echo={node.formId === entry?.formId ? entry.echo ?? null : null}
                        />
                      ) : (
                        <div className="h-96 rounded-3xl border border-white/10 bg-[#1a1a1a]"><div className="shimmer m-10 h-8 w-64 rounded-lg" /></div>
                      )}
                      <button type="button" aria-label={`${node.formTitle || "Form"} formunu düzenle`} onClick={() => onOpenForm(node.formId)}
                        className="absolute inset-0 z-10 cursor-pointer rounded-3xl transition-[background-color,box-shadow] hover:bg-white/2 hover:ring-[6px] hover:ring-skylab-400/30"
                      />
                    </div>
                  </FrameMeasure>
                </div>

                {sources.length > 0 ? (
                  <button type="button" data-map-ui title={`Önceki adıma git: ${sources[0].formTitle}`} onClick={() => onOpenForm(sources[0].formId)}
                    className="absolute grid size-5 place-items-center rounded-full transition-colors hover:bg-white/10"
                    style={{ left: position.x - 10, top: position.y + IN_Y - 10, transform: `scale(${inverse})` }}
                  >
                    <span className="size-2.5 rounded-full border-[1.5px] border-neutral-500 bg-neutral-900" />
                  </button>
                ) : null}

                <div data-map-ui className={`absolute ${OUT_PANEL}`} style={{ left: position.x + frameWidth, top: position.y + OUT_TOP, width: OUT_WIDTH }}>
                  {triggersForNode(node, transitions).map((trigger, index) => (
                    <PortRow key={trigger} trigger={trigger} index={index} interactive routed={routedPorts.has(`${node.nodeKey}:${trigger}`)}
                      onSelect={() => wf.dispatch({ type: "FOCUS_PORT", nodeKey: node.nodeKey, trigger })}
                      onPortDown={(event) => startConnect(event, node, trigger)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {nodes.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center">
            <button type="button" data-map-ui onClick={(event) => onAddStep(event.currentTarget)}
              className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 bg-neutral-900/60 px-8 py-7 text-center transition-colors hover:border-skylab-400/40 hover:bg-white/3"
            >
              <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/3 text-neutral-500"><Plus size={18} /></span>
              <span className="space-y-1">
                <span className="block text-sm font-medium text-neutral-200">İlk adımı ekleyin</span>
                <span className="block text-2xs text-neutral-500">Akışın başlangıç formunu seçin ya da yeni bir form açın.</span>
              </span>
            </button>
          </div>
        ) : null}
      </div>

      <div data-map-ui onPointerDown={(event) => event.stopPropagation()} className={TOOLBAR_CLASS}>
        {onOverview ? <OverviewButton onClick={onOverview} /> : null}
        <SheetButtons side="start" />
        {activeFormId ? (
          <>
            <ToolButton label="Forma dön (M ya da Esc)" onClick={onBack}>
              <ArrowLeft size={15} />
              Forma dön
            </ToolButton>
            <span className={TOOL_DIVIDER} />
          </>
        ) : null}
        <ToolButton label="Adım ekle" onClick={(event) => onAddStep(event.currentTarget)}>
          <Plus size={15} />
          Adım ekle
        </ToolButton>
        {nodes.length > 0 ? <span className="hidden px-2 text-2xs text-neutral-500 2xl:inline">Düzenlemek için bir adıma tıkla</span> : null}
        <SheetButtons side="end" />
      </div>

      <div data-map-ui onPointerDown={(event) => event.stopPropagation()}
        className="absolute bottom-17 right-3 z-30 flex items-center rounded-lg border border-white/10 bg-neutral-900 text-2xs text-neutral-400 shadow-lg @3xl:bottom-4 @3xl:right-4"
      >
        <button type="button" title="Uzaklaş" aria-label="Uzaklaş" onClick={() => zoomBy(1 / 1.2)} className="grid size-7 place-items-center transition-colors hover:text-neutral-100"><Minus size={13} /></button>
        <span className="h-7 min-w-11 px-1 text-center leading-7 tabular-nums">{Math.round(z * 100)}%</span>
        <button type="button" title="Yakınlaş" aria-label="Yakınlaş" onClick={() => zoomBy(1.2)} className="grid size-7 place-items-center transition-colors hover:text-neutral-100"><Plus size={13} /></button>
        <span className="h-4 w-px bg-white/10" />
        <button type="button" title="Hepsini sığdır (Shift+1)" aria-label="Hepsini sığdır"
          onClick={() => { stopTween(); const next = fitView(); if (next) setView(next); }}
          className="grid size-7 place-items-center transition-colors hover:text-neutral-100"
        >
          <Maximize2 size={13} />
        </button>
      </div>

      <span className="pointer-events-none absolute bottom-4 left-4 z-30 hidden max-w-56 text-3xs leading-snug text-neutral-600 @5xl:block">
        Tekerlek: kaydır · Ctrl + tekerlek: yakınlaştır · Boşluktan sürükle: kaydır · Çıkış noktasından sürükle: bağla
      </span>
    </div>
  );
}
