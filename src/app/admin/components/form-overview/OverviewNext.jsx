"use client";

import { useMemo } from "react";
import { groupTransitions, triggersForNode } from "../workflow-editor/workflow-graph";
import { Heading, IncomingNote, RouteGroup, StepNumber } from "../form-studio/StudioNextBlock";
import { stagesOf, transitionCondition } from "../form-studio/studio-flow";

const STEP_LINK = "text-neutral-300 underline decoration-white/20 underline-offset-2 transition-colors hover:text-neutral-100";

export default function OverviewNext({ flow, schemaOf, onPickStep }) {
  const { node, nodes, transitions } = flow;
  const stages = useMemo(() => stagesOf(nodes, transitions), [nodes, transitions]);
  if (!node) return null;

  const nodeByKey = (key) => nodes.find((item) => item.nodeKey === key) ?? null;
  const incoming = transitions.filter((transition) => transition.targetNodeKey === node.nodeKey);
  const conditionOf = (transition) => transitionCondition(transition, { nodes, schemaOf });

  const renderTarget = (route) => {
    const target = route?.targetNodeKey ? nodeByKey(route.targetNodeKey) : null;
    if (!target) return <span className="flex min-h-7 items-center text-xs text-neutral-500">Akış biter</span>;

    return (
      <button type="button" onClick={() => onPickStep(target.formId)}
        className="-ml-1 flex min-h-7 min-w-0 items-center gap-1.5 rounded-md px-1 text-left text-xs text-neutral-200 transition-colors hover:bg-white/5 hover:text-neutral-50"
      >
        <StepNumber stage={stages.depths.get(target.nodeKey) ?? null} />
        <span className="min-w-0">{target.formTitle || "Adsız form"}</span>
      </button>
    );
  };

  return (
    <div className="px-4">
      <Heading>Bu adımdan sonra</Heading>

      <div className="divide-y divide-white/5">
        {triggersForNode(node, transitions).map((trigger) => (
          <RouteGroup key={trigger} trigger={trigger} routes={groupTransitions(transitions, node.nodeKey, trigger)} conditionOf={conditionOf} renderTarget={renderTarget} />
        ))}
      </div>

      <IncomingNote node={node} incoming={incoming} renderStep={(sourceKey) => {
        const source = nodeByKey(sourceKey);
        return source
          ? <button type="button" onClick={() => onPickStep(source.formId)} className={STEP_LINK}>{source.formTitle || "Adsız form"}</button>
          : sourceKey;
      }}
      />
    </div>
  );
}
