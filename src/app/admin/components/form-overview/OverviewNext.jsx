"use client";

import { Fragment } from "react";
import { ArrowRight, CornerDownRight, Workflow } from "lucide-react";
import { actionClass } from "@/app/admin/components/utils/SidePanel";
import { groupTransitions, triggersForNode } from "../workflow-editor/workflow-graph";
import { Heading, TriggerRow } from "../form-studio/StudioNextBlock";
import { TRIGGER_LABEL, transitionLabel } from "../form-studio/studio-flow";

const STEP_LINK = "min-w-0 truncate text-neutral-300 underline decoration-white/20 underline-offset-2 transition-colors hover:text-neutral-100";

export default function OverviewNext({ flow, schemaOf, onPickStep, onShowFlow }) {
  const { node, nodes, transitions } = flow;
  if (!node) return null;

  const nodeByKey = (key) => nodes.find((item) => item.nodeKey === key) ?? null;
  const incoming = transitions.filter((transition) => transition.targetNodeKey === node.nodeKey);
  const label = (transition) => transitionLabel(transition, { nodes, transitions, schemaOf });
  const stepLink = (target) => (
    <button type="button" onClick={() => onPickStep(target.formId)} className={STEP_LINK}>{target.formTitle || "Adsız form"}</button>
  );

  return (
    <div className="px-4">
      <Heading>Bu adımdan sonra</Heading>
      <div className="divide-y divide-white/5">
        {triggersForNode(node, transitions).map((trigger) => {
          const group = groupTransitions(transitions, node.nodeKey, trigger);

          if (group.some((transition) => transition.condition)) {
            return (
              <div key={trigger} className="py-1">
                <TriggerRow trigger={trigger}>
                  <span className="text-neutral-300">{group.length} yol, cevaba göre</span>
                </TriggerRow>
                <div className="mb-1.5 space-y-1 pl-6">
                  {group.map((transition, index) => {
                    const target = transition.targetNodeKey ? nodeByKey(transition.targetNodeKey) : null;
                    return (
                      <div key={`${transition.targetNodeKey ?? "end"}-${index}`} className="flex min-w-0 items-center gap-1.5 text-2xs text-neutral-500">
                        <CornerDownRight size={11} className="shrink-0 text-neutral-600" />
                        <span className={`min-w-0 truncate ${transition.condition ? "text-neutral-300" : ""}`}>{label(transition)}</span>
                        <ArrowRight size={11} className="shrink-0 text-neutral-600" />
                        {target ? stepLink(target) : <span>akış biter</span>}
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
              {target ? stepLink(target) : <span className="text-neutral-500">akış burada biter</span>}
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
                <Fragment key={`${transition.sourceNodeKey}-${index}`}>
                  {index > 0 ? ", " : ""}
                  {source ? stepLink(source) : transition.sourceNodeKey}
                  {" "}{TRIGGER_LABEL[transition.trigger]}
                </Fragment>
              );
            })}
            {" "}gelinir.
          </>
        )}
      </p>

      <button type="button" onClick={onShowFlow} className={`${actionClass({ touch: true })} mt-3 w-fit`}>
        <Workflow size={13} className="opacity-70" />
        Akışta gör
      </button>
    </div>
  );
}
