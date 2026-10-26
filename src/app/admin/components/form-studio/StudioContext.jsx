"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from "react";

export const NONE = { kind: "none" };

const TOAST_MS = 2600;

function reducer(state, action) {
  switch (action.type) {
    case "ACTIVATE":
      if (state.activeFormId === action.formId) return { ...state, mode: action.mode ?? state.mode, selection: action.selection ?? state.selection, sheet: null };
      return { ...state, activeFormId: action.formId, mode: action.mode ?? state.mode, selection: action.selection ?? NONE, menu: null, sheet: null };

    case "SET_MODE":
      return state.mode === action.mode && !state.sheet ? state : { ...state, mode: action.mode, menu: null, sheet: null };

    case "SET_SHEET":
      return state.sheet === action.sheet ? state : { ...state, sheet: action.sheet, menu: null };

    case "SET_PREVIEW":
      return state.preview === action.preview ? state : { ...state, preview: action.preview };

    case "SELECT":
      return { ...state, selection: action.selection ?? NONE };

    case "TOGGLE_FILL":
      return state.fill
        ? { ...state, fill: false }
        : { ...state, fill: true, fillValues: {}, missing: {}, menu: null };

    case "SET_FILL_VALUE": {
      const values = { ...(state.fillValues[action.formId] ?? {}), [action.fieldId]: action.value };
      const missing = (state.missing[action.formId] ?? []).filter((id) => id !== action.fieldId);
      return { ...state, fillValues: { ...state.fillValues, [action.formId]: values }, missing: { ...state.missing, [action.formId]: missing } };
    }

    case "SET_MISSING":
      return { ...state, missing: { ...state.missing, [action.formId]: action.ids } };

    case "CLEAR_FILL":
      return { ...state, fillValues: {}, missing: {} };

    case "SET_DEVICE":
      return { ...state, devices: { ...state.devices, [action.formId]: action.device } };

    case "TOGGLE_LOGIC":
      return { ...state, showLogic: !state.showLogic };

    case "OPEN_MENU":
      return { ...state, menu: action.menu, preview: null };

    case "CLOSE_MENU":
      return state.menu ? { ...state, menu: null } : state;

    case "SET_PALETTE":
      return state.palette === action.open ? state : { ...state, palette: action.open, menu: null, sheet: action.open ? null : state.sheet };

    case "TOAST":
      return { ...state, toast: { text: action.text, tone: action.tone ?? "neutral", id: (state.toast?.id ?? 0) + 1 } };

    case "CLEAR_TOAST":
      return state.toast?.id === action.id ? { ...state, toast: null } : state;

    default:
      return state;
  }
}

const StudioContext = createContext(null);

export function StudioProvider({ initialFormId = null, initialMode = "page", children }) {
  const [state, dispatch] = useReducer(reducer, {
    activeFormId: initialFormId,
    mode: initialMode,
    selection: NONE,
    fill: false,
    fillValues: {},
    missing: {},
    devices: {},
    showLogic: true,
    menu: null,
    palette: false,
    sheet: null,
    preview: null,
    toast: null,
  });

  const memoryRef = useRef({});

  useEffect(() => {
    if (!state.toast) return undefined;
    const id = state.toast.id;
    const timer = setTimeout(() => dispatch({ type: "CLEAR_TOAST", id }), TOAST_MS);
    return () => clearTimeout(timer);
  }, [state.toast]);

  const remember = useCallback((formId, patch) => {
    if (!formId) return;
    memoryRef.current[formId] = { ...(memoryRef.current[formId] ?? {}), ...patch };
  }, []);

  const recall = useCallback((formId) => memoryRef.current[formId] ?? null, []);

  const actions = useMemo(() => ({
    activate: (formId, { mode, selection } = {}) => dispatch({ type: "ACTIVATE", formId, mode, selection }),
    setMode: (mode) => dispatch({ type: "SET_MODE", mode }),
    select: (selection) => dispatch({ type: "SELECT", selection }),
    toggleFill: () => dispatch({ type: "TOGGLE_FILL" }),
    setFillValue: (formId, fieldId, value) => dispatch({ type: "SET_FILL_VALUE", formId, fieldId, value }),
    setMissing: (formId, ids) => dispatch({ type: "SET_MISSING", formId, ids }),
    clearFill: () => dispatch({ type: "CLEAR_FILL" }),
    setDevice: (formId, device) => dispatch({ type: "SET_DEVICE", formId, device }),
    toggleLogic: () => dispatch({ type: "TOGGLE_LOGIC" }),
    openMenu: (menu) => dispatch({ type: "OPEN_MENU", menu }),
    closeMenu: () => dispatch({ type: "CLOSE_MENU" }),
    setPalette: (open) => dispatch({ type: "SET_PALETTE", open }),
    setSheet: (sheet) => dispatch({ type: "SET_SHEET", sheet }),
    setPreview: (preview) => dispatch({ type: "SET_PREVIEW", preview }),
    toast: (text, tone) => dispatch({ type: "TOAST", text, tone }),
    remember,
    recall,
  }), [recall, remember]);

  const value = useMemo(() => ({ ui: state, actions }), [state, actions]);

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio() {
  const context = useContext(StudioContext);
  if (!context) throw new Error("useStudio must be used within a StudioProvider");
  return context;
}
