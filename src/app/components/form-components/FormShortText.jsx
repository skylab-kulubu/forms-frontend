"use client";

import { useState } from "react";
import { FieldShell } from "./FieldShell";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";
import { Type, Mail, Phone, Hash } from "lucide-react";

const INPUT_TYPES = [
  { id: "text", label: "Düz Metin", icon: Type, placeholder: "Yanıtınızı yazın." },
  { id: "email", label: "E-Posta", icon: Mail, placeholder: "ornek@mail.com" },
  { id: "phone", label: "Telefon", icon: Phone, placeholder: "+90 512 345 67 89" },
  { id: "number", label: "Sayı", icon: Hash, placeholder: "Sayı girin." }
];

export function CreateFormShortText({ questionNumber, props, onPropsChange, readOnly, ...rest }) {
  const { prop, bind, toggle, patch } = useProp(props, onPropsChange, readOnly);
  const currentType = prop.inputType || "text";

  return (
    <FieldShell number={questionNumber} title="Kısa Yanıt" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)} {...rest}>
      <div className="flex flex-col gap-1.5">
        <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Soru Metni</label>
        <input type="text" {...bind("question")} className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30" placeholder="Sorunuzu buraya yazın." />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Açıklama</label>
        <input type="text" {...bind("description")} className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30" placeholder="Açıklamanızı buraya yazın." />
      </div>

      <div className="flex flex-col gap-1.5 pt-2">
        <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Geçerli Veri Tipi</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {INPUT_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = currentType === type.id;
            return (
              <button key={type.id} type="button" onClick={() => patch({ inputType: type.id })}
                className={`flex items-center justify-center gap-2 py-2 px-1 rounded-lg border text-xs font-medium transition-all ${isActive ? "border-white/20 bg-white/10 text-indigo-200" : "border-white/8 bg-white/2 text-neutral-500 hover:text-neutral-300 hover:bg-white/8"}`}
              >
                <Icon size={14} />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>
    </FieldShell>
  );
}

export function DisplayFormShortText({ question, questionNumber, description, required = false, inputType = "text", value, onChange, missing = false }) {
  const [internalValue, setInternalValue] = useState(value || "");
  const currentValue = value !== undefined ? value : internalValue;
  const inputBorderClass = missing ? "border-red-400/60 focus:border-red-400 focus:ring-red-400/20" : "border-white/10 focus:border-white/30 focus:ring-white/20";

  const currentTypeObj = INPUT_TYPES.find(t => t.id === inputType) || INPUT_TYPES[0];
  const Icon = currentTypeObj.icon;
  const placeholderText = currentTypeObj.placeholder;

  const commit = (e) => {
    const next = e.target.value;
    if (onChange) onChange({ target: { value: next } });
    else setInternalValue(next);
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <div className="flex flex-col p-2 md:p-4">

        <div className="flex gap-3">
          {questionNumber != null && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-300">
              {questionNumber}
            </div>
          )}
          <div className="flex flex-col w-full">
            <p className="text-sm font-medium text-neutral-100">
              {question} {required && <span className="ml-1 text-red-200/70">*</span>}
            </p>
            {description && (<p className="my-1 text-xs text-neutral-400">{description}</p>)}
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 w-full">
          <div className="relative flex items-center w-full">
            <div className="absolute left-3.5 text-neutral-500 pointer-events-none flex items-center justify-center">
              <Icon size={16} strokeWidth={2} />
            </div>

            <input type={inputType} value={currentValue} onChange={commit} placeholder={placeholderText}
              className={`block w-full rounded-lg border ${inputBorderClass} bg-neutral-900/60 pl-10 pr-4 py-2 text-sm text-neutral-100 placeholder-neutral-600 outline-none transition focus:ring-2`}
            />
          </div>
        </div>

        {required && <span className="px-0.5 text-[11px] text-neutral-500 mt-1.5">Zorunlu alan</span>}
      </div>
    </div>
  );
}