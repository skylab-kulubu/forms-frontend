"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, CircleAlert, CircleGauge, ClipboardX, Eye, Loader2, MoreHorizontal, PencilLine, Send, Share2, TriangleAlert, Undo2,
} from "lucide-react";
import Popover from "@/app/components/utils/Popover";
import { Floating } from "@/app/components/utils/Floating";
import Tip from "@/app/admin/components/utils/Tip";
import { POPOVER_MOTION } from "./studio-motion";

const emptySubscribe = () => () => {};

const ICON_BUTTON = "rounded-lg p-1.5 transition-colors hover:bg-neutral-800/70 hover:text-neutral-100 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-inherit";
const SAVE_BUTTON = "flex items-center gap-1.5 rounded-lg border border-skylab-400/40 bg-skylab-500/15 px-2.5 py-1 text-xs font-semibold text-skylab-300 transition-colors hover:bg-skylab-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 disabled:opacity-60";

function SaveButton({ onSave, isSaving, isError, error, saveLabel, saveExtra, draftNotice, onDraftNoticeClose }) {
  return (
    <Popover open={isError || (draftNotice && !isError)} error={isError ? error : null}
      message={!isError && draftNotice ? "Veriler taslaklardan geldi" : null} variant={isError ? "error" : "info"} align="bottom-right"
      onClose={!isError && draftNotice ? onDraftNoticeClose : undefined}
    >
      <button onClick={onSave} disabled={isSaving} type="button" aria-label="Formu kaydet" title="Kaydet (Ctrl+S)" className={`ml-1 ${SAVE_BUTTON}`}>
        {isSaving ? <CircleGauge size={14} className="animate-spin" /> : isError ? <CircleAlert size={14} className="text-red-400" /> : <CheckCircle2 size={14} />}
        {saveLabel}
        {saveExtra ? <span className="rounded bg-skylab-400/15 px-1 text-3xs font-medium">{saveExtra}</span> : null}
      </button>
    </Popover>
  );
}

function FullActions({ saveStatus, returnHref, fill, onShare, draft, onUndo, canUndo, issues, secondary, publish, onSave, ...save }) {
  return (
    <div className="flex items-center gap-1 text-neutral-500">
      {returnHref ? (
        <a href={returnHref} aria-label="Etkinliğe dön"
          className="mr-1 inline-flex items-center gap-1.5 rounded-lg border border-skylab-400/40 bg-skylab-500/15 px-2.5 py-1 text-xs font-semibold text-skylab-300 transition-colors hover:bg-skylab-500/25 hover:text-skylab-200"
        >
          <ArrowLeft size={14} />
          Etkinliğe dön
        </a>
      ) : null}
      {saveStatus ? <div className="mr-2 hidden sm:block">{saveStatus}</div> : null}

      {fill ? (
        <Tip label={fill.active ? "Düzenlemeye dön (P)" : "Başvuran gibi doldur (P)"}>
          <button type="button" aria-label={fill.active ? "Düzenlemeye dön" : "Başvuran gibi doldur"} onClick={fill.onToggle}
            className={`${ICON_BUTTON} ${fill.active ? "bg-skylab-500/15 text-skylab-300" : ""}`}
          >
            {fill.active ? <PencilLine size={16} /> : <Eye size={16} />}
          </button>
        </Tip>
      ) : null}

      {onShare ? (
        <Tip label="Formu paylaş">
          <button type="button" aria-label="Formu paylaş" onClick={onShare} className={ICON_BUTTON}><Share2 size={16} /></button>
        </Tip>
      ) : null}

      {draft?.has ? (
        <Tip label="Taslağı sil">
          <button type="button" aria-label="Taslağı sil" onClick={draft.onDiscard} disabled={draft.discarding} className={ICON_BUTTON}>
            {draft.discarding ? <Loader2 size={16} className="animate-spin" /> : <ClipboardX size={16} />}
          </button>
        </Tip>
      ) : null}

      <Tip label="Geri al (Ctrl+Z)">
        <button type="button" aria-label="Geri al" onClick={onUndo} disabled={!canUndo} className={ICON_BUTTON}><Undo2 size={16} /></button>
      </Tip>

      {secondary ? (
        <Tip label={secondary.label}>
          <button type="button" aria-label={secondary.label} onClick={secondary.onClick} disabled={secondary.disabled} className={ICON_BUTTON}>
            <secondary.icon size={16} />
          </button>
        </Tip>
      ) : null}

      {issues?.count > 0 ? (
        <Tip label="Yayınlamayı engelleyen sorunlar">
          <button type="button" onClick={issues.onShow} aria-label="Sorunlar"
            className="ml-1 inline-flex items-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 px-2 py-1 text-2xs font-medium text-red-200 transition-colors hover:bg-red-500/20"
          >
            <TriangleAlert size={12} />
            {issues.count}
          </button>
        </Tip>
      ) : null}

      {publish ? (
        <Popover open={Boolean(publish.isError)} error={publish.error} variant="error" align="bottom-right">
          <button type="button" onClick={publish.onClick} disabled={publish.disabled || publish.pending} title={publish.title}
            className="ml-1 flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-xs font-semibold text-neutral-200 transition-colors hover:border-skylab-400/40 hover:bg-skylab-500/10 hover:text-skylab-300 disabled:opacity-50"
          >
            {publish.pending ? <CircleGauge size={14} className="animate-spin" /> : null}
            Yayınla
          </button>
        </Popover>
      ) : null}

      {onSave ? <SaveButton onSave={onSave} {...save} /> : null}
    </div>
  );
}

function CompactActions({ returnHref, onShare, draft, onUndo, canUndo, issues, secondary, publish, onSave, ...save }) {
  const [anchor, setAnchor] = useState(null);

  const items = [
    returnHref ? { key: "return", label: "Etkinliğe dön", icon: ArrowLeft, onClick: () => window.location.assign(returnHref) } : null,
    publish ? { key: "publish", label: publish.pending ? "Yayınlanıyor..." : "Akışı yayınla", icon: Send, onClick: publish.onClick, disabled: publish.disabled || publish.pending, hint: publish.disabled ? publish.title : null } : null,
    issues?.count > 0 ? { key: "issues", label: `Yayını engelleyen ${issues.count} sorun`, icon: TriangleAlert, onClick: issues.onShow, tone: "text-red-200" } : null,
    onShare ? { key: "share", label: "Formu paylaş", icon: Share2, onClick: onShare } : null,
    draft?.has ? { key: "draft", label: "Taslağı sil", icon: ClipboardX, onClick: draft.onDiscard, disabled: draft.discarding } : null,
    secondary ? { key: "secondary", label: secondary.label, icon: secondary.icon, onClick: secondary.onClick, disabled: secondary.disabled, tone: "text-red-300" } : null,
  ].filter(Boolean);

  return (
    <div className="flex items-center gap-0.5 text-neutral-500">
      <button type="button" aria-label="Geri al" onClick={onUndo} disabled={!canUndo} className={`${ICON_BUTTON} p-2`}><Undo2 size={17} /></button>
      {items.length > 0 ? (
        <button type="button" aria-label="Diğer işlemler" aria-expanded={Boolean(anchor)} onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}
          className={`relative ${ICON_BUTTON} p-2 ${anchor ? "bg-neutral-800/70 text-neutral-100" : ""}`}
        >
          <MoreHorizontal size={17} />
          {issues?.count > 0 ? <span className="absolute right-1 top-1 size-1.5 rounded-full bg-red-400" /> : null}
        </button>
      ) : null}
      {onSave ? <SaveButton onSave={onSave} {...save} /> : null}

      <AnimatePresence>
      {anchor ? (
        <Floating key="more-menu" anchor={anchor} onDismiss={() => setAnchor(null)} placement="bottom-end" offset={6}>
          <motion.div role="menu" {...POPOVER_MOTION} className="w-60 rounded-[10px] border border-white/15 bg-[#1e1e1e] p-1.5 shadow-2xl shadow-black/50">
            {items.map((item) => (
              <button key={item.key} type="button" role="menuitem" disabled={item.disabled}
                onClick={() => { setAnchor(null); item.onClick(); }}
                className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-2.5 text-left text-xs transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-45 ${item.tone ?? "text-neutral-200"}`}
              >
                <item.icon size={14} className="shrink-0 opacity-80" />
                <span className="min-w-0 flex-1">
                  <span className="block">{item.label}</span>
                  {item.hint ? <span className="mt-0.5 block text-3xs text-neutral-500">{item.hint}</span> : null}
                </span>
              </button>
            ))}
          </motion.div>
        </Floating>
      ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function StudioHeaderActions({ saveLabel = "Kaydet", ...props }) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const desktop = isMounted ? document.getElementById("admin-header-slot") : null;
  const mobile = isMounted ? document.getElementById("admin-header-slot-mobile") : null;

  return (
    <>
      {desktop ? createPortal(<FullActions saveLabel={saveLabel} {...props} />, desktop, desktop.id) : null}
      {mobile ? createPortal(<CompactActions saveLabel={saveLabel} {...props} />, mobile, mobile.id) : null}
    </>
  );
}
