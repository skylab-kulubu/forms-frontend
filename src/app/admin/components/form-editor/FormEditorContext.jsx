"use client";

import { createContext, useContext, useReducer, useMemo, useCallback, useRef, useEffect } from "react";
import { migrateSchema } from "@/app/components/form-migrate";

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
    allowMultipleResponses: false,
    allowAnonymousResponses: false,
    requiresManualReview: false,
    editors: [],
    status: 1,
    isSaved: true,
    userRole: 3,
    workflow: null,
    _history: [],
};

const draftFields = (state) => ({
    title: state.title,
    description: state.description,
    schema: state.schema,
    status: state.status,
    allowAnonymousResponses: state.allowAnonymousResponses,
    allowMultipleResponses: state.allowMultipleResponses,
    requiresManualReview: state.requiresManualReview,
});

const savedFields = (state) => ({
    ...draftFields(state),
    editors: (state.editors ?? []).map((editor) => [editor.user?.id, Number(editor.role)]),
});

export const hasDraftChanges = (state) =>
    JSON.stringify(draftFields(state)) !== JSON.stringify(draftFields(state._saved));

const withSavedFlag = (state) => ({
    ...state,
    isSaved: JSON.stringify(savedFields(state)) === JSON.stringify(state._saved),
});

const withSnapshot = (state) => ({ ...state, _saved: savedFields(state), isSaved: true });

function coreReducer(state, action) {
    switch (action.type) {
        case "LOAD_FORM":
            return withSnapshot({
                ...state,
                ...action.payload,
                schema: migrateSchema(action.payload.schema),
                editors: Array.isArray(action.payload.collaborators) ? action.payload.collaborators : [],
                title: action.payload.title || "Yeni Form",
            });

        case "SET_TITLE":
            return { ...state, title: action.payload };

        case "SET_DESCRIPTION":
            return { ...state, description: action.payload };

        case "SET_SCHEMA":
            return { ...state, schema: action.payload };

        case "SET_STATUS":
            return { ...state, status: action.payload };

        case "LOAD_DRAFT":
            return {
                ...state,
                title: action.payload.title || state.title,
                description: action.payload.description ?? state.description,
                schema: Array.isArray(action.payload.schema) ? migrateSchema(action.payload.schema) : state.schema,
                allowAnonymousResponses: action.payload.allowAnonymousResponses ?? state.allowAnonymousResponses,
                allowMultipleResponses: action.payload.allowMultipleResponses ?? state.allowMultipleResponses,
                requiresManualReview: action.payload.requiresManualReview ?? state.requiresManualReview,
                status: action.payload.status ?? state.status,
            };

        case "MARK_SAVED":
            return { ...state, _saved: savedFields(action.payload ?? state) };

        case "UPDATE_SETTINGS":
            return { ...state, [action.payload.key]: action.payload.value };

        case "SET_EDITORS":
            return { ...state, editors: action.payload };

        case "RESET_FORM":
             return withSnapshot(initialFormState);

        default:
            return state;
    }
}

function formReducer(state, action) {
    if (action.type === "UNDO") {
        const history = state._history;
        if (history.length === 0) return state;
        const previous = history[history.length - 1];
        return withSavedFlag({
            ...previous,
            _saved: state._saved,
            _history: history.slice(0, -1),
        });
    }

    if (action.type === "_COMMIT_HISTORY") {
        const { _history, ...snapshot } = action.payload;
        return {
            ...state,
            _history: [...state._history.slice(-(MAX_HISTORY - 1)), snapshot],
        };
    }

    const next = coreReducer(state, action);
    return next === state ? state : withSavedFlag({ ...next, _history: state._history });
}

function initEditorState({ initialData, initialDraft }) {
    const state = withSnapshot(initialData ? { ...initialFormState, ...initialData, _history: [] } : initialFormState);
    return initialDraft ? formReducer(state, { type: "LOAD_DRAFT", payload: initialDraft }) : state;
}

const FormEditorContext = createContext(null);

export function FormEditorProvider({ children, initialData, initialDraft = null }) {
    const [state, rawDispatch] = useReducer(formReducer, { initialData, initialDraft }, initEditorState);

    const stateRef = useRef(state);
    useEffect(() => {
        stateRef.current = state;
    }, [state]);

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