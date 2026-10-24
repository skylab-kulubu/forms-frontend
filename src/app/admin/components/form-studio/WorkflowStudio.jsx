"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { Archive, X } from "lucide-react";
import { useWorkflowContext } from "../../providers";
import { FormEditorProvider, hasDraftChanges, markStateSaved, useFormEditor, useOptionalFormEditor } from "../form-editor/FormEditorContext";
import { useDraftAutoSave } from "../form-editor/hooks/useDraftAutoSave";
import { HeaderStatusPill } from "../form-editor/components/EditorHeaderActions";
import { WorkflowEditorProvider } from "../workflow-editor/WorkflowEditorContext";
import { validationMessage } from "../workflow-editor/workflow-copy";
import ApprovalOverlay from "../ApprovalOverlay";
import FormShareDialog from "../share/FormShareDialog";
import { fetchFormById, useFormMutation } from "@/lib/hooks/useFormAdmin";
import { formInfoQuery } from "@/lib/hooks/useFormContext";
import { useAvailableFormsQuery, useCandidateFormsQuery } from "@/lib/hooks/useWorkflowAdmin";
import { request } from "@/lib/apiClient";
import { NONE, StudioProvider, useStudio } from "./StudioContext";
import StudioLayout from "./StudioLayout";
import StudioPage, { pageCardRect } from "./StudioPage";
import StudioMap, { FlowCardDecor } from "./StudioMap";
import StudioFlowList from "./StudioFlowList";
import StudioPalette from "./StudioPalette";
import StudioHeaderActions from "./StudioHeaderActions";
import StudioFormPicker, { NEW_FORM } from "./StudioFormPicker";
import { FlowNextBlock } from "./StudioNextBlock";
import { OutlineHeader, OutlineQuestions, OutlineSteps } from "./StudioOutline";
import { Crumbs, FlowRootBody, FormInspectorBody, RoutesBody, formCrumb, selectionCrumb } from "./StudioInspector";
import { FlowKeys, FormKeys } from "./StudioKeys";
import { useWorkflowStudio } from "./useWorkflowStudio";
import { useMediaQuery } from "./useMediaQuery";
import { slideDirection, stagesOf } from "./studio-flow";
import { SLIDE_IN_EASING, SLIDE_IN_MS, SLIDE_OUT_EASING, SLIDE_OUT_MS, SLIDE_PX, prefersReducedMotion, swapView } from "./studio-motion";
import { editorDataOf, formPayloadOf, liveFormOf } from "./studio-save";

const PREFETCH_TTL_MS = 2 * 60_000;
const SWITCH_WAIT_MS = 1500;

const fetchDraft = (formId) => request(`/api/admin/forms/${formId}/draft`).then((response) => response?.data ?? null).catch(() => null);

const draftQueryKey = (formId) => ["studio-draft", formId];

async function loadStudioForm(queryClient, formId, knownDraft) {
  const [formPayload, draft] = await Promise.all([
    queryClient.fetchQuery({ queryKey: ["form", formId], queryFn: () => fetchFormById(formId), staleTime: 60_000, retry: false }),
    knownDraft === undefined ? fetchDraft(formId) : knownDraft,
  ]);
  return { form: formPayload?.data ?? formPayload, draft };
}

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

function ActiveFormBridge({ formId, hasDraft, onSnapshot, onDraftInfo, handleRef }) {
  const { state, dispatch } = useFormEditor();
  const { hasServerDraft, syncStatus, draftSavedAt } = useDraftAutoSave(formId, state, hasDraft);

  useEffect(() => {
    onSnapshot(formId, state);
  }, [formId, state, onSnapshot]);

  useEffect(() => {
    onDraftInfo({ hasServerDraft, syncStatus, draftSavedAt });
  }, [hasServerDraft, syncStatus, draftSavedAt, onDraftInfo]);

  useEffect(() => {
    handleRef.current = { formId, state, dispatch };
  });

  useEffect(() => () => { handleRef.current = null; }, [handleRef]);

  return null;
}

function IssuesPanel({ issues, nodes, onPick, onClose }) {
  return (
    <div className="absolute inset-x-3 bottom-16 z-30 mx-auto max-h-56 max-w-xl overflow-y-auto rounded-lg border border-red-400/25 bg-neutral-900/95 p-3 shadow-xl backdrop-blur scrollbar">
      <div className="flex items-center gap-2">
        <span className="text-2xs font-medium text-red-200">Yayınlamayı engelleyen {issues.length} sorun</span>
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
          <div className="rounded-3xl border border-red-400/20 bg-[#1a1a1a] p-10 text-sm text-red-200">Form yüklenemedi. Silinmiş olabilir ya da düzenleme yetkiniz yok.</div>
        ) : (
          <div className="space-y-6 rounded-3xl border border-white/10 bg-[#1a1a1a] p-10">
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
  const { setName } = useWorkflowContext();
  const { ui, actions: studio } = useStudio();

  const [liveForm, setLiveForm] = useState(null);
  const wf = useWorkflowStudio({
    workflow,
    liveForm,
    onCreated: (id) => window.history.replaceState(null, "", `/admin/workflows/${id}/edit`),
  });
  const { state, dispatch } = wf;

  const cacheRef = useRef(new Map());
  const activeHandleRef = useRef(null);
  const uiRef = useRef(ui);
  const [activeInit, setActiveInit] = useState({ formId: ui.activeFormId, state: null, data: null });
  const [dirtyMap, setDirtyMap] = useState({});
  const [draftInfo, setDraftInfo] = useState({ hasServerDraft: false, syncStatus: "idle", draftSavedAt: null });
  const [publishOpen, setPublishOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [stepMenu, setStepMenu] = useState(null);
  const isPhone = useMediaQuery("(max-width: 767px)");
  const [savingAll, setSavingAll] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);
  const [mapEntry, setMapEntry] = useState(null);
  const [mapExit, setMapExit] = useState(null);
  const [arrival, setArrival] = useState(null);
  const pageCardRef = useRef(null);
  const exitRef = useRef(null);
  const swappingRef = useRef(false);
  const switchRef = useRef(null);
  const pendingRef = useRef(null);
  const prefetchRef = useRef(new Map());
  const seedRef = useRef(seed);
  const mountedAtRef = useRef(Infinity);
  const [refetchDraftOnMount] = useState(() => (query) => (query.state.dataUpdatedAt >= mountedAtRef.current ? false : "always"));
  const { mutateAsync: saveFormAsync } = useFormMutation();

  useEffect(() => {
    uiRef.current = ui;
  });

  useEffect(() => {
    mountedAtRef.current = Date.now();
    const seeded = seedRef.current;
    if (seeded) queryClient.setQueryData(draftQueryKey(seeded.formId), seeded.draft);
  }, [queryClient]);

  useEffect(() => {
    setName(state.name);
  }, [state.name, setName]);

  useEffect(() => {
    if (!savedFlash) return undefined;
    const timer = setTimeout(() => setSavedFlash(false), 2200);
    return () => clearTimeout(timer);
  }, [savedFlash]);

  const activeFormId = ui.activeFormId;
  const cachedState = activeInit.formId === activeFormId ? activeInit.state : null;
  const stages = useMemo(() => stagesOf(state.nodes, state.transitions), [state.nodes, state.transitions]);
  const activeNode = state.nodes.find((node) => node.formId === activeFormId) ?? null;

  const knownDraftOf = useCallback((formId) => {
    const flag = queryClient.getQueryState(draftQueryKey(formId));
    const fresh = flag?.status === "success" && flag.dataUpdatedAt >= mountedAtRef.current && Date.now() - flag.dataUpdatedAt < PREFETCH_TTL_MS;
    return fresh ? flag.data ?? null : undefined;
  }, [queryClient]);

  const takeStudioForm = useCallback((formId) => {
    const hit = prefetchRef.current.get(formId);
    prefetchRef.current.delete(formId);
    if (hit && Date.now() - hit.at < PREFETCH_TTL_MS) return hit.promise;
    return loadStudioForm(queryClient, formId, knownDraftOf(formId));
  }, [knownDraftOf, queryClient]);

  const prefetchStudioForm = useCallback((formId) => {
    if (!formId || formId === uiRef.current.activeFormId || cacheRef.current.has(formId)) return null;
    const store = prefetchRef.current;
    const hit = store.get(formId);
    if (hit && Date.now() - hit.at < PREFETCH_TTL_MS) return hit.promise;
    const entry = { at: Date.now(), promise: loadStudioForm(queryClient, formId, knownDraftOf(formId)), data: null };
    entry.promise.then((data) => { entry.data = data; }, () => {
      if (store.get(formId) === entry) store.delete(formId);
    });
    store.set(formId, entry);
    return entry.promise;
  }, [knownDraftOf, queryClient]);

  const readyData = activeInit.formId === activeFormId ? activeInit.data : null;
  const loader = useQuery({
    queryKey: ["studio-form", activeFormId],
    queryFn: () => takeStudioForm(activeFormId),
    enabled: Boolean(activeFormId) && !cachedState && !readyData,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });

  const draftFlags = useQueries({
    queries: state.nodes.map((node) => ({
      queryKey: draftQueryKey(node.formId),
      queryFn: () => fetchDraft(node.formId),
      select: Boolean,
      staleTime: 5 * 60_000,
      refetchOnMount: refetchDraftOnMount,
      retry: false,
    })),
  });

  const dirtyIds = state.nodes
    .filter((node, index) => (node.formId in dirtyMap ? dirtyMap[node.formId] : Boolean(draftFlags[index]?.data)))
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

  const handleSnapshot = useCallback((formId, formState) => {
    cacheRef.current.set(formId, formState);
    setLiveForm(liveFormOf(formState));
    const dirty = hasDraftChanges(formState);
    setDirtyMap((current) => (current[formId] === dirty ? current : { ...current, [formId]: dirty }));
  }, []);

  const handleDraftInfo = useCallback((info) => setDraftInfo(info), []);

  const activateForm = useCallback((formId, { panel } = {}) => {
    if (!formId) return;
    const current = uiRef.current;
    if (current.activeFormId) studio.remember(current.activeFormId, { selection: current.selection });
    const memory = studio.recall(formId);
    const hit = prefetchRef.current.get(formId);
    const data = hit?.data && Date.now() - hit.at < PREFETCH_TTL_MS ? hit.data : null;
    if (data) prefetchRef.current.delete(formId);
    setActiveInit({ formId, state: cacheRef.current.get(formId) ?? null, data });
    if (formId !== current.activeFormId) setLiveForm(null);
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

  const saveAll = useCallback(async () => {
    const handle = activeHandleRef.current;
    const tasks = [];
    if (handle?.state && handle.formId) tasks.push({ formId: handle.formId, state: handle.state, active: true });
    cacheRef.current.forEach((cached, formId) => {
      if (formId !== handle?.formId && !cached.isSaved) tasks.push({ formId, state: cached, active: false });
    });
    if (tasks.length === 0) return;

    setSavingAll(true);
    setSaveFailed(false);
    let failed = 0;

    for (const task of tasks) {
      try {
        await saveFormAsync({ id: task.formId, payload: formPayloadOf(task.state), isUpdate: true });
        if (task.active && activeHandleRef.current?.formId === task.formId) {
          activeHandleRef.current.dispatch({ type: "MARK_SAVED", payload: task.state });
        } else {
          cacheRef.current.set(task.formId, markStateSaved(task.state));
        }
        setDirtyMap((current) => ({ ...current, [task.formId]: false }));
        queryClient.setQueryData(draftQueryKey(task.formId), null);
        queryClient.invalidateQueries({ queryKey: ["form", task.formId] });
      } catch {
        failed += 1;
      }
    }

    setSavingAll(false);
    if (failed > 0) {
      setSaveFailed(true);
      studio.toast(failed === tasks.length ? "Kaydedilemedi" : `${failed} form kaydedilemedi`, "red");
      return;
    }
    setLastSavedAt(new Date());
    setSavedFlash(true);
    if (tasks.length > 1) studio.toast(`${tasks.length} form birlikte kaydedildi`);
  }, [saveFormAsync, queryClient, studio]);

  const discardDraft = async () => {
    const handle = activeHandleRef.current;
    if (!handle?.formId) return;
    setIsDiscarding(true);
    try {
      const response = await fetchFormById(handle.formId);
      const form = response?.data ?? response;
      if (form) activeHandleRef.current?.dispatch({ type: "LOAD_FORM", payload: form });
    } finally {
      setIsDiscarding(false);
    }
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

  const requestPublish = () => {
    if (!state.isSaved) {
      studio.toast("Akıştaki değişiklikler kaydediliyor; birkaç saniye sonra tekrar deneyin.");
      return;
    }
    setPublishOpen(true);
  };

  const isOwner = Boolean(workflow?.owner?.id) && workflow?.owner?.id === session?.user?.id;
  const flowName = state.name || "Adsız akış";
  const inPage = ui.mode === "page" && Boolean(activeFormId);
  const loaded = readyData ?? loader.data;
  const formSource = !activeFormId
    ? null
    : cachedState
      ? { initialState: cachedState, hasDraft: hasDraftChanges(cachedState) }
      : loaded?.form
        ? { initialData: editorDataOf(loaded.form), initialDraft: loaded.draft, hasDraft: Boolean(loaded.draft) }
        : null;
  const formReady = Boolean(formSource);

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
        prefetchStudioForm(formId);
        queryClient.prefetchQuery(formInfoQuery(formId));
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [ui.mode, formReady, activeNode, stages, state.transitions, state.nodes, prefetchStudioForm, queryClient]);

  const flowContext = { wf, onOpenForm: requestPage, onRequestPublish: requestPublish, onOpenFlowPage: () => state.id && router.push(`/admin/workflows/${state.id}`) };
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
  const canPublish = Boolean(state.id) && state.nodes.length > 0 && wf.hasDraft;
  const highlights = dirtyCount > 0
    ? [...wf.lockedHighlights, `Kaydedilmemiş ${dirtyCount} form var; yayın formların kayıtlı hallerini kullanır.`]
    : wf.lockedHighlights;

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
        <OutlineSteps nodes={stages.ordered} stages={stages} activeFormId={activeFormId} dirtyIds={dirtyIds} mapActive={ui.mode === "map"}
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
        <StudioMap wf={wf} flowName={flowName} activeFormId={activeFormId} liveForm={liveForm} selectedKey={state.selectedKey}
          onOpenForm={requestPage} onSelectNode={(nodeKey) => dispatch({ type: "SELECT", nodeKey })} onBack={() => requestPage(activeFormId)}
          entry={mapEntry} exitTo={mapExit} onExitDone={finishExit}
          onAddStep={(anchor) => setStepMenu({ anchor })} onToast={studio.toast}
        />
      )
    ) : formState ? (
      <StudioPage inFlow userName={session?.user?.fullName} onShowMap={showMap} arrival={arrival?.formId === activeFormId ? arrival : null} onArrived={clearArrival}
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
      <PageLoading error={loader.isError} />
    );

    const saveStatus = (
      <HeaderStatusPill dirty={dirtyCount > 0 || (formState ? !formState.isSaved : false)} draftSyncStatus={draftInfo.syncStatus} draftSavedAt={draftInfo.draftSavedAt}
        isSaving={savingAll || wf.saveStatus.isSaving} isFailed={saveFailed || wf.saveStatus.isFailed} lastSavedAt={lastSavedAt ?? wf.saveStatus.savedAt}
        publishedFlash={savedFlash || wf.saveStatus.publishedFlash}
      />
    );

    const formUndo = Boolean(formState) && inPage && formState._history.length > 0;

    return (
      <StudioLayout
        outline={outline}
        center={(
          <>
            {center}
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
            {formState ? <FormKeys flow={flowKeys} onSave={saveAll} /> : <FlowKeys flow={flowKeys} onSave={saveAll} />}
            <StudioHeaderActions saveStatus={saveStatus}
              fill={inPage && formState ? { active: ui.fill, onToggle: studio.toggleFill } : null}
              onShare={inPage && formState?.id ? () => setShareOpen(true) : null}
              draft={inPage ? { has: draftInfo.hasServerDraft && formState && hasDraftChanges(formState), onDiscard: discardDraft, discarding: isDiscarding } : null}
              onUndo={() => (formUndo ? editor.dispatch({ type: "UNDO" }) : dispatch({ type: "UNDO" }))}
              canUndo={formUndo || state._history.length > 0}
              secondary={state.id ? { label: "Akışı arşivle", icon: Archive, onClick: () => setArchiveOpen(true), disabled: wf.archiveState.isPending } : null}
              issues={{ count: wf.issues.length, onShow: () => setIssuesOpen((open) => !open) }}
              publish={{ onClick: requestPublish, disabled: !canPublish, pending: wf.publishState.isPending, isError: wf.publishState.isError, error: wf.publishState.error, title: canPublish ? "Akışı yayınla" : "Yayınlanacak değişiklik yok" }}
              onSave={saveAll} isSaving={savingAll} isError={saveFailed} saveExtra={dirtyCount > 1 ? `${dirtyCount} form` : null}
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
            <ApprovalOverlay open={publishOpen} preset="publish-workflow" context={{ highlights, isPending: wf.publishState.isPending }}
              onApprove={() => wf.publish({
                onSuccess: () => {
                  setPublishOpen(false);
                  studio.toast("Akış yayınlandı");
                  queryClient.invalidateQueries({ queryKey: ["workflow", state.id] });
                },
                onError: () => { setPublishOpen(false); setIssuesOpen(true); },
              })}
              onReject={() => setPublishOpen(false)}
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
    );
  };

  if (!formSource) return renderLayout(null);

  return (
    <FormEditorProvider key={activeFormId} initialData={formSource.initialData} initialDraft={formSource.initialDraft ?? null} initialState={formSource.initialState ?? null}>
      <ActiveFormBridge formId={activeFormId} hasDraft={formSource.hasDraft} onSnapshot={handleSnapshot} onDraftInfo={handleDraftInfo} handleRef={activeHandleRef} />
      <FormArea>{(editor) => renderLayout(editor)}</FormArea>
    </FormEditorProvider>
  );
}

export default function WorkflowStudio({ workflow, initialFormId = null, initialView = "page", initialDraft }) {
  const definition = workflow?.draft ?? workflow?.published ?? null;
  const nodes = definition?.nodes ?? [];
  const requested = initialFormId && nodes.some((node) => node.formId === initialFormId) ? initialFormId : null;
  const startFormId = requested ?? nodes.find((node) => node.isStart)?.formId ?? nodes[0]?.formId ?? null;
  const mode = initialView === "map" || !startFormId ? "map" : "page";
  const seed = initialDraft !== undefined && requested ? { formId: requested, draft: initialDraft } : null;

  return (
    <WorkflowEditorProvider workflow={workflow}>
      <StudioProvider initialFormId={startFormId} initialMode={mode}>
        <WorkflowStudioContent workflow={workflow} seed={seed} />
      </StudioProvider>
    </WorkflowEditorProvider>
  );
}
