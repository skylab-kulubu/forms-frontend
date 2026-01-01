"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, ClockPlusIcon, FileXCorner } from "lucide-react";

import { useResponseQuery } from "@/lib/hooks/useResponse";
import { ResponseListItem, ResponseListSkeleton } from "./components/ResponseDisplayerComponents";
import { ResponseActions } from "./components/ResponseActions";

const slideVariants = {
  enter: (direction) => ({
    x: direction === 0 ? 0 : direction > 0 ? -90 : 90,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({
    x: direction === 0 ? 0 : direction > 0 ? 90 : -90,
    opacity: 0,
  }),
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export default function ResponseDisplayer({ response }) {
  const schema = Array.isArray(response?.schema) ? response.schema : [];
  const relationship = Number(response?.relationship ?? 0);
  const linkedResponseId = response?.linkedResponseId ?? "";

  const canNavigateLinked = (relationship === 1 || relationship === 2) && Boolean(linkedResponseId);
  const isChild = relationship === 2;
  const baseArrowSide = isChild ? "left" : "right";
  const slideDirection = isChild ? 1 : -1;

  const [activeView, setActiveView] = useState("responses");
  const [direction, setDirection] = useState(0);

  const linkedEnabled = canNavigateLinked && activeView === "linked";
  const { data: linkedData, isLoading: isLinkedLoading, error: linkedError } = useResponseQuery(
    linkedResponseId,
    { enabled: linkedEnabled }
  );
  const linkedResponse = linkedData?.data ?? linkedData ?? null;
  const linkedSchema = Array.isArray(linkedResponse?.schema) ? linkedResponse.schema : [];

  const handleToggleLinked = () => {
    if (!canNavigateLinked) return;
    const nextView = activeView === "responses" ? "linked" : "responses";
    const nextDirection = nextView === "linked" ? slideDirection : -slideDirection;
    setDirection(nextDirection);
    setActiveView(nextView);
  };


  const arrowSide = activeView === "responses" ? baseArrowSide : baseArrowSide === "left" ? "right" : "left";
  const ArrowIcon = arrowSide === "left" ? ArrowLeft : ArrowRight;

  const renderEmptyState = (title, description) => (
    <div className="flex min-h-[35vh] items-center justify-center px-6 text-center shadow-sm">
      <div className="flex max-w-sm flex-col items-center gap-3">
        <FileXCorner className="h-8 w-8 text-neutral-200 drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]" />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-neutral-100">{title}</p>
          {description && <p className="text-xs text-neutral-400">{description}</p>}
        </div>
      </div>
    </div>
  );

  const renderSchemaList = (items) => {
    if (!items || items.length === 0) {
      return renderEmptyState("Bu yanitta gosterilecek soru yok.", "Yanit bos olabilir.");
    }

    return (
      <ul className="space-y-3">
        {items.map((item, index) => (
          <ResponseListItem key={item?.id ?? `${index}`} questionNumber={index + 1} question={item?.question} answer={item?.answer} />
        ))}
      </ul>
    );
  };

  const countAnswered = (items) => {
    if (!Array.isArray(items)) return 0;
    return items.reduce((count, item) => {
      const answer = item?.answer;
      if (answer == null) return count;
      if (Array.isArray(answer)) {
        return answer.some((entry) => String(entry ?? "").trim() !== "") ? count + 1 : count;
      }
      return String(answer).trim() !== "" ? count + 1 : count;
    }, 0);
  };

  const responsesContent = renderSchemaList(schema);

  let linkedContent = null;
  if (isLinkedLoading) {
    linkedContent = <ResponseListSkeleton />;
  } else if (linkedError) {
    linkedContent = renderEmptyState("Bağlı yanıt yüklenemedi", "Lütfen daha sonra tekrar deneyin.");
  } else if (!linkedResponse) {
    linkedContent = renderEmptyState("Bağlı yanıt bulunamadı.", "Yanıta erişilemedi.");
  } else {
    linkedContent = renderSchemaList(linkedSchema);
  }

  const answeredCount = activeView === "linked" ? (isLinkedLoading || linkedError || !linkedResponse ? "--" : countAnswered(linkedSchema)) : countAnswered(schema);
  const activeId = activeView === "linked" ? (linkedResponse?.id ?? linkedResponseId) : response?.id;
  const activeResponse = activeView === "linked" ? linkedResponse : response;
  const actionsLoading = activeView === "linked" && isLinkedLoading;

  return (
    <div className="grid grid-cols-12 gap-4">
      <motion.div className="col-span-12 lg:col-span-8" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
      >
        <div className="relative h-[93vh] p-4 shadow-sm">
          <AnimatePresence mode="wait">
            {canNavigateLinked && (
              <motion.button key={arrowSide} type="button" onClick={handleToggleLinked} aria-label={"Diğer cevaplar"}
                className={`absolute inset-y-0 translate-y-1/5 ${arrowSide === "left" ? "-left-3" : "-right-3"} z-20 flex w-5 h-[70vh] items-center justify-center rounded-md border border-white/5 bg-neutral-900/90 text-neutral-200 shadow-lg transition hover:bg-neutral-800 opacity-80`}
                initial={{ opacity: 0 }} animate={{ opacity: 0.8 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                <ArrowIcon size={16} />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="flex h-full flex-col gap-4">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
              {activeId && (
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">Response ID</p>
                  <p className="mt-1 text-xs text-neutral-200 break-all">{activeId}</p>
                </div>
              )}
              <div className="text-end text-xs text-neutral-500">
                <p>Cevaplanan {answeredCount} soru</p>
                <div className="flex gap-1">
                  <ClockPlusIcon size={12} className="mt-0.5" />
                  <p>{formatDateTime(activeResponse?.submittedAt)}</p>
                </div>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <AnimatePresence mode="wait" custom={direction}>
                {activeView === "responses" ? (
                  <motion.div key="responses" custom={direction} variants={slideVariants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 overflow-y-auto pr-1 scrollbar"
                  >
                    {responsesContent}
                  </motion.div>
                ) : (
                  <motion.div key="linked" custom={direction} variants={slideVariants}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute inset-0 overflow-y-auto pr-1 scrollbar"
                  >
                    {linkedContent}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div className="col-span-12 lg:col-span-4" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
      >
        <div className="h-[93vh] p-4 shadow-sm">
          <ResponseActions response={activeResponse} isLoading={actionsLoading} loadingLabel={activeView === "linked" ? "Bagli yanit yukleniyor..." : "Yanit yukleniyor..."} />
        </div>
      </motion.div>
    </div>
  );
}
