import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSession } from "next-auth/react";
import { request } from "../apiClient";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const linkKey = (formId) => ["form-short-link", formId];
const ensureKey = (formId) => ["form-short-link", formId, "ensure"];

function storeLink(queryClient, formId, link) {
  queryClient.setQueryData(linkKey(formId), link);
  queryClient.setQueryData(ensureKey(formId), link);
}

export const useShortLinkQuery = (formId, options = {}) =>
  useQuery({
    queryKey: linkKey(formId),
    queryFn: async () => (await request(`/api/admin/forms/${formId}/short-link`))?.data ?? null,
    enabled: options.enabled ?? !!formId,
    retry: false,
    staleTime: 60_000,
  });

export const useEnsureShortLinkQuery = (formId, open) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ensureKey(formId),
    queryFn: async () => {
      const link = (await request(`/api/admin/forms/${formId}/short-link`, { method: "POST" }))?.data ?? null;
      queryClient.setQueryData(linkKey(formId), link);
      return link;
    },
    enabled: Boolean(open && formId),
    retry: false,
    staleTime: 60_000,
  });
};

export const useRenameShortLinkMutation = (formId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (alias) => request(`/api/admin/forms/${formId}/short-link`, { method: "PATCH", body: { alias } }),
    onSuccess: (result) => {
      const link = result?.data ?? null;
      if (link) storeLink(queryClient, formId, link);
    },
  });
};

export const useAliasAvailabilityQuery = (formId, alias, enabled) =>
  useQuery({
    queryKey: ["form-short-link-alias", formId, alias],
    queryFn: async () => (await request(`/api/admin/forms/${formId}/short-link/availability?alias=${encodeURIComponent(alias)}`))?.data ?? null,
    enabled: Boolean(enabled && formId && alias),
    retry: false,
    staleTime: 30_000,
  });

export const useShortLinkQrPreviewQuery = (formId, alias) =>
  useQuery({
    queryKey: ["form-short-link-qr", formId, alias],
    queryFn: async () => {
      const svg = await (await fetchShortLinkQr(formId, "svg")).text();
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    },
    enabled: Boolean(formId && alias),
    retry: false,
    staleTime: 5 * 60_000,
  });

export async function fetchShortLinkQr(formId, format = "png") {
  const session = await getSession();
  const token = session?.accessToken;
  const query = format === "svg" ? "?format=svg" : "";
  const response = await fetch(`${BASE_URL}/api/admin/forms/${formId}/short-link/qr${query}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!response.ok) {
    const error = new Error(`QR alınamadı: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.blob();
}
