"use client";

import { useState } from "react";
import { REGISTRY } from "@/app/components/form-registry";
import { FormDisplayerHeader } from "./components/FormDisplayerComponents";
import { FormResponseStatus } from "./components/FormResponseStatus";
import { useSubmitFormMutation } from "@/lib/hooks/useForm";
import { StateCard } from "../FormStatusHandler";
import Background from "../Background";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function mapPropsForDisplay(type, props = {}) {
  if (type === "combobox" || type === "multi_choice") {
    return { ...props, options: props.options ?? props.choices ?? [] };
  }
  if (type === "file") {
    return { ...props, accept: props.accept ?? props.acceptedFiles ?? "", maxSizeMB: props.maxSizeMB ?? props.maxSize ?? 0 };
  }
  return props;
}

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
          const isEmpty = val === undefined || val === null || (typeof val === "string" && val.trim() === "") || (Array.isArray(val) && val.length === 0);
          if (isEmpty) missingFields.push(field.id);
        }
      });

      if (missingFields.length > 0) {
        setErrorMessage("Eksik alanları doldurunuz!");
        return;
      }

      const formattedResponses = schema.map((field) => {
        let rawValue = formValues[field.id];
        if (rawValue === undefined || rawValue === null) rawValue = "";
        const finalAnswer = Array.isArray(rawValue) ? rawValue.join(", ") : String(rawValue);
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
        onError: () => setErrorMessage("Bir hata oluştu."),
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

                      const displayProps = { ...mapPropsForDisplay(field.type, field.props ?? {}), questionNumber: index + 1 };
                      
                      const isLast = index === schema.length - 1;

                      return (
                        <motion.div key={field.id} variants={itemVariants} style={{ zIndex: schema.length - index }}
                          className={`relative ${isLast ? "" : "border-b border-white/5 pb-6"}`}
                        >
                          <DisplayComponent {...displayProps} value={formValues[field.id]} onChange={(e) => handleValueChange(field.id, e.target.value)}/>
                        </motion.div>
                      );
                    })}

                    <motion.div variants={itemVariants} className="mt-6 flex justify-end">
                      <button onClick={handleSubmit} disabled={submitMutation.isPending}
                        className={`relative inline-flex items-center justify-center gap-2 rounded-xl px-8 py-3 min-w-30 text-sm border-[1.5px] font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none
                        ${errorMessage ? "bg-red-900/20 border-red-800/50 hover:bg-red-900/30 text-red-200" : submitMutation.isPending ? "bg-neutral-400/40 border-neutral-200/50 text-neutral-400" : "bg-pink-300/30 border-pink-200/40 hover:bg-pink-200/60"}`}
                      >
                        {errorMessage ? (
                          {errorMessage}
                        ) : submitMutation.isPending ? (
                          <Loader2 className="animate-spin" size={16} />
                        ) : (
                          "Yanıtları Gönder"
                        )}
                      </button>
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