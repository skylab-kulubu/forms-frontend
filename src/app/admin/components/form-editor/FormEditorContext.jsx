"use client";

import { createContext, useContext, useReducer, useMemo } from "react";

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
    userRole: 3
};

function formReducer(state, action) {
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

const FormEditorContext = createContext(null);

export function FormEditorProvider({ children, initialData }) {
    const initializer = initialData ? { ...initialFormState, ...initialData } : initialFormState;
    const [state, dispatch] = useReducer(formReducer, initializer);
    const value = useMemo(() => ({ state, dispatch }), [state]);

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