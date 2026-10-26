"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS as DndCSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { Activity, ChevronsUpDown, ClipboardList, CornerDownRight, FileText, GripVertical, LayoutTemplate, Map as MapIcon, PanelLeftClose, Plus, Workflow } from "lucide-react";
import { PanelButton } from "@/app/admin/components/utils/SidePanel";
import { useFormEditor } from "../form-editor/FormEditorContext";
import { useFormActions } from "./useFormActions";
import { NONE, useStudio } from "./StudioContext";
import { conditionPhrase, fieldLabel, fieldTypeOf, insertIndexOf, questionNumbers, visibleFieldsOf } from "./studio-schema";
import { DragLossNote, REORDER_NOTICE, scrollFieldIntoView } from "./StudioPage";
import { DROP_ANIMATION, conditionLoss, slotOf, useStudioSensors } from "./studio-dnd";

const emptySubscribe = () => () => {};

export function OutlineHeader({ title, untitled = false, inFlow, onOpenPalette, onOpenFlowPage, onCollapse }) {
  const SwitchIcon = inFlow ? Workflow : FileText;

  return (
    <div className="relative flex h-10 shrink-0 items-center border-b border-neutral-800 px-1.5">
      <button type="button" data-palette-anchor onClick={onOpenPalette} title="Akış ya da form aç (Ctrl+K)"
        className="group flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-white/5"
      >
        <SwitchIcon size={14} className="shrink-0 text-neutral-500" />
        <span className={`min-w-0 flex-1 truncate text-sm font-semibold ${untitled ? "text-neutral-500" : "text-neutral-200"}`}>{title}</span>
        <span className="hidden shrink-0 rounded border border-white/10 px-1 font-mono text-4xs text-neutral-500 2xl:inline">Ctrl K</span>
        <ChevronsUpDown size={13} className="shrink-0 text-neutral-500 transition-colors group-hover:text-neutral-300" />
      </button>
      {inFlow && onOpenFlowPage ? (
        <button type="button" title="Akış sayfası: başvuranlar ve başvuru kabulü" aria-label="Akış sayfası" onClick={onOpenFlowPage}
          className="ml-0.5 grid size-7 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
        >
          <Activity size={14} />
        </button>
      ) : null}
      {onCollapse ? (
        <button type="button" title="Paneli kapat" aria-label="Paneli kapat" onClick={onCollapse}
          className="ml-0.5 grid size-8 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
        >
          <PanelLeftClose size={15} />
        </button>
      ) : null}
    </div>
  );
}

export function OutlineSteps({ nodes, stages, activeFormId, dirtyIds, questionCounts, mapActive, onActivate, onToggleMap }) {
  return (
    <div className="shrink-0 border-b border-neutral-800/60 px-1.5 pb-2 pt-2.5">
      <div className="mb-1 flex items-center gap-2 px-1.5">
        <span className="text-2xs font-medium text-neutral-500">Adımlar</span>
        <span className="h-px flex-1 bg-white/5" />
        <span title="Önceki ve sonraki adım" className="font-mono text-3xs text-neutral-600">← →</span>
        <button type="button" title="Akış haritası (M)" aria-label="Akış haritası" onClick={onToggleMap}
          className={`grid size-5 place-items-center rounded transition-colors ${mapActive ? "bg-skylab-500/15 text-skylab-300" : "text-neutral-500 hover:bg-white/5 hover:text-neutral-200"}`}
        >
          <MapIcon size={12} />
        </button>
      </div>
      {nodes.length === 0 ? <p className="px-2 py-1.5 text-2xs text-neutral-600">Henüz adım yok.</p> : null}
      {nodes.map((node) => {
        const active = node.formId === activeFormId;
        return (
          <button key={node.nodeKey} type="button" onClick={() => onActivate(node.formId)}
            className={`group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${active ? "bg-white/[0.06]" : "hover:bg-white/[0.03]"}`}
          >
            <span className={`grid size-5 shrink-0 place-items-center rounded-md border text-3xs font-semibold ${node.isStart ? "border-skylab-400/40 bg-skylab-500/10 text-skylab-300" : "border-white/10 bg-white/5 text-neutral-400"}`}>
              {stages.depths.get(node.nodeKey) ?? "?"}
            </span>
            <span className={`min-w-0 flex-1 truncate text-xs transition-colors ${active ? "text-neutral-100" : "text-neutral-400 group-hover:text-neutral-200"}`}>{node.formTitle || "Adsız form"}</span>
            {dirtyIds.includes(node.formId) ? <span title="Kaydedilmemiş değişiklik var" className="size-1.5 shrink-0 rounded-full bg-skylab-400" /> : null}
            <span className="shrink-0 text-3xs tabular-nums text-neutral-600">{questionCounts[node.formId] ?? ""}</span>
          </button>
        );
      })}
    </div>
  );
}

function RowBody({ field, fields, numbers, selected }) {
  if (field.type === "separator") {
    return (
      <>
        <span className="w-4 shrink-0" />
        <span className={`min-w-0 truncate text-2xs font-medium ${selected ? "text-skylab-300" : "text-neutral-500"}`}>{field.props?.title || "Ayıraç"}</span>
        <span className="mt-2 h-px flex-1 bg-white/5" />
      </>
    );
  }

  const type = fieldTypeOf(field);
  const phrase = field.condition?.fieldId ? conditionPhrase(field.condition, fields) : null;

  return (
    <>
      <span className="mt-px w-4 shrink-0 text-right text-3xs tabular-nums text-neutral-600">{numbers.get(field.id)}</span>
      <type.Icon size={13} className={`mt-0.5 shrink-0 ${selected ? "text-skylab-300" : "text-neutral-500"}`} />
      <span className="min-w-0 flex-1">
        <span className={`block truncate text-xs ${selected ? "text-skylab-300" : "text-neutral-300"}`}>
          {field.props?.question ? fieldLabel(field) : <span className="text-neutral-600">Soru metni yok</span>}
          {field.props?.required ? <span className="ml-0.5 text-red-200/70">*</span> : null}
        </span>
        {phrase ? (
          <span className="mt-0.5 flex min-w-0 items-center gap-1 text-3xs text-neutral-500">
            <CornerDownRight size={10} className="shrink-0 text-skylab-400/70" />
            <span className="truncate">{numbers.get(field.condition.fieldId)} · <span className="text-neutral-300">{phrase}</span></span>
          </span>
        ) : null}
      </span>
    </>
  );
}

function OutlineRow({ field, fields, numbers, selected, hidden, disabled, onSelect }) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({ id: field.id, disabled });
  const isSeparator = field.type === "separator";

  return (
    <div ref={setNodeRef} {...listeners} role="button" tabIndex={0}
      onClick={(event) => onSelect(field.id, event.shiftKey || event.metaKey || event.ctrlKey)}
      onKeyDown={(event) => { if (event.key === "Enter") onSelect(field.id, false); }}
      style={{ transform: DndCSS.Translate.toString(transform), transition }}
      className={`group relative select-none rounded-md text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-skylab-400/40 ${
        disabled ? "cursor-default" : "cursor-grab"
      } ${isDragging ? "" : selected ? "bg-skylab-500/10" : "hover:bg-white/4"}`}
    >
      <div className={`flex items-start gap-2 px-2 ${isSeparator ? "pb-1 pt-3" : "py-1.5"} ${isDragging ? "invisible" : hidden ? "opacity-35" : ""}`}>
        <RowBody field={field} fields={fields} numbers={numbers} selected={selected} />
        <GripVertical size={12} className="mt-0.5 shrink-0 text-neutral-700 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      {isDragging ? <span className="pointer-events-none absolute inset-0 rounded-md border border-dashed border-skylab-400/40 bg-skylab-500/5" /> : null}
    </div>
  );
}

export function OutlineQuestions({ eventLinked = false, onAdd, onShowPage }) {
  const { state } = useFormEditor();
  const actions = useFormActions({ eventLinked });
  const { ui, actions: studio } = useStudio();
  const [activeId, setActiveId] = useState(null);
  const [loss, setLoss] = useState(0);
  const sensors = useStudioSensors(4);
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const buttonsRef = useRef(null);
  const headingRef = useRef(null);

  const fields = state.schema;
  const numbers = questionNumbers(fields);
  const selectedIds = ui.selection.kind === "fields" ? ui.selection.ids : [];
  const formKey = ui.activeFormId ?? "new";
  const values = ui.fillValues[formKey] ?? {};
  const visible = ui.fill ? visibleFieldsOf(fields, values) : fields;
  const hiddenCount = fields.length - visible.length;
  const conditionCount = fields.filter((field) => field.condition?.fieldId).length;
  const questionCount = fields.filter((field) => field.type !== "separator").length;
  const activeField = activeId ? fields.find((field) => field.id === activeId) ?? null : null;

  const select = (id, multi) => {
    if (ui.fill) return;
    if (multi) {
      const next = selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id];
      studio.select(next.length ? { kind: "fields", ids: next } : NONE);
    } else {
      studio.select({ kind: "fields", ids: [id] });
      if (ui.sheet) studio.setSheet(null);
    }
    scrollFieldIntoView(id);
  };

  const addTask = () => {
    if (ui.fill || state.task) return;
    onShowPage?.();
    actions.setTask({ content: "", collapsible: true, downloadable: true });
    studio.select({ kind: "task" });
    if (ui.sheet) studio.setSheet(null);
    setTimeout(() => document.querySelector("[data-studio-page]")?.scrollTo({ top: 0, behavior: "smooth" }), 40);
  };

  const toggleMenu = (anchor, index, options) => {
    if (ui.menu?.source === options.source) studio.closeMenu();
    else onAdd(anchor, index, { ...options, align: "panel" });
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div ref={buttonsRef} className="flex shrink-0 flex-col gap-1.5 px-3 pt-3">
        <PanelButton compact icon={ClipboardList} className="w-full" disabled={ui.fill || Boolean(state.task)} onClick={addTask}
          title={state.task ? "Formda zaten bir görev var" : "Formun başına görev ekle"}
        >
          Görev ekle
        </PanelButton>
        <PanelButton compact icon={LayoutTemplate} className="w-full" disabled={ui.fill} active={ui.menu?.source === "outline-templates"}
          onClick={() => toggleMenu(buttonsRef.current, insertIndexOf(fields, ui.selection), { view: "templates", source: "outline-templates" })}
        >
          Şablon ekle
        </PanelButton>
      </div>

      <div ref={headingRef} className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-3">
        <span className="text-2xs font-medium text-neutral-500">Sorular</span>
        <span className="h-px flex-1 bg-white/5" />
        <button type="button" title="Sona soru ekle" aria-label="Sona soru ekle" disabled={ui.fill}
          onClick={() => toggleMenu(headingRef.current, fields.length, { source: "outline-add" })}
          className={`grid size-5 shrink-0 place-items-center rounded transition-colors hover:bg-white/5 hover:text-neutral-100 disabled:opacity-40 ${
            ui.menu?.source === "outline-add" ? "bg-white/5 text-neutral-100" : "text-neutral-300"
          }`}
        >
          <Plus size={13} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2 scrollbar">
        {state.task ? (
          <button type="button" onClick={() => !ui.fill && studio.select({ kind: "task" })}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${ui.selection.kind === "task" ? "bg-skylab-500/10 text-skylab-300" : "text-neutral-400 hover:bg-white/[0.04]"}`}
          >
            <span className="w-4" />
            <ClipboardList size={13} className="text-neutral-500" />
            <span className="truncate">Görev</span>
          </button>
        ) : null}
        {fields.length === 0 ? <p className="px-2 py-3 text-2xs text-neutral-600">Henüz soru yok.</p> : null}
        <DndContext sensors={sensors} collisionDetection={closestCenter}
          onDragStart={({ active }) => {
            setActiveId(active.id);
            setLoss(0);
            studio.select({ kind: "fields", ids: [active.id] });
          }}
          onDragOver={({ active, over }) => setLoss(over ? conditionLoss(fields, active.id, over.id) : 0)}
          onDragEnd={({ active, over }) => {
            setActiveId(null);
            setLoss(0);
            const slot = over ? slotOf(fields, active.id, over.id) : null;
            if (slot == null) return;
            if (actions.reorder(active.id, slot) > 0) studio.toast(REORDER_NOTICE);
            scrollFieldIntoView(active.id);
          }}
          onDragCancel={() => { setActiveId(null); setLoss(0); }}
        >
          <SortableContext items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
            {fields.map((field) => (
              <OutlineRow key={field.id} field={field} fields={fields} numbers={numbers} selected={selectedIds.includes(field.id)}
                hidden={ui.fill && !visible.includes(field)} disabled={ui.fill} onSelect={select}
              />
            ))}
          </SortableContext>
          {isClient ? createPortal(
            <DragOverlay dropAnimation={DROP_ANIMATION} modifiers={[restrictToVerticalAxis]}>
              {activeField ? (
                <div className="cursor-grabbing rounded-md bg-neutral-800 shadow-xl shadow-black/50 ring-1 ring-skylab-400/40">
                  <div className={`flex items-start gap-2 px-2 ${activeField.type === "separator" ? "pb-1 pt-3" : "py-1.5"}`}>
                    <RowBody field={activeField} fields={fields} numbers={numbers} selected />
                  </div>
                  {loss ? <div className="px-2 pb-2"><DragLossNote count={loss} /></div> : null}
                </div>
              ) : null}
            </DragOverlay>,
            document.body,
          ) : null}
        </DndContext>
      </div>

      <div className="shrink-0 border-t border-neutral-800 px-3 py-2.5 text-3xs leading-relaxed text-neutral-600">
        {questionCount} soru · {conditionCount} koşullu{ui.fill ? <> · <span className="text-neutral-400">{hiddenCount} gizli</span></> : null}
        <span className="block pointer-coarse:hidden">/ ekle · Ctrl+D çoğalt · Delete sil · Alt+↑↓ taşı</span>
      </div>
    </div>
  );
}
