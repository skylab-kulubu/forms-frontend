"use client";

import { useState } from "react";
import { ArrowRight, Check, ClockPlus, FileCheck, FilePenLine, FileX, Flag, Loader2, Mail, PencilLine, ShieldAlert, X } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";
import ChannelIcon from "@/app/admin/components/share/ChannelIcon";
import { PANEL_SECTION, PANEL_STACK, PanelButton, SectionHeader, StatePill } from "@/app/admin/components/utils/SidePanel";
import { ATTEMPT_STATUS } from "@/lib/attempt-status";
import { currentTime, formatLongDate, formatShortDate, leftText, useTicker } from "@/lib/form-timing";
import { sourceLabel } from "@/lib/share-channels";
import { useAttemptActionMutation, useRunVoidMutation } from "@/lib/hooks/useResponse";
import { ActionError, ConfirmCard, ExtendForm, TimeEvents, attemptTimeValue, routeText } from "../response-displayer/components/AttemptPanels";
import { BLOCK_COPY, NOTE_MAX_LENGTH, RUN_STATUS, VoidedBlock, copyOf, pillOf, summaryOf } from "../response-displayer/components/RunSection";
import { Rail } from "./MarginRail";
import { FLAGGED, PROVISIONAL, RETURNED, describeRoute, formatDateTime, formatPersonName, formatSpent, kindOfDetail, noteOf, personOf, statusView } from "./response-data";
import { KV } from "../form-room/RoomParts";

const REVIEW_NOTE_MAX_LENGTH = 500;

const DECISION = {
  2: { title: "Cevabı onayla", button: "Onayla", tone: "border-emerald-500/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20" },
  3: { title: "Cevabı reddet", button: "Reddet", tone: "border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20" },
  [RETURNED]: { title: "Düzeltme iste", button: "Düzeltme iste", tone: "border-sky-400/40 bg-sky-400/10 text-sky-100 hover:bg-sky-400/20" },
};

const VERDICT_TONE = { 2: "emerald", 3: "red", [RETURNED]: "neutral", [FLAGGED]: "amber" };

function Kbd({ children }) {
  return <span className="ml-0.5 hidden h-4 min-w-4 place-items-center rounded border border-white/15 px-1 font-mono text-4xs font-medium leading-none opacity-70 lg:grid">{children}</span>;
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

export function workflowFacts(detail) {
  const workflow = detail?.workflow ?? null;
  const round = workflow?.round ?? 1;
  const steps = Array.isArray(workflow?.steps) ? workflow.steps : [];
  const ownStep = steps.find((step) => step.stage === workflow?.stage && (step.round ?? 1) === round) ?? null;
  return {
    workflow,
    round,
    steps,
    ownStep,
    nextStage: steps.find((step) => step.stage === (workflow?.stage ?? 0) + 1) ?? null,
    nextRound: steps.find((step) => step.stage === workflow?.stage && (step.round ?? 1) === round + 1 && step.responseId) ?? null,
  };
}

export function decisionAccess(detail, isAttempt, state) {
  const status = Number(detail?.status ?? 0);
  const workflow = detail?.workflow ?? null;
  const canReview = !isAttempt && Boolean(detail) && status !== 0 && status !== PROVISIONAL;
  const routeOpen = !workflow || Boolean(workflow.onApprove || workflow.onDecline);
  const canEditReview = canReview && !detail?.isArchived && routeOpen;
  const editing = state?.editing ?? !detail?.reviewedAt;
  return {
    status,
    canReview,
    canEditReview,
    canReturn: canEditReview && Boolean(workflow) && Boolean(workflow.canReturn),
    deciding: canEditReview && editing,
  };
}

function NoteField({ state, setState, pendingReturn }) {
  const note = state.note ?? "";
  const missing = pendingReturn && !note.trim();

  return (
    <div>
      <label htmlFor="room-review-note" className="mb-1.5 block text-3xs font-medium text-neutral-500">
        Açıklama{pendingReturn ? <span className="text-sky-200/80"> · adaya gider, zorunlu</span> : null}
      </label>
      <textarea id="room-review-note" data-note rows={3} value={note} maxLength={REVIEW_NOTE_MAX_LENGTH}
        onChange={(event) => setState({ note: event.target.value })}
        placeholder={pendingReturn ? "Neyi düzeltmesi gerektiğini yazın" : "Açıklama ekle"}
        className={`w-full resize-none rounded-lg border bg-transparent px-3 py-2 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-skylab-400/50 focus:ring-1 focus:ring-skylab-400/40 sm:text-xs ${missing ? "border-sky-400/40" : "border-white/10"}`}
      />
      <div className="mt-1 flex items-start justify-between gap-3">
        <p className={`text-3xs leading-relaxed ${missing ? "text-sky-200" : "text-neutral-600"}`}>
          {pendingReturn ? (missing ? "Adayın neyi düzelteceğini yazın; not ona e-postayla gider." : "Not adaya e-postayla gider.") : ""}
        </p>
        <p className="shrink-0 text-3xs tabular-nums text-neutral-600">{note.length}/{REVIEW_NOTE_MAX_LENGTH}</p>
      </div>
    </div>
  );
}

function EvaluationSection({ detail, numbers, state, setState, access, onStart, onConfirm, onCancel, autoNext, setAutoNext, showAutoNext }) {
  const { workflow, ownStep } = workflowFacts(detail);
  const inFlow = Boolean(workflow);
  const approve = describeRoute(workflow?.onApprove, 2);
  const decline = describeRoute(workflow?.onDecline, 3);
  const revise = access.canReturn ? `${ownStep?.formTitle || "Bu adım"} yeniden açılır` : null;
  const pending = state.pending ?? null;
  const pendingReturn = pending === RETURNED;
  const noteMissing = pendingReturn && !(state.note ?? "").trim();
  const flags = state.flags ?? [];
  const outcome = pending === 2 ? approve && `${approve}.` : pendingReturn ? `${ownStep?.formTitle || "Form"}, adayın önceki cevaplarıyla yeniden açılır.` : decline && `${decline}.`;
  const lockNote = inFlow ? "Bu karar başvurunun yönünü belirler ve geri alınamaz." : "Karar sonra değiştirilebilir.";

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Değerlendirme" />
      {state.phase === "loading" || state.phase === "success" ? (
        <div className={`flex w-full items-center justify-center rounded-xl border px-3 py-2.5 ${state.phase === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-neutral-200"}`}>
          {state.phase === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        </div>
      ) : pending ? (
        <div className="space-y-3 rounded-xl border border-white/10 bg-white/3 p-3">
          <div>
            <p className="text-xs font-medium text-neutral-100">{DECISION[pending].title}</p>
            {outcome ? <p className="mt-1 text-2xs text-neutral-300">{outcome}</p> : null}
            <p className="mt-1 text-3xs leading-relaxed text-neutral-500">{pendingReturn ? "Aday gönderince cevap yeniden incelemenize düşer. Aday e-postayla bilgilendirilir." : lockNote}</p>
          </div>
          <NoteField state={state} setState={setState} pendingReturn={pendingReturn} />
          {pendingReturn ? (
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-3xs leading-relaxed text-neutral-500">
                <Flag size={11} className="shrink-0" />
                {flags.length ? "İşaretli sorular adayın formunda vurgulanır." : "İsterseniz düzeltilecek soruları karttaki İşaretle düğmeleriyle seçin."}
              </p>
              {flags.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {flags.map((id) => (
                    <span key={id} className="inline-flex items-center gap-0.5 rounded-md border border-sky-400/30 bg-sky-400/10 py-0.5 pl-2 pr-0.5 text-2xs text-sky-100">
                      {numbers.get(id) ?? "?"}. soru
                      <button type="button" aria-label={`${numbers.get(id) ?? ""}. sorunun işaretini kaldır`} onClick={() => setState({ flags: flags.filter((item) => item !== id) })}
                        className="grid size-7 place-items-center rounded text-sky-200/70 transition-colors hover:bg-white/10 hover:text-sky-100 sm:size-5"
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="flex items-center gap-2">
            <button type="button" onClick={onCancel}
              className="flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-white/10 px-2 py-3 text-2xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200 sm:py-1.5"
            >
              Vazgeç<Kbd>Esc</Kbd>
            </button>
            <button type="button" data-act="confirm" disabled={noteMissing} onClick={onConfirm}
              className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border px-2 py-3 text-2xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:py-1.5 ${DECISION[pending].tone}`}
            >
              {DECISION[pending].button}<Kbd>Enter</Kbd>
            </button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <div className="flex gap-2">
              <button type="button" data-act="approve" title="Onayla (1)" onClick={() => onStart(2)}
                className="flex h-11 min-w-0 flex-[1_1_0] items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20 sm:h-10"
              >
                <Check size={14} />Onayla
              </button>
              {access.canReturn ? (
                <button type="button" data-act="revise" title="Düzeltme iste (2)" onClick={() => onStart(RETURNED)}
                  className="flex h-11 min-w-0 flex-[1.35_1_0] items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-sky-400/40 bg-sky-400/10 px-1 text-xs font-semibold text-sky-100 transition hover:bg-sky-400/20 sm:h-10"
                >
                  <FilePenLine size={14} className="shrink-0" />Düzeltme iste
                </button>
              ) : null}
              <button type="button" data-act="decline" title="Reddet (3)" onClick={() => onStart(3)}
                className="flex h-11 min-w-0 flex-[1_1_0] items-center justify-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/10 text-xs font-semibold text-red-100 transition hover:bg-red-500/20 sm:h-10"
              >
                <X size={14} />Reddet
              </button>
            </div>
            {inFlow && (approve || decline || revise) ? (
              <div className="mt-3 space-y-1">
                <RouteHint label="Onaylanırsa" dot="bg-emerald-400/70" text={approve} />
                <RouteHint label="Düzeltme istenirse" dot="bg-sky-400/70" text={revise} />
                <RouteHint label="Reddedilirse" dot="bg-red-400/70" text={decline} />
              </div>
            ) : null}
            <p className="mt-2 hidden items-center gap-1.5 text-3xs text-neutral-600 lg:flex">
              <Kbd>1</Kbd>onayla{access.canReturn ? <><Kbd>2</Kbd>düzeltme iste</> : null}<Kbd>3</Kbd>reddet
            </p>
            {access.status === FLAGGED ? (
              <p className="mt-3 flex gap-1.5 text-3xs leading-relaxed text-neutral-500">
                <ShieldAlert size={11} className="mt-0.5 shrink-0 text-orange-300" />
                <span>Güvenlik doğrulaması yapılamadan alındı; onaylanana kadar kabul edilmiş sayılmaz. Reddederseniz yanıtlayana e-posta gitmez.</span>
              </p>
            ) : null}
          </div>
          <NoteField state={state} setState={setState} pendingReturn={false} />
          {detail.reviewedAt ? (
            <button type="button" onClick={() => setState({ editing: false, note: noteOf(detail) })}
              className="text-left text-2xs text-neutral-500 underline decoration-white/20 underline-offset-2 transition-colors hover:text-neutral-200"
            >
              Değişiklikten vazgeç
            </button>
          ) : null}
        </>
      )}
      {state.error ? <p role="alert" className="text-3xs leading-relaxed text-red-300">{state.error}</p> : null}
      {showAutoNext ? (
        <label className="flex min-h-10 cursor-pointer items-center gap-2 text-2xs text-neutral-400 sm:min-h-8">
          <input type="checkbox" className="checkbox" checked={autoNext} onChange={(event) => setAutoNext(event.target.checked)} />
          Karardan sonra sıradaki bekleyeni aç
        </label>
      ) : null}
    </section>
  );
}

function VerdictSection({ detail, access, state, setState, nextPending, onOpenNext }) {
  const { nextStage, nextRound, ownStep, round } = workflowFacts(detail);
  const status = access.status;
  const view = statusView(kindOfDetail(detail, false));
  const reviewer = formatPersonName(detail.reviewer?.fullName) || "Ekipten biri";

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Karar" pill={view.label} pillTone={VERDICT_TONE[status] ?? "neutral"} description={`${reviewer} · ${formatDateTime(detail.reviewedAt)}`} />
      {noteOf(detail) ? (
        <Rail>
          <p className="text-3xs text-neutral-500">Not</p>
          <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-neutral-200">{noteOf(detail)}</p>
        </Rail>
      ) : null}
      {status === 2 && nextStage ? <p className="text-2xs leading-relaxed text-neutral-400">Başvuru {nextStage.formTitle || "sonraki"} adımına geçti; karar artık değişmez.</p> : null}
      {status === RETURNED ? (
        <div className="space-y-1.5">
          <p className="text-2xs leading-relaxed text-neutral-300">
            {nextRound
              ? `Aday düzeltip ${round + 1}. gönderimi yaptı; kartın üstündeki adım şeridinden açabilirsiniz.`
              : `${ownStep?.formTitle || "Form"} adayın önceki cevaplarıyla yeniden açıldı. Aday gönderince ${round + 1}. gönderim olarak incelemenize düşer.`}
          </p>
          {detail.returnedQuestionIds?.length ? (
            <p className="flex items-center gap-1.5 text-3xs text-sky-200/80"><Flag size={11} />{detail.returnedQuestionIds.length} soru işaretlendi</p>
          ) : null}
        </div>
      ) : null}
      {detail.isArchived ? (
        <p className="text-2xs leading-relaxed text-neutral-500">
          Cevap arşivde{detail.archivedAt ? ` · ${formatDateTime(detail.archivedAt)}` : ""}{detail.archiver?.fullName ? ` · ${formatPersonName(detail.archiver.fullName)}` : ""}
        </p>
      ) : null}
      {access.canEditReview ? (
        <PanelButton touch icon={PencilLine} className="w-full" onClick={() => setState({ editing: true, note: noteOf(detail), pending: null })}>Kararı değiştir</PanelButton>
      ) : null}
      {nextPending && state.decidedHere ? (
        <button type="button" onClick={onOpenNext}
          className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-left text-xs text-neutral-400 transition-colors hover:border-skylab-400/30 hover:bg-skylab-500/10 hover:text-skylab-300"
        >
          <span className="min-w-0 truncate">Sıradaki: <span className="font-medium text-neutral-100">{nextPending.name}</span></span>
          <ArrowRight size={14} className="shrink-0" />
        </button>
      ) : null}
    </section>
  );
}

function ProvisionalSection({ attempt, onExtended }) {
  const mutation = useAttemptActionMutation();
  const [flow, setFlow] = useState(null);
  const [note, setNote] = useState("");
  const pending = mutation.isPending;
  const acceptOutcome = attempt.acceptRequiresReview
    ? "Cevap Beklemede olarak listeye düşer; onaylarsanız akış ilerler."
    : routeText(attempt.onAccept, "Cevap gönderilmiş sayılır; başvuru tamamlanır.") ?? "Cevap gönderilmiş sayılır.";
  const closeOutcome = attempt.onClose ? `Akışta "Süre dolduğunda" yolu: ${routeText(attempt.onClose, "başvuru bu adımda sonlanır")}.` : "Teslim yok olarak kalır.";
  const run = (action, body) => mutation.mutate({ attemptId: attempt.id, action, body }, {
    onSuccess: () => {
      setFlow(null);
      if (action === "extend") onExtended?.();
    },
  });

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Geçici cevap" description="Aday süre bitmeden göndermedi. Taslağa bakıp karar verin." />
      {flow === "extend" ? (
        <ExtendForm attempt={attempt} pending={pending} onCancel={() => setFlow(null)} onConfirm={(body) => run("extend", body)} />
      ) : flow ? (
        <ConfirmCard title={flow === "accept" ? "Teslim olarak kabul et" : "Teslim yok olarak kapat"} outcome={flow === "accept" ? acceptOutcome : closeOutcome}
          note="Aday e-postayla bilgilendirilir. Bu karar geri alınamaz." confirmLabel={flow === "accept" ? "Kabul et" : "Kapat"} danger={flow === "close"}
          pending={pending} onCancel={() => setFlow(null)} onConfirm={() => run(flow, { note: note.trim() || null })} decisionNote={note} onNoteChange={setNote}
        />
      ) : (
        <div className="space-y-2">
          <button type="button" onClick={() => setFlow("accept")} className="flex w-full items-center gap-3 rounded-xl border border-skylab-400/40 bg-skylab-500/10 px-3 py-2.5 text-left transition hover:bg-skylab-500/20">
            <FileCheck size={16} className="shrink-0 text-skylab-300" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-skylab-300">Teslim olarak kabul et</span>
              <span className="block text-3xs text-neutral-400">Cevap gönderilmiş sayılır{attempt.acceptRequiresReview ? ", incelemeye düşer" : ""}</span>
            </span>
          </button>
          {attempt.canExtend ? (
            <button type="button" onClick={() => setFlow("extend")} className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:bg-white/10">
              <ClockPlus size={16} className="shrink-0 text-neutral-300" />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-neutral-100">Süre ver</span>
                <span className="block text-3xs text-neutral-400">Aday kaldığı yerden devam eder</span>
              </span>
            </button>
          ) : null}
          <button type="button" onClick={() => setFlow("close")} className="flex w-full items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/5 px-3 py-2.5 text-left transition hover:bg-red-500/10">
            <FileX size={16} className="shrink-0 text-red-300" />
            <span className="min-w-0">
              <span className="block text-xs font-semibold text-red-200">Teslim yok olarak kapat</span>
              <span className="block text-3xs text-neutral-400">{attempt.onClose ? "Akışta süre dolunca yolundan gider" : "Aday bu görevi teslim etmemiş sayılır"}</span>
            </span>
          </button>
          <div className="space-y-1 pt-1">
            <RouteHint label="Kabul edilirse" dot="bg-emerald-400/70" text={attempt.acceptRequiresReview ? "Beklemede, onayla akış ilerler" : routeText(attempt.onAccept, "Başvuru tamamlanır") ?? "Gönderilmiş sayılır"} />
            <RouteHint label="Kapatılırsa" dot="bg-amber-400/70" text={attempt.onClose ? routeText(attempt.onClose, "Başvuru sonlanır") : "Teslim yok"} />
          </div>
        </div>
      )}
      <ActionError error={mutation.error} />
    </section>
  );
}

function AttemptTimeSection({ attempt }) {
  const mutation = useAttemptActionMutation();
  const [extending, setExtending] = useState(false);
  const running = attempt.status === ATTEMPT_STATUS.STARTED;
  const opened = attempt.status === ATTEMPT_STATUS.OPENED;
  const deadline = attempt.deadlineAt ? new Date(attempt.deadlineAt).getTime() : null;

  if (opened) {
    const sent = mutation.isSuccess;
    return (
      <section className={PANEL_SECTION}>
        <SectionHeader title="Hatırlatma"
          description={`Aday formu açtı ama görevi başlatmadı. ${attempt.reminderSentAt ? `Son hatırlatma ${formatShortDate(attempt.reminderSentAt)}.` : "Henüz hatırlatma gönderilmedi."}`}
        />
        <PanelButton touch icon={sent ? FileCheck : Mail} className="w-full" disabled={!attempt.canRemind || mutation.isPending || sent}
          onClick={() => mutation.mutate({ attemptId: attempt.id, action: "remind" })} title={attempt.canRemind ? undefined : "Hatırlatma şu anda gönderilemiyor"}
        >
          {sent ? "Hatırlatma gönderildi" : "Hatırlat"}
        </PanelButton>
        <ActionError error={mutation.error} />
      </section>
    );
  }

  if (!attempt.canExtend && !running) return null;

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Süre"
        description={running && deadline
          ? `Bitiş ${formatLongDate(deadline)} · ${leftText(deadline - currentTime())}.`
          : "Süre doldu, teslim yok. Süre verirseniz aday kaldığı yerden devam eder."}
      />
      {extending ? (
        <ExtendForm attempt={attempt} pending={mutation.isPending} onCancel={() => setExtending(false)}
          onConfirm={(body) => mutation.mutate({ attemptId: attempt.id, action: "extend", body }, { onSuccess: () => setExtending(false) })}
        />
      ) : attempt.canExtend ? (
        <PanelButton touch icon={ClockPlus} className="w-full" onClick={() => setExtending(true)}>Süre ver</PanelButton>
      ) : null}
      <ActionError error={mutation.error} />
    </section>
  );
}

function RunPanel({ run, instanceId }) {
  const mutation = useRunVoidMutation();
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const pill = pillOf(run);
  const voided = run.status === RUN_STATUS.VOIDED;
  const copy = copyOf(run);
  const blockCopy = !voided ? BLOCK_COPY[run.voidBlock] : null;

  return (
    <section className={PANEL_SECTION}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-neutral-100">Başvuru</p>
        <StatePill tone={pill.tone}>{pill.label}</StatePill>
      </div>
      {voided ? <VoidedBlock run={run} /> : <p className="text-2xs leading-relaxed text-neutral-400">{summaryOf(run)}</p>}
      {blockCopy ? <p className="text-3xs leading-relaxed text-neutral-500">{blockCopy}</p> : null}
      {run.canVoid ? (
        confirming ? (
          <div className="rounded-xl border border-white/10 bg-white/3 p-3">
            <p className="text-xs font-medium text-neutral-100">{copy.action}</p>
            <ul className="mt-1.5 space-y-1">
              {copy.lines.map((line) => (
                <li key={line} className="flex gap-2 text-2xs leading-relaxed text-neutral-300"><span className="mt-1.75 size-1 shrink-0 rounded-full bg-neutral-500" />{line}</li>
              ))}
            </ul>
            <label htmlFor="room-run-void-note" className="mb-1.5 mt-3 block text-3xs font-medium text-neutral-500">Adaya gidecek not · isteğe bağlı</label>
            <textarea id="room-run-void-note" rows={2} value={note} onChange={(event) => setNote(event.target.value)} maxLength={NOTE_MAX_LENGTH}
              placeholder="Neden yeniden başvurabileceğini yazın"
              className="w-full rounded-lg border border-white/10 bg-transparent px-3 py-2 text-xs text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-skylab-400/50 focus:ring-1 focus:ring-skylab-400/40"
            />
            <p className="mt-1.5 text-3xs leading-relaxed text-neutral-500">Aday e-postayla bilgilendirilir.</p>
            <div className="mt-3 flex items-center gap-2">
              <button type="button" onClick={() => setConfirming(false)} disabled={mutation.isPending}
                className="flex-1 rounded-lg border border-white/10 px-3 py-1.5 text-2xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
              >
                Vazgeç
              </button>
              <button type="button" disabled={mutation.isPending}
                onClick={() => mutation.mutate({ instanceId, note: note.trim() }, { onSuccess: () => { setConfirming(false); setNote(""); } })}
                className={`flex flex-1 items-center justify-center rounded-lg border px-3 py-1.5 text-2xs font-semibold transition-colors disabled:opacity-60 ${copy.danger ? "border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20" : "border-skylab-400/40 bg-skylab-500/10 text-skylab-200 hover:bg-skylab-500/20"}`}
              >
                {mutation.isPending ? <Loader2 size={13} className="animate-spin" /> : copy.button}
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => { mutation.reset(); setConfirming(true); }}
            className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${copy.danger ? "border-white/10 hover:border-red-500/30 hover:bg-red-500/5" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
          >
            <copy.Icon size={16} className={`shrink-0 ${copy.danger ? "text-red-300/70" : "text-neutral-300"}`} />
            <span className="min-w-0">
              <span className={`block text-xs font-semibold ${copy.danger ? "text-neutral-200 transition-colors group-hover:text-red-200" : "text-neutral-100"}`}>{copy.action}</span>
              <span className="block text-3xs text-neutral-500">{copy.sub}</span>
            </span>
          </button>
        )
      ) : null}
      {mutation.error ? <p role="alert" className="text-3xs leading-relaxed text-red-300">{mutation.error.body?.message ?? mutation.error.message ?? "Başvuru yeniden açılamadı."}</p> : null}
    </section>
  );
}

export default function DecisionPanel({
  detail, isAttempt = false, ownKind = null, numbers, state, setState, onStart, onConfirm, onCancel, nextPending = null, onOpenNext,
  autoNext = true, setAutoNext, showAutoNext = false, onExtended,
}) {
  const attempt = detail?.attempt ?? null;
  const running = isAttempt && attempt?.status === ATTEMPT_STATUS.STARTED;
  useTicker(running, 30_000);

  if (!detail) return null;

  const person = personOf(detail);
  const kind = kindOfDetail(detail, isAttempt);
  const view = statusView(kind);
  const access = decisionAccess(detail, isAttempt, state);
  const { workflow, round } = workflowFacts(detail);
  const attribution = detail.attribution ?? null;
  const scannedFromQr = attribution?.medium === "qr" && attribution?.source !== "qr";
  const time = attemptTimeValue(attempt);

  return (
    <div className={PANEL_STACK}>
      <section className={PANEL_SECTION}>
        <div className="flex items-center gap-3">
          <Avatar name={person.known ? person.name : ""} photoUrl={person.photoUrl} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-neutral-100">{person.name}</p>
            {person.email ? <p className="truncate text-3xs text-neutral-500">{person.email}</p> : null}
            {person.id ? <p className="truncate text-3xs text-neutral-500/70">ID: {person.id}</p> : null}
          </div>
        </div>
        <div className="divide-y divide-white/5">
          <KV label="Durum"><span className={`size-1.5 rounded-full ${view.dot}`} /><span className={view.text}>{view.label}</span></KV>
          {isAttempt ? (
            <>
              <KV label={time?.label ?? "Süre"}><span className="tabular-nums">{time?.value ?? "--"}</span></KV>
              <KV label="Açtı"><span className="tabular-nums">{formatDateTime(attempt?.openedAt)}</span></KV>
            </>
          ) : (
            <>
              <KV label="Gönderim"><span className="tabular-nums">{formatDateTime(detail.submittedAt)}</span></KV>
              <KV label={time ? "Teslim süresi" : "Süre"}><span className="tabular-nums">{time?.value ?? formatSpent(detail.timeSpent)}</span></KV>
            </>
          )}
          {attribution && (attribution.source || attribution.campaign || attribution.content || scannedFromQr) ? (
            <KV label="Kaynak">
              <span className="text-neutral-400"><ChannelIcon source={attribution.source} size={12} /></span>
              <span>{sourceLabel(attribution.source)}</span>
              {scannedFromQr ? <span className="rounded-full border border-white/10 px-1.5 text-3xs leading-4 text-neutral-400">QR</span> : null}
              {attribution.campaign ? <span className="max-w-24 truncate font-mono text-3xs text-neutral-600">{attribution.campaign}</span> : null}
            </KV>
          ) : null}
          {round > 1 ? <KV label="Gönderim sırası"><span>{round}. gönderim</span></KV> : null}
        </div>
      </section>

      {isAttempt && attempt ? <AttemptTimeSection key={attempt.id} attempt={attempt} /> : null}

      {!isAttempt && Number(detail.status) === PROVISIONAL && attempt?.canDecide && !detail.isArchived ? (
        <ProvisionalSection key={attempt.id} attempt={attempt} onExtended={onExtended} />
      ) : null}

      {access.deciding ? (
        <EvaluationSection detail={detail} numbers={numbers} state={state} setState={setState} access={access} onStart={onStart} onConfirm={onConfirm} onCancel={onCancel}
          autoNext={autoNext} setAutoNext={setAutoNext} showAutoNext={showAutoNext}
        />
      ) : null}

      {access.canReview && detail.reviewedAt && !access.deciding ? (
        <VerdictSection detail={detail} access={access} state={state} setState={setState} nextPending={nextPending} onOpenNext={onOpenNext} />
      ) : null}

      {workflow?.run && !isAttempt ? <RunPanel key={workflow.instanceId} run={workflow.run} instanceId={workflow.instanceId} /> : null}

      {attempt?.events?.length ? (
        <section className={PANEL_SECTION}>
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold text-neutral-100">Süre geçmişi</p>
            <span className="text-3xs tabular-nums text-neutral-500">{attempt.events.length} kayıt</span>
          </div>
          <TimeEvents attempt={attempt} />
        </section>
      ) : null}

      <section className={PANEL_SECTION}>
        <p className="break-all font-mono text-3xs leading-relaxed text-neutral-600" title={detail.id}>
          {isAttempt ? "Kayıt" : "Cevap"} ID {detail.id}{ownKind === "round" ? " · önceki gönderim" : ownKind === "stage" ? " · başka adımın cevabı" : ""}
        </p>
      </section>
    </div>
  );
}
