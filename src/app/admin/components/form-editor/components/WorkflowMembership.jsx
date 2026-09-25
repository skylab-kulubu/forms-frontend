"use client";

import Link from "next/link";
import { ArrowUpRight, Lock, Workflow } from "lucide-react";
import { FOCUS_RING, PANEL_SECTION, ROW, ROW_HOVER, SectionHeader, TILE } from "@/app/admin/components/utils/SidePanel";

export const WORKFLOW_LOCK_REASON = "Yayındaki bir akışta kullanıldığı için değiştirilemez.";

export function WorkflowLockMark({ title = WORKFLOW_LOCK_REASON }) {
    return (
        <span title={title} aria-label={title} role="img" className="inline-flex shrink-0 text-neutral-500">
            <Lock size={12} />
        </span>
    );
}

export function WorkflowManagedRow({ title, description, href }) {
    return (
        <div className={`${ROW} flex items-center justify-between gap-3 border-white/10 px-3 py-2.5`}>
            <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-100">{title}</p>
                <p className="text-2xs text-neutral-500">{description}</p>
            </div>
            <Link href={href}
                className={`inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-2xs text-neutral-300 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-neutral-50 ${FOCUS_RING}`}
            >
                Akışta
                <ArrowUpRight size={12} className="opacity-70" />
            </Link>
        </div>
    );
}

export function WorkflowMembershipSection({ workflow }) {
    const lockedCount = workflow.isPublished ? (workflow.lockedQuestions ?? []).length : 0;

    return (
        <section className={PANEL_SECTION}>
            <SectionHeader title="Akış" pill={workflow.isPublished ? "Canlı" : "Taslak"} pillTone={workflow.isPublished ? "skylab" : "neutral"}
                description={workflow.isPublished
                    ? "Akış yayında olduğu için bu formun akışın dayandığı kısımları kilitli."
                    : "Akış henüz yayınlanmadı; yayınlanana kadar bu formda hiçbir şey kilitlenmez. Yayınlanınca cevap kabulü, çoklu cevap ve onay ayarlarını akış yönetir."}
            />

            <Link href={`/admin/workflows/${workflow.id}`}
                className={`${ROW} ${ROW_HOVER} ${FOCUS_RING} flex items-center gap-3 border-white/10 px-3 py-2.5`}
            >
                <span className={`${TILE} border-white/10 text-neutral-400`}>
                    <Workflow size={14} strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-100">{workflow.name || "Adsız akış"}</span>
                    <span className="block text-2xs text-neutral-500">{workflow.isStart ? "Bu form akışın başlangıç formu" : "Bu form akışın bir adımı"}</span>
                </span>
                <ArrowUpRight size={14} className="shrink-0 text-neutral-500" />
            </Link>

            {workflow.isPublished && (
                <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-2xs leading-relaxed text-neutral-400">
                        <Lock size={11} className="mt-0.5 shrink-0 text-neutral-500" />
                        <span>Anonim cevaba açılamaz ve silinemez.</span>
                    </li>
                    <li className="flex items-start gap-2 text-2xs leading-relaxed text-neutral-400">
                        <Workflow size={11} className="mt-0.5 shrink-0 text-neutral-500" />
                        <span>Cevap kabulü, çoklu cevap ve onay ayarlarını akış yönetir; bu formdaki karşılıkları kullanılmaz.</span>
                    </li>
                    {lockedCount > 0 && (
                        <li className="flex items-start gap-2 text-2xs leading-relaxed text-neutral-400">
                            <Lock size={11} className="mt-0.5 shrink-0 text-neutral-500" />
                            <span>{lockedCount} soru bir yönlendirme koşulunda kullanılıyor. Bu sorular silinemez; koşulun karşılaştırdığı seçeneklerin adı değiştirilemez.</span>
                        </li>
                    )}
                </ul>
            )}
        </section>
    );
}
