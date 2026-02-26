"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import { REGISTRY } from "@/app/components/form-registry";
import { FormDisplayerHeader, FormRespondentBadge } from "./components/FormDisplayerComponents";
import { FormResponseStatus } from "./components/FormResponseStatus";
import { useSubmitFormMutation } from "@/lib/hooks/useForm";
import { FormStatusDisplayer } from "../FormStatusHandler";
import Background from "../Background";
import { getVisibleFields } from "./components/conditionChecker";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  exit: { opacity: 0, transition: { staggerChildren: 0.05, staggerDirection: -1, when: "afterChildren" } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.3, ease: "easeIn" } }
};

export default function FormDisplayer({ form, step }) {
  const schema = Array.isArray(form?.schema) ? form.schema : [];
  const title = form?.title ?? "";
  const description = form?.description ?? "";
  const isAnonymous = form?.allowAnonymousResponses === true;
  const hasSchema = schema.length > 0;

  const submitMutation = useSubmitFormMutation();

  const [formValues, setFormValues] = useState({});
  const [submissionState, setSubmissionState] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [missingFieldIds, setMissingFieldIds] = useState([]);
  const [uploadingFields, setUploadingFields] = useState({});
  const missingTimeoutRef = useRef(null);

  const startTimeRef = useRef(null);

  useEffect(() => {
    startTimeRef.current = Date.now();
  }, []);

  const visibleFields = useMemo(() => {
    return getVisibleFields(schema, formValues);
  }, [schema, formValues]);

  const handleValueChange = (fieldId, value) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleUploadStateChange = (fieldId, isUploading) => {
    setUploadingFields((prev) => ({ ...prev, [fieldId]: isUploading }));
  };

  const isAnyFileUploading = Object.values(uploadingFields).some((status) => status === true);

  const handleSubmit = () => {
    setErrorMessage(null);

    setTimeout(() => {
      const missingFields = [];

      visibleFields.forEach((field) => {
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
        setErrorMessage("Eksik alanları doldurunuz!");

        if (missingTimeoutRef.current) {
          clearTimeout(missingTimeoutRef.current);
        }
        setMissingFieldIds(missingFields);
        missingTimeoutRef.current = setTimeout(() => {
          setMissingFieldIds([]);
          missingTimeoutRef.current = null;
        }, 2000);

        setTimeout(() => {
          const firstMissingId = missingFields[0];
          const element = document.getElementById(firstMissingId);
          if (element) element.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
        }, 150);

        setTimeout(() => {
          setErrorMessage(null);
        }, 2000);
        return;
      }

      if (missingTimeoutRef.current) {
        clearTimeout(missingTimeoutRef.current);
        missingTimeoutRef.current = null;
      }
      setMissingFieldIds([]);

      const formattedResponses = visibleFields.map((field) => {
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

      const timeSpentInSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const payload = { formId: form.id, responses: formattedResponses, timeSpent: timeSpentInSeconds };

      submitMutation.mutate(payload, {
        onSuccess: (response) => {
          if (response?.status === 10) {
            setSubmissionState("pending");
            setSubmissionStatus(10);
          } else {
            setSubmissionState("completed");
          }
        },
        onError: () => {
          setErrorMessage("Bir hata oluştu.");
          setTimeout(() => {
            setErrorMessage(null);
          }, 2000);
        },
      });
    }, 100);
  };

  const isFinished = submissionState !== null;

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

      <div className={`relative z-10 flex min-h-full w-full flex-col items-center ${isFinished ? "justify-start" : "justify-center pt-12 pb-8 px-4 sm:px-6"}`}>

        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div key="form-wrapper" className="w-full max-w-2xl flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <motion.div className="w-full mb-3"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <FormRespondentBadge />
              </motion.div>

            <div className="w-full rounded-3xl border border-white/10 bg-black/20 shadow-2xl">
              <motion.div className="flex flex-col gap-6 p-6 sm:p-10" variants={containerVariants} initial="hidden" animate="show" exit="exit">

                <motion.div variants={itemVariants}>
                  <FormResponseStatus step={step} />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormDisplayerHeader title={title} description={description} />
                </motion.div>

                {hasSchema ? (
                  <>
                    <AnimatePresence mode="sync" initial={false}>
                      {visibleFields.map((field, index) => {
                        const entry = REGISTRY[field.type];
                        const DisplayComponent = entry?.Display;
                        if (!DisplayComponent) return null;

                        const isLast = index === visibleFields.length - 1;
                        const isMissing = missingFieldIds.includes(field.id);

                        return (
                          <motion.div key={field.id} id={field.id}
                            layout="position"
                            transition={{ layout: { type: "spring", stiffness: 300, damping: 30 } }}
                            initial={{ opacity: 0, height: 0, scale: 0.97 }}
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
                            className={`relative ${isLast ? "" : "border-b border-white/5 pb-6"}`}
                          >
                            <DisplayComponent {...field.props} questionNumber={index + 1} value={formValues[field.id]}
                              onChange={(e) => handleValueChange(field.id, e.target.value)} missing={isMissing}
                              onUploadStateChange={(isUploading) => handleUploadStateChange(field.id, isUploading)}
                            />
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    <motion.div variants={itemVariants} className="mt-6 flex justify-end">
                      <motion.button onClick={handleSubmit} disabled={submitMutation.isPending || errorMessage || isAnyFileUploading} layout transition={{ type: "spring", stiffness: 400, damping: 17 }}
                        className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 min-w-30 text-sm border-[1.5px] font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none
                        ${errorMessage ? "bg-red-900/20 border-red-800/50 hover:bg-red-900/30 text-red-200" : submitMutation.isPending ? "bg-neutral-400/40 border-neutral-200/50 text-neutral-400" : "bg-pink-300/30 border-pink-200/40 hover:bg-pink-200/60"}`}
                      >
                        {errorMessage ? (errorMessage) : submitMutation.isPending ? (<Loader2 className="animate-spin" size={16} />) : ("Yanıtları Gönder")}
                      </motion.button>
                    </motion.div>
                  </>
                ) : (
                  <motion.div variants={itemVariants} className="flex min-h-[30vh] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 text-sm text-neutral-400">
                    Bu formda gösterilecek soru yok.
                  </motion.div>
                )}
              </motion.div>
            </div>
            </motion.div>
          ) : (
            <motion.div key="success-screen" className="w-full"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            >
              <FormStatusDisplayer state={submissionState} step={step} status={submissionStatus} />
            </motion.div>
          )}
        </AnimatePresence>

        {!isFinished && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-12 mb-8 flex flex-col items-center gap-4 text-xs font-medium text-neutral-500"
          >
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-2">
                <a href="https://skylab.yildiz.edu.tr" target="_blank" rel="noopener noreferrer"
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
        )}
      </div>
    </div>
  );
}