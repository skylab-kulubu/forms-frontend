"use client";

import { RichText } from "@/app/components/rich-text/RichText";

export function DisplayFormSeparator({ title, description }) {
    return (
        <div className="mx-auto w-full max-w-2xl rounded-xl">
            <div className="flex flex-col p-2 md:p-4">
                <div className="flex items-center gap-3">
                    {title && (
                        <RichText as="p" text={title} className="min-w-0 max-w-[70%] wrap-break-word text-lg font-medium text-neutral-100" />
                    )}
                    <div className="h-px flex-1 bg-white/10" />
                </div>
                {description && (
                    <RichText as="p" text={description} className={`text-xs text-neutral-400 wrap-break-word ${title ? "mt-1" : ""}`} />
                )}
            </div>
        </div>
    );
}