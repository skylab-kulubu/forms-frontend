"use client";

import { createContext, useContext, useReducer, useMemo } from "react";

const initialGroupState = {
    id: null,
    title: "Yeni Grup",
    description: "",
    schema: [],
    isSaved: true,
};

function groupReducer(state, action) {
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

const GroupEditorContext = createContext(null);

export function GroupEditorProvider({ children, initialData }) {
    const initializer = initialData ? { ...initialGroupState, ...initialData } : initialGroupState;
    const [state, dispatch] = useReducer(groupReducer, initializer);
    const value = useMemo(() => ({ state, dispatch }), [state]);

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