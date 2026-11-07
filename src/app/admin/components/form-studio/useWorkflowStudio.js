"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/apiClient";
import {
  saveDefinition as saveDefinitionRequest, useArchiveWorkflowMutation, useCreateWorkflowMutation, useSaveDefinitionMutation, useSaveWorkflowMutation,
} from "@/lib/hooks/useWorkflowAdmin";
import { EMPTY_RULE, useWorkflowEditor } from "../workflow-editor/WorkflowEditorContext";
import { TRIGGER, connectionError, groupTransitions, toDefinitionPayload } from "../workflow-editor/workflow-graph";
import { CONNECTION_COPY, fieldQuestionLabel } from "../workflow-editor/workflow-copy";
import { transitionLabel } from "./studio-flow";

const DEFINITION_DEBOUNCE_MS = 1200;
const NO_FORMS = {};
const NO_IDS = new Set();
const TEXT_COMPARISONS = new Set([0, 1, 2, 3, 4]);

const metaOf = (source) => ({
  name: source?.name ?? "",
  description: source?.description ?? "",
  allowMultipleRuns: Boolean(source?.allowMultipleRuns),
});

const sameMeta = (a, b) => a.name === b.name && a.description === b.description && a.allowMultipleRuns === b.allowMultipleRuns;

const metaDraftKey = (workflowId) => `workflow-meta:${workflowId}`;

function readMetaDraft(workflowId) {
  try {
    const stored = JSON.parse(sessionStorage.getItem(metaDraftKey(workflowId)) ?? "null");
    return stored ? metaOf(stored) : null;
  } catch {
    return null;
  }
}

function writeMetaDraft(workflowId, meta) {
  try {
    if (meta) sessionStorage.setItem(metaDraftKey(workflowId), JSON.stringify(meta));
    else sessionStorage.removeItem(metaDraftKey(workflowId));
  } catch { }
}

export function questionReads(nodes, transitions) {
  const formIdByKey = new Map(nodes.map((node) => [node.nodeKey.toLowerCase(), node.formId]));
  const reads = new Map();

  transitions.forEach((transition) => {
    (transition.condition?.rules ?? []).forEach((rule) => {
      if (!rule.questionId) return;
      const formId = formIdByKey.get((rule.nodeKey || transition.sourceNodeKey || "").toLowerCase());
      if (!formId) return;

      const questions = reads.get(formId) ?? new Map();
      const values = questions.get(rule.questionId) ?? new Set();
      if (TEXT_COMPARISONS.has(Number(rule.comparison))) {
        [rule.value, ...(Array.isArray(rule.values) ? rule.values : [])].forEach((value) => {
          if (typeof value === "string" && value.trim()) values.add(value);
        });
      }
      questions.set(rule.questionId, values);
      reads.set(formId, questions);
    });
  });

  return reads;
}

export function useWorkflowStudio({ workflow, forms = NO_FORMS, loadingFormIds = NO_IDS, onCreated }) {
  const { state, dispatch } = useWorkflowEditor();
  const queryClient = useQueryClient();

  const [validation, setValidation] = useState(workflow?.validation ?? null);
  const [draftSavedAt, setDraftSavedAt] = useState(null);
  const [hasDraft, setHasDraft] = useState(Boolean(workflow?.draft) || !workflow?.published);
  const [liveWorkflow, setLiveWorkflow] = useState(workflow?.published ? workflow : null);
  const [savedMeta, setSavedMeta] = useState(() => metaOf(workflow));

  const [loadedDefinition] = useState(() => JSON.stringify(toDefinitionPayload(state.nodes, state.transitions)));
  const savedDefinitionRef = useRef(loadedDefinition);
  const metaRestoredRef = useRef(false);
  const stateRef = useRef(state);
  const onCreatedRef = useRef(onCreated);

  useEffect(() => {
    stateRef.current = state;
    onCreatedRef.current = onCreated;
  });

  const createMutation = useCreateWorkflowMutation();
  const saveDefinitionMutation = useSaveDefinitionMutation();
  const saveWorkflowMutation = useSaveWorkflowMutation();
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
        setSavedMeta(metaOf(created));
        dispatch({ type: "SET_ID", id: created.id });
        onCreatedRef.current?.(created.id);
        return created.id;
      })
      .finally(() => { creatingRef.current = null; });

    return creatingRef.current;
  }, [createMutation, dispatch]);

  const isLive = Boolean(liveWorkflow?.published);

  const formsById = forms;

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

  const currentMeta = useMemo(
    () => metaOf({ name: state.name, description: state.description, allowMultipleRuns: state.allowMultipleRuns }),
    [state.name, state.description, state.allowMultipleRuns],
  );
  const metaDirty = !sameMeta(currentMeta, savedMeta);
  const flowDirty = !isLive || hasDraft || !state.isSaved || metaDirty;

  useEffect(() => {
    if (!state.id) return;
    if (!metaRestoredRef.current) {
      metaRestoredRef.current = true;
      const draft = readMetaDraft(state.id);
      if (draft && !sameMeta(draft, currentMeta)) {
        dispatch({ type: "RESTORE_META", meta: draft });
        return;
      }
    }
    writeMetaDraft(state.id, sameMeta(currentMeta, savedMeta) ? null : currentMeta);
  }, [state.id, currentMeta, savedMeta, dispatch]);

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
          setDraftSavedAt(new Date());
          const next = response?.data?.validation ?? response?.data;
          if (next?.errors) setValidation(next);
          queryClient.invalidateQueries({ queryKey: ["workflow", state.id] });
        },
      });
    }, DEFINITION_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [state.id, state.isSaved, state.nodes, state.transitions, dispatch, saveDefinition, queryClient]);

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

  const nodeByKey = useMemo(() => new Map(state.nodes.map((node) => [node.nodeKey.toLowerCase(), node])), [state.nodes]);

  const issues = useMemo(() => {
    const all = Array.isArray(validation?.errors) ? validation.errors : [];
    const readsKnownQuestions = (sourceNodeKey) => state.transitions
      .filter((transition) => (transition.sourceNodeKey ?? "").toLowerCase() === sourceNodeKey.toLowerCase())
      .every((transition) => (transition.condition?.rules ?? []).every((rule) => {
        if (!rule.questionId) return false;
        const node = nodeByKey.get((rule.nodeKey || transition.sourceNodeKey).toLowerCase());
        return Boolean(node && schemasByFormId[node.formId]?.schema.some((field) => field.id === rule.questionId));
      }));
    const settledOnDraft = (issue) => {
      const form = formsById[nodeByKey.get((issue.nodeKey ?? "").toLowerCase())?.formId];
      if (!form) return false;
      if (issue.code === "formClosed") return Number(form.status) === 2;
      if (issue.code === "formAnonymous") return !form.allowAnonymousResponses;
      if (issue.code === "formTimedRepeatable") return !(Number(form.timeLimitMinutes) > 0);
      if (issue.code === "timeoutNotAllowed") return Number(form.timeLimitMinutes) > 0;
      return false;
    };
    return all.filter((issue) => !settledOnDraft(issue) && (issue.code !== "conditionQuestionMissing" || !issue.nodeKey || !readsKnownQuestions(issue.nodeKey)));
  }, [validation, state.transitions, nodeByKey, schemasByFormId, formsById]);

  const issuesByNode = useMemo(() => {
    const map = {};
    issues.forEach((issue) => {
      if (!issue.nodeKey) return;
      map[issue.nodeKey] = [...(map[issue.nodeKey] ?? []), issue];
    });
    return map;
  }, [issues]);

  const labelForTransition = useCallback((transition) => transitionLabel(transition, {
    nodes: state.nodes,
    transitions: state.transitions,
    schemaOf: (formId) => schemasByFormId[formId]?.schema,
  }), [state.transitions, state.nodes, schemasByFormId]);

  const localReads = useMemo(() => questionReads(state.nodes, state.transitions), [state.nodes, state.transitions]);
  const liveReads = useMemo(() => {
    const published = liveWorkflow?.published;
    return published ? questionReads(published.nodes ?? [], published.transitions ?? []) : new Map();
  }, [liveWorkflow]);

  const lockedHighlights = useMemo(() => {
    const lines = [];
    localReads.forEach((questions, formId) => {
      const formTitle = state.nodes.find((node) => node.formId === formId)?.formTitle ?? "Adsız form";
      questions.forEach((values, questionId) => {
        const field = schemasByFormId[formId]?.schema.find((item) => item.id === questionId);
        const question = field ? fieldQuestionLabel(field) : questionId;
        const valueText = values.size > 0 ? `, ${[...values].map((value) => `"${value}"`).join(" ve ")} seçeneği yeniden adlandırılamaz` : "";
        lines.push(`${formTitle} formundaki "${question}" sorusu silinemez${valueText}.`);
      });
    });
    return [...lines, "Akıştaki formlar kapatılamaz, silinemez ve anonim cevaba açılamaz."];
  }, [localReads, state.nodes, schemasByFormId]);

  const membershipOf = useCallback((formId, server) => {
    const node = state.nodes.find((item) => item.formId === formId);
    if (!node) return server ?? null;

    const live = server?.isPublished && server.id !== state.id
      ? new Map((server.lockedQuestions ?? []).map((question) => [question.id, question.values ?? []]))
      : liveReads.get(formId) ?? new Map();
    const locked = new Map();
    live.forEach((values, questionId) => locked.set(questionId, { values: new Set(values), liveOnly: true }));
    (localReads.get(formId) ?? new Map()).forEach((values, questionId) => {
      const entry = locked.get(questionId) ?? { values: new Set(), liveOnly: false };
      values.forEach((value) => entry.values.add(value));
      locked.set(questionId, { ...entry, liveOnly: false });
    });

    return {
      ...(server ?? {}),
      id: state.id,
      name: state.name || "Adsız akış",
      isStart: node.isStart,
      isPublished: true,
      allowMultipleRuns: state.allowMultipleRuns,
      requiresManualReview: node.requiresManualReview,
      intake: workflow?.intake ?? server?.intake ?? 0,
      lockedQuestions: [...locked].map(([id, entry]) => ({ id, values: [...entry.values], liveOnly: entry.liveOnly })),
    };
  }, [state.nodes, state.id, state.name, state.allowMultipleRuns, localReads, liveReads, workflow?.intake]);

  const save = useCallback(async (forms) => {
    const workflowId = await ensureWorkflow();
    const current = stateRef.current;
    const meta = metaOf(current);
    const definition = toDefinitionPayload(current.nodes, current.transitions);
    const serialized = JSON.stringify(definition);

    try {
      const response = await saveWorkflowMutation.mutateAsync({
        workflowId,
        payload: { name: meta.name, description: meta.description || null, allowMultipleRuns: meta.allowMultipleRuns, definition, forms },
      });
      const data = response?.data ?? response ?? {};
      savedDefinitionRef.current = serialized;
      setHasDraft(false);
      setSavedMeta(meta);
      if (data.workflow) {
        setLiveWorkflow(data.workflow);
        if (data.workflow.validation) setValidation(data.workflow.validation);
      }
      const latest = stateRef.current;
      dispatch({ type: JSON.stringify(toDefinitionPayload(latest.nodes, latest.transitions)) === serialized ? "MARK_SAVED" : "MARK_DIRTY" });
      return data;
    } catch (error) {
      const next = error?.body?.data?.validation;
      if (next?.errors) setValidation(next);
      throw error;
    }
  }, [ensureWorkflow, saveWorkflowMutation, dispatch]);

  const discardFlow = useCallback(async () => {
    const workflowId = stateRef.current.id;
    const published = liveWorkflow?.published;
    if (!workflowId || !published) return false;

    const definition = toDefinitionPayload(published.nodes ?? [], published.transitions ?? []);
    const response = await saveDefinitionMutation.mutateAsync({ workflowId, definition });
    savedDefinitionRef.current = JSON.stringify(definition);
    setHasDraft(Boolean(response?.data?.draft));
    const next = response?.data?.validation;
    if (next?.errors) setValidation(next);
    dispatch({ type: "LOAD_WORKFLOW", workflow: { ...liveWorkflow, ...savedMeta, draft: null } });
    queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
    return true;
  }, [liveWorkflow, savedMeta, saveDefinitionMutation, dispatch, queryClient]);

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
    isLive,
    hasDraft,
    metaDirty,
    flowDirty,
    formsById,
    schemasByFormId,
    loadingFormIds,
    issues,
    issuesByNode,
    labelForTransition,
    lockedHighlights,
    membershipOf,
    save,
    discardFlow,
    archive,
    connect,
    setSingleRoute,
    createBlankForm,
    saveStatus: {
      isSaving: saveDefinitionMutation.isPending || createMutation.isPending || saveWorkflowMutation.isPending,
      isFailed: saveDefinitionMutation.isError || createMutation.isError,
      draftSavedAt,
    },
    saveState: { isPending: saveWorkflowMutation.isPending },
    archiveState: { isPending: archiveMutation.isPending },
  };
}
