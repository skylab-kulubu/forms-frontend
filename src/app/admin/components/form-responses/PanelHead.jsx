"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Archive, ChevronRight, Loader2, Share2 } from "lucide-react";
import ShareOverlay from "@/app/admin/components/ShareOverlay";
import { useResponseArchiveMutation } from "@/lib/hooks/useResponse";
import { useCreateResponseShareMutation, useRevokeResponseTokenMutation } from "@/lib/hooks/useResponseShare";
import { FLAGGED, PROVISIONAL, RETURNED, personOf } from "./response-data";

const ICON = "grid size-10 place-items-center rounded-lg transition-colors sm:size-7";

function ArchiveButton({ detail }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const queryClient = useQueryClient();
  const { mutate, isPending, isSuccess, isError, error, reset } = useResponseArchiveMutation();
  const status = Number(detail?.status ?? 0);
  const isWorkflowStep = Boolean(detail?.workflow);
  const blocked = (isWorkflowStep && status === 1) || status === PROVISIONAL || status === RETURNED;
  const archived = Boolean(detail?.isArchived);
  const disabled = isPending || archived || blocked || isSuccess;
  const label = archived ? "Cevap arşivde"
    : status === PROVISIONAL ? "Geçici cevap arşivlenemez. Önce karar verin."
      : status === RETURNED ? "Düzeltme istenen cevap başvurunun geçmişinde kalır; arşivlenmez."
        : blocked ? "Bekleyen başvuru adımı arşivlenemez. Önce karar verin." : "Cevabı arşivle";

  useEffect(() => {
    if (!isError) return undefined;
    const timer = setTimeout(() => { reset(); setOpen(false); }, 2500);
    return () => clearTimeout(timer);
  }, [isError, reset]);

  useEffect(() => {
    if (!open) return undefined;
    const down = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    const key = (event) => {
      if (event.key !== "Escape") return;
      event.stopPropagation();
      setOpen(false);
    };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("mousedown", down);
      document.removeEventListener("keydown", key, true);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative inline-flex">
      <button type="button" aria-label={label} title={label} aria-expanded={open} disabled={disabled} onClick={() => setOpen((value) => !value)}
        className={`${ICON} ${disabled ? "cursor-not-allowed text-neutral-600" : isError ? "text-red-400" : open ? "bg-white/5 text-neutral-100" : "text-neutral-500 hover:bg-white/5 hover:text-neutral-100"}`}
      >
        <Archive size={15} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div key={isError ? "error" : "confirm"} role={isError ? "alert" : "dialog"} aria-label="Cevabı arşivle"
            initial={{ opacity: 0, y: -4, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -2, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute right-0 top-full z-50 mt-2 rounded-[10px] border text-left font-normal shadow-xl ${isError ? "w-max max-w-56 border-red-500/20 bg-[#1f1414] px-2.5 py-1.5" : "w-64 border-white/20 bg-[#1e1e1e] p-3"}`}
          >
            {isError ? (
              <div className="flex items-center gap-1.5">
                <AlertCircle size={13} strokeWidth={2.5} className="shrink-0 text-red-200/30" />
                <span className="text-3xs font-medium leading-snug text-neutral-200">{error?.body?.message || error?.message || "Cevap arşivlenemedi."}</span>
              </div>
            ) : (
              <>
                <p className="text-xs font-medium text-neutral-100">Cevabı arşivle</p>
                <p className="mt-1 text-2xs text-neutral-300">
                  {status === 1 || status === FLAGGED
                    ? <>Karar verilmediği için cevap <span className="text-red-300">reddedilir</span> ve listeden gizlenir.</>
                    : "Cevap listeden gizlenir, silinmez; Arşiv dahil filtresiyle görünür."}
                </p>
                <p className="mt-1 text-3xs leading-relaxed text-neutral-500">{isWorkflowStep ? "Arşivden geri çıkarılamaz." : "Kişi formu yeniden doldurabilir. Arşivden geri çıkarılamaz."}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button type="button" autoFocus onClick={() => setOpen(false)}
                    className="flex-1 rounded-lg border border-white/10 px-3 py-1.5 text-2xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200"
                  >
                    Vazgeç
                  </button>
                  <button type="button" disabled={isPending} onClick={() => mutate(detail.id, {
                    onSuccess: () => {
                      setOpen(false);
                      queryClient.invalidateQueries({ queryKey: ["form-responses"] });
                    },
                  })}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-2xs font-semibold text-red-100 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPending ? <Loader2 size={12} className="animate-spin" /> : null}
                    {isPending ? "Arşivleniyor" : "Arşivle"}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function PanelHead({ detail, isAttempt = false }) {
  const [shareOpen, setShareOpen] = useState(false);
  const shareMutation = useCreateResponseShareMutation();
  const revokeMutation = useRevokeResponseTokenMutation();
  const person = personOf(detail);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <span className="shrink-0 text-neutral-500">Cevaplar</span>
      <ChevronRight size={13} className="shrink-0 text-neutral-600" />
      <span className="min-w-0 truncate text-neutral-200">{detail ? person.name : "..."}</span>
      {detail && !isAttempt ? (
        <span className="ml-auto flex shrink-0 items-center gap-0.5 pl-2">
          <button type="button" aria-label="Cevabı paylaş" title="Cevabı paylaş" onClick={() => setShareOpen(true)} className={`${ICON} text-neutral-500 hover:bg-white/5 hover:text-neutral-100`}>
            <Share2 size={15} />
          </button>
          <ArchiveButton key={detail.id} detail={detail} />
          <ShareOverlay open={shareOpen} onClose={() => setShareOpen(false)} resource="response" resourceId={detail.id} title="Cevabı Paylaş"
            description={detail.workflow
              ? "Bu bağlantı başvurunun tüm adımlarını açar. Bağlantı 1 saat geçerlidir."
              : "Bu bağlantıyla paylaşılan kişi cevabı görüntüleyebilir. Bağlantı 1 saat geçerlidir."}
            shareMutation={shareMutation} revokeMutation={revokeMutation}
          />
        </span>
      ) : null}
    </div>
  );
}
