import { useQuery } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchMediaById = async (mediaId) => {
  return request(`/api/media/${mediaId}`);
};

export const useMediaQuery = (mediaId, options = {}) =>
  useQuery({
    queryKey: ["media", mediaId],
    queryFn: () => fetchMediaById(mediaId),
    enabled: options.enabled ?? !!mediaId,
    retry: options.retry ?? false,
    staleTime: 1000 * 60 * 10,
    ...options,
  });
