"use client";

import { Fragment, useLayoutEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { ROW_STATUS, rowKindOf } from "@/lib/attempt-status";
import { RETURNED, stepKeyOf } from "./response-data";

const REVISING = { label: "Aday düzeltiyor", dot: "border border-sky-400/70" };

function groupStages(steps) {
  const stages = [];
  steps.forEach((step) => {
    const last = stages[stages.length - 1];
    if (last && last.stage === step.stage) last.rounds.push(step);
    else stages.push({ stage: step.stage, formTitle: step.formTitle, rounds: [step] });
  });
  return stages;
}

function statusOf(step, previous) {
  if (step.responseId) return ROW_STATUS[rowKindOf({ status: step.status ?? 0 })] ?? null;
  return Number(previous?.status) === RETURNED ? REVISING : null;
}

export default function JourneyChips({ steps, viewKey, ownKey, onPick }) {
  const navRef = useRef(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const chip = nav?.querySelector('[data-cur="true"]');
    if (!nav || !chip) return;
    if (chip.offsetLeft + chip.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = chip.offsetLeft + chip.offsetWidth - nav.clientWidth + 8;
    else if (chip.offsetLeft < nav.scrollLeft) nav.scrollLeft = Math.max(0, chip.offsetLeft - 8);
  }, [viewKey]);

  const selectable = (step) => Boolean(step.responseId) || stepKeyOf(step) === ownKey;

  return (
    <nav ref={navRef} aria-label="Başvuru adımları" className="relative flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-hidden">
      {groupStages(steps).map((group, groupIndex) => {
        const active = group.rounds.some((step) => stepKeyOf(step) === viewKey);
        const chip = (canPick) => `flex max-w-48 shrink-0 items-center gap-2 rounded-md border px-2.5 py-2 transition-colors sm:max-w-64 sm:px-2 sm:py-0.5 ${
          active ? "border-white/15 bg-white/5" : canPick ? "border-transparent hover:bg-white/3" : "cursor-not-allowed border-transparent opacity-50"
        }`;
        const title = <span className={`truncate text-2xs font-medium ${active ? "text-neutral-100" : "text-neutral-400"}`}>{group.formTitle || "Adsız form"}</span>;
        const single = group.rounds.length === 1 ? group.rounds[0] : null;
        const singleStatus = single ? statusOf(single, null) : null;

        return (
          <Fragment key={group.stage}>
            {groupIndex ? <ChevronRight size={12} className="shrink-0 text-neutral-700" /> : null}
            {single ? (
              <button type="button" data-cur={active} disabled={!selectable(single)} onClick={() => onPick(single)} aria-current={active ? "step" : undefined}
                title={singleStatus ? `${group.formTitle || "Adsız form"} · ${singleStatus.label}` : "Bu adım henüz cevaplanmadı"} className={chip(selectable(single))}
              >
                <span className="text-3xs tabular-nums text-neutral-500">{group.stage}</span>
                {title}
                <span className={`size-1.5 shrink-0 rounded-full ${singleStatus?.dot ?? "border border-neutral-600"}`} />
              </button>
            ) : (
              <div className={chip(true)}>
                <span className="text-3xs tabular-nums text-neutral-500">{group.stage}</span>
                {title}
                <span className="flex items-center gap-0.5 border-l border-white/10 pl-1.5">
                  {group.rounds.map((step, roundIndex) => {
                    const status = statusOf(step, group.rounds[roundIndex - 1]);
                    const current = stepKeyOf(step) === viewKey;
                    const canPick = selectable(step);
                    return (
                      <button key={stepKeyOf(step)} type="button" data-cur={current} disabled={!canPick} onClick={() => onPick(step)} aria-current={current ? "step" : undefined}
                        title={`${step.round ?? 1}. gönderim · ${status?.label ?? "Henüz cevaplanmadı"}`}
                        className={`flex h-6 items-center gap-1 rounded px-2 text-3xs tabular-nums transition-colors sm:h-5 sm:px-1.5 ${
                          current ? "bg-white/10 text-neutral-100" : canPick ? "text-neutral-400 hover:bg-white/5 hover:text-neutral-200" : "cursor-not-allowed text-neutral-600"
                        }`}
                      >
                        {step.round ?? 1}
                        <span className={`size-1.5 shrink-0 rounded-full ${status?.dot ?? "border border-neutral-600"}`} />
                      </button>
                    );
                  })}
                </span>
              </div>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
