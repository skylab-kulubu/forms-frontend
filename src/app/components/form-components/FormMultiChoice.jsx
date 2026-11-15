"use client";

import { useState } from "react";
import { X, Plus, ChevronsUpDown, Lock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { ChoiceList } from "@skylab-kulubu/skylcn-ui";
import { FieldShell, LOCKED_OPTION_HINT } from "./FieldShell";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { CompactField } from "./CompactField";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";
import { QuestionField, questionLabel } from "./QuestionParts";

export function CreateFormMultiChoice({ questionNumber, props, onPropsChange, readOnly, compact = false, workflowLock = null, ...rest }) {
  const { prop, bind, toggle, patch } = useProp(props, onPropsChange, readOnly);
  const [choicesOpen, setChoicesOpen] = useState(true);
  const lockedValues = workflowLock?.values ?? [];
  const isLockedChoice = (index) => lockedValues.includes((prop.choices ?? [])[index]);

  const addChoice = () => {
    const next = [...(prop.choices ?? []), `Seçenek ${((prop.choices ?? []).length + 1)}`];
    patch({ choices: next });
  };
  const updateChoice = (index, value) => {
    if (isLockedChoice(index)) return;
    const next = [...(prop.choices) ?? []];
    next[index] = value;
    patch({ choices: next });
  };
  const removeChoice = (index) => {
    if (isLockedChoice(index)) return;
    const array = prop.choices ?? [];
    const next = array.length > 1 ? array.filter((_, i) => i !== index) : array;
    patch({ choices: next });
  };

  const handlePaste = (e, index) => {
    if (isLockedChoice(index)) return;
    const text = e.clipboardData.getData("text");
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length <= 1) return;
    e.preventDefault();
    const before = (prop.choices ?? []).slice(0, index);
    const after = (prop.choices ?? []).slice(index + 1);
    patch({ choices: [...before, ...lines, ...after] });
  };

  return (
    <FieldShell number={questionNumber} title="Çoklu Seçim" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)} compact={compact} workflowLock={workflowLock} {...rest}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="mc-question" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <AutoResizeTextarea id="mc-question" {...bind("question")}
          className="block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      {!compact && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mc-description" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
            Açıklama
          </label>
          <AutoResizeTextarea id="mc-description" {...bind("description")}
            className="block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
            placeholder="Açıklamanızı buraya yazın."
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <button type="button" onClick={() => setChoicesOpen((s) => !s)}
          className="flex items-center justify-between rounded-lg border border-ink/10 bg-ink/5 px-2 py-1.5 transition hover:bg-ink/10"
        >
          <span className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
            Seçenekler
            <span className="ml-1.5 rounded-md bg-ink/10 px-1.5 py-0.5 text-3xs font-semibold text-neutral-300">
              {(prop.choices ?? []).length}
            </span>
            {lockedValues.length > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 text-3xs font-normal normal-case tracking-normal text-neutral-500">
                <Lock size={10} />
                {lockedValues.length} kilitli
              </span>
            )}
          </span>
          <ChevronsUpDown size={14} className={`text-neutral-400 transition-transform ${choicesOpen ? "rotate-180" : ""}`} />
        </button>

        <AnimatePresence initial={false}>
          {choicesOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }} className="overflow-hidden"
            >
              <div className="flex flex-col gap-2 pt-0.5">
                {prop.choices.map((choice, idx) => {
                  const locked = isLockedChoice(idx);
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="relative w-full">
                        <input type="text" readOnly={locked} title={locked ? LOCKED_OPTION_HINT : undefined}
                          className={`block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 ${locked ? "cursor-not-allowed pr-8 text-neutral-400" : "text-neutral-100"}`}
                          placeholder={`Seçenek ${idx + 1}`}
                          value={choice} onChange={(e) => updateChoice(idx, e.target.value)} onPaste={(e) => handlePaste(e, idx)}
                        />
                        {locked && <Lock size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />}
                      </div>
                      <button type="button" title={locked ? LOCKED_OPTION_HINT : undefined}
                        className="rounded-lg border border-ink/10 bg-ink/5 px-2 py-2 text-2xs text-neutral-300 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={prop.choices.length <= 1 || locked} onClick={() => removeChoice(idx)}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  );
                })}
                <div>
                  <button type="button" onClick={addChoice}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-ink/15 bg-ink/5 px-3 py-1.5 text-xs text-neutral-100 hover:bg-ink/10"
                  >
                    <Plus size={14} /> Seçenek Ekle
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FieldShell>
  );
}

export function DisplayFormMultiChoice({ question, questionNumber, description, required = false, allowMultiple = true, choices = [], compact = false, value, onChange, missing = false }) {
  const options = choices.map((choice, idx) => {
    if (typeof choice === "string") {
      return { value: String(idx), label: choice };
    }
    return { value: String(choice?.id ?? choice?.value ?? idx), label: String(choice?.label ?? choice?.value ?? `Seçenek ${idx + 1}`) };
  });
  const [internalValue, setInternalValue] = useState(Array.isArray(value) ? value : []);
  const currentValue = value !== undefined ? (Array.isArray(value) ? value : []) : internalValue;

  const commit = (next) => {
    if (onChange) {
      onChange({ target: { value: next } });
    } else {
      setInternalValue(next);
    }
  };

  // A single answer is still kept as a list, so a question switched between one and several answers reads the same
  const control = allowMultiple ? (
    <ChoiceList multiple options={options} value={currentValue} onValueChange={commit} invalid={missing} aria-label={questionLabel(question)} />
  ) : (
    <ChoiceList clearable options={options} value={currentValue[0] ?? null} onValueChange={(next) => commit(next == null ? [] : [next])}
      invalid={missing} aria-label={questionLabel(question)}
    />
  );

  if (compact) {
    return <CompactField question={question} required={required} missing={missing}>{control}</CompactField>;
  }

  return (
    <QuestionField question={question} questionNumber={questionNumber} description={description} required={required} missing={missing}>
      {control}
    </QuestionField>
  );
}
