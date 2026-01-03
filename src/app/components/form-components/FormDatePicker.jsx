"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { FieldShell } from "./FieldShell";
import { useProp } from "@/app/admin/components/form-editor/components/useProp";
import { AnimatePresence } from "framer-motion";
import DatePicker from "../utils/DatePicker";

function pad2(n) { return String(n).padStart(2, "0"); }

function toYMD(d) {
  if (!(d instanceof Date) || isNaN(d)) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYMD(s) {
  if (!s || typeof s !== "string") return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  return dt;
}

const months = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function CreateFormDatePicker({ questionNumber, props, onPropsChange, readOnly }) {
  const { prop, bind, toggle } = useProp(props, onPropsChange, readOnly);

  return (
    <FieldShell number={questionNumber} title="Tarih Seçici" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="dp-question" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <input id="dp-question" type="text" {...bind("question")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="dp-description" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Açıklama
        </label>
        <input id="dp-description" type="text" {...bind("description")}
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
            <Calendar size={16} />
            <span>Tarih seçici burada görünecek.</span>
          </div>
        </div>
      </div>
    </FieldShell>
  );
}

export function DisplayFormDatePicker({ question, questionNumber, description, required = false, value, onChange, missing = false }) {
  const [internalValue, setInternalValue] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const selected = useMemo(() => parseYMD(value ?? internalValue), [value, internalValue]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!open) return;
      const t = e.target;
      if (triggerRef.current && !triggerRef.current.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const commit = (next) => {
    if (onChange) onChange({ target: { value: next } });
    else setInternalValue(next);
  };

  const display = selected ? `${pad2(selected.getDate())} ${months[selected.getMonth()]} ${selected.getFullYear()}` : "Tarih seçin";

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
            {description && (<p className="my-1 text-xs text-neutral-400">{description}</p>)}
          </div>
        </div>

        <div className="relative mt-3" ref={triggerRef}>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <Calendar size={16} />
          </span>
          <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((s) => !s)}
            className={`flex w-full items-center justify-between rounded-lg border bg-neutral-900/60 pl-9 pr-3 py-2 text-left text-sm text-neutral-100 outline-none transition hover:bg-white/5 focus:ring-2 focus:ring-white/20 ${missing ? "border-red-400/60 focus:border-red-400/80" : "border-white/10 focus:border-white/30"}`}
          >
            <span className={selected ? "text-neutral-100" : "text-neutral-500"}>{display}</span>
          </button>

          <AnimatePresence>
            {open && (
              <DatePicker value={selected}
                onChange={(date) => { commit(toYMD(date)); }}
                onClose={() => setOpen(false)}
              />
            )}
          </AnimatePresence>
        </div>

        <input type="hidden" name="date" value={value !== undefined ? (value ?? "") : internalValue} />

        {required && <span className="px-0.5 text-[11px] text-neutral-500 mt-1">Zorunlu alan</span>}
      </div>
    </div>
  );
}