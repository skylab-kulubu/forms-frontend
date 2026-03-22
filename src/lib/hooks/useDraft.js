import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchFormDraft = (formId) =>
  request(`/api/admin/forms/${formId}/draft`);

const deleteFormDraft = (formId) =>
  request(`/api/admin/forms/${formId}/draft`, { method: "DELETE" });

export function useDraftQuery(formId) {
  return useQuery({
    queryKey: ["form-draft", formId],
    queryFn: () => fetchFormDraft(formId),
    enabled: !!formId,
    retry: false,
    staleTime: Infinity,
  });
}

export function useDeleteDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFormDraft,
    onSuccess: (_data, formId) => {
      queryClient.removeQueries({ queryKey: ["form-draft", formId] });
    },
  });
}