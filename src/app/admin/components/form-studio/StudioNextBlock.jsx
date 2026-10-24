"use client";

import { Fragment, useRef, useState } from "react";
import { ArrowRight, CornerDownRight, Map as MapIcon, Plus } from "lucide-react";
import { MenuPill, actionClass } from "@/app/admin/components/utils/SidePanel";
import { groupTransitions, triggersForNode } from "../workflow-editor/workflow-graph";
import { END_TARGET, NEW_TARGET, targetOptions, triggerStyle } from "./studio-flow";
import { TRIGGER_LABEL } from "./useWorkflowStudio";

function Heading({ children }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <span className="text-2xs font-medium text-neutral-500">{children}</span>
      <span className="h-px flex-1 bg-white/5" />
    </div>
  );
}

function TriggerRow({ trigger, children }) {
  const style = triggerStyle(trigger);
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-x-2.5 gap-y-1 py-1.5 text-xs">
      <style.Icon size={13} className={`shrink-0 ${style.icon}`} />
      <span className="w-24 shrink-0 text-neutral-400">{style.label}</span>
      {children}
    </div>
  );
}

export function FlowNextBlock({ node, nodes, transitions, labelForTransition, onRoute, onActivate, onShowMap, onEditRoutes, onAddStep }) {
  const anchorRefs = useRef({});
  const nodeByKey = (key) => nodes.find((item) => item.nodeKey === key) ?? null;
  const incoming = transitions.filter((transition) => transition.targetNodeKey === node.nodeKey);

  return (
    <div className="px-4">
      <Heading>Bu adımdan sonra</Heading>
      <div className="divide-y divide-white/5">
        {triggersForNode(node, transitions).map((trigger) => {
          const group = groupTransitions(transitions, node.nodeKey, trigger);
          const conditional = group.some((transition) => transition.condition);

          if (conditional) {
            return (
              <div key={trigger} className="py-1">
                <TriggerRow trigger={trigger}>
                  <span className="text-neutral-300">{group.length} yol, cevaba göre</span>
                  <button type="button" onClick={onEditRoutes}
                    className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
                  >
                    Yönlendirmeleri düzenle
                  </button>
                </TriggerRow>
                <div className="mb-1.5 space-y-1 pl-6">
                  {group.map((transition) => {
                    const target = transition.targetNodeKey ? nodeByKey(transition.targetNodeKey) : null;
                    return (
                      <div key={transition.localId} className="flex min-w-0 items-center gap-1.5 text-2xs text-neutral-500">
                        <CornerDownRight size={11} className="shrink-0 text-neutral-600" />
                        <span className={`min-w-0 truncate ${transition.condition ? "text-neutral-300" : "italic"}`}>{labelForTransition(transition)}</span>
                        <ArrowRight size={11} className="shrink-0 text-neutral-600" />
                        {target ? (
                          <button type="button" onClick={() => onActivate(target.formId)}
                            className="min-w-0 truncate text-neutral-300 underline decoration-white/20 underline-offset-2 transition-colors hover:text-neutral-100"
                          >
                            {target.formTitle}
                          </button>
                        ) : <span>akış biter</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          const route = group[0] ?? null;
          const target = route?.targetNodeKey ? nodeByKey(route.targetNodeKey) : null;
          return (
            <TriggerRow key={trigger} trigger={trigger}>
              <span ref={(element) => { anchorRefs.current[trigger] = element; }} className="inline-flex">
                <MenuPill wide value={target ? target.nodeKey : END_TARGET} options={targetOptions(node.nodeKey, nodes, transitions, { allowNew: true })}
                  onSelect={(value) => {
                    if (value === NEW_TARGET) onAddStep(trigger, anchorRefs.current[trigger]);
                    else onRoute(trigger, value === END_TARGET ? null : value);
                  }}
                />
              </span>
              {target ? (
                <button type="button" onClick={() => onActivate(target.formId)}
                  className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-2xs text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
                >
                  Adıma git
                  <ArrowRight size={12} />
                </button>
              ) : <span className="ml-auto text-2xs text-neutral-600">akış burada biter</span>}
            </TriggerRow>
          );
        })}
      </div>

      <p className="mt-2 text-2xs leading-relaxed text-neutral-500">
        {node.isStart && incoming.length === 0 ? "Akış bu adımla başlar." : incoming.length === 0 ? "Bu adıma başlangıçtan ulaşan bir yol yok." : (
          <>
            Bu adıma{" "}
            {incoming.map((transition, index) => {
              const source = nodeByKey(transition.sourceNodeKey);
              return (
                <Fragment key={transition.localId}>
                  {index > 0 ? ", " : ""}
                  <button type="button" onClick={() => source && onActivate(source.formId)}
                    className="text-neutral-300 underline decoration-white/20 underline-offset-2 transition-colors hover:text-neutral-100"
                  >
                    {source?.formTitle ?? transition.sourceNodeKey}
                  </button>
                  {" "}{TRIGGER_LABEL[transition.trigger]}
                </Fragment>
              );
            })}
            {" "}gelinir.
          </>
        )}
      </p>

      <button type="button" onClick={onShowMap} className={`${actionClass()} mt-3 w-fit`}>
        <MapIcon size={13} className="opacity-70" />
        Akış haritasında aç
      </button>
    </div>
  );
}

export function SingleNextBlock({ reviewed, disabledReason = null, onAddStep }) {
  const buttonRef = useRef(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="px-4">
      <Heading>Bu formdan sonra</Heading>
      <p className="mt-1 text-2xs leading-relaxed text-neutral-500">
        Form tek başına. {reviewed ? "Onaylanınca" : "Gönderilince"} başka bir form açılsın istersen sonraki adımı ekle; form o zaman bir akışın ilk adımı olur.
      </p>
      <button ref={buttonRef} type="button" disabled={Boolean(disabledReason) || busy} title={disabledReason ?? undefined}
        onClick={async () => {
          setBusy(true);
          try { await onAddStep(buttonRef.current); } finally { setBusy(false); }
        }}
        className={`${actionClass()} mt-3 w-fit`}
      >
        <Plus size={13} className="opacity-70" />
        Sonraki adım ekle
      </button>
      {disabledReason ? <p className="mt-1.5 text-3xs text-neutral-600">{disabledReason}</p> : null}
    </div>
  );
}
