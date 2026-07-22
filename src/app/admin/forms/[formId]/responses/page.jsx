"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ResponsesHeader } from "../../../components/Headers";
import { ResponseListHeader, ResponseListItem, ResponseListItemSkeleton } from "../../../components/ListItem";
import Pagination from "../../../components/utils/Pagination";
import { useFormResponsesQuery } from "@/lib/hooks/useResponse";
import { useExportResponses } from "@/lib/hooks/useFormAdmin";
import { useFormContext } from "../../../providers";
import StateCard from "@/app/components/StateCard";
import { ListX, TextSearch } from "lucide-react";

const formatTimeSpent = (totalSeconds) => {
  if (totalSeconds === null || totalSeconds === undefined) return "--";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (minutes > 0) {
    return `${minutes} dk ${seconds > 0 ? `${seconds} sn` : ''}`;
  }
  return `${seconds} sn`;
};

export default function ResponsesPage() {
  const params = useParams();
  const formId = params?.formId;

  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState("desc");
  const [statusValue, setStatusValue] = useState("all");
  const [respondentValue, setRespondentValue] = useState("all");
  const [showArchived, setShowArchived] = useState(false);
  const [page, setPage] = useState(1);

  const filterKey = `${sortValue}-${statusValue}-${respondentValue}-${showArchived}-${searchValue}-${formId}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    if (page !== 1) setPage(1);
  }

  const statusParam = useMemo(() => {
    if (statusValue === "pending") return 1;
    if (statusValue === "approved") return 2;
    if (statusValue === "rejected") return 3;
    return null;
  }, [statusValue]);

  const responderTypeParam = useMemo(() => {
    if (respondentValue === "registered") return 1;
    if (respondentValue === "anonymous") return 2;
    return 0;
  }, [respondentValue]);

  const sortingDirection = sortValue === "asc" ? "ascending" : "descending";
  const filterByUserId = "";

  const { exportToExcel, loading: exportLoading } = useExportResponses(formId);

  const { form: formInfo } = useFormContext();

  const { data: responsesData, isLoading, error, refetch } = useFormResponsesQuery(formId, { page, status: statusParam, responderType: responderTypeParam, filterByUserId, showArchived, sortingDirection });

  const formIdLabel = formId || "--";

  const responsesMeta = responsesData?.data?.paginationData ?? {};
  const responses = responsesMeta.items || [];
  const averageTimeSpent = responsesData?.data?.averageTimeSpent ?? null;

  const stats = useMemo(() => {
    return {
      responseCount: formInfo?.responseCount ?? responsesMeta.totalCount ?? 0,
      pendingCount: formInfo?.waitingResponses ?? 0,
      averageTimeSpent: formatTimeSpent(averageTimeSpent),
    };
  }, [formInfo?.responseCount, formInfo?.waitingResponses, responsesMeta.totalCount, averageTimeSpent]);

  const hasError = Boolean(error);
  const contentKey = `${sortValue}-${statusValue}-${respondentValue}-${showArchived}-${searchValue}-${page}-${isLoading ? "loading" : "ready"}-${hasError ? "error" : "ok"}`;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-hidden p-4 lg:p-6">
      <ResponsesHeader searchValue={searchValue} onSearchChange={setSearchValue}
        sortValue={sortValue} onSortChange={setSortValue} statusValue={statusValue} onStatusChange={setStatusValue} showArchived={showArchived} onShowArchivedChange={setShowArchived}
        respondentValue={respondentValue} onRespondentChange={setRespondentValue} onRefresh={() => refetch()} onExport={exportToExcel} exportLoading={exportLoading}
      />

      <AnimatePresence mode="wait">
        <motion.div key={contentKey} className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        >
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto pr-1 scrollbar">
            <ResponseListHeader sortDirection={sortValue} onSort={() => setSortValue((prev) => (prev === "asc" ? "desc" : "asc"))} />
            {isLoading ? (
              <ResponseListItemSkeleton count={6} />
            ) : hasError ? (
              <StateCard title={"Cevaplar yüklenemedi"} Icon={ListX} description={"Cevap verileri yüklenirken hata oluştu."} />
            ) : responses.length === 0 ? (
              <StateCard title={"Cevap bulunamadı"} Icon={TextSearch}
                description={searchValue !== "" ? "Aranan kişiye ait cevap bulunamadı."
                  : (statusValue !== "all" | respondentValue !== "all") ? "Verilen filtrelere uygun cevap bulunamadı."
                    : "Bu forma ait cevap henüz yok."
                } />
            ) : (
              <div className="divide-y divide-white/5">
                {responses.map((response) => (
                  <ResponseListItem key={response.id} formId={formId} response={response} />
                ))}
              </div>
            )}
          </div>

          {!isLoading && !hasError && responses.length > 0 && (
            <div className="flex items-center justify-between gap-4 border-t border-white/10">
              <div className="flex min-w-0 items-center gap-4 pt-3 text-2xs text-neutral-500">
                <span className="hidden min-w-0 max-w-56 truncate text-neutral-600 lg:inline">ID {formIdLabel}</span>
                <span>Ort. Süre <span className="font-semibold tabular-nums text-neutral-200">{stats.averageTimeSpent}</span></span>
                <span>Cevap <span className="font-semibold tabular-nums text-neutral-200">{stats.responseCount}</span></span>
                <span>Bekleyen <span className="font-semibold tabular-nums text-neutral-200">{stats.pendingCount}</span></span>
              </div>;
              <div className="-mb-4">
                <Pagination current={responsesMeta.page ?? page}
                  totalPages={responsesMeta.totalPages ?? 1}
                  totalCount={responsesMeta.totalCount ?? 0}
                  pageSize={responsesMeta.pageSize ?? responses.length}
                  entriesLength={responses.length}
                  onPageChange={setPage}
                />
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}