import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchResponseById = async (responseId) => {
  return request(`/api/admin/forms/responses/${responseId}`);
};

const fetchFormResponses = async (formId) => {
  return request(`/api/admin/forms/${formId}/responses`);
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

export const useFormResponsesQuery = (formId, options = {}) =>
  useQuery({
    queryKey: ["form-responses", formId],
    queryFn: () => fetchFormResponses(formId),
    enabled: options.enabled ?? !!formId,
    retry: options.retry ?? false,
    ...options,
  });

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