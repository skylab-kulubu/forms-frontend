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

const fetchResponseDraft = (formId) =>
  request(`/api/forms/responses/draft/${formId}`);

const saveResponseDraft = (payload) =>
  request("/api/forms/responses/draft", { method: "POST", body: payload });

const deleteResponseDraft = (formId) =>
  request(`/api/forms/responses/draft/${formId}`, { method: "DELETE" });

export const useResponseDraftQuery = (formId, enabled = true) =>
  useQuery({
    queryKey: ["response-draft", formId],
    queryFn: () => fetchResponseDraft(formId),
    enabled: !!formId && enabled,
    retry: false,
    staleTime: Infinity,
  });

export const useSaveResponseDraftMutation = () =>
  useMutation({ mutationFn: saveResponseDraft });

export const useDeleteResponseDraftMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteResponseDraft,
    onSuccess: (_data, formId) => {
      queryClient.removeQueries({ queryKey: ["response-draft", formId] });
    },
  });
};