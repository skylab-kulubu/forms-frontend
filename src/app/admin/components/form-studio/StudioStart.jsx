"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, LayoutTemplate, PackagePlus } from "lucide-react";
import { useStudio } from "./StudioContext";
import { Editable, focusEditable } from "./StudioField";
import StudioDescription from "./StudioDescription";
import { useStudioTemplates } from "./StudioInsertMenu";
import { fieldLabel } from "./studio-schema";
import { ARRIVAL_EASE, ARRIVAL_MS } from "./studio-motion";

export function previewOf(item) {
  if (!item || item.disabled) return null;
  if (item.kind === "template") return { Icon: LayoutTemplate, label: item.label, note: `${item.hint} buraya eklenir.` };
  if (item.kind !== "type") return null;
  return { Icon: item.Icon, label: item.label, note: item.type === "separator" ? "Bölüm başlığı olarak buraya eklenir." : "İlk soru olarak buraya eklenir." };
}

const DESCRIPTION_HIDDEN = { height: 0, opacity: 0, marginTop: 0 };
const DESCRIPTION_SHOWN = { height: "auto", opacity: 1, marginTop: 12 };

export function IntroFields({ title, description, onTitle, onDescription, setup = false, phone = false, collapsed = false }) {
  const descriptionRef = useRef(null);
  const autoFocused = useRef(false);
  const [animating, setAnimating] = useState(false);
  const empty = !description || description === "<p></p>";
  const hidden = collapsed && empty;

  useEffect(() => {
    if (autoFocused.current) return;
    autoFocused.current = true;
    if (setup && !title?.trim() && window.matchMedia("(pointer: fine)").matches) focusEditable("form-title");
  }, [setup, title]);

  const toDescription = () => {
    if (!descriptionRef.current?.focus()) document.activeElement?.blur();
  };

  return (
    <div className={`relative max-w-2xl ${phone ? "px-1" : "px-2 md:px-4"}`}>
      <h1 className={`font-semibold tracking-tight text-neutral-50 ${phone ? "text-2xl" : "text-2xl sm:text-3xl"}`}>
        <Editable editKey="form-title" value={title} placeholder="Formun adı" onChange={onTitle} onEnter={setup ? toDescription : undefined}
          className="-mx-1 block rounded-md px-1"
        />
      </h1>
      <motion.div data-description-gap={empty ? "" : undefined} className={hidden || animating ? "overflow-hidden" : undefined}
        initial={hidden ? DESCRIPTION_HIDDEN : false}
        animate={hidden ? DESCRIPTION_HIDDEN : DESCRIPTION_SHOWN}
        transition={{ duration: ARRIVAL_MS / 1000, ease: ARRIVAL_EASE }}
        onAnimationStart={() => setAnimating(true)}
        onAnimationComplete={() => setAnimating(false)}
      >
        <StudioDescription ref={descriptionRef} value={description} onChange={onDescription} />
      </motion.div>
    </div>
  );
}

export function EmptyStart({ phone = false }) {
  const { ui } = useStudio();
  const preview = ui.menu ? ui.preview : null;

  return (
    <div className="flex flex-1 flex-col items-center justify-center py-6 text-center">
      <div className="relative grid size-16 place-items-center text-skylab-300">
        <svg viewBox="0 0 64 64" aria-hidden="true" className="absolute inset-0 size-full">
          <rect x="0.75" y="0.75" width="62.5" height="62.5" rx="17.25" strokeWidth="1.5" strokeDasharray="3.936 3.936" strokeLinecap="round"
            className={`transition-colors ${preview ? "fill-skylab-500/6 stroke-skylab-400/50" : "fill-white/2 stroke-white/20"}`}
          />
        </svg>
        {preview ? <preview.Icon size={26} strokeWidth={1.5} className="relative" /> : <PackagePlus size={26} strokeWidth={1.5} className="relative" />}
      </div>
      <p className="mt-5 text-base font-semibold tracking-tight text-neutral-100">{preview?.label ?? "Formunuzu oluşturmaya başlayın"}</p>
      <p className={`mt-1.5 text-balance text-xs leading-relaxed text-neutral-400 ${phone ? "max-w-64" : "max-w-76"}`}>
        {preview ? preview.note : "Alttaki Ekle ile bir bileşen seçin; ilk soru buraya eklenir."}
      </p>
    </div>
  );
}

export function TemplateStart({ phone = false, onPick }) {
  const { templates } = useStudioTemplates();
  const shown = templates.slice(0, 3);
  if (shown.length === 0) return null;
  const pad = phone ? "px-1" : "px-2 md:px-4";

  return (
    <div>
      <div className={`flex items-center gap-2 ${pad}`}>
        <span className="text-2xs font-medium text-neutral-500">Şablonla başlayın</span>
        <span className="h-px flex-1 bg-white/5" />
      </div>
      <div className="mt-1 divide-y divide-white/5">
        {shown.map((template) => {
          const schema = Array.isArray(template.schema) ? template.schema : [];
          return (
            <button key={template.id} type="button" onClick={() => onPick(template)}
              className={`group flex w-full items-center gap-3 py-2.5 text-left transition-colors hover:bg-white/3 focus-visible:bg-white/3 focus-visible:outline-none ${pad}`}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/3 text-neutral-400 transition-colors group-hover:text-neutral-200">
                <LayoutTemplate size={13} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-neutral-200">{template.title || "Adsız şablon"}</span>
                {schema.length ? <span className="block truncate text-2xs text-neutral-500">{schema.map((field) => fieldLabel(field)).join(" · ")}</span> : null}
              </span>
              <span className={`shrink-0 text-2xs tabular-nums text-neutral-500 ${phone ? "hidden" : "hidden sm:inline"}`}>{schema.length} bileşen</span>
              <ChevronRight size={13} className="shrink-0 text-neutral-600 transition-colors group-hover:text-neutral-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
