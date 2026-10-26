"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Tip from "@/app/admin/components/utils/Tip";

const emptySubscribe = () => () => {};

export function HeaderIcon({ icon: Icon, label, onClick, disabled = false }) {
  return (
    <Tip label={label}>
      <button type="button" aria-label={label} onClick={onClick} disabled={disabled}
        className="rounded-lg p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800/70 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-inherit"
      >
        <Icon size={16} />
      </button>
    </Tip>
  );
}

export function HeaderButton({ icon: Icon, label, onClick, disabled = false, primary = false }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label}
      className={`ml-1 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 disabled:pointer-events-none disabled:opacity-50 lg:px-2.5 ${
        primary ? "border-skylab-400/40 bg-skylab-500/15 text-skylab-300 hover:bg-skylab-500/25" : "border-white/15 bg-white/5 text-neutral-200 hover:border-skylab-400/40 hover:bg-skylab-500/10 hover:text-skylab-300"
      }`}
    >
      <Icon size={14} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

export function HeaderTouch({ icon: Icon, label, onClick, disabled = false }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} disabled={disabled}
      className="grid size-11 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100 disabled:opacity-40"
    >
      <Icon size={17} />
    </button>
  );
}

export default function RoomHeader({ desktop = null, mobile = null }) {
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const desktopTarget = mounted ? document.getElementById("admin-header-slot") : null;
  const mobileTarget = mounted ? document.getElementById("admin-header-slot-mobile") : null;

  return (
    <>
      {desktopTarget && desktop ? createPortal(<div className="flex items-center gap-1 text-neutral-500">{desktop}</div>, desktopTarget, desktopTarget.id) : null}
      {mobileTarget && mobile ? createPortal(<div className="flex items-center">{mobile}</div>, mobileTarget, mobileTarget.id) : null}
    </>
  );
}
