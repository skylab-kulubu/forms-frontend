"use client";

import Link from "next/link";
import { ArrowUpRight, Lock, Workflow } from "lucide-react";

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
        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5">
            <div className="min-w-0">
                <p className="text-sm font-semibold text-neutral-100">{title}</p>
                <p className="text-3xs text-neutral-500">{description}</p>
            </div>
            <Link href={href}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-2xs text-neutral-300 transition-colors hover:border-white/20 hover:bg-white/10 hover:text-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
            >
                Akışta
                <ArrowUpRight size={12} className="opacity-70" />
            </Link>
        </div>
    );
}

export function WorkflowMembershipChip({ workflow }) {
    const name = workflow.name || "Adsız akış";
    const stateLabel = workflow.isPublished ? "yayında" : "taslak";

    return (
        <Link href={`/admin/workflows/${workflow.id}`} title={`Akışı aç: ${name} (${stateLabel})`}
            className="inline-flex h-6 max-w-44 items-center gap-1.5 rounded-md border border-white/10 bg-white/3 px-2 text-3xs text-neutral-300 transition-colors hover:border-white/20 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
        >
            <Workflow size={11} className="shrink-0 text-neutral-500" />
            <span className="truncate">{name}</span>
            <span className={`size-1.5 shrink-0 rounded-full ${workflow.isPublished ? "bg-emerald-400" : "bg-amber-400"}`} />
        </Link>
    );
}

export function WorkflowMembershipSection({ workflow }) {
    const lockedCount = workflow.isPublished ? (workflow.lockedQuestions ?? []).length : 0;

    return (
        <section className="py-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="font-semibold text-neutral-100">Akış</p>
                    <p className="mt-1 text-2xs text-neutral-500 leading-relaxed">
                        {workflow.isPublished
                            ? "Akış yayında olduğu için bu formun akışın dayandığı kısımları kilitli."
                            : "Akış henüz yayınlanmadı; yayınlanana kadar bu formda hiçbir şey kilitlenmez. Yayınlanınca çoklu cevap ve onay ayarlarını akış yönetir."}
                    </p>
                </div>
                <span className={`rounded-full border px-3 py-0.5 text-3xs font-semibold uppercase tracking-[0.18em] ${workflow.isPublished ? "border-skylab-400/40 bg-skylab-500/10 text-skylab-300" : "border-neutral-700 bg-neutral-900/60 text-neutral-400"}`}>
                    {workflow.isPublished ? "Canlı" : "Taslak"}
                </span>
            </div>

            <Link href={`/admin/workflows/${workflow.id}`}
                className="flex items-center gap-3 rounded-lg border border-white/10 px-3 py-2.5 transition-colors hover:border-white/20 hover:bg-white/3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
            >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/3 text-neutral-400">
                    <Workflow size={14} strokeWidth={1.75} />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-100">{workflow.name || "Adsız akış"}</span>
                    <span className="block text-3xs text-neutral-500">{workflow.isStart ? "Bu form akışın başlangıç formu" : "Bu form akışın bir adımı"}</span>
                </span>
                <ArrowUpRight size={14} className="shrink-0 text-neutral-500" />
            </Link>

            {workflow.isPublished && (
                <ul className="space-y-2">
                    <li className="flex items-start gap-2 text-2xs leading-relaxed text-neutral-400">
                        <Lock size={11} className="mt-0.5 shrink-0 text-neutral-500" />
                        <span>Cevap kabulü ve anonim cevap ayarları değiştirilemez; form silinemez.</span>
                    </li>
                    <li className="flex items-start gap-2 text-2xs leading-relaxed text-neutral-400">
                        <Workflow size={11} className="mt-0.5 shrink-0 text-neutral-500" />
                        <span>Çoklu cevap ve onay ayarlarını akış yönetir; bu formdaki karşılıkları kullanılmaz.</span>
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
