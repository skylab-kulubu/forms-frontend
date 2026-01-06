"use client";

import { FormResponseStatus } from "./form-displayer/components/FormResponseStatus";
import { AnimatePresence, motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { FilePenLine, FileCheckIcon, FileClock, FileLock2, Loader2, Shredder, FileSearchCorner, FileXCorner } from "lucide-react";
import LoginButton from "./utils/LoginButton";
import StateCard from "./StateCard";

const FORM_ACCESS_STATUS = {
    AVAILABLE: 0,
    PENDING_APPROVAL: 10,
    REQUIRES_PARENT_APPROVAL: 11,
    COMPLETED: 20,
    APPROVED: 21,
    DECLINED: 22,
    UNAUTHORIZED: 40,
    NOT_AUTHORIZED: 41,
    NOT_FOUND: 44,
    NOT_AVAILABLE: 45,
};

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
        title: "İşlem bekleniyor",
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
    requiresParent: {
        icon: FilePenLine,
        title: "Bir önceki adım gerekli",
        description: "Devam etmek için önceki formu doldurmanız gerekiyor.",
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

export function FormStatusDisplayer({ state, message, step, status, reviewNote, reviewedAt, variant = "form" }) {
    const configSet = variant === "response" ? responseStateConfigs : stateConfigs;
    const config = configSet[state];

    if (!config) return null;

    const Icon = config.icon;
    const description = message || config.description;
    const showSignIn = state === "unAuthorized";
    const normalizedReviewNote = typeof reviewNote === "string" ? reviewNote.trim() : "";
    const showReviewDetails = (state === "approved" || state === "declined") && (normalizedReviewNote || reviewedAt);

    const handleSignIn = () => {
        const callbackUrl = typeof window !== "undefined" ? window.location.href : "/";
        signIn("keycloak", { callbackUrl });
    };

    return (
        <motion.div key={state} className="flex min-h-[85vh] w-full flex-col items-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
        >
            {step > 0 && state !== "loading" && (
                <div className="w-full max-w-2xl mt-8 mb-auto">
                    <FormResponseStatus step={step} status={status} />
                </div>
            )}

            <StateCard title={config.title} description={description} Icon={Icon} isLoading={state === "loading"}>
                {showReviewDetails && (
                    <div className={`rounded-xl border mx-auto px-4 py-3 max-w-xs text-left bg-neutral-800/50 border-neutral-700`}>
                        <div className="">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-neutral-400/90">
                                    İnceleme Detayları
                                </p>
                                <p className="text-[11px] text-neutral-400">{formatReviewDate(reviewedAt)}</p>
                            </div>
                            {normalizedReviewNote && (
                                <p className="mt-1 text-[12px] text-neutral-200 whitespace-pre-wrap leading-relaxed">
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
            </StateCard>

            {step > 0 && state !== "loading" && <div className="mb-auto hidden sm:block h-10"></div>}
        </motion.div>
    );
}

export function FormStatusHandler({ isLoading, error, data, renderForm, variant = "form" }) {
    const step = data?.data?.step ?? 0;
    const reviewNote = data?.data?.reviewNote ?? null;
    const reviewedAt = data?.data?.reviewedAt ?? null;

    const getUiState = () => {
        if (isLoading) return "loading";
        if (error) {
            const accessStatus = error.body?.status;

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

            default:
                return "genericError";
        }
    };

    const uiState = getUiState();
    const status = data?.status;

    if (uiState === "success") {
        return renderForm(data);
    };

    return (
        <AnimatePresence mode="wait">
            <FormStatusDisplayer key={uiState} state={uiState} step={step} status={status} reviewNote={reviewNote} reviewedAt={reviewedAt} variant={variant} />
        </AnimatePresence>
    );
}

