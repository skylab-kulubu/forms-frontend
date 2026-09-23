"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Archive, CircleAlert, CircleGauge, TriangleAlert, Undo2 } from "lucide-react";
import Popover from "@/app/components/utils/Popover";
import Tip from "@/app/admin/components/utils/Tip";
import { HeaderStatusPill } from "../../form-editor/components/EditorHeaderActions";

const emptySubscribe = () => () => {};

const ICON_BUTTON = "rounded-lg p-1.5 transition-colors hover:bg-neutral-800/70 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-inherit";

export default function WorkflowHeaderActions({
  saveStatus, intake = 0, onShowIntake, issueCount, onShowIssues, onUndo, canUndo, onArchive, isArchiveDisabled,
  onPublish, isPublishing, isError, error, canPublish,
}) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

  const targets = isMounted
    ? ["admin-header-slot", "admin-header-slot-mobile"].map((id) => document.getElementById(id)).filter(Boolean)
    : [];

  const content = (
    <div className="flex items-center gap-1 text-neutral-500">
      {saveStatus && <div className="mr-2 hidden sm:block">{saveStatus}</div>}

      {intake !== 0 && (
        <Tip label="Başvuru durumunu göster">
          <button type="button" onClick={onShowIntake}
            className={`mr-1 inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-2xs font-medium transition-colors ${
              intake === 2 ? "border-red-400/30 bg-red-500/10 text-red-200 hover:bg-red-500/20" : "border-amber-400/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/20"
            }`}
          >
            <span className={`size-1.5 rounded-full ${intake === 2 ? "bg-red-400" : "bg-amber-400"}`} />
            {intake === 2 ? "Kapalı" : "Yeni başvuru kapalı"}
          </button>
        </Tip>
      )}

      <Tip label="Geri al">
        <button type="button" aria-label="Geri al" onClick={onUndo} disabled={!canUndo} className={ICON_BUTTON}>
          <Undo2 size={16} />
        </button>
      </Tip>

      <Tip label="Akışı arşivle">
        <button type="button" aria-label="Akışı arşivle" onClick={onArchive} disabled={isArchiveDisabled} className={ICON_BUTTON}>
          <Archive size={16} />
        </button>
      </Tip>

      {issueCount > 0 && (
        <Tip label="Yayınlamayı engelleyen sorunlar">
          <button type="button" onClick={onShowIssues} aria-label="Sorunlar"
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 px-2 py-1 text-2xs font-medium text-red-200 transition-colors hover:bg-red-500/20"
          >
            <TriangleAlert size={12} />
            {issueCount}
          </button>
        </Tip>
      )}

      <Popover open={isError} error={error} variant="error" align="bottom-right">
        <button type="button" onClick={onPublish} disabled={isPublishing || !canPublish} aria-label="Akışı yayınla"
          className="ml-1 flex items-center gap-1.5 rounded-lg border border-skylab-400/40 bg-skylab-500/15 px-2.5 py-1 text-xs font-semibold text-skylab-300 transition-colors hover:bg-skylab-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 disabled:opacity-50"
        >
          {isPublishing ? <CircleGauge size={14} className="animate-spin" /> : isError ? <CircleAlert size={14} className="text-red-400" /> : null}
          Yayınla
        </button>
      </Popover>
    </div>
  );

  return targets.map((target) => createPortal(content, target, target.id));
}
