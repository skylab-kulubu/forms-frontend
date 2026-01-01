"use client";

import { useEffect, useState } from "react";
import { Check, ClockCheckIcon, Loader2, PencilLine, RotateCcw, X } from "lucide-react";
import { useResponseStatusMutation } from "@/lib/hooks/useResponse";

const STATUS_META = {
  2: { label: "Onaylandi", style: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200" },
  3: { label: "Reddedildi", style: "border-red-500/40 bg-red-500/10 text-red-200" },
  default: { label: "Beklemede", style: "border-white/10 bg-white/5 text-neutral-300" },
};

const getInitials = (label) => {
  if (!label) return "?";
  const cleaned = String(label).trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const formatDateTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString();
};

export function ResponseActions({ response, isLoading = false }) {
  const reviewedAt = response?.reviewedAt;
  const reviewDescription = response?.reviewDescription || response?.reviewerNote || "";
  const statusValue = Number(response?.status ?? 0);
  const statusInfo = STATUS_META[statusValue] ?? STATUS_META.default;
  const canReview = statusValue !== 0;

  const [note, setNote] = useState(reviewDescription);
  const [isEditing, setIsEditing] = useState(canReview && !reviewedAt);
  const { mutate, isPending, error } = useResponseStatusMutation();

  useEffect(() => {
    setNote(reviewDescription);
    setIsEditing(canReview && !reviewedAt);
  }, [response?.id, reviewDescription, reviewedAt, canReview]);

  if (isLoading) {
    return <div></div>;
  }

  if (!response) {
    return <div></div>;
  }

  const reviewerId = response?.reviewerId || "";
  const reviewerEmail = "";
  const reviewerDisplayName = reviewerId || "Bilinmiyor";
  const reviewerSecondary = reviewerEmail || (reviewerId ? `ID: ${reviewerId}` : "");
  const reviewerInitials = getInitials(reviewerDisplayName || reviewerId);

  const submitterName = "";
  const submitterEmail = "";
  const submitterId = response?.userId || "";
  const displayName = submitterName || submitterEmail || "Kullanıcı";
  const displaySecondary = submitterEmail || (submitterId ? `ID: ${submitterId}` : "");
  const initials = getInitials(displayName || submitterId);

  const submitStatus = (nextStatus) => {
    if (!canReview || !response?.id || isPending) return;
    mutate(
      {
        responseId: response.id,
        newStatus: nextStatus,
        note: note?.trim() ? note.trim() : null,
      },
      { onSuccess: () => setIsEditing(false) }
    );
  };

  const showReviewDetails = canReview && Boolean(reviewedAt) && !isEditing;

  return (
    <div className="flex h-full items-start justify-center overflow-y-hidden pt-20 pb-6">
      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-neutral-950/40 p-4 shadow-sm text-neutral-200">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            Yanıt Sahibi
          </p>
          {canReview && (
            <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${statusInfo.style}`}>
              {statusInfo.label}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-neutral-700 text-white grid place-items-center text-md font-medium overflow-hidden">
            <span>{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-[16px] font-semibold text-neutral-100 truncate">{displayName}</p>
            {displaySecondary && <p className="text-[11px] text-neutral-600 truncate">{displaySecondary}</p>}
          </div>
        </div>

        {canReview ? (
          showReviewDetails ? (
            <div className="mt-4 rounded-lg border border-white/10 bg-neutral-950/30 p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">önceki inceleme</p>
              <div className="flex text-xs text-neutral-500 gap-1">
                <ClockCheckIcon size={12} className="mt-0.5" />
                <p>{formatDateTime(reviewedAt)}</p>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-neutral-700 text-white grid place-items-center text-xs font-medium overflow-hidden">
                  <span>{reviewerInitials}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-neutral-100 truncate">{reviewerDisplayName}</p>
                  {reviewerSecondary && <p className="text-[9px] text-neutral-600 truncate">{reviewerSecondary}</p>}
                </div>
              </div>
              {reviewDescription && (
                <div className="mt-2">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">not</p>
                  <p className="text-xs text-neutral-300 whitespace-pre-wrap">{reviewDescription}</p>
                </div>
              )}
              <button type="button" onClick={() => setIsEditing(true)} aria-label="Durumu değiştir" title="Durumu değiştir"
                className="mt-4 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-200 transition hover:bg-white/10"
              >
                <PencilLine size={16} className="mx-auto" />
              </button>
            </div>
          ) : (
            <>
              <div className="mt-4 flex items-center gap-2">
                <button type="button" onClick={() => submitStatus(2)} disabled={isPending} aria-label="Onayla" title="Onayla"
                  className="flex-1 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? <Loader2 size={16} className="mx-auto animate-spin" /> : <Check size={16} className="mx-auto" />}
                </button>
                <button type="button" onClick={() => submitStatus(3)} disabled={isPending} aria-label="Reddet" title="Reddet"
                  className="flex-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? <Loader2 size={16} className="mx-auto animate-spin" /> : <X size={16} className="mx-auto" />}
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Açıklama
                </label>
                <textarea rows={4} placeholder="Açıklama ekle..." value={note} onChange={(event) => setNote(event.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-neutral-950/30 px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/10"
                />
                {reviewedAt && (
                  <button type="button" onClick={() => { setIsEditing(false); setNote(reviewDescription); }} aria-label="Değişiklikten vazgeç" title="Değişiklikten vazgeç"
                    className="mt-2 inline-flex items-center justify-center rounded-md px-2 py-1 text-[11px] uppercase tracking-[0.2em] text-neutral-400 transition hover:text-neutral-200"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                {error && (
                  <p className="text-[11px] text-red-300">İşlem başarısız oldu</p>
                )}
              </div>
            </>
          )
        ) : null}
      </div>
    </div>
  );
}
