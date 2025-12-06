"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useParams } from "next/navigation";
import { Loader2, FileLock, Shredder, FileExclamationPoint } from "lucide-react";
import { useFormQuery } from "@/lib/hooks/useFormAdmin";
import FormEditor from "../../components/form-editor/FormEditor";

const stateConfigs = {
    loading: {
        icon: Loader2,
        title: "Form yükleniyor",
        description: "Lütfen birkaç saniye bekleyin.",
    },
    forbidden: {
        icon: FileLock,
        title: "Bu formu görmek için yetkiniz yok",
        description: "Formu düzenlemeniz için editör veya sahibi olmalısınız.",
    },
    notFound: {
        icon: Shredder,
        title: "Form bulunamadı",
        description: "Form silinmiş olabilir ya da hiç oluşturulmamış.",
    },
    genericError: {
        icon: FileExclamationPoint,
        title: "Form yüklenirken bir hata oluştu",
        description: "Lütfen daha sonra tekrar deneyin.",
    },
};

const cardVariants = {
    initial: { opacity: 0, y: 28, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -26, scale: 0.98, transition: { duration: 0.28, ease: [0.4, 0, 0.2, 1] } },
};

function StateCard({ state }) {
    const config = stateConfigs[state];
    if (!config) return null;

    const Icon = config.icon;

    return (
        <motion.div key={state} variants={cardVariants}
            initial="initial" animate="animate" exit="exit"
            className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-6 text-center"
            style={{ transformOrigin: "center" }}
        >
            <Icon className={`text-neutral-200 h-10 w-10 drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)] ${state == "loading" ? "animate-spin" : ""}`} />
            <div className="flex flex-col gap-2 text-balance">
                <p className="text-md font-semibold text-neutral-100">{config.title}</p>
                <p className="text-xs text-neutral-400">{config.description}</p>
            </div>
        </motion.div>
    );
}

export default function FormEditorPage() {
    const { id } = useParams();
    const { data, isLoading, error } = useFormQuery(id);

    const status = error?.status;
    const uiState = isLoading ? "loading" : error ? status === 403 ? "forbidden" : status === 404 ? "notFound" : "genericError" : "success";

    if (uiState !== "success") {
        return (
            <div className="flex min-h-[80vh] items-center justify-center">
                <AnimatePresence mode="wait">
                    <StateCard key={uiState} state={uiState} />
                </AnimatePresence>
            </div>
        );
    }

    return <FormEditor initialForm={data} />;
}
