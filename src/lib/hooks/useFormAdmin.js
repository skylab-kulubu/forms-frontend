import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../apiClient";

const BASE_URL = "http://localhost:5000";

const fetchFormById = async (formId) => {
  return request(`/api/admin/forms/${formId}`);
};

const upsertForm = async (payload) => {
  return request("/api/admin/forms", {
    method: "POST",
    body: payload,
  });
};

const fetchUserForms = async () => {
  const response = await request("/api/admin/forms");
  return response?.data ?? [];
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

export const useUserFormsQuery = () =>
  useQuery({
    queryKey: ["user-forms"],
    queryFn: fetchUserForms,
    retry: false,
  });

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
    mutationFn: upsertForm,
    onSuccess: (data) => {
      if (data?.id) {
        queryClient.setQueryData(["form", data.id], data);
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
