"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Eye, FilePenLine, FileX, Flag, GitCompare, Timer, UserRound } from "lucide-react";
import { FormDisplayerHeader } from "@/app/components/form-displayer/components/FormDisplayerComponents";
import TaskBlock from "@/app/components/form-displayer/components/TaskBlock";
import { RichText } from "@/app/components/rich-text/RichText";
import { PanelNotice } from "@/app/admin/components/utils/SidePanel";
import { CardShell, DeliverablesHeader, StepBar } from "../form-studio/StudioCard";
import { QuestionBadge } from "../form-studio/StudioField";
import { questionNumbers } from "../form-studio/studio-schema";
import { attemptKindOf, ATTEMPT_STATUS } from "@/lib/attempt-status";
import AnswerControl from "./AnswerControl";
import { Rail } from "./MarginRail";
import {
  FLAGGED, PROVISIONAL, RETURNED, answerKey, formatDateTime, formatDayMonth, formatPersonName, formatSpent, hiddenByCondition, noteOf, personOf, plainAnswer,
} from "./response-data";

const ATTEMPT_EMPTY = {
  running: { Icon: Timer, title: "Aday görev üzerinde çalışıyor", description: "Taslak süre bitene kadar gizli. Süre dolarsa burada geçici cevap olarak açılır." },
  opened: { Icon: Eye, title: "Görev henüz başlatılmadı", description: "Aday formu açtı ama Görevi başlat'a basmadı." },
  none: { Icon: FileX, title: "Teslim yok", description: "Süre doldu ve teslim kaydedilmedi." },
};

export function scrollToQuestion(questionId) {
  const canvas = document.querySelector("[data-room] [data-room-canvas]");
  const target = canvas?.querySelector(`[data-q="${CSS.escape(questionId)}"]`);
  if (!canvas || !target) return;
  const top = target.getBoundingClientRect().top - canvas.getBoundingClientRect().top + canvas.scrollTop;
  const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  canvas.scrollTo({ top: Math.max(0, top - (canvas.clientHeight - target.offsetHeight) / 2), behavior: smooth ? "smooth" : "auto" });
}

export function fieldsOf(form, detail) {
  const items = Array.isArray(detail?.schema) ? detail.schema : [];
  const byId = new Map(items.map((item) => [item.id, item]));
  const formFields = Array.isArray(form?.schema) ? form.schema : [];
  const base = formFields.length
    ? formFields.map((field) => {
      const item = byId.get(field.id);
      return item?.question && field.type !== "separator" ? { ...field, props: { ...field.props, question: item.question } } : field;
    })
    : items.map((item) => ({ id: item.id, type: item.type || "short_text", props: { question: item.question } }));
  const known = new Set(base.map((field) => field.id));
  const orphans = formFields.length
    ? items.filter((item) => !known.has(item.id)).map((item) => ({ id: item.id, type: item.type || "short_text", props: { question: item.question }, orphan: true }))
    : [];
  return { fields: base, orphans, answers: new Map(items.map((item) => [item.id, item.answer])) };
}

export function changedIdsOf(fields, answers, previousAnswers) {
  if (!previousAnswers) return [];
  return fields.filter((field) => field.type !== "separator" && answerKey(answers.get(field.id)) !== answerKey(previousAnswers.get(field.id))).map((field) => field.id);
}

function PrevAnswer({ field, previous, previousAnswer, onOpenPrevious }) {
  const [open, setOpen] = useState(false);
  const plain = ["file", "matrix", "repeater"].includes(field.type);
  const text = plain ? "Farklı bir cevap vardı." : plainAnswer(field, previousAnswer);
  const long = !plain && text.length > 160;
  const link = "mt-1 inline-flex min-h-8 items-center gap-1 text-2xs text-neutral-400 underline decoration-white/20 underline-offset-2 transition-colors hover:text-neutral-100 sm:min-h-6";

  return (
    <div className="relative mt-3 pl-3">
      <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-neutral-700" />
      <p className="text-3xs text-neutral-500">{previous.workflow?.round ?? 1}. gönderimde</p>
      <p className={`mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-neutral-400 wrap-anywhere ${long && !open ? "line-clamp-3" : ""}`}>{text}</p>
      {long ? <button type="button" onClick={() => setOpen((value) => !value)} className={link}>{open ? "Daralt" : "Tamamı"}</button> : null}
      {plain && onOpenPrevious ? <button type="button" onClick={onOpenPrevious} className={link}>{previous.workflow?.round ?? 1}. gönderimi aç</button> : null}
    </div>
  );
}

function RevisionRow({ previous, fields, numbers, requested, changedAll, onJump }) {
  const [open, setOpen] = useState(false);
  const fieldIds = new Set(fields.map((field) => field.id));
  const asked = requested.filter((id) => fieldIds.has(id));
  const extra = changedAll.filter((id) => !asked.includes(id));
  const reviewer = formatPersonName(previous.reviewer?.fullName) || "Ekipten biri";
  const item = (id, tag) => {
    const field = fields.find((entry) => entry.id === id);
    return (
      <button key={id} type="button" onClick={() => onJump(id)} className="flex min-h-10 w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/5">
        <span className="w-6 shrink-0 text-right text-2xs tabular-nums text-neutral-500">{numbers.get(id)}.</span>
        <span className="min-w-0 flex-1 truncate text-xs text-neutral-300">{field?.props?.question || "Soru"}</span>
        {tag}
      </button>
    );
  };
  const changedTag = <span className="shrink-0 rounded-full border border-sky-400/30 bg-sky-400/10 px-1.5 text-3xs leading-4 text-sky-200">değişti</span>;
  const sameTag = <span className="shrink-0 text-3xs text-amber-200/80">değişmedi</span>;

  return (
    <div className="mx-2 rounded-xl border border-sky-400/20 bg-sky-400/4 md:mx-4">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left">
        <FilePenLine size={13} className="shrink-0 text-sky-300" />
        <span className="min-w-0 flex-1 truncate text-2xs">
          <span className="font-medium text-sky-100">Düzeltme isteği</span>
          <span className="text-neutral-500"> · {reviewer} · {formatDayMonth(previous.reviewedAt)}</span>
        </span>
        <span className="shrink-0 text-3xs tabular-nums text-neutral-400">{asked.length} soru · {changedAll.length} değişti</span>
        <ChevronDown size={14} className={`shrink-0 text-neutral-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows,opacity] duration-200 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-3 border-t border-sky-400/10 px-3 pb-3 pt-3">
            {noteOf(previous) ? (
              <Rail>
                <p className="text-3xs text-neutral-500">Not</p>
                <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-neutral-200">{noteOf(previous)}</p>
              </Rail>
            ) : null}
            <div className="-mx-2">
              {asked.map((id) => item(id, changedAll.includes(id) ? changedTag : sameTag))}
              {extra.map((id) => item(id, changedTag))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SeparatorBlock({ field, phone }) {
  const props = field.props ?? {};
  return (
    <div className={`flex flex-col ${phone ? "p-2" : "p-2 md:p-4"}`}>
      <div className="flex items-center gap-3">
        {props.title ? <RichText as="p" text={props.title} className="min-w-0 max-w-[70%] text-lg font-medium text-neutral-100 wrap-anywhere" /> : null}
        <div className="h-px flex-1 bg-white/10" />
      </div>
      {props.description ? <RichText as="p" text={props.description} className="mt-1 text-xs text-neutral-400" /> : null}
    </div>
  );
}

function AnswerBlock({ field, number, answer, responseId, phone, accent, hint, aside, below }) {
  const props = field.props ?? {};
  return (
    <div data-q={field.id} className={`group/q relative flex flex-col rounded-xl transition-[box-shadow,background-color] duration-150 ${phone ? "p-2" : "p-2 md:p-4"} ${hint ? "bg-sky-400/3 ring-1 ring-sky-400/30" : ""}`}>
      {accent ? <span className="absolute -left-3 bottom-5 top-5 w-0.5 rounded-full bg-sky-400/50" /> : null}
      <div className="flex gap-3">
        <QuestionBadge number={number} conditional={Boolean(field.condition?.fieldId)} />
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-sm font-medium text-neutral-100 wrap-anywhere">
            {props.question ? <RichText text={props.question} /> : <span className="font-normal text-neutral-500">Bu soru için metin yok</span>}
            {props.required ? <span className="ml-1 text-red-200/70">*</span> : null}
          </p>
          {props.description ? <RichText as="p" text={props.description} className="my-1 text-xs text-neutral-400" /> : null}
        </div>
        {aside ? <div className="flex shrink-0 items-start gap-1.5 pt-0.5">{aside}</div> : null}
      </div>
      <AnswerControl field={field} answer={answer} responseId={responseId} />
      {below}
    </div>
  );
}

function CompactHeader({ title, description }) {
  const [open, setOpen] = useState(false);
  const hasDescription = typeof description === "string" && description.replace(/<[^>]*>/g, "").trim().length > 0;

  return (
    <div className="px-2">
      <h1 className="text-lg font-semibold leading-snug tracking-tight text-neutral-50">{title}</h1>
      {hasDescription ? (
        <>
          <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} className="mt-0.5 inline-flex min-h-9 items-center gap-1 text-2xs text-neutral-500">
            Formun açıklaması
            <ChevronDown size={12} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
          </button>
          {open ? <div className="-mx-2"><FormDisplayerHeader description={description} /></div> : null}
        </>
      ) : null}
    </div>
  );
}

export default function ResponseCard({
  form, detail, isAttempt = false, previous = null, showChanges = true, flagMode = false, flags = [], onFlag, phone = false,
  railOn = false, hoverQ = null, compactHeader = false, revisionRow = false, onOpenPrevious = null, stepInfo = null,
}) {
  const { fields, orphans, answers } = useMemo(() => fieldsOf(form, detail), [form, detail]);
  const previousAnswers = useMemo(() => (previous ? new Map((previous.schema ?? []).map((item) => [item.id, item.answer])) : null), [previous]);
  const allFields = useMemo(() => [...fields, ...orphans], [fields, orphans]);
  const numbers = useMemo(() => questionNumbers(allFields), [allFields]);
  const fieldsById = useMemo(() => new Map(allFields.map((field) => [field.id, field])), [allFields]);
  const status = Number(detail?.status ?? 0);
  const requestedBefore = previous?.returnedQuestionIds ?? [];
  const requested = status === RETURNED ? detail?.returnedQuestionIds ?? [] : requestedBefore;
  const changedAll = useMemo(() => changedIdsOf(allFields, answers, previousAnswers), [allFields, answers, previousAnswers]);
  const changed = showChanges ? changedAll : [];
  const person = personOf(detail);
  const task = detail?.task?.content?.trim() ? detail.task : form?.task?.content?.trim() ? form.task : null;
  const title = form?.title || detail?.workflow?.steps?.find((step) => step.stage === detail?.workflow?.stage)?.formTitle || "Form";
  const attemptKind = isAttempt ? attemptKindOf(detail?.attempt) : null;
  const empty = isAttempt ? ATTEMPT_EMPTY[attemptKind] ?? ATTEMPT_EMPTY.none : null;
  const closedProvisional = status === PROVISIONAL && detail?.attempt?.status === ATTEMPT_STATUS.NO_SUBMISSION;

  const renderField = (field, index, list) => {
    const last = index === list.length - 1;
    if (field.type === "separator") return <div key={field.id}><SeparatorBlock field={field} phone={phone} /></div>;
    const number = numbers.get(field.id);
    const answer = answers.get(field.id);

    if (hiddenByCondition(field, answers, fieldsById)) {
      const source = fieldsById.get(field.condition.fieldId);
      const sourceAnswer = answers.get(field.condition.fieldId);
      return (
        <div key={field.id} data-q={field.id} className={`flex items-center gap-3 p-2 md:px-4 md:py-3 ${last ? "" : "border-b border-white/5 pb-5"}`}>
          <span className="grid size-6 shrink-0 place-items-center rounded-md border border-dashed border-white/10 text-xs font-semibold text-neutral-600">{number}</span>
          <p className="min-w-0 flex-1 truncate text-xs text-neutral-500">
            <span className="text-neutral-400">{field.props?.question || "Soru"}</span>
            {" · "}{numbers.get(source?.id) ?? "?"}. soruda {answerKey(sourceAnswer) ? `"${plainAnswer(source, sourceAnswer)}"` : "boş"} {answerKey(sourceAnswer) ? "dediği" : "bıraktığı"} için gösterilmedi
          </p>
        </div>
      );
    }

    const isChanged = changed.includes(field.id);
    const isFlagged = flagMode && flags.includes(field.id);
    const isRequested = requested.includes(field.id);
    const aside = flagMode ? (
      <button type="button" onClick={() => onFlag?.(field.id)} aria-pressed={isFlagged}
        className={`flex h-8 shrink-0 items-center gap-1 rounded-md border px-2.5 text-2xs font-medium transition-colors sm:h-6 sm:px-2 sm:text-3xs ${
          isFlagged ? "border-sky-400/40 bg-sky-400/15 text-sky-200" : "border-white/10 text-neutral-500 hover:border-sky-400/30 hover:text-sky-200"
        }`}
      >
        <Flag size={11} />
        {isFlagged ? "İşaretli" : "İşaretle"}
      </button>
    ) : isRequested ? (
      <span className="flex h-6 shrink-0 items-center gap-1 text-3xs font-medium text-sky-300/80" title="Bu soruda düzeltme istendi">
        <Flag size={11} />
        İstendi
        {previous && showChanges && requestedBefore.includes(field.id) ? (
          <>
            <span className="text-neutral-600">·</span>
            {changedAll.includes(field.id) ? <span className="text-sky-200">değişti</span> : <span className="text-amber-200/80">değişmedi</span>}
          </>
        ) : null}
      </span>
    ) : isChanged ? (
      <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-1.5 text-3xs leading-4 text-sky-200">değişti</span>
    ) : null;

    return (
      <div key={field.id} className={last ? "" : "border-b border-white/5 pb-6"}>
        <AnswerBlock field={field} number={number} answer={answer} responseId={detail?.id} phone={phone} accent={isChanged || isFlagged} hint={hoverQ === field.id}
          aside={aside}
          below={isChanged && !railOn ? <PrevAnswer field={field} previous={previous} previousAnswer={previousAnswers?.get(field.id)} onOpenPrevious={onOpenPrevious} /> : null}
        />
      </div>
    );
  };

  return (
    <CardShell phone={phone} active>
      {stepInfo ? <StepBar flowName={stepInfo.flowName} stage={stepInfo.stage} total={stepInfo.total} fill={isAttempt ? 0 : 100} timeLimitMinutes={form?.timeLimitMinutes} /> : null}
      {compactHeader ? <CompactHeader title={title} description={form?.description ?? ""} /> : <FormDisplayerHeader title={title} description={form?.description ?? ""} />}

      {revisionRow && previous ? (
        <div className="-mt-2">
          <RevisionRow previous={previous} fields={allFields} numbers={numbers} requested={requestedBefore} changedAll={changedAll} onJump={scrollToQuestion} />
        </div>
      ) : changed.length ? (
        <div className="-mt-2 flex flex-wrap items-center gap-1.5 px-2 md:px-4">
          <button type="button" onClick={() => scrollToQuestion(changed[0])}
            className="inline-flex min-h-8 items-center gap-1 rounded-md border border-sky-400/25 bg-sky-400/10 px-2 py-0.5 text-left text-3xs text-sky-200 transition-colors hover:bg-sky-400/15 sm:min-h-0 sm:px-1.5"
          >
            <GitCompare size={10} className="shrink-0" />
            {previous?.workflow?.round ?? 1}. gönderime göre {changed.length} cevap değişti: {changed.map((id) => `${numbers.get(id)}.`).join(", ")} soru
          </button>
        </div>
      ) : null}

      {status === PROVISIONAL ? (
        <div className="px-2 md:px-4">
          <PanelNotice tone={closedProvisional ? "neutral" : "amber"}>
            {closedProvisional
              ? "Ekip bu geçici cevabı teslim yok olarak kapattı. Aşağıdaki cevaplar süre dolduğundaki taslak."
              : "Bu bir geçici cevap. Aday süresi dolduğunda göndermemişti; aşağıdaki cevaplar o anki taslak. Kararı Geçici cevap bölümünden verin."}
          </PanelNotice>
        </div>
      ) : null}
      {status === FLAGGED ? (
        <div className="px-2 md:px-4">
          <PanelNotice tone="amber">Güvenlik doğrulaması yapılamadan alındı; onaylanana kadar kabul edilmiş sayılmaz.</PanelNotice>
        </div>
      ) : null}

      {task ? <TaskBlock task={task} title={title} /> : null}
      {task && !isAttempt && allFields.length > 0 ? <DeliverablesHeader phone={phone} /> : null}

      {isAttempt ? (
        <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
          <span className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/3 text-skylab-300"><empty.Icon size={18} /></span>
          <div>
            <p className="text-sm font-semibold text-neutral-100">{empty.title}</p>
            <p className="mt-1 max-w-sm text-xs text-neutral-400">
              {attemptKind === "none" && detail?.attempt?.closedByTeam ? "Süre doldu; geçici cevap teslim yok olarak kapatıldı." : empty.description}
            </p>
          </div>
        </div>
      ) : allFields.length === 0 ? (
        <p className="flex min-h-24 items-center justify-center rounded-xl border border-dashed border-white/10 text-sm text-neutral-500">Bu cevapta gösterilecek soru yok.</p>
      ) : (
        <div className="flex flex-1 flex-col">
          {fields.map((field, index) => renderField(field, index, fields))}
          {orphans.length ? (
            <>
              <div className="border-t border-white/5 pt-2">
                <SeparatorBlock field={{ id: "orphans", type: "separator", props: { title: "Formda artık olmayan sorular", description: "Bu sorular cevap verildikten sonra formdan kaldırılmış." } }} phone={phone} />
              </div>
              {orphans.map((field, index) => renderField(field, index, orphans))}
            </>
          ) : null}
        </div>
      )}

      <div className="mt-auto border-t border-white/5 px-2 pt-6 md:px-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex min-w-0 items-center gap-1.5 text-2xs text-neutral-500">
            <UserRound size={12} className="shrink-0" />
            <span className="truncate"><span className="text-neutral-300">{person.name}</span> {isAttempt ? "formu açtı" : "olarak yanıtladı"}</span>
          </p>
          <p className="text-2xs tabular-nums text-neutral-500">
            {isAttempt
              ? formatDateTime(detail?.attempt?.openedAt)
              : `${formatDateTime(detail?.submittedAt)}${detail?.timeSpent ? ` · ${formatSpent(detail.timeSpent)}` : ""}`}
          </p>
        </div>
      </div>
    </CardShell>
  );
}
