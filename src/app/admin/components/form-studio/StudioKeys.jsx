"use client";

import { useEffect, useRef } from "react";
import { useFormEditor } from "../form-editor/FormEditorContext";
import { useFormActions } from "./useFormActions";
import { NONE, useStudio } from "./StudioContext";
import { focusEditable } from "./StudioField";
import { REORDER_NOTICE, scrollFieldIntoView } from "./StudioPage";

function isTyping(target) {
  return Boolean(target?.isContentEditable) || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName);
}

function inStudio(target) {
  return !target?.closest || Boolean(target.closest("[data-studio-root]")) || target === document.body;
}

function handleShared(event, context) {
  const { ui, studio, flow } = context;
  const modifier = event.metaKey || event.ctrlKey;
  const key = event.key.toLowerCase();

  if (event.key === "Escape") {
    if (ui.palette) { studio.setPalette(false); return true; }
    if (ui.menu) { studio.closeMenu(); return true; }
    if (ui.sheet) { studio.setSheet(null); return true; }
    if (isTyping(event.target)) { event.target.blur(); return true; }
    if (ui.fill) { studio.toggleFill(); return true; }
    if (ui.mode === "map" && flow?.hasActiveForm) { flow.onBackToPage(); return true; }
    if (ui.selection.kind !== "none") { studio.select(NONE); return true; }
    return false;
  }

  if (modifier && key === "k") {
    event.preventDefault();
    studio.setPalette(!ui.palette);
    return true;
  }

  if (modifier && key === "s") {
    event.preventDefault();
    context.onSave?.();
    return true;
  }

  if (ui.palette || ui.menu || ui.sheet || isTyping(event.target)) return true;

  if (modifier && key === "z" && !event.shiftKey) {
    event.preventDefault();
    if (ui.mode === "map" || !flow?.hasActiveForm) flow?.onUndoFlow?.();
    else context.onUndoForm?.();
    return true;
  }

  if (flow?.inFlow && !modifier && !event.altKey && !event.shiftKey && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
    event.preventDefault();
    flow.onStep(event.key === "ArrowLeft" ? -1 : 1);
    return true;
  }

  if (flow?.inFlow && !modifier && key === "m") {
    flow.onToggleMap();
    return true;
  }

  if (flow?.inFlow && event.shiftKey && event.code === "Digit1") {
    event.preventDefault();
    flow.onShowMap();
    return true;
  }

  return ui.mode === "map";
}

export function FlowKeys({ flow, onSave }) {
  const { ui, actions: studio } = useStudio();
  const contextRef = useRef(null);

  useEffect(() => {
    contextRef.current = { ui, studio, flow, onSave };
  });

  useEffect(() => {
    const onKey = (event) => {
      const context = contextRef.current;
      if (!context || !inStudio(event.target)) return;
      handleShared(event, context);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}

export function FormKeys({ eventLinked = false, flow = null, onSave }) {
  const { state, dispatch } = useFormEditor();
  const actions = useFormActions({ eventLinked });
  const { ui, actions: studio } = useStudio();
  const contextRef = useRef(null);

  useEffect(() => {
    contextRef.current = {
      ui, studio, flow, onSave, actions, fields: state.schema,
      onUndoForm: () => dispatch({ type: "UNDO" }),
    };
  });

  useEffect(() => {
    const onKey = (event) => {
      const context = contextRef.current;
      if (!context || !inStudio(event.target)) return;
      if (handleShared(event, context)) return;

      const { ui: current, studio: control, actions: form, fields } = context;
      const modifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      const selected = current.selection.kind === "fields" ? current.selection.ids.filter((id) => fields.some((field) => field.id === id)) : [];

      if (current.fill) {
        if (!modifier && key === "p") control.toggleFill();
        return;
      }

      if (modifier && key === "d") {
        event.preventDefault();
        if (selected.length) {
          const copies = form.duplicate(selected);
          if (copies.length) control.select({ kind: "fields", ids: copies });
        }
        return;
      }

      if (modifier && key === "a") {
        event.preventDefault();
        control.select(fields.length ? { kind: "fields", ids: fields.map((field) => field.id) } : NONE);
        return;
      }

      if ((event.key === "Delete" || event.key === "Backspace") && selected.length) {
        event.preventDefault();
        const result = form.remove(selected);
        if (result.removed) {
          control.select(NONE);
          control.toast(result.cleared ? `${result.removed} bileşen silindi; ${result.cleared} sorunun koşulu kaldırıldı` : `${result.removed} bileşen silindi. Ctrl+Z geri alır.`);
        } else if (result.blocked) {
          control.toast("Bu soru silinemez", "red");
        }
        return;
      }

      if (event.altKey && (event.key === "ArrowUp" || event.key === "ArrowDown") && selected.length) {
        event.preventDefault();
        if (form.move(selected, event.key === "ArrowUp" ? -1 : 1) > 0) control.toast(REORDER_NOTICE);
        scrollFieldIntoView(selected[0]);
        return;
      }

      if (!event.altKey && !modifier && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        if (fields.length === 0) return;
        event.preventDefault();
        const ids = fields.map((field) => field.id);
        const position = selected.length ? ids.indexOf(selected[selected.length - 1]) : -1;
        const next = Math.min(ids.length - 1, Math.max(0, position + (event.key === "ArrowUp" ? -1 : 1)));
        control.select({ kind: "fields", ids: [ids[next]] });
        scrollFieldIntoView(ids[next]);
        return;
      }

      if (event.key === "Enter" && selected.length === 1) {
        event.preventDefault();
        focusEditable(`q-${selected[0]}`);
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        const index = selected.length ? Math.max(...selected.map((id) => fields.findIndex((field) => field.id === id))) + 1 : fields.length;
        const anchorId = selected.length ? selected[selected.length - 1] : fields[fields.length - 1]?.id;
        const anchor = anchorId ? document.querySelector(`[data-studio-page] [data-fid="${CSS.escape(anchorId)}"]`) : document.querySelector("[data-studio-page] [data-edit='form-title']");
        if (anchor) control.openMenu({ anchor, index });
        return;
      }

      if (modifier) return;
      if (key === "l") control.toggleLogic();
      else if (key === "p") control.toggleFill();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return null;
}
