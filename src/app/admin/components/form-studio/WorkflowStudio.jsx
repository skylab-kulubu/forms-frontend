"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Archive, X } from "lucide-react";
import { useWorkflowContext } from "../../providers";
import { FormEditorProvider, useOptionalFormEditor } from "../form-editor/FormEditorContext";
import { HeaderStatusPill } from "../form-editor/components/EditorHeaderActions";
import { WorkflowEditorProvider, useWorkflowEditor } from "../workflow-editor/WorkflowEditorContext";
import { validationMessage } from "../workflow-editor/workflow-copy";
import ApprovalOverlay from "../ApprovalOverlay";
import FormShareDialog from "../share/FormShareDialog";
import { formInfoQuery } from "@/lib/hooks/useFormContext";
import { useAvailableFormsQuery, useCandidateFormsQuery } from "@/lib/hooks/useWorkflowAdmin";
import { NONE, StudioProvider, useStudio } from "./StudioContext";
import { StudioSessionProvider, useDocStates, useOpenThreadCounts, usePresenceBroadcast, usePresenceMembers, useStudioSession } from "./StudioSession";
import { RemoteCursors, StudioPresenceProvider, colorOf, revealField, uniquePeople, useCursorBroadcast, useTypingField, whereOf } from "./StudioPresence";
import StudioLayout from "./StudioLayout";
import StudioPage, { pageCardRect } from "./StudioPage";
import StudioMap, { FlowCardDecor } from "./StudioMap";
import StudioFlowList from "./StudioFlowList";
import StudioPalette from "./StudioPalette";
import StudioHeaderActions from "./StudioHeaderActions";
import StudioFormPicker, { NEW_FORM } from "./StudioFormPicker";
import StudioSkeleton from "./StudioSkeleton";
import { FlowNextBlock } from "./StudioNextBlock";
import { OutlineHeader, OutlineQuestions, OutlineSteps } from "./StudioOutline";
import { Crumbs, FlowRootBody, FormInspectorBody, RoutesBody, formCrumb, selectionCrumb } from "./StudioInspector";
import { FlowKeys, FormKeys } from "./StudioKeys";
import { useWorkflowStudio } from "./useWorkflowStudio";
import { useMediaQuery } from "./useMediaQuery";
import { slideDirection, stagesOf } from "./studio-flow";
import { SLIDE_IN_EASING, SLIDE_IN_MS, SLIDE_OUT_EASING, SLIDE_OUT_MS, SLIDE_PX, prefersReducedMotion, swapView } from "./studio-motion";
import { publishedQueries, studioStatusOf } from "./studio-save";

const SWITCH_WAIT_MS = 1500;
const REVEAL_DELAY_MS = 450;
const NO_MEMBERS = [];

function blankTitle(nodes) {
  const taken = new Set(nodes.map((node) => node.formTitle));
  let title = "Yeni Form";
  for (let index = 2; taken.has(title); index += 1) title = `Yeni Form ${index}`;
  return title;
}

function listOf(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

function IssuesPanel({ issues, nodes, onPick, onClose }) {
  return (
    <div className="absolute inset-x-3 bottom-16 z-30 mx-auto max-h-56 max-w-xl overflow-y-auto rounded-lg border border-red-400/25 bg-neutral-900/95 p-3 shadow-xl backdrop-blur scrollbar">
      <div className="flex items-center gap-2">
        <span className="text-2xs font-medium text-red-200">Kaydı engelleyen {issues.length} sorun</span>
        <span className="h-px flex-1 bg-red-400/20" />
        <button type="button" onClick={onClose} aria-label="Kapat" className="rounded p-0.5 text-red-200/70 transition-colors hover:text-red-100"><X size={12} /></button>
      </div>
      <ul className="mt-2 space-y-1">
        {issues.map((issue, index) => (
          <li key={`${issue.code}-${index}`}>
            <button type="button" disabled={!issue.nodeKey} onClick={() => issue.nodeKey && onPick(issue.nodeKey)}
              className={`flex w-full items-start gap-2 rounded px-1 py-0.5 text-left text-2xs text-red-200/90 ${issue.nodeKey ? "transition-colors hover:bg-red-500/10 hover:text-red-100" : "cursor-default"}`}
            >
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-red-400" />
              <span className="min-w-0">
                {validationMessage(issue)}
                {issue.nodeKey ? <span className="ml-1 text-red-200/50">· {nodes.find((node) => node.nodeKey === issue.nodeKey)?.formTitle ?? issue.nodeKey}</span> : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PageLoading({ error }) {
  return (
    <div className="studio-fade h-full overflow-hidden bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[22px_22px]">
      <div className="mx-auto w-full max-w-[672px] px-4 pt-16">
        {error ? (
          <div className="rounded-3xl border border-red-400/20 bg-[#1c1c1c] p-10 text-sm text-red-200">Form yüklenemedi. Silinmiş olabilir ya da düzenleme yetkiniz yok.</div>
        ) : (
          <div className="space-y-6 rounded-3xl border border-white/10 bg-[#1c1c1c] p-10">
            <div className="shimmer h-8 w-2/3 rounded-lg" />
            <div className="shimmer h-4 w-1/2 rounded-md" />
            {Array.from({ length: 4 }, (_, index) => <div key={index} className="shimmer h-20 rounded-xl" />)}
          </div>
        )}
      </div>
    </div>
  );
}

function FormArea({ children }) {
  const editor = useOptionalFormEditor();
  return editor ? children(editor) : children(null);
}

function WorkflowStudioContent({ workflow, seed }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const studioSession = useStudioSession();
  const { setName } = useWorkflowContext();
  const { ui, actions: studio } = useStudio();

  const [docs, setDocs] = useState(() => (seed ? { [seed.form.id]: studioSession.open(seed) } : {}));
  const [failedIds, setFailedIds] = useState(() => new Set());
  const docList = useMemo(() => Object.values(docs), [docs]);
  const docStates = useDocStates(docList);
  const stateById = useMemo(() => Object.fromEntries(docList.map((doc, index) => [doc.id, docStates[index]])), [docList, docStates]);

  const formsById = useMemo(() => Object.fromEntries(Object.entries(stateById).map(([formId, snapshot]) => [
    formId,
    { ...(snapshot.form ?? {}), ...snapshot.view, id: formId },
  ])), [stateById]);

  const loadDoc = useCallback((formId) => {
    if (!formId) return null;
    return studioSession.load(formId).then(
      (doc) => {
        setDocs((current) => (current[formId] ? current : { ...current, [formId]: doc }));
        return doc;
      },
      (error) => {
        setFailedIds((current) => new Set(current).add(formId));
        throw error;
      },
    );
  }, [studioSession]);

  const { state: flowState } = useWorkflowEditor();
  const pendingIds = useMemo(
    () => new Set(flowState.nodes.map((node) => node.formId).filter((formId) => formId && !docs[formId] && !failedIds.has(formId))),
    [flowState.nodes, docs, failedIds],
  );

  const wf = useWorkflowStudio({
    workflow,
    forms: formsById,
    loadingFormIds: pendingIds,
    onCreated: (id) => window.history.replaceState(null, "", `/admin/workflows/${id}/edit`),
  });
  const { state, dispatch, membershipOf } = wf;

  const uiRef = useRef(ui);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [discardingFlow, setDiscardingFlow] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [stepMenu, setStepMenu] = useState(null);
  const isPhone = useMediaQuery("(max-width: 767px)");
  const [savingAll, setSavingAll] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [mapEntry, setMapEntry] = useState(null);
  const [mapExit, setMapExit] = useState(null);
  const [arrival, setArrival] = useState(null);
  const pageCardRef = useRef(null);
  const exitRef = useRef(null);
  const swappingRef = useRef(false);
  const switchRef = useRef(null);
  const pendingRef = useRef(null);

  useEffect(() => {
    uiRef.current = ui;
  });

  useEffect(() => {
    state.nodes.forEach((node) => {
      if (node.formId && !docs[node.formId] && !failedIds.has(node.formId)) loadDoc(node.formId)?.catch(() => {});
    });
  }, [state.nodes, docs, failedIds, loadDoc]);

  useEffect(() => {
    setName(state.name);
  }, [state.name, setName]);

  useEffect(() => {
    if (!savedFlash) return undefined;
    const timer = setTimeout(() => setSavedFlash(false), 2200);
    return () => clearTimeout(timer);
  }, [savedFlash]);

  const unsaved = docStates.some((snapshot) => snapshot.pending) || !state.isSaved || wf.metaDirty;

  useEffect(() => {
    if (!unsaved) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  const activeFormId = ui.activeFormId;
  const activeDoc = activeFormId ? docs[activeFormId] ?? null : null;
  const activeServerMembership = activeFormId ? stateById[activeFormId]?.form?.workflow ?? null : null;
  const activeMembership = useMemo(
    () => (activeFormId ? membershipOf(activeFormId, activeServerMembership) : undefined),
    [activeFormId, activeServerMembership, membershipOf],
  );
  const stages = useMemo(() => stagesOf(state.nodes, state.transitions), [state.nodes, state.transitions]);
  const activeNode = state.nodes.find((node) => node.formId === activeFormId) ?? null;
  const overviewFormId = activeFormId ?? state.nodes.find((node) => node.isStart)?.formId ?? state.nodes[0]?.formId ?? null;

  const typingField = useTypingField();
  usePresenceBroadcast(studioSession, activeDoc?.id ?? null, ui.selection, typingField);
  useCursorBroadcast(studioSession, ui.mode === "page" ? activeDoc?.id ?? null : null);
  const peopleByForm = usePresenceMembers(studioSession, docList.map((doc) => doc.id));
  const commentCounts = useOpenThreadCounts(studioSession, docList.map((doc) => doc.id));
  const activeOthers = (activeFormId && peopleByForm[activeFormId]) || NO_MEMBERS;
  const revealRef = useRef(null);

  const dirtyIds = state.nodes
    .filter((node) => stateById[node.formId]?.dirty || stateById[node.formId]?.pending)
    .map((node) => node.formId);

  useEffect(() => {
    if (activeFormId && !state.nodes.some((node) => node.formId === activeFormId)) {
      studio.activate(null, { mode: "map" });
    }
  }, [activeFormId, state.nodes, studio]);

  useEffect(() => {
    if (!state.id) return;
    const next = activeFormId
      ? `/admin/forms/${activeFormId}/edit${ui.mode === "map" ? "?view=map" : ""}`
      : `/admin/workflows/${state.id}/edit`;
    if (`${window.location.pathname}${window.location.search}` !== next) window.history.replaceState(null, "", next);
  }, [state.id, ui.mode, activeFormId]);

  const prefetchStudioForm = useCallback((formId) => {
    if (!formId || docs[formId]) return docs[formId] ? Promise.resolve(docs[formId]) : null;
    return loadDoc(formId);
  }, [docs, loadDoc]);

  const activateForm = useCallback((formId, { panel } = {}) => {
    if (!formId) return;
    const current = uiRef.current;
    if (current.activeFormId) studio.remember(current.activeFormId, { selection: current.selection });
    const memory = studio.recall(formId);
    studio.activate(formId, {
      mode: "page",
      selection: panel === "timing" ? { kind: "none", focusTiming: Date.now() } : memory?.selection ?? NONE,
    });
  }, [studio]);

  const showMap = useCallback(() => {
    const current = uiRef.current;
    if (swappingRef.current || switchRef.current) return;
    if (current.activeFormId) studio.remember(current.activeFormId, { selection: current.selection });
    exitRef.current = null;
    const open = (entry) => {
      setMapEntry(entry);
      setMapExit(null);
      studio.setMode("map");
    };
    const box = document.querySelector("[data-studio-center]")?.getBoundingClientRect();
    const page = current.mode === "page" ? document.querySelector("[data-studio-page]") : null;
    const card = page?.querySelector(".studio-card")?.getBoundingClientRect();
    if (isPhone && card) {
      swappingRef.current = true;
      swapView(() => open(null), { duration: 320, variant: "morph-out" }).then(() => { swappingRef.current = false; });
      return;
    }
    if (!box || !card || !current.activeFormId || isPhone || prefersReducedMotion()) {
      open(null);
      return;
    }
    const formId = current.activeFormId;
    const rect = { left: card.left - box.left, top: card.top - box.top, width: card.width };
    pageCardRef.current = { ...rect, baseTop: rect.top + page.scrollTop, containerWidth: box.width, phone: current.devices[formId] === "phone" };
    const frameWidth = pageCardRect(box.width).width;
    const scale = rect.width / frameWidth;
    const gap = page.querySelector("[data-description-gap]");
    const echo = { height: card.height / scale, gap: gap ? (gap.offsetHeight + parseFloat(getComputedStyle(gap).marginTop)) / scale : 0 };
    swappingRef.current = true;
    swapView(() => open({ formId, rect, frameWidth, echo }), { duration: 120 }).then(() => { swappingRef.current = false; });
  }, [isPhone, studio]);

  const backToPage = useCallback(() => {
    if (uiRef.current.activeFormId) studio.setMode("page");
  }, [studio]);

  const switchPage = useCallback(async (formId) => {
    const current = uiRef.current;
    const column = document.querySelector("[data-studio-column]");
    if (formId === current.activeFormId) {
      if (!switchRef.current) return;
      switchRef.current = null;
      pendingRef.current = null;
      if (!column) return;
      column.style.pointerEvents = "";
      column.animate([{ transform: "none", opacity: 1 }], { duration: SLIDE_IN_MS, easing: SLIDE_IN_EASING, fill: "forwards" }).finished
        .then(() => column.getAnimations().forEach((animation) => animation.cancel()), () => {});
      return;
    }
    const ready = prefetchStudioForm(formId);
    if (!column || prefersReducedMotion()) {
      activateForm(formId);
      return;
    }
    const direction = slideDirection(stages, current.activeFormId, formId);
    const token = {};
    switchRef.current = token;
    pendingRef.current = formId;
    column.style.pointerEvents = "none";
    const out = column.animate(
      [{ transform: `translate(${-direction.x * SLIDE_PX}px, ${-direction.y * SLIDE_PX}px)`, opacity: 0 }],
      { duration: SLIDE_OUT_MS, easing: SLIDE_OUT_EASING, fill: "forwards" },
    );
    const loaded = ready ? Promise.race([ready.catch(() => null), new Promise((resolve) => setTimeout(resolve, SWITCH_WAIT_MS))]) : null;
    await Promise.all([out.finished.catch(() => null), loaded]);
    if (switchRef.current !== token) return;
    switchRef.current = null;
    pendingRef.current = null;
    swapView(() => {
      setArrival({ formId, slide: direction });
      activateForm(formId);
    }, { duration: 200 });
  }, [activateForm, prefetchStudioForm, stages]);

  const openFromList = useCallback(async (formId) => {
    const ready = prefetchStudioForm(formId);
    if (ready) await Promise.race([ready.catch(() => null), new Promise((resolve) => setTimeout(resolve, SWITCH_WAIT_MS))]);
    const step = document.querySelector(`[data-flow-step="${CSS.escape(formId)}"]`);
    if (step) step.style.viewTransitionName = "studio-step";
    swapView(() => {
      if (formId === uiRef.current.activeFormId) backToPage();
      else activateForm(formId);
    }, { duration: 320, variant: "morph-in" });
  }, [activateForm, backToPage, prefetchStudioForm]);

  const requestPage = useCallback((formId) => {
    if (!formId) return;
    const current = uiRef.current;
    if (current.mode === "page") {
      switchPage(formId);
      return;
    }
    if (isPhone) {
      openFromList(formId);
      return;
    }
    const box = document.querySelector("[data-studio-center]")?.getBoundingClientRect();
    const scrollTop = studio.recall(formId)?.scrollTop ?? 0;
    const phone = current.devices[formId] === "phone";
    const last = pageCardRef.current;
    const rect = !box ? null
      : last && last.phone === phone && Math.abs(last.containerWidth - box.width) < 1
        ? { left: last.left, top: last.baseTop - scrollTop, width: last.width }
        : pageCardRect(box.width, { phone, scrollTop });
    const exit = { formId, rect, ready: prefetchStudioForm(formId) };
    exitRef.current = exit;
    setMapExit(exit);
  }, [isPhone, openFromList, prefetchStudioForm, studio, switchPage]);

  const finishExit = useCallback(async (exit) => {
    if (exit.ready) await exit.ready.catch(() => null);
    if (exitRef.current !== exit) return;
    exitRef.current = null;
    swapView((done) => {
      setMapExit(null);
      setArrival({ formId: exit.formId, settle: done });
      if (exit.formId === uiRef.current.activeFormId) backToPage();
      else activateForm(exit.formId);
    });
  }, [activateForm, backToPage]);

  const clearArrival = useCallback(() => setArrival(null), []);

  const stepBy = useCallback((direction) => {
    const ordered = stages.ordered;
    if (ordered.length < 2) return;
    const base = pendingRef.current ?? uiRef.current.activeFormId;
    const index = ordered.findIndex((node) => node.formId === base);
    const next = ordered[Math.min(ordered.length - 1, Math.max(0, index + direction))];
    if (next && next.formId !== base) requestPage(next.formId);
  }, [stages, requestPage]);

  const changedDocs = useCallback(() => docList.filter((doc) => {
    const snapshot = doc.getSnapshot();
    return snapshot.canEdit && (snapshot.dirty || snapshot.pending);
  }), [docList]);

  const saveForms = useCallback(async () => {
    const targets = changedDocs();
    if (targets.length === 0) return;

    setSavingAll(true);
    setSaveFailed(false);
    let failed = 0;
    let lastError = null;

    for (const doc of targets) {
      try {
        publishedQueries(queryClient, await doc.publish());
      } catch (error) {
        failed += 1;
        lastError = error;
      }
    }

    setSavingAll(false);
    if (failed > 0) {
      setSaveFailed(true);
      const message = targets.length === 1 ? lastError?.message ?? "Kaydedilemedi" : failed === targets.length ? "Kaydedilemedi" : `${failed} form kaydedilemedi`;
      studio.toast(message, "red");
      return;
    }
    setLastSavedAt(new Date());
    setSavedFlash(true);
    if (targets.length > 1) studio.toast(`${targets.length} form birlikte kaydedildi`);
  }, [changedDocs, queryClient, studio]);

  const saveFlow = useCallback(async () => {
    const firstLive = !wf.isLive;
    const attempt = async () => {
      const entries = await Promise.all(changedDocs().map(async (doc) => ({ doc, formId: doc.id, workingVersion: await doc.syncedVersion() })));
      const data = await wf.save(entries.map(({ formId, workingVersion }) => ({ formId, workingVersion })));
      return { entries, data };
    };

    setSavingAll(true);
    setSaveFailed(false);
    try {
      const { entries, data } = await attempt().catch((error) => {
        if (error?.status === 409 && error?.body?.data?.failedFormId) return attempt();
        throw error;
      });
      (data.forms ?? []).forEach((form) => {
        const entry = entries.find((item) => item.formId === form.id);
        if (entry) entry.doc.applySaved(form, entry.workingVersion);
        publishedQueries(queryClient, form);
      });
      setConfirmOpen(false);
      setLastSavedAt(new Date());
      setSavedFlash(true);
      if (firstLive) studio.toast("Akış başvurulara açıldı");
    } catch (error) {
      setConfirmOpen(false);
      setSaveFailed(true);
      const body = error?.body?.data;
      const problems = body?.validation?.errors?.length ?? 0;
      if (problems > 0) {
        setIssuesOpen(true);
        studio.toast(`Kaydedilemedi: akışta ${problems} sorun var`, "red");
      } else if (body?.failedFormId) {
        const title = docs[body.failedFormId]?.getView().title?.trim()
          || state.nodes.find((node) => node.formId === body.failedFormId)?.formTitle
          || "Bir form";
        studio.toast(`${title}: ${error.message}`, "red");
      } else {
        studio.toast(error?.message ?? "Kaydedilemedi", "red");
      }
    } finally {
      setSavingAll(false);
    }
  }, [changedDocs, docs, queryClient, state.nodes, studio, wf]);

  const canSaveFlow = !workflow?.id || Boolean(workflow?.canEdit);

  const requestSave = useCallback(() => {
    if (savingAll) return;
    if (!canSaveFlow) {
      saveForms();
      return;
    }
    if (!wf.flowDirty && changedDocs().length === 0) return;
    if (!wf.isLive) {
      setConfirmOpen(true);
      return;
    }
    saveFlow();
  }, [canSaveFlow, changedDocs, saveFlow, saveForms, savingAll, wf.flowDirty, wf.isLive]);

  const discardFlowDraft = async () => {
    setDiscardingFlow(true);
    try {
      if (await wf.discardFlow()) studio.toast("Akış taslağı silindi. Ctrl+Z geri alır.");
    } catch (error) {
      studio.toast(error?.message ?? "Akış taslağı silinemedi", "red");
    } finally {
      setDiscardingFlow(false);
    }
  };

  const discardDraft = () => {
    if (activeDoc?.discard()) studio.toast("Taslak silindi. Ctrl+Z geri alır.");
  };

  const people = uniquePeople(state.nodes.flatMap((node) => (peopleByForm[node.formId] ?? []).map((member) => ({
    ...member,
    formId: node.formId,
    where: whereOf(member, { fields: stateById[node.formId]?.view?.schema ?? [], formTitle: node.formTitle || "Adsız form" }),
  }))));

  const goToPerson = (person) => {
    const fieldId = person.selection?.[0] ?? null;
    const color = colorOf(person.userId);
    if (person.formId === uiRef.current.activeFormId && uiRef.current.mode === "page") {
      if (!fieldId || !revealField(fieldId, color)) studio.toast(`${person.name} bu adımda, bir soru seçmemiş`);
      return;
    }
    revealRef.current = fieldId ? { formId: person.formId, fieldId, color } : null;
    requestPage(person.formId);
  };

  const { data: availableData, isLoading: availableLoading } = useAvailableFormsQuery(state.id, { enabled: Boolean(stepMenu) && Boolean(state.id) });
  const { data: candidateData, isLoading: candidateLoading } = useCandidateFormsQuery({ enabled: Boolean(stepMenu) && !state.id });
  const pickerForms = state.id ? listOf(availableData) : listOf(candidateData);

  const addStep = async (choice) => {
    const menu = stepMenu;
    setStepMenu(null);
    try {
      const form = choice === NEW_FORM ? await wf.createBlankForm(blankTitle(state.nodes)) : choice;
      dispatch({ type: "ADD_NODE", form, from: menu?.from ?? null });
      if (choice === NEW_FORM) requestPage(form.id);
      else studio.toast(`${form.title || "Form"} adımı eklendi`);
    } catch {
      studio.toast("Adım eklenemedi. Tekrar deneyin.", "red");
    }
  };

  useEffect(() => {
    const reveal = revealRef.current;
    if (!reveal || ui.mode !== "page" || activeFormId !== reveal.formId || !activeDoc) return undefined;
    const timer = setTimeout(() => {
      revealRef.current = null;
      revealField(reveal.fieldId, reveal.color);
    }, REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, [ui.mode, activeFormId, activeDoc]);

  const isOwner = Boolean(workflow?.owner?.id) && workflow?.owner?.id === session?.user?.id;
  const flowName = state.name || "Adsız akış";
  const inPage = ui.mode === "page" && Boolean(activeFormId);
  const formReady = Boolean(activeDoc);

  useEffect(() => {
    if (ui.mode !== "page" || !formReady || !activeNode) return undefined;
    const timer = setTimeout(() => {
      const index = stages.ordered.findIndex((node) => node.formId === activeNode.formId);
      const targets = new Set([stages.ordered[index - 1]?.formId, stages.ordered[index + 1]?.formId]);
      state.transitions.forEach((transition) => {
        if (transition.sourceNodeKey !== activeNode.nodeKey || !transition.targetNodeKey) return;
        targets.add(state.nodes.find((node) => node.nodeKey === transition.targetNodeKey)?.formId);
      });
      targets.forEach((formId) => {
        if (!formId || formId === activeNode.formId) return;
        prefetchStudioForm(formId)?.catch(() => {});
        queryClient.prefetchQuery(formInfoQuery(formId));
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [ui.mode, formReady, activeNode, stages, state.transitions, state.nodes, prefetchStudioForm, queryClient]);

  const flowContext = { wf, onOpenForm: requestPage, onOpenFlowPage: () => state.id && router.push(`/admin/workflows/${state.id}`) };
  const picker = {
    open: Boolean(stepMenu),
    onOpen: (event) => setStepMenu({ anchor: event?.currentTarget ?? null }),
    render: () => null,
  };
  const ownershipControl = state.id && isOwner ? { workflowId: state.id, ownerId: workflow.owner.id, onTransferred: () => router.push("/admin/workflows") } : null;
  const flowKeys = {
    inFlow: true,
    hasActiveForm: Boolean(activeFormId),
    onStep: stepBy,
    onToggleMap: () => (uiRef.current.mode === "map" ? requestPage(uiRef.current.activeFormId) : showMap()),
    onShowMap: showMap,
    onBackToPage: () => requestPage(uiRef.current.activeFormId),
    onUndoFlow: () => dispatch({ type: "UNDO" }),
  };
  const dirtyCount = dirtyIds.length;

  const selectedMapNode = state.nodes.find((node) => node.nodeKey === state.selectedKey) ?? null;
  const flowCrumb = { label: flowName, onClick: () => (ui.mode === "map" ? dispatch({ type: "SELECT", nodeKey: null }) : studio.select({ kind: "flow" })) };

  const renderLayout = (editor) => {
    const formState = editor?.state ?? null;
    const fields = formState?.schema ?? [];

    let crumbs;
    let inspector;
    if (!inPage) {
      crumbs = selectedMapNode ? [flowCrumb, { label: selectedMapNode.formTitle || "Adsız form" }] : [{ label: flowName }];
      inspector = selectedMapNode
        ? <RoutesBody key={selectedMapNode.nodeKey} flow={flowContext} node={selectedMapNode} />
        : <FlowRootBody flow={flowContext} picker={picker} ownershipControl={ownershipControl} />;
    } else if (ui.selection.kind === "flow") {
      crumbs = [{ label: flowName }];
      inspector = <FlowRootBody flow={flowContext} picker={picker} ownershipControl={ownershipControl} />;
    } else if (ui.selection.kind === "routes" && activeNode) {
      crumbs = [flowCrumb, { label: formState ? formCrumb(formState) : activeNode.formTitle, onClick: () => studio.select(NONE) }, { label: "Yönlendirme" }];
      inspector = <RoutesBody key={activeNode.nodeKey} flow={flowContext} node={activeNode} />;
    } else if (formState) {
      const crumb = ui.fill ? "Doldurma" : selectionCrumb(ui.selection, fields);
      crumbs = [flowCrumb, { label: formCrumb(formState), onClick: () => studio.select(NONE) }, ...(crumb ? [{ label: crumb }] : [])];
      inspector = (
        <FormInspectorBody flow={activeNode ? { wf, node: activeNode, onOpenRoutes: () => studio.select({ kind: "routes" }) } : null}
          managedActions={{
            acceptance: state.id ? () => router.push(`/admin/workflows/${state.id}`) : undefined,
            multiple: () => studio.select({ kind: "flow" }),
            review: () => studio.select({ kind: "routes" }),
            ownership: () => studio.select({ kind: "flow" }),
          }}
        />
      );
    } else {
      crumbs = [flowCrumb, { label: activeNode?.formTitle ?? "Form" }];
      inspector = <div className="space-y-3 p-4">{Array.from({ length: 3 }, (_, index) => <div key={index} className="shimmer h-16 rounded-lg" />)}</div>;
    }

    const questionCounts = Object.fromEntries(Object.entries(wf.schemasByFormId).map(([formId, form]) => [formId, form.schema.filter((field) => field?.type !== "separator").length]));

    const outline = (
      <>
        <OutlineHeader title={flowName} inFlow onOpenPalette={() => studio.setPalette(true)} onOpenFlowPage={state.id ? flowContext.onOpenFlowPage : null} />
        <OutlineSteps nodes={stages.ordered} stages={stages} activeFormId={activeFormId} dirtyIds={dirtyIds} mapActive={ui.mode === "map"} peopleByForm={peopleByForm}
          questionCounts={questionCounts} onActivate={requestPage} onToggleMap={flowKeys.onToggleMap}
        />
        {formState ? (
          <OutlineQuestions onShowPage={() => { if (ui.mode === "map") backToPage(); }}
            onAdd={(anchor, index, options) => { if (ui.mode === "map") backToPage(); studio.openMenu({ anchor, index, ...options }); }}
          />
        ) : (
          <p className="px-3 pt-3 text-2xs text-neutral-600">{activeFormId ? "Form yükleniyor..." : "Bir adıma tıklayınca soruları burada görürsün."}</p>
        )}
      </>
    );

    const center = ui.mode === "map" || !activeFormId ? (
      isPhone ? (
        <StudioFlowList nodes={state.nodes} transitions={state.transitions} stages={stages} questionCounts={questionCounts} dirtyIds={dirtyIds}
          activeFormId={activeFormId} onOpenForm={requestPage} onBack={() => requestPage(activeFormId)} onAddStep={(anchor) => setStepMenu({ anchor })}
        />
      ) : (
        <StudioMap wf={wf} flowName={flowName} activeFormId={activeFormId} selectedKey={state.selectedKey} peopleByForm={peopleByForm} commentCounts={commentCounts}
          onOpenForm={requestPage} onSelectNode={(nodeKey) => dispatch({ type: "SELECT", nodeKey })} onBack={() => requestPage(activeFormId)}
          entry={mapEntry} exitTo={mapExit} onExitDone={finishExit}
          onAddStep={(anchor) => setStepMenu({ anchor })} onToast={studio.toast}
          onOverview={overviewFormId ? () => router.push(`/admin/forms/${overviewFormId}`) : null}
        />
      )
    ) : formState ? (
      <StudioPage inFlow userName={session?.user?.fullName} onShowMap={showMap} arrival={arrival?.formId === activeFormId ? arrival : null} onArrived={clearArrival}
        onOverview={activeFormId ? () => router.push(`/admin/forms/${activeFormId}`) : null}
        cardDecor={activeNode ? <FlowCardDecor node={activeNode} transitions={state.transitions} /> : null}
        stepInfo={activeNode ? { flowName, stage: stages.depths.get(activeNode.nodeKey) ?? null, total: stages.total, isStart: activeNode.isStart } : null}
        nextBlock={activeNode ? (
          <FlowNextBlock node={activeNode} nodes={state.nodes} transitions={state.transitions} labelForTransition={wf.labelForTransition}
            onRoute={(trigger, targetKey) => {
              const result = wf.setSingleRoute(activeNode.nodeKey, trigger, targetKey);
              if (result && !result.ok) studio.toast(result.reason, "red");
            }}
            onActivate={requestPage}
            onShowMap={showMap}
            onEditRoutes={() => studio.select({ kind: "routes" })}
            onAddStep={(trigger, anchor) => setStepMenu({ anchor, from: { sourceNodeKey: activeNode.nodeKey, trigger } })}
          />
        ) : null}
      />
    ) : (
      <PageLoading error={failedIds.has(activeFormId)} />
    );

    const formStatus = formState ? studioStatusOf(formState) : null;
    const draftTimes = [formStatus?.draftSavedAt, wf.saveStatus.draftSavedAt].filter(Boolean).map((value) => new Date(value).getTime());
    const saveStatus = (
      <HeaderStatusPill dirty={dirtyCount > 0 || wf.flowDirty || Boolean(formStatus?.dirty)} draftSyncStatus={formStatus?.draftSyncStatus ?? "idle"}
        draftSavedAt={draftTimes.length > 0 ? new Date(Math.max(...draftTimes)) : null} offline={Boolean(formStatus?.offline)}
        isSaving={savingAll || wf.saveStatus.isSaving} isFailed={saveFailed || wf.saveStatus.isFailed}
        lastSavedAt={lastSavedAt ?? formStatus?.lastSavedAt ?? null}
        publishedFlash={savedFlash} flashLabel="Kaydedildi"
      />
    );

    const formUndo = Boolean(formState) && inPage && formState.canUndo;

    return (
      <StudioPresenceProvider members={activeOthers}>
      <StudioLayout
        outline={outline}
        center={(
          <>
            {center}
            <RemoteCursors session={studioSession} formId={inPage && formState ? activeFormId : null} members={activeOthers} />
            {issuesOpen && wf.issues.length > 0 ? (
              <IssuesPanel issues={wf.issues} nodes={state.nodes} onClose={() => setIssuesOpen(false)}
                onPick={(nodeKey) => { setIssuesOpen(false); showMap(); dispatch({ type: "SELECT", nodeKey }); }}
              />
            ) : null}
          </>
        )}
        inspectorHeader={<Crumbs items={crumbs} />}
        inspector={inspector}
        overlays={(
          <>
            {formState ? <FormKeys flow={flowKeys} onSave={requestSave} /> : <FlowKeys flow={flowKeys} onSave={requestSave} />}
            <StudioHeaderActions saveStatus={saveStatus} people={people} onGoToPerson={goToPerson}
              fill={inPage && formState ? { active: ui.fill, onToggle: studio.toggleFill } : null}
              onShare={inPage && formState?.id ? () => setShareOpen(true) : null}
              draft={inPage
                ? { has: Boolean(formState?.canEdit && formState?.dirty && !formState?.neverPublished), onDiscard: discardDraft, discarding: false }
                : { has: canSaveFlow && wf.isLive && wf.flowDirty, onDiscard: discardFlowDraft, discarding: discardingFlow }}
              onUndo={() => (formUndo ? editor.doc.undo() : dispatch({ type: "UNDO" }))}
              canUndo={formUndo || state._history.length > 0}
              onRedo={inPage && formState ? () => editor.doc.redo() : null}
              canRedo={Boolean(formState?.canRedo)}
              secondary={state.id ? { label: "Akışı arşivle", icon: Archive, onClick: () => setArchiveOpen(true), disabled: wf.archiveState.isPending } : null}
              issues={{ count: wf.issues.length, onShow: () => setIssuesOpen((open) => !open) }}
              onSave={requestSave} isSaving={savingAll} isError={saveFailed} saveExtra={dirtyCount > 1 ? `${dirtyCount} form` : null}
            />
            <AnimatePresence>
            {ui.palette ? (
              <StudioPalette key="palette"
                current={{
                  workflowId: state.id,
                  workflowName: flowName,
                  activeFormId,
                  steps: stages.ordered.map((node) => ({ formId: node.formId, title: node.formTitle, meta: `${stages.depths.get(node.nodeKey) ?? "?"}. adım` })),
                }}
                onPickStep={(formId) => { studio.setPalette(false); requestPage(formId); }}
                onNavigate={(href) => { studio.setPalette(false); router.push(href); }}
                onClose={() => studio.setPalette(false)}
              />
            ) : null}
            </AnimatePresence>
            <AnimatePresence>
            {stepMenu ? (
              <StudioFormPicker key="step-picker" anchor={stepMenu.anchor} heading={stepMenu.from ? "Bu çıkıştan hangi form açılsın?" : "Akışa hangi form eklensin?"}
                forms={pickerForms} isLoading={state.id ? availableLoading : candidateLoading} usedIds={state.nodes.map((node) => node.formId)}
                onPick={addStep} onClose={() => setStepMenu(null)}
              />
            ) : null}
            </AnimatePresence>
            <ApprovalOverlay open={confirmOpen} preset="publish-workflow" context={{ highlights: wf.lockedHighlights, isPending: savingAll }}
              onApprove={saveFlow}
              onReject={() => setConfirmOpen(false)}
            />
            <ApprovalOverlay open={archiveOpen} preset="archive-workflow" context={{ isPending: wf.archiveState.isPending }}
              onApprove={() => wf.archive({ onSuccess: () => router.push("/admin/workflows"), onError: () => setArchiveOpen(false) })}
              onReject={() => setArchiveOpen(false)}
            />
            {formState?.id ? (
              <FormShareDialog open={shareOpen} onClose={() => setShareOpen(false)} formId={formState.id} formTitle={formState.title} formStatus={formState.status}
                allowAnonymous={formState.allowAnonymousResponses} canEdit={Number(formState.userRole) >= 2}
              />
            ) : null}
          </>
        )}
      />
      </StudioPresenceProvider>
    );
  };

  if (!activeDoc) return renderLayout(null);

  return (
    <FormEditorProvider key={activeFormId} doc={activeDoc} membership={activeMembership}>
      <FormArea>{(editor) => renderLayout(editor)}</FormArea>
    </FormEditorProvider>
  );
}

function WorkflowStudioSession(props) {
  const { actions: studio } = useStudio();

  return (
    <StudioSessionProvider onNotice={(text, tone) => studio.toast(text, tone === "red" ? "red" : undefined)} fallback={<StudioSkeleton />}>
      <WorkflowStudioContent {...props} />
    </StudioSessionProvider>
  );
}

export default function WorkflowStudio({ workflow, initialFormId = null, initialView = "page", seed = null }) {
  const definition = workflow?.draft ?? workflow?.published ?? null;
  const nodes = definition?.nodes ?? [];
  const requested = initialFormId && nodes.some((node) => node.formId === initialFormId) ? initialFormId : null;
  const startFormId = requested ?? nodes.find((node) => node.isStart)?.formId ?? nodes[0]?.formId ?? null;
  const mode = initialView === "map" || !startFormId ? "map" : "page";

  return (
    <WorkflowEditorProvider workflow={workflow}>
      <StudioProvider initialFormId={startFormId} initialMode={mode}>
        <WorkflowStudioSession workflow={workflow} seed={seed && seed.form?.id === requested ? seed : null} />
      </StudioProvider>
    </WorkflowEditorProvider>
  );
}
