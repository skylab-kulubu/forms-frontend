"use client";

import { useState, useEffect } from "react";
import { FieldShell } from "./FieldShell";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";

export function CreateFormToggle({ questionNumber, props, onPropsChange, readOnly, ...rest }) {
    const { prop, bind, toggle } = useProp(props, onPropsChange, readOnly);

    return (
        <FieldShell number={questionNumber} title="Aç / Kapat (Switch)" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)} {...rest}>
            <div className="flex flex-col gap-1.5">
                <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Soru Metni</label>
                <input type="text" {...bind("question")}
                    className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30"
                    placeholder="Sorunuzu buraya yazın."
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Açıklama</label>
                <input type="text" {...bind("description")}
                    className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30"
                    placeholder="Açıklamanızı buraya yazın."
                />
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                    <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Açık Metni</label>
                    <input type="text" {...bind("trueLabel")} placeholder="Evet"
                        className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30"
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Kapalı Metni</label>
                    <input type="text" {...bind("falseLabel")} placeholder="Hayır"
                        className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30"
                    />
                </div>
            </div>
        </FieldShell>
    );
}

export function DisplayFormToggle({ question, questionNumber, description, required = false, trueLabel = "Evet", falseLabel = "Hayır", value, onChange, missing = false }) {
    const [internalValue, setInternalValue] = useState(value === true);
    const currentValue = value !== undefined ? (value === true) : internalValue;
    const optionBorderClass = missing ? "border-red-400/60" : "border-white/10";

    useEffect(() => {
        if (value === undefined && onChange) {
            onChange({ target: { value: false } });
        }
    }, []);

    const handleToggle = () => {
        const next = !currentValue;
        if (onChange) {
            onChange({ target: { value: next } });
        } else {
            setInternalValue(next);
        }
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

                <div className="mt-3 flex flex-col gap-2">
                    <div onClick={handleToggle}
                        className={`flex items-center justify-between gap-4 w-full rounded-lg border ${optionBorderClass} bg-neutral-900/60 px-4 py-1.5 cursor-pointer transition-colors hover:bg-white/4`}
                    >
                        <span className={`text-sm font-medium select-none transition-colors ${currentValue ? "text-indigo-200" : "text-neutral-400"}`}>
                            {currentValue ? trueLabel : falseLabel}
                        </span>

                        <button type="button" role="switch" aria-checked={currentValue}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-lg border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${currentValue ? 'bg-pink-300/70' : 'bg-neutral-700'}`}
                        >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-md bg-white shadow ring-0 transition duration-200 ease-in-out ${currentValue ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                        </button>
                    </div>
                </div>

                {required && <span className="px-0.5 text-[11px] text-neutral-500 mt-1.5">Devam etmek için onaylamalısınız</span>}
            </div>
        </div>
    );
}