"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { FieldShell } from "./FieldShell";
import { useProp } from "@/app/admin/components/form-editor/components/useProp";

export function CreateFormMultiChoice({ questionNumber, props, onPropsChange, readOnly }) {
  const { prop, bind, toggle, patch} = useProp(props, onPropsChange, readOnly);

  const addChoice = () => {
    const next = [...(prop.choices ?? []), `Seçenek ${((prop.choices ?? []).length +1)}`];
    patch({ choices: next});
  };
  const updateChoice = (index, value) => {
    const next = [...(prop.choices) ?? []];
    next[index] = value;
    patch({ choices: next });
  };
  const removeChoice = (index) => {
    const array = prop.choices ?? [];
    const next = array.length > 1 ? array.filter((_,i) => i !== index) : array;
    patch({ choices: next });
  };

  return (
    <FieldShell number={questionNumber} title="Çoklu Seçim" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="mc-question" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <input id="mc-question" type="text" {...bind("question")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="mc-description" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Açıklama
        </label>
        <input id="mc-description" type="text" {...bind("description")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Açıklamanızı buraya yazın."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Seçenekler
        </label>
        <div className="flex flex-col gap-2">
          {prop.choices.map((choice, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input type="text"
                className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30"
                placeholder={`Seçenek ${idx + 1}`}
                value={choice} onChange={(e) => updateChoice(idx, e.target.value)}
              />
              <button type="button"
                className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] text-neutral-300 hover:text-neutral-100 disabled:opacity-50"
                disabled={prop.choices.length <= 1} onClick={() => removeChoice(idx)}
              >
                <X size={18} />
              </button>
            </div>
          ))}
          <div>
            <button type="button" onClick={addChoice}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[12px] text-neutral-100 hover:bg-white/10"
            >
              Seçenek Ekle
            </button>
          </div>
        </div>
      </div>
    </FieldShell>
  );
}

export function DisplayFormMultiChoice({ question, questionNumber, description, required = false, choices = [], value, onChange, missing = false }) {
  const normalized = choices.map((choice, idx) => {
    if (typeof choice === "string") {
      return { id: String(idx), label: choice };
    }
    const id = String(choice?.id ?? choice?.value ?? idx);
    return { id, label: String(choice?.label ?? choice?.value ?? `Seçenek ${idx + 1}`) };
  });
  const [internalValue, setInternalValue] = useState(Array.isArray(value) ? value : []);
  const currentValue = value !== undefined ? (Array.isArray(value) ? value : []) : internalValue;
  const optionBorderClass = missing ? "border-red-400/60" : "border-white/10";

  const commit = (next) => {
    if (onChange) {
      onChange({ target: { value: next } });
    } else {
      setInternalValue(next);
    }
  };

  const toggle = (id) => {
    const exists = currentValue.includes(id);
    const next = exists ? currentValue.filter((v) => v !== id) : [...currentValue, id];
    commit(next);
  };

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

        <div className="mt-3 flex flex-col gap-2">
          {normalized.map((choice, idx) => {
            const id = `mc_${idx}_${choice.id}`;
            const checked = currentValue.includes(choice.id);
            return (
              <label key={id} htmlFor={id}
                className={`flex cursor-pointer select-none items-center gap-3 rounded-md border ${optionBorderClass} bg-neutral-900/60 p-2 transition hover:bg-white/10 has-checked:border-indigo-300/10 has-checked:bg-indigo-200/20`}
              >
                <input id={id} name="multi_choice" type="checkbox" aria-required={required}
                  checked={checked} onChange={() => toggle(choice.id)}
                  className="checkbox shrink-0"
                />
                <span className="text-sm text-neutral-200">{choice.label}</span>
              </label>
            );
          })}
        </div>

        {required && <span className="px-0.5 text-[11px] text-neutral-500 mt-1">Zorunlu alan</span>}
      </div>
    </div>
  );
}
