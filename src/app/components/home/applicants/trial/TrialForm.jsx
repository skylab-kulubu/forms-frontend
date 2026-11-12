"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CircleAlert, Loader2 } from "lucide-react";
import { REGISTRY } from "@/app/components/form-registry";
import {
  CopyEmailNote, FormAuthContext, FormDisplayerHeader, GuestNoticeDock, IdentityNote, MissingFields, RespondentLine, WARNING_SECONDS,
} from "@/app/components/form-displayer/components/FormDisplayerComponents";
import { GuestUploadContext } from "@/app/components/form-displayer/GuestUploadContext";
import { guestNoticeCopy } from "@/app/components/form-displayer/guestNoticeCopy";
import StatusScreen from "@/app/components/form-displayer/components/StatusScreen";
import FormSkeleton from "@/app/components/form-displayer/components/FormSkeleton";
import NoticeDock, { NoticeDockPlacement } from "@/app/components/utils/NoticeDock";
import { hasEventIdentity } from "@/lib/event-handoff";
import { jumpTo, useTrial, useTrialForm } from "./useTrial";
import { useFollowReveal } from "./useFollowReveal";
import { cascade, reduced } from "./motion";

export default function TrialForm({ formId, ...rest }) {
  const { form, payload, loading, failed } = useTrialForm(formId);
  if (!formId) return <p className="tl-off">Form henüz bağlanmadı.</p>;
  if (failed) return <p className="tl-off">Deneme formu şu an açılamıyor.</p>;
  if (loading || !form) return <div className="tl-wait"><FormSkeleton /></div>;
  return <TrialRun form={form} payload={payload} {...rest} />;
}

function TrialRun({ form, payload, ...rest }) {
  const trial = useTrial(form, payload);
  return (
    <FormAuthContext.Provider value={trial.authValue}>
      <GuestUploadContext.Provider value={null}>
        <NoticeDockPlacement.Provider value="contained">
          <SheetContent trial={trial} {...rest} />
        </NoticeDockPlacement.Provider>
      </GuestUploadContext.Provider>
    </FormAuthContext.Provider>
  );
}

function SheetContent({ trial, acts, scrollRef, openedAt, delay }) {
  const ref = useRef(null);
  const shownRef = useRef(null);
  const finished = trial.finished;
  useFollowReveal(scrollRef, ref, trial.visibleFields);

  useLayoutEffect(() => {
    if (shownRef.current === finished) return;
    const first = shownRef.current === null;
    shownRef.current = finished;
    if (!first) {
      scrollRef.current?.scrollTo({ top: 0 });
      return;
    }
    if (reduced()) return;
    const late = performance.now() - openedAt;
    cascade(ref.current.querySelectorAll("[data-cascade]"), { delay: Math.max(0, delay - late) });
  }, [finished, delay, openedAt, scrollRef]);

  return (
    <>
      <div ref={ref} className={finished ? "tl-sheet-done" : "flex flex-col gap-6"}>
        {finished ? <TrialDone trial={trial} /> : (
          <>
            <div data-cascade="">
              <FormDisplayerHeader title={trial.state.form?.title ?? ""} description={trial.state.form?.description ?? ""}>
                <AnimatePresence initial={false}>
                  <IdentityNote key="identity" />
                </AnimatePresence>
              </FormDisplayerHeader>
            </div>
            <TrialFields trial={trial} />
            <TrialNotice trial={trial} />
          </>
        )}
      </div>
      {acts && createPortal(<StripActs trial={trial} />, acts)}
    </>
  );
}

function TrialFields({ trial }) {
  const { visibleFields, values, numbers, state, handleValueChange, handleUploadStateChange } = trial;
  const asksIdentity = useMemo(() => hasEventIdentity(visibleFields), [visibleFields]);
  return (
    <div className="flex flex-col">
      <AnimatePresence mode="sync" initial={false}>
        {visibleFields.map((field, index) => {
          const Display = REGISTRY[field.type]?.Display;
          if (!Display) return null;
          const isSeparator = field.type === "separator";
          const isLast = index === visibleFields.length - 1;
          return (
            <motion.div key={field.id} id={field.id} data-field={field.id} layout="position"
              transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
              initial={{ opacity: 0, height: 0, scale: 0.97 }}
              animate={{ opacity: 1, height: "auto", scale: 1, transition: { duration: 0.35, ease: "easeOut", height: { duration: 0.3 }, opacity: { duration: 0.25, delay: 0.1 } } }}
              exit={{ opacity: 0, height: 0, scale: 0.97, transition: { duration: 0.25, ease: "easeIn", height: { duration: 0.3, delay: 0.05 }, opacity: { duration: 0.15 } } }}
              onAnimationStart={() => document.getElementById(field.id)?.style.setProperty("overflow", "hidden")}
              onAnimationComplete={() => document.getElementById(field.id)?.style.setProperty("overflow", "visible")}
              style={{ zIndex: visibleFields.length - index }}
              className={`relative ${isLast || isSeparator ? "" : "border-b border-white/5 pb-6"}`}
            >
              <div data-cascade="">
                <Display {...field.props} questionNumber={isSeparator ? null : numbers.get(field.id)} value={values[field.id]}
                  onChange={(e) => handleValueChange(field.id, e.target.value, e.isDefault)} missing={state.missingFieldIds.includes(field.id)}
                  disableAutoFill={asksIdentity}
                  onUploadStateChange={(busy) => handleUploadStateChange(field.id, busy)}
                  {...(field.type === "file" ? { fieldId: field.id, fileProblem: state.fileProblems[field.id] } : {})}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

function TrialNotice({ trial }) {
  let notice = null;
  if (trial.guestNotice) {
    const copy = guestNoticeCopy(trial.guestNotice, trial.numbers, trial.turnstileBlocked);
    notice = (
      <GuestNoticeDock key={`guest-${trial.guestNotice.kind}`} notice={copy} onClose={trial.clearGuestNotice} onJump={jumpTo}
        onRetry={copy.retry ? () => trial.submit() : null}
      />
    );
  } else if (trial.state.errorMessage) {
    notice = (
      <NoticeDock key="error" icon={CircleAlert} tone="text-red-300" role="alert" duration={WARNING_SECONDS} onClose={trial.clearError}>
        {trial.state.errorMessage}
      </NoticeDock>
    );
  } else if (trial.missingOpen) {
    notice = (
      <NoticeDock key="missing" icon={CircleAlert} tone="text-red-300" role="alert" duration={WARNING_SECONDS} onClose={trial.dismissMissing}>
        <MissingFields fields={trial.missingFields} onJump={jumpTo} />
      </NoticeDock>
    );
  }
  return <AnimatePresence mode="wait">{notice}</AnimatePresence>;
}

function SubmitButton({ trial }) {
  const busy = trial.isSubmitting || trial.isAnyFileUploading;
  return (
    <motion.button type="button" data-slot="submit" onClick={() => trial.submit()} disabled={busy} layout transition={{ type: "spring", stiffness: 400, damping: 17 }}
      className={`relative inline-flex min-w-30 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl border-[1.5px] px-8 py-3 text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 ${busy ? "border-neutral-200/50 bg-neutral-400/40 text-neutral-400" : "border-skylab-300/50 bg-skylab-400/40 hover:bg-pink-200/60"}`}
    >
      {busy ? (
        <>
          <Loader2 className="animate-spin" size={16} />
          <span>{trial.isSubmitting ? "Gönderiliyor" : "Dosya yükleniyor"}</span>
        </>
      ) : "Gönder"}
    </motion.button>
  );
}

function StripActs({ trial }) {
  return (
    <AnimatePresence initial={false}>
      {!trial.finished && (
        <motion.div key="acts" className="tl-sheet-acts" exit={{ opacity: 0, y: 6, transition: { duration: 0.2, ease: "easeIn" } }}>
          <SubmitButton trial={trial} />
          <div className="tl-sheet-who">
            <RespondentLine savedAt={null} compact />
            {trial.isGuest && trial.copyEmail && <CopyEmailNote email={trial.copyEmail} className="mt-1" />}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TrialDone({ trial }) {
  const s = trial.state;
  return (
    <StatusScreen state={s.submissionState} message={s.submissionMessage} stage={s.stage} startFormId={s.startFormId} workflow={s.workflow}
      formTitle={s.form?.title ?? ""} submittedAt={s.submittedAt} isWorkflow={s.isWorkflow} isAuthed={trial.isAuthed}
    />
  );
}
