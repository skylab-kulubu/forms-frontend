"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Activity, ArrowRight, ChevronDown, ChevronRight, CircleCheck, History } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";
import { durationText, formatShortDate, shortDuration } from "@/lib/form-timing";
import { TRIGGER } from "../workflow-editor/workflow-graph";
import { triggerStyle } from "../form-studio/studio-flow";
import { FINISHED_ROWS, GROUPS, NEUTRAL_STROKE, RUN_STATE, STROKE, endTriggerOf, possessive, runSubtitle } from "./journey-data";

const PILL_TONE = {
  [TRIGGER.SUBMITTED]: "border-white/10 text-neutral-300",
  [TRIGGER.APPROVED]: "border-emerald-400/30 text-emerald-300",
  [TRIGGER.DECLINED]: "border-red-400/30 text-red-300",
  [TRIGGER.TIMED_OUT]: "border-amber-400/30 text-amber-300",
};

const LINE = {
  [TRIGGER.SUBMITTED]: NEUTRAL_STROKE,
  [TRIGGER.APPROVED]: STROKE,
  [TRIGGER.DECLINED]: "rgba(248,113,113,0.5)",
  [TRIGGER.TIMED_OUT]: "rgba(251,191,36,0.5)",
};

const reduced = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const routeKey = (source, trigger, target) => `${source}|${Number(trigger)}|${target ?? ""}`;
const hasPill = (edge) => Boolean(edge?.label) || edge?.count != null;

export function useElementWidth(ref) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);

  return width;
}

export function scrollToSection(root, id, smooth = true) {
  const element = root?.querySelector(`[data-sec="${CSS.escape(id)}"]`);
  if (!element) return;
  const top = root.scrollTop + element.getBoundingClientRect().top - root.getBoundingClientRect().top - 24;
  root.scrollTo({ top: Math.max(0, top), behavior: smooth && !reduced() ? "smooth" : "auto" });
}

function useFlash(ref, token) {
  useEffect(() => {
    if (!token || !ref.current || reduced()) return;
    ref.current.animate([
      { boxShadow: "0 0 0 0 rgba(224,200,229,0)" },
      { boxShadow: "0 0 0 6px rgba(224,200,229,0.22)", offset: 0.25 },
      { boxShadow: "0 0 0 6px rgba(224,200,229,0)" },
    ], { duration: 1500, delay: 220, easing: "ease-out" });
  }, [ref, token]);
}

function Proportion({ parts }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShown(true), 80);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex h-1.5 w-full gap-0.5" role="img" aria-label={parts.map(([count, , label]) => `${label} ${count}`).join(", ")}>
      {parts.filter(([count]) => count > 0).map(([count, color, label]) => (
        <span key={label} title={`${label}: ${count}`} className={`h-full rounded-full transition-[flex-grow] duration-700 ease-out ${color}`}
          style={{ flexGrow: shown ? count : 1, flexBasis: 0 }}
        />
      ))}
    </div>
  );
}

function Sheet({ sec, pad = "p-6 sm:p-8", flash = null, selected = false, onSelect = null, children }) {
  const ref = useRef(null);
  useFlash(ref, flash);

  return (
    <section ref={ref} data-sec={sec} onClick={onSelect ? (event) => { if (!event.target.closest("button, a, input, label")) onSelect(); } : undefined}
      className={`studio-card relative flex w-full flex-col rounded-3xl border border-white/10 shadow-xl shadow-black/30 transition-shadow duration-200 ${
        selected ? "ring-[6px] ring-skylab-400/25" : onSelect ? "cursor-pointer hover:ring-1 hover:ring-white/15" : ""
      }`}
    >
      <div className={`flex flex-1 flex-col gap-5 ${pad}`}>{children}</div>
    </section>
  );
}

function EdgePill({ trigger = null, x, y, maxWidth = null, children }) {
  return (
    <span className={`absolute z-10 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-1 whitespace-nowrap rounded-md border bg-neutral-900 px-1.5 py-0.5 text-2xs font-medium ${PILL_TONE[trigger] ?? "border-white/10 text-neutral-300"}`}
      style={{ left: x, top: y, maxWidth: maxWidth ?? undefined }}
    >
      {children}
    </span>
  );
}

function TriggerLabel({ trigger, text = null }) {
  const style = triggerStyle(trigger);
  return (
    <>
      <style.Icon size={11} className="shrink-0" />
      <span className="min-w-0 truncate">{text ?? style.label}</span>
    </>
  );
}

function EdgeContent({ edge }) {
  return (
    <>
      {edge.label ? <TriggerLabel trigger={edge.trigger} text={edge.label} /> : null}
      {edge.count != null ? <span className="shrink-0 tabular-nums">{edge.label ? "· " : ""}{edge.count} kişi</span> : null}
    </>
  );
}

function Fork({ trunk, left, right, height = 92 }) {
  const ref = useRef(null);
  const width = useElementWidth(ref);
  const center = width / 2;
  const leftX = (width - 16) / 4;
  const rightX = width / 2 + 8 + (width - 16) / 4;
  const bend = 30;
  const radius = 10;
  const branchMax = Math.max(80, width / 2 - 24);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width ? (
        <>
          <svg className="absolute inset-0" width={width} height={height} aria-hidden="true">
            <path d={`M ${center} 0 V ${bend}`} fill="none" stroke={LINE[trunk?.trigger] ?? NEUTRAL_STROKE} strokeWidth="1.5" />
            <path d={`M ${center} ${bend} H ${leftX + radius} Q ${leftX} ${bend} ${leftX} ${bend + radius} V ${height}`} fill="none" stroke={LINE[left?.trigger] ?? NEUTRAL_STROKE} strokeWidth="1.5" />
            <path d={`M ${center} ${bend} H ${rightX - radius} Q ${rightX} ${bend} ${rightX} ${bend + radius} V ${height}`} fill="none" stroke={LINE[right?.trigger] ?? NEUTRAL_STROKE} strokeWidth="1.5" />
          </svg>
          {hasPill(trunk) ? <EdgePill trigger={trunk.label ? trunk.trigger : null} x={center} y={14}><EdgeContent edge={trunk} /></EdgePill> : null}
          {hasPill(left) ? <EdgePill trigger={left.label ? left.trigger : null} x={leftX} y={64} maxWidth={branchMax}><EdgeContent edge={left} /></EdgePill> : null}
          {hasPill(right) ? <EdgePill trigger={right.label ? right.trigger : null} x={rightX} y={64} maxWidth={branchMax}><EdgeContent edge={right} /></EdgePill> : null}
        </>
      ) : null}
    </div>
  );
}

function Merge({ left, right, trunk, height = 92 }) {
  const ref = useRef(null);
  const width = useElementWidth(ref);
  const center = width / 2;
  const leftX = (width - 16) / 4;
  const rightX = width / 2 + 8 + (width - 16) / 4;
  const bend = height - 30;
  const radius = 10;
  const branchMax = Math.max(80, width / 2 - 24);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width ? (
        <>
          <svg className="absolute inset-0" width={width} height={height} aria-hidden="true">
            <path d={`M ${leftX} 0 V ${bend - radius} Q ${leftX} ${bend} ${leftX + radius} ${bend} H ${center}`} fill="none" stroke={LINE[left?.trigger] ?? NEUTRAL_STROKE} strokeWidth="1.5" />
            <path d={`M ${rightX} 0 V ${bend - radius} Q ${rightX} ${bend} ${rightX - radius} ${bend} H ${center}`} fill="none" stroke={LINE[right?.trigger] ?? NEUTRAL_STROKE} strokeWidth="1.5" />
            <path d={`M ${center} ${bend} V ${height}`} fill="none" stroke={LINE[trunk?.trigger] ?? NEUTRAL_STROKE} strokeWidth="1.5" />
          </svg>
          {hasPill(left) ? <EdgePill trigger={left.label ? left.trigger : null} x={leftX} y={26} maxWidth={branchMax}><EdgeContent edge={left} /></EdgePill> : null}
          {hasPill(right) ? <EdgePill trigger={right.label ? right.trigger : null} x={rightX} y={26} maxWidth={branchMax}><EdgeContent edge={right} /></EdgePill> : null}
          {hasPill(trunk) ? <EdgePill trigger={trunk.label ? trunk.trigger : null} x={center} y={height - 14}><EdgeContent edge={trunk} /></EdgePill> : null}
        </>
      ) : null}
    </div>
  );
}

function Trunk({ edge = null, height = 64 }) {
  return (
    <div className="relative w-full" style={{ height }}>
      <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2" style={{ background: LINE[edge?.trigger] ?? NEUTRAL_STROKE }} />
      {hasPill(edge) ? <EdgePill trigger={edge.label ? edge.trigger : null} x="50%" y={height / 2} maxWidth="calc(100% - 2rem)"><EdgeContent edge={edge} /></EdgePill> : null}
    </div>
  );
}

function SameStage() {
  return (
    <div className="flex items-center gap-2 px-1 py-4">
      <span className="h-px flex-1 bg-white/5" />
      <span className="text-2xs text-neutral-500">Aynı aşamada öbür yol</span>
      <span className="h-px flex-1 bg-white/5" />
    </div>
  );
}

export function PersonRow({ run, narrow = false, onOpen }) {
  const state = Number(run.state);
  const finished = state >= 4;
  const hasResponse = Boolean(run.latestResponse);

  return (
    <button type="button" onClick={() => onOpen(run)} data-run={run.id}
      title={hasResponse ? (finished ? "Son cevabı aç" : "Cevabı aç: onay, ret, düzeltme") : "Bu başvurunun henüz cevabı yok"}
      className="group/row -mx-2 flex min-h-11 w-[calc(100%+1rem)] items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/3"
    >
      <Avatar name={run.applicant?.fullName || ""} email={run.applicant?.email || ""} photoUrl={run.applicant?.profilePictureUrl} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm text-neutral-200 transition-colors group-hover/row:text-neutral-50">{run.applicant?.fullName || "Kullanıcı"}</span>
        <span className={`block truncate text-2xs ${state === 1 ? "font-mono text-amber-100/70" : "text-neutral-500"}`}>{runSubtitle(run)}</span>
      </span>
      {narrow ? null : <span className="hidden max-w-44 shrink truncate text-2xs text-neutral-600 lg:block">{run.applicant?.email ?? ""}</span>}
      <ChevronRight size={14} className="shrink-0 text-neutral-600 transition-transform group-hover/row:translate-x-0.5" />
    </button>
  );
}

function PeopleGroup({ state, count, runs, max, narrow, onOpenRun, onMore }) {
  const meta = RUN_STATE[state];
  const shown = runs.slice(0, max);
  const more = count - shown.length;

  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <span className={`size-1.5 shrink-0 rounded-full ${meta.dot}`} />
        <span className={`text-2xs font-medium ${meta.text}`}>{meta.label}</span>
        <span className="text-2xs tabular-nums text-neutral-500">{count}</span>
        <span className="h-px flex-1 bg-white/5" />
      </div>
      {shown.map((run) => <PersonRow key={run.id} run={run} narrow={narrow} onOpen={onOpenRun} />)}
      {more > 0 ? (
        <button type="button" onClick={onMore} title="Hepsini listede göster"
          className="mt-0.5 flex min-h-11 w-full items-center gap-1 rounded px-0.5 text-2xs text-neutral-500 transition-colors hover:text-neutral-200 sm:inline-flex sm:min-h-8 sm:w-auto"
        >
          {shown.length ? `${more} kişi daha` : `${more} kişiyi listele`}
          <ArrowRight size={11} />
        </button>
      ) : null}
    </div>
  );
}

function FunnelBars({ items, total }) {
  return (
    <div className="space-y-3">
      {items.map(([label, count, extra]) => {
        const share = total > 0 ? (count / total) * 100 : 0;
        const rounded = Math.round(share * 10) / 10;
        return (
          <div key={label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-2xs text-neutral-300">{label}</span>
              <span className="shrink-0 text-2xs tabular-nums text-neutral-500">
                <span className="text-neutral-300">{count}</span> · %{rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1)}{extra ? ` · ${extra}` : ""}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-skylab-500 transition-[width] duration-500" style={{ width: `${Math.min(share, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Participation({ data, onAnalytics }) {
  const [open, setOpen] = useState(false);
  const durations = [...(data.durationMinutes ?? [])].sort((a, b) => a - b);
  const average = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : null;
  const middle = Math.floor(durations.length / 2);
  const median = durations.length ? (durations.length % 2 ? durations[middle] : (durations[middle - 1] + durations[middle]) / 2) : null;
  const minutes = (value) => shortDuration(value * 60000);
  const stalled = data.stalledQuestion;

  return (
    <div className="border-t border-white/5 pt-4">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="group flex min-h-11 w-full items-center gap-2 text-left sm:min-h-8">
        <Activity size={12} className="shrink-0 text-neutral-500" />
        <span className="text-2xs font-medium text-neutral-400">Katılım ve süre</span>
        <span className="h-px flex-1 bg-white/5" />
        {data.timeLimitMinutes ? <span className="text-2xs text-neutral-500">{durationText(data.timeLimitMinutes)}</span> : null}
        <ChevronDown size={13} className={`shrink-0 text-neutral-500 transition-transform duration-200 group-hover:text-neutral-300 ${open ? "" : "-rotate-90"}`} />
      </button>
      <p className="mt-1 text-xs leading-relaxed text-neutral-400">
        <span className="text-neutral-100">{data.opened}</span> kişi görevi açtı, <span className="text-neutral-100">{data.started}</span>{possessive(data.started)} başlattı,{" "}
        <span className="text-neutral-100">{data.submitted}</span>{possessive(data.submitted)} teslim etti.
      </p>
      {open ? (
        <div className="space-y-4 pt-4">
          <FunnelBars total={data.opened} items={[
            ["Formu açtı", data.opened],
            ["Görevi başlattı", data.started],
            ["Teslim etti", data.submitted],
            ["Devam ediyor", data.running],
            ["Teslim yok", data.noSubmission],
            ["Geçici cevap", data.provisional, "karar bekliyor"],
          ]}
          />
          {durations.length ? (
            <p className="text-2xs leading-relaxed text-neutral-400">
              Teslim süresi · Ort <span className="text-neutral-200">{minutes(average)}</span> · Medyan <span className="text-neutral-200">{minutes(median)}</span>
              {" "}· Min <span className="text-neutral-200">{minutes(durations[0])}</span> · Maks <span className="text-neutral-200">{minutes(durations[durations.length - 1])}</span>
            </p>
          ) : null}
          {(data.extendedBy ?? []).map((item) => (
            <p key={item.actor?.id ?? item.actor?.fullName} className="text-2xs leading-relaxed text-neutral-400">
              <span className="text-neutral-200">{item.actor?.fullName || "Bir ekip üyesi"}</span> {item.count} kişiye toplam {durationText(item.minutes)} süre verdi.
            </p>
          ))}
          {stalled?.count ? (
            <p className="text-2xs leading-relaxed text-neutral-400">
              Süresi dolan taslakların <span className="text-neutral-200">{stalled.count}</span> tanesinde ilk boş soru{" "}
              <span className="text-neutral-200">{stalled.number}. soru ({stalled.question})</span>. {stalled.isRequired ? "Zorunlu soru." : "Opsiyonel soru."}
            </p>
          ) : null}
          <button type="button" onClick={onAnalytics} className="inline-flex items-center gap-1 text-2xs text-neutral-500 transition-colors hover:text-neutral-200">
            Analitik&apos;te aç
            <ArrowRight size={11} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function StepSheet({ step, narrow, selected, cardSelect, flash, onSelect, onOpenRun, onMore, onFinishedHere, onAnalytics }) {
  const { node, depth, meta, counts, people, finishedHere, finished, attempts } = step;
  const groups = GROUPS.filter(([key]) => (counts?.[key] ?? 0) > 0);
  const endings = FINISHED_ROWS.map(([key, state]) => [state, finished?.[key] ?? 0]).filter(([, count]) => count > 0);
  const total = counts?.count ?? 0;

  return (
    <Sheet sec={node.nodeKey} pad={narrow ? "p-5" : "p-6 sm:p-8"} flash={flash} selected={selected} onSelect={cardSelect ? onSelect : null}>
      <div className="relative flex items-start gap-3">
        <span className={`grid size-6 shrink-0 place-items-center rounded-md border text-xs font-semibold ${node.isStart ? "border-skylab-400/40 bg-skylab-500/10 text-skylab-300" : "border-white/10 bg-white/5 text-neutral-400"}`}>
          {depth ?? "?"}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className={`font-semibold text-neutral-100 ${narrow ? "text-sm" : "text-base"}`}>
            <button type="button" onClick={onSelect} aria-pressed={selected} title="Bu adımın başvuranlarını listede göster"
              className="text-left transition-colors after:absolute after:-inset-1.5 after:rounded-xl after:content-[''] hover:text-white"
            >
              {node.formTitle || "Adsız form"}
            </button>
          </h2>
          {meta ? <p className="mt-0.5 text-2xs leading-relaxed text-neutral-500">{meta}</p> : null}
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-semibold leading-none tabular-nums text-neutral-50 ${narrow ? "text-xl" : "text-2xl"}`}>{total}</p>
          <p className="mt-1 text-3xs text-neutral-500">kişi bu adımda</p>
        </div>
      </div>

      <div className="space-y-4">
        {groups.length ? groups.map(([key, state]) => (
          <PeopleGroup key={key} state={state} count={counts[key]} runs={people.filter((run) => Number(run.state) === state)} max={narrow ? 3 : 4}
            narrow={narrow} onOpenRun={onOpenRun} onMore={() => onMore(node.nodeKey, state)}
          />
        )) : <p className="text-2xs text-neutral-500">Bu adımda kimse yok.</p>}
      </div>

      {attempts && attempts.opened > 0 ? <Participation data={attempts} onAnalytics={onAnalytics} /> : null}

      {finishedHere > 0 ? (
        <button type="button" onClick={onFinishedHere} title="Bu adımda biten başvuruları listede göster"
          className="flex w-fit flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/5 pt-4 text-left text-2xs text-neutral-500 transition-colors hover:text-neutral-200"
        >
          <span>Buradan biten</span>
          {endings.map(([state, count], position) => (
            <span key={state} className="inline-flex items-center gap-1.5">
              <span className={`size-1.5 rounded-full ${RUN_STATE[state].dot}`} />
              <span className="text-neutral-300">{RUN_STATE[state].label}</span>
              <span className="tabular-nums">{count}</span>
              {position === endings.length - 1 ? <ArrowRight size={11} className="ml-0.5" /> : null}
            </span>
          ))}
        </button>
      ) : null}
    </Sheet>
  );
}

function FinishedSheet({ finished, total, recent, flash, onOpenRun, onMore }) {
  const rows = FINISHED_ROWS.filter(([key]) => key !== "stopped" || (finished?.stopped ?? 0) > 0);

  return (
    <Sheet sec="bitenler" flash={flash}>
      <div className="flex items-start gap-3">
        <span className="grid size-6 shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 text-neutral-400"><CircleCheck size={12} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-neutral-100">Bitenler</h2>
          <p className="mt-0.5 text-2xs text-neutral-500">Akışın sonuna varan ya da yolda kapanan başvurular</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-semibold leading-none tabular-nums text-neutral-50">{total}</p>
          <p className="mt-1 text-3xs text-neutral-500">başvuru</p>
        </div>
      </div>
      <div className="space-y-3">
        <Proportion parts={rows.map(([key, state]) => [finished?.[key] ?? 0, RUN_STATE[state].dot, RUN_STATE[state].label])} />
        <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-x-6 gap-y-1.5">
          {rows.map(([key, state]) => (
            <span key={key} className="flex items-center justify-between gap-2 text-xs">
              <span className="inline-flex min-w-0 items-center gap-1.5 text-neutral-400">
                <span className={`size-1.5 shrink-0 rounded-full ${RUN_STATE[state].dot}`} />
                <span className="truncate">{RUN_STATE[state].label}</span>
              </span>
              <span className="tabular-nums text-neutral-200">{finished?.[key] ?? 0}</span>
            </span>
          ))}
        </div>
      </div>
      {recent.length ? (
        <div>
          <div className="mb-1 flex items-center gap-2">
            <span className="text-2xs font-medium text-neutral-400">Son bitenler</span>
            <span className="h-px flex-1 bg-white/5" />
          </div>
          {recent.map((run) => <PersonRow key={run.id} run={run} onOpen={onOpenRun} />)}
          {total > recent.length ? (
            <button type="button" onClick={onMore} title="Bitenleri listede göster"
              className="mt-0.5 inline-flex min-h-8 items-center gap-1 rounded px-0.5 text-2xs text-neutral-500 transition-colors hover:text-neutral-200"
            >
              {total - recent.length} başvuru daha
              <ArrowRight size={11} />
            </button>
          ) : null}
        </div>
      ) : null}
    </Sheet>
  );
}

function RemovedSheet({ steps, selected, onSelect }) {
  return (
    <Sheet sec="eski" pad="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="grid size-6 shrink-0 place-items-center rounded-md border border-white/10 bg-white/5 text-neutral-400"><History size={12} /></span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-neutral-100">Eski sürümdeki adımlar</h2>
          <p className="mt-0.5 text-2xs leading-relaxed text-neutral-500">Yayındaki sürümde olmayan adımlarda bekleyen başvurular. Başladıkları sürümde devam ederler.</p>
        </div>
      </div>
      <div className="divide-y divide-white/5">
        {steps.map((step) => (
          <button key={step.nodeKey} type="button" onClick={() => onSelect(step.nodeKey)} aria-pressed={selected === step.nodeKey}
            className={`flex w-full items-center gap-2 py-2 text-left text-xs transition-colors ${selected === step.nodeKey ? "text-neutral-100" : "text-neutral-400 hover:text-neutral-200"}`}
          >
            <span className="min-w-0 flex-1 truncate">{step.formTitle || "Adsız form"}</span>
            {step.awaitingReview ? <span className="shrink-0 text-3xs tabular-nums text-amber-200/80">{step.awaitingReview}</span> : null}
            <span className="w-6 shrink-0 text-right text-3xs tabular-nums text-neutral-500">{step.count}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function JourneyHead({ overview, done, pill, versionText, closesText, updatedAt, draft }) {
  const number = (value, tone = "text-neutral-50") => <span className={`text-xl font-semibold tabular-nums sm:text-2xl ${tone}`}>{value}</span>;
  const active = overview?.activeRunCount ?? 0;
  const waiting = overview?.awaitingReviewCount ?? 0;

  return (
    <div data-sec="bas" className="mb-8 px-1">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-2xs font-medium text-neutral-400">Yolculuk</span>
        <span className="h-px flex-1 bg-white/5" />
      </div>
      {draft ? (
        <p className="text-base leading-relaxed text-neutral-300 sm:text-lg">Akış henüz yayınlanmadı. Yayınlanınca başvurular adım adım burada görünür.</p>
      ) : (
        <p className="text-base leading-relaxed text-neutral-300 sm:text-lg">
          {number(active)} kişinin başvurusu sürüyor, {number(waiting, "text-amber-300")}{possessive(waiting)} onay bekliyor. {number(done)} başvuru bitti.
        </p>
      )}
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5 text-neutral-300"><span className={`size-1.5 rounded-full ${pill.dot}`} />{pill.label}</span>
        {versionText ? <><span className="text-neutral-700">·</span><span>{versionText}</span></> : null}
        {closesText ? <><span className="text-neutral-700">·</span><span>{closesText}</span></> : null}
        {updatedAt ? <><span className="text-neutral-700">·</span><span>{formatShortDate(updatedAt)} · dakikada bir yenilenir</span></> : null}
      </p>
    </div>
  );
}

function edgeBetween(transitions, sourceKey, targetKey) {
  return transitions.filter((transition) => transition.sourceNodeKey === sourceKey && transition.targetNodeKey === targetKey);
}

function edgeInfo(edges, labelOf, { withCondition = true, countOf = null } = {}) {
  if (edges.length === 0) return null;
  const count = countOf ? countOf(edges) : null;
  const trigger = Number(edges[0].trigger);
  if (!edges.every((edge) => Number(edge.trigger) === trigger)) return { trigger: null, label: "Birden çok yol", count };
  if (!withCondition) return { trigger, label: triggerStyle(trigger).label, count };
  const special = edges.length === 1 ? labelOf(edges[0]) : null;
  return { trigger, label: special ?? triggerStyle(trigger).label, count };
}

export default function JourneyCanvas({
  scrollRef, width, flow, steps, overview, done, finished, routes = null, recentFinished, removed, pill, versionText, closesText, updatedAt, draft,
  selected, cardSelect, flash, labelOf, onSelect, onOpenRun, onMore, onFinishedHere, onFinished, onAnalytics,
}) {
  const routeTotals = routes ? new Map(routes.map((route) => [routeKey(route.sourceNodeKey, route.trigger, route.targetNodeKey), route.count])) : null;
  const countOf = routeTotals
    ? (edges) => [...new Set(edges.map((edge) => routeKey(edge.sourceNodeKey, edge.trigger, edge.targetNodeKey)))].reduce((sum, key) => sum + (routeTotals.get(key) ?? 0), 0)
    : null;
  const pad = width === 0 || width >= 896 ? 56 : width >= 600 ? 24 : 12;
  const wide = width === 0 || Math.min(width, 784) - 2 * pad >= 560;
  const flashOf = (key) => (flash?.sec === key ? flash.id : null);

  const stepView = (node, narrow) => {
    const step = steps[node.nodeKey];
    return (
      <StepSheet key={node.nodeKey} step={step} narrow={narrow} selected={selected === node.nodeKey} cardSelect={cardSelect} flash={flashOf(node.nodeKey)}
        onSelect={() => onSelect(node.nodeKey)} onOpenRun={onOpenRun} onMore={onMore} onFinishedHere={() => onFinishedHere(node.nodeKey)}
        onAnalytics={() => onAnalytics(node.formId)}
      />
    );
  };

  const columns = flow.columns;
  const blocks = [];

  columns.forEach((group, index) => {
    const previous = index > 0 ? columns[index - 1] : null;
    const twoUp = wide && group.length === 2;

    if (previous) {
      if (previous.length === 1 && group.length === 1) {
        blocks.push(<Trunk key={`c-${index}`} edge={edgeInfo(edgeBetween(flow.transitions, previous[0].nodeKey, group[0].nodeKey), labelOf, { countOf })} />);
      } else if (previous.length === 1 && twoUp) {
        const left = edgeBetween(flow.transitions, previous[0].nodeKey, group[0].nodeKey);
        const right = edgeBetween(flow.transitions, previous[0].nodeKey, group[1].nodeKey);
        const leftInfo = edgeInfo(left, labelOf, { countOf });
        const rightInfo = edgeInfo(right, labelOf, { countOf });
        const sharedTrigger = leftInfo && rightInfo && leftInfo.trigger === rightInfo.trigger ? leftInfo.trigger : null;
        const trunk = sharedTrigger != null ? { trigger: sharedTrigger, label: triggerStyle(sharedTrigger).label } : null;
        const branch = (info) => (info && trunk && info.label === trunk.label ? { trigger: info.trigger, label: null, count: info.count } : info);
        blocks.push(<Fork key={`c-${index}`} trunk={trunk} left={branch(leftInfo)} right={branch(rightInfo)} />);
      } else if (previous.length === 2 && wide && group.length === 1) {
        const leftInfo = edgeInfo(edgeBetween(flow.transitions, previous[0].nodeKey, group[0].nodeKey), labelOf, { withCondition: false, countOf });
        const rightInfo = edgeInfo(edgeBetween(flow.transitions, previous[1].nodeKey, group[0].nodeKey), labelOf, { withCondition: false, countOf });
        const sharedTrigger = leftInfo && rightInfo && leftInfo.trigger === rightInfo.trigger ? leftInfo.trigger : null;
        blocks.push(
          <Merge key={`c-${index}`} trunk={sharedTrigger != null ? { trigger: sharedTrigger, label: triggerStyle(sharedTrigger).label } : null}
            left={sharedTrigger != null ? { trigger: leftInfo?.trigger, count: leftInfo?.count } : leftInfo} right={sharedTrigger != null ? { trigger: rightInfo?.trigger, count: rightInfo?.count } : rightInfo}
          />,
        );
      } else if (previous.length === 2 && wide && twoUp) {
        blocks.push(<Merge key={`m-${index}`} height={56} />);
        blocks.push(<Fork key={`f-${index}`} height={56} />);
      } else if (!twoUp && group.length > 1) {
        blocks.push(null);
      } else {
        const incoming = previous.flatMap((source) => edgeBetween(flow.transitions, source.nodeKey, group[0].nodeKey));
        blocks.push(<Trunk key={`c-${index}`} edge={edgeInfo(incoming, labelOf, { withCondition: previous.length === 1, countOf })} />);
      }
    }

    if (twoUp) {
      const next = columns[index + 1] ?? [];
      const spacer = (node) => {
        const outgoing = flow.transitions.find((transition) => transition.sourceNodeKey === node.nodeKey && next.some((target) => target.nodeKey === transition.targetNodeKey));
        if (outgoing) return LINE[Number(outgoing.trigger)] ?? NEUTRAL_STROKE;
        const end = next.length ? null : endTriggerOf(node, flow.transitions);
        return LINE[end] ?? NEUTRAL_STROKE;
      };
      blocks.push(
        <div key={`s-${index}`} className="grid grid-cols-2 gap-4">
          {group.map((node) => (
            <div key={node.nodeKey} className="flex min-w-0 flex-col">
              {stepView(node, true)}
              <span aria-hidden="true" className="mx-auto min-h-6 w-[1.5px] flex-1" style={{ background: spacer(node) }} />
            </div>
          ))}
        </div>,
      );
    } else if (group.length > 1) {
      group.forEach((node, nodeIndex) => {
        const incoming = (previous ?? []).flatMap((source) => edgeBetween(flow.transitions, source.nodeKey, node.nodeKey));
        if (nodeIndex > 0) blocks.push(<SameStage key={`same-${node.nodeKey}`} />);
        if (previous) blocks.push(<Trunk key={`t-${node.nodeKey}`} height={nodeIndex === 0 ? 56 : 44} edge={edgeInfo(incoming, labelOf, { countOf })} />);
        blocks.push(stepView(node, true));
      });
    } else {
      blocks.push(stepView(group[0], false));
    }
  });

  const last = columns[columns.length - 1] ?? [];
  if (last.length === 2 && wide) {
    const leftEnd = endTriggerOf(last[0], flow.transitions);
    const rightEnd = endTriggerOf(last[1], flow.transitions);
    blocks.push(
      <Merge key="end" left={{ trigger: leftEnd }} right={{ trigger: rightEnd }}
        trunk={{ trigger: leftEnd === rightEnd ? leftEnd : TRIGGER.SUBMITTED, label: "Akış biter" }}
      />,
    );
  } else if (last.length) {
    const trigger = last.length === 1 ? endTriggerOf(last[0], flow.transitions) : null;
    blocks.push(<Trunk key="end" edge={{ trigger: trigger ?? TRIGGER.SUBMITTED, label: trigger != null ? `${triggerStyle(trigger).label} akış biter` : "Akış biter" }} />);
  }

  blocks.push(
    <FinishedSheet key="finished" finished={finished} total={done} recent={recentFinished} flash={flashOf("bitenler")} onOpenRun={onOpenRun} onMore={onFinished} />,
  );

  if (removed.length) {
    blocks.push(<div key="removed-gap" className="h-6" />);
    blocks.push(<RemovedSheet key="removed" steps={removed} selected={selected} onSelect={(key) => onSelect(key)} />);
  }

  return (
    <div ref={scrollRef} data-journey
      className={`${pad === 56 ? "studio-fade" : "studio-fade-edge"} h-full overflow-y-auto overflow-x-hidden bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[22px_22px] bg-local [scrollbar-gutter:stable] scrollbar`}
    >
      <div className="relative mx-auto flex min-h-full w-full flex-col pb-36 pt-4 sm:pb-40 sm:pt-10" style={{ maxWidth: 784, paddingInline: pad }}>
        <JourneyHead overview={overview} done={done} pill={pill} versionText={versionText} closesText={closesText} updatedAt={updatedAt} draft={draft} />
        {blocks.map((block, index) => (block ? <Fragment key={block.key ?? index}>{block}</Fragment> : null))}
      </div>
    </div>
  );
}

