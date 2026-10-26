"use client";

import { Fragment, useLayoutEffect, useRef } from "react";
import { ChevronRight, Monitor, Smartphone, Timer } from "lucide-react";
import { durationText } from "@/lib/form-timing";
import { sameId } from "./room-flow";

export const CANVAS_WIDE = 896;

let pendingAnchor = null;

export function captureCanvasAnchor() {
  const canvas = document.querySelector("[data-room] [data-room-canvas]");
  pendingAnchor = null;
  if (!canvas || canvas.scrollTop <= 0) return;
  const top = canvas.getBoundingClientRect().top;
  const hit = [...canvas.querySelectorAll("[data-q]")].find((element) => element.getBoundingClientRect().bottom > top + 24);
  if (hit) pendingAnchor = { q: hit.getAttribute("data-q"), offset: hit.getBoundingClientRect().top - top };
}

export function StepBadge({ depth, isStart = false, size = "sm" }) {
  return (
    <span className={`grid shrink-0 place-items-center border font-semibold ${size === "sm" ? "size-4 rounded text-4xs" : "size-5 rounded-md text-3xs"} ${
      isStart ? "border-skylab-400/40 bg-skylab-500/10 text-skylab-300" : "border-white/10 bg-white/5 text-neutral-400"
    }`}
    >
      {depth ?? "?"}
    </span>
  );
}

export function FlowChips({ flow, activeFormId, onPick }) {
  const navRef = useRef(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const chip = nav?.querySelector('[aria-current="step"]');
    if (!nav || !chip) return;
    if (chip.offsetLeft < nav.scrollLeft) nav.scrollLeft = chip.offsetLeft - 8;
    else if (chip.offsetLeft + chip.offsetWidth > nav.scrollLeft + nav.clientWidth) nav.scrollLeft = chip.offsetLeft + chip.offsetWidth - nav.clientWidth + 8;
  }, [activeFormId]);

  return (
    <nav ref={navRef} aria-label="Akışın adımları" className="relative flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-hidden">
      {flow.columns.map((group, groupIndex) => (
        <Fragment key={group[0].nodeKey}>
          {groupIndex ? <ChevronRight size={12} className="shrink-0 text-neutral-700" /> : null}
          {group.map((node, index) => {
            const active = sameId(node.formId, activeFormId);
            return (
              <Fragment key={node.nodeKey}>
                {index ? <span className="shrink-0 text-3xs text-neutral-700">/</span> : null}
                <button type="button" onClick={() => onPick(node.formId)} aria-current={active ? "step" : undefined}
                  className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-2 text-2xs font-medium transition-colors sm:px-2 sm:py-0.5 ${
                    active ? "border-white/15 bg-white/5 text-neutral-100" : "border-transparent text-neutral-500 hover:bg-white/3 hover:text-neutral-300"
                  }`}
                >
                  <span className="text-3xs tabular-nums text-neutral-500">{flow.stages.depths.get(node.nodeKey) ?? "?"}</span>
                  {node.formTitle || "Adsız form"}
                </button>
              </Fragment>
            );
          })}
        </Fragment>
      ))}
    </nav>
  );
}

export function DeviceToggle({ device, onChange }) {
  const options = [["desktop", Monitor, "Masaüstü genişliği"], ["phone", Smartphone, "Telefon genişliği"]];

  return (
    <span className="hidden items-center gap-0.5 sm:flex">
      {options.map(([value, Icon, label]) => (
        <button key={value} type="button" title={label} aria-label={label} aria-pressed={device === value} onClick={() => onChange(value)}
          className={`grid size-6 place-items-center rounded transition-colors ${device === value ? "bg-white/10 text-neutral-100" : "text-neutral-500 hover:text-neutral-200"}`}
        >
          <Icon size={13} />
        </button>
      ))}
    </span>
  );
}

export function TitleRow({ title, depth = null, isStart = false, timeLimitMinutes = null, right = null }) {
  return (
    <>
      {depth != null ? <StepBadge depth={depth} isStart={isStart} /> : null}
      <span className="min-w-0 truncate text-2xs font-medium text-neutral-400">{title || "Adsız form"}</span>
      {timeLimitMinutes ? (
        <span className="inline-flex shrink-0 items-center gap-0.5 text-3xs text-amber-300/90"><Timer size={10} />{durationText(timeLimitMinutes)}</span>
      ) : null}
      {right ? <span className="ml-auto flex shrink-0 items-center gap-2">{right}</span> : null}
    </>
  );
}

export function CardTop({ row1, row2 = null }) {
  return (
    <div className="mb-3 flex flex-col gap-1 px-1">
      {row1 ? <div className="flex h-10 min-w-0 items-center gap-2 sm:h-7">{row1}</div> : null}
      {row2 ? <div className="flex h-10 min-w-0 items-center gap-2 sm:h-7">{row2}</div> : null}
    </div>
  );
}

export default function RoomCanvas({ width, cardWidth, top, above = null, card, below = null, rail = null, sticky = null }) {
  const scrollRef = useRef(null);
  const cardRef = useRef(null);
  const wide = width === 0 || width >= CANVAS_WIDE;

  useLayoutEffect(() => {
    const anchor = pendingAnchor;
    pendingAnchor = null;
    const canvas = scrollRef.current;
    const target = anchor && canvas?.querySelector(`[data-q="${CSS.escape(anchor.q)}"]`);
    if (target) canvas.scrollTop += target.getBoundingClientRect().top - canvas.getBoundingClientRect().top - anchor.offset;
  }, []);

  return (
    <div ref={scrollRef} data-room-canvas className={`${wide && !rail ? "studio-fade" : "studio-fade-edge"} h-full overflow-y-auto overflow-x-hidden bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[22px_22px] bg-local [scrollbar-gutter:stable] scrollbar`}>
      <div data-room-column className={`relative mx-auto flex min-h-full w-full flex-col px-3 pb-36 pt-4 sm:pb-40 sm:pt-10 ${rail ? "sm:px-6" : wide ? "sm:px-14" : "sm:px-6"}`}
        style={{ maxWidth: rail ? cardWidth + rail.extra : cardWidth + 112 }}
      >
        {sticky ? <div className="sticky top-0 z-20 -mx-3 -mt-4 mb-1 border-b border-white/5 bg-neutral-900/90 px-3 backdrop-blur sm:hidden">{sticky}</div> : null}
        <div className={`w-full ${rail ? "" : "mx-auto"}`} style={{ maxWidth: cardWidth }}>{top}</div>
        {above ? <div className={`mb-4 w-full ${rail ? "" : "mx-auto"}`} style={{ maxWidth: cardWidth }}>{above}</div> : null}
        <div className={rail ? "flex items-stretch" : ""} style={rail ? { gap: rail.gap } : undefined}>
          <div ref={cardRef} data-room-card className={`relative flex w-full flex-col ${rail ? "shrink-0" : "mx-auto"}`} style={{ maxWidth: cardWidth }}>{card}</div>
          {rail ? <aside aria-label="Kenar notları" className="relative min-w-0 flex-1" style={{ maxWidth: rail.width }}>{rail.render(cardRef)}</aside> : null}
        </div>
        {below ? <div className={`mt-7 w-full ${rail ? "" : "mx-auto"}`} style={{ maxWidth: cardWidth }}>{below}</div> : null}
      </div>
    </div>
  );
}
