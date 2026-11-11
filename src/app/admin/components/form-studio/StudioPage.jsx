"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS as DndCSS } from "@dnd-kit/utilities";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { FileText, GitBranch, LayoutTemplate, List, ListTree, Map as MapIcon, MessageSquare, Monitor, PencilLine, Play, Plus, SlidersHorizontal, Smartphone, Timer, TriangleAlert } from "lucide-react";
import { FormDisplayerHeader } from "@/app/components/form-displayer/components/FormDisplayerComponents";
import TaskBlock from "@/app/components/form-displayer/components/TaskBlock";
import { isIdentityField } from "@/lib/event-handoff";
import { durationText } from "@/lib/form-timing";
import { useFormEditor } from "../form-editor/FormEditorContext";
import { LIVE_LOCK_HINT, useFormActions } from "./useFormActions";
import { NONE, showsInspector, useStudio } from "./StudioContext";
import { FieldBlock, InsertLine, focusEditable } from "./StudioField";
import { useStudioPresence } from "./StudioPresence";
import { useStudioSession } from "./StudioSession";
import { useBoardPush } from "./StudioBoard";
import { CommentNotice, CommentSheet, CommentSide, useCommentBoard } from "./StudioComments";
import { useMediaQuery } from "./useMediaQuery";
import StudioTask from "./StudioTask";
import StudioInsertMenu from "./StudioInsertMenu";
import { EmptyStart, IntroFields, TemplateIntro, TemplateStart, previewOf } from "./StudioStart";
import { CARD_WIDTH, CardFooter, CardShell, DeliverablesHeader, DisplayFields, StepBar } from "./StudioCard";
import BrandPaper from "@/brands/BrandPaper";
import { conditionLabel, insertIndexOf, missingFieldIds, questionNumbers, requiredFill, visibleFieldsOf } from "./studio-schema";
import { DROP_ANIMATION, conditionLoss, slotOf, useStudioSensors } from "./studio-dnd";
import { ARRIVAL_EASE, ARRIVAL_MS, SLIDE_IN_EASING, SLIDE_IN_MS, SLIDE_PX, prefersReducedMotion } from "./studio-motion";

const LOCK_BADGE = { label: "Akış koşulu", title: "Akıştaki bir yönlendirme koşulu bu soruyu okuyor; soru silinemez." };
const LIVE_LOCK_BADGE = { label: "Akış koşulu", title: LIVE_LOCK_HINT };
const IDENTITY_BADGE = { label: "Kimlik alanı", title: "Etkinlik formunda ad, soyad ve e-posta soruları kalmalı." };
export const REORDER_NOTICE = "Koşul kaldırıldı: koşulun sorusu artık bu sorudan sonra geliyor";
const NO_VALUES = [];

const emptySubscribe = () => () => {};

function SortableField({ id, spaced, children }) {
  const { setNodeRef, listeners, transform, transition, isDragging } = useSortable({ id });

  return (
    <div ref={setNodeRef} {...listeners} style={{ transform: DndCSS.Translate.toString(transform), transition }} className="relative cursor-grab">
      <div className={isDragging ? "invisible" : undefined}>{children}</div>
      {isDragging ? (
        <div className={`pointer-events-none absolute inset-x-0 top-0 rounded-xl border border-dashed border-skylab-400/40 bg-skylab-500/4 ${spaced ? "bottom-6" : "bottom-0"}`} />
      ) : null}
    </div>
  );
}

export function DragLossNote({ count, className = "" }) {
  if (!count) return null;
  return (
    <p className={`inline-flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-3xs text-amber-200 ${className}`}>
      <TriangleAlert size={11} className="shrink-0" />
      Buraya bırakırsan {count} sorunun koşulu kalkar
    </p>
  );
}

export function scrollFieldIntoView(id) {
  setTimeout(() => {
    const element = document.querySelector(`[data-studio-page] [data-fid="${CSS.escape(id)}"]`);
    element?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, 40);
}

function useInsertItem({ eventLinked = false } = {}) {
  const actions = useFormActions({ eventLinked });
  const { actions: studio } = useStudio();

  return useCallback((item, index) => {
    if (item.kind === "type") {
      const id = actions.insertAt(index, item.type);
      studio.select({ kind: "fields", ids: [id] });
      focusEditable(`q-${id}`);
      scrollFieldIntoView(id);
    } else if (item.kind === "template") {
      const ids = actions.insertFields(index, item.template.schema);
      if (ids.length === 0) return;
      studio.select({ kind: "fields", ids });
      studio.toast(`${item.template.title || "Şablon"} şablonundan ${ids.length} bileşen eklendi`);
      scrollFieldIntoView(ids[0]);
    }
  }, [actions, studio]);
}

const SCROLL_GUTTER = 10;
const COLUMN_PAD = 56;
const CARD_TOP = 72;
const ARRIVAL_GROW = `flex-grow ${ARRIVAL_MS}ms cubic-bezier(${ARRIVAL_EASE.join(", ")})`;

export function pageCardRect(width, { phone = false, scrollTop = 0 } = {}) {
  const cardWidth = CARD_WIDTH[phone ? "phone" : "desktop"];
  const usable = width - SCROLL_GUTTER;
  const column = Math.min(usable, cardWidth + COLUMN_PAD * 2);
  return { left: (usable - column) / 2 + COLUMN_PAD, top: CARD_TOP - scrollTop, width: Math.min(cardWidth, column - COLUMN_PAD * 2) };
}

export const TOOLBAR_CLASS ="absolute bottom-3 left-1/2 z-30 flex w-max -translate-x-1/2 items-center gap-0.5 rounded-xl border border-white/10 bg-neutral-900 p-1 shadow-xl shadow-black/40 sm:bottom-4";
export const TOOL_DIVIDER = "mx-1 hidden h-5 w-px bg-white/10 sm:block";

export function ToolButton({ label, active = false, onClick, className = "", children }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      className={`flex h-11 min-w-13 shrink-0 flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-lg px-1.5 text-3xs font-medium transition-colors sm:h-8 sm:min-w-0 sm:flex-row sm:gap-1.5 sm:px-2.5 sm:text-2xs ${
        active ? "bg-skylab-500/15 text-skylab-300" : "text-neutral-300 hover:bg-white/5 hover:text-neutral-100"
      } ${className}`}
    >
      {children}
    </button>
  );
}

export function SheetButtons({ side }) {
  const { actions: studio } = useStudio();

  return side === "start" ? (
    <>
      <ToolButton label="Sorular ve adımlar" className="xl:hidden" onClick={() => studio.setSheet("outline")}>
        <ListTree size={15} />
        Sorular
      </ToolButton>
      <span className={`${TOOL_DIVIDER} xl:hidden`} />
    </>
  ) : (
    <>
      <span className={`${TOOL_DIVIDER} lg:hidden`} />
      <ToolButton label="Ayarlar" className="lg:hidden" onClick={() => studio.setSheet("inspector")}>
        <SlidersHorizontal size={15} />
        Ayarlar
      </ToolButton>
    </>
  );
}

export function OverviewButton({ onClick }) {
  const { ui } = useStudio();

  return (
    <>
      <ToolButton label={ui.template ? "Şablonlara dön" : "Özete dön"} onClick={onClick}>
        {ui.template ? <List size={15} /> : <FileText size={15} />}
        {ui.template ? "Şablonlar" : "Özet"}
      </ToolButton>
      <span className={TOOL_DIVIDER} />
    </>
  );
}

export function measureCard(formId, phone = false) {
  const box = document.querySelector("[data-studio-center]")?.getBoundingClientRect();
  const page = document.querySelector("[data-studio-page]");
  const card = page?.querySelector(".studio-card")?.getBoundingClientRect();
  if (!box || !card) return null;

  const rect = { left: card.left - box.left, top: card.top - box.top, width: card.width };
  const frameWidth = pageCardRect(box.width).width;
  const scale = rect.width / frameWidth;
  const gap = page.querySelector("[data-description-gap]");
  const echo = { height: card.height / scale, gap: gap ? (gap.offsetHeight + parseFloat(getComputedStyle(gap).marginTop)) / scale : 0 };

  return {
    entry: { formId, rect, frameWidth, echo },
    page: { ...rect, baseTop: rect.top + page.scrollTop, containerWidth: box.width, phone },
  };
}

export function StudioToolbar({ inFlow, empty = false, comments = null, settings = true, onAdd, onShowMap, onStartFlow = null, onOverview = null }) {
  const { ui, actions: studio } = useStudio();

  return (
    <div data-studio-toolbar onPointerDown={(event) => event.stopPropagation()} className={TOOLBAR_CLASS}>
      {onOverview ? <OverviewButton onClick={onOverview} /> : null}
      <SheetButtons side="start" />
      <ToolButton label="Bileşen ekle (/)" onClick={(event) => onAdd(event.currentTarget)}>
        <Plus size={15} />
        Ekle
      </ToolButton>
      {empty ? null : (
        <>
          <span className="mx-1 hidden h-5 w-px bg-white/10 md:block" />
          <button type="button" aria-label="Koşulları göster (L)" title="Koşulları göster (L)" onClick={studio.toggleLogic}
            className={`hidden size-8 place-items-center rounded-lg transition-colors md:grid ${ui.showLogic ? "bg-skylab-500/15 text-skylab-300" : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"}`}
          >
            <GitBranch size={16} />
          </button>
          <ToolButton label={ui.fill ? "Düzenlemeye dön (P)" : "Başvuran gibi doldur (P)"} active={ui.fill} onClick={studio.toggleFill}>
            {ui.fill ? <PencilLine size={15} /> : <Play size={15} />}
            {ui.fill ? "Düzenle" : "Doldur"}
          </ToolButton>
          {comments && !ui.fill ? (
            <ToolButton label="Yorumlar (C)" active={comments.open} onClick={comments.onToggle} className="relative">
              <MessageSquare size={15} />
              <span className="flex items-center gap-1">
                Yorumlar
                {comments.count > 0 ? <span className="tabular-nums opacity-70">{comments.count}</span> : null}
                {comments.unread > 0 ? (
                  <span title={`${comments.unread} yorumda okunmamış mesaj var`} className="grid h-3.5 min-w-3.5 place-items-center rounded-full bg-skylab-400 px-1 text-[9px] font-semibold leading-none tabular-nums text-neutral-950">{comments.unread}</span>
                ) : null}
              </span>
            </ToolButton>
          ) : null}
        </>
      )}
      {inFlow ? (
        <>
          <span className={TOOL_DIVIDER} />
          <ToolButton label="Akış haritası (M)" onClick={onShowMap}>
            <MapIcon size={15} />
            Harita
          </ToolButton>
        </>
      ) : onStartFlow && !empty ? (
        <>
          <span className={TOOL_DIVIDER} />
          <ToolButton label="Akış başlat" onClick={onStartFlow}>
            <MapIcon size={15} />
            <span className="sm:hidden">Akış</span>
            <span className="hidden sm:inline">Akış başlat</span>
          </ToolButton>
        </>
      ) : null}
      {settings ? <SheetButtons side="end" /> : null}
    </div>
  );
}

function LogicLayer({ fields, anchors, selectedIds }) {
  if (!anchors) return null;
  const dependents = fields.filter((field) => field.condition?.fieldId && anchors.points[field.condition.fieldId] != null && anchors.points[field.id] != null);
  if (dependents.length === 0) return null;

  const sources = [];
  dependents.forEach((field) => {
    if (!sources.includes(field.condition.fieldId)) sources.push(field.condition.fieldId);
  });

  const x0 = anchors.left;
  const paths = dependents.map((field) => {
    const lane = x0 - 18 - sources.indexOf(field.condition.fieldId) * 12;
    const ys = anchors.points[field.condition.fieldId];
    const yd = anchors.points[field.id];
    const radius = 6;
    const hot = selectedIds.includes(field.id) || selectedIds.includes(field.condition.fieldId);
    return {
      id: field.id,
      hot,
      d: `M ${x0} ${ys} H ${lane + radius} Q ${lane} ${ys} ${lane} ${ys + radius} V ${yd - radius} Q ${lane} ${yd} ${lane + radius} ${yd} H ${x0 - 5}`,
      head: `M ${x0 - 5} ${yd - 3.5} L ${x0} ${yd} L ${x0 - 5} ${yd + 3.5} Z`,
    };
  });
  const ordered = [...paths.filter((path) => !path.hot), ...paths.filter((path) => path.hot)];

  return (
    <svg className="pointer-events-none absolute left-0 top-0 hidden overflow-visible md:block" width="1" height="1" aria-hidden="true">
      {ordered.map((path) => (
        <g key={path.id}>
          <path d={path.d} fill="none" stroke={path.hot ? "rgba(235,213,238,0.85)" : "rgba(235,213,238,0.28)"} strokeWidth={path.hot ? 1.6 : 1.2} />
          <path d={path.head} fill={path.hot ? "rgba(235,213,238,0.85)" : "rgba(235,213,238,0.28)"} />
        </g>
      ))}
      {sources.map((id) => (
        <circle key={`s-${id}`} cx={x0 - 1} cy={anchors.points[id]} r="3" fill={selectedIds.includes(id) ? "#ebd5ee" : "rgba(235,213,238,0.5)"} />
      ))}
    </svg>
  );
}

export default function StudioPage({ eventLinked = false, stepInfo = null, inFlow = false, nextBlock = null, cardDecor = null, arrival = null, userName, onShowMap, onStartFlow = null, onArrived, onOverview = null, start = null }) {
  const { state } = useFormEditor();
  const actions = useFormActions({ eventLinked });
  const insertItem = useInsertItem({ eventLinked });
  const { ui, actions: studio } = useStudio();
  const session = useStudioSession();
  const template = ui.template;
  const inspectorShown = showsInspector(ui, state.schema);

  const formKey = ui.activeFormId ?? "new";
  const phone = ui.devices[formKey] === "phone";
  const fields = state.schema;
  const selectedIds = ui.selection.kind === "fields" ? ui.selection.ids : [];
  const taskSelected = ui.selection.kind === "task";
  const fillValues = ui.fillValues[formKey] ?? {};
  const missing = ui.missing[formKey] ?? [];
  const numbers = useMemo(() => questionNumbers(fields), [fields]);
  const presence = useStudioPresence();
  const phoneViewport = useMediaQuery("(max-width: 767px)");

  const scrollRef = useRef(null);
  const columnRef = useRef(null);
  const cardRef = useRef(null);
  const pushRef = useRef(null);
  const sideRef = useRef(null);
  const board = useCommentBoard({ formId: state.id, fields, selectedIds, phoneViewport });
  const { openFor: openComments } = board;
  useBoardPush({ onBoard: board.onBoard, scrollRef, cardRef, pushRef, sideRef });
  const selectionRef = useRef(ui.selection);
  const fieldsRef = useRef(fields);
  const [activeId, setActiveId] = useState(null);
  const [loss, setLoss] = useState(0);
  const [anchors, setAnchors] = useState(null);
  const [arriving] = useState(() => (arrival && !prefersReducedMotion() ? arrival : null));
  const [settled, setSettled] = useState(!arriving?.settle);
  const sensors = useStudioSensors();
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);

  useEffect(() => {
    selectionRef.current = ui.selection;
    fieldsRef.current = fields;
  });

  useEffect(() => {
    if (arrival) onArrived?.();
  }, [arrival, onArrived]);

  useEffect(() => {
    if (settled) return undefined;
    let cancelled = false;
    cardRef.current?.getBoundingClientRect();
    arriving.settle.then(() => {
      if (!cancelled) setSettled(true);
    });
    return () => { cancelled = true; };
  }, [settled, arriving]);

  useLayoutEffect(() => {
    const slide = arriving?.slide;
    const column = columnRef.current;
    if (!slide || !column) return undefined;
    const animation = column.animate(
      [{ transform: `translate(${slide.x * SLIDE_PX}px, ${slide.y * SLIDE_PX}px)`, opacity: 0 }, { transform: "none", opacity: 1 }],
      { duration: SLIDE_IN_MS, easing: SLIDE_IN_EASING },
    );
    return () => animation.cancel();
  }, [arriving]);

  useLayoutEffect(() => {
    const element = scrollRef.current;
    const memory = studio.recall(formKey);
    if (element && memory?.scrollTop) element.scrollTop = memory.scrollTop;
    return () => studio.remember(formKey, { scrollTop: element?.scrollTop ?? 0 });
  }, [formKey, studio]);

  const measure = useCallback(() => {
    const column = columnRef.current;
    const card = cardRef.current;
    if (!column || !card) return;
    const base = column.getBoundingClientRect();
    const points = {};
    column.querySelectorAll("[data-fid]").forEach((element) => {
      const badge = element.querySelector('[data-anchor="number"]');
      if (!badge) return;
      const rect = badge.getBoundingClientRect();
      points[element.dataset.fid] = Math.round(rect.top + rect.height / 2 - base.top);
    });
    const value = { points, left: Math.round(card.getBoundingClientRect().left - base.left) };
    setAnchors((previous) => (JSON.stringify(previous) === JSON.stringify(value) ? previous : value));
  }, []);

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  });

  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => measure());
    observer.observe(card);
    return () => observer.disconnect();
  }, [measure, ui.fill]);

  const handleDragStart = ({ active }) => {
    setActiveId(active.id);
    setLoss(0);
    const focused = document.activeElement;
    if (focused instanceof HTMLElement && focused.isContentEditable) focused.blur();
  };

  const handleDragOver = ({ active, over }) => {
    setLoss(over ? conditionLoss(fieldsRef.current, active.id, over.id) : 0);
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    setLoss(0);
    const slot = over ? slotOf(fieldsRef.current, active.id, over.id) : null;
    if (slot == null) return;
    if (actions.reorder(active.id, slot) > 0) studio.toast(REORDER_NOTICE);
  };

  const handleDragCancel = () => {
    setActiveId(null);
    setLoss(0);
  };

  const openMenu = useCallback((anchor, index) => studio.openMenu({ anchor, index }), [studio]);

  const api = useMemo(() => ({
    openComments,
    pressField: (event) => {
      if (event.shiftKey || event.metaKey || event.ctrlKey) event.preventDefault();
    },
    selectField: (event, id) => {
      if (event.target.closest?.("button, a, input")) return;
      const current = selectionRef.current;
      if (event.shiftKey || event.metaKey || event.ctrlKey) {
        const ids = current.kind === "fields" ? current.ids : [];
        const next = ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
        studio.select(next.length ? { kind: "fields", ids: next } : NONE);
        return;
      }
      if (current.kind === "fields" && current.ids.length === 1 && current.ids[0] === id && !current.childId) return;
      studio.select({ kind: "fields", ids: [id] });
    },
    selectChild: (event, id, childId) => {
      if (event.shiftKey || event.metaKey || event.ctrlKey) return;
      event.stopPropagation();
      if (event.target.closest?.("button, a, input")) return;
      const current = selectionRef.current;
      if (current.kind === "fields" && current.ids.length === 1 && current.ids[0] === id && current.childId === childId) return;
      studio.select({ kind: "fields", ids: [id], childId });
    },
    updateProps: actions.updateProps,
    setChoice: actions.setChoice,
    addChoice: (id, at) => {
      actions.addChoice(id, at);
      focusEditable(`o-${id}-${at}`);
    },
    removeChoice: (id, index, focusPrevious) => {
      if (actions.removeChoice(id, index) && focusPrevious) focusEditable(`o-${id}-${Math.max(0, index - 1)}`);
    },
    pasteChoices: actions.pasteChoices,
    setListItem: actions.setListItem,
    addListItem: actions.addListItem,
    removeListItem: actions.removeListItem,
    updateChild: actions.updateChild,
    addChild: (id, type) => {
      const childId = actions.addChild(id, type);
      if (!childId) return;
      studio.select({ kind: "fields", ids: [id], childId });
      focusEditable(`rc-${id}-${childId}`);
    },
    removeChild: (id, childId) => {
      actions.removeChild(id, childId);
      if (selectionRef.current.childId === childId) studio.select({ kind: "fields", ids: [id] });
    },
    move: (ids, direction) => {
      if (actions.move(ids, direction) > 0) studio.toast(REORDER_NOTICE);
      scrollFieldIntoView(ids[0]);
    },
    duplicate: (ids) => {
      const copies = actions.duplicate(ids);
      if (copies.length) studio.select({ kind: "fields", ids: copies });
    },
    remove: (ids) => {
      const result = actions.remove(ids);
      if (result.removed === 0) {
        if (result.blocked) studio.toast(result.waitsForSave ? LIVE_LOCK_HINT : "Bu soru silinemez", "red");
        return;
      }
      studio.select(NONE);
      studio.toast(result.cleared
        ? `${result.removed} bileşen silindi; ${result.cleared} sorunun koşulu kaldırıldı`
        : `${result.removed} bileşen silindi. Ctrl+Z geri alır.`);
    },
    openMenu,
  }), [actions, openComments, openMenu, studio]);

  const pickFromMenu = (item) => {
    const index = ui.menu?.index ?? fields.length;
    studio.closeMenu();
    insertItem(item, index);
  };

  const submitFill = () => {
    const ids = missingFieldIds(fields, fillValues);
    studio.setMissing(formKey, ids);
    if (ids.length) {
      studio.toast(`${ids.length} zorunlu soru boş`, "red");
      setTimeout(() => document.querySelector(`[data-studio-page] [data-fill-id="${CSS.escape(ids[0])}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 40);
    } else {
      studio.toast(template ? "Zorunlu sorular dolu; hiçbir şey kaydedilmedi" : "Gönderildi gibi davranıldı; hiçbir şey kaydedilmedi");
    }
  };

  const handleBackgroundDown = (event) => {
    if (ui.fill) return;
    if (event.target.closest?.("[data-fid], [data-task], [data-next-block], [data-studio-menu], [data-comment-side], button, a, input, textarea")) return;
    if (!event.target.closest?.(".studio-card")) studio.closeComments();
    studio.select(NONE);
  };

  const task = state.task;
  const empty = fields.length === 0 && !ui.fill;
  const visible = ui.fill ? visibleFieldsOf(fields, fillValues) : fields;
  const fill = ui.fill ? requiredFill(fields, fillValues) : 0;
  const width = CARD_WIDTH[phone ? "phone" : "desktop"];
  const cardMotion = arriving?.settle ? { flex: `${settled ? 1 : 0} 1 auto`, transition: ARRIVAL_GROW } : null;
  const fieldIds = fields.map((field) => field.id);
  const activeIndex = activeId ? fieldIds.indexOf(activeId) : -1;
  const activeField = activeIndex >= 0 ? fields[activeIndex] : null;

  const blockProps = (field, index) => {
    const locked = actions.lockedById.get(field.id) ?? null;
    const identity = actions.eventLinked && isIdentityField(field);
    return {
      field, phone, api,
      number: numbers.get(field.id),
      selected: selectedIds.includes(field.id),
      solo: !activeId && selectedIds.length === 1 && selectedIds[0] === field.id,
      childId: selectedIds.length === 1 && selectedIds[0] === field.id ? ui.selection.childId ?? null : null,
      condText: conditionLabel(field, fields, numbers),
      canUp: index > 0,
      canDown: index < fields.length - 1,
      isLast: index === fields.length - 1,
      protectedReason: locked ? locked.liveOnly ? "Kayıtlı akış bu soruyu hâlâ okuyor; önce kaydedin" : "Akış koşulu bu soruyu okuyor; silinemez" : identity ? "Etkinlik kimlik alanı silinemez" : null,
      lockBadge: locked ? locked.liveOnly ? LIVE_LOCK_BADGE : LOCK_BADGE : identity ? IDENTITY_BADGE : null,
      lockedValues: locked?.values ?? NO_VALUES,
      others: presence.byField.get(field.id),
      commentCount: ui.fill ? 0 : board.counts.get(field.id) ?? 0,
      commentActive: board.open && board.activeField === field.id,
      commentUnread: board.unreadFields.has(field.id),
      commentable: Boolean(state.id) && state.canEdit && !ui.fill && !template,
    };
  };

  return (
    <div className="relative h-full min-h-0">
      <div ref={scrollRef} data-studio-page data-commenting={board.onBoard ? "true" : undefined} onPointerDown={handleBackgroundDown}
        className={`studio-fade h-full overflow-y-auto overflow-x-hidden bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-size-[22px_22px] bg-local [scrollbar-gutter:stable] scrollbar ${inspectorShown ? "" : "mr-[calc(var(--inspector-room)*-1)]"}`}
      >
        <div ref={pushRef} className={`flex min-h-full flex-col transition-transform duration-400 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${template ? "w-(--canvas-width)" : ""}`}>
        <div ref={columnRef} data-studio-column className={`relative mx-auto flex w-full flex-1 flex-col px-3 pt-4 sm:px-14 sm:pt-10 ${empty ? "pb-24 sm:pb-20" : "pb-36 sm:pb-40"}`}
          style={{ maxWidth: width + 112 }}
        >
          <div className="mb-2 flex items-center gap-2 px-1">
            {stepInfo ? (
              <span className={`grid size-4 place-items-center rounded border text-4xs font-semibold ${stepInfo.isStart ? "border-skylab-400/40 bg-skylab-500/10 text-skylab-300" : "border-white/10 bg-white/5 text-neutral-400"}`}>
                {stepInfo.stage ?? "?"}
              </span>
            ) : null}
            {template ? (
              <span className="inline-flex min-w-0 items-center gap-1.5 text-2xs font-medium text-neutral-400">
                <LayoutTemplate size={12} className="shrink-0 text-neutral-500" />
                <span className="truncate">Şablon · başvuran yalnız kartı görür</span>
              </span>
            ) : (
              <span className="min-w-0 truncate text-2xs font-medium text-neutral-400">{state.title || "Adsız form"}</span>
            )}
            {state.timeLimitMinutes ? (
              <span className="inline-flex shrink-0 items-center gap-0.5 text-3xs text-amber-300/90"><Timer size={10} />{durationText(state.timeLimitMinutes)}</span>
            ) : null}
            <span className="ml-auto hidden items-center gap-0.5 sm:flex">
              <button type="button" title="Masaüstü genişliği" aria-label="Masaüstü genişliği" onClick={() => studio.setDevice(formKey, "desktop")}
                className={`grid size-6 place-items-center rounded transition-colors ${!phone ? "bg-white/10 text-neutral-100" : "text-neutral-500 hover:text-neutral-200"}`}
              >
                <Monitor size={13} />
              </button>
              <button type="button" title="Telefon genişliği" aria-label="Telefon genişliği" onClick={() => studio.setDevice(formKey, "phone")}
                className={`grid size-6 place-items-center rounded transition-colors ${phone ? "bg-white/10 text-neutral-100" : "text-neutral-500 hover:text-neutral-200"}`}
              >
                <Smartphone size={13} />
              </button>
            </span>
          </div>

          {template ? <TemplateIntro title={state.title} description={state.description} onTitle={actions.setTitle} onDescription={actions.setDescription} setup={fields.length === 0} phone={phone} /> : null}

          <div ref={cardRef} className="relative mx-auto flex w-full flex-1 flex-col"
            style={{ maxWidth: width, ...cardMotion }}
          >
            {ui.fill ? (
              <CardShell phone={phone} active brand={state.brand} className={template ? "" : "flex-1"}>
                {stepInfo ? <StepBar flowName={stepInfo.flowName} stage={stepInfo.stage} total={stepInfo.total} fill={fill} timeLimitMinutes={state.timeLimitMinutes} /> : null}
                {template ? null : <FormDisplayerHeader title={state.title} description={state.description} />}
                {task?.content?.trim() ? <TaskBlock task={task} title={state.title} /> : null}
                {task && fields.length > 0 ? <DeliverablesHeader phone={phone} /> : null}
                {visible.length > 0 ? (
                  <DisplayFields fields={visible} values={fillValues} missing={missing} interactive eventLinked={actions.eventLinked}
                    onChange={(id, value) => studio.setFillValue(formKey, id, value)}
                  />
                ) : (
                  <p className="flex min-h-[20vh] items-center justify-center text-sm text-neutral-400">{template ? "Bu şablonda" : "Bu formda"} gösterilecek soru yok.</p>
                )}
                <CardFooter phone={phone} userName={userName} onSubmit={submitFill} bare={template} submitLabel={template ? "Kontrol et" : undefined} />
              </CardShell>
            ) : (
              <CardShell phone={phone} active brand={state.brand} className={template && fields.length > 0 ? "" : "flex-1"}>
                {stepInfo ? <StepBar flowName={stepInfo.flowName} stage={stepInfo.stage} total={stepInfo.total} timeLimitMinutes={state.timeLimitMinutes} /> : null}
                {template ? null : (
                  <IntroFields title={state.title} description={state.description} onTitle={actions.setTitle} onDescription={actions.setDescription}
                    setup={fields.length === 0} phone={phone} collapsed={!settled}
                  />
                )}

                {task ? (
                  <StudioTask task={task} timeLimitMinutes={state.timeLimitMinutes} selected={taskSelected} phone={phone}
                    onPointerDown={() => { if (!taskSelected) studio.select({ kind: "task" }); }}
                    onChange={actions.setTask} onNotice={(text) => studio.toast(text)}
                  />
                ) : null}
                {task && fields.length > 0 ? <DeliverablesHeader phone={phone} /> : null}

                {fields.length > 0 ? (
                  <DndContext sensors={sensors} collisionDetection={closestCenter}
                    onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}
                  >
                    <SortableContext items={fieldIds} strategy={verticalListSortingStrategy}>
                      <div className="flex flex-1 flex-col">
                        {fields.map((field, index) => (
                          <SortableField key={field.id} id={field.id} spaced={index < fields.length - 1 && field.type !== "separator"}>
                            <InsertLine index={index} api={api} disabled={Boolean(activeId)} />
                            <FieldBlock {...blockProps(field, index)} />
                          </SortableField>
                        ))}
                        <InsertLine index={fields.length} api={api} disabled={Boolean(activeId)} />
                      </div>
                    </SortableContext>
                    {isClient ? createPortal(
                      <DragOverlay dropAnimation={DROP_ANIMATION} modifiers={[restrictToVerticalAxis]}>
                        {activeField ? (
                          <BrandPaper brand={state.brand}>
                            <div className="cursor-grabbing rounded-xl bg-[#1f1f1f] shadow-2xl shadow-black/60 ring-1 ring-skylab-400/40">
                              <FieldBlock {...blockProps(activeField, activeIndex)} solo={false} isLast hoverable={false} commentCount={0} commentable={false} />
                              {loss ? <div className={phone ? "px-2 pb-2" : "px-4 pb-3"}><DragLossNote count={loss} /></div> : null}
                            </div>
                          </BrandPaper>
                        ) : null}
                      </DragOverlay>,
                      document.body,
                    ) : null}
                  </DndContext>
                ) : start ? start(phone) : (
                  <>
                    <EmptyStart phone={phone} />
                    <TemplateStart phone={phone} onPick={(item) => insertItem({ kind: "template", template: item }, fields.length)} />
                  </>
                )}

                {fields.length > 0 && !template ? <CardFooter phone={phone} userName={userName} /> : null}
              </CardShell>
            )}
            {ui.fill ? null : cardDecor}
          </div>

          {ui.showLogic && !ui.fill && !activeId ? <LogicLayer fields={fields} anchors={anchors} selectedIds={selectedIds} /> : null}

          {nextBlock ? (
            <div data-next-block className="mx-auto mt-7 w-full" style={{ maxWidth: width }}>{nextBlock}</div>
          ) : null}

          {state.id && !template ? <CommentSide board={board} sideRef={sideRef} columnRef={columnRef} fields={fields} userId={session.userId} canWrite={state.canEdit} isOwner={Number(state.userRole) === 3} /> : null}
        </div>
        </div>
      </div>

      <StudioToolbar inFlow={inFlow} empty={empty} settings={inspectorShown} onShowMap={onShowMap} onStartFlow={onStartFlow} onOverview={onOverview} onAdd={(anchor) => openMenu(anchor, insertIndexOf(fields, ui.selection))}
        comments={state.id && !template ? { open: board.open, count: board.openCount, unread: board.news.length, onToggle: studio.toggleComments } : null}
      />

      {state.id && !template && !ui.fill ? <CommentNotice board={board} numbers={numbers} /> : null}

      {state.id && !template ? <CommentSheet board={board} fields={fields} numbers={numbers} userId={session.userId} canWrite={state.canEdit} isOwner={Number(state.userRole) === 3} /> : null}

      <AnimatePresence>
        {ui.menu && !ui.fill ? (
          <StudioInsertMenu key="insert-menu" anchor={ui.menu.anchor} initialView={ui.menu.view} allowTemplates={!template} onPick={pickFromMenu} onClose={studio.closeMenu}
            placement={ui.menu.align === "panel" ? "bottom-start" : "bottom"} matchWidth={ui.menu.align === "panel"}
            onHover={empty ? (item) => studio.setPreview(previewOf(item)) : undefined}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}
