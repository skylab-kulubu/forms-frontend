"use client";

import { useRef, useState } from "react";
import { REGISTRY } from "@/app/components/form-registry";
import { FormDisplayerHeader } from "./components/FormDisplayerComponents";
import { FormResponseStatus } from "./components/FormResponseStatus";
import { useSubmitFormMutation } from "@/lib/hooks/useForm";
import { StateCard } from "../FormStatusHandler";
import Background from "../Background";
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
  const hasSchema = schema.length > 0;

  const submitMutation = useSubmitFormMutation();

  const [formValues, setFormValues] = useState({});
  const [submissionState, setSubmissionState] = useState(null);
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [missingFieldIds, setMissingFieldIds] = useState([]);
  const missingTimeoutRef = useRef(null);

  const handleValueChange = (fieldId, value) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = () => {
    setErrorMessage(null);

    setTimeout(() => {
      const missingFields = [];
      schema.forEach((field) => {
        if (field.props?.required) {
          const val = formValues[field.id];
          let isEmpty = val === undefined || val === null;
          if (!isEmpty) {
            if (typeof val === "string") isEmpty = val.trim() === "";
            else if (Array.isArray(val)) isEmpty = val.length === 0;
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

      const formattedResponses = schema.map((field) => {
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
            if (rawValue instanceof File) finalAnswer = rawValue.name;
            else finalAnswer = "";
            break;
          
          default:
            if (Array.isArray(rawValue)) finalAnswer = rawValue.join(", ");
            else finalAnswer = String(rawValue);
            break;
        }
        return { id: field.id, question: field.props?.question || "", answer: finalAnswer };
      });

      const payload = { formId: form.id, responses: formattedResponses };

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
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }}
          >
            <Background />
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`relative z-10 flex min-h-full w-full flex-col items-center ${isFinished ? "justify-start" : "justify-center py-12 px-4 sm:px-6"}`}>

        <AnimatePresence mode="wait">
          {!isFinished ? (
            <motion.div key="form-card" className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            >
              <motion.div className="flex flex-col gap-6 p-6 sm:p-10" variants={containerVariants} initial="hidden" animate="show" exit="exit">

                <motion.div variants={itemVariants}>
                  <FormResponseStatus step={step} />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <FormDisplayerHeader title={title} description={description} />
                </motion.div>

                {hasSchema ? (
                  <>
                    {schema.map((field, index) => {
                      const entry = REGISTRY[field.type];
                      const DisplayComponent = entry?.Display;
                      if (!DisplayComponent) return null;

                      const isLast = index === schema.length - 1;
                      const isMissing = missingFieldIds.includes(field.id);

                      return (
                        <motion.div key={field.id} id={field.id} variants={itemVariants} style={{ zIndex: schema.length - index }}
                          className={`relative ${isLast ? "" : "border-b border-white/5 pb-6"}`}
                        >
                          <DisplayComponent {...field.props} questionNumber={index + 1} value={formValues[field.id]} onChange={(e) => handleValueChange(field.id, e.target.value)} missing={isMissing} />
                        </motion.div>
                      );
                    })}

                    <motion.div variants={itemVariants} className="mt-6 flex justify-end">
                      <motion.button onClick={handleSubmit} disabled={submitMutation.isPending || errorMessage} layout transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
            </motion.div>
          ) : (
            <motion.div key="success-screen" className="w-full"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            >
              <StateCard state={submissionState} step={step} status={submissionStatus} />
            </motion.div>
          )}
        </AnimatePresence>

        {!isFinished && (
          <div className="mt-8 text-xs text-neutral-500 font-medium">
            footer gelcek
          </div>
        )}

      </div>
    </div>
  );
}
