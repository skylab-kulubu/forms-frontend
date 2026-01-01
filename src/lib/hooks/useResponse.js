import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchResponseById = async (responseId) => {
  return request(`/api/admin/forms/responses/${responseId}`);
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

export const useResponseStatusMutation = () => {
  const queryClient = useQueryClient();

  const mergeResponsePayload = (prev, next) => {
    if (!next) return prev;
    const hasDataNext = next && Object.prototype.hasOwnProperty.call(next, "data");
    const hasDataPrev = prev && Object.prototype.hasOwnProperty.call(prev, "data");
    if (hasDataNext || hasDataPrev) {
      const prevData = hasDataPrev ? prev.data : prev;
      const nextData = hasDataNext ? next.data : (hasDataPrev ? {} : next);
      const base = hasDataNext ? next : (hasDataPrev ? prev : {});
      return { ...base, data: { ...(prevData || {}), ...(nextData || {}) } };
    }
    return { ...(prev || {}), ...(next || {}) };
  };

  const applyStatusOverrides = (payload, variables) => {
    if (!payload || !variables) return payload;
    const hasData = Object.prototype.hasOwnProperty.call(payload, "data");
    const current = hasData ? payload.data : payload;
    const overrides = {};
    if (variables.newStatus != null) {
      overrides.status = variables.newStatus;
    }
    if (variables.note != null) {
      overrides.reviewerNote = variables.note;
      overrides.reviewDescription = variables.note;
    }
    if (!current?.reviewedAt && (variables.newStatus === 2 || variables.newStatus === 3)) {
      overrides.reviewedAt = new Date().toISOString();
    }
    if (Object.keys(overrides).length === 0) return payload;
    return hasData
      ? { ...payload, data: { ...(current || {}), ...overrides } }
      : { ...payload, ...overrides };
  };

  return useMutation({
    mutationFn: patchResponseStatus,
    onSuccess: (data, variables) => {
      const responseId = variables?.responseId;
      if (!responseId) return;
      queryClient.setQueryData(["response", responseId], (prev) => {
        const merged = mergeResponsePayload(prev, data);
        return applyStatusOverrides(merged, variables);
      });
      queryClient.invalidateQueries({ queryKey: ["response", responseId] });
    },
  });
};