"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronsUpDown, GraduationCap, Lock, Plus, X } from "lucide-react";
import { Combobox } from "@skylab-kulubu/skylcn-ui";
import { FieldShell, LOCKED_OPTION_HINT } from "./FieldShell";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";
import { CompactField } from "./CompactField";
import { useRespondent } from "@/lib/hooks/useRespondent";
import { UNIVERSITIES } from "../../../data/presets/universities";
import { DEPARTMENTS } from "../../../data/presets/departments";
import { QuestionField, questionLabel } from "./QuestionParts";

const CHOICE_PRESETS = [
  { id: "universities", label: "Üniversite", icon: GraduationCap, data: UNIVERSITIES },
  { id: "departments", label: "Bölüm", icon: BookOpen, data: DEPARTMENTS },
];

const SESSION_PRESET_MAP = {
  universities: "university",
  departments: "department",
};

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

export function CreateFormCombobox({ questionNumber, props, onPropsChange, readOnly, compact = false, workflowLock = null, ...rest }) {
  const { prop, bind, toggle, patch } = useProp(props, onPropsChange, readOnly);
  const [choicesOpen, setChoicesOpen] = useState(false);
  const lockedValues = workflowLock?.values ?? [];
  const isLockedChoice = (index) => lockedValues.includes((prop.choices ?? [])[index]);

  const activePreset = useMemo(() => {
    const current = prop.choices ?? [];
    return CHOICE_PRESETS.find((preset) =>
      preset.data.length === current.length && preset.data.every((item, i) => item === current[i])
    )?.id ?? null;
  }, [prop.choices]);

  const addChoice = () => {
    const next = [...(prop.choices ?? []), `Seçenek ${((prop.choices ?? []).length + 1)}`];
    patch({ choices: next });
  };
  const updateChoice = (index, value) => {
    if (isLockedChoice(index)) return;
    const next = [...(prop.choices ?? [])];
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
    <FieldShell number={questionNumber} title="Açılır Liste" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)} compact={compact} workflowLock={workflowLock} {...rest}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="cb-question" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <AutoResizeTextarea id="cb-question" {...bind("question")}
          className="block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      {!compact && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="cb-description" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
            Açıklama
          </label>
          <AutoResizeTextarea id="cb-description" {...bind("description")}
            className="block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
            placeholder="Açıklamanızı buraya yazın."
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">Hazır Listeler</label>
        <div className="grid grid-cols-2 gap-2">
          {CHOICE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isActive = activePreset === preset.id;
            const keepsLockedChoices = lockedValues.every((value) => preset.data.includes(value));
            return (
              <button key={preset.id} type="button" disabled={!keepsLockedChoices}
                title={keepsLockedChoices ? undefined : "Bu liste akış koşulunun karşılaştırdığı seçenekleri içermiyor."}
                onClick={() => patch({ choices: preset.data, preset: preset.id })}
                className={`flex items-center justify-center gap-2 py-2 px-1 rounded-lg border text-xs font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${isActive ? "border-ink/20 bg-ink/10 text-skylab-300" : "border-ink/8 bg-ink/2 text-neutral-500 hover:text-neutral-300 hover:bg-ink/8"}`}
              >
                <Icon size={14} />
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-ink/10 bg-ink/5 px-2 py-1">
        <span className="text-xs text-neutral-300">Serbest girişe izin ver</span>
        <div className="inline-flex rounded-lg border border-ink/15 bg-ink/5 p-0.5">
          <button type="button" aria-pressed={!prop.allowCustom} onClick={() => toggle("allowCustom", false)}
            className={`px-2 py-1 text-2xs rounded-lg transition focus:outline-none ${!prop.allowCustom ? "bg-ink/10 text-neutral-100" : "text-neutral-300 hover:text-neutral-200"}`}
          >
            Hayır
          </button>
          <button type="button" aria-pressed={prop.allowCustom} onClick={() => toggle("allowCustom", true)}
            className={`px-2 py-1 text-2xs rounded-lg transition focus:outline-none ${prop.allowCustom ? "bg-emerald-500/20 text-emerald-200" : "text-neutral-300 hover:text-neutral-200"}`}
          >
            Evet
          </button>
        </div>
      </div>

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
                          placeholder={`Seçenek ${idx + 1}`} value={choice} onChange={(e) => updateChoice(idx, e.target.value)} onPaste={(e) => handlePaste(e, idx)}
                        />
                        {locked && <Lock size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />}
                      </div>
                      <button type="button" onClick={() => removeChoice(idx)} title={locked ? LOCKED_OPTION_HINT : undefined}
                        className="rounded-lg border border-ink/10 bg-ink/5 px-2 py-2 text-2xs text-neutral-300 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={prop.choices.length <= 1 || locked}
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

export function DisplayFormCombobox({ question, questionNumber, description, required = false, choices = [], allowCustom = false, preset = null, disableAutoFill = false, compact = false, value, onChange, missing = false }) {
  const { kind, user } = useRespondent();
  const [internalValue, setInternalValue] = useState(value ?? "");

  const normalized = useMemo(() => normalizeOptions(choices), [choices]);
  const currentValue = value !== undefined ? (value ?? "") : internalValue;

  const autoValue = useMemo(() => {
    if (disableAutoFill || kind !== "user" || !preset) return null;
    const sessionKey = SESSION_PRESET_MAP[preset];
    const sessionVal = user?.[sessionKey];
    if (!sessionVal) return null;
    const found = normalized.find((o) => o.label === sessionVal);
    if (!found) return allowCustom ? sessionVal : null;
    return found.id;
  }, [disableAutoFill, kind, preset, user, normalized, allowCustom]);

  useEffect(() => {
    if (autoValue != null && onChange && value !== autoValue) {
      onChange({ target: { value: autoValue }, isDefault: true });
    }
  }, [autoValue]);

  const selected = useMemo(
    () => (currentValue ? normalized.find((o) => o.id === currentValue) ?? normalized.find((o) => o.label === currentValue) ?? null : null),
    [normalized, currentValue]
  );

  // A typed-in answer is in no list; it joins the items so the box can show it
  const items = useMemo(() => {
    const list = normalized.map((o) => ({ value: o.id, label: o.label }));
    if (currentValue && !selected) list.push({ value: currentValue, label: currentValue });
    return list;
  }, [normalized, currentValue, selected]);

  const commit = (next) => {
    if (onChange) {
      onChange({ target: { value: next } });
    } else {
      setInternalValue(next);
    }
  };

  const isAutoFilled = autoValue != null && currentValue === autoValue;

  const control = (
    <Combobox items={items} value={selected?.id ?? (currentValue || null)} onValueChange={(next) => commit(next ?? "")}
      onCreate={allowCustom ? commit : undefined} readOnly={isAutoFilled} placeholder="Bir seçenek seçin" maxRows={5}
      aria-label={questionLabel(question)} className={missing ? "border-destructive/50" : undefined}
    />
  );

  if (compact) {
    return <CompactField question={question} required={required} missing={missing}>{control}</CompactField>;
  }

  return (
    <QuestionField question={question} questionNumber={questionNumber} description={description} required={required} missing={missing}
      hint={isAutoFilled ? "Oturumunuzdan otomatik dolduruldu" : undefined}
    >
      {control}
    </QuestionField>
  );
}
