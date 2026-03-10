import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSession } from "next-auth/react";
import { request } from "../apiClient";

const fetchFormById = async (formId) => {
  return request(`/api/admin/forms/${formId}`);
};

const createForm = async (payload) => {
  return request("/api/admin/forms", {
    method: "POST",
    body: payload,
  });
};

const updateForm = async ({ id, payload }) => {
  return request(`/api/admin/forms/${id}`, {
    method: "PUT",
    body: payload,
  });
};

const fetchUserForms = async ({ page = 1, pageSize, search, role, allowAnonymous, allowMultiple, hasLinkedForm, requiresManualReview, sortDirection } = {}) => {
  const params = new URLSearchParams();
  if (page !== undefined && page !== null) params.set("Page", page);
  if (pageSize !== undefined && pageSize !== null) params.set("PageSize", pageSize);
  if (search) params.set("Search", search);
  if (role !== undefined && role !== null) params.set("Role", role);
  if (allowAnonymous !== undefined && allowAnonymous !== null) params.set("AllowAnonymous", allowAnonymous);
  if (allowMultiple !== undefined && allowMultiple !== null) params.set("AllowMultiple", allowMultiple);
  if (hasLinkedForm !== undefined && hasLinkedForm !== null) params.set("HasLinkedForm", hasLinkedForm);
  if (requiresManualReview !== undefined && requiresManualReview !== null) params.set("RequiresManualReview", requiresManualReview);
  if (sortDirection) params.set("SortDirection", sortDirection);
  const query = params.toString();
  return request(`/api/admin/forms${query ? `?${query}` : ""}`);
};

const fetchLinkableUserForms = async (formId) => {
  const response = await request(`/api/admin/forms/${formId}/linkable-forms`);
  return response?.data ?? [];
};

const fetchFormMetrics = async (formId) => {
  return request(`/api/admin/forms/${formId}/metrics`);
};

const fetchServiceMetrics = async () => {
  return request("/api/admin/forms/metrics");
};

const deleteForm = async (formId) => {
  return request(`/api/admin/forms/${formId}`, {
    method: "DELETE",
  });
};

export const useUserFormsQuery = (options = {}) => {
  const { page = 1, pageSize, search, role, allowAnonymous, allowMultiple, hasLinkedForm, requiresManualReview, sortDirection, ...queryOptions } = options;
  return useQuery({
    queryKey: ["user-forms", page, pageSize, search, role, allowAnonymous, allowMultiple, hasLinkedForm, requiresManualReview, sortDirection],
    queryFn: () => fetchUserForms({ page, pageSize, search, role, allowAnonymous, allowMultiple, hasLinkedForm, requiresManualReview, sortDirection }),
    retry: queryOptions.retry ?? false,
    ...queryOptions,
  });
};

export const useFormQuery = (formId) =>
  useQuery({
    queryKey: ["form", formId],
    queryFn: () => fetchFormById(formId),
    enabled: !!formId,
    retry: false,
  });

export const useLinkableFormsQuery = (formId) =>
  useQuery({
    queryKey: ["linkable-forms", formId],
    queryFn: () => fetchLinkableUserForms(formId),
    enabled: !!formId,
    retry: false,
  });

export const useServiceMetricsQuery = (options = {}) => {
  return useQuery({
    queryKey: ["service-metrics"],
    queryFn: fetchServiceMetrics,
    retry: options.retry ?? false,
    ...options,
  });
};

export const useFormMetricsQuery = (formId, options = {}) => {
  return useQuery({
    queryKey: ["form-metrics", formId],
    queryFn: () => fetchFormMetrics(formId),
    enabled: options.enabled ?? !!formId,
    retry: options.retry ?? false,
    ...options,
  });
};

export const useFormMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload, isUpdate }) => {
      if (isUpdate && id) {
        return updateForm({ id, payload });
      }
      return createForm(payload);
    },
    onSuccess: (data) => {
      const createdId = data?.data?.id ?? data?.id;
      if (createdId) {
        queryClient.setQueryData(["form", createdId], data);
      }
    },
  });
};

export const useDeleteFormMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteForm,
    onSuccess: (_data, formId) => {
      if (formId) {
        queryClient.removeQueries({ queryKey: ["form", formId] });
      }
      queryClient.invalidateQueries({ queryKey: ["user-forms"] });
    },
  });
};

export const useExportResponses = (formId) => {
  const [loading, setLoading] = useState(false);

  const exportToExcel = useCallback(async () => {
    if (loading || !formId) return;
    setLoading(true);
    try {
      const session = await getSession();
      const token = session?.accessToken;
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
      const res = await fetch(`${baseUrl}/api/admin/forms/${formId}/responses/export`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Export başarısız: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FormCevaplari_${formId.substring(0, 8)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Excel export hatası:", err);
    } finally {
      setLoading(false);
    }
  }, [formId, loading]);

  return { exportToExcel, loading };
};