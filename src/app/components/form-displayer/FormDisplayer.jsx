"use client";

import { REGISTRY } from "@/app/components/form-registry";
import { FormDisplayerHeader, FormRespondentBadge } from "./components/FormDisplayerComponents";
import { FormResponseStatus } from "./components/FormResponseStatus";
import { useFormDisplayer } from "./hooks/useFormDisplayer";
import { FormStatusDisplayer } from "../FormStatusHandler";
import Background from "../Background";
import { Loader2, Clock } from "lucide-react";
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

function formatSavedAt(date) {
  if (!date) return null;
  return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

function DraftPrompt({ savedAt, onDiscard, isDiscarding }) {
  const formattedTime = savedAt ? new Date(savedAt).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) : null;

  return (
    <motion.div className="overflow-hidden"
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/3 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-neutral-400">
          <span className="text-neutral-300 font-medium">Taslağınız yüklendi</span>
          {formattedTime && (
            <span className="text-neutral-600">&middot; {formattedTime}</span>
          )}
        </div>
        <button type="button" onClick={onDiscard} disabled={isDiscarding}
          className="shrink-0 rounded-lg border border-white/10 px-3 py-1 text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-200 hover:border-white/20 disabled:opacity-50"
        >
          {isDiscarding ? <Loader2 size={12} className="animate-spin" /> : "Sıfırla"}
        </button>
      </div>
    </motion.div>
  );
}

export default function FormDisplayer({ form, step, draft = null }) {
  const {
    state, schema, visibleFields,
    isAuthed, isDiscarding, isAnyFileUploading, isSubmitting, lastSavedAt,
    handleValueChange, handleUploadStateChange, handleDiscardDraft, handleSubmit, showMissingFields,
  } = useFormDisplayer(form, step, draft);

  const { form: activeForm, step: activeStep, values: formValues, submissionState, submissionStatus, errorMessage, missingFieldIds, draftPromptVisible } = state;

  const title = activeForm?.title ?? "";
  const description = activeForm?.description ?? "";
  const hasSchema = schema.length > 0;
  const isFinished = submissionState !== null;

  const onSubmit = () => {
    setTimeout(() => {
      const missingFields = [];

      visibleFields.forEach((field) => {
        if (field.type === "separator") return;
        if (field.props?.required) {
          const val = formValues[field.id];
          let isEmpty = val === undefined || val === null;
          if (!isEmpty) {
            if (field.type === "toggle") isEmpty = val !== true;
            else if (typeof val === "string") isEmpty = val.trim() === "";
            else if (Array.isArray(val)) isEmpty = val.length === 0;
            else if (field.type === "matrix" && typeof val === "object") {
              const requiredRowsCount = field.props.rows?.length || 0;
              const answeredRowsCount = Object.keys(val).length;
              isEmpty = answeredRowsCount < requiredRowsCount;
            }
          }
          if (isEmpty) missingFields.push(field.id);
        }
      });

      if (missingFields.length > 0) {
        showMissingFields(missingFields);
        setTimeout(() => {
          const element = document.getElementById(missingFields[0]);
          if (element) element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }, 150);
        return;
      }

      const formattedResponses = visibleFields.filter((field) => field.type !== "separator").map((field) => {
        let rawValue = formValues[field.id];
        if (rawValue === undefined || rawValue === null) rawValue = "";
        let finalAnswer = "";

        switch (field.type) {
          case "multi_choice":
            if (Array.isArray(rawValue) && field.props?.choices) {
              const choices = field.props.choices;
              finalAnswer = rawValue.map((idx) => {
                const numericIdx = Number(idx);
                if (!isNaN(numericIdx) && choices[numericIdx]) return choices[numericIdx];
                return idx;
              }).join(", ");
            }
            else finalAnswer = Array.isArray(rawValue) ? rawValue.join(", ") : String(rawValue);
            break;

          case "combobox":
            if (field.props?.choices) {
              const numericIdx = Number(rawValue);
              if (rawValue !== "" && !isNaN(numericIdx) && field.props.choices[numericIdx]) finalAnswer = field.props.choices[numericIdx];
              else finalAnswer = String(rawValue);
            }
            else finalAnswer = String(rawValue);
            break;

          case "file":
            finalAnswer = rawValue ? String(rawValue) : "";
            break;

          case "toggle":
            if (rawValue === true) {
              finalAnswer = field.props?.trueLabel || "Evet";
            } else {
              finalAnswer = field.props?.falseLabel || "Hayır";
            }
            break;

          case "matrix":
            if (typeof rawValue === "object" && rawValue !== null) finalAnswer = JSON.stringify(rawValue);
            else finalAnswer = String(rawValue);
            break;

          default:
            if (Array.isArray(rawValue)) finalAnswer = rawValue.join(", ");
            else finalAnswer = String(rawValue);
            break;
        }
        return { id: field.id, type: field.type, question: field.props?.question || "", answer: finalAnswer };
      });

      handleSubmit(formattedResponses);
    }, 100);
  };

  return (
    <div className="relative h-screen w-full font-sans text-neutral-200 overflow-y-auto scrollbar">

      <AnimatePresence>
        {!isFinished && (
          <motion.div key="background-layer" className="fixed inset-0 z-0 pointer-events-none"
            initial={{ opacity: 0 }} animate={{ opacity: 0.7 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }}
          >
            <Background />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex min-h-full w-full flex-col items-center px-4 sm:px-6">

        <div className="w-full max-w-2xl shrink-0 mt-8 mb-4">
          <FormResponseStatus step={activeStep} status={submissionStatus} />
        </div>

        <div className="flex-1 w-full flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div key="form-wrapper" className="w-full max-w-2xl flex flex-1 flex-col items-center"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <motion.div className="w-full mb-3"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <FormRespondentBadge />
              </motion.div>

            <div className="w-full flex-1 flex flex-col rounded-3xl border border-white/10 bg-black/20 shadow-2xl">
              <motion.div className="flex flex-1 flex-col gap-6 p-6 sm:p-10" variants={containerVariants} initial="hidden" animate="show" exit="exit">

                <motion.div variants={itemVariants}>
                  <FormDisplayerHeader title={title} description={description} />
                </motion.div>

                <AnimatePresence>
                  {draftPromptVisible && (
                    <DraftPrompt savedAt={draft?.savedAt} onDiscard={handleDiscardDraft} isDiscarding={isDiscarding}/>
                  )}
                </AnimatePresence>

                {hasSchema ? (
                  <>
                    <div className="flex-1 flex flex-col justify-center">
                    <AnimatePresence mode="sync" initial={false}>
                      {(() => {
                        let questionCounter = 0;
                        return visibleFields.map((field, index) => {
                          const entry = REGISTRY[field.type];
                          const DisplayComponent = entry?.Display;
                          if (!DisplayComponent) return null;

                          const isSeparator = field.type === "separator";
                          if (!isSeparator) questionCounter++;

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
                              <DisplayComponent {...field.props} questionNumber={isSeparator ? null : questionCounter} value={formValues[field.id]}
                                onChange={(e) => handleValueChange(field.id, e.target.value)} missing={isMissing}
                                onUploadStateChange={(isUploading) => handleUploadStateChange(field.id, isUploading)}
                              />
                            </motion.div>
                          );
                        });
                      })()}
                    </AnimatePresence>
                    </div>

                    <motion.div variants={itemVariants} className="mt-auto flex flex-col items-end gap-2">
                      <motion.button onClick={onSubmit} disabled={isSubmitting || errorMessage || isAnyFileUploading} layout transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 min-w-30 text-sm border-[1.5px] font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none
                        ${errorMessage ? "bg-red-900/20 border-red-800/50 hover:bg-red-900/30 text-red-200" : isSubmitting ? "bg-neutral-400/40 border-neutral-200/50 text-neutral-400" : "bg-pink-300/30 border-pink-200/40 hover:bg-pink-200/60"}`}
                      >
                        {errorMessage ? (errorMessage) : isSubmitting ? (<Loader2 className="animate-spin" size={16} />) : ("Yanıtları Gönder")}
                      </motion.button>
                      {isAuthed && (
                        <p className={`flex items-center gap-1 text-[10px] mr-1 transition-opacity duration-300 ${lastSavedAt ? "text-neutral-500 opacity-100" : "opacity-0 pointer-events-none"}`}>
                          <Clock size={10} className="shrink-0" />
                          {lastSavedAt ? <>Taslak kaydedildi &middot; {formatSavedAt(lastSavedAt)}</> : "\u00A0"}
                        </p>
                      )}
                    </motion.div>
                  </>
                ) : (
                  <motion.div variants={itemVariants} className="flex flex-1 min-h-[30vh] items-center justify-center text-sm text-neutral-400">
                    Bu formda gösterilecek soru yok.
                  </motion.div>
                )}
              </motion.div>
            </div>
            </motion.div>
          ) : (
            <motion.div key="success-screen" className="w-full flex-1 flex flex-col"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            >
              <FormStatusDisplayer state={submissionState} step={activeStep} />
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
          className={`shrink-0 mt-12 mb-8 flex flex-col items-center gap-4 text-xs font-medium text-neutral-500 ${isFinished ? "invisible" : ""}`}
          aria-hidden={isFinished || undefined}
        >
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2">
              <a href="https://forms.yildizskylab.com" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 opacity-80 transition-opacity hover:opacity-100"
              >
                <img src="/skylab.svg" alt="Skylab Logo" className="h-5 w-5 object-contain mt-1 transition-all" />
                <span className="text-[14px] font-semibold uppercase tracking-wide text-[#efe3fe]">SKY LAB Forms</span>
              </a>
              <span className="text-neutral-600">by WEBLAB</span>
            </div>

            <a href="https://github.com/fatiihnaz" target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-neutral-600/50 hover:text-neutral-400 -mt-1 transition-colors">
              Developed by Fatih Naz
            </a>
          </div>

          <div className="flex items-center gap-3 md:gap-4 text-[11px]">
            <a href="https://skyl.app/kvkk-metni" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-neutral-300">
              Kullanım Koşulları
            </a>
            <span className="h-1 w-1 rounded-full bg-neutral-700"></span>
            <a href="https://skyl.app/kvkk-metni" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-neutral-300">
              Gizlilik Politikası
            </a>
            <span className="h-1 w-1 rounded-full bg-neutral-700"></span>
            <a href="mailto:info@yildizskylab.com?subject=Skylab%20Forms%20-%20Sorun%20Bildirimi" className="transition-colors hover:text-[#efe3fe]">
              Sorun Bildir
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}