"use client";

import { FieldShell } from "./FieldShell";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";

export function CreateFormSeparator({ questionNumber, props, onPropsChange, readOnly, ...rest }) {
    const { bind } = useProp(props, onPropsChange, readOnly);

    return (
        <FieldShell number={questionNumber} title="Ayıraç" hideRequired {...rest}>
            <div className="flex flex-col gap-1.5">
                <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Başlık</label>
                <AutoResizeTextarea {...bind("title")}
                    className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30"
                    placeholder="Bölüm başlığını yazın."
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Açıklama</label>
                <AutoResizeTextarea {...bind("description")}
                    className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30"
                    placeholder="Açıklamanızı buraya yazın."
                />
            </div>
        </FieldShell>
    );
}

export function DisplayFormSeparator({ title, description }) {
    return (
        <div className="mx-auto w-full max-w-2xl rounded-xl">
            <div className="flex flex-col p-2 md:p-4">
                <div className="flex items-center gap-3">
                    {title && (
                        <p className="shrink-0 text-[18px] font-medium text-neutral-100">{title}</p>
                    )}
                    <div className="h-px flex-1 bg-white/10" />
                </div>
                {description && (
                    <p className={`text-xs text-neutral-400 wrap-break-word ${title ? "mt-1" : ""}`}>{description}</p>
                )}
            </div>
        </div>
    );
}