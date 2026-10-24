"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Timer, Upload, UserRound, File as FileIcon } from "lucide-react";
import { REGISTRY } from "@/app/components/form-registry";
import { FormDisplayerHeader } from "@/app/components/form-displayer/components/FormDisplayerComponents";
import TaskBlock from "@/app/components/form-displayer/components/TaskBlock";
import { durationText } from "@/lib/form-timing";
import { accountFileRules } from "@/lib/guest-uploads";
import { QuestionHint, QuestionNumber } from "@/app/components/form-components/QuestionParts";
import { RichText } from "@/app/components/rich-text/RichText";
import { questionNumbers } from "./studio-schema";
import { COLLAPSE_EASING, COLLAPSE_MS } from "./studio-motion";

export const CARD_WIDTH = { desktop: 672, phone: 358 };

export function CardShell({ phone = false, active = false, className = "", ref, children }) {
  return (
    <div ref={ref} className={`studio-card flex w-full flex-col rounded-3xl border shadow-xl shadow-black/30 ${active ? "border-white/15" : "border-white/10"} ${className}`}>
      <div className={`flex flex-1 flex-col gap-6 ${phone ? "p-6" : "p-6 sm:p-10"}`}>{children}</div>
    </div>
  );
}

export function StepBar({ flowName, stage, total, fill = 0, timeLimitMinutes = null }) {
  const count = Math.max(1, total || 1);
  const detached = stage == null;
  const current = detached ? 0 : Math.min(Math.max(1, stage), count);

  return (
    <div className="-mx-3.5 -my-2.5 rounded-2xl border border-transparent px-3.5 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-300">{flowName || "Adsız akış"}</span>
        {timeLimitMinutes ? (
          <span className="inline-flex items-center gap-1 font-mono text-3xs tabular-nums text-amber-200/90">
            <Timer size={11} />
            {durationText(timeLimitMinutes)}
          </span>
        ) : null}
        <span className="shrink-0 whitespace-nowrap text-3xs font-semibold uppercase tracking-[0.14em] tabular-nums text-neutral-300">
          {detached ? "Bağlı değil" : <>Adım {current}<span className="text-neutral-500"> / {count}</span></>}
        </span>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: count }, (_, index) => (
          index + 1 < current ? <span key={index} className="h-1 flex-1 rounded-full bg-skylab-600" />
            : index + 1 === current ? (
              <span key={index} className="relative h-1 flex-1 overflow-hidden rounded-full bg-skylab-500/25">
                <span className="absolute inset-y-0 left-0 rounded-full bg-skylab-500 transition-[width] duration-500" style={{ width: `${fill}%` }} />
              </span>
            ) : <span key={index} className="h-1 flex-1 rounded-full bg-white/8" />
        ))}
      </div>
    </div>
  );
}

export function CardFooter({ phone = false, userName, onSubmit, submitLabel = "Gönder" }) {
  return (
    <div className="mt-auto border-t border-white/5 px-2 pt-6 md:px-4">
      <div className={`flex gap-4 ${phone ? "flex-col items-stretch" : "flex-col items-stretch sm:flex-row sm:items-center sm:justify-between sm:gap-6"}`}>
        <p className={`flex min-w-0 items-center gap-1.5 text-2xs text-neutral-500 ${phone ? "order-2" : "order-2 sm:order-1"}`}>
          <UserRound size={12} className="shrink-0" />
          <span className="truncate"><span className="text-neutral-300">{userName || "Başvuran"}</span> olarak yanıtlıyorsunuz</span>
        </p>
        <button type="button" onClick={onSubmit} onPointerDown={(event) => event.stopPropagation()}
          className={`relative inline-flex min-w-30 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-[1.5px] border-skylab-300/50 bg-skylab-400/40 px-8 py-3 text-sm font-semibold transition-all hover:bg-pink-200/60 ${phone ? "order-1" : "order-1 sm:order-2 sm:ml-auto sm:shrink-0"}`}
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

export function DeliverablesHeader({ phone = false }) {
  return (
    <div className={`flex flex-col ${phone ? "p-2" : "p-2 md:p-4"}`}>
      <div className="flex items-center gap-3">
        <p className="min-w-0 max-w-[70%] text-lg font-medium text-neutral-100">Teslim</p>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <p className="mt-1 text-xs text-neutral-400">Görevi bitirdiğinizde aşağıdaki soruları doldurun.</p>
    </div>
  );
}

export function MockFileField({ field, number, value, missing, onChange }) {
  const props = field.props ?? {};
  const rules = accountFileRules(props.acceptedFiles, props.maxSize);
  const has = Boolean(value);

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <div className="flex flex-col p-2 md:p-4">
        <div className="flex gap-3">
          <QuestionNumber number={number} missing={missing} />
          <div className="flex flex-col">
            <p className="text-sm font-medium text-neutral-100">
              {props.question ? <RichText text={props.question} /> : <span className="font-normal italic text-neutral-500">Bu soru için metin yok</span>}
              {props.required ? <span className="ml-1 text-red-200/70">*</span> : null}
            </p>
            {props.description ? <RichText as="p" text={props.description} className="my-1 text-xs text-neutral-400" /> : null}
          </div>
        </div>
        <button type="button" onClick={() => onChange(has ? null : "ornek-dosya.pdf")}
          className={`relative mt-3 flex h-16 w-full items-center overflow-hidden rounded-lg border px-4 py-3 text-left transition-colors ${
            has ? "border-solid border-white/10 bg-neutral-900/60 hover:bg-neutral-900/80"
              : missing ? "border-dashed border-red-400/60 bg-red-900/20"
                : "border-dashed border-white/10 bg-neutral-900/40 hover:bg-neutral-900/60"
          }`}
        >
          <span className="flex w-full items-center gap-4">
            <span className={`flex size-10 shrink-0 items-center justify-center rounded-sm ${has ? "bg-white/10 text-neutral-300" : "bg-white/5 text-neutral-400"}`}>
              {has ? <FileIcon size={18} /> : <Upload size={18} />}
            </span>
            <span className="flex flex-col">
              <span className="text-sm font-medium text-neutral-200">{has ? value : "Dosya yükle veya sürükle"}</span>
              <span className="mt-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-500">
                {has ? "Doldur modunda dosya yüklenmez · kaldırmak için tıkla" : `${rules.label || "PDF, JPG, PNG, DOCX"} • MAKS ${Math.round(rules.maxBytes / 1024 / 1024)}MB`}
              </span>
            </span>
          </span>
        </button>
        <QuestionHint required={Boolean(props.required)} missing={missing} className="mt-2" />
      </div>
    </div>
  );
}

export function DisplayFields({ fields, values = null, missing = [], interactive = false, eventLinked = false, onChange }) {
  const numbers = questionNumbers(fields);

  return (
    <div className="flex flex-1 flex-col">
      {fields.map((field, index) => {
        const Display = REGISTRY[field.type]?.Display;
        if (!Display) return null;
        const isSeparator = field.type === "separator";
        const isLast = index === fields.length - 1;
        const isMissing = missing.includes(field.id);
        const shared = {
          ...field.props,
          questionNumber: isSeparator ? null : numbers.get(field.id),
          missing: isMissing,
          disableAutoFill: !interactive || eventLinked,
        };

        return (
          <div key={field.id} data-fill-id={field.id} className={`relative ${isLast || isSeparator ? "" : "border-b border-white/5 pb-6"}`}>
            {field.type === "file" ? (
              <MockFileField field={field} number={numbers.get(field.id)} value={values?.[field.id]} missing={isMissing}
                onChange={(value) => interactive && onChange?.(field.id, value)}
              />
            ) : interactive ? (
              <Display {...shared} value={values?.[field.id]} onChange={(event) => onChange?.(field.id, event.target.value)} />
            ) : (
              <Display {...shared} />
            )}
          </div>
        );
      })}
    </div>
  );
}

export function StaticCard({ form, phone = false, active = false, stepInfo = null, echo = null }) {
  const fields = Array.isArray(form?.schema) ? form.schema : [];
  const task = form?.task?.content?.trim() ? form.task : null;
  const shellRef = useRef(null);
  const gapRef = useRef(null);
  const [collapse] = useState(echo);

  useLayoutEffect(() => {
    const shell = shellRef.current;
    if (!collapse || !shell) return undefined;
    const timing = { duration: COLLAPSE_MS, easing: COLLAPSE_EASING };
    const natural = shell.offsetHeight;
    const animations = [];
    if (collapse.height > natural) animations.push(shell.animate([{ minHeight: `${collapse.height}px` }, { minHeight: `${natural}px` }], timing));
    if (gapRef.current) animations.push(gapRef.current.animate([{ height: `${collapse.gap}px` }, { height: "0px" }], timing));
    return () => animations.forEach((animation) => animation.cancel());
  }, [collapse]);

  const header = <FormDisplayerHeader title={form?.title || "Adsız form"} description={form?.description ?? ""} />;

  return (
    <CardShell ref={shellRef} phone={phone} active={active}>
      {stepInfo ? <StepBar flowName={stepInfo.flowName} stage={stepInfo.stage} total={stepInfo.total} timeLimitMinutes={form?.timeLimitMinutes} /> : null}
      {collapse?.gap ? <div>{header}<div ref={gapRef} /></div> : header}
      {task ? <TaskBlock task={task} title={form?.title} /> : null}
      {task && fields.length > 0 ? <DeliverablesHeader phone={phone} /> : null}
      {fields.length > 0 ? (
        <div className="pointer-events-none select-none **:[scrollbar-width:none]">
          <DisplayFields fields={fields} />
        </div>
      ) : (
        <p className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-neutral-500">Bu formda henüz soru yok.</p>
      )}
      <div className="mt-auto border-t border-white/5 px-2 pt-6 md:px-4">
        <div className="flex justify-end">
          <span className="inline-flex min-w-30 items-center justify-center rounded-xl border-[1.5px] border-skylab-300/50 bg-skylab-400/40 px-8 py-3 text-sm font-semibold">Gönder</span>
        </div>
      </div>
    </CardShell>
  );
}
