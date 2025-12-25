"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronsUpDown, Plus, Search, X } from "lucide-react";
import { FieldShell } from "./FieldShell";
import { useProp } from "@/app/admin/components/form-editor/components/useProp";

function normalizeOptions(choices) {
  return (choices ?? []).map((choice, idx) => {
    if (typeof choice === "string") {
      return { id: String(idx), label: choice };
    }
    const id = String(choice?.id ?? choice?.value ?? idx);
    const label = String(choice?.label ?? choice?.value ?? `Seçenek ${idx + 1}`);
    return { id, label };
  });
}

export function CreateFormCombobox({ questionNumber, props, onPropsChange, readOnly }) {
  const { prop, bind, toggle, patch } = useProp(props, onPropsChange, readOnly);

  const addChoice = () => {
    const next = [...(prop.choices ?? []), `Seçenek ${((prop.choices ?? []).length + 1)}`];
    patch({ choices: next });
  };
  const updateChoice = (index, value) => {
    const next = [...(prop.choices ?? [])];
    next[index] = value;
    patch({ choices: next });
  };

  const removeChoice = (index) => {
    const array = prop.choices ?? [];
    const next = array.length > 1 ? array.filter((_, i) => i !== index) : array;
    patch({ choices: next });
  };

  return (
    <FieldShell number={questionNumber} title="Açılır Liste" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cb-question" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <input id="cb-question" type="text" {...bind("question")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="cb-description" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Açıklama
        </label>
        <input id="cb-description" type="text" {...bind("description")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Açıklamanızı buraya yazın."
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2 py-1">
        <span className="text-[12px] text-neutral-300">Serbest girişe izin ver</span>
        <div className="inline-flex rounded-lg border border-white/15 bg-white/5 p-0.5">
          <button type="button" aria-pressed={!prop.allowCustom} onClick={() => toggle("allowCustom", false)}
            className={`px-2 py-1 text-[11px] rounded-lg transition focus:outline-none ${!prop.allowCustom ? "bg-white/10 text-neutral-100" : "text-neutral-300 hover:text-neutral-200"}`}
          >
            Hayır
          </button>
          <button type="button" aria-pressed={prop.allowCustom} onClick={() => toggle("allowCustom", true)}
            className={`px-2 py-1 text-[11px] rounded-lg transition focus:outline-none ${prop.allowCustom ? "bg-emerald-500/20 text-emerald-200" : "text-neutral-300 hover:text-neutral-200"}`}
          >
            Evet
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Seçenekler</label>
        <div className="flex flex-col gap-2">
          {prop.choices.map((choice, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input type="text"
                className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30"
                placeholder={`Seçenek ${idx + 1}`} value={choice} onChange={(e) => updateChoice(idx, e.target.value)}
              />
              <button type="button" onClick={() => removeChoice(idx)}
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-neutral-300 hover:text-neutral-100 disabled:opacity-50"
                disabled={prop.choices.length <= 1}
              >
                <X size={18} />
              </button>
            </div>
          ))}
          <div>
            <button type="button" onClick={addChoice}
              className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] text-neutral-100 hover:bg-white/10"
            >
              <Plus size={14} /> Seçenek Ekle
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Örnek Cevap
        </label>
        <div className="rounded-lg border border-white/10 bg-neutral-900/60 p-3 text-sm text-neutral-400">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <ChevronsUpDown size={16} />
            </span>
            <button type="button" disabled
              className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 py-2 text-left text-sm text-neutral-100 outline-none"
            >
              <span className="text-neutral-500">Bir seçenek seçin</span>
            </button>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">Tek seçenek seçilir {prop.allowCustom ? " • serbest giriş açık" : ""}</div>
        </div>
      </div>
    </FieldShell>
  );
}

export function DisplayFormCombobox({ question, questionNumber, description, required = false, choices = [], allowCustom = false, value, onChange, missing = false }) {
  const [internalValue, setInternalValue] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);

  const normalized = useMemo(() => normalizeOptions(choices), [choices]);
  const currentValue = value !== undefined ? (value ?? "") : internalValue;
  const selectedLabel = useMemo(() => {
    const found = normalized.find((o) => o.id === currentValue || o.label === currentValue);
    return found?.label ?? (currentValue || "");
  }, [normalized, currentValue]);

  const commit = (next) => {
    if (onChange) {
      onChange({ target: { value: next } });
    } else {
      setInternalValue(next);
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalized;
    return normalized.filter((o) => o.label.toLowerCase().includes(q));
  }, [normalized, query]);

  const canCreate = allowCustom && query.trim().length > 0 && !normalized.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());

  const choose = (idOrLabel) => {
    commit(idOrLabel);
    setOpen(false);
    setQuery("");
  };

  const clear = () => {
    commit("");
    setQuery("");
  };

  const displayText = selectedLabel || "Bir seçenek seçin";

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
            <ChevronsUpDown size={16} />
          </span>
          <button type="button" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen((s) => !s)}
            className={`flex w-full items-center justify-between rounded-lg border bg-neutral-900/60 pl-9 pr-3 py-2 text-left text-sm text-neutral-100 outline-none transition hover:bg-white/5 focus:ring-2 focus:ring-white/20 ${missing ? "border-red-400/60 focus:border-red-400/80" : "border-white/10 focus:border-white/30"}`}
          >
            <span className={currentValue ? "text-neutral-100" : "text-neutral-500"}>{displayText}</span>
            {currentValue && (
              <span className="ml-2 text-neutral-400 hover:text-neutral-200" onClick={(e) => { e.stopPropagation(); clear(); }}>
                <X size={16} />
              </span>
            )}
          </button>

          {open && (
            <div ref={popoverRef} role="dialog" aria-label="Seçim kutusu"
              className="absolute z-20 mt-2 w-full rounded-xl border border-white/10 bg-neutral-900/40 p-2.5 text-neutral-100 shadow-lg backdrop-blur-md supports-backdrop-filter:bg-neutral-900/30"
            >
              <div className="relative">
                <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Search size={14} />
                </span>
                <input autoFocus type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ara..."
                  className="w-full rounded-md border border-white/10 bg-white/5 pl-7 pr-2 py-1.5 text-sm text-neutral-100 outline-none placeholder-neutral-500 focus:border-white/20"
                />
              </div>

              <div className="mt-2 max-h-56 overflow-auto rounded-md border border-white/10 bg-white/5">
                {filtered.length === 0 && !canCreate && (
                  <div className="px-2 py-2 text-[12px] text-neutral-400">Eşleşme bulunamadı.</div>
                )}

                {filtered.map((o) => {
                  const active = currentValue === o.id || currentValue === o.label;
                  return (
                    <button key={o.id} type="button" onClick={() => choose(o.id)}
                      className={`block w-full text-left px-2 py-1.5 text-sm transition hover:bg-white/10 ${active ? "bg-white/15 text-neutral-100 ring-1 ring-white/20" : "text-neutral-200"}`}
                    >
                      {o.label}
                    </button>
                  );
                })}

                {canCreate && (
                  <button type="button" onClick={() => choose(query.trim())}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-sm text-neutral-200 transition hover:bg-white/10"
                  >
                    <Plus size={14} className="text-neutral-400" />
                    <span>
                      Yeni oluştur: <span className="text-neutral-100">"{query.trim()}"</span>
                    </span>
                  </button>
                )}
              </div>

              <div className="mt-2 flex items-center justify-between">
                <button type="button" onClick={() => { setOpen(false); setQuery(""); }} className="text-[11px] text-neutral-400 hover:text-neutral-200">
                  Kapat
                </button>
                {currentValue && (
                  <button type="button" onClick={clear} className="text-[11px] text-neutral-400 hover:text-neutral-200">
                    Temizle
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <input type="hidden" name="combobox" value={currentValue} aria-required={required} />

        {required && <span className="px-0.5 text-[11px] text-neutral-500 mt-1">Zorunlu alan</span>}
      </div>
    </div>
  );
}
