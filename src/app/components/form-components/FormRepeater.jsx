"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X, ArrowUp, ArrowDown, Type, AlignLeft, ToggleRight, ChevronsUpDown, ListChecks, Calendar, Clock } from "lucide-react";
import { FieldShell } from "./FieldShell";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";
import { REGISTRY } from "../form-registry";
import { formatFieldAnswer } from "../form-answer-format";

const CHILD_TYPES = [
  { type: "short_text", label: "Kısa Yanıt", icon: Type },
  { type: "long_text", label: "Uzun Yanıt", icon: AlignLeft },
  { type: "toggle", label: "Aç / Kapat", icon: ToggleRight },
  { type: "combobox", label: "Açılır Liste", icon: ChevronsUpDown },
  { type: "multi_choice", label: "Çoklu Seçim", icon: ListChecks },
  { type: "date", label: "Tarih", icon: Calendar },
  { type: "time", label: "Saat", icon: Clock },
];

function genId() {
  return "f" + Math.random().toString(36).slice(2, 9);
}

function emptyCellFor(type) {
  if (type === "multi_choice") return [];
  if (type === "toggle") return false;
  return "";
}

function emptyRow(fields) {
  const row = {};
  fields.forEach((f) => { row[f.id] = emptyCellFor(f.type); });
  return row;
}

export function repeaterColumnLabels(fields) {
  const cols = Array.isArray(fields) ? fields : [];
  const seen = {};
  return cols.map((child) => {
    const base = (child.props?.question || "").trim() || (REGISTRY[child.type]?.label ?? child.type);
    if (seen[base] === undefined) {
      seen[base] = 1;
      return base;
    }
    seen[base] += 1;
    return `${base} (${seen[base]})`;
  });
}

export function serializeRepeater(fields, value) {
  const cols = Array.isArray(fields) ? fields : [];
  const rows = Array.isArray(value) ? value : [];
  const labels = repeaterColumnLabels(cols);
  const out = rows
    .map((row) => {
      const o = {};
      cols.forEach((child, i) => { o[labels[i]] = formatFieldAnswer(child, row?.[child.id]); });
      return o;
    })
    .filter((o) => Object.values(o).some((v) => String(v).trim() !== ""));
  return out.length ? JSON.stringify(out) : "";
}

export function isRepeaterComplete(fields, value) {
  const cols = Array.isArray(fields) ? fields : [];
  const rows = Array.isArray(value) ? value : [];
  if (!cols.length) return false;
  return rows.some((row) => cols.every((child) => {
    const v = row?.[child.id];
    if (child.type === "toggle") return v === true || v === false;
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === "object") return Object.keys(v).length > 0;
    return v != null && String(v).trim() !== "";
  }));
}

function ChildPicker({ onAdd }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0, scale: 0.98 }} animate={{ opacity: 1, height: "auto", scale: 1 }} exit={{ opacity: 0, height: 0, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden"
          >
            <div className="mb-2 flex flex-wrap items-center justify-center gap-1 rounded-lg border border-white/10 bg-neutral-900 px-2 py-1.5 shadow-lg">
              {CHILD_TYPES.map((c) => (
                <button key={c.type} type="button" aria-label={c.label} onClick={() => { onAdd(c.type); setOpen(false); }}
                  className="flex w-18 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
                >
                  <c.icon size={15} />
                  <span className="w-full truncate text-center text-3xs leading-none">{c.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button type="button" onClick={() => setOpen((o) => !o)}
        className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-white/15 bg-white/3 px-3 py-2 text-xs font-medium text-neutral-300 transition hover:bg-white/8 hover:text-neutral-100"
      >
        <Plus size={14} /> Bileşen Ekle
      </button>
    </div>
  );
}

export function CreateFormRepeater({ questionNumber, props, onPropsChange, readOnly, ...rest }) {
  const { prop, bind, toggle, patch } = useProp(props, onPropsChange, readOnly);
  const fields = Array.isArray(prop.fields) ? prop.fields : [];

  const updateChild = (id, changes) => patch({ fields: fields.map((f) => (f.id === id ? { ...f, ...changes } : f)) });
  const addChild = (type) => patch({ fields: [...fields, { id: genId(), type, props: structuredClone(REGISTRY[type]?.defaults ?? {}) }] });
  const removeChild = (id) => patch({ fields: fields.filter((f) => f.id !== id) });
  const moveChild = (id, dir) => {
    const i = fields.findIndex((f) => f.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    patch({ fields: next });
  };

  return (
    <FieldShell number={questionNumber} title="Tekrarlanan Grup" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)} {...rest}>
      <div className="flex flex-col gap-1.5">
        <label className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">Soru Metni</label>
        <AutoResizeTextarea {...bind("question")} className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20" placeholder="Sorunuzu buraya yazın." />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">Açıklama</label>
        <AutoResizeTextarea {...bind("description")} className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20" placeholder="Açıklamanızı buraya yazın." />
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center gap-2 px-0.5">
          <label className="text-2xs font-medium uppercase tracking-wide text-neutral-400">Her Kayıtta Tekrar Eden Alanlar</label>
          <span className="rounded-md bg-white/10 px-1.5 py-0.5 text-3xs font-semibold text-neutral-300">{fields.length}</span>
          <span className="h-px flex-1 bg-white/5" />
        </div>

        {fields.length === 0 && (
          <p className="px-0.5 text-2xs italic text-neutral-500">Aşağıdan bileşen ekleyin; her kayıt bu alanların bir kopyası olur.</p>
        )}

        {fields.map((child, idx) => {
          const entry = REGISTRY[child.type];
          const ChildCreate = entry?.Create;
          return (
            <div key={child.id} className="flex flex-col gap-1.5 rounded-lg border border-white/10 bg-white/2 p-2">
              <div className="flex items-center justify-between px-0.5">
                <span className="text-3xs font-medium text-neutral-500">Alan {idx + 1} &middot; {entry?.label ?? child.type}</span>
                <div className="flex items-center gap-0.5">
                  <button type="button" onClick={() => moveChild(child.id, -1)} disabled={idx === 0} aria-label="Yukarı taşı"
                    className="grid size-6 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-white/10 hover:text-neutral-200 disabled:opacity-30"
                  >
                    <ArrowUp size={13} />
                  </button>
                  <button type="button" onClick={() => moveChild(child.id, 1)} disabled={idx === fields.length - 1} aria-label="Aşağı taşı"
                    className="grid size-6 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-white/10 hover:text-neutral-200 disabled:opacity-30"
                  >
                    <ArrowDown size={13} />
                  </button>
                  <button type="button" onClick={() => removeChild(child.id)} aria-label="Alanı kaldır"
                    className="grid size-6 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
              {ChildCreate ? (
                <ChildCreate questionNumber={idx + 1} props={child.props}
                  onPropsChange={(next) => updateChild(child.id, { props: next })}
                  compact
                />
              ) : null}
            </div>
          );
        })}

        <ChildPicker onAdd={addChild} />
      </div>
    </FieldShell>
  );
}

export function DisplayFormRepeater({ question, questionNumber, description, required = false, fields = [], value, onChange, missing = false }) {
  const cols = Array.isArray(fields) ? fields : [];
  const normalize = (v) => (Array.isArray(v) ? v : []);
  const [internal, setInternal] = useState(normalize(value));
  const committed = value !== undefined ? normalize(value) : internal;
  const rows = committed.length ? committed : [emptyRow(cols)];

  const commit = (next) => {
    if (onChange) onChange({ target: { value: next } });
    else setInternal(next);
  };

  const updateCell = (rowIdx, childId, cellVal) => {
    commit(rows.map((r, i) => (i === rowIdx ? { ...r, [childId]: cellVal } : r)));
  };
  const addRow = () => commit([...rows, emptyRow(cols)]);
  const removeRow = (rowIdx) => commit(rows.filter((_, i) => i !== rowIdx));

  const hasFields = cols.length > 0;

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <div className="flex flex-col p-2 md:p-4">
        <div className="flex gap-3">
          {questionNumber != null && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-300">
              {questionNumber}
            </div>
          )}
          <div className="flex flex-col">
            <p className="text-sm font-medium text-neutral-100">
              {question || <span className="font-normal italic text-neutral-500">Bu soru için metin yok</span>} {required && <span className="ml-1 text-red-200/70">*</span>}
            </p>
            {description && (<p className="my-1 text-xs text-neutral-400">{description}</p>)}
          </div>
        </div>

        {!hasFields ? (
          <p className="mt-3 text-xs italic text-neutral-500">Bu grup için henüz alan tanımlanmadı.</p>
        ) : (
          <div className={`mt-3 flex flex-col gap-3 rounded-xl ${missing ? "ring-1 ring-red-400/40" : ""}`}>
            <AnimatePresence initial={false}>
              {rows.map((row, rowIdx) => (
                <motion.div key={rowIdx} layout
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="rounded-lg border border-white/10 bg-neutral-900/40"
                >
                  <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5">
                    <span className="text-3xs font-medium text-neutral-500">{rowIdx + 1}. kayıt</span>
                    {rows.length > 1 && (
                      <button type="button" onClick={() => removeRow(rowIdx)} aria-label="Kaydı kaldır"
                        className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 p-1 text-neutral-400 transition-colors hover:bg-red-500/10 hover:text-red-200"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col gap-3 p-3">
                    {cols.map((child) => {
                      const entry = REGISTRY[child.type];
                      const ChildDisplay = entry?.Display;
                      if (!ChildDisplay) return null;
                      return (
                        <ChildDisplay key={child.id} {...child.props} disableAutoFill compact questionNumber={null}
                          value={row[child.id]} onChange={(e) => updateCell(rowIdx, child.id, e.target.value)}
                          missing={missing && rowIdx === 0}
                        />
                      );
                    })}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <button type="button" onClick={addRow}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-white/15 bg-white/3 px-3 py-2 text-xs font-medium text-neutral-400 transition-colors hover:border-skylab-400/40 hover:text-skylab-300"
            >
              <Plus size={14} /> Kayıt Ekle
            </button>
          </div>
        )}

        {required && <span className="px-0.5 text-2xs text-neutral-500 mt-2">En az bir kayıt girin</span>}
      </div>
    </div>
  );
}
