import { useQuery } from "@tanstack/react-query";
import { fetchTurnstileStatus } from "../guest-uploads";

export const useTurnstileStatusQuery = (options = {}) =>
  useQuery({
    queryKey: ["turnstile-status"],
    queryFn: fetchTurnstileStatus,
    staleTime: 15000,
    retry: false,
    ...options,
  });
