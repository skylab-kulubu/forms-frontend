"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ResponsesHeader } from "../../../components/Headers";
import { ResponseListItem, ResponseListItemSkeleton } from "../../../components/ListItem";
import { useFormResponsesQuery } from "@/lib/hooks/useResponse";

export default function ResponsesListPage() {
  const params = useParams();
  const formId = params?.id;

  const [searchValue, setSearchValue] = useState("");
  const [filterValue, setFilterValue] = useState("all");

  const { data: responsesData , isLoading, error, refetch } = useFormResponsesQuery(formId);

  const formTitle = "--";
  const formIdLabel =  formId || "--";

  const responses = responsesData?.data || [];

  const filteredResponses = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    const statusMap = { none: 0, pending: 1, approved: 2, rejected: 3 };

    let next = responses;

    if (filterValue !== "all") {
      const targetStatus = statusMap[filterValue];
      if (targetStatus != null) {
        next = next.filter((response) => Number(response?.status) === targetStatus);
      }
    }

    if (query) {
      next = next.filter((response) => {
        const idValue = response?.id?.toLowerCase?.() ?? "";
        const userIdValue = response?.userId?.toLowerCase?.() ?? "";
        return idValue.includes(query) || userIdValue.includes(query);
      });
    }

    return next;
  }, [responses, searchValue, filterValue]);

  const stats = useMemo(() => {
    const pendingCount = responses.filter((item) => Number(item?.status) === 1).length;
    return {
      responseCount: responses.length,
      pendingCount,
    };
  }, [responses]);

  const hasError = Boolean(error);

  return (
    <div className="p-6 space-y-6">
      <ResponsesHeader formTitle={formTitle} formId={formIdLabel} searchValue={searchValue} onSearchChange={setSearchValue}
        filterValue={filterValue} onFilterChange={setFilterValue} onRefresh={() => refetch()} stats={stats}
      />

      {isLoading ? (
        <ResponseListItemSkeleton count={3} />
      ) : hasError ? (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/50 p-6 text-sm text-neutral-400">
          Responses could not be loaded.
        </div>
      ) : filteredResponses.length === 0 ? (
        <div className="rounded-2xl border border-neutral-900 bg-neutral-950/50 p-6 text-sm text-neutral-400">
          No responses found.
        </div>
      ) : (
        <div className="space-y-1.5">
          {filteredResponses.map((response) => (
            <ResponseListItem key={response.id} response={response} />
          ))}
        </div>
      )}
    </div>
  );
}
