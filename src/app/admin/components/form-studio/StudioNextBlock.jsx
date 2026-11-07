"use client";

import { Fragment, useRef, useState } from "react";
import { ArrowRight, Plus } from "lucide-react";
import { MenuPill, actionClass } from "@/app/admin/components/utils/SidePanel";
import { groupTransitions, triggersForNode } from "../workflow-editor/workflow-graph";
import { END_TARGET, NEW_TARGET, TRIGGER_LABEL, answerText, sharedQuestion, targetOptions, triggerStyle } from "./studio-flow";

export function Heading({ children, action = null }) {
  return (
    <div className="mb-1 flex min-h-7 items-center gap-2">
      <span className="text-2xs font-medium text-neutral-500">{children}</span>
      <span className="h-px flex-1 bg-white/5" />
      {action}
    </div>
  );
}

export function StepNumber({ stage }) {
  if (stage == null) return null;
  return <span className="grid size-4 shrink-0 place-items-center rounded border border-white/10 bg-white/5 text-4xs font-semibold text-neutral-400">{stage}</span>;
}

const routeKey = (route) => route.localId ?? `${route.targetNodeKey}-${route.priority}`;

function RouteAnswer({ route, condition }) {
  if (!route.condition) return <span className="flex min-h-7 items-center pl-5.75 text-2xs text-neutral-500">aksi halde</span>;
  if (!condition) return <span className="flex min-h-7 items-center pl-5.75 text-2xs text-amber-200/90">koşul eksik</span>;

  return (
    <span className="flex min-h-7 items-center gap-1 pl-5.75 text-2xs">
      <span className="min-w-0 font-medium text-neutral-200">{answerText(condition)}</span>
      {condition.more > 0 ? <span className="shrink-0 text-neutral-500">+{condition.more}</span> : null}
    </span>
  );
}

function RouteCondition({ route, condition }) {
  return (
    <p className="pt-1.5 text-2xs leading-4 text-neutral-500">
      {!route.condition ? "aksi halde" : !condition ? <span className="text-amber-200/90">koşul eksik</span> : (
        <>
          {condition.question}{" "}
          <span className="font-medium text-neutral-200">{answerText(condition)}</span>
          {condition.more > 0 ? ` +${condition.more}` : null}
        </>
      )}
    </p>
  );
}

export function RouteGroup({ trigger, routes, conditionOf, renderTarget }) {
  const style = triggerStyle(trigger);
  const conditional = routes.some((route) => route.condition);
  const conditions = routes.map((route) => (route.condition ? conditionOf(route) : null));
  const question = conditional ? sharedQuestion(conditions) : null;

  return (
    <div className="grid grid-cols-[7.25rem_minmax(0,1fr)] items-start gap-x-3 py-1.5">
      <div className={`flex min-h-7 items-center gap-2.5 text-xs ${style.text ?? "text-neutral-400"}`}>
        <style.Icon size={13} className={`shrink-0 ${style.icon}`} />
        {style.label}
      </div>

      {!conditional ? renderTarget(routes[0] ?? null, trigger) : question ? (
        <>
          <p className="flex min-h-7 items-center py-1 text-2xs leading-4 text-neutral-400">{question}</p>
          {routes.map((route, index) => (
            <Fragment key={routeKey(route)}>
              <RouteAnswer route={route} condition={conditions[index]} />
              {renderTarget(route, trigger)}
            </Fragment>
          ))}
        </>
      ) : (
        <div className="min-w-0">
          {routes.map((route, index) => (
            <Fragment key={routeKey(route)}>
              <RouteCondition route={route} condition={conditions[index]} />
              {renderTarget(route, trigger)}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export function IncomingNote({ node, incoming, renderStep }) {
  if (node.isStart && incoming.length === 0) return null;

  const sources = incoming.filter((transition, index) => incoming.findIndex((item) => item.sourceNodeKey === transition.sourceNodeKey && item.trigger === transition.trigger) === index);

  return (
    <p className="mt-1 border-t border-white/5 pt-2.5 text-2xs leading-relaxed text-neutral-500">
      {sources.length === 0 ? "Bu adıma başlangıçtan ulaşan bir yol yok." : (
        <>
          Bu adıma{" "}
          {sources.map((transition, index) => (
            <Fragment key={`${transition.sourceNodeKey}-${transition.trigger}`}>
              {index > 0 ? ", " : ""}
              {renderStep(transition.sourceNodeKey)}
              {" "}{TRIGGER_LABEL[transition.trigger]}
            </Fragment>
          ))}
          {" "}gelinir.
        </>
      )}
    </p>
  );
}

const STEP_LINK = "text-neutral-300 underline decoration-white/20 underline-offset-2 transition-colors hover:text-neutral-100";

export function FlowNextBlock({ node, nodes, transitions, stageOf, conditionOf, onRoute, onRetarget, onActivate, onEditRoutes, onAddStep }) {
  const anchorRefs = useRef({});
  const nodeByKey = (key) => nodes.find((item) => item.nodeKey === key) ?? null;
  const incoming = transitions.filter((transition) => transition.targetNodeKey === node.nodeKey);

  const routes = (trigger) => groupTransitions(transitions, node.nodeKey, trigger);

  const renderTarget = (route, trigger) => {
    const target = route?.targetNodeKey ? nodeByKey(route.targetNodeKey) : null;
    const conditional = routes(trigger).some((item) => item.condition);

    const select = (value) => {
      if (conditional) {
        onRetarget(route, value === END_TARGET ? null : value);
        return;
      }
      if (value === NEW_TARGET) onAddStep(trigger, anchorRefs.current[trigger]);
      else onRoute(trigger, value === END_TARGET ? null : value);
    };

    return (
      <div className="-ml-2 flex min-w-0 items-start justify-between gap-0.5">
        <span ref={(element) => { if (!conditional) anchorRefs.current[trigger] = element; }} className="inline-flex min-w-0">
          <MenuPill quiet dim={!target} value={target ? target.nodeKey : END_TARGET} leading={target ? <StepNumber stage={stageOf(target.nodeKey)} /> : null}
            options={targetOptions(node.nodeKey, nodes, transitions, { allowNew: !conditional })} onSelect={select}
          />
        </span>
        {target ? (
          <button type="button" title="Adıma git" aria-label={`${target.formTitle} adımına git`} onClick={() => onActivate(target.formId)}
            className="grid size-7 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-100"
          >
            <ArrowRight size={12} />
          </button>
        ) : null}
      </div>
    );
  };

  return (
    <div className="px-4">
      <Heading action={(
        <button type="button" onClick={onEditRoutes}
          className="-mr-2 rounded-md px-2 py-1 text-2xs text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
        >
          Yönlendirmeleri düzenle
        </button>
      )}
      >
        Bu adımdan sonra
      </Heading>

      <div className="divide-y divide-white/5">
        {triggersForNode(node, transitions).map((trigger) => (
          <RouteGroup key={trigger} trigger={trigger} routes={routes(trigger)} conditionOf={conditionOf} renderTarget={renderTarget} />
        ))}
      </div>

      <IncomingNote node={node} incoming={incoming} renderStep={(sourceKey) => {
        const source = nodeByKey(sourceKey);
        return <button type="button" onClick={() => source && onActivate(source.formId)} className={STEP_LINK}>{source?.formTitle ?? sourceKey}</button>;
      }}
      />
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
