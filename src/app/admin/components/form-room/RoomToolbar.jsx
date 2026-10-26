"use client";

import { ChartColumn, FileText, List, PencilLine, Workflow } from "lucide-react";
import { TOOLBAR_CLASS } from "../form-studio/StudioPage";

export const ROOM_MODES = [
  { id: "edit", label: "Düzenle", key: "D", Icon: PencilLine },
  { id: "overview", label: "Özet", key: "Ö", Icon: FileText },
  { id: "analytics", label: "Analitik", key: "A", Icon: ChartColumn },
  { id: "response", label: "Cevaplar", key: "C", Icon: List },
];

export function RoomToolButton({ label, active = false, compact = false, disabled = false, onClick, children }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled} aria-pressed={active}
      className={`flex shrink-0 items-center justify-center whitespace-nowrap rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        compact ? "h-11 min-w-13 flex-col gap-0.5 px-1.5 text-3xs" : "h-8 gap-1.5 px-2.5 text-2xs"
      } ${active ? "bg-skylab-500/15 text-skylab-300" : "text-neutral-300 enabled:hover:bg-white/5 enabled:hover:text-neutral-100"}`}
    >
      {children}
    </button>
  );
}

function SideButton({ button, compact }) {
  return (
    <RoomToolButton label={button.title} compact={compact} onClick={button.onClick}>
      <button.Icon size={15} />
      {button.label}
    </RoomToolButton>
  );
}

export default function RoomToolbar({ mode, onMode, disabledModes = [], inFlow = false, left = null, right = null, compact = false, hideEdit = false, bar = null }) {
  const divider = compact ? null : <span className="mx-1 h-5 w-px bg-white/10" />;

  if (bar) return <div className={TOOLBAR_CLASS}>{bar}</div>;

  return (
    <div className={TOOLBAR_CLASS}>
      {left ? <><SideButton button={left} compact={compact} />{divider}</> : null}
      {ROOM_MODES.filter((item) => !(hideEdit && item.id === "edit")).map((item) => (
        <RoomToolButton key={item.id} label={`${item.label} (${item.key})`} compact={compact} active={mode === item.id}
          disabled={disabledModes.includes(item.id)} onClick={() => onMode(item.id)}
        >
          <item.Icon size={15} />
          {item.label}
        </RoomToolButton>
      ))}
      {inFlow ? (
        <>
          {divider}
          <RoomToolButton label="Akış (M)" compact={compact} active={mode === "workflow"} onClick={() => onMode("workflow")}>
            <Workflow size={15} />
            Akış
          </RoomToolButton>
        </>
      ) : null}
      {right ? <>{divider}<SideButton button={right} compact={compact} /></> : null}
    </div>
  );
}
