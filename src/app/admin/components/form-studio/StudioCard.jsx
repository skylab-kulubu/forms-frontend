"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Send, Timer, UserRound } from "lucide-react";
import { Button, ControlSizeProvider, FileUpload } from "@skylab-kulubu/skylcn-ui";
import { REGISTRY } from "@/app/components/form-registry";
import { FormDisplayerHeader } from "@/app/components/form-displayer/components/FormDisplayerComponents";
import TaskBlock from "@/app/components/form-displayer/components/TaskBlock";
import { durationText } from "@/lib/form-timing";
import { accountFileRules } from "@/lib/guest-uploads";
import { QuestionField, questionLabel } from "@/app/components/form-components/QuestionParts";
import { questionNumbers } from "./studio-schema";
import { COLLAPSE_EASING, COLLAPSE_MS } from "./studio-motion";
import BrandPaper from "@/brands/BrandPaper";

export const CARD_WIDTH = { desktop: 672, phone: 358 };

export function CardShell({ phone = false, active = false, brand = null, className = "", ref, children }) {
  return (
    <BrandPaper brand={brand}>
      <div ref={ref} data-slot="form-card" data-phone={phone || undefined} className={`studio-card flex w-full flex-col rounded-3xl border text-neutral-200 shadow-xl shadow-black/30 ${active ? "border-ink/15" : "border-ink/10"} ${className}`}>
        <div className={`flex flex-1 flex-col gap-6 ${phone ? "p-6" : "p-6 sm:p-10"}`}>{children}</div>
      </div>
    </BrandPaper>
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
            ) : <span key={index} className="h-1 flex-1 rounded-full bg-ink/8" />
        ))}
      </div>
    </div>
  );
}

export function CardFooter({ phone = false, userName, onSubmit, submitLabel = "Gönder", bare = false }) {
  return (
    <div className="mt-auto border-t border-ink/5 px-2 pt-6 md:px-4">
      <div className={`flex gap-4 ${phone ? "flex-col items-stretch" : "flex-col items-stretch sm:flex-row sm:items-center sm:justify-between sm:gap-6"}`}>
        {bare ? null : (
          <p className={`flex min-w-0 items-center gap-1.5 text-2xs text-neutral-500 ${phone ? "order-2" : "order-2 sm:order-1"}`}>
            <UserRound size={12} className="shrink-0" />
            <span className="truncate"><span className="text-neutral-300">{userName || "Başvuran"}</span> olarak yanıtlıyorsunuz</span>
          </p>
        )}
        <Button data-slot="submit" variant="solid" size="lg" onClick={onSubmit} onPointerDown={(event) => event.stopPropagation()} hoverIcon={Send}
          className={`min-w-30 ${phone ? "order-1" : "order-1 sm:order-2 sm:ml-auto sm:shrink-0"}`}
        >
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}

export function DeliverablesHeader({ phone = false }) {
  return (
    <div className={`flex flex-col ${phone ? "p-2" : "p-2 md:p-4"}`}>
      <div className="flex items-center gap-3">
        <p className="min-w-0 max-w-[70%] text-lg font-medium text-neutral-100">Teslim</p>
        <div className="h-px flex-1 bg-ink/10" />
      </div>
      <p className="mt-1 text-xs text-neutral-400">Görevi bitirdiğinizde aşağıdaki soruları doldurun.</p>
    </div>
  );
}

// Fill mode tries the question without uploading: a picked file only lends its name and size to the row
export function MockFileField({ field, number, value, missing, interactive = false, onChange }) {
  const props = field.props ?? {};
  const rules = accountFileRules(props.acceptedFiles, props.maxSize);
  const [size, setSize] = useState(0);
  const files = value ? [{ id: "answer", name: value, size, status: "ready" }] : [];

  return (
    <QuestionField question={props.question} questionNumber={number} description={props.description} required={Boolean(props.required)} missing={missing}
      hint={interactive ? `${props.required ? "Zorunlu alan · " : ""}Doldur modunda dosya sunucuya gönderilmez` : undefined}
    >
      <FileUpload files={files} onRemove={() => onChange(null)}
        onFiles={(picked) => {
          setSize(picked[0]?.size ?? 0);
          onChange(picked[0]?.name ?? null);
        }}
        accept={rules.accept || undefined} rules={`${rules.label || "PDF, JPG, PNG, DOCX"} • MAKS ${Math.round(rules.maxBytes / 1024 / 1024)}MB`}
        invalid={missing && !value} variant="compact" aria-label={questionLabel(props.question)}
      />
    </QuestionField>
  );
}

export function DisplayFields({ fields, values = null, missing = [], interactive = false, eventLinked = false, onChange }) {
  const numbers = questionNumbers(fields);

  // The respondent page sets its controls to lg, so the canvas does too
  return (
    <ControlSizeProvider size="lg">
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
            <div key={field.id} data-fill-id={field.id} className={`relative ${isLast || isSeparator ? "" : "border-b border-ink/5 pb-6"}`}>
              {field.type === "file" ? (
                <MockFileField field={field} number={numbers.get(field.id)} value={values?.[field.id]} missing={isMissing} interactive={interactive}
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
    </ControlSizeProvider>
  );
}

function limitFields(fields, limit) {
  if (!limit) return { shown: fields, hidden: 0 };
  const shown = [];
  let questions = 0;
  for (const field of fields) {
    if (field.type !== "separator") {
      if (questions === limit) break;
      questions += 1;
    }
    shown.push(field);
  }
  while (shown.length && shown[shown.length - 1].type === "separator") shown.pop();
  const total = fields.filter((field) => field.type !== "separator").length;
  return { shown, hidden: total - questions };
}

export function StaticCard({ form, phone = false, active = false, stepInfo = null, echo = null, limit = null }) {
  const fields = Array.isArray(form?.schema) ? form.schema : [];
  const { shown, hidden } = limitFields(fields, limit);
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
    <CardShell ref={shellRef} phone={phone} active={active} brand={form?.brand}>
      {stepInfo ? <StepBar flowName={stepInfo.flowName} stage={stepInfo.stage} total={stepInfo.total} timeLimitMinutes={form?.timeLimitMinutes} /> : null}
      {collapse?.gap ? <div>{header}<div ref={gapRef} /></div> : header}
      {task ? <TaskBlock task={task} title={form?.title} /> : null}
      {task && fields.length > 0 ? <DeliverablesHeader phone={phone} /> : null}
      {fields.length > 0 ? (
        <div className="pointer-events-none select-none **:[scrollbar-width:none]">
          <DisplayFields fields={shown} />
        </div>
      ) : (
        <p className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-ink/10 text-sm text-neutral-500">Bu formda henüz soru yok.</p>
      )}
      {hidden > 0 ? (
        <div className="flex items-center gap-3 px-2 md:px-4">
          <span className="h-px flex-1 bg-ink/10" />
          <span className="text-sm text-neutral-400">{hidden} soru daha</span>
          <span className="h-px flex-1 bg-ink/10" />
        </div>
      ) : null}
      <div className="mt-auto border-t border-ink/5 px-2 pt-6 md:px-4">
        <div inert className="flex justify-end">
          <Button data-slot="submit" variant="solid" size="lg" className="min-w-30">Gönder</Button>
        </div>
      </div>
    </CardShell>
  );
}
