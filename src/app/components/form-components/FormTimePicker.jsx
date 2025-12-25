"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { FieldShell } from "./FieldShell";
import { useProp } from "@/app/admin/components/form-editor/components/useProp";

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseTime(str) {
  if (!str || typeof str !== "string") return null;
  const m = str.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return { h, m: min };
}

function formatTime24({ h, m }) {
  return `${pad2(h)}:${pad2(m)}`;
}

function toDisplay({ h, m }) {
  return `${pad2(h)}:${pad2(m)}`;
}

function clampStep(minute, step) {
  if (step <= 1) return minute;
  const r = Math.round(minute / step) * step;
  return Math.max(0, Math.min(59, r));
}

export function CreateFormTimePicker({ questionNumber, props, onPropsChange, readOnly }) {
  const {prop, bind, toggle} = useProp(props, onPropsChange, readOnly);

  return (
    <FieldShell number={questionNumber} title="Zaman Seçici" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="tp-question" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <input id="tp-question" type="text" {...bind("question")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="tp-description" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Açıklama
        </label>
        <input id="tp-description" type="text" {...bind("description")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Açıklamanızı buraya yazın."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Örnek Cevap
        </label>
        <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-3 text-center text-sm text-neutral-400">
          <div className="mx-auto inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <Clock size={16} />
            <span>Timepicker burada görünecek</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">24 saat • 5 dk adım</div>
        </div>
      </div>
    </FieldShell>
  );
}

export function DisplayFormTimePicker({ question, questionNumber, description, required = false, value, onChange, missing = false }) {
  const [internalValue, setInternalValue] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const currentValue = value !== undefined ? (value ?? "") : internalValue;
  const parsed = parseTime(currentValue) ?? null;

  const commit = (nextStr) => {
    if (onChange) {
      onChange({ target: { value: nextStr } });
    } else {
      setInternalValue(nextStr);
    }
  };

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      const t = e.target;
      if (popoverRef.current && !popoverRef.current.contains(t) && triggerRef.current && !triggerRef.current.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);

  const minutes = useMemo(() => {
    const step = 5;
    const arr = [];
    for (let m = 0; m < 60; m += step) arr.push(m);
    return arr;
  }, []);

  const initial = useMemo(() => {
    const now = new Date();
    const h = now.getHours();
    const m = clampStep(now.getMinutes(), 5);
    return { h, m };
  }, []);

  const [selHour, setSelHour] = useState(parsed?.h ?? initial.h);
  const [selMinute, setSelMinute] = useState(parsed?.m ?? initial.m);

  useEffect(() => {
    if (open) {
      setSelHour(parsed?.h ?? initial.h);
      setSelMinute(parsed?.m ?? initial.m);
    }
  }, [open]);

  const apply = (h, m) => {
    const t = formatTime24({ h, m });
    commit(t);
    setOpen(false);
  };

  const display = parsed ? toDisplay(parsed) : "Saat seçin";

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <div className="flex flex-col p-2 md:p-4">
        <div className="flex gap-3">
          {questionNumber != null && (
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-300">
              {questionNumber}
            </div>
          )}

          <div className="flex flex-col">
            <p className="text-sm font-medium text-neutral-100">
              {question}{" "} {required && <span className="ml-1 text-red-200/70">*</span>}
            </p>
            {description && ( <p className="my-1 text-xs text-neutral-400">{description}</p>)}
          </div>
        </div>

        <div className="relative mt-3" ref={triggerRef}>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Clock size={16} />
          </span>
          <button type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen((s) => !s)}
            className={`flex w-full items-center justify-between rounded-lg border bg-neutral-900/60 pl-9 pr-3 py-2 text-left text-sm text-neutral-100 outline-none transition hover:bg-white/5 focus:ring-2 focus:ring-white/20 ${missing ? "border-red-400/60 focus:border-red-400/80" : "border-white/10 focus:border-white/30"}`}
          >
            <span className={parsed ? "text-neutral-100" : "text-neutral-500"}>{display}</span>
          </button>

          {open && (
            <div ref={popoverRef}
              className="absolute z-20 mt-2 max-w-[280px] w-full rounded-xl border border-white/10 bg-neutral-900/40 p-2.5 shadow-lg backdrop-blur-md supports-backdrop-filter:bg-neutral-900/30"
              role="dialog" aria-label="Saat seçici"
            >
              <div className="flex items-center justify-between gap-2 p-1 rounded-md bg-white/5">
                <div className="text-xs text-neutral-100">{toDisplay({ h: selHour, m: selMinute })}</div>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-1.5 md:grid-cols-3">
                <div className="max-h-40 overflow-auto rounded-md border border-white/10 bg-white/5 p-1">
                  {hours.map((h) => (
                    <button key={`h_${h}`} type="button"
                      onClick={() => { setSelHour(h); }}
                      className={`block w-full rounded-md px-1.5 py-1 text-left text-xs transition hover:bg-white/10 ${selHour === h ? "bg-white/15 text-neutral-100 ring-1 ring-white/20" : "text-neutral-200"}`}
                    >
                      {pad2(h)}
                    </button>
                  ))}
                </div>
                <div className="max-h-40 overflow-auto rounded-md border border-white/10 bg-white/5 p-1">
                  {minutes.map((m) => (
                    <button key={`m_${m}`} type="button"
                      onClick={() => { setSelMinute(m); }}
                      className={`block w-full rounded-md px-1.5 py-1 text-left text-xs transition hover:bg-white/10 ${selMinute === m ? "bg-white/15 text-neutral-100 ring-1 ring-white/20" : "text-neutral-200"}`}
                    >
                      {pad2(m)}
                    </button>
                  ))}
                </div>
                <div className="hidden md:block" />
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button type="button" onClick={() => { commit(""); setOpen(false); }}
                  className="text-[11px] text-neutral-400 hover:text-neutral-200"
                >
                  Temizle
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setOpen(false)}
                    className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-neutral-200 hover:bg-white/10"
                  >
                    İptal
                  </button>
                  <button type="button" onClick={() => apply(selHour, selMinute)}
                    className="rounded-md border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs text-neutral-100 hover:bg-white/15"
                  >
                    Seç
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <input type="hidden" name="time" value={currentValue} />

        {required && <span className="px-0.5 text-[11px] text-neutral-500 mt-1">Zorunlu alan</span>}
      </div>
    </div>
  );
}
