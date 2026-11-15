"use client";

import Link from "next/link";
import { ArrowUpRight, Lock, Workflow } from "lucide-react";
import { Button } from "@skylab-kulubu/skylcn-ui";
import { FOCUS_RING, PANEL_SECTION, ROW, ROW_HOVER, SectionHeader, TILE } from "@/app/admin/components/utils/SidePanel";

export const WORKFLOW_LOCK_REASON = "Akışta kullanıldığı için değiştirilemez.";

export function WorkflowLockMark({ title = WORKFLOW_LOCK_REASON }) {
    return (
        <span title={title} aria-label={title} role="img" className="inline-flex shrink-0 text-subtle-foreground">
            <Lock size={12} />
        </span>
    );
}

export function WorkflowManagedRow({ title, description, href, onClick = null, linkLabel = "Akışta", newTab = false }) {
    return (
        <div className={`${ROW} flex items-center justify-between gap-3 border-border px-3 py-2.5`}>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-2xs text-subtle-foreground">{description}</p>
            </div>
            <Button size="sm" className="shrink-0" onClick={onClick ?? undefined}
                render={onClick ? undefined : <Link href={href} target={newTab ? "_blank" : undefined} />}
            >
                {linkLabel}
                <ArrowUpRight aria-hidden className="size-3.5" />
            </Button>
        </div>
    );
}

export function WorkflowMembershipSection({ workflow }) {
    const lockedCount = workflow.isPublished ? (workflow.lockedQuestions ?? []).length : 0;

    return (
        <section className={PANEL_SECTION}>
            <SectionHeader title="Akış" pill={workflow.isPublished ? "Canlı" : "Taslak"} pillTone={workflow.isPublished ? "emerald" : "neutral"}
                description={workflow.isPublished
                    ? "Akış yayında olduğu için bu formun akışın dayandığı kısımları kilitli."
                    : "Akış henüz kaydedilmedi; kaydedilene kadar bu formda hiçbir şey kilitlenmez. Kaydedilince cevap kabulü, çoklu cevap ve onay ayarlarını akış yönetir."}
            />

            <Link href={`/admin/workflows/${workflow.id}`}
                className={`${ROW} ${ROW_HOVER} ${FOCUS_RING} flex items-center gap-3 border-border px-3 py-2.5`}
            >
                <span className={`${TILE} border-border text-muted-foreground`}>
                    <Workflow size={14} strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">{workflow.name || "Adsız akış"}</span>
                    <span className="block text-2xs text-subtle-foreground">{workflow.isStart ? "Bu form akışın başlangıç formu" : "Bu form akışın bir adımı"}</span>
                </span>
                <ArrowUpRight size={14} className="shrink-0 text-subtle-foreground" />
            </Link>

            {workflow.isPublished && (
                <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-2xs leading-relaxed text-muted-foreground">
                        <Lock size={11} className="mt-0.5 shrink-0 text-subtle-foreground" />
                        <span>Anonim cevaba açılamaz ve silinemez.</span>
                    </li>
                    <li className="flex items-start gap-2 text-2xs leading-relaxed text-muted-foreground">
                        <Workflow size={11} className="mt-0.5 shrink-0 text-subtle-foreground" />
                        <span>Cevap kabulü, çoklu cevap ve onay ayarlarını akış yönetir; bu formdaki karşılıkları kullanılmaz.</span>
                    </li>
                    {lockedCount > 0 && (
                        <li className="flex items-start gap-2 text-2xs leading-relaxed text-muted-foreground">
                            <Lock size={11} className="mt-0.5 shrink-0 text-subtle-foreground" />
                            <span>{lockedCount} soru bir yönlendirme koşulunda kullanılıyor. Bu sorular silinemez; koşulun karşılaştırdığı seçeneklerin adı değiştirilemez.</span>
                        </li>
                    )}
                </ul>
            )}
        </section>
    );
}
