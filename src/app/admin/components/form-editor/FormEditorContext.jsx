"use client";

import { createContext, useContext, useReducer, useMemo, useCallback, useRef } from "react";

const MAX_HISTORY = 20;
const HISTORY_DEBOUNCE_MS = 800;

const TRACKABLE_ACTIONS = new Set([
    "SET_TITLE", "SET_DESCRIPTION", "SET_SCHEMA",
    "SET_STATUS", "UPDATE_SETTINGS", "SET_EDITORS",
]);

const initialFormState = {
    id: null,
    schema: [],
    title: "Yeni Form",
    description: "",
    linkedFormId: "",
    allowMultipleResponses: false,
    allowAnonymousResponses: false,
    requiresManualReview: false,
    editors: [],
    status: 1,
    isChildForm: false,
    isSaved: true,
    userRole: 3,
    _history: [],
};

function coreReducer(state, action) {
    switch (action.type) {
        case "LOAD_FORM":
            return {
                ...state,
                ...action.payload,
                schema: Array.isArray(action.payload.schema) ? action.payload.schema : [],
                editors: Array.isArray(action.payload.collaborators) ? action.payload.collaborators : [],
                title: action.payload.title || "Yeni Form",
                isSaved: true
            };

        case "SET_TITLE":
            return { ...state, title: action.payload, isSaved: false };

        case "SET_DESCRIPTION":
            return { ...state, description: action.payload, isSaved: false };

        case "SET_SCHEMA":
            return { ...state, schema: action.payload, isSaved: false };

        case "SET_STATUS":
            return { ...state, status: action.payload, isSaved: false };

        case "LOAD_DRAFT":
            return {
                ...state,
                title: action.payload.title || state.title,
                description: action.payload.description ?? state.description,
                schema: Array.isArray(action.payload.schema) ? action.payload.schema : state.schema,
                allowAnonymousResponses: action.payload.allowAnonymousResponses ?? state.allowAnonymousResponses,
                allowMultipleResponses: action.payload.allowMultipleResponses ?? state.allowMultipleResponses,
                requiresManualReview: action.payload.requiresManualReview ?? state.requiresManualReview,
                status: action.payload.status ?? state.status,
                isSaved: false,
            };

        case "UPDATE_SETTINGS":
            return { ...state, [action.payload.key]: action.payload.value, isSaved: false };

        case "SET_EDITORS":
            return { ...state, editors: action.payload, isSaved: false };

        case "RESET_FORM":
             return { ...initialFormState };

        default:
            return state;
    }
}

function formReducer(state, action) {
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

const FormEditorContext = createContext(null);

export function FormEditorProvider({ children, initialData }) {
    const initializer = initialData
        ? { ...initialFormState, ...initialData, _history: [] }
        : initialFormState;
    const [state, rawDispatch] = useReducer(formReducer, initializer);

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
        <FormEditorContext.Provider value={value}>
            {children}
        </FormEditorContext.Provider>
    );
}

export function useFormEditor() {
    const context = useContext(FormEditorContext);
    if (!context) {
        throw new Error("useFormEditor must be used within a FormEditorProvider");
    }
    return context;
}