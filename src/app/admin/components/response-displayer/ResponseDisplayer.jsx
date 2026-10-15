"use client";

import { useState, useEffect, forwardRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ClockPlusIcon, ChevronsLeft, GitCompare, ListX, TextSearch } from "lucide-react";

import { useResponsePreviewQuery } from "@/lib/hooks/useResponseShare";
import { ResponseListItem, ResponseListSkeleton } from "./components/ResponseDisplayerComponents";
import { AttemptActions, ResponseActions } from "./components/ResponseActions";
import { AttemptEmptyState, ProvisionalNotice, TaskRow, attemptWhen } from "./components/AttemptPanels";
import { ATTEMPT_STATUS, RESPONSE_STATUS_PROVISIONAL } from "@/lib/attempt-status";
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
  4: { label: "Geçici", dot: "border border-amber-400" },
  6: { label: "Düzeltme istendi", dot: "bg-sky-400 shadow-[0_0_6px] shadow-sky-400/40" },
};

const RETURNED = 6;
const REVISING = { label: "Aday düzeltiyor", dot: "border border-sky-400/70" };

const stepKey = (step) => `${step.stage}:${step.round ?? 1}`;
const answerKey = (answer) => (answer == null ? "" : String(answer).trim());

// Bir adımın gönderimleri (düzeltme istenen ve yerine gelen) tek çipte toplanır.
function groupStages(steps) {
  const stages = [];
  steps.forEach((step) => {
    const last = stages[stages.length - 1];
    if (last && last.stage === step.stage) last.rounds.push(step);
    else stages.push({ stage: step.stage, formTitle: step.formTitle, rounds: [step] });
  });
  return stages;
}

function roundStatus(step, previous) {
  if (step.responseId) return STEP_STATUS[step.status] ?? STEP_STATUS[0];
  return Number(previous?.status) === RETURNED ? REVISING : null;
}

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

function WorkflowSteps({ steps, viewKey, ownKey, onSelect }) {
  return (
    <nav aria-label="Başvuru adımları" className="mx-auto mt-3 w-full max-w-2xl overflow-x-auto scrollbar">
      <ol className="flex items-center gap-1 pb-1">
        {groupStages(steps).map((group, index) => {
          const isActive = group.rounds.some((step) => stepKey(step) === viewKey);
          const isSelectable = (step) => Boolean(step.responseId) || stepKey(step) === ownKey;
          const chipClass = (selectable) => `flex max-w-64 items-center gap-2 rounded-md border px-2 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${isActive ? "border-white/15 bg-white/5" : selectable ? "border-transparent hover:bg-white/3" : "cursor-not-allowed border-transparent opacity-50"}`;
          const formTitle = group.formTitle || "Adsız form";
          const titleNode = <span className={`truncate text-2xs font-medium ${isActive ? "text-neutral-100" : "text-neutral-400"}`}>{formTitle}</span>;
          const single = group.rounds.length === 1 ? group.rounds[0] : null;
          const singleStatus = single ? roundStatus(single, null) : null;

          return (
            <li key={group.stage} className="flex shrink-0 items-center gap-1">
              {index > 0 && <ChevronRight size={12} className="shrink-0 text-neutral-700" />}
              {single ? (
                <button type="button" disabled={!isSelectable(single)} onClick={() => onSelect(stepKey(single))} aria-current={isActive ? "step" : undefined}
                  title={singleStatus ? `${formTitle} · ${singleStatus.label}` : "Bu adım henüz cevaplanmadı"} className={chipClass(isSelectable(single))}
                >
                  <span className="text-3xs tabular-nums text-neutral-500">{group.stage}</span>
                  {titleNode}
                  {singleStatus
                    ? <span className={`size-1.5 shrink-0 rounded-full ${singleStatus.dot}`} />
                    : <span className="size-1.5 shrink-0 rounded-full border border-neutral-600" />}
                </button>
              ) : (
                <div className={chipClass(true)}>
                  <span className="text-3xs tabular-nums text-neutral-500">{group.stage}</span>
                  {titleNode}
                  <span className="flex items-center gap-0.5 border-l border-white/10 pl-1.5">
                    {group.rounds.map((step, roundIndex) => {
                      const status = roundStatus(step, group.rounds[roundIndex - 1]);
                      const selectable = isSelectable(step);
                      const isCurrent = stepKey(step) === viewKey;
                      return (
                        <button key={stepKey(step)} type="button" disabled={!selectable} onClick={() => onSelect(stepKey(step))} aria-current={isCurrent ? "step" : undefined}
                          title={`${step.round}. gönderim · ${status?.label ?? "Henüz cevaplanmadı"}`}
                          className={`flex h-5 items-center gap-1 rounded px-1.5 text-3xs tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${isCurrent ? "bg-white/10 text-neutral-100" : selectable ? "text-neutral-400 hover:bg-white/5 hover:text-neutral-200" : "cursor-not-allowed text-neutral-600"}`}
                        >
                          {step.round}
                          <span className={`size-1.5 shrink-0 rounded-full ${status?.dot ?? "border border-neutral-600"}`} />
                        </button>
                      );
                    })}
                  </span>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default function ResponseDisplayer({ response = null, attemptView = null, token = null }) {
  const owner = attemptView ?? response;
  const schema = Array.isArray(response?.schema) ? response.schema : [];
  const isSharedView = Boolean(response?.sharedBy);
  const steps = Array.isArray(owner?.workflow?.steps) ? owner.workflow.steps : [];
  const ownStage = owner?.workflow?.stage ?? null;
  const ownKey = ownStage == null ? null : `${ownStage}:${owner?.workflow?.round ?? 1}`;

  const [viewKey, setViewKey] = useState(ownKey);
  const [direction, setDirection] = useState(0);
  const [showChanges, setShowChanges] = useState(true);
  const [returnFlags, setReturnFlags] = useState(null);

  const [prevResponseId, setPrevResponseId] = useState(owner?.id);
  if (prevResponseId !== owner?.id) {
    setPrevResponseId(owner?.id);
    setViewKey(ownKey);
    setDirection(0);
    setReturnFlags(null);
  }

  const [drawerOpen, setDrawerOpen] = useState(false);
  const isLgUp = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (isLgUp) {
        setDrawerOpen(false);
    }
  }, [isLgUp]);

  const viewedStep = steps.find((step) => stepKey(step) === viewKey) ?? null;
  const isOwnView = !viewedStep || viewKey === ownKey;
  const isOwnAttempt = isOwnView && Boolean(attemptView);
  const otherResponseId = isOwnView ? null : viewedStep.responseId;

  const { data: otherData, isLoading: isOtherLoading, error: otherError } = useResponsePreviewQuery(otherResponseId, token, { enabled: Boolean(otherResponseId) });
  const otherResponse = otherData?.data ?? otherData ?? null;
  const otherSchema = Array.isArray(otherResponse?.schema) ? otherResponse.schema : [];

  // Görülen gönderimden önce aynı adımda düzeltme istenen gönderim: değişenler ona göre bulunur.
  const shownStep = viewedStep ?? steps.find((step) => stepKey(step) === ownKey) ?? null;
  const previousStep = shownStep && (shownStep.round ?? 1) > 1
    ? steps.find((step) => step.stage === shownStep.stage && (step.round ?? 1) === shownStep.round - 1) ?? null
    : null;
  const previousResponseId = isOwnAttempt ? null : previousStep?.responseId ?? null;
  const { data: previousData } = useResponsePreviewQuery(previousResponseId, token, { enabled: Boolean(previousResponseId) });
  const previousResponse = previousResponseId ? previousData?.data ?? previousData ?? null : null;
  const previousSchema = Array.isArray(previousResponse?.schema) ? previousResponse.schema : null;

  const handleSelectStage = (key) => {
    if (key === viewKey) return;
    const from = steps.findIndex((step) => stepKey(step) === viewKey);
    const to = steps.findIndex((step) => stepKey(step) === key);
    setDirection(to > from ? 1 : -1);
    setViewKey(key);
    setReturnFlags(null);
  };

  const toggleReturnFlag = (questionId) => setReturnFlags((flags) => (
    flags?.includes(questionId) ? flags.filter((id) => id !== questionId) : [...(flags ?? []), questionId]
  ));

  const changedIdsOf = (items) => (previousSchema
    ? items.filter((item) => answerKey(item?.answer) !== answerKey(previousSchema.find((before) => before?.id === item?.id)?.answer)).map((item) => item?.id)
    : []);

  const renderSchemaList = (items, owner) => {
    const intro = (
      <>
        {Number(owner?.status) === RESPONSE_STATUS_PROVISIONAL && (
          <ProvisionalNotice actionable={!isSharedView && Boolean(owner?.attempt?.canDecide)} closed={owner?.attempt?.status === ATTEMPT_STATUS.NO_SUBMISSION} />
        )}
        <TaskRow key={owner?.id} task={owner?.task} />
      </>
    );

    if (!items || items.length === 0) {
      return (
        <>
          {intro}
          <div className="flex min-h-[40vh]">
            <StateCard title={"Soru yok"} Icon={ListX} description={"Bu yanıtta gösterilebilecek soru yok."} />
          </div>
        </>
      )
    }

    const changedIds = showChanges ? changedIdsOf(items) : [];
    const requestedIds = Number(owner?.status) === RETURNED ? owner?.returnedQuestionIds ?? [] : previousResponse?.returnedQuestionIds ?? [];
    const flagMode = returnFlags !== null && !isSharedView;

    return (
      <>
        {intro}
        <ul className="mx-auto w-full max-w-2xl divide-y divide-white/5">
          {items.map((item, index) => (
            <ResponseListItem key={item?.id ?? `${index}`} questionNumber={index + 1} question={item?.question} answer={item?.answer} type={item?.type}
              responseId={owner?.id ?? null} token={token}
              changed={changedIds.includes(item?.id)}
              before={previousSchema?.find((before) => before?.id === item?.id)?.answer ?? null}
              beforeLabel={`${previousStep?.round ?? 1}. gönderimde`}
              requested={!flagMode && requestedIds.includes(item?.id)}
              flag={flagMode ? { selected: returnFlags.includes(item?.id), onToggle: () => toggleReturnFlag(item?.id) } : null}
            />
          ))}
        </ul>
      </>
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
  if (isOwnAttempt) {
    content = (
      <>
        <TaskRow key={attemptView.id} task={attemptView.task} />
        <AttemptEmptyState attempt={attemptView.attempt} />
      </>
    );
  } else if (isOwnView) {
    content = renderSchemaList(schema, response);
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
    content = renderSchemaList(otherSchema, otherResponse);
  }

  const isOtherUnavailable = !isOwnView && (isOtherLoading || otherError || !otherResponse);
  const answeredCount = isOtherUnavailable || isOwnAttempt ? "--" : countAnswered(isOwnView ? schema : otherSchema);
  const activeResponse = isOwnView ? response : otherResponse;
  const activeId = isOwnView ? owner?.id : (otherResponse?.id ?? otherResponseId);
  const actionsLoading = !isOwnView && isOtherLoading;
  const changeCount = previousSchema && !isOtherUnavailable ? changedIdsOf(isOwnView ? schema : otherSchema).length : 0;
  const previousRound = Number(previousResponse?.status) === RETURNED ? previousResponse : null;

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
          <WorkflowSteps steps={steps} viewKey={isOwnView ? ownKey : viewKey} ownKey={ownKey} onSelect={handleSelectStage} />
        )}

        <div className="mx-auto mt-2 flex w-full max-w-2xl items-center justify-between gap-3">
          {activeId && (
            <span className="min-w-0 truncate text-3xs text-neutral-600" title={activeId}>ID {activeId}</span>
          )}
          <span className="flex shrink-0 items-center gap-3">
            {previousSchema && !isOtherUnavailable && (
              <button type="button" onClick={() => setShowChanges((value) => !value)} aria-pressed={showChanges}
                title={`${previousStep?.round ?? 1}. gönderimden farklı cevapları vurgula`}
                className={`flex h-6 items-center gap-1.5 rounded-md border px-2 text-3xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${showChanges ? "border-sky-400/40 bg-sky-400/10 text-sky-200" : "border-white/10 text-neutral-400 hover:text-neutral-200"}`}
              >
                <GitCompare size={11} />
                Değişenler
                <span className="tabular-nums opacity-70">{changeCount}</span>
              </button>
            )}
            <span className="flex items-center gap-1 text-3xs text-neutral-500">
              <ClockPlusIcon size={11} />
              {isOwnAttempt ? attemptWhen(attemptView.attempt) : formatDateTime(activeResponse?.submittedAt)}
              {!isOwnAttempt && Number(activeResponse?.status) === RESPONSE_STATUS_PROVISIONAL && <span className="text-amber-300/80"> · süre doldu</span>}
            </span>
          </span>
        </div>

        <div className="relative mt-4 min-h-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div key={isOwnView ? "own" : `step-${viewKey}`} custom={direction} variants={slideVariants}
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
        {isOwnAttempt
          ? <AttemptActions view={attemptView} />
          : <ResponseActions response={activeResponse} isLoading={actionsLoading} readOnly={isSharedView}
              returnFlags={returnFlags} onReturnFlagsChange={setReturnFlags} previousRound={previousRound}
            />}
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
