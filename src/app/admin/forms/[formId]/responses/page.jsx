"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ListX, TextSearch, X } from "lucide-react";
import { ResponsesHeader } from "../../../components/Headers";
import { ResponseListHeader, ResponseListItem, ResponseListItemSkeleton } from "../../../components/ListItem";
import Pagination from "../../../components/utils/Pagination";
import { useAttemptActionMutation, useFormResponsesQuery } from "@/lib/hooks/useResponse";
import { useExportResponses } from "@/lib/hooks/useFormAdmin";
import { useFormContext } from "../../../providers";
import StateCard from "@/app/components/StateCard";
import { STATUS_FILTERS, statusFilterParams } from "@/lib/attempt-status";
import { shortDuration } from "@/lib/form-timing";

const formatTimeSpent = (totalSeconds) => {
  if (totalSeconds === null || totalSeconds === undefined) return "--";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (minutes > 0) {
    return `${minutes} dk ${seconds > 0 ? `${seconds} sn` : ''}`;
  }
  return `${seconds} sn`;
};

const FILTER_DEFAULTS = { sort: "desc", status: "all", who: "all", time: "all", archived: false };

const CHIP_LABELS = {
  sort: { asc: "Eski önce" },
  who: { registered: "Kayıtlı", anonymous: "Anonim" },
  time: { extended: "Uzatılanlar", soon: "Bitmek üzere" },
};

const LINK_BUTTON = "underline underline-offset-3 transition-colors";

export default function ResponsesPage() {
  const params = useParams();
  const formId = params?.formId;
  const router = useRouter();

  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState(FILTER_DEFAULTS.sort);
  const [statusValue, setStatusValue] = useState(FILTER_DEFAULTS.status);
  const [respondentValue, setRespondentValue] = useState(FILTER_DEFAULTS.who);
  const [timeValue, setTimeValue] = useState(FILTER_DEFAULTS.time);
  const [showArchived, setShowArchived] = useState(FILTER_DEFAULTS.archived);
  const [page, setPage] = useState(1);
  const [reminded, setReminded] = useState({});

  const filterKey = `${sortValue}-${statusValue}-${respondentValue}-${timeValue}-${showArchived}-${searchValue}-${formId}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    if (page !== 1) setPage(1);
  }

  const statusParams = useMemo(() => statusFilterParams(statusValue), [statusValue]);

  const responderTypeParam = useMemo(() => {
    if (respondentValue === "registered") return 1;
    if (respondentValue === "anonymous") return 2;
    return 0;
  }, [respondentValue]);

  const sortingDirection = sortValue === "asc" ? "ascending" : "descending";

  const { exportToExcel, loading: exportLoading } = useExportResponses(formId);
  const remindMutation = useAttemptActionMutation();

  const { form: formInfo } = useFormContext();

  const { data: responsesData, isLoading, error, refetch } = useFormResponsesQuery(formId, {
    page, status: statusParams.status ?? null, attemptStatus: statusParams.attemptStatus ?? null, time: timeValue === "all" ? null : timeValue,
    responderType: responderTypeParam, showArchived, sortingDirection,
  });

  const formIdLabel = formId || "--";

  const responsesMeta = responsesData?.data?.paginationData ?? {};
  const responses = responsesMeta.items || [];
  const averageTimeSpent = responsesData?.data?.averageTimeSpent ?? null;
  const averageTaskSeconds = responsesData?.data?.averageTaskSeconds ?? null;
  const counts = responsesData?.data?.counts ?? null;
  const timed = Boolean(responsesData?.data?.hasTimeLimit);

  const stats = useMemo(() => {
    return {
      responseCount: formInfo?.responseCount ?? responsesMeta.totalCount ?? 0,
      pendingCount: formInfo?.waitingResponses ?? 0,
      averageTimeSpent: formatTimeSpent(averageTimeSpent),
    };
  }, [formInfo?.responseCount, formInfo?.waitingResponses, responsesMeta.totalCount, averageTimeSpent]);

  const chips = [
    sortValue !== FILTER_DEFAULTS.sort && { key: "sort", label: CHIP_LABELS.sort[sortValue], clear: () => setSortValue(FILTER_DEFAULTS.sort) },
    statusValue !== FILTER_DEFAULTS.status && { key: "status", label: STATUS_FILTERS.find((item) => item.value === statusValue)?.label, clear: () => setStatusValue(FILTER_DEFAULTS.status) },
    respondentValue !== FILTER_DEFAULTS.who && { key: "who", label: CHIP_LABELS.who[respondentValue], clear: () => setRespondentValue(FILTER_DEFAULTS.who) },
    timeValue !== FILTER_DEFAULTS.time && { key: "time", label: CHIP_LABELS.time[timeValue], clear: () => setTimeValue(FILTER_DEFAULTS.time) },
    showArchived && { key: "archived", label: "Arşiv dahil", clear: () => setShowArchived(false) },
  ].filter(Boolean);

  const clearFilters = () => {
    setSortValue(FILTER_DEFAULTS.sort);
    setStatusValue(FILTER_DEFAULTS.status);
    setRespondentValue(FILTER_DEFAULTS.who);
    setTimeValue(FILTER_DEFAULTS.time);
    setShowArchived(FILTER_DEFAULTS.archived);
  };

  const handleRemind = (attemptId) => {
    remindMutation.mutate({ attemptId, action: "remind" }, {
      onSuccess: () => setReminded((current) => ({ ...current, [attemptId]: true })),
    });
  };

  const hasError = Boolean(error);
  const contentKey = `${sortValue}-${statusValue}-${respondentValue}-${timeValue}-${showArchived}-${searchValue}-${page}-${isLoading ? "loading" : "ready"}-${hasError ? "error" : "ok"}`;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-6 overflow-hidden p-4 lg:p-6">
      <ResponsesHeader searchValue={searchValue} onSearchChange={setSearchValue}
        sortValue={sortValue} onSortChange={setSortValue} statusValue={statusValue} onStatusChange={setStatusValue} showArchived={showArchived} onShowArchivedChange={setShowArchived}
        respondentValue={respondentValue} onRespondentChange={setRespondentValue} timeValue={timeValue} onTimeChange={setTimeValue} counts={counts} timed={timed}
        onOverview={() => router.push(`/admin/forms/${formId}`)} onRefresh={() => refetch()} onExport={exportToExcel} exportLoading={exportLoading}
      />

      {chips.length > 0 && (
        <div className="-mb-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-2xs text-neutral-500">Filtreler</span>
          {chips.map((chip) => (
            <span key={chip.key} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/5 py-0.5 pl-2 pr-1 text-2xs text-neutral-300">
              {chip.label}
              <button type="button" onClick={chip.clear} aria-label={`${chip.label} filtresini kaldır`}
                className="grid size-4 place-items-center rounded text-neutral-500 transition-colors hover:bg-white/10 hover:text-neutral-200"
              >
                <X size={11} />
              </button>
            </span>
          ))}
          {chips.length > 1 && (
            <button type="button" onClick={clearFilters} className={`ml-1 text-2xs ${LINK_BUTTON} text-neutral-400 decoration-white/20 hover:text-neutral-100`}>
              Temizle
            </button>
          )}
        </div>
      )}

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
                  : chips.length > 0 ? "Verilen filtrelere uygun cevap bulunamadı."
                    : "Bu forma ait cevap henüz yok."
                } />
            ) : (
              <div className="divide-y divide-white/5">
                {responses.map((response) => (
                  <ResponseListItem key={response.id} formId={formId} response={response}
                    onRemind={handleRemind} reminding={remindMutation.isPending && remindMutation.variables?.attemptId === response.attempt?.id}
                    reminded={Boolean(response.attempt && reminded[response.attempt.id])}
                  />
                ))}
              </div>
            )}
          </div>

          {!isLoading && !hasError && responses.length > 0 && (
            <div className="flex items-center justify-between gap-4 border-t border-white/10">
              <div className="flex min-w-0 items-center gap-4 pt-3 text-2xs text-neutral-500">
                <span className="hidden min-w-0 max-w-56 truncate text-neutral-600 lg:inline">ID {formIdLabel}</span>
                {timed ? (
                  <span>Ort. teslim süresi <span className="font-semibold tabular-nums text-neutral-200">{averageTaskSeconds ? shortDuration(averageTaskSeconds * 1000) : "--"}</span></span>
                ) : (
                  <span>Ort. Süre <span className="font-semibold tabular-nums text-neutral-200">{stats.averageTimeSpent}</span></span>
                )}
                <span>Cevap <span className="font-semibold tabular-nums text-neutral-200">{stats.responseCount}</span></span>
                <span>Bekleyen <span className="font-semibold tabular-nums text-neutral-200">{stats.pendingCount}</span></span>
                {timed && counts && (
                  <span className="hidden sm:inline">Geçici <span className="font-semibold tabular-nums text-neutral-200">{counts.provisional}</span></span>
                )}
              </div>
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
