"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { CircleAlert, FolderHeart, Share2, ShieldAlert, User2 } from "lucide-react";
import Background from "@/app/components/Background";
import LoginButton from "@/app/components/utils/LoginButton";

const cardVariants = {
    initial: { opacity: 0, y: 18, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function CardShell({ children }) {
    return (
        <motion.div variants={cardVariants} initial="initial" animate="animate"
            className="w-full max-w-md p-6 text-center"
        >
            {children}
        </motion.div>
    );
}

const ICON_MAP = {
    "component-group": FolderHeart,
    response: Share2,
};

export default function AuthLanding({
    callbackUrl,
    isLoggedIn,
    hasAccess,
    hasToken,
    hasMeta,
    title,
    description,
    sharedByName,
    resource = "component-group",
    fallbackTitle = "Skylab Forms Paylaşımı",
    actionHint = "Görüntülemek için giriş yapman gerekiyor.",
}) {
    const handleLogin = () => signIn("keycloak", { callbackUrl });
    const ResourceIcon = ICON_MAP[resource] ?? FolderHeart;

    let content;

    if (isLoggedIn && !hasAccess) {
        content = (
            <CardShell>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-red-400/20 bg-red-400/10 text-red-300">
                    <ShieldAlert size={22} />
                </div>
                <h1 className="mt-4 text-base font-semibold text-neutral-100">Yetkin yok</h1>
                <p className="mt-2 text-[12px] leading-relaxed text-neutral-400">
                    Bu içeriği görüntüleyebilmek için Skyforms erişimine ihtiyacın var. Yöneticinle iletişime geç.
                </p>
            </CardShell>
        );
    } else if (hasToken && !hasMeta) {
        content = (
            <CardShell>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-amber-400/20 bg-amber-400/10 text-amber-300">
                    <CircleAlert size={22} />
                </div>
                <h1 className="mt-4 text-base font-semibold text-neutral-100">Bağlantı geçersiz</h1>
                <p className="mt-2 text-[12px] leading-relaxed text-neutral-400">
                    Bu paylaşım bağlantısı geçersiz veya süresi dolmuş. Paylaşan kişiden yeni bir bağlantı isteyebilirsin.
                </p>
            </CardShell>
        );
    } else {
        const displayTitle = title || fallbackTitle;

        content = (
            <CardShell>
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-skylab-400/20 bg-skylab-400/10 text-skylab-300">
                    <ResourceIcon size={22} />
                </div>
                <h1 className="mt-4 text-base font-semibold text-neutral-100 truncate">{displayTitle}</h1>
                {description && (
                    <p className="mt-2 text-[12px] leading-relaxed text-neutral-400 line-clamp-3">{description}</p>
                )}
                {sharedByName && (
                    <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-neutral-300">
                        <User2 size={12} />
                        <span>{sharedByName} paylaştı</span>
                    </div>
                )}
                <p className="mt-5 text-[11px] text-neutral-500">{actionHint}</p>
                <div className="mt-4 flex items-center justify-center">
                    <LoginButton onClick={handleLogin} />
                </div>
            </CardShell>
        );
    }

    return (
        <>
            <Background />
            <div className="relative flex min-h-dvh items-center justify-center px-6">
                {content}
            </div>
        </>
    );
}
