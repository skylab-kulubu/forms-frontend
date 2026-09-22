"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { autoLayout, slugifyNodeKey, withPositions, triggersForNode } from "./workflow-graph";

const MAX_HISTORY = 20;
const HISTORY_DEBOUNCE_MS = 800;

const TRACKABLE_ACTIONS = new Set([
  "SET_META", "ADD_NODE", "REMOVE_NODE", "MOVE_NODE", "RELAYOUT", "SET_START",
  "ADD_TRANSITION", "UPDATE_TRANSITION", "REMOVE_TRANSITION", "MOVE_TRANSITION",
]);

let transitionSeq = 0;
export const nextTransitionId = () => {
  transitionSeq += 1;
  return `t${transitionSeq}`;
};

export const EMPTY_RULE = { nodeKey: null, questionId: "", comparison: 0, value: "", values: null };

const initialState = {
  id: null,
  name: "Yeni Akış",
  description: "",
  allowMultipleRuns: false,
  status: 0,
  nodes: [],
  transitions: [],
  selectedKey: null,
  isSaved: true,
  _history: [],
};

function normalizeNodes(apiNodes) {
  return (Array.isArray(apiNodes) ? apiNodes : []).map((node) => ({
    nodeKey: node.nodeKey,
    formId: node.formId,
    formTitle: node.formTitle || "Adsız form",
    requiresManualReview: Boolean(node.requiresManualReview),
    isStart: Boolean(node.isStart),
    position: node.position && typeof node.position.x === "number" ? { x: node.position.x, y: node.position.y } : null,
  }));
}

function normalizeTransitions(apiTransitions) {
  return (Array.isArray(apiTransitions) ? apiTransitions : []).map((transition) => ({
    localId: nextTransitionId(),
    sourceNodeKey: transition.sourceNodeKey,
    targetNodeKey: transition.targetNodeKey ?? null,
    trigger: Number(transition.trigger ?? 0),
    priority: transition.priority ?? 0,
    condition: transition.condition ?? null,
  }));
}

function renumber(transitions) {
  const counters = new Map();

  const conditional = transitions.filter((transition) => transition.condition);
  const defaults = transitions.filter((transition) => !transition.condition);

  const numbered = [...conditional, ...defaults].map((transition) => {
    const groupKey = `${transition.sourceNodeKey}|${transition.trigger}`;
    const next = counters.get(groupKey) ?? 0;
    counters.set(groupKey, next + 1);
    return { ...transition, priority: next };
  });

  return transitions.map((transition) => numbered.find((item) => item.localId === transition.localId) ?? transition);
}

function ensureDefaultRoute(transitions, sourceNodeKey, trigger) {
  const group = transitions.filter((transition) => transition.sourceNodeKey === sourceNodeKey && transition.trigger === trigger);
  const hasConditional = group.some((transition) => transition.condition);
  const hasDefault = group.some((transition) => !transition.condition);

  if (!hasConditional || hasDefault) return transitions;

  return [...transitions, {
    localId: nextTransitionId(),
    sourceNodeKey,
    targetNodeKey: null,
    trigger,
    priority: group.length,
    condition: null,
  }];
}

function touched(state, patch) {
  return { ...state, ...patch, isSaved: false };
}

function buildInitialState(workflow) {
  if (!workflow) return initialState;

  const definition = workflow.draft ?? workflow.published ?? { nodes: [], transitions: [] };
  const transitions = normalizeTransitions(definition?.transitions);
  const nodes = withPositions(normalizeNodes(definition?.nodes), transitions);

  return {
    ...initialState,
    id: workflow.id ?? null,
    name: workflow.name ?? "",
    description: workflow.description ?? "",
    allowMultipleRuns: Boolean(workflow.allowMultipleRuns),
    status: workflow.status ?? 0,
    nodes,
    transitions,
    selectedKey: nodes.find((node) => node.isStart)?.nodeKey ?? nodes[0]?.nodeKey ?? null,
  };
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_ID":
      return state.id === action.id ? state : { ...state, id: action.id };

    case "SET_META":
      return touched(state, { [action.key]: action.value });

    case "SELECT":
      return { ...state, selectedKey: action.nodeKey };

    case "ADD_NODE": {
      const { form } = action;
      const takenKeys = state.nodes.map((node) => node.nodeKey);
      const nodeKey = slugifyNodeKey(form.title, takenKeys);
      const rightMost = state.nodes.reduce((max, node) => Math.max(max, node.position?.x ?? 0), 0);

      const node = {
        nodeKey,
        formId: form.id,
        formTitle: form.title || "Adsız form",
        requiresManualReview: Boolean(form.requiresManualReview),
        isStart: state.nodes.length === 0,
        position: state.nodes.length === 0 ? { x: 24, y: 140 } : { x: rightMost + 236, y: 60 + (state.nodes.length % 3) * 104 },
      };

      return touched(state, { nodes: [...state.nodes, node], selectedKey: nodeKey });
    }

    case "REMOVE_NODE": {
      const nodes = state.nodes.filter((node) => node.nodeKey !== action.nodeKey);
      const transitions = state.transitions.filter(
        (transition) => transition.sourceNodeKey !== action.nodeKey && transition.targetNodeKey !== action.nodeKey
      );

      const hasStart = nodes.some((node) => node.isStart);
      const nextNodes = hasStart || nodes.length === 0 ? nodes : nodes.map((node, index) => ({ ...node, isStart: index === 0 }));

      return touched(state, {
        nodes: nextNodes,
        transitions: renumber(transitions),
        selectedKey: nextNodes[0]?.nodeKey ?? null,
      });
    }

    case "MOVE_NODE":
      return touched(state, {
        nodes: state.nodes.map((node) => (node.nodeKey === action.nodeKey ? { ...node, position: action.position } : node)),
      });

    case "RELAYOUT": {
      const layout = autoLayout(state.nodes, state.transitions);
      return touched(state, {
        nodes: state.nodes.map((node) => ({ ...node, position: layout[node.nodeKey] ?? node.position })),
      });
    }

    case "SET_START":
      return touched(state, {
        nodes: state.nodes.map((node) => ({ ...node, isStart: node.nodeKey === action.nodeKey })),
      });

    case "ADD_TRANSITION": {
      const transition = {
        localId: action.localId ?? nextTransitionId(),
        sourceNodeKey: action.sourceNodeKey,
        targetNodeKey: action.targetNodeKey ?? null,
        trigger: action.trigger,
        priority: 0,
        condition: action.condition ?? null,
      };

      const withNew = [...state.transitions, transition];
      return touched(state, { transitions: renumber(ensureDefaultRoute(withNew, action.sourceNodeKey, action.trigger)) });
    }

    case "UPDATE_TRANSITION": {
      const target = state.transitions.find((transition) => transition.localId === action.localId);
      if (!target) return state;

      const updated = state.transitions.map((transition) =>
        transition.localId === action.localId ? { ...transition, ...action.patch } : transition
      );

      const conditionChanged = "condition" in action.patch && Boolean(action.patch.condition) !== Boolean(target.condition);
      const next = conditionChanged ? renumber(ensureDefaultRoute(updated, target.sourceNodeKey, target.trigger)) : updated;

      return touched(state, { transitions: next });
    }

    case "REMOVE_TRANSITION":
      return touched(state, {
        transitions: renumber(state.transitions.filter((transition) => transition.localId !== action.localId)),
      });

    case "MOVE_TRANSITION": {
      const target = state.transitions.find((transition) => transition.localId === action.localId);
      if (!target || !target.condition) return state;

      const group = state.transitions
        .filter((transition) => transition.sourceNodeKey === target.sourceNodeKey && transition.trigger === target.trigger && transition.condition)
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0));

      const index = group.findIndex((transition) => transition.localId === action.localId);
      const nextIndex = index + action.direction;
      if (nextIndex < 0 || nextIndex >= group.length) return state;

      const reordered = [...group];
      reordered.splice(nextIndex, 0, reordered.splice(index, 1)[0]);

      const priorities = new Map(reordered.map((transition, order) => [transition.localId, order]));

      return touched(state, {
        transitions: state.transitions.map((transition) =>
          priorities.has(transition.localId) ? { ...transition, priority: priorities.get(transition.localId) } : transition
        ),
      });
    }

    case "SYNC_NODE_FORMS": {
      let changed = false;

      const nodes = state.nodes.map((node) => {
        const form = action.forms[node.formId];
        if (!form) return node;
        if (node.formTitle === form.title && node.requiresManualReview === form.requiresManualReview) return node;
        changed = true;
        return { ...node, formTitle: form.title, requiresManualReview: form.requiresManualReview };
      });

      return changed ? { ...state, nodes } : state;
    }

    case "MARK_SAVED":
      return state.isSaved ? state : { ...state, isSaved: true };

    default:
      return state;
  }
}

function editorReducer(state, action) {
  if (action.type === "UNDO") {
    const history = state._history;
    if (history.length === 0) return state;
    const previous = history[history.length - 1];
    return { ...previous, _history: history.slice(0, -1), isSaved: false };
  }

  if (action.type === "_COMMIT_HISTORY") {
    const { _history, ...snapshot } = action.payload;
    return { ...state, _history: [...state._history.slice(-(MAX_HISTORY - 1)), snapshot] };
  }

  const next = reducer(state, action);
  return next === state ? state : { ...next, _history: state._history };
}

const WorkflowEditorContext = createContext(null);

export function WorkflowEditorProvider({ children, workflow }) {
  const [state, rawDispatch] = useReducer(editorReducer, workflow, buildInitialState);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  });

  const pendingSnapshotRef = useRef(null);
  const timerRef = useRef(null);

  const dispatch = useCallback((action) => {
    if (action.type === "UNDO") {
      clearTimeout(timerRef.current);
      pendingSnapshotRef.current = null;
      rawDispatch(action);
      return;
    }

    if (TRACKABLE_ACTIONS.has(action.type)) {
      if (!pendingSnapshotRef.current) pendingSnapshotRef.current = stateRef.current;
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (pendingSnapshotRef.current) {
          rawDispatch({ type: "_COMMIT_HISTORY", payload: pendingSnapshotRef.current });
          pendingSnapshotRef.current = null;
        }
      }, HISTORY_DEBOUNCE_MS);
    }

    rawDispatch(action);
  }, []);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

  return <WorkflowEditorContext.Provider value={value}>{children}</WorkflowEditorContext.Provider>;
}

export function useWorkflowEditor() {
  const context = useContext(WorkflowEditorContext);
  if (!context) throw new Error("useWorkflowEditor must be used within a WorkflowEditorProvider");
  return context;
}

export function allowedTriggers(node) {
  return triggersForNode(node);
}
