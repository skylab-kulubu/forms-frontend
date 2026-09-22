"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FilePenLine, FileCheckIcon, FileClock, FileLock2, Loader2, Shredder, FileSearchCorner, FileXCorner } from "lucide-react";
import { loginWithKeycloak } from "@/lib/authActions";
import LoginButton from "./utils/LoginButton";
import StateCard from "./StateCard";
import Background from "./Background";

export const FORM_ACCESS_STATUS = {
    AVAILABLE: 200,
    BAD_REQUEST: 400,
    PENDING_APPROVAL: 600,
    REQUIRES_PARENT_APPROVAL: 603,
    COMPLETED: 201,
    APPROVED: 601,
    DECLINED: 602,
    FULLY_COMPLETED: 604,
    WORKFLOW_FAULTED: 605,
    UNAUTHORIZED: 401,
    NOT_AUTHORIZED: 403,
    NOT_FOUND: 404,
    NOT_AVAILABLE: 410,
};

export const WORKFLOW_STATE = {
    SHOW_FORM: 1,
    AWAITING_REVIEW: 2,
    COMPLETED: 3,
    DECLINED: 4,
    FAULTED: 5,
    REQUIRES_PREVIOUS_STEP: 6,
};

const REPORT_MAILTO = "mailto:info@yildizskylab.com?subject=Skylab%20Forms%20-%20Sorun%20Bildirimi";

const stateConfigs = {
    loading: {
        icon: Loader2,
        title: "Form yükleniyor",
        description: "Lütfen birkaç saniye bekleyin.",
    },
    completed: {
        icon: FileCheckIcon,
        title: "Cevabınız kaydedildi",
        description: "Form cevaplarınız başarıyla gönderildi.",
    },
    pending: {
        icon: FileClock,
        title: "Cevabınız kaydedildi",
        description: "Form cevabınız şu an inceleniyor.",
    },
    approved: {
        icon: FileCheckIcon,
        title: "Cevabınız onaylandı",
        description: "Form cevabınız yetkili tarafından onaylandı.",
    },
    declined: {
        icon: Shredder,
        title: "Cevabınız reddedildi",
        description: "Form cevabınız yetkili tarafından reddedildi.",
    },
    fullyCompleted: {
        icon: FileCheckIcon,
        title: "Tamamlandı",
        description: "Tüm form adımları başarıyla tamamlandı.",
    },
    requiresParent: {
        icon: FilePenLine,
        title: "Bir önceki adım gerekli",
        description: "Bu form bir başvurunun ilerleyen adımı. Başvurunuza kaldığınız yerden devam edebilirsiniz.",
    },
    faulted: {
        icon: FileXCorner,
        title: "Başvurunuz yönlendirilemedi",
        description: "Başvurunuz bir sonraki adıma aktarılamadı. Bu sizden kaynaklanan bir sorun değil; lütfen bize bildirin.",
    },
    rejected: {
        icon: FileXCorner,
        title: "Cevabınız gönderilemedi",
        description: "Bu form şu anda yeni bir cevap kabul etmiyor.",
    },
    notFound: {
        icon: FileSearchCorner,
        title: "Form bulunamadı",
        description: "Form silinmiş olabilir, hiç oluşturulmamış olabilir ya da adres hatalı olabilir.",
    },
    notAvailable: {
        icon: FileLock2,
        title: "Form erişime kapalı",
        description: "Form sahibi gönderimleri durdurmuş veya formun süresi dolmuş olabilir.",
    },
    unAuthorized: {
        icon: FileLock2,
        title: "Giriş yapmalısınız",
        description: "Bu formu görüntülemek için giriş yapmanız gerekiyor.",
    },
    notAuthorized: {
        icon: FileLock2,
        title: "Yetkisiz erişim",
        description: "Bu formu görüntüleme yetkiniz bulunmuyor.",
    },
    genericError: {
        icon: FileXCorner,
        title: "Bir hata oluştu",
        description: "Form verileri alınırken beklenmedik bir hata oluştu.",
    },
};

const responseStateConfigs = {
    notFound: {
        icon: FileSearchCorner,
        title: "Yanıt bulunamadı",
        description: "Yanıt silinmiş olabilir, hiç oluşturulmamış olabilir ya da adres hatalı olabilir.",
    },
    notAuthorized: {
        icon: FileLock2,
        title: "Yetkisiz erişim",
        description: "Bu yanıtı görüntüleme yetkiniz bulunmuyor.",
    },
    genericError: {
        icon: FileXCorner,
        title: "Bir hata oluştu",
        description: "Yanıt verileri alınırken beklenmedik bir hata oluştu.",
    },
};

const formatReviewDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";
    return date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
};

export function getSubmitErrorState(status) {
    switch (status) {
        case FORM_ACCESS_STATUS.REQUIRES_PARENT_APPROVAL: return "requiresParent";
        case FORM_ACCESS_STATUS.WORKFLOW_FAULTED:         return "faulted";
        case FORM_ACCESS_STATUS.NOT_AVAILABLE:            return "notAvailable";
        case FORM_ACCESS_STATUS.BAD_REQUEST:              return "rejected";
        default:                                          return null;
    }
}

export function FormStatusDisplayer({ state, message, stage = 0, startFormId = null, progressOffset = false, reviewNote, reviewedAt, variant = "form" }) {
    const configSet = variant === "response" ? responseStateConfigs : stateConfigs;
    const config = configSet[state];

    if (!config) return null;

    const Icon = config.icon;
    const stageDescription = state === "pending" && stage > 1 ? `Başvurunuzun ${stage}. adımı şu an inceleniyor.` : null;
    const description = message || stageDescription || config.description;
    const showSignIn = state === "unAuthorized";
    const showResume = state === "requiresParent" && Boolean(startFormId);
    const showReport = state === "faulted";
    const normalizedReviewNote = typeof reviewNote === "string" ? reviewNote.trim() : "";
    const showReviewDetails = (state === "approved" || state === "declined") && (normalizedReviewNote || reviewedAt);

    const handleSignIn = () => {
        const callbackUrl = typeof window !== "undefined" ? window.location.href : "/";
        loginWithKeycloak(callbackUrl);
    };

    return (
        <motion.div key={state} className="relative z-10 flex min-h-[85vh] w-full flex-col items-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
        >
            <StateCard title={config.title} description={description} Icon={Icon} isLoading={state === "loading"}>
                {showReviewDetails && (
                    <div className={`rounded-xl border mx-auto px-4 py-3 max-w-xs text-left bg-neutral-800/50 border-neutral-700`}>
                        <div className="">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-3xs font-semibold uppercase tracking-[0.24em] text-neutral-400/90">
                                    İnceleme Detayları
                                </p>
                                <p className="text-2xs text-neutral-400">{formatReviewDate(reviewedAt)}</p>
                            </div>
                            {normalizedReviewNote && (
                                <p className="mt-1 text-xs text-neutral-200 whitespace-pre-wrap leading-relaxed">
                                    {normalizedReviewNote}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {showSignIn && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.6 }}>
                        <LoginButton onClick={handleSignIn} label="E-Skylab ile giriş yap" />
                    </motion.div>
                )}

                {showResume && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.6 }}>
                        <LoginButton onClick={() => window.location.assign(`/${startFormId}`)} label="Kaldığım yerden devam et" hoverIcon="arrow" />
                    </motion.div>
                )}

                {showReport && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.2, delay: 0.6 }}>
                        <LoginButton onClick={() => window.location.assign(REPORT_MAILTO)} label="Sorun bildir" hoverIcon="arrow" />
                    </motion.div>
                )}
            </StateCard>

            {progressOffset && <div className="mb-auto hidden sm:block h-10"></div>}
        </motion.div>
    );
}

export function FormStatusHandler({ isLoading, error, data, renderForm, variant = "form", withBackground = false }) {
    const reviewNote = data?.data?.reviewNote ?? null;
    const reviewedAt = data?.data?.reviewedAt ?? null;
    const stage = data?.data?.stage ?? 0;
    const startFormId = error?.body?.data?.startFormId ?? data?.data?.startFormId ?? null;

    const getUiState = () => {
        if (isLoading) return "loading";
        if (error) {
            // Auth-layer 401/403s arrive without the app's status envelope; fall back to the
            // HTTP status so an expired session shows the sign-in card, not a generic error.
            const accessStatus = error.body?.status ?? error.status;

            if (variant === "response") {
                switch (accessStatus) {
                    case FORM_ACCESS_STATUS.NOT_FOUND:
                        return "notFound";
                    case FORM_ACCESS_STATUS.UNAUTHORIZED:
                        return "unAuthorized";
                    case FORM_ACCESS_STATUS.NOT_AUTHORIZED:
                        return "notAuthorized";
                    default:
                        return "genericError";
                }
            }

            switch (accessStatus) {
                case FORM_ACCESS_STATUS.NOT_FOUND:
                    return "notFound";
                case FORM_ACCESS_STATUS.NOT_AVAILABLE:
                    return "notAvailable";
                case FORM_ACCESS_STATUS.UNAUTHORIZED:
                    return "unAuthorized";
                case FORM_ACCESS_STATUS.NOT_AUTHORIZED:
                    return "notAuthorized";
                case FORM_ACCESS_STATUS.REQUIRES_PARENT_APPROVAL:
                    return "requiresParent";
                case FORM_ACCESS_STATUS.WORKFLOW_FAULTED:
                    return "faulted";
                case FORM_ACCESS_STATUS.BAD_REQUEST:
                    return "rejected";

                default:
                    return "genericError";
            }
        }

        const status = data?.status;

        switch (status) {
            case FORM_ACCESS_STATUS.AVAILABLE:
                return "success";
            case FORM_ACCESS_STATUS.COMPLETED:
                return "completed";
            case FORM_ACCESS_STATUS.APPROVED:
                return "approved";
            case FORM_ACCESS_STATUS.DECLINED:
                return "declined";
            case FORM_ACCESS_STATUS.PENDING_APPROVAL:
                return "pending";
            case FORM_ACCESS_STATUS.FULLY_COMPLETED:
                return "fullyCompleted";

            default:
                return "genericError";
        }
    };

    const uiState = getUiState();
    const message = uiState === "rejected" ? (error?.body?.message ?? null) : null;

    return (
        <>
            {withBackground && <Background instant />}
            {uiState === "success" ? renderForm(data) : (
                <AnimatePresence mode="wait">
                    <FormStatusDisplayer key={uiState} state={uiState} message={message} stage={stage} startFormId={startFormId}
                        reviewNote={reviewNote} reviewedAt={reviewedAt} variant={variant}
                    />
                </AnimatePresence>
            )}
        </>
    );
}
