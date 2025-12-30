import { useQuery } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchResponseById = async (responseId) => {
  return request(`/api/admin/forms/responses/${responseId}`);
};

export const useResponseQuery = (responseId, options = {}) =>
  useQuery({
    queryKey: ["response", responseId],
    queryFn: () => fetchResponseById(responseId),
    enabled: options.enabled ?? !!responseId,
    retry: options.retry ?? false,
    ...options,
  });
