"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { FileSearchCorner, FileXCorner } from "lucide-react";
import { WorkflowsHeader } from "../components/Headers";
import WorkflowListItem, { WorkflowListHeader, WorkflowListItemSkeleton } from "../components/WorkflowListItem";
import Pagination from "../components/utils/Pagination";
import StateCard from "@/app/components/StateCard";
import { useWorkflowsQuery } from "@/lib/hooks/useWorkflowAdmin";

export default function WorkflowsPage() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchValue.trim()), 500);
    return () => clearTimeout(handle);
  }, [searchValue]);

  const [prevSearch, setPrevSearch] = useState(debouncedSearch);
  if (prevSearch !== debouncedSearch) {
    setPrevSearch(debouncedSearch);
    if (page !== 1) setPage(1);
  }

  const { data, isLoading, error, refetch } = useWorkflowsQuery({ page, search: debouncedSearch || undefined });

  const payload = data?.data ?? data;
  const meta = Array.isArray(payload) || !payload ? {} : payload;
  const workflows = useMemo(() => {
    if (Array.isArray(payload)) return payload;
    return Array.isArray(payload?.items) ? payload.items : [];
  }, [payload]);

  const totalCount = meta.totalCount ?? workflows.length;
  const hasError = Boolean(error);
  const contentKey = `${debouncedSearch}-${page}-${isLoading ? "loading" : "ready"}-${hasError ? "error" : "ok"}`;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-hidden p-4 lg:p-6">
      <WorkflowsHeader searchValue={searchValue} onSearchChange={setSearchValue}
        onRefresh={() => refetch()} onCreate={() => router.push("/admin/workflows/new-workflow")}
      />

      <AnimatePresence mode="wait">
        <motion.div key={contentKey} className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1 scrollbar">
            <WorkflowListHeader />
            {isLoading ? (
              <WorkflowListItemSkeleton count={5} />
            ) : hasError ? (
              <StateCard title="Akışlar yüklenemedi" Icon={FileXCorner} description="Akış verileri yüklenirken hata oluştu." />
            ) : workflows.length === 0 ? (
              <StateCard title="Akış bulunamadı" Icon={FileSearchCorner}
                description={debouncedSearch ? "Aranılan kelimede akış bulunamadı." : "Henüz bir akış oluşturmadınız."}
              />
            ) : (
              <div className="divide-y divide-white/5">
                {workflows.map((workflow) => (
                  <WorkflowListItem key={workflow.id} workflow={workflow} />
                ))}
              </div>
            )}
          </div>

          {!isLoading && !hasError && workflows.length > 0 && (
            <div className="flex items-center justify-between gap-3 border-t border-white/10">
              <p className="pt-3 text-2xs text-neutral-500">
                <span className="font-semibold tabular-nums text-neutral-200">{totalCount}</span> akış gösteriliyor
              </p>
              <Pagination current={meta.page ?? page}
                totalPages={meta.totalPages ?? 1}
                totalCount={totalCount}
                pageSize={meta.pageSize ?? workflows.length}
                entriesLength={workflows.length}
                onPageChange={setPage}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
