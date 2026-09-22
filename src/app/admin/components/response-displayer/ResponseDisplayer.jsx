"use client";

import { useState, useEffect, forwardRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ClockPlusIcon, ChevronsLeft, ListX, TextSearch } from "lucide-react";

import { useResponsePreviewQuery } from "@/lib/hooks/useResponseShare";
import { ResponseListItem, ResponseListSkeleton } from "./components/ResponseDisplayerComponents";
import { ResponseActions } from "./components/ResponseActions";
import StateCard from "@/app/components/StateCard";
import { Drawer, DrawerContent, DrawerTrigger } from "@/app/admin/components/utils/Drawer";

function useMediaQuery(query) {
    const [matches, setMatches] = useState(false);

    useEffect(() => {
        const media = window.matchMedia(query);
        if (media.matches !== matches) {
            setMatches(media.matches);
        }
        const listener = () => setMatches(media.matches);
        media.addEventListener("change", listener);
        return () => media.removeEventListener("change", listener);
    }, [query, matches]);

    return matches;
}

const ActionTrigger = forwardRef((props, ref) => {
    return (
        <div ref={ref} className="flex h-full items-center justify-end z-10">
            <DrawerTrigger asChild>
                <motion.button type="button" initial={{ x: 0 }} title="Paneli aç"
                    className="relative flex h-full w-5 items-center justify-center rounded-l-full border border-r-0 border-white/10 bg-neutral-900/80 shadow-xl text-neutral-500 hover:text-neutral-200 transition-colors"
                >
                    <ChevronsLeft size={16} className="opacity-60" />
                </motion.button>
            </DrawerTrigger>
        </div>
    );
});
ActionTrigger.displayName = "ActionTrigger";

const slideVariants = {
  enter: (direction) => ({
    x: direction === 0 ? 0 : direction > 0 ? 90 : -90,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({
    x: direction === 0 ? 0 : direction > 0 ? -90 : 90,
    opacity: 0,
  }),
};

const STEP_STATUS = {
  0: { label: "Gönderildi", dot: "bg-neutral-400" },
  1: { label: "Beklemede", dot: "bg-amber-400 shadow-[0_0_6px] shadow-amber-400/40" },
  2: { label: "Onaylandı", dot: "bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/40" },
  3: { label: "Reddedildi", dot: "bg-red-400 shadow-[0_0_6px] shadow-red-400/40" },
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

function WorkflowSteps({ steps, viewStage, onSelect }) {
  return (
    <nav aria-label="Başvuru adımları" className="mx-auto mt-3 w-full max-w-2xl overflow-x-auto scrollbar">
      <ol className="flex items-center gap-1 pb-1">
        {steps.map((step, index) => {
          const isAnswered = Boolean(step.responseId);
          const isActive = step.stage === viewStage;
          const status = isAnswered ? STEP_STATUS[step.status] ?? STEP_STATUS[0] : null;
          const title = isAnswered ? `${step.formTitle || "Adsız form"} · ${status.label}` : "Bu adım henüz cevaplanmadı";

          return (
            <li key={step.stage} className="flex shrink-0 items-center gap-1">
              {index > 0 && <ChevronRight size={12} className="shrink-0 text-neutral-700" />}
              <button type="button" disabled={!isAnswered} onClick={() => onSelect(step.stage)} title={title} aria-current={isActive ? "step" : undefined}
                className={`flex max-w-52 items-center gap-2 rounded-md border px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${isActive ? "border-white/15 bg-white/5" : isAnswered ? "border-transparent hover:bg-white/3" : "cursor-not-allowed border-transparent opacity-50"}`}
              >
                <span className="text-3xs tabular-nums text-neutral-500">{step.stage}</span>
                <span className={`truncate text-2xs font-medium ${isActive ? "text-neutral-100" : "text-neutral-400"}`}>{step.formTitle || "Adsız form"}</span>
                {status
                  ? <span className={`size-1.5 shrink-0 rounded-full ${status.dot}`} />
                  : <span className="size-1.5 shrink-0 rounded-full border border-neutral-600" />}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function ResponseDisplayer({ response, token = null }) {
  const schema = Array.isArray(response?.schema) ? response.schema : [];
  const isSharedView = Boolean(response?.sharedBy);
  const steps = Array.isArray(response?.workflow?.steps) ? response.workflow.steps : [];
  const ownStage = response?.workflow?.stage ?? null;

  const [viewStage, setViewStage] = useState(ownStage);
  const [direction, setDirection] = useState(0);

  const [prevResponseId, setPrevResponseId] = useState(response?.id);
  if (prevResponseId !== response?.id) {
    setPrevResponseId(response?.id);
    setViewStage(ownStage);
    setDirection(0);
  }

  const [drawerOpen, setDrawerOpen] = useState(false);
  const isLgUp = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (isLgUp) {
        setDrawerOpen(false);
    }
  }, [isLgUp]);

  const viewedStep = steps.find((step) => step.stage === viewStage) ?? null;
  const isOwnView = !viewedStep || viewStage === ownStage;
  const otherResponseId = isOwnView ? null : viewedStep.responseId;

  const { data: otherData, isLoading: isOtherLoading, error: otherError } = useResponsePreviewQuery(otherResponseId, token, { enabled: Boolean(otherResponseId) });
  const otherResponse = otherData?.data ?? otherData ?? null;
  const otherSchema = Array.isArray(otherResponse?.schema) ? otherResponse.schema : [];

  const handleSelectStage = (stage) => {
    if (stage === viewStage) return;
    setDirection(stage > viewStage ? 1 : -1);
    setViewStage(stage);
  };

  const renderSchemaList = (items) => {
    if (!items || items.length === 0) {
      return (
        <div className="flex min-h-[40vh]">
          <StateCard title={"Soru yok"} Icon={ListX} description={"Bu yanıtta gösterilebilecek soru yok."} />
        </div>
      )
    }

    return (
      <ul className="mx-auto w-full max-w-2xl divide-y divide-white/5">
        {items.map((item, index) => (
          <ResponseListItem key={item?.id ?? `${index}`} questionNumber={index + 1} question={item?.question} answer={item?.answer} type={item?.type} />
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

  let content = null;
  if (isOwnView) {
    content = renderSchemaList(schema);
  } else if (isOtherLoading) {
    content = <ResponseListSkeleton />;
  } else if (otherError) {
    content = (
      <div className="flex min-h-[40vh]">
        <StateCard title={"Hata oluştu"} Icon={ListX} description={"Yanıt verileri çekilirken bir hata oluştu."} />
      </div>
    )
  } else if (!otherResponse) {
    content = (
      <div className="flex min-h-[40vh]">
        <StateCard title={"Yanıta ulaşılamadı"} Icon={TextSearch} description={"Bu yanıtta gösterilebilecek soru yok."} />
      </div>
    )
  } else {
    content = renderSchemaList(otherSchema);
  }

  const isOtherUnavailable = !isOwnView && (isOtherLoading || otherError || !otherResponse);
  const answeredCount = isOtherUnavailable ? "--" : countAnswered(isOwnView ? schema : otherSchema);
  const activeResponse = isOwnView ? response : otherResponse;
  const activeId = isOwnView ? response?.id : (otherResponse?.id ?? otherResponseId);
  const actionsLoading = !isOwnView && isOtherLoading;

  const renderMainContent = (className) => (
    <motion.div className={`${className} h-full`} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 px-1 lg:h-7">
          <span className="text-2xs font-medium text-neutral-500 lg:text-base">Cevaplar</span>
          <span className="h-px flex-1 bg-white/5" />
          <span className="shrink-0 text-3xs tabular-nums text-neutral-500">Cevaplanan {answeredCount}</span>
        </div>

        {steps.length > 0 && (
          <WorkflowSteps steps={steps} viewStage={isOwnView ? ownStage : viewStage} onSelect={handleSelectStage} />
        )}

        <div className="mx-auto mt-2 flex w-full max-w-2xl items-center justify-between gap-3">
          {activeId && (
            <span className="min-w-0 truncate text-3xs text-neutral-600" title={activeId}>ID {activeId}</span>
          )}
          <span className="flex shrink-0 items-center gap-1 text-3xs text-neutral-500">
            <ClockPlusIcon size={11} />
            {formatDateTime(activeResponse?.submittedAt)}
          </span>
        </div>

        <div className="relative mt-4 min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={isOwnView ? "own" : `stage-${viewStage}`} custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit" transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 overflow-y-auto pr-1 scrollbar"
            >
              {content}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );

  const drawerContent = (
     <div className="h-full w-full overflow-y-auto p-4 scrollbar lg:overflow-visible lg:p-0">
        <ResponseActions response={activeResponse} isLoading={actionsLoading} readOnly={isSharedView} />
     </div>
  );

  if (isLgUp) {
      return (
        <div className="grid min-h-0 flex-1 grid-cols-12 gap-6 p-4 pt-8 lg:p-6 lg:pt-10">
            {renderMainContent("col-span-12 lg:col-span-8")}
            <motion.div className="col-span-4 h-full min-h-0" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
            >
                {drawerContent}
            </motion.div>
        </div>
      );
  }

  return (
    <div className="relative min-h-0 w-full flex-1">
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
            <div className="flex h-full w-full">
                <div className="min-w-0 flex-1 p-4 pt-8">
                    {renderMainContent("h-full")}
                </div>
                <ActionTrigger />
            </div>

            <DrawerContent className="h-full" rootClassName="overflow-visible" wrapperClassName="">
                {drawerContent}
            </DrawerContent>
        </Drawer>
    </div>
  );
}
