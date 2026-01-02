"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ResponsesHeader } from "../../../components/Headers";
import { ResponseListItem, ResponseListItemSkeleton } from "../../../components/ListItem";
import Pagination from "../../../components/utils/Pagination";
import { useFormResponsesQuery } from "@/lib/hooks/useResponse";

export default function ResponsesListPage() {
  const params = useParams();
  const formId = params?.id;

  const [searchValue, setSearchValue] = useState("");
  const [sortValue, setSortValue] = useState("desc");
  const [statusValue, setStatusValue] = useState("all");
  const [respondentValue, setRespondentValue] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage((prev) => (prev === 1 ? prev : 1));
  }, [sortValue, statusValue, respondentValue, searchValue, formId]);

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

  const { data: responsesData , isLoading, error, refetch } = useFormResponsesQuery(formId, { page, status: statusParam, responderType: responderTypeParam, filterByUserId, sortingDirection });

  const formTitle = "--";
  const formIdLabel =  formId || "--";

  const responsesMeta = responsesData?.data ?? {};
  const responses = responsesMeta.items || [];

  const stats = useMemo(() => {
    const pendingCount = 1;
    return {
      responseCount: responsesMeta.totalCount,
      pendingCount,
    };
  }, [responses, responsesMeta.totalCount]);

  const hasError = Boolean(error);
  const contentKey = `${sortValue}-${statusValue}-${respondentValue}-${searchValue}-${page}-${isLoading ? "loading" : "ready"}-${hasError ? "error" : "ok"}`;

  return (
    <div className="flex h-[calc(100dvh-3rem)] flex-col gap-6 overflow-hidden p-6">
      <ResponsesHeader formTitle={formTitle} formId={formIdLabel} searchValue={searchValue} onSearchChange={setSearchValue}
        sortValue={sortValue} onSortChange={setSortValue} statusValue={statusValue} onStatusChange={setStatusValue}
        respondentValue={respondentValue} onRespondentChange={setRespondentValue} onRefresh={() => refetch()} stats={stats}
      />

      <AnimatePresence mode="wait">
        <motion.div key={contentKey} className="flex min-h-0 flex-1 flex-col"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
        >
          {isLoading ? (
            <ResponseListItemSkeleton count={3} />
          ) : hasError ? (
            <div className="rounded-2xl border border-neutral-900 bg-neutral-950/50 p-6 text-sm text-neutral-400">
              Responses could not be loaded.
            </div>
          ) : false ? (
            <div className="rounded-2xl border border-neutral-900 bg-neutral-950/50 p-6 text-sm text-neutral-400">
              No responses found.
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 overflow-y-auto pr-1 scrollbar">
                <div className="space-y-1.5">
                  {responses.map((response) => (
                    <ResponseListItem key={response.id} response={response} />
                  ))}
                </div>
              </div>
              <Pagination current={responsesMeta.page ?? page}
                totalPages={responsesMeta.totalPages ?? 1}
                totalCount={responsesMeta.totalCount ?? 0}
                pageSize={responsesMeta.pageSize ?? responses.length}
                entriesLength={responses.length}
                onPageChange={setPage}
              />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
