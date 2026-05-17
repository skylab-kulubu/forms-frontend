import { redirect } from "next/navigation";
import { auth } from "@/auth";
import AuthLanding from "@/app/components/AuthLanding";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function fetchMeta(responseId, token) {
    if (!responseId || !token) return null;
    try {
        const res = await fetch(
            `${API_URL}/api/responses/${responseId}/meta?token=${encodeURIComponent(token)}`,
            { cache: "no-store" }
        );
        if (!res.ok) return null;
        const payload = await res.json();
        return payload?.data ?? null;
    } catch {
        return null;
    }
}

async function fetchResponseFormId(responseId, token, accessToken) {
    if (!responseId || !accessToken) return null;
    const query = token ? `?token=${encodeURIComponent(token)}` : "";
    try {
        const res = await fetch(
            `${API_URL}/api/admin/forms/responses/${responseId}${query}`,
            {
                cache: "no-store",
                headers: { Authorization: `Bearer ${accessToken}` },
            }
        );
        if (!res.ok) return null;
        const payload = await res.json();
        return payload?.data?.formId ?? null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params, searchParams }) {
    const { responseId } = await params;
    const sp = await searchParams;
    const token = sp?.token || null;

    const meta = await fetchMeta(responseId, token);

    if (!meta) {
        return {
            title: "Paylaşılan Yanıt",
            description: "Bu paylaşım bağlantısı geçersiz veya süresi dolmuş.",
            robots: { index: false, follow: false },
        };
    }

    const sharedByName = meta.sharedBy?.fullName || null;
    const formTitle = meta.formTitle || "Paylaşılan Yanıt";
    const ogTitle = sharedByName ? `${sharedByName} bir yanıt paylaştı` : `${formTitle} — Paylaşılan Yanıt`;
    const description = formTitle;

    return {
        title: `${formTitle} — Paylaşılan Yanıt`,
        description,
        robots: { index: false, follow: false },
        openGraph: {
            title: ogTitle,
            description,
            type: "website",
            locale: "tr_TR",
            siteName: "SKY LAB Forms",
        },
        twitter: {
            card: "summary",
            title: ogTitle,
            description,
        },
    };
}

export default async function ResponseShareGatewayPage({ params, searchParams }) {
    const { responseId } = await params;
    const sp = await searchParams;
    const token = sp?.token || null;

    const session = await auth();
    const isLoggedIn = !!session && !session.error;
    const hasAccess = session?.skyformsRoles?.includes("skyforms:access") ?? false;

    if (isLoggedIn && hasAccess) {
        const formId = await fetchResponseFormId(responseId, token, session.accessToken);
        if (formId) {
            const target = token
                ? `/admin/forms/${formId}/responses/${responseId}?token=${encodeURIComponent(token)}`
                : `/admin/forms/${formId}/responses/${responseId}`;
            redirect(target);
        }
    }

    const meta = await fetchMeta(responseId, token);

    const callbackUrl = token
        ? `/responses/${responseId}?token=${encodeURIComponent(token)}`
        : `/responses/${responseId}`;

    return (
        <AuthLanding
            resource="response"
            callbackUrl={callbackUrl}
            isLoggedIn={isLoggedIn}
            hasAccess={hasAccess}
            hasToken={!!token}
            hasMeta={!!meta}
            title={meta?.formTitle ? `${meta.formTitle} — Paylaşılan Yanıt` : null}
            sharedByName={meta?.sharedBy?.fullName}
            fallbackTitle="Paylaşılan Yanıt"
            actionHint="Yanıtı görüntülemek için giriş yapman gerekiyor."
        />
    );
}
