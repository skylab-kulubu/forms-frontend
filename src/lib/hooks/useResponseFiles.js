import { useQuery } from "@tanstack/react-query";
import { request } from "../apiClient";

const tokenQuery = (token) => (token ? `?token=${encodeURIComponent(token)}` : "");

const fetchResponseFile = (responseId, mediaId, token) =>
  request(`/api/admin/forms/responses/${responseId}/files/${mediaId}${tokenQuery(token)}`);

export const requestResponseFileLink = (responseId, mediaId, token) =>
  request(`/api/admin/forms/responses/${responseId}/files/${mediaId}/link${tokenQuery(token)}`, { method: "POST" });

export const useResponseFileQuery = (responseId, mediaId, token, options = {}) =>
  useQuery({
    queryKey: ["response-file", responseId, mediaId, token || null],
    queryFn: () => fetchResponseFile(responseId, mediaId, token),
    enabled: Boolean(responseId && mediaId) && options.enabled !== false,
    retry: false,
    staleTime: 1000 * 60,
    refetchInterval: (query) => (query.state.data?.data?.status === "scanning" ? 15000 : false),
  });
