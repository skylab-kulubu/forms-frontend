"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Archive, ChevronRight, Share2 } from "lucide-react";
import { Button, IconButton, Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger } from "@skylab-kulubu/skylcn-ui";
import ShareOverlay from "@/app/admin/components/ShareOverlay";
import { useResponseArchiveMutation } from "@/lib/hooks/useResponse";
import { useCreateResponseShareMutation, useRevokeResponseTokenMutation } from "@/lib/hooks/useResponseShare";
import { FLAGGED, PROVISIONAL, RETURNED, personOf } from "./response-data";

function ArchiveButton({ detail }) {
  const [open, setOpen] = useState(false);
  const cancelRef = useRef(null);
  const queryClient = useQueryClient();
  const { mutate, isPending, isSuccess, isError, error, reset } = useResponseArchiveMutation();
  const status = Number(detail?.status ?? 0);
  const isWorkflowStep = Boolean(detail?.workflow);
  const blocked = (isWorkflowStep && status === 1) || status === PROVISIONAL || status === RETURNED;
  const archived = Boolean(detail?.isArchived);
  const label = archived ? "Cevap arşivde"
    : status === PROVISIONAL ? "Geçici cevap arşivlenemez. Önce karar verin."
      : status === RETURNED ? "Düzeltme istenen cevap başvurunun geçmişinde kalır; arşivlenmez."
        : blocked ? "Bekleyen başvuru adımı arşivlenemez. Önce karar verin." : "Cevabı arşivle";

  useEffect(() => {
    if (!isError) return undefined;
    const timer = setTimeout(() => { reset(); setOpen(false); }, 2500);
    return () => clearTimeout(timer);
  }, [isError, reset]);

  // Stays focusable while disabled, so its tooltip can still say why it cannot archive
  if (archived || blocked || isSuccess) return <IconButton icon={Archive} label={label} variant="ghost" size="icon-sm" disabled focusableWhenDisabled />;

  return (
    <Popover open={open} onOpenChange={(next) => { if (!isPending) setOpen(next); }}>
      <PopoverTrigger render={<IconButton icon={Archive} label={label} variant="ghost" size="icon-sm" className={isError ? "text-destructive" : undefined} />} />
      <PopoverContent align="end" initialFocus={cancelRef} aria-label="Cevabı arşivle"
        className={isError ? "w-max max-w-56 border-destructive/30 bg-danger-panel px-2.5 py-1.5" : "w-64"}
      >
        {isError ? (
          <div role="alert" className="flex items-center gap-1.5">
            <AlertCircle size={13} strokeWidth={2.5} className="shrink-0 text-destructive/60" />
            <span className="text-3xs font-medium leading-snug text-foreground">{error?.body?.message || error?.message || "Cevap arşivlenemedi."}</span>
          </div>
        ) : (
          <>
            <PopoverTitle className="text-xs font-medium">Cevabı arşivle</PopoverTitle>
            <p className="mt-1 text-2xs text-secondary-foreground">
              {status === 1 || status === FLAGGED
                ? <>Karar verilmediği için cevap <span className="text-destructive">reddedilir</span> ve listeden gizlenir.</>
                : "Cevap listeden gizlenir, silinmez; Arşiv dahil filtresiyle görünür."}
            </p>
            <PopoverDescription className="mt-1 text-3xs leading-relaxed">{isWorkflowStep ? "Arşivden geri çıkarılamaz." : "Kişi formu yeniden doldurabilir. Arşivden geri çıkarılamaz."}</PopoverDescription>
            <div className="mt-3 flex items-center gap-2">
              <Button ref={cancelRef} size="sm" className="flex-1" disabled={isPending} onClick={() => setOpen(false)}>Vazgeç</Button>
              <Button variant="destructive" size="sm" className="flex-1 font-semibold" pending={isPending} onClick={() => mutate(detail.id, {
                onSuccess: () => {
                  setOpen(false);
                  queryClient.invalidateQueries({ queryKey: ["form-responses"] });
                },
              })}
              >
                Arşivle
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

export default function PanelHead({ detail, isAttempt = false, readOnly = false }) {
  const [shareOpen, setShareOpen] = useState(false);
  const shareMutation = useCreateResponseShareMutation();
  const revokeMutation = useRevokeResponseTokenMutation();
  const person = personOf(detail);

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1">
      <span className="shrink-0 text-neutral-500">Cevaplar</span>
      <ChevronRight size={13} className="shrink-0 text-neutral-600" />
      <span className="min-w-0 truncate text-neutral-200">{detail ? person.name : "..."}</span>
      {detail && !isAttempt && !readOnly ? (
        <span className="ml-auto flex shrink-0 items-center gap-0.5 pl-2">
          <IconButton icon={Share2} label="Cevabı paylaş" variant="ghost" size="icon-sm" onClick={() => setShareOpen(true)} />
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
