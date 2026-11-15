"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FilePlus, FileSearchCorner, FileXCorner } from "lucide-react";
import { Button } from "@skylab-kulubu/skylcn-ui";
import { WorkflowsHeader } from "../components/Headers";
import WorkflowList from "../components/WorkflowListItem";
import Pagination from "../components/utils/Pagination";
import { useWorkflowsQuery } from "@/lib/hooks/useWorkflowAdmin";

export default function WorkflowsPage() {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortValue, setSortValue] = useState("desc");
  const [showArchived, setShowArchived] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(searchValue.trim()), 500);
    return () => clearTimeout(handle);
  }, [searchValue]);

  const filterKey = `${debouncedSearch}|${sortValue}|${showArchived}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    if (page !== 1) setPage(1);
  }

  const { data, isLoading, error, refetch } = useWorkflowsQuery({
    page, search: debouncedSearch || undefined, sortDirection: sortValue === "asc" ? "ascending" : "descending", showArchived,
  });

  const payload = data?.data ?? data;
  const meta = Array.isArray(payload) || !payload ? {} : payload;
  const workflows = useMemo(() => {
    if (Array.isArray(payload)) return payload;
    return Array.isArray(payload?.items) ? payload.items : [];
  }, [payload]);

  const totalCount = meta.totalCount ?? workflows.length;
  const hasError = Boolean(error);

  const empty = hasError
    ? { title: "Akışlar yüklenemedi", icon: FileXCorner, description: "Akış verileri yüklenirken hata oluştu." }
    : debouncedSearch
      ? { title: "Akış bulunamadı", icon: FileSearchCorner, description: "Aranılan kelimede akış bulunamadı." }
      : {
          title: "Henüz akış yok", icon: FileSearchCorner,
          description: `Akış oluşturmak için bir formu düzenlerken altındaki "Sonraki adım ekle" düğmesini kullanın. İkinci adım eklenince akış burada görünür.${showArchived ? "" : " Arşivlenen akışlar filtrelerden açılabilir."}`,
          children: (
            <Button size="sm" variant="outline" render={<Link href="/admin/forms/new-form" />}>
              <FilePlus aria-hidden="true" />
              Yeni form
            </Button>
          ),
        };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-hidden p-4 lg:p-6">
      <WorkflowsHeader searchValue={searchValue} onSearchChange={setSearchValue}
        sortValue={sortValue} onSortChange={setSortValue} showArchived={showArchived} onShowArchivedChange={setShowArchived}
        onRefresh={() => refetch()}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {/* This box scrolls on every width, so the list's sticky header holds at its top rather than below the phone bar */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1 scrollbar [--skylcn-sticky-top:0px]">
          <WorkflowList workflows={hasError ? [] : workflows} loading={isLoading} empty={empty} />
        </div>

        {!isLoading && !hasError && workflows.length > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-border">
            <p className="pt-3 text-2xs text-subtle-foreground">
              <span className="font-semibold tabular-nums text-foreground">{totalCount}</span> akış gösteriliyor
            </p>
            <Pagination current={meta.page ?? page} totalPages={meta.totalPages ?? 1} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
