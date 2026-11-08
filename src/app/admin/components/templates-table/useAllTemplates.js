import { useMemo } from "react";
import { useQueries, useQueryClient } from "@tanstack/react-query";
import { request } from "@/lib/apiClient";
import { useGroupsQuery } from "@/lib/hooks/useGroupAdmin";

const PAGE_SIZE = 100;

const mergeItems = (results) => results.flatMap((result) => result.data?.data?.items ?? []);

export function useAllTemplates() {
  const queryClient = useQueryClient();
  const first = useGroupsQuery({ page: 1, pageSize: PAGE_SIZE });
  const meta = first.data?.data ?? null;
  const pages = Math.max(0, (meta?.totalPages ?? 1) - 1);

  const rest = useQueries({
    queries: Array.from({ length: pages }, (_, index) => ({
      queryKey: ["groups", "rest", index + 2],
      queryFn: () => request(`/api/admin/forms/component-groups?Page=${index + 2}&PageSize=${PAGE_SIZE}`),
      retry: false,
    })),
    combine: mergeItems,
  });

  const templates = useMemo(() => [...(Array.isArray(meta?.items) ? meta.items : []), ...rest], [meta, rest]);

  const refetch = () => queryClient.invalidateQueries({ queryKey: ["groups"] });

  return { templates, isLoading: first.isLoading, error: first.error, refetch };
}
