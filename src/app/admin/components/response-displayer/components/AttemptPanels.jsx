"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, ClipboardList, ClockPlus, Eye, FileCheck, FileX, Loader2, Mail, Play, Send, Timer, TimerOff } from "lucide-react";
import TaskMarkdown from "@/app/components/rich-text/TaskMarkdown";
import { taskFirstLine, taskReadMinutes } from "@/app/components/rich-text/markdown";
import StateCard from "@/app/components/StateCard";
import { ATTEMPT_EVENT, ATTEMPT_STATUS, attemptKindOf } from "@/lib/attempt-status";
import { currentTime, durationText, formatLongDate, formatShortDate, leftText, shortDuration } from "@/lib/form-timing";
import { PanelButton, PanelNotice, ROW, ROW_HOVER, TILE } from "@/app/admin/components/utils/SidePanel";

const MARK_TONE = {
  done: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  review: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  declined: "border-red-400/30 bg-red-400/10 text-red-300",
  paused: "border-white/15 bg-white/5 text-neutral-400",
  current: "border-skylab-400/40 bg-skylab-500/10 text-skylab-300",
};

const EXTEND_PRESETS = [6, 12, 24, 48];

export const formatPersonName = (name) =>
  name?.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map((word) => word.replace(/^\p{L}/u, (c) => c.toLocaleUpperCase("tr-TR"))).join(" ") || "";

function SectionTitle({ children }) {
  return <h3 className="mb-2 text-2xs font-medium text-neutral-500">{children}</h3>;
}

function Actor({ user }) {
  return <span className="text-neutral-100">{formatPersonName(user?.fullName) || "Ekipten biri"}</span>;
}

function RouteHint({ label, dot, text }) {
  if (!text) return null;
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-3xs text-neutral-500">
      <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
      <span className="shrink-0">{label}</span>
      <ArrowRight size={10} className="shrink-0 text-neutral-600" />
      <span className="truncate text-neutral-300">{text}</span>
    </p>
  );
}

export function TaskRow({ task }) {
  const [open, setOpen] = useState(false);
  const content = task?.content ?? "";
  if (!content.trim()) return null;

  return (
    <div className="mx-auto mb-5 w-full max-w-2xl">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}
        className={`${ROW} ${ROW_HOVER} flex w-full items-center gap-3 border-white/10 px-3 py-2.5 text-left`}
      >
        <span className={`${TILE} border-white/10 text-neutral-400`}><ClipboardList size={14} /></span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-neutral-100">Görev metni</span>
          <span className="block truncate text-2xs text-neutral-500">{taskFirstLine(content)} · {taskReadMinutes(content)} dk okuma</span>
        </span>
        <ChevronDown size={14} className={`shrink-0 text-neutral-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden"
          >
            <div className="mt-2 rounded-lg border border-white/5 px-4 py-3">
              <TaskMarkdown content={content} small />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const ATTEMPT_EMPTY = {
  running: { Icon: Timer, tone: "brand", title: "Aday görev üzerinde çalışıyor", description: "Taslak süre bitene kadar gizli. Süre dolarsa burada geçici cevap olarak açılır." },
  opened: { Icon: Eye, tone: "neutral", title: "Görev henüz başlatılmadı", description: "Aday formu açtı ama Görevi başlat'a basmadı." },
  none: { Icon: FileX, tone: "neutral", title: "Teslim yok", description: "Süre doldu ve teslim kaydedilmedi." },
};

export function AttemptEmptyState({ attempt }) {
  const kind = attemptKindOf(attempt);
  const view = ATTEMPT_EMPTY[kind] ?? ATTEMPT_EMPTY.none;
  const description = kind === "none" && attempt?.closedByTeam
    ? "Süre doldu; geçici cevap teslim yok olarak kapatıldı."
    : view.description;

  return (
    <div className="flex min-h-[40vh]">
      <StateCard title={view.title} Icon={view.Icon} tone={view.tone} description={description} />
    </div>
  );
}

export function attemptWhen(attempt) {
  switch (attempt?.status) {
    case ATTEMPT_STATUS.STARTED: return `Başladı ${formatShortDate(attempt.startedAt)}`;
    case ATTEMPT_STATUS.OPENED: return `Açtı ${formatShortDate(attempt.openedAt)}`;
    default: return attempt?.expiredAt ? `Süre doldu ${formatShortDate(attempt.expiredAt)}` : "Süre doldu";
  }
}

export function ProvisionalNotice({ actionable = true, closed = false }) {
  return (
    <div className="mx-auto mb-5 w-full max-w-2xl">
      <PanelNotice tone={closed ? "neutral" : "amber"}>
        {closed
          ? "Ekip bu geçici cevabı teslim yok olarak kapattı. Aşağıdaki cevaplar süre dolduğundaki taslak."
          : <>
            Bu bir geçici cevap. Aday süresi dolduğunda göndermemişti; aşağıdaki cevaplar o anki taslak.
            {actionable ? " Kararı işlemler panelinden verin." : ""}
          </>}
      </PanelNotice>
    </div>
  );
}

function FlowButtons({ onCancel, onConfirm, confirmLabel, pending, danger = false }) {
  return (
    <div className="mt-3 flex items-center gap-2">
      <button type="button" onClick={onCancel} disabled={pending}
        className="flex-1 rounded-lg border border-white/10 px-3 py-1.5 text-2xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
      >
        Vazgeç
      </button>
      <button type="button" onClick={onConfirm} disabled={pending}
        className={`flex flex-1 items-center justify-center rounded-lg border px-3 py-1.5 text-2xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 disabled:opacity-60 ${danger ? "border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20" : "border-skylab-400/40 bg-skylab-500/10 text-skylab-200 hover:bg-skylab-500/20"}`}
      >
        {pending ? <Loader2 size={13} className="animate-spin" /> : confirmLabel}
      </button>
    </div>
  );
}

function ConfirmCard({ title, outcome, note, confirmLabel, danger = false, onCancel, onConfirm, pending, decisionNote, onNoteChange }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-3">
      <p className="text-xs font-medium text-neutral-100">{title}</p>
      {outcome && <p className="mt-1 text-2xs text-neutral-300">{outcome}</p>}
      <p className="mt-1 text-3xs leading-relaxed text-neutral-500">{note}</p>
      <label htmlFor="attempt-decision-note" className="mb-1.5 mt-3 block text-3xs font-medium text-neutral-500">Not (süre geçmişinde görünür)</label>
      <textarea id="attempt-decision-note" rows={2} value={decisionNote} onChange={(event) => onNoteChange(event.target.value)} maxLength={500}
        placeholder="İsteğe bağlı"
        className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-skylab-400/50 focus:ring-1 focus:ring-skylab-400/40"
      />
      <FlowButtons onCancel={onCancel} onConfirm={onConfirm} confirmLabel={confirmLabel} pending={pending} danger={danger} />
    </div>
  );
}

export function ExtendForm({ attempt, pending, onCancel, onConfirm }) {
  const [hours, setHours] = useState(12);
  const [note, setNote] = useState("");
  const running = attempt?.status === ATTEMPT_STATUS.STARTED;
  const deadline = attempt?.deadlineAt ? new Date(attempt.deadlineAt).getTime() : 0;
  const base = running && deadline > currentTime() ? deadline : currentTime();
  const next = new Date(base + hours * 3_600_000);

  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-3">
      <p className="text-xs font-medium text-neutral-100">Süre ver</p>
      <div className="mt-2.5 grid grid-cols-4 gap-1.5">
        {EXTEND_PRESETS.map((value) => (
          <button key={value} type="button" onClick={() => setHours(value)} aria-pressed={hours === value}
            className={`h-7 rounded-md border text-2xs font-medium tabular-nums transition-colors ${hours === value ? "border-skylab-400/40 bg-skylab-500/15 text-skylab-300" : "border-white/10 bg-white/5 text-neutral-300 hover:text-neutral-100"}`}
          >
            +{value} sa
          </button>
        ))}
      </div>
      <p className="mt-2.5 text-2xs text-neutral-400">Yeni bitiş <span className="tabular-nums text-neutral-100">{formatLongDate(next)}</span></p>
      <label htmlFor="attempt-extend-note" className="mb-1.5 mt-3 block text-3xs font-medium text-neutral-500">Not (adaya gönderilmez)</label>
      <textarea id="attempt-extend-note" rows={2} value={note} onChange={(event) => setNote(event.target.value)} maxLength={500}
        placeholder="Neden süre verdiğinizi yazın, süre geçmişinde görünür."
        className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-skylab-400/50 focus:ring-1 focus:ring-skylab-400/40"
      />
      <p className="mt-1.5 text-3xs leading-relaxed text-neutral-500">
        Aday kaldığı yerden devam eder ve e-postayla bilgilendirilir.
        {attempt?.status === ATTEMPT_STATUS.PROVISIONAL ? " Geçici cevap geri alınır." : ""}
      </p>
      <FlowButtons onCancel={onCancel} confirmLabel={`${hours} saat ver`} pending={pending}
        onConfirm={() => onConfirm({ minutes: hours * 60, note: note.trim() || null })}
      />
    </div>
  );
}

function ActionError({ error }) {
  if (!error) return null;
  return <p className="mt-2 text-3xs leading-relaxed text-red-300" role="alert">{error.body?.message ?? error.message ?? "İşlem tamamlanamadı."}</p>;
}

function routeText(route, endText) {
  if (!route) return null;
  if (route.endsFlow) return endText;
  return `${route.formTitle || "Sıradaki"} adımı açılır`;
}

export function DecisionSection({ attempt, mutation, initialFlow = null, onExtended = null }) {
  const [flow, setFlow] = useState(initialFlow === "extend" ? "extend" : null);
  const [decisionNote, setDecisionNote] = useState("");
  const pending = mutation.isPending;

  const acceptOutcome = attempt.acceptRequiresReview
    ? "Cevap Beklemede olarak listeye düşer; onaylarsanız akış ilerler."
    : routeText(attempt.onAccept, "Cevap gönderilmiş sayılır; başvuru tamamlanır.") ?? "Cevap gönderilmiş sayılır.";
  const closeOutcome = attempt.onClose
    ? `Akışta "Süre dolduğunda" yolu: ${routeText(attempt.onClose, "başvuru bu adımda sonlanır")}.`
    : "Teslim yok olarak kalır.";

  const run = (action, body) => mutation.mutate({ attemptId: attempt.id, action, body }, {
    onSuccess: () => {
      setFlow(null);
      if (action === "extend") onExtended?.();
    },
  });

  let inner;
  if (flow === "extend") {
    inner = <ExtendForm attempt={attempt} pending={pending} onCancel={() => setFlow(null)} onConfirm={(body) => run("extend", body)} />;
  } else if (flow === "accept") {
    inner = (
      <ConfirmCard title="Teslim olarak kabul et" outcome={acceptOutcome} note="Aday e-postayla bilgilendirilir. Bu karar geri alınamaz."
        confirmLabel="Kabul et" pending={pending} onCancel={() => setFlow(null)} onConfirm={() => run("accept", { note: decisionNote.trim() || null })}
        decisionNote={decisionNote} onNoteChange={setDecisionNote}
      />
    );
  } else if (flow === "close") {
    inner = (
      <ConfirmCard title="Teslim yok olarak kapat" outcome={closeOutcome} note="Aday e-postayla bilgilendirilir. Bu karar geri alınamaz."
        confirmLabel="Kapat" danger pending={pending} onCancel={() => setFlow(null)} onConfirm={() => run("close", { note: decisionNote.trim() || null })}
        decisionNote={decisionNote} onNoteChange={setDecisionNote}
      />
    );
  } else {
    inner = (
      <>
        <p className="mb-3 text-2xs leading-relaxed text-neutral-400">Aday süre bitmeden göndermedi. Taslağa bakıp karar verin.</p>
        <div className="space-y-2">
          <button type="button" onClick={() => setFlow("accept")}
            className="flex w-full items-center gap-3 rounded-xl border border-skylab-400/40 bg-skylab-500/10 px-3 py-2.5 text-left transition hover:bg-skylab-500/20"
          >
            <FileCheck size={16} className="shrink-0 text-skylab-300" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-skylab-300">Teslim olarak kabul et</span>
              <span className="block text-3xs text-neutral-400">Cevap gönderilmiş sayılır{attempt.acceptRequiresReview ? ", incelemeye düşer" : ""}</span>
            </span>
          </button>
          {attempt.canExtend && (
            <button type="button" onClick={() => setFlow("extend")}
              className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10"
            >
              <ClockPlus size={16} className="shrink-0 text-neutral-300" />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-neutral-100">Süre ver</span>
                <span className="block text-3xs text-neutral-400">Aday kaldığı yerden devam eder</span>
              </span>
            </button>
          )}
          <button type="button" onClick={() => setFlow("close")}
            className="flex w-full items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-left transition hover:bg-red-500/10"
          >
            <FileX size={16} className="shrink-0 text-red-300" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-red-200">Teslim yok olarak kapat</span>
              <span className="block text-3xs text-neutral-400">{attempt.onClose ? "Akışta süre dolunca yolundan gider" : "Aday bu görevi teslim etmemiş sayılır"}</span>
            </span>
          </button>
        </div>
        <div className="mt-3 space-y-1">
          <RouteHint label="Kabul edilirse" dot="bg-emerald-400/70" text={attempt.acceptRequiresReview ? "Beklemede, onayla akış ilerler" : routeText(attempt.onAccept, "Başvuru tamamlanır") ?? "Gönderilmiş sayılır"} />
          <RouteHint label="Kapatılırsa" dot="bg-amber-400/70" text={attempt.onClose ? routeText(attempt.onClose, "Başvuru sonlanır") : "Teslim yok"} />
        </div>
      </>
    );
  }

  return (
    <div className="px-1 py-4 first:pt-0">
      <SectionTitle>Geçici cevap</SectionTitle>
      {inner}
      <ActionError error={mutation.error} />
    </div>
  );
}

export function TimeSection({ attempt, mutation, initialFlow = null }) {
  const [flow, setFlow] = useState(initialFlow === "extend" && attempt.canExtend ? "extend" : null);
  const running = attempt.status === ATTEMPT_STATUS.STARTED;
  const deadline = attempt.deadlineAt ? new Date(attempt.deadlineAt).getTime() : null;

  if (!attempt.canExtend && !running) return null;

  return (
    <div className="px-1 py-4 first:pt-0">
      <SectionTitle>Süre</SectionTitle>
      {flow === "extend" ? (
        <ExtendForm attempt={attempt} pending={mutation.isPending} onCancel={() => setFlow(null)}
          onConfirm={(body) => mutation.mutate({ attemptId: attempt.id, action: "extend", body }, { onSuccess: () => setFlow(null) })}
        />
      ) : (
        <>
          <p className="mb-3 text-2xs leading-relaxed text-neutral-400">
            {running && deadline
              ? <>Bitiş <span className="tabular-nums text-neutral-200">{formatLongDate(deadline)}</span> · {leftText(deadline - currentTime())}.</>
              : "Süre doldu, teslim yok. Süre verirseniz aday kaldığı yerden devam eder."}
          </p>
          {attempt.canExtend && (
            <PanelButton icon={ClockPlus} className="w-full" onClick={() => setFlow("extend")}>Süre ver</PanelButton>
          )}
        </>
      )}
      <ActionError error={mutation.error} />
    </div>
  );
}

export function ReminderSection({ attempt, mutation }) {
  const sent = mutation.isSuccess;

  return (
    <div className="px-1 py-4 first:pt-0">
      <SectionTitle>Hatırlatma</SectionTitle>
      <p className="mb-3 text-2xs leading-relaxed text-neutral-400">
        Aday formu açtı ama görevi başlatmadı.{" "}
        {attempt.reminderSentAt ? `Son hatırlatma ${formatShortDate(attempt.reminderSentAt)}.` : "Henüz hatırlatma gönderilmedi."}
      </p>
      <PanelButton icon={sent ? FileCheck : Mail} className="w-full" disabled={!attempt.canRemind || mutation.isPending || sent}
        onClick={() => mutation.mutate({ attemptId: attempt.id, action: "remind" })}
        title={attempt.canRemind ? undefined : "Hatırlatma şu anda gönderilemiyor"}
      >
        {sent ? "Hatırlatma gönderildi" : "Hatırlat"}
      </PanelButton>
      <ActionError error={mutation.error} />
    </div>
  );
}

function eventView(event, attempt) {
  switch (event.type) {
    case ATTEMPT_EVENT.OPENED:
      return { tone: "paused", Icon: Eye, title: "Formu açtı" };
    case ATTEMPT_EVENT.STARTED:
      return { tone: "current", Icon: Play, title: "Görevi başlattı", detail: event.deadlineAt ? `Bitiş ${formatShortDate(event.deadlineAt)}` : null };
    case ATTEMPT_EVENT.EXTENDED:
      return {
        tone: "current", Icon: ClockPlus,
        title: <><Actor user={event.actor} /> <span className="font-normal text-neutral-300">{durationText(event.minutes ?? 0)} verdi</span></>,
        detail: event.deadlineAt ? `Yeni bitiş ${formatShortDate(event.deadlineAt)}` : null,
        note: event.note,
      };
    case ATTEMPT_EVENT.EXPIRED:
      return { tone: "review", Icon: TimerOff, title: "Süre doldu", detail: "Taslak geçici cevap olarak alındı" };
    case ATTEMPT_EVENT.EXPIRED_EMPTY:
      return { tone: "paused", Icon: TimerOff, title: "Süre doldu", detail: "Taslak boştu, teslim yok" };
    case ATTEMPT_EVENT.ACCEPTED:
      return { tone: "done", Icon: FileCheck, title: <><Actor user={event.actor} /> <span className="font-normal text-neutral-300">teslim olarak kabul etti</span></>, note: event.note };
    case ATTEMPT_EVENT.CLOSED:
      return { tone: "declined", Icon: FileX, title: <><Actor user={event.actor} /> <span className="font-normal text-neutral-300">teslim yok olarak kapattı</span></>, note: event.note };
    case ATTEMPT_EVENT.REMINDED:
      return { tone: "paused", Icon: Mail, title: <><Actor user={event.actor} /> <span className="font-normal text-neutral-300">hatırlatma gönderdi</span></> };
    case ATTEMPT_EVENT.SUBMITTED: {
      const startedAt = attempt?.startedAt ? new Date(attempt.startedAt).getTime() : null;
      const at = new Date(event.createdAt).getTime();
      return { tone: "done", Icon: Send, title: "Teslim etti", detail: startedAt ? `Teslim süresi ${shortDuration(at - startedAt)}` : null };
    }
    default:
      return { tone: "paused", Icon: Eye, title: "Kayıt" };
  }
}

export function TimeHistory({ attempt }) {
  const events = attempt?.events ?? [];
  if (events.length === 0) return null;

  return (
    <div className="px-1 py-4 first:pt-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-2xs font-medium text-neutral-500">Süre geçmişi</h3>
        <span className="text-3xs tabular-nums text-neutral-500">{events.length} kayıt</span>
      </div>
      <ol className="w-full text-left">
        {events.map((event, index) => {
          const view = eventView(event, attempt);
          const last = index === events.length - 1;
          return (
            <li key={event.id ?? index} className={`relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3 ${last ? "" : "pb-4"}`}>
              {!last && <span aria-hidden className="absolute bottom-1.5 left-3 top-7.5 w-px -translate-x-1/2 bg-white/10" />}
              <span className={`grid size-6 place-items-center rounded-md border text-2xs font-semibold ${MARK_TONE[view.tone]}`}>
                <view.Icon size={12} strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-3 pt-0.5">
                  <span className="min-w-0 text-xs font-medium text-neutral-100">{view.title}</span>
                  <span className="shrink-0 text-3xs tabular-nums text-neutral-500">{formatShortDate(event.createdAt)}</span>
                </div>
                {view.detail && <p className="mt-px text-2xs leading-5 text-neutral-400">{view.detail}</p>}
                {view.note && (
                  <div className="relative mt-2 pl-3 text-left before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:rounded-full before:bg-neutral-700">
                    <p className="text-2xs text-neutral-500">Not</p>
                    <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-neutral-200">{view.note}</p>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function attemptTimeValue(attempt) {
  if (!attempt) return null;
  if (attempt.status === ATTEMPT_STATUS.STARTED && attempt.deadlineAt) {
    return { label: "Kalan", value: leftText(new Date(attempt.deadlineAt).getTime() - currentTime()).replace(" kaldı", "") };
  }
  if (attempt.submittedAt && attempt.startedAt) {
    return { label: "Süre", value: shortDuration(new Date(attempt.submittedAt).getTime() - new Date(attempt.startedAt).getTime()) };
  }
  if (attempt.status === ATTEMPT_STATUS.OPENED) return { label: "Süre", value: "--" };
  return { label: "Süre", value: durationText(attempt.timeLimitMinutes + attempt.extendedMinutes).replace(" saat", " sa").replace(" dakika", " dk") };
}
