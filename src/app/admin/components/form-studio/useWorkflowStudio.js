"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { fetchFormById } from "@/lib/hooks/useFormAdmin";
import { request } from "@/lib/apiClient";
import {
  saveDefinition as saveDefinitionRequest, useArchiveWorkflowMutation, useCreateWorkflowMutation, usePublishWorkflowMutation, useSaveDefinitionMutation,
  useUpdateWorkflowMutation, useWorkflowVersionsQuery,
} from "@/lib/hooks/useWorkflowAdmin";
import { EMPTY_RULE, useWorkflowEditor } from "../workflow-editor/WorkflowEditorContext";
import { TRIGGER, connectionError, groupTransitions, toDefinitionPayload } from "../workflow-editor/workflow-graph";
import { COMPARISON_SYMBOL, CONNECTION_COPY, VALUELESS_COMPARISONS, fieldQuestionLabel } from "../workflow-editor/workflow-copy";

const DEFINITION_DEBOUNCE_MS = 1200;
const META_DEBOUNCE_MS = 900;

export const TRIGGER_LABEL = {
  [TRIGGER.SUBMITTED]: "gönderilince",
  [TRIGGER.APPROVED]: "onaylanırsa",
  [TRIGGER.DECLINED]: "reddedilirse",
  [TRIGGER.TIMED_OUT]: "süre dolunca",
};

export function useWorkflowStudio({ workflow, liveForm = null, onCreated }) {
  const { state, dispatch } = useWorkflowEditor();
  const queryClient = useQueryClient();

  const [validation, setValidation] = useState(workflow?.validation ?? null);
  const [savedAt, setSavedAt] = useState(null);
  const [hasDraft, setHasDraft] = useState(Boolean(workflow?.draft) || !workflow?.published);
  const [publishedFlash, setPublishedFlash] = useState(false);

  const metaRef = useRef(workflow ? {
    name: workflow.name ?? "",
    description: workflow.description ?? "",
    allowMultipleRuns: Boolean(workflow.allowMultipleRuns),
  } : null);
  const [loadedDefinition] = useState(() => JSON.stringify(toDefinitionPayload(state.nodes, state.transitions)));
  const savedDefinitionRef = useRef(loadedDefinition);
  const stateRef = useRef(state);
  const onCreatedRef = useRef(onCreated);

  useEffect(() => {
    stateRef.current = state;
    onCreatedRef.current = onCreated;
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
        if (!created.id) throw new Error("Akış oluşturulamadı");
        metaRef.current = {
          name: created.name ?? "",
          description: created.description ?? "",
          allowMultipleRuns: Boolean(created.allowMultipleRuns),
        };
        dispatch({ type: "SET_ID", id: created.id });
        onCreatedRef.current?.(created.id);
        return created.id;
      })
      .finally(() => { creatingRef.current = null; });

    return creatingRef.current;
  }, [createMutation, dispatch]);

  const { data: versionsData } = useWorkflowVersionsQuery(state.id);
  const versionsPayload = versionsData?.data ?? versionsData;
  const versions = useMemo(() => (Array.isArray(versionsPayload) ? versionsPayload : versionsPayload?.items ?? []), [versionsPayload]);
  const isLive = Boolean(workflow?.published) || versions.some((version) => Number(version.status) === 1);

  const formQueries = useQueries({
    queries: state.nodes.map((node) => ({
      queryKey: ["form", node.formId],
      queryFn: () => fetchFormById(node.formId),
      enabled: Boolean(node.formId),
      retry: false,
      staleTime: 60000,
    })),
  });

  const formsById = useMemo(() => {
    const map = {};
    formQueries.forEach((query, index) => {
      const node = state.nodes[index];
      const form = query.data?.data ?? query.data;
      if (node && form) map[node.formId] = form;
    });
    if (liveForm?.id) map[liveForm.id] = { ...(map[liveForm.id] ?? {}), ...liveForm };
    return map;
  }, [formQueries, state.nodes, liveForm]);

  const loadingFormIds = useMemo(
    () => new Set(formQueries.flatMap((query, index) => (query.isLoading && state.nodes[index] ? [state.nodes[index].formId] : []))),
    [formQueries, state.nodes],
  );

  const schemasByFormId = useMemo(() => {
    const map = {};
    Object.entries(formsById).forEach(([formId, form]) => {
      map[formId] = {
        title: form.title ?? "",
        schema: Array.isArray(form.schema) ? form.schema : [],
        timeLimitMinutes: Number(form.timeLimitMinutes) > 0 ? form.timeLimitMinutes : null,
      };
    });
    return map;
  }, [formsById]);

  useEffect(() => {
    if (Object.keys(schemasByFormId).length === 0) return;
    dispatch({ type: "SYNC_NODE_FORMS", forms: schemasByFormId });
  }, [schemasByFormId, dispatch]);

  useEffect(() => {
    if (state.id || state.isSaved) return undefined;
    const timer = setTimeout(() => { ensureWorkflow().catch(() => {}); }, DEFINITION_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [state.id, state.isSaved, state.name, state.description, state.allowMultipleRuns, state.nodes, state.transitions, ensureWorkflow]);

  const saveDefinition = saveDefinitionMutation.mutate;

  useEffect(() => {
    if (!state.id || state.isSaved) return undefined;

    const timer = setTimeout(() => {
      const definition = toDefinitionPayload(state.nodes, state.transitions);
      const serialized = JSON.stringify(definition);

      if (serialized === savedDefinitionRef.current) {
        dispatch({ type: "MARK_SAVED" });
        return;
      }

      saveDefinition({ workflowId: state.id, definition }, {
        onSuccess: (response) => {
          savedDefinitionRef.current = serialized;
          setHasDraft(response?.data ? Boolean(response.data.draft) : true);
          dispatch({ type: "MARK_SAVED" });
          setSavedAt(new Date());
          const next = response?.data?.validation ?? response?.data;
          if (next?.errors) setValidation(next);
          queryClient.invalidateQueries({ queryKey: ["workflow", state.id] });
        },
      });
    }, DEFINITION_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [state.id, state.isSaved, state.nodes, state.transitions, dispatch, saveDefinition, queryClient]);

  const updateWorkflow = updateWorkflowMutation.mutate;

  useEffect(() => {
    if (!state.id || !metaRef.current) return undefined;

    const current = { name: state.name, description: state.description, allowMultipleRuns: state.allowMultipleRuns };
    const previous = metaRef.current;
    if (current.name === previous.name && current.description === previous.description && current.allowMultipleRuns === previous.allowMultipleRuns) return undefined;

    const timer = setTimeout(() => {
      updateWorkflow(
        { workflowId: state.id, payload: current },
        { onSuccess: () => { metaRef.current = current; setSavedAt(new Date()); } },
      );
    }, META_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [state.id, state.name, state.description, state.allowMultipleRuns, updateWorkflow]);

  useEffect(() => {
    const latest = stateRef;
    const saved = savedDefinitionRef;
    return () => {
      const current = latest.current;
      if (!current.id || current.isSaved) return;
      const definition = toDefinitionPayload(current.nodes, current.transitions);
      if (JSON.stringify(definition) === saved.current) return;
      saveDefinitionRequest({ workflowId: current.id, definition, keepalive: true }).catch(() => {});
    };
  }, []);

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

  const labelForTransition = useCallback((transition) => {
    const group = groupTransitions(state.transitions, transition.sourceNodeKey, transition.trigger);
    const hasConditional = group.some((item) => item.condition);

    if (!transition.condition) return hasConditional ? "aksi halde" : TRIGGER_LABEL[transition.trigger];

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

  const publish = useCallback((handlers = {}) => {
    publishMutation.mutate(stateRef.current.id, {
      onSuccess: (response) => {
        const next = response?.data?.validation ?? response?.data;
        if (next?.errors) setValidation(next);
        setHasDraft(false);
        setPublishedFlash(true);
        handlers.onSuccess?.();
      },
      onError: (error) => {
        const next = error?.body?.data;
        if (next?.errors) setValidation(next);
        handlers.onError?.(error);
      },
    });
  }, [publishMutation]);

  const archive = useCallback((handlers = {}) => {
    archiveMutation.mutate(stateRef.current.id, handlers);
  }, [archiveMutation]);

  const connect = useCallback((sourceKey, trigger, targetKey) => {
    const current = stateRef.current;
    const error = connectionError(sourceKey, targetKey, current.nodes, current.transitions);
    if (error) return { ok: false, reason: CONNECTION_COPY[error].message };

    const group = groupTransitions(current.transitions, sourceKey, trigger);

    if (trigger === TRIGGER.TIMED_OUT && group.length > 0) {
      const [route] = group;
      if ((route.targetNodeKey ?? null) !== (targetKey ?? null)) {
        dispatch({ type: "UPDATE_TRANSITION", localId: route.localId, patch: { targetNodeKey: targetKey ?? null } });
      }
      dispatch({ type: "FOCUS_ROUTE", localId: route.localId });
      return { ok: true };
    }

    if (group.length === 0) {
      if (targetKey) dispatch({ type: "ADD_TRANSITION", sourceNodeKey: sourceKey, trigger, targetNodeKey: targetKey, condition: null, focus: true });
      else dispatch({ type: "FOCUS_PORT", nodeKey: sourceKey, trigger });
      return { ok: true };
    }

    const existing = group.find((transition) => (transition.targetNodeKey ?? null) === (targetKey ?? null));
    if (existing) {
      dispatch({ type: "FOCUS_ROUTE", localId: existing.localId });
      return { ok: true };
    }

    if (group.length === 1 && !group[0].condition) {
      dispatch({ type: "UPDATE_TRANSITION", localId: group[0].localId, patch: { targetNodeKey: targetKey ?? null } });
      dispatch({ type: "FOCUS_ROUTE", localId: group[0].localId });
      return { ok: true };
    }

    dispatch({
      type: "ADD_TRANSITION", sourceNodeKey: sourceKey, trigger, targetNodeKey: targetKey,
      condition: { operator: 0, rules: [{ ...EMPTY_RULE }] }, focus: true,
    });
    return { ok: true };
  }, [dispatch]);

  const setSingleRoute = useCallback((sourceKey, trigger, targetKey) => {
    const current = stateRef.current;
    const error = connectionError(sourceKey, targetKey, current.nodes, current.transitions);
    if (error) return { ok: false, reason: CONNECTION_COPY[error].message };

    const group = groupTransitions(current.transitions, sourceKey, trigger);
    if (group.length === 0) {
      if (targetKey) dispatch({ type: "ADD_TRANSITION", sourceNodeKey: sourceKey, trigger, targetNodeKey: targetKey, condition: null });
      return { ok: true };
    }
    if (group.length === 1 && !group[0].condition) {
      if (targetKey) dispatch({ type: "UPDATE_TRANSITION", localId: group[0].localId, patch: { targetNodeKey: targetKey } });
      else dispatch({ type: "REMOVE_TRANSITION", localId: group[0].localId });
    }
    return { ok: true };
  }, [dispatch]);

  const createBlankForm = useCallback(async (title = "Yeni Form") => {
    const response = await request("/api/admin/forms", {
      method: "POST",
      body: {
        Id: null,
        Title: title,
        Description: "",
        Schema: [],
        Status: 2,
        AllowMultipleResponses: false,
        AllowAnonymousResponses: false,
        RequiresManualReview: false,
        Collaborators: [],
        Task: null,
        ClosesAt: null,
        TimeLimitMinutes: null,
      },
    });
    const created = response?.data ?? response ?? {};
    if (!created.id) throw new Error("Form oluşturulamadı");
    queryClient.invalidateQueries({ queryKey: ["user-forms"] });
    return { id: created.id, title: created.title ?? title, requiresManualReview: false, timeLimitMinutes: null };
  }, [queryClient]);

  return {
    state,
    dispatch,
    ensureWorkflow,
    versions,
    isLive,
    hasDraft,
    formsById,
    schemasByFormId,
    loadingFormIds,
    issues,
    issuesByNode,
    labelForTransition,
    lockedHighlights,
    publish,
    archive,
    connect,
    setSingleRoute,
    createBlankForm,
    saveStatus: {
      isSaving: saveDefinitionMutation.isPending || createMutation.isPending || updateWorkflowMutation.isPending,
      isFailed: saveDefinitionMutation.isError || createMutation.isError,
      savedAt,
      publishedFlash,
    },
    publishState: { isPending: publishMutation.isPending, isError: publishMutation.isError, error: publishMutation.error },
    archiveState: { isPending: archiveMutation.isPending },
  };
}
