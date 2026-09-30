"use client";

import { useEffect, useMemo, useRef } from "react";
import { REGISTRY } from "@/app/components/form-registry";
import { formatFieldAnswer } from "@/app/components/form-answer-format";
import { serializeRepeater } from "@/app/components/form-components/FormRepeater";
import { markIntroSeen, nextStepCopy } from "@/lib/workflow-journey";
import { DraftNotice, FormDisplayerHeader, MissingNotice, NextStepNote, RespondentLine } from "./components/FormDisplayerComponents";
import WorkflowProgress from "./components/WorkflowProgress";
import StepIntro from "./components/StepIntro";
import StatusScreen from "./components/StatusScreen";
import { isFieldMissing, useFormDisplayer } from "./hooks/useFormDisplayer";
import Background from "../Background";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
  exit: { opacity: 0, transition: { staggerChildren: 0.05, staggerDirection: -1, when: "afterChildren" } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } }
};

function hasValue(field, value) {
  if (field.type === "toggle") return value === true;
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function PageFooter() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
      className="shrink-0 mt-12 mb-8 pb-[env(safe-area-inset-bottom)] flex flex-col items-center gap-4 text-xs font-medium text-neutral-500"
    >
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <a href={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 opacity-80 transition-opacity hover:opacity-100"
          >
            <img src="/skylab.svg" alt="Skylab Logo" className="h-5 w-5 object-contain mt-1 transition-all" />
            <span className="text-sm font-semibold uppercase tracking-wide text-skylab-400">SKY LAB Forms</span>
          </a>
          <span className="text-neutral-600">by WEBLAB</span>
        </div>

        <a href="https://github.com/fatiihnaz" target="_blank" rel="noopener noreferrer"
          className="text-3xs text-neutral-300/50 hover:text-skylab-500 -mt-1 transition-colors">
          Developed by Fatih Naz
        </a>
      </div>

      <div className="flex items-center gap-3 md:gap-4 text-2xs">
        <a href="https://skyl.app/kvkk-metni" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-neutral-300">
          Kullanım Koşulları
        </a>
        <span className="h-1 w-1 rounded-full bg-neutral-700"></span>
        <a href="https://skyl.app/kvkk-metni" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-neutral-300">
          Gizlilik Politikası
        </a>
        <span className="h-1 w-1 rounded-full bg-neutral-700"></span>
        <a href="mailto:info@yildizskylab.com?subject=Skylab%20Forms%20-%20Sorun%20Bildirimi" className="transition-colors hover:text-skylab-400">
          Sorun Bildir
        </a>
      </div>
    </motion.div>
  );
}

export default function FormDisplayer({ form, stage = 0, isWorkflow = false, startFormId = null, draft = null, journey = null, instanceId = null }) {
  const scrollRef = useRef(null);
  const {
    state, schema, visibleFields,
    isAuthed, isAnyFileUploading, isSubmitting, lastSavedAt,
    handleValueChange, handleUploadStateChange, handleDiscardDraft, handleSubmit, showMissingFields, endIntro,
  } = useFormDisplayer(form, draft, { stage, isWorkflow, startFormId, journey, instanceId });

  const { form: activeForm, stage: activeStage, isWorkflow: activeIsWorkflow, startFormId: activeStartFormId, workflow: activeJourney,
    instanceId: activeInstanceId, intro, values: formValues, submissionState, submissionMessage, submittedAt, errorMessage, missingFieldIds,
    draftPromptVisible } = state;

  const title = activeForm?.title ?? "";
  const description = activeForm?.description ?? "";
  const activeFormId = activeForm?.id ?? null;
  const hasSchema = schema.length > 0;
  const isFinished = submissionState !== null;
  const showIntro = Boolean(intro) && !isFinished;

  const questionNumbers = useMemo(() => {
    const numbers = new Map();
    let counter = 0;
    visibleFields.forEach((field) => {
      if (field.type !== "separator") numbers.set(field.id, ++counter);
    });
    return numbers;
  }, [visibleFields]);

  const requiredFill = useMemo(() => {
    const questions = visibleFields.filter((field) => field.type !== "separator");
    const required = questions.filter((field) => field.props?.required);
    const pool = required.length ? required : questions;
    if (!pool.length) return 100;
    const done = pool.filter((field) => (required.length ? !isFieldMissing(field, formValues[field.id]) : hasValue(field, formValues[field.id]))).length;
    return Math.max(6, (done / pool.length) * 100);
  }, [visibleFields, formValues]);

  const missingFields = missingFieldIds
    .filter((id) => questionNumbers.has(id))
    .map((id) => ({ id, number: questionNumbers.get(id) }))
    .sort((a, b) => a.number - b.number);

  const nextCopy = nextStepCopy({
    workflow: activeJourney,
    isWorkflow: activeIsWorkflow,
    requiresManualReview: Boolean(activeForm?.requiresManualReview),
    isAuthed,
  });

  useEffect(() => {
    if (showIntro && activeFormId) markIntroSeen(activeFormId, activeInstanceId);
  }, [showIntro, activeFormId, activeInstanceId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [activeFormId, showIntro]);

  const jumpToField = (fieldId) => {
    const element = document.getElementById(fieldId);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  };

  const onSubmit = () => {
    setTimeout(() => {
      const missing = visibleFields.filter((field) => isFieldMissing(field, formValues[field.id])).map((field) => field.id);

      if (missing.length > 0) {
        showMissingFields(missing);
        setTimeout(() => jumpToField(missing[0]), 150);
        return;
      }

      const formattedResponses = visibleFields.filter((field) => field.type !== "separator").map((field) => {
        const rawValue = formValues[field.id];
        const finalAnswer = field.type === "repeater"
          ? serializeRepeater(field.props?.fields, rawValue)
          : formatFieldAnswer(field, rawValue);
        return { id: field.id, type: field.type, question: field.props?.question || "", answer: finalAnswer };
      });

      handleSubmit(formattedResponses);
    }, 100);
  };

  return (
    <div ref={scrollRef} className="relative h-dvh w-full font-sans text-neutral-200 overflow-y-auto scrollbar">

      <AnimatePresence>
        {!isFinished && (
          <motion.div key="background-layer" className="fixed inset-0 z-0 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }}
          >
            <Background />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {showIntro ? (
          <StepIntro key={`intro-${activeFormId}`} workflow={activeJourney} stage={activeStage} formTitle={title}
            arrivedTitle={intro.arrivedTitle} onDone={endIntro}
          />
        ) : isFinished ? (
          <StatusScreen key="status" state={submissionState} message={submissionMessage} stage={activeStage} startFormId={activeStartFormId}
            workflow={activeJourney} formTitle={title} submittedAt={submittedAt} isWorkflow={activeIsWorkflow} isAuthed={isAuthed}
          />
        ) : (
          <motion.div key={`form-${activeFormId}`} className="relative z-10 flex min-h-full w-full flex-col items-center px-4 sm:px-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div className="h-12 w-full shrink-0" />

            <div className="w-full max-w-2xl flex flex-1 flex-col rounded-3xl border border-white/10 bg-white/3 shadow-2xl">
              <motion.div className="flex flex-1 flex-col gap-6 p-6 sm:p-10" variants={containerVariants} initial="hidden" animate="show" exit="exit">

                {activeIsWorkflow && (
                  <WorkflowProgress workflow={activeJourney} stage={activeStage} formTitle={title} fill={requiredFill}
                    zIndex={visibleFields.length + 10}
                  />
                )}

                <motion.div variants={itemVariants}>
                  <FormDisplayerHeader title={title} description={description}>
                    <AnimatePresence>
                      {draftPromptVisible && (
                        <DraftNotice savedAt={draft?.savedAt} onDiscard={handleDiscardDraft} />
                      )}
                    </AnimatePresence>
                  </FormDisplayerHeader>
                </motion.div>

                {hasSchema ? (
                  <>
                    <div className="flex-1 flex flex-col justify-center">
                    <AnimatePresence mode="sync" initial={false}>
                      {visibleFields.map((field, index) => {
                        const entry = REGISTRY[field.type];
                        const DisplayComponent = entry?.Display;
                        if (!DisplayComponent) return null;

                        const isSeparator = field.type === "separator";
                        const isLast = index === visibleFields.length - 1;
                        const isMissing = missingFieldIds.includes(field.id);

                        return (
                          <motion.div key={field.id} id={field.id} layout="position"
                            transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }} initial={{ opacity: 0, height: 0, scale: 0.97 }}
                            animate={{
                              opacity: 1, height: "auto", scale: 1,
                              transition: { duration: 0.35, ease: "easeOut", height: { duration: 0.3 }, opacity: { duration: 0.25, delay: 0.1 } }
                            }}
                            exit={{
                              opacity: 0, height: 0, scale: 0.97,
                              transition: { duration: 0.25, ease: "easeIn", height: { duration: 0.3, delay: 0.05 }, opacity: { duration: 0.15 } }
                            }}
                            onAnimationStart={() => {
                              const el = document.getElementById(field.id);
                              if (el) el.style.overflow = "hidden";
                            }}
                            onAnimationComplete={() => {
                              const el = document.getElementById(field.id);
                              if (el) el.style.overflow = "visible";
                            }}
                            style={{ zIndex: visibleFields.length - index }}
                            className={`relative ${isLast || isSeparator ? "" : "border-b border-white/5 pb-6"}`}
                          >
                            <DisplayComponent {...field.props} questionNumber={isSeparator ? null : questionNumbers.get(field.id)} value={formValues[field.id]}
                              onChange={(e) => handleValueChange(field.id, e.target.value, e.isDefault)} missing={isMissing}
                              disableAutoFill={Boolean(field.props?.identity || activeForm?.eventId)}
                              onUploadStateChange={(isUploading) => handleUploadStateChange(field.id, isUploading)}
                            />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    </div>

                    <motion.div variants={itemVariants} className="mt-auto border-t border-white/5 px-2 pt-6 md:px-4">
                      <MissingNotice fields={missingFields} onJump={jumpToField} />
                      <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                        <NextStepNote text={nextCopy} />
                        <motion.button onClick={onSubmit} disabled={isSubmitting || errorMessage || isAnyFileUploading} layout transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 min-w-30 text-sm border-[1.5px] font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none sm:ml-auto sm:shrink-0
                          ${errorMessage ? "bg-red-900/20 border-red-800/50 hover:bg-red-900/30 text-red-200" : isSubmitting ? "bg-neutral-400/40 border-neutral-200/50 text-neutral-400" : "bg-skylab-400/40 border-skylab-300/50 hover:bg-pink-200/60"}`}
                        >
                          {errorMessage ? errorMessage : isSubmitting ? (
                            <>
                              <Loader2 className="animate-spin" size={16} />
                              <span>Gönderiliyor</span>
                            </>
                          ) : "Gönder"}
                        </motion.button>
                      </div>
                      <RespondentLine savedAt={isAuthed ? lastSavedAt : null} />
                    </motion.div>
                  </>
                ) : (
                  <motion.div variants={itemVariants} className="flex flex-1 min-h-[30vh] items-center justify-center text-sm text-neutral-400">
                    Bu formda gösterilecek soru yok.
                  </motion.div>
                )}
              </motion.div>
            </div>

            <PageFooter />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
