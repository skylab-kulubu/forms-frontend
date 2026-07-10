"use client";

import { CircleAlert, FolderHeart, Share2, ShieldAlert, User2 } from "lucide-react";
import { loginWithKeycloak } from "@/lib/authActions";
import Background from "@/app/components/Background";
import LoginButton from "@/app/components/utils/LoginButton";
import StateCard from "@/app/components/StateCard";

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
    const handleLogin = () => loginWithKeycloak(callbackUrl);
    const ResourceIcon = ICON_MAP[resource] ?? FolderHeart;

    let content;

    if (isLoggedIn && !hasAccess) {
        content = (
            <StateCard
                tone="danger"
                Icon={ShieldAlert}
                title="Yetkin yok"
                description="Bu içeriği görüntüleyebilmek için Skyforms erişimine ihtiyacın var. Yöneticinle iletişime geç."
            />
        );
    } else if (hasToken && !hasMeta) {
        content = (
            <StateCard
                tone="warning"
                Icon={CircleAlert}
                title="Bağlantı geçersiz"
                description="Bu paylaşım bağlantısı geçersiz veya süresi dolmuş. Paylaşan kişiden yeni bir bağlantı isteyebilirsin."
            />
        );
    } else {
        content = (
            <StateCard
                tone="brand"
                Icon={ResourceIcon}
                title={title || fallbackTitle}
                description={description}
                meta={sharedByName ? (
                    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-2xs text-neutral-300">
                        <User2 size={12} />
                        <span>{sharedByName} paylaştı</span>
                    </div>
                ) : null}
            >
                <div className="flex flex-col items-center gap-3">
                    <p className="text-2xs text-neutral-500">{actionHint}</p>
                    <LoginButton onClick={handleLogin} />
                </div>
            </StateCard>
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
