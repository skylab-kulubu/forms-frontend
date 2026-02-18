"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Loader2, PencilLine, Share2, Undo2, X, User2, Archive, Timer, CalendarCheck, ShieldCheck, ShieldX, ShieldQuestion } from "lucide-react";
import { useResponseStatusMutation, useResponseArchiveMutation } from "@/lib/hooks/useResponse";
import { useShareLink } from "@/app/admin/hooks/useShareLink";
import ErrorPopover from "@/app/components/utils/Popover";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

const STATUS_META = {
  2: { label: "Onaylandı", style: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200", Icon: ShieldCheck, color: "text-emerald-400" },
  3: { label: "Reddedildi", style: "border-red-500/40 bg-red-500/10 text-red-200", Icon: ShieldX, color: "text-red-400" },
  default: { label: "Beklemede", style: "border-white/10 bg-white/5 text-neutral-300", Icon: ShieldQuestion, color: "text-neutral-400" },
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
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
};

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m === 0) return `${s}sn`;
  return `${m}dk ${s}sn`;
}

function SectionTitle({ children }) {
  return <h3 className="text-[10px] uppercase tracking-wide text-neutral-500 mb-2">{children}</h3>;
}

function StatBlock({ label, value, icon: Icon, color = "text-neutral-100" }) {
  return (
    <div className="text-center flex flex-col items-center gap-1.5">
      {Icon && <Icon size={14} className={`${color} opacity-60`} />}
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</p>
    </div>
  );
}

function UserCard({ name, email, userId, photoUrl, initials, hasUser, size = "normal" }) {
  const avatarSize = size === "small" ? "h-9 w-9 rounded-lg text-xs" : "h-11 w-11 rounded-xl text-sm";
  const nameSize = size === "small" ? "text-[12px]" : "text-[13px]";
  const subSize = size === "small" ? "text-[9px]" : "text-[10px]";

  return (
    <div className="flex items-center gap-3">
      <div className={`${avatarSize} border border-white/10 bg-neutral-900/70 text-neutral-200 grid place-items-center font-semibold overflow-hidden shrink-0`}>
        {photoUrl ? (
          <img src={photoUrl} alt={name} className="h-full w-full object-cover" />
        ) : hasUser ? (
          <span>{initials}</span>
        ) : (
          <User2 size={size === "small" ? 16 : 20} className="text-neutral-400" />
        )}
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className={`${nameSize} font-semibold text-neutral-100 truncate leading-tight`}>{name}</p>
        {email && <p className={`${subSize} text-neutral-500 truncate`}>{email}</p>}
        {userId && <p className={`${subSize} text-neutral-500/70 truncate`}>ID: {userId}</p>}
      </div>
    </div>
  );
}

export function ResponseActions({ response }) {
  const reviewedAt = response?.reviewedAt;
  const reviewDescription = response?.reviewDescription || response?.reviewerNote || "";
  const statusValue = Number(response?.status ?? 0);
  const statusInfo = STATUS_META[statusValue] ?? STATUS_META.default;
  const canReview = statusValue !== 0;
  const archivedAt = response?.archivedAt;
  const isArchived = Boolean(response?.isArchived);
  const canEditReview = canReview && !isArchived;
  const timeSpent = response?.timeSpent ?? null;

  const [note, setNote] = useState(reviewDescription);
  const [isEditing, setIsEditing] = useState(canEditReview && !reviewedAt);
  const [actionState, setActionState] = useState("idle");
  const actionTimerRef = useRef(null);
  const responseId = response?.id;
  const responseFormId = response?.formId || response?.form?.id || null;
  const prevResponseIdRef = useRef(responseId);
  const { mutate, isPending } = useResponseStatusMutation();
  const { mutate: archiveMutate, isPending: isArchivePending, isSuccess, isError, error, reset } = useResponseArchiveMutation();
  const sharePath = responseFormId && responseId ? `admin/${responseFormId}/responses/${responseId}` : null;
  const { shareStatus, handleShare } = useShareLink(sharePath);
  const canShare = Boolean(sharePath);

  useEffect(() => {
    if (!isError && !isSuccess) return;
    const timer = setTimeout(() => { reset(); }, 2000);
    return () => clearTimeout(timer);
  }, [isError, isSuccess, reset]);

  const clearActionTimer = () => {
    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current);
      actionTimerRef.current = null;
    }
  };

  useEffect(() => {
    setNote(reviewDescription);
    setIsEditing(canEditReview && !reviewedAt);
  }, [response?.id, reviewDescription, reviewedAt, canEditReview]);

  useEffect(() => {
    if (prevResponseIdRef.current !== responseId) {
      prevResponseIdRef.current = responseId;
      clearActionTimer();
      setActionState("idle");
    }
  }, [responseId]);

  useEffect(() => () => {
    clearActionTimer();
  }, []);

  useEffect(() => {
    if (actionState === "success" || actionState === "error") {
      clearActionTimer();
      actionTimerRef.current = setTimeout(() => {
        setActionState("idle");
      }, 1000);
    }
  }, [actionState]);

  if (!response) {
    return <div></div>;
  }

  const reviewerId = response.reviewer?.id || null;
  const reviewerEmail = response.reviewer?.email || "";
  const reviewerName = response.reviewer?.fullName?.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR"))).join(" ") || "Bilinmiyor";
  const reviewerPhotoUrl = response.reviewer?.profilePictureUrl || null;
  const reviewerInitials = getInitials(reviewerName);

  const submitterName = response.user?.fullName?.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR"))).join(" ") || "Anonim Kullanıcı";
  const submitterEmail = response.user?.email || "";
  const submitterId = response.user?.id || null;
  const submitterPhotoUrl = response.user?.profilePictureUrl || null;
  const submitterInitials = getInitials(submitterName);
  const archiverId = response.archiver?.id || null;
  const archiverEmail = response.archiver?.email || "";
  const archiverName = response.archiver?.fullName?.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR"))).join(" ") || "";
  const archiverSecondary = archiverEmail || (archiverId ? `ID: ${archiverId}` : "");
  const archiverLabel = [archiverName, archiverSecondary].filter(Boolean).join(" • ");

  const submitStatus = (nextStatus) => {
    if (!canEditReview || !response?.id || isPending || actionState !== "idle") return;
    clearActionTimer();
    setActionState("loading");
    mutate(
      {
        responseId: response.id,
        newStatus: nextStatus,
        note: note?.trim() ? note.trim() : null,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setActionState("success");
        },
        onError: () => {
          setActionState("error");
        },
      }
    );
  };

  const showReviewDetails = canReview && Boolean(reviewedAt) && !isEditing && actionState === "idle";
  const actionTone = actionState === "error" ? "border-red-500/30 bg-red-500/10 text-red-200" : actionState === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-neutral-200";
  const StatusIcon = statusInfo.Icon;

  return (
    <div className="flex h-full items-start justify-center overflow-hidden">
      <div className="w-full max-w-sm overflow-hidden text-neutral-200">
        <div className="flex h-full flex-col rounded-xl overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar">
            <motion.div {...fadeIn} className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h2 className="text-xs font-semibold text-neutral-200 tracking-wide">Cevap İşlemleri</h2>
              <div className="flex items-center gap-1 text-neutral-500">
                <button type="button" aria-label="Cevabı paylaş" title="Cevabı paylaş" onClick={handleShare} disabled={!canShare}
                  className={`rounded-lg p-1.5 transition-colors ${canShare ? "" : "opacity-50 cursor-not-allowed"} ${shareStatus === "success" ? "text-emerald-600" : shareStatus === "error" ? "text-red-600" : "hover:text-neutral-100 hover:bg-neutral-800/70"}`}
                >
                  <Share2 size={15} />
                </button>
                <ErrorPopover open={isError} error={error} align="bottom-right" onClose={() => { }}>
                  <button type="button" aria-label="Cevabı sil" title="Cevabı sil" disabled={isArchivePending || isError || isSuccess || isArchived} onClick={() => archiveMutate(responseId)}
                    className={`rounded-lg p-1.5 transition-colors ${isArchivePending || isArchived ? "opacity-50 cursor-not-allowed" : isError ? "text-red-400" : isSuccess ? "text-indigo-400" : "hover:text-neutral-100 hover:bg-neutral-800/70"}`}
                  >
                    <Archive size={15} />
                  </button>
                </ErrorPopover>
              </div>
            </motion.div>

            <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.03 }} className="px-4 py-4 border-b border-white/5">
              <SectionTitle>Özet</SectionTitle>
              <div className="flex items-start justify-around">
                {canReview && (
                  <StatBlock label="Durum" value={statusInfo.label} icon={StatusIcon} color={statusInfo.color} />
                )}
                <StatBlock label="Süre" value={formatDuration(timeSpent)} icon={Timer} color="text-indigo-300" />
                <StatBlock label="Gönderim" value={response?.submittedAt ? new Date(response.submittedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : "--"} icon={CalendarCheck} color="text-neutral-300" />
              </div>
            </motion.div>

            <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.06 }} className="px-4 py-4 border-b border-white/5">
              <SectionTitle>Yanıt Sahibi</SectionTitle>
              <UserCard name={submitterName} email={submitterEmail} userId={submitterId} photoUrl={submitterPhotoUrl} initials={submitterInitials} hasUser={Boolean(response.user?.fullName)}/>
            </motion.div>

            {canReview && (
              <AnimatePresence mode="wait" initial={false}>
                {showReviewDetails ? (
                  <motion.div key="review" {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.09 }} className="px-4 py-4 border-b border-white/5">
                    <div className="flex items-center justify-between mb-3">
                      <SectionTitle>İnceleyen</SectionTitle>
                      <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                        <Clock size={11} className="shrink-0" />
                        <span className="truncate">{formatDateTime(reviewedAt)}</span>
                      </div>
                    </div>

                    <UserCard name={reviewerName} email={reviewerEmail} userId={reviewerId} photoUrl={reviewerPhotoUrl} initials={reviewerInitials} hasUser={Boolean(response.reviewer?.fullName)} size="small"/>

                    {reviewDescription && (
                      <div className="mt-3 rounded-lg border border-white/8 bg-neutral-900/40 p-3">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500 mb-1">Not</p>
                        <p className="text-[11px] text-neutral-200 whitespace-pre-wrap leading-relaxed">{reviewDescription}</p>
                      </div>
                    )}

                    {isArchived && (
                      <div className="mt-3 rounded-lg border border-white/8 bg-neutral-900/40 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500">Arşivleyen</p>
                          <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                            <Clock size={10} className="shrink-0" />
                            <span className="truncate">{archivedAt ? formatDateTime(archivedAt) : "Arşivlendi"}</span>
                          </div>
                        </div>
                        {archiverLabel && (
                          <p className="text-[10px] text-neutral-400 truncate">{archiverLabel}</p>
                        )}
                      </div>
                    )}

                    {canEditReview && (
                      <button type="button" onClick={() => setIsEditing(true)} aria-label="Durumu değiştir" title="Durumu değiştir"
                        className="mt-3 w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 transition hover:bg-neutral-900/80 hover:text-neutral-200"
                      >
                        <PencilLine size={15} className="mx-auto" />
                      </button>
                    )}
                  </motion.div>
                ) : canEditReview ? (
                  <motion.div key="edit" {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.09 }} className="px-4 py-4 border-b border-white/5">
                    <SectionTitle>Değerlendirme</SectionTitle>

                    <AnimatePresence mode="wait" initial={false}>
                      {actionState === "idle" ? (
                        <motion.div layout key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex items-center gap-3"
                        >
                          <button type="button" onClick={() => submitStatus(2)} disabled={isPending} aria-label="Onayla" title="Onayla"
                            className="flex-1 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Check size={16} className="mx-auto" />
                          </button>
                          <button type="button" onClick={() => submitStatus(3)} disabled={isPending} aria-label="Reddet" title="Reddet"
                            className="flex-1 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs font-semibold text-red-100 transition hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <X size={16} className="mx-auto" />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div layout key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                          className={`flex w-full items-center justify-center rounded-xl border px-3 py-2.5 ${actionTone}`}
                        >
                          {actionState === "loading" ? (
                            <Loader2 size={16} className="mx-auto animate-spin" />
                          ) : actionState === "success" ? (
                            <Check size={16} className="mx-auto" />
                          ) : (
                            <span className="text-[11px] font-semibold uppercase tracking-wide">
                              X
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div layout className="mt-4">
                      <label className="text-[9px] font-semibold uppercase tracking-wide text-neutral-500 mb-1.5 block">
                        Açıklama
                      </label>
                      <textarea rows={3} placeholder="Açıklama ekle..." value={note} onChange={(event) => setNote(event.target.value)}
                        className="w-full rounded-lg border border-white/8 bg-transparent px-3 py-2 text-xs text-neutral-100 placeholder:text-neutral-600 outline-none transition focus:border-white/20 focus:ring-1 focus:ring-white/10"
                      />
                      {reviewedAt && (
                        <button type="button" onClick={() => { setIsEditing(false); setNote(reviewDescription); }} aria-label="Değişiklikten vazgeç" title="Değişiklikten vazgeç"
                          className="mt-2 inline-flex items-center justify-center rounded-lg border border-white/10 bg-neutral-900/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400 transition hover:bg-neutral-900/80 hover:text-neutral-200"
                        >
                          <Undo2 size={14} />
                        </button>
                      )}
                    </motion.div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}