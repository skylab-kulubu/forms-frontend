import { useMutation, useQuery } from "@tanstack/react-query";
import { request } from "../apiClient";

const createResponseShare = async (responseId) => {
  return request(`/api/admin/forms/responses/${responseId}/share`, {
    method: "POST",
  });
};

const revokeResponseToken = async (responseId) => {
  return request(`/api/admin/forms/responses/${responseId}/revoke-token`, {
    method: "POST",
  });
};

const fetchResponsePreview = async (responseId, token) => {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return request(`/api/admin/forms/responses/${responseId}${query}`);
};

export const useCreateResponseShareMutation = () => {
  return useMutation({
    mutationFn: createResponseShare,
  });
};

export const useRevokeResponseTokenMutation = () => {
  return useMutation({
    mutationFn: revokeResponseToken,
  });
};

export const useResponsePreviewQuery = (responseId, token, options = {}) =>
  useQuery({
    queryKey: ["response", responseId, token || null],
    queryFn: () => fetchResponsePreview(responseId, token),
    enabled: !!responseId && options.enabled !== false,
    retry: false,
    ...options,
  });
