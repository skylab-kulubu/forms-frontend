"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

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

export function EventReturnBar({ returnHref, pending, eventHref, eventName }) {
    if (!returnHref && !pending && !eventHref) return null;
    return (
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-white/10 bg-neutral-900/95 px-4 py-2.5 backdrop-blur">
            {returnHref ? (
                <a href={returnHref} aria-label="Etkinliğe dön"
                    className="inline-flex h-8 items-center gap-1.5 rounded-md border border-skylab-400/40 bg-skylab-500/10 px-3 text-2xs font-medium text-skylab-300 transition-colors hover:border-skylab-300/60 hover:bg-skylab-400/20"
                >
                    <ArrowLeft size={14} />
                    Etkinliğe dön
                </a>
            ) : pending ? (
                <p className="text-2xs text-neutral-400">Formu kaydettikten sonra etkinliğe dönebilirsin.</p>
            ) : (
                <span />
            )}
            {eventHref ? (
                <a href={eventHref} target="_blank" rel="noreferrer" aria-label="Etkinliği adminde aç"
                    className="inline-flex max-w-[16rem] items-center truncate rounded-md border border-white/10 bg-white/5 px-2 py-1 text-2xs font-medium text-neutral-200 hover:border-white/20 hover:bg-white/10"
                >
                    {eventName || "Etkinlik"}
                </a>
            ) : (
                <p className="hidden text-3xs text-neutral-500 sm:block">Kayıt, form adresini etkinlik sayfasına yazar.</p>
            )}
        </div>
    );
}
