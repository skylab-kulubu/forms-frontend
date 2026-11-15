"use client";

import { CircleAlert, LayoutTemplate, Share2, ShieldAlert } from "lucide-react";
import { Avatar, TaskPage } from "@skylab-kulubu/skylcn-ui";
import { loginWithKeycloak } from "@/lib/authActions";
import Background from "@/app/components/Background";
import LoginButton from "@/app/components/utils/LoginButton";

const ICON_MAP = {
    "component-group": LayoutTemplate,
    response: Share2,
};

// Transparent and positioned, so the fixed Background layers show through and stay underneath
function Gate(props) {
    return <TaskPage align="center" className="relative bg-transparent" {...props} />;
}

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
    const ResourceIcon = ICON_MAP[resource] ?? LayoutTemplate;

    let page;

    if (isLoggedIn && !hasAccess) {
        page = (
            <Gate
                tone="danger"
                icon={ShieldAlert}
                title="Yetkin yok"
                description="Bu içeriği görüntüleyebilmek için Skyforms erişimine ihtiyacın var. Yöneticinle iletişime geç."
            />
        );
    } else if (hasToken && !hasMeta) {
        page = (
            <Gate
                tone="warning"
                icon={CircleAlert}
                title="Bağlantı geçersiz"
                description="Bu paylaşım bağlantısı geçersiz veya süresi dolmuş. Paylaşan kişiden yeni bir bağlantı isteyebilirsin."
            />
        );
    } else {
        page = (
            <Gate
                tone="brand"
                icon={ResourceIcon}
                title={title || fallbackTitle}
                description={description}
                actions={<LoginButton onClick={handleLogin} />}
            >
                <div className="flex flex-col items-center gap-3 text-center">
                    {sharedByName ? (
                        <div className="inline-flex items-center gap-2 text-xs text-secondary-foreground">
                            <Avatar name={sharedByName} size="sm" />
                            <span>{sharedByName} paylaştı</span>
                        </div>
                    ) : null}
                    <p className="text-2xs text-muted-foreground">{actionHint}</p>
                </div>
            </Gate>
        );
    }

    return (
        <>
            <Background />
            {page}
        </>
    );
}
