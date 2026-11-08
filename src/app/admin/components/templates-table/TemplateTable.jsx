"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { SearchX } from "lucide-react";
import StateCard from "@/app/components/StateCard";
import { cloneSchema } from "@/lib/event-handoff";
import { useDeleteGroupMutation, useGroupMutation } from "@/lib/hooks/useGroupAdmin";
import { useCreateGroupShareMutation } from "@/lib/hooks/useGroupShare";
import ApprovalOverlay from "../ApprovalOverlay";
import { GroupsHeader } from "../Headers";
import ShareOverlay from "../ShareOverlay";
import Pagination from "../utils/Pagination";
import EmptyTemplates from "./EmptyTemplates";
import { TableHead, TableRow, TableSkeleton } from "./TemplateTableRow";
import { PAGE_SIZE, copyTitle, matchOf, rowOf, sortRows } from "./template-data";
import { useAllTemplates } from "./useAllTemplates";

export default function TemplateTable() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [query, setQuery] = useState("");
  const [sortField, setSortField] = useState("updatedAt");
  const [sortValue, setSortValue] = useState("desc");
  const [page, setPage] = useState(1);
  const [openKeys, setOpenKeys] = useState(() => new Set());
  const [shareTarget, setShareTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [fresh, setFresh] = useState(null);
  const [reveal, setReveal] = useState(null);

  const { templates, isLoading, error, refetch } = useAllTemplates();
  const { mutateAsync: saveGroup, isPending: saving } = useGroupMutation();
  const { mutate: deleteGroup, isPending: deleting } = useDeleteGroupMutation();
  const shareMutation = useCreateGroupShareMutation();

  useEffect(() => {
    const handle = setTimeout(() => setQuery(searchValue.trim()), 250);
    return () => clearTimeout(handle);
  }, [searchValue]);

  useEffect(() => {
    if (!fresh) return undefined;
    const handle = setTimeout(() => setFresh(null), 2500);
    return () => clearTimeout(handle);
  }, [fresh]);

  const rows = useMemo(() => templates.map(rowOf), [templates]);
  const matches = useMemo(() => new Map(rows.map((row) => [row.key, matchOf(row, query)])), [rows, query]);
  const found = useMemo(() => sortRows(rows.filter((row) => matches.get(row.key).hit), sortField, sortValue), [rows, matches, sortField, sortValue]);

  const totalPages = Math.max(1, Math.ceil(found.length / PAGE_SIZE));
  const revealIndex = reveal ? found.findIndex((row) => row.key === reveal) : -1;
  const current = revealIndex >= 0 ? Math.floor(revealIndex / PAGE_SIZE) + 1 : Math.min(page, totalPages);
  const visible = found.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const goToPage = (next) => {
    setReveal(null);
    setPage(next);
  };

  const handleSort = (field) => {
    setReveal(null);
    if (field === sortField) {
      setSortValue((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortValue(field === "title" ? "asc" : "desc");
    }
  };

  const toggleOpen = (key) => setOpenKeys((currentKeys) => {
    const next = new Set(currentKeys);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const create = async ({ title, description, schema }) => {
    try {
      const result = await saveGroup({ isUpdate: false, payload: { Id: null, Title: title, Description: description ?? "", Schema: cloneSchema(schema) } });
      const created = result?.data ?? result;
      if (created?.id) {
        setReveal(created.id);
        setFresh(created.id);
      }
    } catch {}
  };

  const copy = (row) => create({ title: copyTitle(row.title, new Set(rows.map((item) => item.title))), description: row.description, schema: row.schema });

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-hidden p-4 lg:p-6">
      <GroupsHeader searchValue={searchValue} onSearchChange={(value) => { setSearchValue(value); goToPage(1); }}
        onRefresh={refetch} onCreate={() => router.push("/admin/templates/new-template")}
      />

      <motion.div className="@container flex min-h-0 flex-1 flex-col" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
        {isLoading ? (
          <TableSkeleton />
        ) : error ? (
          <StateCard title="Şablonlar yüklenemedi" Icon={SearchX} description="Şablon verileri yüklenirken hata oluştu." />
        ) : rows.length === 0 ? (
          <EmptyTemplates onAdopt={(starter) => create(starter)} adopting={saving} />
        ) : (
          <>
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1 scrollbar">
              <TableHead sortField={sortField} sortDirection={sortValue} onSort={handleSort} />
              {found.length === 0 ? (
                <StateCard title="Şablon bulunamadı" Icon={SearchX} description="Aradığın kelime hiçbir şablonun adında ya da sorusunda geçmiyor." />
              ) : (
                <div className="divide-y divide-white/5">
                  {visible.map((row) => (
                    <TableRow key={row.key} row={row} open={openKeys.has(row.key)} onToggle={() => toggleOpen(row.key)} query={query} matched={matches.get(row.key).questions}
                      fresh={fresh === row.key} copying={saving} onShare={() => setShareTarget(row)} onCopy={() => copy(row)} onDelete={() => setDeleteTarget(row)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-white/10">
              <p className="pt-3 text-2xs text-neutral-500">
                {query ? <><span className="font-semibold tabular-nums text-neutral-200">{found.length}</span> / {rows.length} şablon</> : <><span className="font-semibold tabular-nums text-neutral-200">{rows.length}</span> şablon</>}
              </p>
              <Pagination current={current} totalPages={totalPages} onPageChange={goToPage} />
            </div>
          </>
        )}
      </motion.div>

      <ShareOverlay open={Boolean(shareTarget)} onClose={() => setShareTarget(null)} resource="component-group" resourceId={shareTarget?.id}
        title="Şablonu Paylaş" shareMutation={shareMutation}
        description="Bu bağlantıyla paylaşılan kişi şablonu görüntüleyip kendi şablonlarına ekleyebilir. Bağlantı 48 saat geçerlidir."
      />
      <ApprovalOverlay open={Boolean(deleteTarget)} preset="delete-group" context={{ isPending: deleting }}
        onApprove={() => deleteGroup(deleteTarget?.id, { onSuccess: () => setDeleteTarget(null), onError: () => setDeleteTarget(null) })}
        onReject={() => setDeleteTarget(null)}
      />
    </div>
  );
}
