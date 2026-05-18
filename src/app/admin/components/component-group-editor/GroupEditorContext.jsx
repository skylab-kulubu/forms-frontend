"use client";

import { createContext, useContext, useReducer, useMemo, useCallback, useRef } from "react";

const MAX_HISTORY = 20;
const HISTORY_DEBOUNCE_MS = 800;

const TRACKABLE_ACTIONS = new Set([
    "SET_TITLE", "SET_DESCRIPTION", "SET_SCHEMA",
]);

const initialGroupState = {
    id: null,
    title: "Yeni Grup",
    description: "",
    schema: [],
    isSaved: true,
    _history: [],
};

function coreReducer(state, action) {
    switch (action.type) {
        case "LOAD_GROUP":
            return {
                ...state,
                ...action.payload,
                schema: Array.isArray(action.payload.schema) ? action.payload.schema : [],
                title: action.payload.title || "Yeni Grup",
                isSaved: true,
            };

        case "SET_TITLE":
            return { ...state, title: action.payload, isSaved: false };

        case "SET_DESCRIPTION":
            return { ...state, description: action.payload, isSaved: false };

        case "SET_SCHEMA":
            return { ...state, schema: action.payload, isSaved: false };

        case "RESET_GROUP":
            return { ...initialGroupState };

        default:
            return state;
    }
}

function groupReducer(state, action) {
    if (action.type === "UNDO") {
        const history = state._history;
        if (history.length === 0) return state;
        const previous = history[history.length - 1];
        return {
            ...previous,
            _history: history.slice(0, -1),
            isSaved: false,
        };
    }

    if (action.type === "_COMMIT_HISTORY") {
        const { _history, ...snapshot } = action.payload;
        return {
            ...state,
            _history: [...state._history.slice(-(MAX_HISTORY - 1)), snapshot],
        };
    }

    const next = coreReducer(state, action);
    return next === state ? state : { ...next, _history: state._history };
}

const GroupEditorContext = createContext(null);

export function GroupEditorProvider({ children, initialData }) {
    const initializer = initialData
        ? { ...initialGroupState, ...initialData, _history: [] }
        : initialGroupState;
    const [state, rawDispatch] = useReducer(groupReducer, initializer);

    const stateRef = useRef(state);
    stateRef.current = state;

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
            if (!pendingSnapshotRef.current) {
                pendingSnapshotRef.current = stateRef.current;
            }
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

    const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);

    return (
        <GroupEditorContext.Provider value={value}>
            {children}
        </GroupEditorContext.Provider>
    );
}

export function useGroupEditor() {
    const context = useContext(GroupEditorContext);
    if (!context) {
        throw new Error("useGroupEditor must be used within a GroupEditorProvider");
    }
    return context;
}
