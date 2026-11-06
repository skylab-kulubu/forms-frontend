import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSession } from "next-auth/react";
import { request } from "../apiClient";

export const fetchFormById = async (formId) => {
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

const fetchUserForms = async ({ page = 1, pageSize, search, role, allowAnonymous, allowMultiple, requiresManualReview, sortBy, sortDirection } = {}) => {
  const params = new URLSearchParams();
  if (page !== undefined && page !== null) params.set("Page", page);
  if (pageSize !== undefined && pageSize !== null) params.set("PageSize", pageSize);
  if (search) params.set("Search", search);
  if (role !== undefined && role !== null) params.set("Role", role);
  if (allowAnonymous !== undefined && allowAnonymous !== null) params.set("AllowAnonymous", allowAnonymous);
  if (allowMultiple !== undefined && allowMultiple !== null) params.set("AllowMultiple", allowMultiple);
  if (requiresManualReview !== undefined && requiresManualReview !== null) params.set("RequiresManualReview", requiresManualReview);
  if (sortBy) params.set("SortBy", sortBy);
  if (sortDirection) params.set("SortDirection", sortDirection);
  const query = params.toString();
  return request(`/api/admin/forms${query ? `?${query}` : ""}`);
};

const fetchFormMetrics = async (formId) => {
  return request(`/api/admin/forms/${formId}/metrics`);
};

const RESPONSE_STATUS_PARAM = { approved: 2, pending: 1, declined: 3 };

const setAnalyticsFilter = (params, { status = null, sinceDays = null, answer = null } = {}) => {
  if (status) params.set("Status", RESPONSE_STATUS_PARAM[status]);
  if (sinceDays) params.set("SinceDays", sinceDays);
  if (answer?.q) {
    params.set("AnswerQuestionId", answer.q);
    params.set("AnswerValue", answer.v ?? "");
  }
  return params;
};

const fetchFormAnalytics = async (formId, filter) => {
  const query = setAnalyticsFilter(new URLSearchParams(), filter).toString();
  return request(`/api/admin/forms/${formId}/analytics${query ? `?${query}` : ""}`);
};

const fetchQuestionAnswers = async (formId, questionId, { page = 1, pageSize = 8, search = "", filter = null } = {}) => {
  const params = setAnalyticsFilter(new URLSearchParams({ Page: String(page), PageSize: String(pageSize) }), filter ?? {});
  if (search) params.set("Search", search);
  return request(`/api/admin/forms/${formId}/analytics/questions/${encodeURIComponent(questionId)}/answers?${params.toString()}`);
};

const fetchServiceMetrics = async () => {
  return request("/api/admin/forms/metrics");
};

const deleteForm = async (formId) => {
  return request(`/api/admin/forms/${formId}`, {
    method: "DELETE",
  });
};

const fetchAllForms = async ({ page, pageSize, search, allowAnonymous, allowMultiple, requiresManualReview, sortDirection } = {}) => {
  const params = new URLSearchParams();
  if (page !== undefined && page !== null) params.set("Page", page);
  if (pageSize !== undefined && pageSize !== null) params.set("PageSize", pageSize);
  if (search) params.set("Search", search);
  if (allowAnonymous !== undefined && allowAnonymous !== null) params.set("AllowAnonymous", allowAnonymous);
  if (allowMultiple !== undefined && allowMultiple !== null) params.set("AllowMultiple", allowMultiple);
  if (requiresManualReview !== undefined && requiresManualReview !== null) params.set("RequiresManualReview", requiresManualReview);
  if (sortDirection) params.set("SortDirection", sortDirection);
  const query = params.toString();
  return request(`/api/admin/forms/all${query ? `?${query}` : ""}`);
};

export const useAllFormsQuery = (options = {}) => {
  const { page = 1, pageSize, search, allowAnonymous, allowMultiple, requiresManualReview, sortDirection, ...queryOptions } = options;
  return useQuery({
    queryKey: ["all-forms", page, pageSize, search, allowAnonymous, allowMultiple, requiresManualReview, sortDirection],
    queryFn: () => fetchAllForms({ page, pageSize, search, allowAnonymous, allowMultiple, requiresManualReview, sortDirection }),
    retry: queryOptions.retry ?? false,
    ...queryOptions,
  });
};

export const useUserFormsQuery = (options = {}) => {
  const { page = 1, pageSize, search, role, allowAnonymous, allowMultiple, requiresManualReview, sortBy, sortDirection, ...queryOptions } = options;
  return useQuery({
    queryKey: ["user-forms", page, pageSize, search, role, allowAnonymous, allowMultiple, requiresManualReview, sortBy, sortDirection],
    queryFn: () => fetchUserForms({ page, pageSize, search, role, allowAnonymous, allowMultiple, requiresManualReview, sortBy, sortDirection }),
    retry: queryOptions.retry ?? false,
    ...queryOptions,
  });
};

export const formQuery = (formId) => ({
  queryKey: ["form", formId],
  queryFn: () => fetchFormById(formId),
  retry: false,
});

export const formMetricsQuery = (formId) => ({
  queryKey: ["form-metrics", formId],
  queryFn: () => fetchFormMetrics(formId),
  retry: false,
});

export const formAnalyticsQuery = (formId, { status = null, sinceDays = null, answer = null } = {}) => ({
  queryKey: ["form-analytics", formId, status, sinceDays, answer?.q ?? null, answer?.v ?? null],
  queryFn: () => fetchFormAnalytics(formId, { status, sinceDays, answer }),
  retry: false,
});

export const questionAnswersQuery = (formId, questionId, { page = 1, search = "", filter = null } = {}) => ({
  queryKey: ["question-answers", formId, questionId, page, search, filter?.status ?? null, filter?.sinceDays ?? null, filter?.answer?.q ?? null, filter?.answer?.v ?? null],
  queryFn: () => fetchQuestionAnswers(formId, questionId, { page, search, filter }),
  retry: false,
});

export const useFormQuery = (formId) =>
  useQuery({ ...formQuery(formId), enabled: !!formId });

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
    ...formMetricsQuery(formId),
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