"use client";

import { memo, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown, ArrowUp, Calendar, ChevronsUpDown, Clock, Copy, CornerDownRight, GripVertical, Lock, Plus, Trash2, Upload, X,
} from "lucide-react";
import { INPUT_TYPES } from "@/app/components/form-components/FormShortText";
import { Floating } from "@/app/components/utils/Floating";
import { accountFileRules } from "@/lib/guest-uploads";
import { REGISTRY } from "@/app/components/form-registry";
import { CHOICE_PRESET_LABELS } from "./studio-presets";
import { FIELD_TYPES, REPEATER_CHILD_TYPES } from "./studio-schema";
import { POPOVER_MOTION } from "./studio-motion";

const NO_VALUES = [];

export function focusEditable(key, atEnd = true) {
  setTimeout(() => {
    const element = document.querySelector(`[data-edit="${CSS.escape(key)}"]`);
    if (!element) return;
    element.focus();
    if (!atEnd) return;
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  }, 30);
}

export function Editable({ editKey, value, onChange, placeholder, className = "", singleLine = true, readOnly = false, onEnter, onBackspaceEmpty, onPasteLines, title }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const text = value ?? "";
    if (document.activeElement !== element && element.textContent !== text) element.textContent = text;
  });

  return (
    <span ref={ref} data-edit={editKey} role="textbox" aria-label={placeholder} aria-multiline={!singleLine} title={title}
      contentEditable={!readOnly} suppressContentEditableWarning spellCheck={false} data-placeholder={placeholder}
      onInput={(event) => {
        const element = event.currentTarget;
        if (!element.textContent && element.innerHTML) element.innerHTML = "";
        onChange?.(element.textContent);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" && (singleLine || event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          if (onEnter) onEnter();
          else event.currentTarget.blur();
          return;
        }
        if (event.key === "Backspace" && !event.currentTarget.textContent && onBackspaceEmpty) {
          event.preventDefault();
          onBackspaceEmpty();
          return;
        }
        if (event.key === "Escape") event.currentTarget.blur();
      }}
      onPaste={(event) => {
        event.preventDefault();
        const text = event.clipboardData.getData("text/plain");
        const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        if (lines.length > 1 && onPasteLines) {
          onPasteLines(lines);
          return;
        }
        document.execCommand("insertText", false, singleLine ? text.replace(/\r?\n/g, " ") : text);
      }}
      className={`studio-editable ${className}`}
    />
  );
}

function QuestionBadge({ number, conditional }) {
  return (
    <div data-anchor="number" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors ${
      conditional ? "border-skylab-400/40 bg-skylab-500/10 text-skylab-300" : "border-neutral-700 bg-neutral-900 text-neutral-300"
    }`}
    >
      {number}
    </div>
  );
}

function fileRulesLabel(acceptedFiles, maxSize) {
  const rules = accountFileRules(acceptedFiles, maxSize);
  const label = rules.label || "PDF, JPG, PNG, DOCX";
  return `${label} • MAKS ${Math.round(rules.maxBytes / 1024 / 1024)}MB`;
}

const BOX = "rounded-lg border border-white/10 bg-neutral-900/60";

function OptionRows({ field, selected, lockedValues, readOnly = false, api }) {
  const choices = field.props?.choices ?? [];

  return (
    <div className="mt-3 flex flex-col gap-2">
      {choices.map((choice, index) => {
        const locked = lockedValues.includes(choice);
        return (
          <div key={index} className={`group/opt flex items-center gap-3 rounded-md border border-white/10 bg-neutral-900/60 p-2`}>
            <input type="checkbox" disabled tabIndex={-1} className="checkbox shrink-0" />
            <Editable editKey={`o-${field.id}-${index}`} value={choice} placeholder={`Seçenek ${index + 1}`} readOnly={locked || readOnly}
              title={locked ? "Akış koşulu bu seçeneği karşılaştırıyor; adı değiştirilemez." : undefined}
              className={`min-w-0 flex-1 text-sm ${locked ? "text-neutral-400" : "text-neutral-200"}`}
              onChange={(value) => api.setChoice(field.id, index, value)}
              onEnter={() => api.addChoice(field.id, index + 1)}
              onBackspaceEmpty={() => api.removeChoice(field.id, index, true)}
              onPasteLines={(lines) => api.pasteChoices(field.id, index, lines)}
            />
            {locked ? <Lock size={12} className="shrink-0 text-neutral-500" /> : selected && choices.length > 1 ? (
              <button type="button" title="Seçeneği sil" aria-label="Seçeneği sil" onPointerDown={(event) => event.stopPropagation()}
                onClick={() => api.removeChoice(field.id, index, false)}
                className="grid size-5 shrink-0 place-items-center rounded text-neutral-600 opacity-0 transition-opacity hover:text-neutral-200 group-hover/opt:opacity-100"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
        );
      })}
      {selected && (
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => api.addChoice(field.id, choices.length)}
          className="flex items-center gap-3 rounded-md border border-dashed border-white/10 p-2 text-left text-sm text-neutral-500 transition-colors hover:border-white/20 hover:text-neutral-300"
        >
          <Plus size={14} className="mx-px" />
          Seçenek ekle
        </button>
      )}
    </div>
  );
}

function ComboOptions({ field, lockedValues, api }) {
  const props = field.props ?? {};
  const choices = props.choices ?? [];

  if (props.preset && CHOICE_PRESET_LABELS[props.preset]) {
    return (
      <p className="mt-2 px-0.5 text-2xs text-neutral-500">
        Hazır liste: {CHOICE_PRESET_LABELS[props.preset]}, {choices.length} seçenek. Listeyi sağ panelden değiştirirsin.
      </p>
    );
  }

  return (
    <div className="mt-2.5 border-l border-dashed border-white/15 pl-3">
      <p className="mb-1.5 text-3xs text-neutral-500">Seçenekler · başvuran açılır listede görür</p>
      <div className="flex flex-col gap-1">
        {choices.map((choice, index) => {
          const locked = lockedValues.includes(choice);
          return (
            <div key={index} className="group/opt flex items-center gap-2">
              <span className="w-4 shrink-0 text-right text-3xs tabular-nums text-neutral-600">{index + 1}</span>
              <Editable editKey={`o-${field.id}-${index}`} value={choice} placeholder={`Seçenek ${index + 1}`} readOnly={locked}
                className={`min-w-0 flex-1 text-sm ${locked ? "text-neutral-400" : "text-neutral-200"}`}
                onChange={(value) => api.setChoice(field.id, index, value)}
                onEnter={() => api.addChoice(field.id, index + 1)}
                onBackspaceEmpty={() => api.removeChoice(field.id, index, true)}
                onPasteLines={(lines) => api.pasteChoices(field.id, index, lines)}
              />
              {locked ? <Lock size={11} className="shrink-0 text-neutral-500" /> : choices.length > 1 ? (
                <button type="button" title="Seçeneği sil" aria-label="Seçeneği sil" onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => api.removeChoice(field.id, index, false)}
                  className="grid size-5 shrink-0 place-items-center rounded text-neutral-600 opacity-0 transition-opacity hover:text-neutral-200 group-hover/opt:opacity-100"
                >
                  <X size={12} />
                </button>
              ) : null}
            </div>
          );
        })}
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => api.addChoice(field.id, choices.length)}
          className="mt-0.5 inline-flex w-fit items-center gap-1 pl-6 text-2xs text-neutral-500 transition-colors hover:text-neutral-200"
        >
          <Plus size={12} />
          Seçenek ekle
        </button>
      </div>
    </div>
  );
}

function MatrixPreview({ field, selected, api }) {
  const rows = field.props?.rows ?? [];
  const columns = field.props?.columns ?? [];

  return (
    <div className="mt-4 w-full">
      <div className={`overflow-x-auto ${BOX}`}>
        <table className="w-full min-w-105 text-left">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="w-1/3 p-3" />
              {columns.map((column, index) => (
                <th key={index} className="group/col relative p-3 text-center text-2xs font-semibold uppercase tracking-wider text-neutral-400">
                  {selected ? (
                    <Editable editKey={`c-${field.id}-${index}`} value={column} placeholder={`Sütun ${index + 1}`}
                      onChange={(value) => api.setListItem(field.id, "columns", index, value)}
                    />
                  ) : column}
                  {selected && columns.length > 1 && (
                    <button type="button" aria-label="Sütunu sil" title="Sütunu sil" onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => api.removeListItem(field.id, "columns", index)}
                      className="absolute right-0.5 top-0.5 grid size-4 place-items-center rounded text-neutral-600 opacity-0 transition-opacity hover:text-neutral-200 group-hover/col:opacity-100"
                    >
                      <X size={11} />
                    </button>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="group/row">
                <td className="relative p-3 text-sm font-medium text-neutral-200">
                  {selected ? (
                    <Editable editKey={`r-${field.id}-${rowIndex}`} value={row} placeholder={`Satır ${rowIndex + 1}`}
                      onChange={(value) => api.setListItem(field.id, "rows", rowIndex, value)}
                    />
                  ) : row}
                  {selected && rows.length > 1 && (
                    <button type="button" aria-label="Satırı sil" title="Satırı sil" onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => api.removeListItem(field.id, "rows", rowIndex)}
                      className="absolute left-0 top-1/2 grid size-4 -translate-y-1/2 place-items-center rounded text-neutral-600 opacity-0 transition-opacity hover:text-neutral-200 group-hover/row:opacity-100"
                    >
                      <X size={11} />
                    </button>
                  )}
                </td>
                {columns.map((_, columnIndex) => (
                  <td key={columnIndex} className="p-2 text-center align-middle">
                    <span className="inline-block size-4.5 rounded-full border border-white/20 bg-neutral-900/80" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <div className="mt-2 flex gap-3 px-0.5">
          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => api.addListItem(field.id, "rows", "Satır")}
            className="inline-flex items-center gap-1 text-2xs text-neutral-500 transition-colors hover:text-neutral-200"
          >
            <Plus size={12} />
            Satır ekle
          </button>
          <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={() => api.addListItem(field.id, "columns", "Sütun")}
            className="inline-flex items-center gap-1 text-2xs text-neutral-500 transition-colors hover:text-neutral-200"
          >
            <Plus size={12} />
            Sütun ekle
          </button>
        </div>
      )}
    </div>
  );
}

function AddChildButton({ onPick }) {
  const [anchor, setAnchor] = useState(null);

  return (
    <>
      <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
        className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs font-medium transition-colors ${
          anchor ? "border-white/25 bg-white/5 text-neutral-200" : "border-white/15 bg-white/3 text-neutral-400 hover:border-white/25 hover:text-neutral-200"
        }`}
      >
        <Plus size={14} />
        Alan ekle
      </button>
      <AnimatePresence>
        {anchor ? (
          <Floating key="child-types" anchor={anchor} onDismiss={() => setAnchor(null)} placement="bottom" offset={6}>
            <motion.div data-studio-menu role="menu" onPointerDown={(event) => event.stopPropagation()} {...POPOVER_MOTION}
              className="w-48 rounded-[10px] border border-white/20 bg-[#1e1e1e] p-1.5 shadow-2xl shadow-black/50"
            >
              <p className="px-2 pb-1 pt-1 text-3xs text-neutral-500">Gruba alan ekle</p>
              {REPEATER_CHILD_TYPES.map((type) => {
                const { label, Icon } = FIELD_TYPES[type];
                return (
                  <button key={type} type="button" role="menuitem" onClick={() => { setAnchor(null); onPick(type); }}
                    className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-2xs text-neutral-300 transition-colors hover:bg-white/6 hover:text-white"
                  >
                    <Icon size={14} className="text-neutral-500" />
                    {label}
                  </button>
                );
              })}
            </motion.div>
          </Floating>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function RepeaterPreview({ field, selected, api }) {
  const children = Array.isArray(field.props?.fields) ? field.props.fields : [];

  return (
    <div className="mt-3 flex flex-col gap-3">
      <div className="rounded-lg border border-white/10 bg-neutral-900/40">
        <div className="border-b border-white/5 px-3 py-1.5 text-3xs font-medium text-neutral-500">1. kayıt</div>
        <div className="flex flex-col gap-3 p-3">
          {children.length === 0 ? <p className="px-0.5 text-xs text-neutral-500">Bu grupta henüz alan yok.</p> : null}
          {children.map((child) => (
            <div key={child.id} className="group/child flex min-w-0 flex-col [&>*:last-child]:mt-1.5">
              <div className="flex min-w-0 items-center gap-1.5 px-0.5">
                {selected ? (
                  <Editable editKey={`rc-${field.id}-${child.id}`} value={child.props?.question} placeholder="Alanın adını yazın"
                    className="min-w-0 flex-1 text-xs font-medium text-neutral-200"
                    onChange={(value) => api.updateChild(field.id, child.id, { question: value })}
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-300">{child.props?.question || REGISTRY[child.type]?.label || "Alan"}</span>
                )}
                {child.props?.required ? <span className="text-xs text-red-200/70">*</span> : null}
                {selected ? (
                  <button type="button" title="Alanı kaldır" aria-label="Alanı kaldır" onPointerDown={(event) => event.stopPropagation()}
                    onClick={() => api.removeChild(field.id, child.id)}
                    className="grid size-5 shrink-0 place-items-center rounded text-neutral-600 opacity-0 transition-opacity hover:text-neutral-200 focus-visible:opacity-100 group-hover/child:opacity-100"
                  >
                    <X size={12} />
                  </button>
                ) : null}
              </div>
              <ControlPreview field={child} selected={false} readOnly lockedValues={NO_VALUES} api={api} />
            </div>
          ))}
        </div>
      </div>
      <AddChildButton onPick={(type) => api.addChild(field.id, type)} />
    </div>
  );
}

function ControlPreview({ field, selected, lockedValues, readOnly = false, api }) {
  const props = field.props ?? {};

  switch (field.type) {
    case "short_text": {
      const input = INPUT_TYPES.find((type) => type.id === (props.inputType || "text")) ?? INPUT_TYPES[0];
      const Icon = input.icon;
      return (
        <div className="relative mt-3 flex w-full items-center">
          <div className="pointer-events-none absolute left-3.5 flex items-center justify-center text-neutral-500"><Icon size={16} strokeWidth={2} /></div>
          <div className={`block w-full truncate py-2 pl-10 pr-4 text-sm text-neutral-600 ${BOX}`}>{input.placeholder}</div>
        </div>
      );
    }
    case "long_text":
      return <div className={`mt-3 block h-19.5 w-full px-3 py-2 text-sm text-neutral-500 ${BOX}`}>Cevabınızı buraya yazın.</div>;
    case "combobox":
      return (
        <div className="mt-3 flex flex-col gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"><ChevronsUpDown size={16} /></span>
            <div className={`flex w-full items-center py-2 pl-9 pr-3 text-sm text-neutral-500 ${BOX}`}>Bir seçenek seçin</div>
          </div>
          {selected ? <ComboOptions field={field} lockedValues={lockedValues} api={api} /> : null}
        </div>
      );
    case "multi_choice":
      return <OptionRows field={field} selected={selected} lockedValues={lockedValues} readOnly={readOnly} api={api} />;
    case "toggle":
      return (
        <div className={`mt-3 flex w-full items-center justify-between gap-4 px-4 py-1.5 ${BOX}`}>
          <span className="select-none text-sm font-medium text-neutral-400">{props.falseLabel || "Hayır"}</span>
          <span className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-lg border-2 border-transparent bg-neutral-700">
            <span className="inline-block h-4 w-4 translate-x-0.5 rounded-md bg-white shadow" />
          </span>
        </div>
      );
    case "slider": {
      const min = Number(props.min ?? 0);
      const max = Number(props.max ?? 100);
      const middle = Math.round(min + (max - min) / 2);
      return (
        <div className={`mt-3 flex w-full items-center gap-4 px-4 py-2.5 ${BOX}`}>
          <span className="w-6 shrink-0 text-right text-xs font-medium text-neutral-500">{min}</span>
          <div className="relative h-1 flex-1 rounded-lg bg-neutral-800">
            <span className="absolute left-1/2 top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-300/40" />
          </div>
          <span className="w-6 shrink-0 text-left text-xs font-medium text-neutral-500">{max}</span>
          <div className="mx-1 h-5 w-px shrink-0 bg-white/10" />
          <span className="min-w-10 shrink-0 text-center text-sm text-neutral-200">{middle}</span>
        </div>
      );
    }
    case "file":
      return (
        <div className="relative mt-3 flex h-16 w-full items-center overflow-hidden rounded-lg border border-dashed border-white/10 bg-neutral-900/40 px-4 py-3">
          <div className="flex w-full items-center gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-white/5 text-neutral-400"><Upload size={18} /></div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-medium text-neutral-200">Dosya yükle veya sürükle</span>
              <span className="mt-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-500">{fileRulesLabel(props.acceptedFiles, props.maxSize)}</span>
            </div>
          </div>
        </div>
      );
    case "date":
    case "time": {
      const Icon = field.type === "date" ? Calendar : Clock;
      return (
        <div className="relative mt-3">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"><Icon size={16} /></span>
          <div className={`flex w-full items-center py-2 pl-9 pr-3 text-sm text-neutral-500 ${BOX}`}>{field.type === "date" ? "Tarih seçin" : "Saat seçin"}</div>
        </div>
      );
    }
    case "matrix":
      return <MatrixPreview field={field} selected={selected} api={api} />;
    case "repeater":
      return <RepeaterPreview field={field} selected={selected} api={api} />;
    default:
      return null;
  }
}

function hintOf(field) {
  if (field.type === "separator" || !field.props?.required) return null;
  if (field.type === "toggle") return "Devam etmek için onaylamalısınız";
  if (field.type === "matrix") return "Tüm satırların doldurulması zorunludur";
  if (field.type === "repeater") return "En az bir kayıt girin";
  return "Zorunlu alan";
}

function StripButton({ label, onClick, disabled, danger, children }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className={`grid size-6 place-items-center rounded-md text-neutral-400 transition-colors ${
        disabled ? "cursor-not-allowed opacity-30" : danger ? "hover:bg-red-500/10 hover:text-red-300" : "hover:bg-white/10 hover:text-neutral-200"
      }`}
    >
      {children}
    </button>
  );
}

function ActionStrip({ field, canUp, canDown, protectedReason, phone, api }) {
  return (
    <div onPointerDown={(event) => event.stopPropagation()}
      className={`absolute left-3 z-20 flex items-center gap-0.5 rounded-lg border border-white/15 bg-neutral-900 px-1 py-0.5 shadow-lg ${phone ? "-top-8" : "-top-3"}`}
    >
      <span title="Sürükleyerek taşı" aria-hidden="true"
        className="grid size-6 cursor-grab place-items-center rounded-md text-neutral-400 transition-colors hover:bg-white/10 hover:text-neutral-200 active:cursor-grabbing"
      >
        <GripVertical size={13} />
      </span>
      <span className="mx-0.5 h-4 w-px bg-white/10" />
      <StripButton label="Yukarı taşı (Alt+↑)" onClick={() => api.move([field.id], -1)} disabled={!canUp}><ArrowUp size={13} /></StripButton>
      <StripButton label="Aşağı taşı (Alt+↓)" onClick={() => api.move([field.id], 1)} disabled={!canDown}><ArrowDown size={13} /></StripButton>
      <StripButton label="Çoğalt (Ctrl+D)" onClick={() => api.duplicate([field.id])}><Copy size={13} /></StripButton>
      <span className="mx-0.5 h-4 w-px bg-white/10" />
      <StripButton label={protectedReason ?? "Sil (Delete)"} danger onClick={() => api.remove([field.id])} disabled={Boolean(protectedReason)}>
        <Trash2 size={13} />
      </StripButton>
    </div>
  );
}

export function InsertLine({ index, api, disabled = false }) {
  if (disabled) return <div className="h-0" />;
  return (
    <div className="group/ins relative h-0 transition-[height] duration-200 ease-out hover:h-9 focus-within:h-9">
      <div className="absolute inset-x-0 -bottom-2.5 -top-2.5 z-10" />
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center gap-2 opacity-0 transition-opacity duration-150 group-hover/ins:opacity-100 group-focus-within/ins:opacity-100">
        <span className="h-px flex-1 bg-skylab-400/25" />
        <button type="button" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => api.openMenu(event.currentTarget, index)}
          className="pointer-events-auto flex items-center gap-1 rounded-full border border-white/15 bg-neutral-900 px-2 py-0.5 text-3xs font-medium text-neutral-400 shadow transition-colors hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
        >
          <Plus size={11} />
          Ekle
        </button>
        <span className="h-px flex-1 bg-skylab-400/25" />
      </div>
    </div>
  );
}

export const FieldBlock = memo(function FieldBlock({
  field, number, selected = false, solo = false, condText = null, canUp = false, canDown = false, isLast = false,
  protectedReason = null, lockBadge = null, lockedValues = [], phone = false, hoverable = true, api,
}) {
  const props = field.props ?? {};
  const isSeparator = field.type === "separator";
  const hint = hintOf(field);

  return (
    <div data-fid={field.id} className={`relative ${!isLast && !isSeparator ? "border-b border-white/5 pb-6" : ""}`}>
      <div onPointerDown={api.pressField} onClick={(event) => api.selectField(event, field.id)}
        className={`group/q relative flex flex-col rounded-xl transition-[box-shadow,background-color] duration-150 ${phone ? "p-2" : "p-4"} ${
          selected ? "bg-skylab-500/[0.04] ring-2 ring-skylab-400/50" : hoverable ? "hover:ring-1 hover:ring-white/15" : ""
        }`}
      >
        {solo ? <ActionStrip field={field} canUp={canUp} canDown={canDown} protectedReason={protectedReason} phone={phone} api={api} /> : null}

        {(condText || lockBadge) && (
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            {condText ? (
              <span className="inline-flex items-center gap-1 rounded-md border border-skylab-400/20 bg-skylab-500/10 px-1.5 py-0.5 text-3xs text-skylab-300">
                <CornerDownRight size={10} />
                {condText}
              </span>
            ) : null}
            {lockBadge ? (
              <span title={lockBadge.title} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-3xs text-neutral-400">
                <Lock size={10} />
                {lockBadge.label}
              </span>
            ) : null}
          </div>
        )}

        {isSeparator ? (
          <>
            <div className="flex items-center gap-3">
              <Editable editKey={`q-${field.id}`} value={props.title} placeholder="Bölüm başlığı" className="min-w-0 max-w-[70%] text-lg font-medium text-neutral-100"
                onChange={(value) => api.updateProps(field.id, { title: value })}
              />
              <div className="h-px flex-1 bg-white/10" />
            </div>
            {props.description || selected ? (
              <p className="mt-1 text-xs text-neutral-400">
                <Editable editKey={`d-${field.id}`} value={props.description} placeholder="Açıklama ekle" singleLine={false}
                  onChange={(value) => api.updateProps(field.id, { description: value })}
                />
              </p>
            ) : null}
          </>
        ) : (
          <>
            <div className="flex gap-3">
              <QuestionBadge number={number} conditional={Boolean(field.condition?.fieldId)} />
              <div className="flex w-full min-w-0 flex-col">
                <p className="text-sm font-medium text-neutral-100">
                  <Editable editKey={`q-${field.id}`} value={props.question} placeholder="Sorunuzu yazın"
                    onChange={(value) => api.updateProps(field.id, { question: value })}
                  />
                  {props.required ? <span className="ml-1 text-red-200/70">*</span> : null}
                </p>
                {props.description || selected ? (
                  <p className="my-1 text-xs text-neutral-400">
                    <Editable editKey={`d-${field.id}`} value={props.description} placeholder="Açıklama ekle (isteğe bağlı)" singleLine={false}
                      onChange={(value) => api.updateProps(field.id, { description: value })}
                    />
                  </p>
                ) : null}
              </div>
            </div>
            <ControlPreview field={field} selected={selected} lockedValues={lockedValues} api={api} />
            {hint ? <span className={`px-0.5 text-2xs text-neutral-500 ${field.type === "toggle" ? "mt-1.5" : "mt-1"}`}>{hint}</span> : null}
          </>
        )}
      </div>
    </div>
  );
});
