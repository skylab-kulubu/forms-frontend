import { useMemo } from "react";
import { keepPreviousData, useQueries, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/apiClient";
import { useUserFormsQuery } from "@/lib/hooks/useFormAdmin";

const PAGE_SIZE = 100;
const SORT = { sortBy: "updatedAt", sortDirection: "descending" };
const PARAM_NAMES = { search: "Search", role: "Role", allowAnonymous: "AllowAnonymous", allowMultiple: "AllowMultiple", requiresManualReview: "RequiresManualReview" };

function fetchPage(page, filters) {
  const params = new URLSearchParams({ Page: page, PageSize: PAGE_SIZE, SortBy: SORT.sortBy, SortDirection: SORT.sortDirection });
  Object.entries(PARAM_NAMES).forEach(([key, name]) => {
    if (filters[key] !== undefined && filters[key] !== null) params.set(name, filters[key]);
  });
  return request(`/api/admin/forms?${params.toString()}`);
}

const mergeItems = (results) => results.flatMap((result) => result.data?.data?.items ?? []);

export function useAllForms(filters) {
  const queryClient = useQueryClient();
  const first = useUserFormsQuery({ ...filters, ...SORT, page: 1, pageSize: PAGE_SIZE, placeholderData: keepPreviousData });
  const meta = first.data?.data ?? null;
  const pages = Math.max(0, (meta?.totalPages ?? 1) - 1);

  const rest = useQueries({
    queries: Array.from({ length: pages }, (_, index) => ({
      queryKey: ["user-forms", "rest", index + 2, filters],
      queryFn: () => fetchPage(index + 2, filters),
      retry: false,
    })),
    combine: mergeItems,
  });

  const forms = useMemo(() => [...(Array.isArray(meta?.items) ? meta.items : []), ...rest], [meta, rest]);

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["user-forms"] });

  return { forms, isLoading: first.isLoading, error: first.error, refetch };
}
