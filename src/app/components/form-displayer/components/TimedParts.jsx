"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, ClockPlus, Timer } from "lucide-react";
import { Button, Notice } from "@skylab-kulubu/skylcn-ui";
import { HOUR, MINUTE, clock, durationAdjective, durationText, formatLongDate, formatShortDate, leftText } from "@/lib/form-timing";
import { HeaderNote } from "./FormDisplayerComponents";

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
  if (remaining <= 10 * MINUTE) return "text-destructive";
  if (remaining <= HOUR) return "text-warning";
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
        Bitiş <span className="tabular-nums text-secondary-foreground">{formatShortDate(attempt.deadlineAt)}</span> · <TimeLeft deadlineAt={attempt.deadlineAt} now={now} />
      </span>
    );
  }

  if (!attempt && closesAt) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Timer size={12} />
        Kapanış <span className="tabular-nums text-secondary-foreground">{formatShortDate(closesAt)}</span> · <TimeLeft deadlineAt={closesAt} now={now} />
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
      <span className="text-subtle-foreground"> · <span className="whitespace-nowrap">yeni bitiş {formatShortDate(attempt.deadlineAt)}</span></span>
    </HeaderNote>
  );
}

export function DeliverablesHeader() {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <div className="flex flex-col p-2 md:p-4">
        <div className="flex items-center gap-3">
          <p className="min-w-0 max-w-[70%] wrap-break-word text-lg font-medium text-foreground">Teslim</p>
          <div className="h-px flex-1 bg-border" />
        </div>
        <p className="mt-1 wrap-break-word text-xs leading-relaxed text-muted-foreground">Görevi bitirdiğinizde aşağıdaki soruları doldurun.</p>
      </div>
    </div>
  );
}

function GateRow({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="shrink-0 text-subtle-foreground">{label}</dt>
      <dd className="min-w-0 text-right tabular-nums text-secondary-foreground">{children}</dd>
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
          <p className="text-sm font-medium text-foreground">Bu görev süreli</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Başlattığınız anda {durationAdjective(minutes)} süreniz başlar ve durdurulamaz. Süre sunucuda işler; sekmeyi kapatsanız ya da başka bir cihazdan girseniz de devam eder.
          </p>
        </div>
      </div>

      <dl className="mt-5 divide-y divide-border-subtle border-y border-border-subtle text-xs">
        <GateRow label="Süre">{durationText(minutes)}</GateRow>
        <GateRow label="Bitiş">
          {formatLongDate(end)}
          <span className="block text-2xs text-subtle-foreground">şimdi başlatırsanız</span>
        </GateRow>
        {attempt?.startClosesAt && <GateRow label="Son başlama">{formatLongDate(attempt.startClosesAt)}</GateRow>}
        {deliverables.length > 0 && <GateRow label="Teslim">{deliverables.join(", ")}</GateRow>}
      </dl>

      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2.5">
        {confirming ? (
          <>
            <p className="w-full text-xs leading-5 text-secondary-foreground">
              Süreniz şimdi başlayacak. Bitiş <span className="tabular-nums text-foreground">{formatLongDate(end)}</span>.
            </p>
            <Button variant="primary" size="md" onClick={onStart} pending={starting} className="min-w-24">
              Başlat
            </Button>
            <Button variant="ghost" size="md" onClick={() => setConfirming(false)} disabled={starting}>
              Vazgeç
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" size="md" onClick={() => setConfirming(true)} className="min-w-24">
              Görevi başlat
              <ChevronRight />
            </Button>
            <span className="text-xs text-subtle-foreground">Görev metni ve sorular başlatınca açılır.</span>
          </>
        )}
      </div>

      {error && <Notice tone="danger" className="mt-3">{error}</Notice>}
    </div>
  );
}

