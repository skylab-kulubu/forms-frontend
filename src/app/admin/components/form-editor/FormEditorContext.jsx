"use client";

import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

const OWNER_ROLE = 3;

function stateOf(snapshot, membership) {
    const { view, form } = snapshot;
    return {
        ...view,
        id: snapshot.id,
        editors: snapshot.team,
        userRole: form ? Number(form.userRole ?? 0) : OWNER_ROLE,
        workflow: membership === undefined ? form?.workflow ?? null : membership,
        publishedVersion: form ? Number(form.publishedVersion ?? 1) : 0,
        neverPublished: snapshot.neverPublished,
        restored: Boolean(snapshot.restored),
        dirty: snapshot.dirty,
        pending: snapshot.pending,
        isSaved: !snapshot.dirty && !snapshot.pending,
        canEdit: snapshot.canEdit,
        canUndo: snapshot.canUndo,
        canRedo: snapshot.canRedo,
        online: snapshot.online,
        syncedAt: snapshot.syncedAt,
        publishedAt: snapshot.publishedAt,
        failure: snapshot.failure,
        revoked: snapshot.revoked,
    };
}

function dispatchTo(doc, action) {
    switch (action.type) {
        case "SET_TITLE":
            return doc.set(["title"], action.payload);
        case "SET_DESCRIPTION":
            return doc.set(["description"], action.payload);
        case "SET_SCHEMA":
            return doc.setSchema(action.payload);
        case "SET_STATUS":
            return doc.set(["status"], action.payload);
        case "SET_TASK":
            return doc.set(["task"], action.payload);
        case "UPDATE_SETTINGS":
            return doc.set([action.payload.key], action.payload.value);
        case "SET_EDITORS":
            return doc.ensureCreated().then(() => doc.setTeam(action.payload));
        case "UNDO":
            return doc.undo();
        case "REDO":
            return doc.redo();
        case "LOAD_FORM":
            return doc.reload();
        default:
            return undefined;
    }
}

const FormEditorContext = createContext(null);

export function FormEditorProvider({ doc, membership, children }) {
    const snapshot = useSyncExternalStore(doc.subscribe, doc.getSnapshot, doc.getSnapshot);
    const state = useMemo(() => stateOf(snapshot, membership), [snapshot, membership]);
    const dispatch = useCallback((action) => dispatchTo(doc, action), [doc]);
    const value = useMemo(() => ({ state, dispatch, doc }), [state, dispatch, doc]);

    return (
        <FormEditorContext.Provider value={value}>
            {children}
        </FormEditorContext.Provider>
    );
}

export function useOptionalFormEditor() {
    return useContext(FormEditorContext);
}

export function useFormEditor() {
    const context = useContext(FormEditorContext);
    if (!context) {
        throw new Error("useFormEditor must be used within a FormEditorProvider");
    }
    return context;
}
