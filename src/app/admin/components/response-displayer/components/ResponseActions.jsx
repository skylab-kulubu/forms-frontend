"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowRight, Check, Clock, Eye, FileClock, FilePenLine, FileX, Flag, Loader2, PencilLine, Share2, Undo2, X, Archive, Timer, CalendarCheck, ShieldAlert, ShieldCheck, ShieldX, ShieldQuestion } from "lucide-react";
import { Button, Field, IconButton, Popover, PopoverContent, PopoverDescription, PopoverTitle, PopoverTrigger, Textarea } from "@skylab-kulubu/skylcn-ui";
import Avatar from "@/app/components/utils/Avatar";
import { useResponseStatusMutation, useResponseArchiveMutation, useAttemptActionMutation } from "@/lib/hooks/useResponse";
import { DecisionSection, ReminderSection, TimeHistory, TimeSection, attemptTimeValue, formatPersonName } from "./AttemptPanels";
import RunSection from "./RunSection";
import { ATTEMPT_STATUS, ROW_STATUS, attemptKindOf } from "@/lib/attempt-status";
import { formatDay, useTicker } from "@/lib/form-timing";
import { useCreateResponseShareMutation, useRevokeResponseTokenMutation } from "@/lib/hooks/useResponseShare";
import ShareOverlay from "@/app/admin/components/ShareOverlay";
import ChannelIcon from "@/app/admin/components/share/ChannelIcon";
import { sourceLabel } from "@/lib/share-channels";
import { isDeletedUser } from "@/lib/deleted-user";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
};

const STATUS_META = {
  2: { label: "Onaylandı", style: "border-emerald-500/40 bg-emerald-500/10 text-emerald-200", Icon: ShieldCheck, color: "text-emerald-400" },
  3: { label: "Reddedildi", style: "border-red-500/40 bg-red-500/10 text-red-200", Icon: ShieldX, color: "text-red-400" },
  closed: { label: "Teslim yok", style: "border-ink/10 bg-ink/5 text-neutral-300", Icon: FileX, color: "text-red-300" },
  4: { label: "Geçici", style: "border-amber-500/40 bg-amber-500/10 text-amber-200", Icon: FileClock, color: "text-amber-300" },
  5: { label: "Doğrulanmadı", style: "border-orange-500/40 bg-orange-500/10 text-orange-200", Icon: ShieldAlert, color: "text-orange-300" },
  6: { label: "Düzeltme istendi", style: "border-sky-500/40 bg-sky-500/10 text-sky-200", Icon: FilePenLine, color: "text-sky-300" },
  default: { label: "Beklemede", style: "border-ink/10 bg-ink/5 text-neutral-300", Icon: ShieldQuestion, color: "text-neutral-400" },
};

// Backend inceleme notunu varchar(500) kolonda tutar; daha uzun not isteği düşürür.
const REVIEW_NOTE_MAX_LENGTH = 500;

const PROVISIONAL = 4;
const FLAGGED = 5;
const RETURNED = 6;

// Tints for skylcn's outline button: it has no success or revision variant; reject uses its destructive one
const DECISION_TONE = {
  2: "border-success/40 bg-success/10 text-success hover:border-success/60 hover:bg-success/20",
  3: "",
  [RETURNED]: "border-sky-400/40 bg-sky-400/10 text-sky-200 hover:border-sky-400/60 hover:bg-sky-400/20",
};

const DECISION_COPY = {
  2: { title: "Cevabı onayla", button: "Onayla", note: "Bu karar başvurunun yönünü belirler ve geri alınamaz." },
  3: { title: "Cevabı reddet", button: "Reddet", note: "Bu karar başvurunun yönünü belirler ve geri alınamaz." },
  [RETURNED]: { title: "Düzeltme iste", button: "Düzeltme iste", note: "Aday gönderince cevap yeniden incelemenize düşer. Aday e-postayla bilgilendirilir." },
};

const ATTEMPT_ICON = { running: Timer, opened: Eye, none: FileX };


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
  return <h3 className="text-2xs font-medium text-neutral-500 mb-2">{children}</h3>;
}

function StatBlock({ label, value, icon: Icon, color = "text-neutral-100" }) {
  return (
    <div className="text-center flex flex-col items-center gap-1.5">
      {Icon && <Icon size={14} className={`${color} opacity-60`} />}
      <p className={`text-sm font-semibold ${color}`}>{value}</p>
      <p className="text-3xs text-neutral-500">{label}</p>
    </div>
  );
}

function describeRoute(route, decision) {
  if (!route) return null;
  if (route.endsFlow) return decision === 2 ? "Başvuru tamamlanır" : "Başvuru sonlanır";
  return `${route.formTitle || "Sonraki adım"} adımı açılır`;
}

function RouteHint({ label, dot, text }) {
  if (!text) return null;
  return (
    <p className="flex min-w-0 items-center gap-1.5 text-3xs text-neutral-500">
      <span className={`size-1.5 shrink-0 rounded-full ${dot}`} />
      <span className="shrink-0">{label}</span>
      <ArrowRight size={10} className="shrink-0 text-neutral-600" />
      <span className="truncate text-neutral-300">{text}</span>
    </p>
  );
}

function UserCard({ name, email, userId, photoUrl, hasUser, size = "normal" }) {
  const nameSize = size === "small" ? "text-xs" : "text-sm";
  const subSize = "text-3xs";

  return (
    <div className="flex items-center gap-3">
      <Avatar name={hasUser ? name : ""} photoUrl={photoUrl} size={size === "small" ? "md" : "lg"} />
      <div className="min-w-0 space-y-0.5">
        <p className={`${nameSize} font-semibold text-neutral-100 truncate leading-tight`}>{name}</p>
        {email && <p className={`${subSize} text-neutral-500 truncate`}>{email}</p>}
        {userId && !isDeletedUser(userId) && <p className={`${subSize} text-neutral-500/70 truncate`}>ID: {userId}</p>}
      </div>
    </div>
  );
}

function RevisionRequest({ request }) {
  const reviewerName = formatPersonName(request.reviewer?.fullName) || "Ekipten biri";
  const flagCount = request.returnedQuestionIds?.length ?? 0;

  return (
    <div className="px-1 py-4 first:pt-0">
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle>Düzeltme isteği</SectionTitle>
        <div className="flex items-center gap-1 text-3xs text-neutral-400">
          <Clock size={11} className="shrink-0" />
          <span className="truncate">{formatDateTime(request.reviewedAt)}</span>
        </div>
      </div>
      <p className="text-2xs leading-relaxed text-neutral-400">
        <span className="text-neutral-200">{reviewerName}</span> {request.workflow?.round ?? 1}. gönderimde düzeltme istedi.
      </p>
      {request.reviewerNote && (
        <div className="mt-3 rounded-lg border border-ink/10 bg-ink/3 p-3">
          <p className="mb-1 text-3xs font-medium text-neutral-500">Not</p>
          <p className="whitespace-pre-wrap text-2xs leading-relaxed text-neutral-200">{request.reviewerNote}</p>
        </div>
      )}
      {flagCount > 0 && (
        <p className="mt-2 flex items-center gap-1.5 text-3xs text-sky-200/80">
          <Flag size={11} className="shrink-0" />
          {flagCount} soru işaretlenmişti
        </p>
      )}
    </div>
  );
}

/**
 * @param returnFlags  Düzeltme isterken işaretlenen sorular; null ise işaretleme kapalı.
 * @param previousRound  Bu gönderimden önce düzeltme istenen gönderim; isteğin notu panelde gösterilir.
 */
export function ResponseActions({ response, readOnly = false, returnFlags = null, onReturnFlagsChange = null, previousRound = null }) {
  const reviewedAt = response?.reviewedAt;
  const reviewDescription = response?.reviewDescription || response?.reviewerNote || "";
  const statusValue = Number(response?.status ?? 0);
  const closedProvisional = statusValue === PROVISIONAL && response?.attempt?.status === ATTEMPT_STATUS.NO_SUBMISSION;
  const statusInfo = closedProvisional ? STATUS_META.closed : STATUS_META[statusValue] ?? STATUS_META.default;
  const isProvisional = statusValue === PROVISIONAL;
  const isReturned = statusValue === RETURNED;
  const canReview = statusValue !== 0 && !isProvisional;
  const archivedAt = response?.archivedAt;
  const isArchived = Boolean(response?.isArchived);
  const workflow = response?.workflow ?? null;
  const isWorkflowStep = Boolean(workflow);
  const isRouteOpen = !isWorkflowStep || Boolean(workflow.onApprove || workflow.onDecline);
  const canEditReview = !readOnly && canReview && !isArchived && isRouteOpen;
  const canReturn = canEditReview && isWorkflowStep && Boolean(workflow.canReturn);
  const isArchiveBlocked = (isWorkflowStep && statusValue === 1) || isProvisional || isReturned;
  const archiveTitle = isProvisional ? "Geçici cevap arşivlenemez. Önce karar verin."
    : isReturned ? "Düzeltme istenen cevap başvurunun geçmişinde kalır; arşivlenmez."
      : isArchiveBlocked ? "Bekleyen başvuru adımı arşivlenemez. Önce karar verin." : "Cevabı arşivle";
  const round = workflow?.round ?? 1;
  const ownStep = workflow?.steps?.find((step) => step.stage === workflow.stage && (step.round ?? 1) === round) ?? null;
  const nextRoundAnswered = Boolean(workflow?.steps?.some((step) => step.stage === workflow.stage && step.round === round + 1 && step.responseId));
  const returnOutcome = canReturn ? `${ownStep?.formTitle || "Bu adım"} yeniden açılır` : null;
  const flagCount = returnFlags?.length ?? 0;
  const attempt = readOnly ? null : response?.attempt ?? null;
  const attemptTime = attemptTimeValue(attempt);
  const searchParams = useSearchParams();
  const router = useRouter();
  const routeParams = useParams();
  const attemptMutation = useAttemptActionMutation();
  const approveOutcome = describeRoute(workflow?.onApprove, 2);
  const declineOutcome = describeRoute(workflow?.onDecline, 3);
  const timeSpent = response?.timeSpent ?? null;
  const scannedFromQr = response?.attribution?.medium === "qr" && response?.attribution?.source !== "qr";

  const [note, setNote] = useState(reviewDescription);
  const [isEditing, setIsEditing] = useState(canEditReview && !reviewedAt);
  const [actionState, setActionState] = useState("idle");
  const [actionError, setActionError] = useState(null);
  const [pendingDecision, setPendingDecision] = useState(null);
  const [shareOverlayOpen, setShareOverlayOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const archiveCancelRef = useRef(null);
  const actionTimerRef = useRef(null);
  const noteRef = useRef(null);
  const responseId = response?.id;
  const { mutate, isPending } = useResponseStatusMutation();
  const { mutate: archiveMutate, isPending: isArchivePending, isSuccess, isError, error, reset } = useResponseArchiveMutation();
  const shareMutation = useCreateResponseShareMutation();
  const revokeMutation = useRevokeResponseTokenMutation();

  const closeArchive = () => {
    setArchiveOpen(false);
    if (isError) reset();
  };

  useEffect(() => {
    if (!isError && !isSuccess) return;
    const timer = setTimeout(() => { reset(); setArchiveOpen(false); }, isError ? 2500 : 2000);
    return () => clearTimeout(timer);
  }, [isError, isSuccess, reset]);

  const clearActionTimer = () => {
    if (actionTimerRef.current) {
      clearTimeout(actionTimerRef.current);
      actionTimerRef.current = null;
    }
  };

  // Sync local state during render when the response (or its review data) changes:
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const syncKey = `${responseId}|${reviewDescription}|${reviewedAt}|${canEditReview}`;
  const [prevSyncKey, setPrevSyncKey] = useState(syncKey);
  if (prevSyncKey !== syncKey) {
    setPrevSyncKey(syncKey);
    setNote(reviewDescription);
    setIsEditing(canEditReview && !reviewedAt);
  }

  // No timer cleanup here: a stale timer only ever re-sets "idle", which is a no-op.
  const [prevResponseId, setPrevResponseId] = useState(responseId);
  if (prevResponseId !== responseId) {
    setPrevResponseId(responseId);
    setActionState("idle");
    setActionError(null);
    setPendingDecision(null);
  }

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

  const guest = response.guest;
  const submitterFullName = response.user?.fullName || (guest ? `${guest.firstName} ${guest.lastName}`.trim() : "");
  const submitterName = formatPersonName(submitterFullName) || "Anonim Kullanıcı";
  const submitterEmail = response.user?.email || guest?.email || "";
  const submitterId = response.user?.id || null;
  const submitterPhotoUrl = response.user?.profilePictureUrl || null;
  const archiverId = response.archiver?.id || null;
  const archiverEmail = response.archiver?.email || "";
  const archiverName = response.archiver?.fullName?.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR"))).join(" ") || "";
  const archiverSecondary = archiverEmail || (archiverId && !isDeletedUser(archiverId) ? `ID: ${archiverId}` : "");
  const archiverLabel = [archiverName, archiverSecondary].filter(Boolean).join(" • ");

  const submitStatus = (nextStatus) => {
    if (!canEditReview || !response?.id || isPending || actionState !== "idle") return;
    clearActionTimer();
    setActionError(null);
    setActionState("loading");
    mutate(
      {
        responseId: response.id,
        newStatus: nextStatus,
        note: note?.trim() ? note.trim() : null,
        questionIds: nextStatus === RETURNED ? returnFlags ?? [] : null,
      },
      {
        onSuccess: () => {
          setIsEditing(false);
          setActionState("success");
          onReturnFlagsChange?.(null);
        },
        onError: (error) => {
          // HTTP hatası backend mesajını taşır; ağ/CORS hatasında status yoktur.
          setActionError(error?.status ? error.message : "Durum güncellenemedi; bağlantıyı kontrol edip tekrar deneyin.");
          setActionState("error");
          onReturnFlagsChange?.(null);
        },
      }
    );
  };

  const requestDecision = (nextStatus) => {
    if (isWorkflowStep) {
      setPendingDecision(nextStatus);
      if (nextStatus === RETURNED) {
        onReturnFlagsChange?.([]);
        if (!note?.trim()) setTimeout(() => noteRef.current?.focus(), 0);
      }
      return;
    }
    submitStatus(nextStatus);
  };

  const cancelDecision = () => {
    setPendingDecision(null);
    onReturnFlagsChange?.(null);
  };

  const confirmDecision = () => {
    const nextStatus = pendingDecision;
    setPendingDecision(null);
    submitStatus(nextStatus);
  };

  const noteMissing = pendingDecision === RETURNED && !note?.trim();
  const decisionCopy = pendingDecision ? DECISION_COPY[pendingDecision] : null;
  const decisionOutcome = pendingDecision === 2
    ? approveOutcome && `${approveOutcome}.`
    : pendingDecision === RETURNED
      ? `${ownStep?.formTitle || "Form"}, adayın önceki cevaplarıyla yeniden açılır.`
      : declineOutcome && `${declineOutcome}.`;

  const showReviewDetails = canReview && Boolean(reviewedAt) && (!isEditing || readOnly) && actionState === "idle";
  const actionTone = actionState === "error" ? "border-red-500/30 bg-red-500/10 text-red-200" : actionState === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-ink/10 bg-ink/5 text-neutral-200";
  const StatusIcon = statusInfo.Icon;

  const sharedBy = response.sharedBy ?? null;
  const sharedByName = sharedBy?.fullName?.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map(w => w.replace(/^\p{L}/u, c => c.toLocaleUpperCase("tr-TR"))).join(" ") || "";
  const sharedByEmail = sharedBy?.email || "";
  const sharedById = sharedBy?.id || null;
  const sharedByPhotoUrl = sharedBy?.profilePictureUrl || null;

  return (
    <div className="flex h-full flex-col text-neutral-200">
      <div className="flex items-center gap-2 px-1 lg:h-7">
        <span className="text-2xs font-medium text-neutral-500">{readOnly ? "Paylaşılan Cevap" : "İşlemler"}</span>
        <span className="h-px flex-1 bg-ink/5" />
        {!readOnly && (
          <div className="flex items-center gap-1 text-neutral-500">
            <IconButton icon={Share2} label="Cevabı paylaş" variant="ghost" size="icon-sm" disabled={!responseId} onClick={() => setShareOverlayOpen(true)} />
            {isArchived || isArchiveBlocked || isSuccess ? (
              <IconButton icon={Archive} label="Cevabı arşivle" title={archiveTitle} variant="ghost" size="icon-sm" disabled focusableWhenDisabled
                className={isSuccess ? "text-skylab-300" : undefined}
              />
            ) : (
              <Popover open={archiveOpen} onOpenChange={(next) => { if (!isArchivePending) next ? setArchiveOpen(true) : closeArchive(); }}>
                <PopoverTrigger render={<IconButton icon={Archive} label="Cevabı arşivle" title={archiveTitle} variant="ghost" size="icon-sm" className={isError ? "text-destructive" : undefined} />} />
                <PopoverContent align="end" initialFocus={archiveCancelRef} aria-label="Cevabı arşivle" onClick={isError ? closeArchive : undefined}
                  className={isError ? "w-max max-w-56 cursor-pointer border-destructive/30 bg-danger-panel px-2.5 py-1.5" : "w-64"}
                >
                  {isError ? (
                    <div role="alert" className="flex items-center gap-1.5">
                      <AlertCircle size={13} strokeWidth={2.5} className="shrink-0 text-destructive/60" />
                      <span className="text-3xs font-medium leading-snug text-foreground wrap-break-word">
                        {error?.response?.data?.message || error?.data?.message || error?.message || "Cevap arşivlenemedi."}
                      </span>
                    </div>
                  ) : (
                    <>
                      <PopoverTitle className="text-xs font-medium">Cevabı arşivle</PopoverTitle>
                      <p className="mt-1 text-2xs text-secondary-foreground">
                        {statusValue === 1 || statusValue === FLAGGED
                          ? <>Karar verilmediği için cevap <span className="text-destructive">reddedilir</span> ve listeden gizlenir.</>
                          : "Cevap listeden gizlenir, silinmez; Arşiv dahil filtresiyle görünür."}
                      </p>
                      <PopoverDescription className="mt-1 text-3xs leading-relaxed">
                        {isWorkflowStep ? "Arşivden geri çıkarılamaz." : "Kişi formu yeniden doldurabilir. Arşivden geri çıkarılamaz."}
                      </PopoverDescription>
                      <div className="mt-3 flex items-center gap-2">
                        <Button ref={archiveCancelRef} size="sm" className="flex-1" disabled={isArchivePending} onClick={closeArchive}>Vazgeç</Button>
                        <Button variant="destructive" size="sm" className="flex-1 font-semibold" pending={isArchivePending}
                          onClick={() => archiveMutate(responseId, { onSuccess: () => setArchiveOpen(false) })}
                        >
                          Arşivle
                        </Button>
                      </div>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto scrollbar">
        <div className="divide-y divide-ink/5">

            {readOnly && sharedBy && (
              <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.02 }} className="px-1 py-4 first:pt-0">
                <SectionTitle>Paylaşan</SectionTitle>
                <UserCard name={sharedByName || "Bilinmiyor"} email={sharedByEmail} userId={sharedById} photoUrl={sharedByPhotoUrl} hasUser={Boolean(sharedBy?.fullName)} />
              </motion.div>
            )}

            <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.03 }} className="px-1 py-4 first:pt-0">
              <SectionTitle>Özet</SectionTitle>
              <div className="flex items-start justify-around">
                {(canReview || isProvisional) && (
                  <StatBlock label="Durum" value={statusInfo.label} icon={StatusIcon} color={statusInfo.color} />
                )}
                {attemptTime ? (
                  <StatBlock label={attemptTime.label} value={attemptTime.value} icon={Timer} color="text-skylab-300" />
                ) : (
                  <StatBlock label="Süre" value={formatDuration(timeSpent)} icon={Timer} color="text-skylab-300" />
                )}
                {attempt?.startedAt ? (
                  <StatBlock label="Başladı" value={new Date(attempt.startedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} icon={CalendarCheck} color="text-neutral-300" />
                ) : (
                  <StatBlock label="Gönderim" value={response?.submittedAt ? new Date(response.submittedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : "--"} icon={CalendarCheck} color="text-neutral-300" />
                )}
                <div className="flex flex-col items-center gap-1.5 text-center">
                  <ChannelIcon source={response?.attribution?.source} size={14} className="text-neutral-300 opacity-60" />
                  <p className="flex items-center justify-center gap-1.5 text-sm font-semibold text-neutral-300">
                    {sourceLabel(response?.attribution?.source)}
                    {scannedFromQr && <span className="rounded-full border border-ink/10 px-1.5 text-3xs font-medium leading-4 text-neutral-400">QR</span>}
                  </p>
                  <p className="text-3xs text-neutral-500">Kaynak</p>
                </div>
              </div>
              {(scannedFromQr || response?.attribution?.campaign || response?.attribution?.content) && (
                <p className="mt-3 text-center font-mono text-3xs text-neutral-600">
                  {[
                    scannedFromQr && "QR okutmasıyla geldi",
                    response.attribution.campaign && `kampanya: ${response.attribution.campaign}`,
                    response.attribution.content && `içerik: ${response.attribution.content}`,
                  ].filter(Boolean).join(" · ")}
                </p>
              )}
            </motion.div>

            <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.06 }} className="px-1 py-4 first:pt-0">
              <SectionTitle>Yanıt Sahibi</SectionTitle>
              <UserCard name={submitterName} email={submitterEmail} userId={submitterId} photoUrl={submitterPhotoUrl} hasUser={Boolean(submitterFullName)}/>
            </motion.div>

            {attempt?.canDecide && isProvisional && !isArchived && (
              <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.09 }}>
                <DecisionSection key={attempt.id} attempt={attempt} mutation={attemptMutation} initialFlow={searchParams?.get("flow")}
                  onExtended={() => router.replace(`/admin/forms/${routeParams?.formId ?? response.formId}/responses/${attempt.id}?attempt=1`)}
                />
              </motion.div>
            )}

            {previousRound && (
              <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.08 }}>
                <RevisionRequest request={previousRound} />
              </motion.div>
            )}

            {canReview && (
              <AnimatePresence mode="wait" initial={false}>
                {showReviewDetails ? (
                  <motion.div key="review" {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.09 }} className="px-1 py-4 first:pt-0">
                    <div className="flex items-center justify-between mb-3">
                      <SectionTitle>İnceleyen</SectionTitle>
                      <div className="flex items-center gap-1 text-3xs text-neutral-400">
                        <Clock size={11} className="shrink-0" />
                        <span className="truncate">{formatDateTime(reviewedAt)}</span>
                      </div>
                    </div>

                    <UserCard name={reviewerName} email={reviewerEmail} userId={reviewerId} photoUrl={reviewerPhotoUrl} hasUser={Boolean(response.reviewer?.fullName)} size="small"/>

                    {reviewDescription && (
                      <div className="mt-3 rounded-lg border border-ink/10 bg-ink/3 p-3">
                        <p className="text-3xs font-medium text-neutral-500 mb-1">Not</p>
                        <p className="text-2xs text-neutral-200 whitespace-pre-wrap leading-relaxed">{reviewDescription}</p>
                      </div>
                    )}

                    {isReturned && (
                      <div className="mt-3 rounded-lg border border-sky-400/20 bg-sky-400/5 p-3">
                        <p className="text-2xs leading-relaxed text-neutral-300">
                          {nextRoundAnswered
                            ? `Aday düzeltip ${round + 1}. gönderimi yaptı; adım şeridinden açabilirsiniz.`
                            : `${ownStep?.formTitle || "Form"} adayın önceki cevaplarıyla yeniden açıldı. Aday gönderince ${round + 1}. gönderim olarak incelemenize düşer.`}
                        </p>
                        {(response.returnedQuestionIds?.length ?? 0) > 0 && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-3xs text-sky-200/80">
                            <Flag size={11} className="shrink-0" />
                            {response.returnedQuestionIds.length} soru işaretlendi
                          </p>
                        )}
                      </div>
                    )}

                    {isArchived && (
                      <div className="mt-3 rounded-lg border border-ink/10 bg-ink/3 p-3">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-3xs font-medium text-neutral-500">Arşivleyen</p>
                          <div className="flex items-center gap-1 text-3xs text-neutral-400">
                            <Clock size={10} className="shrink-0" />
                            <span className="truncate">{archivedAt ? formatDateTime(archivedAt) : "Arşivlendi"}</span>
                          </div>
                        </div>
                        {archiverLabel && (
                          <p className="text-3xs text-neutral-400 truncate">{archiverLabel}</p>
                        )}
                      </div>
                    )}

                    {canEditReview && (
                      <Button onClick={() => setIsEditing(true)} aria-label="Durumu değiştir" title="Durumu değiştir" className="mt-3 w-full">
                        <PencilLine />
                      </Button>
                    )}
                  </motion.div>
                ) : canEditReview ? (
                  <motion.div key="edit" {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.09 }} className="px-1 py-4 first:pt-0">
                    <SectionTitle>Değerlendirme</SectionTitle>

                    <AnimatePresence mode="wait" initial={false}>
                      {actionState === "idle" && pendingDecision ? (
                        <motion.div layout key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="rounded-xl border border-ink/10 bg-ink/3 p-3"
                        >
                          <p className="text-xs font-medium text-neutral-100">{decisionCopy.title}</p>
                          {decisionOutcome && <p className="mt-1 text-2xs text-neutral-300">{decisionOutcome}</p>}
                          <p className="mt-1 text-3xs leading-relaxed text-neutral-500">{decisionCopy.note}</p>
                          {pendingDecision === RETURNED && (
                            <div className="mt-2.5 space-y-1.5 border-t border-ink/5 pt-2.5">
                              <p className={`flex gap-1.5 text-3xs leading-relaxed ${noteMissing ? "text-sky-200" : "text-neutral-500"}`}>
                                <PencilLine size={11} className="mt-0.5 shrink-0" />
                                {noteMissing ? "Adayın neyi düzelteceğini Açıklama alanına yazın; not ona e-postayla gider." : "Açıklama adaya not olarak gider."}
                              </p>
                              <p className="flex gap-1.5 text-3xs leading-relaxed text-neutral-500">
                                <Flag size={11} className="mt-0.5 shrink-0" />
                                {flagCount > 0 ? `${flagCount} soru işaretli; adayın formunda vurgulanır.` : "İsterseniz düzeltilecek soruları cevapların yanından işaretleyin."}
                              </p>
                            </div>
                          )}
                          <div className="mt-3 flex items-center gap-2">
                            <Button onClick={cancelDecision} className="flex-1">Vazgeç</Button>
                            <Button onClick={confirmDecision} disabled={isPending || noteMissing} variant={pendingDecision === 3 ? "destructive" : "outline"}
                              className={`flex-1 font-semibold ${DECISION_TONE[pendingDecision]}`}
                            >
                              {decisionCopy.button}
                            </Button>
                          </div>
                        </motion.div>
                      ) : actionState === "idle" ? (
                        <motion.div layout key="actions" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center gap-3">
                            <Button size="lg" onClick={() => requestDecision(2)} disabled={isPending} aria-label="Onayla" title="Onayla" className={`flex-1 rounded-xl ${DECISION_TONE[2]}`}>
                              <Check />
                            </Button>
                            {canReturn && (
                              <Button size="lg" onClick={() => requestDecision(RETURNED)} disabled={isPending} aria-label="Düzeltme iste" title="Düzeltme iste" className={`flex-1 rounded-xl ${DECISION_TONE[RETURNED]}`}>
                                <FilePenLine />
                              </Button>
                            )}
                            <Button size="lg" variant="destructive" onClick={() => requestDecision(3)} disabled={isPending} aria-label="Reddet" title="Reddet" className="flex-1 rounded-xl">
                              <X />
                            </Button>
                          </div>
                          {isWorkflowStep && (approveOutcome || declineOutcome) && (
                            <div className="mt-3 space-y-1">
                              <RouteHint label="Onaylanırsa" dot="bg-emerald-400/70" text={approveOutcome} />
                              <RouteHint label="Düzeltme istenirse" dot="bg-sky-400/70" text={returnOutcome} />
                              <RouteHint label="Reddedilirse" dot="bg-red-400/70" text={declineOutcome} />
                            </div>
                          )}
                          {statusValue === FLAGGED && (
                            <p className="mt-3 flex gap-1.5 text-3xs leading-relaxed text-neutral-500">
                              <ShieldAlert size={11} className="mt-0.5 shrink-0 text-orange-300" />
                              <span>Güvenlik doğrulaması yapılamadan alındı; onaylanana kadar kabul edilmiş sayılmaz. Reddederseniz yanıtlayana e-posta gitmez.</span>
                            </p>
                          )}
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
                            <span className="text-2xs font-medium">
                              X
                            </span>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div layout className="mt-4">
                      <Field label={<>Açıklama{pendingDecision === RETURNED && <span className="text-sky-200/80"> · adaya gider</span>}</>}>
                        <Textarea ref={noteRef} size="sm" rows={3} value={note} onChange={(event) => setNote(event.target.value)} maxLength={REVIEW_NOTE_MAX_LENGTH} showCount
                          placeholder={pendingDecision === RETURNED ? "Neyi düzeltmesi gerektiğini yazın..." : "Açıklama ekle..."}
                          className={noteMissing ? "border-sky-400/40" : undefined}
                        />
                      </Field>
                      {actionError && (
                        <p role="alert" className="mt-1 text-3xs text-red-300">{actionError}</p>
                      )}
                      {reviewedAt && (
                        <IconButton icon={Undo2} label="Değişiklikten vazgeç" size="icon-sm" className="mt-2" onClick={() => { setIsEditing(false); setNote(reviewDescription); }} />
                      )}
                    </motion.div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            )}

            {workflow?.run && (
              <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.12 }}>
                <RunSection key={workflow.instanceId} run={workflow.run} instanceId={workflow.instanceId} readOnly={readOnly} />
              </motion.div>
            )}

            {attempt && (
              <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.12 }}>
                <TimeHistory attempt={attempt} />
              </motion.div>
            )}

        </div>
      </div>

      {!readOnly && (
        <ShareOverlay open={shareOverlayOpen} onClose={() => setShareOverlayOpen(false)}
          resource="response" resourceId={responseId}
          title="Cevabı Paylaş"
          description={isWorkflowStep
            ? "Bu bağlantı başvurunun tüm adımlarını açar. Bağlantı 1 saat geçerlidir."
            : "Bu bağlantıyla paylaşılan kişi cevabı görüntüleyebilir. Bağlantı 1 saat geçerlidir."}
          shareMutation={shareMutation}
          revokeMutation={revokeMutation}
        />
      )}
    </div>
  );
}

export function AttemptActions({ view }) {
  const attempt = view?.attempt ?? null;
  const searchParams = useSearchParams();
  const mutation = useAttemptActionMutation();
  const running = attempt?.status === ATTEMPT_STATUS.STARTED;
  useTicker(running, 30_000);

  if (!attempt) {
    return <div></div>;
  }

  const kind = attemptKindOf(attempt);
  const status = ROW_STATUS[kind] ?? ROW_STATUS.none;
  const time = attemptTimeValue(attempt);
  const user = view.user ?? null;
  const showTime = running || attempt.canExtend;

  return (
    <div className="flex h-full flex-col text-neutral-200">
      <div className="flex items-center gap-2 px-1 lg:h-7">
        <span className="text-2xs font-medium text-neutral-500">İşlemler</span>
        <span className="h-px flex-1 bg-ink/5" />
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-y-auto scrollbar">
        <div className="divide-y divide-ink/5">

            <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.03 }} className="px-1 py-4 first:pt-0">
              <SectionTitle>Özet</SectionTitle>
              <div className="flex items-start justify-around">
                <StatBlock label="Durum" value={status.label} icon={ATTEMPT_ICON[kind] ?? FileX} color={status.text} />
                <StatBlock label={time.label} value={time.value} icon={Timer} color="text-skylab-300" />
                <StatBlock label="Başladı" value={attempt.startedAt ? formatDay(attempt.startedAt) : "--"} icon={CalendarCheck} color="text-neutral-300" />
              </div>
            </motion.div>

            <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.06 }} className="px-1 py-4 first:pt-0">
              <SectionTitle>Yanıt Sahibi</SectionTitle>
              <UserCard name={formatPersonName(user?.fullName) || "Bilinmiyor"} email={user?.email || ""} userId={user?.id || null}
                photoUrl={user?.profilePictureUrl || null} hasUser={Boolean(user?.fullName)}
              />
            </motion.div>

            {kind === "opened" ? (
              <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.09 }}>
                <ReminderSection key={attempt.id} attempt={attempt} mutation={mutation} />
              </motion.div>
            ) : showTime ? (
              <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.09 }}>
                <TimeSection key={attempt.id} attempt={attempt} mutation={mutation} initialFlow={searchParams?.get("flow")} />
              </motion.div>
            ) : null}

            {attempt.events?.length > 0 && (
              <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.12 }}>
                <TimeHistory attempt={attempt} />
              </motion.div>
            )}

        </div>
      </div>
    </div>
  );
}
