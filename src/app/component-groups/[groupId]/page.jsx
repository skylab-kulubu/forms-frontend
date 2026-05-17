import { redirect } from "next/navigation";
import { auth } from "@/auth";
import SharedLanding from "@/app/components/SharedLanding";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function fetchMeta(groupId, token) {
    if (!groupId || !token) return null;
    try {
        const res = await fetch(
            `${API_URL}/api/component-groups/${groupId}/meta?token=${encodeURIComponent(token)}`,
            { cache: "no-store" }
        );
        if (!res.ok) return null;
        const payload = await res.json();
        return payload?.data ?? null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params, searchParams }) {
    const { groupId } = await params;
    const sp = await searchParams;
    const token = sp?.token || null;

    const meta = await fetchMeta(groupId, token);

    if (!meta) {
        return {
            title: "Bileşen Grubu",
            description: "Bu paylaşım bağlantısı geçersiz veya süresi dolmuş.",
            robots: { index: false, follow: false },
        };
    }

    const sharedByName = meta.sharedBy?.fullName || null;
    const description = meta.description || (sharedByName ? `${sharedByName} tarafından paylaşıldı.` : "Sana bir bileşen grubu paylaşıldı.");
    const ogTitle = sharedByName ? `${meta.title} — ${sharedByName} tarafından paylaşıldı` : meta.title;

    return {
        title: meta.title,
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

export default async function ShareGatewayPage({ params, searchParams }) {
    const { groupId } = await params;
    const sp = await searchParams;
    const token = sp?.token || null;

    const session = await auth();
    const isLoggedIn = !!session && !session.error;
    const hasAccess = session?.skyformsRoles?.includes("skyforms:access") ?? false;

    if (isLoggedIn && hasAccess) {
        const target = token
            ? `/admin/component-groups/${groupId}?token=${encodeURIComponent(token)}`
            : `/admin/component-groups/${groupId}`;
        redirect(target);
    }

    const meta = await fetchMeta(groupId, token);

    return (
        <SharedLanding
            groupId={groupId}
            token={token}
            meta={meta}
            isLoggedIn={isLoggedIn}
            hasAccess={hasAccess}
        />
    );
}