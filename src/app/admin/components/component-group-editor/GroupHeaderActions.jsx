"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, CircleAlert, CircleGauge, Share2, Trash2, Undo2 } from "lucide-react";
import Popover from "@/app/components/utils/Popover";
import Tip from "@/app/admin/components/utils/Tip";

const emptySubscribe = () => () => {};

const ICON_BUTTON = "rounded-lg p-1.5 transition-colors hover:bg-neutral-800/70 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-inherit";

export default function GroupHeaderActions({ saveStatus, onShare, onUndo, canUndo, onDelete, isDeleteDisabled, onSave, isPending, isError, error }) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const targets = isMounted
    ? ["admin-header-slot", "admin-header-slot-mobile"].map((id) => document.getElementById(id)).filter(Boolean)
    : [];

  const content = (
    <div className="flex items-center gap-1 text-neutral-500">
      {saveStatus && <div className="mr-2 hidden sm:block">{saveStatus}</div>}

      <Tip label="Şablonu paylaş">
        <button type="button" aria-label="Şablonu paylaş" onClick={onShare} disabled={!onShare} className={ICON_BUTTON}>
          <Share2 size={16} />
        </button>
      </Tip>

      <Tip label="Geri al">
        <button type="button" aria-label="Geri al" onClick={onUndo} disabled={!canUndo} className={ICON_BUTTON}>
          <Undo2 size={16} />
        </button>
      </Tip>

      <Tip label="Şablonu sil">
        <button type="button" aria-label="Şablonu sil" onClick={onDelete} disabled={isDeleteDisabled || !onDelete} className={ICON_BUTTON}>
          <Trash2 size={16} />
        </button>
      </Tip>

      <Popover open={isError} error={error} variant="error" align="bottom-right">
        <button type="button" onClick={onSave} disabled={isPending} aria-label="Şablonu kaydet"
          className="ml-1 flex items-center gap-1.5 rounded-lg border border-skylab-400/40 bg-skylab-500/15 px-2.5 py-1 text-xs font-semibold text-skylab-300 transition-colors hover:bg-skylab-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 disabled:opacity-60"
        >
          {isPending ? <CircleGauge size={14} className="animate-spin" /> : isError ? <CircleAlert size={14} className="text-red-400" /> : <CheckCircle2 size={14} />}
          Kaydet
        </button>
      </Popover>
    </div>
  );

  return targets.map((target) => createPortal(content, target, target.id));
}
