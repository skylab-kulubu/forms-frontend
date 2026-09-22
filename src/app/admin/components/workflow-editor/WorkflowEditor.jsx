"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueries } from "@tanstack/react-query";
import { X } from "lucide-react";
import { fetchFormById } from "@/lib/hooks/useFormAdmin";
import {
  useArchiveWorkflowMutation, useCreateWorkflowMutation, usePublishWorkflowMutation, useSaveDefinitionMutation,
  useUpdateWorkflowMutation, useWorkflowVersionsQuery, useAvailableFormsQuery,
} from "@/lib/hooks/useWorkflowAdmin";
import { useWorkflowContext } from "../../providers";
import ApprovalOverlay from "../ApprovalOverlay";
import { Drawer, DrawerContent } from "../utils/Drawer";
import { HeaderStatusPill } from "../form-editor/components/EditorHeaderActions";
import { LibraryTrigger } from "../form-editor/components/LibraryTrigger";
import { WorkflowEditorProvider, useWorkflowEditor } from "./WorkflowEditorContext";
import WorkflowCanvas from "./components/WorkflowCanvas";
import WorkflowInspector from "./components/WorkflowInspector";
import WorkflowHeaderActions from "./components/WorkflowHeaderActions";
import { TRIGGER, groupTransitions, toDefinitionPayload } from "./workflow-graph";
import { COMPARISON_SYMBOL, VALUELESS_COMPARISONS, fieldQuestionLabel, validationMessage } from "./workflow-copy";

const DEFINITION_DEBOUNCE_MS = 1200;
const META_DEBOUNCE_MS = 900;

const TRIGGER_LABEL = {
  [TRIGGER.SUBMITTED]: "gönderilince",
  [TRIGGER.APPROVED]: "onaylanırsa",
  [TRIGGER.DECLINED]: "reddedilirse",
};

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia(query);
    const handleChange = (event) => setMatches(event.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, [query]);

  return matches;
}

function WorkflowEditorContent({ workflow, onRefresh }) {
  const router = useRouter();
  const { state, dispatch } = useWorkflowEditor();
  const { setName: setGlobalName } = useWorkflowContext();
  const isLgUp = useMediaQuery("(min-width: 1024px)");

  const [validation, setValidation] = useState(workflow?.validation ?? null);
  const [savedAt, setSavedAt] = useState(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [publishedFlash, setPublishedFlash] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setGlobalName(state.name);
  }, [state.name, setGlobalName]);

  const metaRef = useRef(workflow ? {
    name: workflow.name ?? "",
    description: workflow.description ?? "",
    allowMultipleRuns: Boolean(workflow.allowMultipleRuns),
  } : null);
  const definitionTimer = useRef(null);
  const metaTimer = useRef(null);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const createMutation = useCreateWorkflowMutation();
  const saveDefinitionMutation = useSaveDefinitionMutation();
  const updateWorkflowMutation = useUpdateWorkflowMutation();
  const publishMutation = usePublishWorkflowMutation();
  const archiveMutation = useArchiveWorkflowMutation();

  const creatingRef = useRef(null);
  const ensureWorkflow = useCallback(() => {
    const current = stateRef.current;
    if (current.id) return Promise.resolve(current.id);
    if (creatingRef.current) return creatingRef.current;

    const payload = { name: current.name, description: current.description || null, allowMultipleRuns: current.allowMultipleRuns };

    creatingRef.current = createMutation.mutateAsync(payload)
      .then((response) => {
        const created = response?.data ?? response ?? {};
        const id = created.id;
        if (!id) throw new Error("Akış oluşturulamadı");

        metaRef.current = {
          name: created.name ?? "",
          description: created.description ?? "",
          allowMultipleRuns: Boolean(created.allowMultipleRuns),
        };
        dispatch({ type: "SET_ID", id });
        window.history.replaceState(null, "", `/admin/workflows/${id}`);
        return id;
      })
      .finally(() => { creatingRef.current = null; });

    return creatingRef.current;
  }, [createMutation, dispatch]);

  const ensureRef = useRef(ensureWorkflow);
  useEffect(() => {
    ensureRef.current = ensureWorkflow;
  });

  const { data: versionsData } = useWorkflowVersionsQuery(state.id);
  const { data: availableFormsData, isLoading: isFormsLoading } = useAvailableFormsQuery(state.id, { enabled: pickerOpen && Boolean(state.id) });

  const formQueries = useQueries({
    queries: state.nodes.map((node) => ({
      queryKey: ["form", node.formId],
      queryFn: () => fetchFormById(node.formId),
      enabled: Boolean(node.formId),
      retry: false,
      staleTime: 60000,
    })),
  });

  const schemasByFormId = useMemo(() => {
    const map = {};
    formQueries.forEach((query, index) => {
      const node = state.nodes[index];
      const form = query.data?.data ?? query.data;
      if (!node || !form) return;
      map[node.formId] = {
        title: form.title ?? node.formTitle,
        requiresManualReview: Boolean(form.requiresManualReview),
        schema: Array.isArray(form.schema) ? form.schema : [],
      };
    });
    return map;
  }, [formQueries, state.nodes]);

  useEffect(() => {
    if (Object.keys(schemasByFormId).length === 0) return;
    dispatch({ type: "SYNC_NODE_FORMS", forms: schemasByFormId });
  }, [schemasByFormId, dispatch]);

  useEffect(() => {
    if (state.id || state.isSaved) return undefined;

    const timer = setTimeout(() => { ensureRef.current().catch(() => {}); }, DEFINITION_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state.id, state.isSaved, state.name, state.description, state.allowMultipleRuns, state.nodes, state.transitions]);

  useEffect(() => {
    if (!state.id || state.isSaved) return undefined;

    definitionTimer.current = setTimeout(() => {
      saveDefinitionMutation.mutate(
        { workflowId: state.id, definition: toDefinitionPayload(state.nodes, state.transitions) },
        {
          onSuccess: (response) => {
            dispatch({ type: "MARK_SAVED" });
            setSavedAt(new Date());
            const next = response?.data?.validation ?? response?.data;
            if (next?.errors) setValidation(next);
          },
        }
      );
    }, DEFINITION_DEBOUNCE_MS);

    return () => clearTimeout(definitionTimer.current);
  }, [state.id, state.isSaved, state.nodes, state.transitions]);

  useEffect(() => {
    if (!state.id || !metaRef.current) return undefined;

    const current = { name: state.name, description: state.description, allowMultipleRuns: state.allowMultipleRuns };
    const previous = metaRef.current;
    const unchanged = current.name === previous.name && current.description === previous.description && current.allowMultipleRuns === previous.allowMultipleRuns;
    if (unchanged) return undefined;

    metaTimer.current = setTimeout(() => {
      updateWorkflowMutation.mutate(
        { workflowId: state.id, payload: { name: current.name, description: current.description, allowMultipleRuns: current.allowMultipleRuns } },
        { onSuccess: () => { metaRef.current = current; setSavedAt(new Date()); } }
      );
    }, META_DEBOUNCE_MS);

    return () => clearTimeout(metaTimer.current);
  }, [state.id, state.name, state.description, state.allowMultipleRuns]);

  useEffect(() => {
    if (!publishedFlash) return undefined;
    const timer = setTimeout(() => setPublishedFlash(false), 2200);
    return () => clearTimeout(timer);
  }, [publishedFlash]);

  useEffect(() => {
    if (state.isSaved) return undefined;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [state.isSaved]);

  const issues = useMemo(() => (Array.isArray(validation?.errors) ? validation.errors : []), [validation]);

  const issuesByNode = useMemo(() => {
    const map = {};
    issues.forEach((issue) => {
      if (!issue.nodeKey) return;
      map[issue.nodeKey] = [...(map[issue.nodeKey] ?? []), issue];
    });
    return map;
  }, [issues]);

  const globalIssues = issues.filter((issue) => !issue.nodeKey);

  const questionCounts = useMemo(() => {
    const counts = {};
    Object.entries(schemasByFormId).forEach(([formId, form]) => {
      counts[formId] = form.schema.filter((field) => field?.type !== "separator").length;
    });
    return counts;
  }, [schemasByFormId]);

  const labelForTransition = useCallback((transition) => {
    const group = groupTransitions(state.transitions, transition.sourceNodeKey, transition.trigger);
    const hasConditional = group.some((item) => item.condition);

    if (!transition.condition) {
      return hasConditional ? "aksi halde" : TRIGGER_LABEL[transition.trigger];
    }

    const rules = transition.condition.rules ?? [];
    const rule = rules[0];
    if (!rule?.questionId) return "koşul eksik";

    const sourceNode = rule.nodeKey
      ? state.nodes.find((node) => node.nodeKey === rule.nodeKey)
      : state.nodes.find((node) => node.nodeKey === transition.sourceNodeKey);

    const field = schemasByFormId[sourceNode?.formId]?.schema?.find((item) => item.id === rule.questionId);
    const question = field ? fieldQuestionLabel(field) : rule.questionId;
    const comparison = Number(rule.comparison);
    const value = Array.isArray(rule.values) && rule.values.length > 0 ? rule.values.join(", ") : rule.value;
    const summary = VALUELESS_COMPARISONS.includes(comparison)
      ? `${question} ${COMPARISON_SYMBOL[comparison]}`
      : `${question} ${COMPARISON_SYMBOL[comparison]} ${value || "?"}`;

    return rules.length > 1 ? `${summary} +${rules.length - 1}` : summary;
  }, [state.transitions, state.nodes, schemasByFormId]);

  const lockedHighlights = useMemo(() => {
    const locked = new Map();

    state.transitions.forEach((transition) => {
      (transition.condition?.rules ?? []).forEach((rule) => {
        if (!rule.questionId) return;
        const node = rule.nodeKey
          ? state.nodes.find((item) => item.nodeKey === rule.nodeKey)
          : state.nodes.find((item) => item.nodeKey === transition.sourceNodeKey);
        if (!node) return;

        const field = schemasByFormId[node.formId]?.schema?.find((item) => item.id === rule.questionId);
        const question = field ? fieldQuestionLabel(field) : rule.questionId;
        const values = Array.isArray(rule.values) && rule.values.length > 0 ? rule.values : rule.value ? [rule.value] : [];
        const key = `${node.formTitle}|${question}`;
        const current = locked.get(key) ?? { form: node.formTitle, question, values: new Set() };
        values.forEach((value) => current.values.add(value));
        locked.set(key, current);
      });
    });

    const lines = [...locked.values()].map((item) => {
      const values = [...item.values];
      const valueText = values.length > 0 ? `, ${values.map((value) => `"${value}"`).join(" ve ")} seçeneği yeniden adlandırılamaz` : "";
      return `${item.form} formundaki "${item.question}" sorusu silinemez${valueText}.`;
    });

    return [
      ...lines,
      "Akıştaki formlar kapatılamaz, silinemez ve anonim cevaba açılamaz.",
      "Devam eden başvurular yayındaki eski sürümde kalmaya devam eder.",
    ];
  }, [state.transitions, state.nodes, schemasByFormId]);

  const handlePublish = () => {
    publishMutation.mutate(state.id, {
      onSuccess: (response) => {
        const next = response?.data?.validation ?? response?.data;
        if (next?.errors) setValidation(next);
        setPublishOpen(false);
        setPublishedFlash(true);
        onRefresh?.();
      },
      onError: (error) => {
        const next = error?.body?.data;
        if (next?.errors) setValidation(next);
        setPublishOpen(false);
        setIssuesOpen(true);
      },
    });
  };

  const handleArchive = () => {
    archiveMutation.mutate(state.id, {
      onSuccess: () => router.push("/admin/workflows"),
      onError: () => setDeleteOpen(false),
    });
  };

  const usedFormIds = state.nodes.map((node) => node.formId);

  const availableFormsPayload = availableFormsData?.data ?? availableFormsData;
  const availableForms = Array.isArray(availableFormsPayload) ? availableFormsPayload : availableFormsPayload?.items ?? [];

  const versionsPayload = versionsData?.data ?? versionsData;
  const versions = Array.isArray(versionsPayload) ? versionsPayload : versionsPayload?.items ?? [];

  const issuesOverlay = issuesOpen && issues.length > 0 ? (
        <div className="max-h-56 overflow-y-auto rounded-lg border border-red-400/25 bg-neutral-900/95 p-3 shadow-xl backdrop-blur scrollbar">
          <div className="flex items-center gap-2">
            <span className="text-2xs font-medium text-red-200">Yayınlamayı engelleyen {issues.length} sorun</span>
            <span className="h-px flex-1 bg-red-400/20" />
            <button type="button" onClick={() => setIssuesOpen(false)} aria-label="Kapat" className="rounded p-0.5 text-red-200/70 transition-colors hover:text-red-100">
              <X size={12} />
            </button>
          </div>
          <ul className="mt-2 space-y-1">
            {issues.map((issue, index) => (
              <li key={`${issue.code}-${index}`}>
                <button type="button" disabled={!issue.nodeKey}
                  onClick={() => { if (issue.nodeKey) { dispatch({ type: "SELECT", nodeKey: issue.nodeKey }); setIssuesOpen(false); } }}
                  className={`flex w-full items-start gap-2 rounded px-1 py-0.5 text-left text-2xs text-red-200/90 ${issue.nodeKey ? "transition-colors hover:bg-red-500/10 hover:text-red-100" : "cursor-default"}`}
                >
                  <span className="mt-1.5 size-1 shrink-0 rounded-full bg-red-400" />
                  <span className="min-w-0">
                    {validationMessage(issue)}
                    {issue.nodeKey ? (
                      <span className="ml-1 text-red-200/50">
                        · {state.nodes.find((node) => node.nodeKey === issue.nodeKey)?.formTitle ?? issue.nodeKey}
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
  ) : globalIssues.length > 0 ? (
        <button type="button" onClick={() => setIssuesOpen(true)}
          className="flex w-full items-center gap-2 rounded-lg border border-red-400/25 bg-neutral-900/95 px-3 py-2 text-left text-2xs text-red-200 shadow-xl backdrop-blur transition-colors hover:bg-red-500/10"
        >
          <span className="size-1.5 shrink-0 rounded-full bg-red-400" />
          {validationMessage(globalIssues[0])}
          {globalIssues.length > 1 ? <span className="text-red-200/60">+{globalIssues.length - 1}</span> : null}
        </button>
  ) : null;

  const openPicker = () => {
    if (!isLgUp) setDrawerOpen(true);
    ensureRef.current()
      .then(() => setPickerOpen(true))
      .catch(() => {});
  };

  const inspector = (
    <WorkflowInspector state={state} dispatch={dispatch} schemasByFormId={schemasByFormId}
      issuesByNode={issuesByNode} versions={versions} layout={isLgUp ? "grid" : "drawer"}
      picker={{
        open: pickerOpen, forms: availableForms, usedFormIds, isLoading: isFormsLoading,
        onOpen: openPicker, onClose: () => setPickerOpen(false),
        onSelect: (form) => { dispatch({ type: "ADD_NODE", form }); setPickerOpen(false); },
      }}
      onRelayout={() => dispatch({ type: "RELAYOUT" })}
    />
  );

  const gridContent = (
    <div className="grid grid-cols-12 gap-4">
      <WorkflowCanvas
        nodes={state.nodes} transitions={state.transitions} selectedKey={state.selectedKey}
        issuesByNode={issuesByNode} questionCounts={questionCounts}
        name={state.name} onNameChange={(value) => dispatch({ type: "SET_META", key: "name", value })}
        onSelect={(nodeKey) => dispatch({ type: "SELECT", nodeKey })}
        onMove={(nodeKey, position) => dispatch({ type: "MOVE_NODE", nodeKey, position })}
        onAddStep={openPicker}
        labelForTransition={labelForTransition}
        span={isLgUp ? 8 : 11} isLgUp={isLgUp} overlay={issuesOverlay}
      />

      {!isLgUp && <LibraryTrigger isLgUp={isLgUp} />}
      {isLgUp && inspector}
    </div>
  );

  return (
    <>
      <WorkflowHeaderActions
        saveStatus={<HeaderStatusPill dirty={!state.isSaved} isSaving={saveDefinitionMutation.isPending || createMutation.isPending}
          isFailed={saveDefinitionMutation.isError || createMutation.isError} lastSavedAt={savedAt} publishedFlash={publishedFlash} />}
        issueCount={issues.length}
        onShowIssues={() => setIssuesOpen((open) => !open)}
        onUndo={() => dispatch({ type: "UNDO" })}
        canUndo={state._history.length > 0}
        onArchive={() => setDeleteOpen(true)}
        isArchiveDisabled={!state.id || archiveMutation.isPending}
        onPublish={() => setPublishOpen(true)}
        isPublishing={publishMutation.isPending}
        isError={publishMutation.isError}
        error={publishMutation.error}
        canPublish={Boolean(state.id) && state.nodes.length > 0}
      />

      <div className="relative">
        {!isLgUp ? (
          <Drawer open={drawerOpen} onOpenChange={(open) => { setDrawerOpen(open); if (!open) setPickerOpen(false); }}>
            <div className="h-full w-full flex-1 p-4">{gridContent}</div>
            <DrawerContent className="h-full">{inspector}</DrawerContent>
          </Drawer>
        ) : (
          <div className="h-full w-full flex-1 p-4">{gridContent}</div>
        )}

        <ApprovalOverlay open={publishOpen} preset="publish-workflow"
          context={{ highlights: lockedHighlights, isPending: publishMutation.isPending }}
          onApprove={handlePublish} onReject={() => setPublishOpen(false)}
        />

        <ApprovalOverlay open={deleteOpen} preset="archive-workflow" context={{ isPending: archiveMutation.isPending }}
          onApprove={handleArchive} onReject={() => setDeleteOpen(false)}
        />
      </div>
    </>
  );
}

export default function WorkflowEditor({ workflow, onRefresh }) {
  return (
    <WorkflowEditorProvider workflow={workflow}>
      <WorkflowEditorContent workflow={workflow} onRefresh={onRefresh} />
    </WorkflowEditorProvider>
  );
}
