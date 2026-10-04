import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchResponseById = async (responseId) => {
  return request(`/api/admin/forms/responses/${responseId}`);
};

const fetchFormResponses = async (formId, { page = 1, status, attemptStatus, time, responderType, showArchived = false, sortingDirection } = {}) => {
  const params = new URLSearchParams();
  if (page !== undefined && page !== null) params.set("Page", page);
  if (status !== undefined && status !== null) params.set("Status", status);
  if (attemptStatus !== undefined && attemptStatus !== null) params.set("AttemptStatus", attemptStatus);
  if (time) params.set("Time", time);
  if (responderType !== undefined && responderType !== null) params.set("ResponderType", responderType);
  if (showArchived !== undefined && showArchived !== null) params.set("ShowArchived", showArchived ? "true" : "false");
  if (sortingDirection) params.set("SortingDirection", sortingDirection);
  const query = params.toString();
  return request(`/api/admin/forms/${formId}/responses${query ? `?${query}` : ""}`);
};

const postResponseArchive = async (responseId) => {
  if (!responseId) throw new Error("responseId is required");
  return request(`/api/admin/forms/responses/${responseId}/archive`, {
    method: "POST",
  });
}

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

const postAttemptAction = async ({ attemptId, action, body }) => {
  if (!attemptId) throw new Error("attemptId is required");
  return request(`/api/admin/forms/attempts/${attemptId}/${action}`, {
    method: "POST",
    body: body ?? {},
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
  const { page = 1, status, attemptStatus, time, responderType, showArchived = false, sortingDirection, ...queryOptions } = options;
  return useQuery({
    queryKey: ["form-responses", formId, page, status, attemptStatus, time, responderType, showArchived, sortingDirection],
    queryFn: () => fetchFormResponses(formId, { page, status, attemptStatus, time, responderType, showArchived, sortingDirection }),
    enabled: queryOptions.enabled ?? !!formId,
    retry: queryOptions.retry ?? false,
    ...queryOptions,
  });
};

export const useAttemptQuery = (attemptId, options = {}) =>
  useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => request(`/api/admin/forms/attempts/${attemptId}`),
    enabled: options.enabled ?? !!attemptId,
    retry: false,
    ...options,
  });

export const useAttemptAnalyticsQuery = (formId, options = {}) =>
  useQuery({
    queryKey: ["attempt-analytics", formId],
    queryFn: () => request(`/api/admin/forms/${formId}/attempts/analytics`),
    enabled: options.enabled ?? !!formId,
    retry: false,
    ...options,
  });

export const useAttemptActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postAttemptAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["response"] });
      queryClient.invalidateQueries({ queryKey: ["attempt"] });
      queryClient.invalidateQueries({ queryKey: ["form-responses"] });
      queryClient.invalidateQueries({ queryKey: ["attempt-analytics"] });
    },
  });
};

export const useResponseArchiveMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postResponseArchive,
    onSuccess: (_data, responseId) => {
      if (responseId) {
        queryClient.invalidateQueries({ queryKey: ["response", responseId] });
      }
    }
  })
}

export const useResponseStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patchResponseStatus,
    onSuccess: (_data, variables) => {
      if (variables?.responseId) {
        queryClient.invalidateQueries({ queryKey: ["response", variables.responseId] });
      }
    },
  });
};
