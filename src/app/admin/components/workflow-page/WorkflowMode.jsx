"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQueries, useQuery } from "@tanstack/react-query";
import { ListTree, PencilLine, Users, Workflow } from "lucide-react";
import StateCard from "@/app/components/StateCard";
import { StatePill } from "@/app/admin/components/utils/SidePanel";
import { durationText, formatDay, formatShortDate } from "@/lib/form-timing";
import { WORKFLOW_INTAKE } from "@/lib/form-settings";
import { formQuery } from "@/lib/hooks/useFormAdmin";
import { attemptAnalyticsQuery } from "@/lib/hooks/useResponse";
import { workflowQuery, workflowRunsOverviewQuery, workflowRunsQuery, workflowVersionsQuery } from "@/lib/hooks/useWorkflowAdmin";
import { workflowEditHref } from "@/lib/workflow-links";
import { COMPARISON_SYMBOL, VALUELESS_COMPARISONS } from "../workflow-editor/workflow-copy";
import { groupTransitions, isTimedNode } from "../workflow-editor/workflow-graph";
import { TRIGGER_LABEL } from "../form-studio/studio-flow";
import { questionNumbers } from "../form-studio/studio-schema";
import RoomFrame from "../form-room/RoomFrame";
import RoomHeader, { HeaderButton, HeaderTouch } from "../form-room/RoomHeader";
import { useRoom, useRoomKeys, useRoomState } from "../form-room/room-context";
import { sameId } from "../form-room/room-flow";
import JourneyCanvas, { scrollToSection, useElementWidth } from "./JourneyCanvas";
import JourneyOutline from "./JourneyOutline";
import { OperationsPanel, RunsList } from "./JourneyPanel";
import { PAGE_SIZE, STEP_PEOPLE, endTriggerOf, finishedTotal, intakeOf, intakePill, payloadOf, publishedVersion } from "./journey-data";

const FRESH = 30_000;
const EMPTY_MAP = {};
const NO_ITEMS = [];

export function prefetchWorkflow(queryClient, route) {
  const workflowId = route.workflowId;
  if (!workflowId) return Promise.resolve();
  const workflow = payloadOf(queryClient.getQueryData(workflowQuery(workflowId).queryKey));
  const nodes = (workflow?.published ?? workflow?.draft)?.nodes ?? [];
  return Promise.all([
    queryClient.prefetchQuery({ ...workflowRunsOverviewQuery(workflowId), staleTime: FRESH }),
    queryClient.prefetchQuery({ ...workflowRunsQuery(workflowId, { pageSize: PAGE_SIZE, filter: 0, nodeKey: route.step ?? null }), staleTime: FRESH }),
    ...nodes.map((node) => queryClient.prefetchQuery({ ...workflowRunsQuery(workflowId, { pageSize: STEP_PEOPLE, filter: 0, nodeKey: node.nodeKey }), staleTime: FRESH })),
  ]);
}

export default function WorkflowMode() {
  const room = useRoom();
  const router = useRouter();
  const { route, flow, workflow } = room;
  const workflowId = route.workflowId;
  const selected = route.step ?? null;
  const live = Boolean(workflow?.published);

  const [tab, setTab] = useRoomState("workflow.tab", "runs");
  const [runsTab, setRunsTab] = useRoomState("workflow.runsTab", 0);
  const [only, setOnly] = useRoomState("workflow.only", null);
  const [page, setPage] = useRoomState("workflow.page", 1);
  const [saved, setSaved] = useRoomState("workflow.return", null);
  const [, setLastResp] = useRoomState("lastResp", EMPTY_MAP);
  const [flash, setFlash] = useState(null);
  const scrollRef = useRef(null);
  const frameRef = useRef(0);
  const initialRef = useRef(saved ? { restore: saved } : selected ? { sec: selected } : null);
  const width = useElementWidth(scrollRef);

  const nodes = useMemo(() => flow?.nodes ?? NO_ITEMS, [flow]);
  const timedNodes = useMemo(() => nodes.filter(isTimedNode), [nodes]);
  const conditionForms = useMemo(() => {
    const ids = new Set();
    (flow?.transitions ?? []).forEach((transition) => {
      (transition.condition?.rules ?? []).forEach((rule) => {
        const node = flow.nodeOf(rule.nodeKey ?? transition.sourceNodeKey);
        if (node?.formId) ids.add(node.formId);
      });
    });
    return [...ids];
  }, [flow]);

  const overviewResult = useQuery({ ...workflowRunsOverviewQuery(workflowId), enabled: Boolean(workflowId), staleTime: FRESH, refetchInterval: 60_000 });
  const overview = payloadOf(overviewResult.data);
  const versionsResult = useQuery({ ...workflowVersionsQuery(workflowId), enabled: Boolean(workflowId), staleTime: 60_000 });
  const versionsPayload = payloadOf(versionsResult.data);
  const versions = Array.isArray(versionsPayload) ? versionsPayload : versionsPayload?.items ?? NO_ITEMS;

  const peopleResults = useQueries({
    queries: nodes.map((node) => ({ ...workflowRunsQuery(workflowId, { pageSize: STEP_PEOPLE, filter: 0, nodeKey: node.nodeKey }), enabled: Boolean(workflowId), staleTime: FRESH, refetchInterval: 60_000 })),
  });
  const finishedResults = useQueries({
    queries: nodes.map((node) => ({ ...workflowRunsQuery(workflowId, { pageSize: 1, filter: 2, nodeKey: node.nodeKey }), enabled: Boolean(workflowId), staleTime: 60_000 })),
  });
  const attemptResults = useQueries({ queries: timedNodes.map((node) => ({ ...attemptAnalyticsQuery(node.formId), staleTime: 60_000 })) });
  const schemaResults = useQueries({ queries: conditionForms.map((formId) => ({ ...formQuery(formId), staleTime: 60_000 })) });
  const recentResult = useQuery({ ...workflowRunsQuery(workflowId, { pageSize: 5, filter: 2 }), enabled: Boolean(workflowId), staleTime: FRESH });

  const onlyMode = only != null && Boolean(selected);
  const listResult = useQuery({
    ...workflowRunsQuery(workflowId, onlyMode ? { page: 1, pageSize: 100, filter: 0, nodeKey: selected } : { page, pageSize: PAGE_SIZE, filter: runsTab, nodeKey: selected }),
    enabled: Boolean(workflowId), staleTime: FRESH, placeholderData: keepPreviousData,
  });

  const counts = useMemo(() => Object.fromEntries((overview?.steps ?? []).map((step) => [step.nodeKey, step])), [overview]);
  const removed = useMemo(() => (overview?.steps ?? []).filter((step) => step.isRemoved && step.count > 0 && !flow?.nodeOf(step.nodeKey)), [overview, flow]);
  const finishedHere = {};
  nodes.forEach((node, index) => { finishedHere[node.nodeKey] = payloadOf(finishedResults[index]?.data)?.totalCount ?? 0; });
  const done = finishedTotal(overview?.finished);
  const pill = intakePill(workflow);
  const published = publishedVersion(versions);
  const depthOf = (key) => flow?.stages.depths.get(key) ?? counts[key]?.depth ?? null;
  const ready = width > 0 && !overviewResult.isPending && [...peopleResults, ...finishedResults, ...attemptResults].every((result) => !result.isPending);

  const schemaOf = (formId) => {
    if (sameId(formId, room.formId) && room.form) return room.form.schema;
    const index = conditionForms.findIndex((id) => sameId(id, formId));
    return index >= 0 ? payloadOf(schemaResults[index]?.data)?.schema ?? null : null;
  };

  const conditionText = (transition) => {
    const rules = transition.condition?.rules ?? [];
    const rule = rules[0];
    if (!rule?.questionId) return "koşullu";
    const sourceKey = rule.nodeKey ?? transition.sourceNodeKey;
    const source = flow?.nodeOf(sourceKey);
    const number = questionNumbers(schemaOf(source?.formId) ?? []).get(rule.questionId);
    const question = `${sourceKey !== transition.sourceNodeKey && depthOf(sourceKey) ? `${depthOf(sourceKey)}. adımda ` : ""}${number ? `${number}. soru` : "bir soru"}`;
    const comparison = Number(rule.comparison);
    const value = Array.isArray(rule.values) && rule.values.length ? rule.values.join(", ") : rule.value;
    const summary = VALUELESS_COMPARISONS.includes(comparison) ? `${question} ${COMPARISON_SYMBOL[comparison]}` : `${question} ${COMPARISON_SYMBOL[comparison] ?? "="} ${value || "?"}`;
    return rules.length > 1 ? `${summary} +${rules.length - 1}` : summary;
  };

  const labelOf = (transition) => {
    if (transition.condition) return conditionText(transition);
    const group = groupTransitions(flow?.transitions ?? NO_ITEMS, transition.sourceNodeKey, Number(transition.trigger));
    return group.some((item) => item.condition) ? "aksi halde" : null;
  };

  const metaOf = (node) => {
    const parts = [];
    if (node.isStart) parts.push("Başlangıç");
    if (node.requiresManualReview) parts.push("Manuel onay");
    if (isTimedNode(node)) parts.push(durationText(node.timeLimitMinutes));
    const ownDepth = depthOf(node.nodeKey);
    (flow?.transitions ?? NO_ITEMS).filter((transition) => transition.targetNodeKey === node.nodeKey && ownDepth && depthOf(transition.sourceNodeKey) !== ownDepth - 1).forEach((transition) => {
      const source = flow.nodeOf(transition.sourceNodeKey);
      const special = labelOf(transition);
      parts.push(`Ayrıca ${source?.formTitle || "önceki adım"} ${TRIGGER_LABEL[Number(transition.trigger)] ?? ""}${special ? ` (${special})` : ""}`.trim());
    });
    const end = endTriggerOf(node, flow?.transitions ?? NO_ITEMS);
    if (end != null) parts.push(`${TRIGGER_LABEL[end]} akış biter`);
    return parts.join(" · ").replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("tr-TR"));
  };

  const steps = {};
  let timedIndex = 0;
  nodes.forEach((node, index) => {
    const attempts = isTimedNode(node) ? payloadOf(attemptResults[timedIndex++]?.data) : null;
    steps[node.nodeKey] = {
      node,
      depth: depthOf(node.nodeKey),
      meta: metaOf(node),
      counts: counts[node.nodeKey] ?? null,
      people: payloadOf(peopleResults[index]?.data)?.items ?? NO_ITEMS,
      finishedHere: finishedHere[node.nodeKey],
      attempts,
    };
  });

  const secOf = (key) => {
    if (key === flow?.stages.ordered[0]?.nodeKey) return "bas";
    return flow?.nodeOf(key) ? key : "eski";
  };

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  useEffect(() => {
    const initial = initialRef.current;
    const root = scrollRef.current;
    if (!initial || !ready || !root) return;
    initialRef.current = null;
    frameRef.current = requestAnimationFrame(() => {
      if (initial.restore) {
        root.scrollTop = initial.restore.top;
        const row = initial.restore.run ? root.querySelector(`[data-run="${CSS.escape(initial.restore.run)}"]`) : null;
        if (row && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
          row.animate([{ backgroundColor: "rgba(224,200,229,0.14)" }, { backgroundColor: "rgba(224,200,229,0)" }], { duration: 1600, easing: "ease-out" });
        }
        return;
      }
      scrollToSection(root, secOf(initial.sec), false);
      setFlash({ sec: initial.sec, id: Date.now() });
    });
    if (initial.restore) {
      setSaved(null);
      if ((initial.restore.step ?? null) !== selected) room.go({ step: initial.restore.step ?? null }, { replace: true });
    }
  });

  const openPanel = () => {
    if (!room.rightDocked) room.setSheet("right");
  };

  const pickList = (patch) => {
    if (patch.tab !== undefined) setTab(patch.tab);
    if (patch.runsTab !== undefined) setRunsTab(patch.runsTab);
    setOnly(patch.only ?? null);
    setPage(1);
  };

  const selectStep = (key, { scroll = false, open = false } = {}) => {
    room.go({ step: key }, { replace: true });
    pickList({ tab: "runs" });
    if (scroll && scrollRef.current) scrollToSection(scrollRef.current, secOf(key));
    if (open) openPanel();
  };

  const showGroup = (key, state) => {
    room.go({ step: key }, { replace: true });
    pickList({ tab: "runs", runsTab: state === 3 ? 1 : 0, only: state === 3 ? null : state });
    openPanel();
  };

  const showFinished = (scroll) => {
    room.go({ step: null }, { replace: true });
    pickList({ tab: "runs", runsTab: 2 });
    if (scroll && scrollRef.current) scrollToSection(scrollRef.current, "bitenler");
    else openPanel();
  };

  const showFinishedHere = (key) => {
    room.go({ step: key }, { replace: true });
    pickList({ tab: "runs", runsTab: 2 });
    openPanel();
  };

  const showOps = () => {
    setTab("ops");
    openPanel();
  };

  const clearSelection = () => {
    room.go({ step: null }, { replace: true });
    setOnly(null);
    setPage(1);
  };

  const openRun = (run) => {
    const target = run.latestResponse;
    if (!target) {
      room.toast("Bu başvurunun henüz cevabı yok");
      return;
    }
    setSaved({ top: scrollRef.current?.scrollTop ?? 0, run: run.id, step: selected });
    setLastResp((map) => ({ ...(map ?? EMPTY_MAP), [target.formId]: target.id }));
    room.go({ mode: "response", formId: target.formId, responseId: target.id, attempt: false, step: null }, { transition: "swap", ms: 200 });
  };

  const formOf = (key) => flow?.nodeOf(key)?.formId ?? counts[key]?.formId ?? null;
  const toMode = (mode, formId) => room.leaveJourney(mode, formId);
  const editable = typeof workflow?.canEdit === "boolean" ? workflow.canEdit : room.shell ? room.canEdit : true;
  const edit = () => {
    if (!editable) return;
    if (room.shell) room.switchMode("edit");
    else router.push(workflowEditHref(workflow ?? { id: workflowId }));
  };

  useRoomKeys((event, { typing, modifier }) => {
    if (typing || modifier || event.altKey) return false;
    if (event.key === "Escape") {
      room.leaveJourney();
      return true;
    }
    if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && flow) {
      event.preventDefault();
      const order = flow.stages.ordered.map((node) => node.nodeKey);
      const current = order.indexOf(selected ?? room.node?.nodeKey ?? "");
      const next = order[Math.min(order.length - 1, Math.max(0, (current < 0 ? (event.key === "ArrowLeft" ? 1 : -1) : current) + (event.key === "ArrowLeft" ? -1 : 1)))];
      if (next && next !== selected) selectStep(next, { scroll: true });
      return true;
    }
    return false;
  });

  const selectedNode = selected ? flow?.nodeOf(selected) ?? null : null;
  const selectedRemoved = selected && !selectedNode ? counts[selected] ?? null : null;
  const selectedCounts = selected ? counts[selected] ?? null : null;
  const listPage = payloadOf(listResult.data);
  const listItems = listPage?.items ?? NO_ITEMS;
  const filtered = onlyMode ? listItems.filter((run) => Number(run.state) === only) : listItems;
  const listTotal = onlyMode ? filtered.length : listPage?.totalCount ?? 0;
  const listPages = onlyMode ? Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)) : listPage?.totalPages ?? Math.max(1, Math.ceil(listTotal / PAGE_SIZE));
  const listRuns = onlyMode ? filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE) : listItems;
  const tabCounts = selected
    ? [selectedCounts?.count ?? 0, selectedCounts?.awaitingReview ?? 0, finishedHere[selected] ?? (runsTab === 2 ? listPage?.totalCount : null)]
    : [overview?.activeRunCount ?? 0, overview?.awaitingReviewCount ?? 0, done];

  const intake = intakeOf(workflow);
  const closesText = live && intake === WORKFLOW_INTAKE.OPEN && workflow?.intakeClosesAt ? `Yeni başvuruların kapanışı: ${formatShortDate(workflow.intakeClosesAt)}` : null;
  const versionText = published ? `v${published.version} yayında${published.publishedAt ? ` (${formatDay(published.publishedAt)})` : ""}` : live ? null : "Yayınlanmadı";
  const pillText = `${pill.label}${live && published ? ` · v${published.version}` : ""}`;

  const outline = (where) => (flow ? (
    <JourneyOutline head={room.outlineHead(where)} flow={flow} counts={counts} removed={removed} selected={selected} finishedCount={done} pill={pill} overview={overview}
      onPick={(key) => {
        room.setSheet(null);
        selectStep(key, { scroll: true });
      }}
      onFinished={() => {
        room.setSheet(null);
        showFinished(true);
      }}
      onOps={showOps}
    />
  ) : room.outlineHead(where));

  const center = flow ? (
    <JourneyCanvas scrollRef={scrollRef} width={width} flow={flow} steps={steps} overview={overview} done={done} finished={overview?.finished}
      recentFinished={payloadOf(recentResult.data)?.items ?? NO_ITEMS} removed={removed} pill={pill} versionText={versionText} closesText={closesText}
      updatedAt={overviewResult.dataUpdatedAt ? new Date(overviewResult.dataUpdatedAt) : null} draft={!live}
      selected={selected} cardSelect={room.rightDocked} flash={flash} labelOf={labelOf}
      onSelect={(key) => selectStep(key, { open: true })} onOpenRun={openRun} onMore={showGroup} onFinishedHere={showFinishedHere}
      onFinished={() => showFinished(false)} onAnalytics={(formId) => toMode("analytics", formId)}
    />
  ) : (
    <div ref={scrollRef} className="flex h-full flex-col bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[22px_22px]">
      <StateCard title="Bu akışta henüz adım yok" Icon={Workflow} description="Akışın adımlarını düzenleme ekranında kurarsın." />
    </div>
  );

  const inspectorHeader = (
    <div role="tablist" className="flex w-full min-w-0 items-center">
      {[["runs", "Başvuranlar"], ["ops", "Ayarlar"]].map(([id, label], index) => (
        <Fragment key={id}>
          {index ? <span className="mx-2 h-3 w-px shrink-0 bg-neutral-800" /> : null}
          <button type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`min-h-10 w-full min-w-0 truncate rounded transition-colors ${tab === id ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            {label}
          </button>
        </Fragment>
      ))}
    </div>
  );

  const stepForms = (flow?.stages.ordered ?? NO_ITEMS).map((node) => ({ ...node, depth: depthOf(node.nodeKey) }));
  const inspector = tab === "ops" ? (
    <OperationsPanel workflow={workflow} overview={overview} versions={versions} steps={stepForms} canEdit={editable} onEdit={edit}
      onMode={(mode, formId) => toMode(mode, formId)}
    />
  ) : (
    <RunsList stepKey={selected} stepTitle={selectedNode?.formTitle ?? selectedRemoved?.formTitle} stepDepth={selectedNode ? depthOf(selected) : null}
      stepIsStart={Boolean(selectedNode?.isStart)} stepNote={selectedRemoved ? "Eski sürüm" : null} counts={selectedCounts} tabCounts={tabCounts} tab={runsTab}
      onTab={(next) => pickList({ runsTab: next })} only={onlyMode ? only : null} onClearOnly={() => { setOnly(null); setPage(1); }}
      onClear={clearSelection} onMode={selected && formOf(selected) ? (mode) => toMode(mode, formOf(selected)) : null}
      runs={listRuns} total={listTotal} loading={listResult.isPending} error={listResult.isError} live={live}
      page={page} totalPages={listPages} onPage={setPage} depthOf={depthOf} onOpenRun={openRun}
    />
  );

  return (
    <>
      <RoomHeader
        desktop={(
          <>
            <button type="button" onClick={showOps} title="Ayarlar" className="rounded-md px-1.5 transition-colors hover:bg-white/5">
              <StatePill tone={pill.tone}>{pillText}</StatePill>
            </button>
            <HeaderButton icon={PencilLine} label="Düzenle" primary onClick={edit} disabled={!editable} />
          </>
        )}
        mobile={<HeaderTouch icon={PencilLine} label="Düzenle" onClick={edit} disabled={!editable} />}
      />
      <RoomFrame {...room.frameProps} outline={outline} center={center}
        toolbar={room.toolbar({ left: room.leftButton("Adımlar", ListTree, "Adımlar"), right: room.rightButton("Liste", Users, "Başvuranlar ve ayarlar") })}
        inspectorHeader={inspectorHeader} inspector={inspector}
      />
    </>
  );
}
