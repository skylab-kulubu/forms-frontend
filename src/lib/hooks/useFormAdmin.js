import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request, FORM_ACCESS_STATUS } from "../apiClient";

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

export const useFormQuery = (formId) =>
  useQuery({
    queryKey: ["form", formId],
    queryFn: () => fetchFormById(formId),
    enabled: !!formId,
    retry: false,
  });

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