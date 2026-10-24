"use client";

import { ArrowLeft, ArrowRight, ChevronRight, Plus } from "lucide-react";
import { durationText } from "@/lib/form-timing";
import { actionClass } from "@/app/admin/components/utils/SidePanel";
import { groupTransitions, triggersForNode } from "../workflow-editor/workflow-graph";
import { SheetButtons, TOOLBAR_CLASS, TOOL_DIVIDER, ToolButton } from "./StudioPage";
import { triggerStyle } from "./studio-flow";

function routesOf(node, nodes, transitions) {
  const titleOf = (nodeKey) => nodes.find((item) => item.nodeKey === nodeKey)?.formTitle || "Adsız form";
  return triggersForNode(node, transitions).map((trigger) => {
    const group = groupTransitions(transitions, node.nodeKey, trigger);
    const fallback = group.find((transition) => !transition.condition);
    const conditional = group.length - (fallback ? 1 : 0);
    const target = fallback?.targetNodeKey ? titleOf(fallback.targetNodeKey) : conditional && !fallback ? "Koşula göre" : "Akış biter";
    return { trigger, style: triggerStyle(trigger), target, ends: !fallback?.targetNodeKey && !conditional, conditional };
  });
}

function StepCard({ node, depth, nodes, transitions, questionCount, active, dirty, onOpen }) {
  const meta = [
    node.isStart ? "Başlangıç" : null,
    node.requiresManualReview ? "Manuel onay" : null,
    Number(node.timeLimitMinutes) > 0 ? durationText(node.timeLimitMinutes) : null,
    questionCount != null ? `${questionCount} soru` : null,
  ].filter(Boolean).join(" · ");

  return (
    <li>
      <button type="button" onClick={onOpen} data-flow-step={node.formId} data-active={active || undefined}
        className={`w-full rounded-xl border p-3 text-left transition-colors ${active ? "border-skylab-400/40 bg-skylab-500/5" : "border-white/10 bg-[#1a1a1a] hover:border-white/20"}`}
      >
        <span className="flex items-center gap-2.5">
          <span className={`grid size-6 shrink-0 place-items-center rounded-md border text-3xs font-semibold ${
            node.isStart ? "border-skylab-400/40 bg-skylab-500/10 text-skylab-300" : "border-white/10 bg-white/5 text-neutral-400"
          }`}
          >
            {depth ?? "?"}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-neutral-100">{node.formTitle || "Adsız form"}</span>
            {meta ? <span className="block truncate text-3xs text-neutral-500">{meta}</span> : null}
          </span>
          {dirty ? <span title="Kaydedilmemiş değişiklik var" className="size-1.5 shrink-0 rounded-full bg-skylab-400" /> : null}
          <ChevronRight size={15} className="shrink-0 text-neutral-500" />
        </span>
        <span className="mt-2.5 block space-y-1 border-t border-white/5 pt-2.5">
          {routesOf(node, nodes, transitions).map((route) => (
            <span key={route.trigger} className="flex min-w-0 items-center gap-2 text-2xs">
              <route.style.Icon size={12} className={`shrink-0 ${route.style.icon}`} />
              <span className="shrink-0 text-neutral-400">{route.style.label}</span>
              <ArrowRight size={11} className="shrink-0 text-neutral-600" />
              <span className={`min-w-0 truncate ${route.ends ? "text-neutral-500" : "text-neutral-200"}`}>{route.target}</span>
              {route.conditional ? <span className="shrink-0 text-3xs text-neutral-500">+{route.conditional} koşullu</span> : null}
            </span>
          ))}
        </span>
      </button>
    </li>
  );
}

export default function StudioFlowList({ nodes, transitions, stages, questionCounts, dirtyIds, activeFormId, onOpenForm, onBack, onAddStep }) {
  const connected = stages.ordered.filter((node) => stages.depths.has(node.nodeKey));
  const detached = stages.ordered.filter((node) => !stages.depths.has(node.nodeKey));

  const card = (node) => (
    <StepCard key={node.nodeKey} node={node} depth={stages.depths.get(node.nodeKey)} nodes={nodes} transitions={transitions}
      questionCount={questionCounts[node.formId]} active={node.formId === activeFormId} dirty={dirtyIds.includes(node.formId)}
      onOpen={() => onOpenForm(node.formId)}
    />
  );

  return (
    <div className="relative h-full min-h-0">
      <div className="h-full overflow-y-auto px-3 pb-36 pt-4 scrollbar">
        <div className="mx-auto max-w-md">
          {nodes.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
              <p className="text-sm text-neutral-300">İlk adımı ekleyin</p>
              <p className="text-2xs text-neutral-500">Akışın başlangıç formunu seçin ya da yeni bir form açın.</p>
              <button type="button" onClick={(event) => onAddStep(event.currentTarget)} className={actionClass()}>
                <Plus size={13} className="opacity-70" />
                Adım ekle
              </button>
            </div>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-2 px-1">
                <span className="text-2xs font-medium text-neutral-500">Adımlar</span>
                <span className="h-px flex-1 bg-white/5" />
                <span className="text-3xs text-neutral-600">Açmak için bir adıma dokun</span>
              </div>
              <ol className="space-y-2">{connected.map(card)}</ol>
              {detached.length > 0 ? (
                <>
                  <div className="mb-2 mt-5 flex items-center gap-2 px-1">
                    <span className="text-2xs font-medium text-neutral-500">Bağlı olmayan adımlar</span>
                    <span className="h-px flex-1 bg-white/5" />
                  </div>
                  <ol className="space-y-2">{detached.map(card)}</ol>
                </>
              ) : null}
            </>
          )}
        </div>
      </div>

      <div onPointerDown={(event) => event.stopPropagation()} className={TOOLBAR_CLASS}>
        <SheetButtons side="start" />
        {activeFormId ? (
          <>
            <ToolButton label="Forma dön" onClick={onBack}>
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
        <SheetButtons side="end" />
      </div>
    </div>
  );
}
