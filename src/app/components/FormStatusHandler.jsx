"use client";

import { AnimatePresence, motion } from "framer-motion";
import { FilePenLine, FileCheckIcon, FileClock, FileLock2, Loader2, Shredder, FileQuestionMark } from "lucide-react";

const FORM_ACCESS_STATUS = {
  AVAILABLE: 0,
  PENDING_APPROVAL: 10,
  REQUIRES_PARENT_APPROVAL: 11,
  COMPLETED: 20,
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
    pending: {
        icon: FileClock,
        title: "İşlem bekleniyor",
        description: "Form cevabınız şu an inceleniyor.",
    },
    completed: {
        icon: FileCheckIcon,
        title: "Form zaten tamamlanmış",
        description: "Bu formu daha önce doldurmuşsunuz.",
    },
    requiresParent: {
        icon: FilePenLine,
        title: "Bir önceki adım gerekli",
        description: "Devam etmek için önceki formu doldurmanız gerekiyor.",
    },
    notFound: {
        icon: Shredder,
        title: "Form bulunamadı",
        description: "Form silinmiş olabilir, hiç oluşturulmamış olabilir ya da adres hatalı olabilir.",
    },
    notAvailable: {
        icon: FileLock2,
        title: "Form erişime kapalı",
        description: "Form sahibi gönderimleri durdurmuş veya formun süresi dolmuş olabilir.",
    },
    notAuthorized: {
        icon: FileLock2,
        title: "Yetkisiz erişim",
        description: "Bu formu görüntüleme yetkiniz bulunmuyor.",
    },
    genericError: {
        icon: FileQuestionMark,
        title: "Bir hata oluştu",
        description: "Form verileri alınırken beklenmedik bir hata oluştu.",
    },
};

const cardVariants = {
    initial: { opacity: 0, y: 28, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -26, scale: 0.98, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
};

function StateCard({ state, message }) {
    const config = stateConfigs[state];
    if (!config) return null;

    const Icon = config.icon;
    const description = message || config.description;

    return (
        <motion.div key={state} variants={cardVariants}
            initial="initial" animate="animate" exit="exit"
            className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-6 text-center"
            style={{ transformOrigin: "center" }}
        >
            <Icon className={`text-neutral-200 h-10 w-10 drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] ${state === "loading" ? "animate-spin" : ""}`} />
            <div className="flex flex-col gap-2 text-balance">
                <p className="text-md font-semibold text-neutral-100">{config.title}</p>
                <p className="text-xs text-neutral-400">{description}</p>
            </div>
        </motion.div>
    );
}

export function FormStatusHandler({ isLoading, error, data, renderForm }) {
    const getUiState = () => {
        if (isLoading) return "loading";
        if (error) {
            const accessStatus = error.body?.status;

            switch (accessStatus) {
                case FORM_ACCESS_STATUS.NOT_FOUND:
                    return "notFound";

                case FORM_ACCESS_STATUS.NOT_AVAILABLE:
                    return "notAvailable";

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
            case FORM_ACCESS_STATUS.COMPLETED:
                return "success";

            case FORM_ACCESS_STATUS.PENDING_APPROVAL:
                return "pending";

            default:
                return "genericError";
        }
    };

    const uiState = getUiState();

    if (uiState === "success") {
        return renderForm(data);
    };

    return (
        <div className="flex min-h-[85vh] w-full items-center justify-center p-4">
            <AnimatePresence mode="wait">
                <StateCard state={uiState} />
            </AnimatePresence>
        </div>
    );
}