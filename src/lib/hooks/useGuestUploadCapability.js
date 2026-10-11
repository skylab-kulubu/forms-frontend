import { useQuery } from "@tanstack/react-query";
import { fetchGuestUploadCapability } from "../guest-uploads";

export const useGuestUploadCapabilityQuery = (options = {}) =>
  useQuery({
    queryKey: ["guest-upload-capability"],
    queryFn: fetchGuestUploadCapability,
    staleTime: Infinity,
    retry: false,
    ...options,
  });
