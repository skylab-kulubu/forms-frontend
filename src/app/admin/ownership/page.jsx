"use client";

import { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Archive, ArrowRightLeft, ArrowUpRight, Clock, FileText, LayoutTemplate, Workflow } from "lucide-react";
import { Button, Collapse, IconButton, ListPanel, PageHeader, Section, Skeleton } from "@skylab-kulubu/skylcn-ui";
import Pagination from "../components/utils/Pagination";
import ApprovalOverlay from "../components/ApprovalOverlay";
import { OwnershipTransferControls } from "../components/OwnershipTransfer";
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
          <p className="truncate text-sm font-medium text-foreground">{section.name(item) || "--"}</p>
          <div className="mt-0.5 flex min-w-0 items-center gap-3 text-3xs text-subtle-foreground">
            {meta ? <span className="truncate">{meta}</span> : null}
            {updatedAt ? (
              <span className="inline-flex shrink-0 items-center gap-1" title="Güncellenme"><Clock size={9} />{updatedAt}</span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {section.kind === "workflow" && item.status !== 2 ? (
            <Button size="sm" variant="outline" onClick={() => setArchiveOpen(true)} disabled={archiveMutation.isPending}>
              <Archive aria-hidden="true" />
              Arşivle
            </Button>
          ) : null}
          <Button size="sm" variant={transferOpen ? "primary" : "outline"} onClick={() => setTransferOpen((open) => !open)} aria-expanded={transferOpen}>
            <ArrowRightLeft aria-hidden="true" />
            Devret
          </Button>
          {section.href ? (
            <IconButton icon={ArrowUpRight} label="Aç" variant="outline" size="icon-sm" render={<Link href={section.href(item)} />} />
          ) : null}
        </div>
      </div>

      <Collapse open={transferOpen}>
        <div className="max-w-md pt-3">
          <OwnershipTransferControls kind={section.kind} itemId={item.id} preset="transfer-orphaned"
            context={{ kind: section.kind, itemLabel: section.label(item) }}
          />
        </div>
      </Collapse>

      {section.kind === "workflow" ? (
        <ApprovalOverlay open={archiveOpen} preset="archive-workflow" context={{ isPending: archiveMutation.isPending }}
          onApprove={handleArchive} onReject={() => setArchiveOpen(false)}
        />
      ) : null}
    </div>
  );
}

function OrphanSkeleton() {
  return (
    <div aria-hidden="true" className="divide-y divide-border-subtle">
      {[0, 1].map((index) => (
        <div key={index} className="space-y-1.5 px-4 py-3">
          <Skeleton className="h-3.5 w-48 max-w-full" />
          <Skeleton className="h-2.5 w-28" />
        </div>
      ))}
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

  const title = (
    <span className="inline-flex items-center gap-2">
      <Icon size={14} aria-hidden="true" />
      {section.title}
      <span className="tabular-nums text-subtle-foreground">{isLoading ? "--" : totalCount}</span>
    </span>
  );

  return (
    <Section title={title}>
      <div className="overflow-hidden rounded-lg border border-border">
        {isLoading ? (
          <OrphanSkeleton />
        ) : error ? (
          <p className="px-4 py-3 text-2xs text-destructive">{error.message || `${section.title} yüklenemedi.`}</p>
        ) : items.length === 0 ? (
          <p className="px-4 py-3 text-2xs text-subtle-foreground">{section.empty}</p>
        ) : (
          <ListPanel status={{ kind: "ready" }} framed={false}>
            {items.map((item) => <OrphanRow key={item.id} section={section} item={item} />)}
          </ListPanel>
        )}
      </div>

      {meta.totalPages > 1 ? (
        <Pagination current={meta.page ?? page} totalPages={meta.totalPages} onPageChange={setPage} />
      ) : null}
    </Section>
  );
}

export default function OwnershipPage() {
  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-y-auto p-4 scrollbar lg:p-6">
      <PageHeader title="Sahipsiz içerikler" description="Hesabı silinen kişilerden kalan formları, akışları ve şablonları yeni sahiplerine devredin." />
      {SECTIONS.map((section) => <OrphanSection key={section.kind} section={section} />)}
    </div>
  );
}
