import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchResponseById = async (responseId) => {
  return request(`/api/admin/forms/responses/${responseId}`);
};

const fetchFormResponses = async (formId, { page = 1, status, responderType, showArchived = false, sortingDirection } = {}) => {
  const params = new URLSearchParams();
  if (page !== undefined && page !== null) params.set("Page", page);
  if (status !== undefined && status !== null) params.set("Status", status);
  if (responderType !== undefined && responderType !== null) params.set("ResponderType", responderType);
  if (showArchived !== undefined && showArchived !== null) params.set("ShowArchived", showArchived ? "true" : "false");
  if (sortingDirection) params.set("SortingDirection", sortingDirection);
  const query = params.toString();
  return request(`/api/admin/forms/${formId}/responses${query ? `?${query}` : ""}`);
};

const patchResponseStatus = async ({ responseId, newStatus, note }) => {
  if (!responseId) throw new Error("responseId is required");
  return request(`/api/admin/forms/responses/${responseId}/status`, {
    method: "PATCH",
    body: {
      responseId,
      newStatus,
      note,
    },
  });
};

export const useResponseQuery = (responseId, options = {}) =>
  useQuery({
    queryKey: ["response", responseId],
    queryFn: () => fetchResponseById(responseId),
    enabled: options.enabled ?? !!responseId,
    retry: options.retry ?? false,
    ...options,
  });

export const useFormResponsesQuery = (formId, options = {}) => {
  const { page = 1, status, responderType, showArchived = false, sortingDirection, ...queryOptions } = options;
  return useQuery({
    queryKey: ["form-responses", formId, page, status, responderType, showArchived, sortingDirection],
    queryFn: () => fetchFormResponses(formId, { page, status, responderType, showArchived, sortingDirection }),
    enabled: queryOptions.enabled ?? !!formId,
    retry: queryOptions.retry ?? false,
    ...queryOptions,
  });
};

export const useResponseStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchResponseStatus,
    onSuccess: (data, variables) => {
      if (variables?.responseId) {
        queryClient.invalidateQueries({ queryKey: ["response", variables.responseId] });
      }
    },
  });
};
