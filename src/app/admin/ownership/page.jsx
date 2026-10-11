"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowRightLeft, ArrowUpRight, Clock, FileText, LayoutTemplate, Workflow } from "lucide-react";
import HeaderShell from "../components/Headers";
import { ListItemSkeleton } from "../components/ListItem";
import Pagination from "../components/utils/Pagination";
import ApprovalOverlay from "../components/ApprovalOverlay";
import { OwnershipTransferControls } from "../components/OwnershipTransfer";
import { actionClass } from "../components/utils/SidePanel";
import { useOrphanedQuery } from "@/lib/hooks/useOwnership";
import { useArchiveWorkflowMutation } from "@/lib/hooks/useWorkflowAdmin";

const WORKFLOW_STATUS = { 0: "Taslak", 1: "Canlı", 2: "Arşiv" };

const SECTIONS = [
  {
    kind: "form", title: "Formlar", icon: FileText, empty: "Sahipsiz form yok.",
    name: (item) => item.title, label: (item) => `"${item.title}" formu`,
    meta: (item) => `${item.responseCount ?? 0} cevap`, href: (item) => `/admin/forms/${item.id}`,
  },
  {
    kind: "workflow", title: "Akışlar", icon: Workflow, empty: "Sahipsiz akış yok.",
    name: (item) => item.name, label: (item) => `"${item.name}" akışı`,
    meta: (item) => `${item.nodeCount ?? 0} adım · ${WORKFLOW_STATUS[item.status] ?? "--"}`, href: (item) => `/admin/workflows/${item.id}`,
  },
  {
    kind: "group", title: "Şablonlar", icon: LayoutTemplate, empty: "Sahipsiz şablon yok.",
    name: (item) => item.title, label: (item) => `"${item.title}" şablonu`,
    meta: (item) => item.description || null, href: null,
  },
];

const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
};

function OrphanRow({ section, item }) {
  const [transferOpen, setTransferOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const queryClient = useQueryClient();
  const archiveMutation = useArchiveWorkflowMutation();
  const meta = section.meta(item);
  const updatedAt = formatDate(item.updatedAt);

  const handleArchive = () => {
    archiveMutation.mutate(item.id, {
      onSuccess: () => {
        setArchiveOpen(false);
        queryClient.invalidateQueries({ queryKey: ["orphaned", "workflow"] });
      },
      onError: () => setArchiveOpen(false),
    });
  };

  return (
    <div className="px-4 py-2.5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-neutral-100">{section.name(item) || "--"}</p>
          <div className="mt-0.5 flex min-w-0 items-center gap-3 text-3xs text-neutral-600">
            {meta ? <span className="truncate">{meta}</span> : null}
            {updatedAt ? (
              <span className="inline-flex shrink-0 items-center gap-1" title="Güncellenme"><Clock size={9} />{updatedAt}</span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {section.kind === "workflow" && item.status !== 2 ? (
            <button type="button" onClick={() => setArchiveOpen(true)} disabled={archiveMutation.isPending} className={actionClass({ danger: true })}>
              <Archive size={13} className="shrink-0 opacity-70" />
              Arşivle
            </button>
          ) : null}
          <button type="button" onClick={() => setTransferOpen((open) => !open)} aria-expanded={transferOpen} className={actionClass({ active: transferOpen })}>
            <ArrowRightLeft size={13} className="shrink-0 opacity-70" />
            Devret
          </button>
          {section.href ? (
            <Link href={section.href(item)} aria-label="Aç"
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200"
            >
              <ArrowUpRight size={13} />
            </Link>
          ) : null}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {transferOpen && (
          <motion.div key="transfer" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} onAnimationStart={() => setIsAnimating(true)} onAnimationComplete={() => setIsAnimating(false)}
            className={isAnimating ? "overflow-hidden" : ""}
          >
            <div className="max-w-md pt-3">
              <OwnershipTransferControls kind={section.kind} itemId={item.id} preset="transfer-orphaned"
                context={{ kind: section.kind, itemLabel: section.label(item) }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {section.kind === "workflow" ? (
        <ApprovalOverlay open={archiveOpen} preset="archive-workflow" context={{ isPending: archiveMutation.isPending }}
          onApprove={handleArchive} onReject={() => setArchiveOpen(false)}
        />
      ) : null}
    </div>
  );
}

function OrphanSection({ section }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useOrphanedQuery(section.kind, { page });
  const meta = data?.data ?? {};
  const items = Array.isArray(meta.items) ? meta.items : [];
  const totalCount = meta.totalCount ?? items.length;
  const Icon = section.icon;

  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <Icon size={14} className="text-neutral-500" />
        <h2 className="text-sm font-semibold text-neutral-200">{section.title}</h2>
        <span className="text-2xs tabular-nums text-neutral-500">{isLoading ? "--" : totalCount}</span>
      </div>

      <div className="rounded-xl border border-white/10">
        {isLoading ? (
          <ListItemSkeleton count={2} />
        ) : error ? (
          <p className="px-4 py-3 text-2xs text-red-300">{error.message || `${section.title} yüklenemedi.`}</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-3 text-2xs text-neutral-500">{section.empty}</p>
        ) : (
          items.map((item, index) => (
            <div key={item.id}>
              {index > 0 && <div className="mx-4 h-px bg-white/10" />}
              <OrphanRow section={section} item={item} />
            </div>
          ))
        )}
      </div>

      {meta.totalPages > 1 ? (
        <Pagination current={meta.page ?? page} totalPages={meta.totalPages} totalCount={totalCount} pageSize={meta.pageSize ?? items.length}
          entriesLength={items.length} onPageChange={setPage}
        />
      ) : null}
    </section>
  );
}

export default function OwnershipPage() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-y-auto p-4 scrollbar lg:p-6">
      <HeaderShell title="Sahipsiz içerikler" description="Hesabı silinen kişilerden kalan formları, akışları ve şablonları yeni sahiplerine devredin." />
      {SECTIONS.map((section) => <OrphanSection key={section.kind} section={section} />)}
    </div>
  );
}
