"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Button, StatusDot, buttonVariants, cn } from "@skylab-kulubu/skylcn-ui";

const PILL_EASE = [0.32, 0.72, 0.18, 1];

const formatTime = (date) =>
    date ? date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : null;

function PillTime({ value }) {
    return (
        <AnimatePresence mode="popLayout" initial={false}>
            <motion.span key={value}
                initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.14, ease: PILL_EASE }}
                className="inline-block font-mono text-3xs text-subtle-foreground"
            >
                {value}
            </motion.span>
        </AnimatePresence>
    );
}

export function HeaderStatusPill({ dirty, draftSyncStatus, draftSavedAt, isSaving, isFailed, lastSavedAt, publishedFlash, offline = false, flashLabel = "Form kaydedildi" }) {
    const isSyncing = draftSyncStatus === "saving" || isSaving;
    const savedTime = formatTime(lastSavedAt);
    const draftTime = formatTime(draftSavedAt);

    let view;
    if (isFailed || draftSyncStatus === "failed") {
        view = { state: "failed", tone: "danger", pulse: false, label: "Kaydedilemedi", title: isFailed ? "Form kaydedilemedi" : "Taslak kaydedilemedi" };
    } else if (offline) {
        view = { state: "offline", tone: "warning", pulse: true, label: "Bağlantı bekleniyor", title: "Değişiklikler bağlantı gelince gönderilecek" };
    } else if (publishedFlash) {
        // Kayıt sonrası kısa vurgu; birkaç saniye sonra kalıcı "Kaydedildi" durumuna düşer.
        view = { state: "published", tone: "success", pulse: false, label: flashLabel, title: "Tüm değişiklikler kaydedildi" };
    } else if (!dirty && savedTime) {
        view = { state: "saved", tone: "success", pulse: false, title: `Form en son ${savedTime}'de kaydedildi`, label: (<>Kaydedildi<PillTime value={savedTime} /></>) };
    } else if (dirty && draftTime) {
        // Yeniden kayıt sırasında etiket sabit kalır; yalnızca nokta renk değiştirip atar.
        view = { state: "draft", tone: isSyncing ? "warning" : "success", pulse: isSyncing, title: `Taslak en son ${draftTime}'de kaydedildi`, label: (<>Taslak kayıtlı<PillTime value={draftTime} /></>) };
    } else if (isSyncing) {
        view = { state: "saving", tone: "warning", pulse: true, label: "Kaydediliyor…", title: "Şu anda kaydediliyor" };
    } else if (dirty) {
        view = { state: "dirty", tone: "brand", pulse: false, label: "Düzenleniyor", title: "Kaydedilmemiş değişiklikler var" };
    } else {
        // Boşta: yalnız nokta kalır; etiket durum geldiğinde üstüne animasyonla gelir.
        view = { state: "idle", tone: "neutral", pulse: false, label: null, title: "" };
    }

    return (
        <motion.div layout transition={{ duration: 0.22, ease: PILL_EASE }} title={view.title}
            className="flex min-h-4.5 origin-center items-center gap-1 overflow-hidden"
        >
            <motion.span layout className="inline-flex shrink-0">
                <StatusDot tone={view.tone} className={`transition-[background-color,box-shadow] duration-200 ${view.pulse ? "animate-pulse" : ""}`} />
            </motion.span>
            <AnimatePresence mode="popLayout" initial={false}>
                {view.label != null && (
                    <motion.span key={view.state}
                        initial={{ opacity: 0, x: 4 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -4 }}
                        transition={{ duration: 0.16, ease: PILL_EASE }}
                        className="inline-flex items-baseline gap-1 whitespace-nowrap text-2xs text-muted-foreground"
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
        <div className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur">
            {returnHref ? (
                <Button variant="primary" className="gap-1.5" render={<a href={returnHref} aria-label="Etkinliğe dön" />}>
                    <ArrowLeft aria-hidden className="size-3.5" />
                    Etkinliğe dön
                </Button>
            ) : pending ? (
                <p className="text-2xs text-muted-foreground">Formu kaydettikten sonra etkinliğe dönebilirsin.</p>
            ) : (
                <span />
            )}
            {eventHref ? (
                // The name's span has to be the link's own flex item to shrink and truncate, which Button's content wrapper prevents
                <a href={eventHref} target="_blank" rel="noreferrer" aria-label="Etkinliği adminde aç" className={cn(buttonVariants({ size: "sm" }), "min-w-0 max-w-64 justify-start")}>
                    <span className="truncate">{eventName || "Etkinlik"}</span>
                </a>
            ) : (
                <p className="hidden text-3xs text-subtle-foreground sm:block">Kayıt, form adresini etkinlik sayfasına yazar.</p>
            )}
        </div>
    );
}
