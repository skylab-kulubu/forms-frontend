"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, CircleAlert, CircleGauge, ClipboardX, Eye, Loader2, Share2, Trash2, Undo2 } from "lucide-react";
import Popover from "@/app/components/utils/Popover";
import Tip from "@/app/admin/components/utils/Tip";

const PILL_EASE = [0.32, 0.72, 0.18, 1];

const formatTime = (date) =>
    date ? date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : null;

function PillTime({ value }) {
    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={value}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.14, ease: PILL_EASE }}
                className="inline-block font-mono text-3xs text-neutral-500"
            >
                {value}
            </motion.span>
        </AnimatePresence>
    );
}

export function HeaderStatusPill({ dirty, draftSyncStatus, draftSavedAt, isSaving, isFailed, lastSavedAt, publishedFlash }) {
    const isSyncing = draftSyncStatus === "saving" || isSaving;
    const savedTime = formatTime(lastSavedAt);
    const draftTime = formatTime(draftSavedAt);

    const DOT_OK = "bg-emerald-400 shadow-[0_0_5px] shadow-emerald-400/40";
    const DOT_WARN = "bg-amber-300 shadow-[0_0_5px] shadow-amber-300/40";

    let view;
    if (isFailed || draftSyncStatus === "failed") {
        view = { state: "failed", dot: "bg-red-400 shadow-[0_0_5px] shadow-red-400/40", pulse: false, label: "Kaydedilemedi", title: isFailed ? "Form kaydedilemedi" : "Taslak kaydedilemedi" };
    } else if (publishedFlash) {
        // Kayıt sonrası kısa vurgu; birkaç saniye sonra kalıcı "Kaydedildi" durumuna düşer.
        view = { state: "published", dot: DOT_OK, pulse: false, label: "Form kaydedildi", title: "Tüm değişiklikler kaydedildi" };
    } else if (!dirty && savedTime) {
        view = { state: "saved", dot: DOT_OK, pulse: false, title: `Form en son ${savedTime}'de kaydedildi`, label: (<>Kaydedildi<PillTime value={savedTime} /></>) };
    } else if (dirty && draftTime) {
        // Yeniden kayıt sırasında etiket sabit kalır; yalnızca nokta renk değiştirip atar.
        view = { state: "draft", dot: isSyncing ? DOT_WARN : DOT_OK, pulse: isSyncing, title: `Taslak en son ${draftTime}'de kaydedildi`, label: (<>Taslak kayıtlı<PillTime value={draftTime} /></>) };
    } else if (isSyncing) {
        view = { state: "saving", dot: DOT_WARN, pulse: true, label: "Kaydediliyor…", title: "Şu anda kaydediliyor" };
    } else if (dirty) {
        view = { state: "dirty", dot: "bg-skylab-400 shadow-[0_0_5px] shadow-skylab-400/40", pulse: false, label: "Düzenleniyor", title: "Kaydedilmemiş değişiklikler var" };
    } else {
        // Boşta: yalnız nokta kalır; etiket durum geldiğinde üstüne animasyonla gelir.
        view = { state: "idle", dot: "bg-neutral-600", pulse: false, label: null, title: "" };
    }

    return (
        <motion.div layout transition={{ duration: 0.22, ease: PILL_EASE }} title={view.title}
            className="flex min-h-4.5 origin-center items-center gap-1 overflow-hidden"
        >
            <motion.span layout
                className={`inline-block size-1.25 shrink-0 rounded-full transition-[background-color,box-shadow] duration-200 ${view.dot} ${view.pulse ? "animate-pulse" : ""}`}
            />
            <AnimatePresence mode="popLayout" initial={false}>
                {view.label != null && (
                    <motion.span key={view.state}
                        initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.16, ease: PILL_EASE }}
                        className="inline-flex items-baseline gap-1 whitespace-nowrap text-2xs text-neutral-400"
                    >
                        {view.label}
                    </motion.span>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

/**
 * Editör aksiyonlarını admin header'ındaki slotlara portallar; böylece
 * kütüphane paneli sekmelerine sıkışmazlar ve mobilde de header'da kalırlar.
 */
const emptySubscribe = () => () => {};

export function EditorHeaderActions({ saveStatus, onPreview, onShare, isShareDisabled, hasDraft, onDiscardDraft, isDiscardingDraft, onUndo, canUndo, onDelete, isDeleteDisabled, onSave, isPending, isError, error, draftNotice, onDraftNoticeClose }) {
    // SSR'da false, hydration sonrası true; slot div'leri o noktada DOM'da hazır.
    const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);

    const targets = isMounted
        ? ["admin-header-slot", "admin-header-slot-mobile"]
            .map((id) => document.getElementById(id))
            .filter(Boolean)
        : [];

    const content = (
        <div className="flex items-center gap-1 text-neutral-500">
            {saveStatus && <div className="mr-2 hidden sm:block">{saveStatus}</div>}
            <Tip label="Önizleme">
                <button type="button" aria-label="Önizleme" onClick={onPreview} disabled={!onPreview}
                    className={`rounded-lg p-1.5 transition-colors ${onPreview ? "hover:text-neutral-100 hover:bg-neutral-800/70" : "opacity-50 cursor-not-allowed"}`}
                >
                    <Eye size={16} />
                </button>
            </Tip>
            <Tip label="Formu paylaş">
                <button type="button" aria-label="Formu paylaş" onClick={onShare} disabled={isShareDisabled || !onShare}
                    className={`rounded-lg p-1.5 transition-colors ${(isShareDisabled || !onShare) ? "opacity-50 cursor-not-allowed" : "hover:text-neutral-100 hover:bg-neutral-800/70"}`}
                >
                    <Share2 size={16} />
                </button>
            </Tip>
            {hasDraft && (
                <Tip label="Taslağı sil">
                    <button type="button" aria-label="Taslağı sil" onClick={onDiscardDraft} disabled={isDiscardingDraft}
                        className={`rounded-lg p-1.5 transition-colors ${isDiscardingDraft ? "opacity-50 cursor-not-allowed" : "hover:text-neutral-100 hover:bg-neutral-800/70"}`}
                    >
                        {isDiscardingDraft ? <Loader2 size={16} className="animate-spin" /> : <ClipboardX size={16} />}
                    </button>
                </Tip>
            )}
            <Tip label="Geri al">
                <button type="button" aria-label="Geri al" onClick={onUndo} disabled={!canUndo}
                    className={`rounded-lg p-1.5 transition-colors ${canUndo ? "hover:text-neutral-100 hover:bg-neutral-800/70" : "opacity-50 cursor-not-allowed"}`}
                >
                    <Undo2 size={16} />
                </button>
            </Tip>
            <Tip label="Formu sil">
                <button type="button" aria-label="Formu sil" onClick={onDelete} disabled={isDeleteDisabled}
                    className={`rounded-lg p-1.5 transition-colors ${isDeleteDisabled ? "opacity-50 cursor-not-allowed" : "hover:text-neutral-100 hover:bg-neutral-800/70"}`}
                >
                    <Trash2 size={16} />
                </button>
            </Tip>
            <Popover open={isError || (draftNotice && !isError)} error={isError ? error : null}
                message={!isError && draftNotice ? "Veriler taslaklardan geldi" : null} variant={isError ? "error" : "info"} align="bottom-right"
                onClose={!isError && draftNotice ? onDraftNoticeClose : undefined}
            >
                <button onClick={onSave} disabled={isPending} type="button" aria-label="Formu kaydet"
                    className="ml-1 flex items-center gap-1.5 rounded-lg border border-skylab-400/40 bg-skylab-500/15 px-2.5 py-1 text-xs font-semibold text-skylab-300 transition-colors hover:bg-skylab-500/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 disabled:opacity-60"
                >
                    {isPending ? (<CircleGauge size={14} className="animate-spin" />) : isError ? (<CircleAlert size={14} className="text-red-400" />) : (<CheckCircle2 size={14} />)}
                    Kaydet
                </button>
            </Popover>
        </div>
    );

    return targets.map((target) => createPortal(content, target, target.id));
}
