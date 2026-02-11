import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

const fetchUserForms = async ({ page = 1, pageSize, search, role, allowAnonymous, allowMultiple, hasLinkedForm, sortDirection } = {}) => {
  const params = new URLSearchParams();
  if (page !== undefined && page !== null) params.set("Page", page);
  if (pageSize !== undefined && pageSize !== null) params.set("PageSize", pageSize);
  if (search) params.set("Search", search);
  if (role !== undefined && role !== null) params.set("Role", role);
  if (allowAnonymous !== undefined && allowAnonymous !== null) params.set("AllowAnonymous", allowAnonymous);
  if (allowMultiple !== undefined && allowMultiple !== null) params.set("AllowMultiple", allowMultiple);
  if (hasLinkedForm !== undefined && hasLinkedForm !== null) params.set("HasLinkedForm", hasLinkedForm);
  if (sortDirection) params.set("SortDirection", sortDirection);
  const query = params.toString();
  return request(`/api/admin/forms${query ? `?${query}` : ""}`);
};

const fetchLinkableUserForms = async (formId) => {
  const response = await request(`/api/admin/forms/${formId}/linkable-forms`);
  return response?.data ?? [];
}

const deleteForm = async (formId) => {
  return request(`/api/admin/forms/${formId}`, {
    method: "DELETE",
  });
};

export const useUserFormsQuery = (options = {}) => {
  const { page = 1, pageSize, search, role, allowAnonymous, allowMultiple, hasLinkedForm, sortDirection, ...queryOptions } = options;
  return useQuery({
    queryKey: ["user-forms", page, pageSize, search, role, allowAnonymous, allowMultiple, hasLinkedForm, sortDirection],
    queryFn: () => fetchUserForms({ page, pageSize, search, role, allowAnonymous, allowMultiple, hasLinkedForm, sortDirection }),
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
  })

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