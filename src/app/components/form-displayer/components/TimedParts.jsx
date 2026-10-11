"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, CircleAlert, ClockPlus, Loader2, Timer } from "lucide-react";
import { HOUR, MINUTE, clock, durationAdjective, durationText, formatLongDate, formatShortDate, leftText } from "@/lib/form-timing";
import { HeaderNote } from "./FormDisplayerComponents";

const LINK_BUTTON = "underline underline-offset-3 transition-colors";

function useRemaining(deadlineAt, now) {
  const deadline = deadlineAt ? new Date(deadlineAt).getTime() : null;
  const [remaining, setRemaining] = useState(() => (deadline ? deadline - now() : 0));

  useEffect(() => {
    if (!deadline) return undefined;
    const update = () => setRemaining(deadline - now());
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [deadline, now]);

  return remaining;
}

function toneOf(remaining) {
  if (remaining <= 10 * MINUTE) return "text-red-300";
  if (remaining <= HOUR) return "text-amber-300";
  return "text-skylab-300";
}

export function Countdown({ deadlineAt, now, className = "" }) {
  const remaining = useRemaining(deadlineAt, now);

  return (
    <span className={`inline-flex shrink-0 items-center gap-1 font-mono text-2xs font-semibold tabular-nums transition-colors ${toneOf(remaining)} ${className}`}>
      <Timer size={12} />
      <span>{clock(remaining)}</span>
      <span className="sr-only"> kaldı</span>
    </span>
  );
}

export function TimeLeft({ deadlineAt, now }) {
  const remaining = useRemaining(deadlineAt, now);
  return <span>{leftText(remaining)}</span>;
}

export function useIsLate(deadlineAt, now) {
  const remaining = useRemaining(deadlineAt, now);
  return Boolean(deadlineAt) && remaining > 0 && remaining <= 10 * MINUTE;
}

export function useDeadline(deadlineAt, now, onReached) {
  const callbackRef = useRef(onReached);
  useEffect(() => { callbackRef.current = onReached; });

  useEffect(() => {
    if (!deadlineAt) return undefined;
    const deadline = new Date(deadlineAt).getTime();
    let timer;

    const arm = () => {
      const remaining = deadline - now();
      if (remaining <= 0) {
        callbackRef.current?.();
        return;
      }
      timer = setTimeout(arm, Math.min(remaining, 60 * MINUTE));
    };

    arm();
    return () => clearTimeout(timer);
  }, [deadlineAt, now]);
}

export function TaskMeta({ attempt, closesAt, now }) {
  if (attempt?.state === "running" && attempt.deadlineAt) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Timer size={12} />
        Bitiş <span className="tabular-nums text-neutral-300">{formatShortDate(attempt.deadlineAt)}</span> · <TimeLeft deadlineAt={attempt.deadlineAt} now={now} />
      </span>
    );
  }

  if (!attempt && closesAt) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Timer size={12} />
        Kapanış <span className="tabular-nums text-neutral-300">{formatShortDate(closesAt)}</span> · <TimeLeft deadlineAt={closesAt} now={now} />
      </span>
    );
  }

  return null;
}

export function ExtensionNotice({ attempt }) {
  const extension = attempt?.lastExtension;
  if (!extension || attempt?.state !== "running") return null;

  return (
    <HeaderNote icon={ClockPlus}>
      Ekip sürenize {durationText(extension.minutes)} ekledi
      <span className="text-neutral-500"> · <span className="whitespace-nowrap">yeni bitiş {formatShortDate(attempt.deadlineAt)}</span></span>
    </HeaderNote>
  );
}

export function DeliverablesHeader() {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <div className="flex flex-col p-2 md:p-4">
        <div className="flex items-center gap-3">
          <p className="min-w-0 max-w-[70%] wrap-break-word text-lg font-medium text-neutral-100">Teslim</p>
          <div className="h-px flex-1 bg-white/10" />
        </div>
        <p className="mt-1 wrap-break-word text-xs text-neutral-400">Görevi bitirdiğinizde aşağıdaki soruları doldurun.</p>
      </div>
    </div>
  );
}

function GateRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-neutral-500">{label}</dt>
      <dd className="min-w-0 text-right tabular-nums text-neutral-200">{children}</dd>
    </div>
  );
}

export function TaskGate({ attempt, now, onStart, starting = false, error = null }) {
  const [confirming, setConfirming] = useState(false);
  const minutes = attempt?.timeLimitMinutes ?? 0;
  const end = new Date(now() + minutes * MINUTE);
  const deliverables = attempt?.deliverables ?? [];

  return (
    <div className="px-2 md:px-4">
      <div className="flex gap-3">
        <Timer size={18} strokeWidth={1.8} className="mt-0.5 shrink-0 text-skylab-300" />
        <div>
          <p className="text-sm font-medium text-neutral-100">Bu görev süreli</p>
          <p className="mt-1 text-xs leading-5 text-neutral-400">
            Başlattığınız anda {durationAdjective(minutes)} süreniz başlar ve durdurulamaz. Süre sunucuda işler; sekmeyi kapatsanız ya da başka bir cihazdan girseniz de devam eder.
          </p>
        </div>
      </div>

      <dl className="mt-5 divide-y divide-white/5 border-y border-white/5 text-xs">
        <GateRow label="Süre">{durationText(minutes)}</GateRow>
        <GateRow label="Bitiş">
          {formatLongDate(end)}
          <span className="block text-2xs text-neutral-500">şimdi başlatırsanız</span>
        </GateRow>
        {attempt?.startClosesAt && <GateRow label="Son başlama">{formatLongDate(attempt.startClosesAt)}</GateRow>}
        {deliverables.length > 0 && <GateRow label="Teslim">{deliverables.join(", ")}</GateRow>}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        {confirming ? (
          <>
            <p className="w-full text-xs leading-5 text-neutral-300">
              Süreniz şimdi başlayacak. Bitiş <span className="tabular-nums text-neutral-100">{formatLongDate(end)}</span>.
            </p>
            <button type="button" onClick={onStart} disabled={starting}
              className="relative inline-flex h-8 min-w-24 items-center justify-center overflow-hidden rounded-lg border border-skylab-400/40 bg-skylab-500/15 px-3 py-2 text-xs font-semibold text-skylab-300 transition-colors hover:bg-skylab-500/25 disabled:opacity-60"
            >
              {starting ? <Loader2 size={14} className="animate-spin" /> : "Başlat"}
            </button>
            <button type="button" onClick={() => setConfirming(false)} disabled={starting}
              className={`text-xs ${LINK_BUTTON} text-neutral-300 decoration-white/20 hover:text-neutral-100 hover:decoration-white/50`}
            >
              Vazgeç
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setConfirming(true)}
              className="relative inline-flex h-8 min-w-24 items-center justify-center gap-1.5 overflow-hidden rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-100 transition-colors hover:border-pink-100/40 hover:bg-pink-100/30 hover:text-pink-100"
            >
              Görevi başlat
              <ChevronRight size={14} />
            </button>
            <span className="text-xs text-neutral-500">Görev metni ve sorular başlatınca açılır.</span>
          </>
        )}
      </div>

      {error && (
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-red-200" role="alert">
          <CircleAlert size={14} className="mt-0.5 shrink-0 text-red-300" />
          {error}
        </p>
      )}
    </div>
  );
}

