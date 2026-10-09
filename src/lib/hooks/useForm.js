import { useQuery, useMutation } from "@tanstack/react-query";
import { request } from "../apiClient";

export const fetchDisplayFormById = async (formId) => {
  return request(`/api/forms/${formId}`, { auth: "optional" });
};

const postFormResponse = async ({ body, asGuest = false }) => {
  return request("/api/forms/responses", {
    method: "POST",
    body,
    auth: asGuest ? "none" : "required",
  });
};

const postAttemptStart = async (formId) => {
  return request(`/api/forms/${formId}/attempt`, { method: "POST" });
};

export const useDisplayFormQuery = (formId) =>
  useQuery({
    queryKey: ["display-form", formId],
    queryFn: () => fetchDisplayFormById(formId),
    enabled: !!formId,
    retry: false,
  });

export const useSubmitFormMutation = () => {
  return useMutation({
    mutationFn: postFormResponse,
  });
};

export const useStartAttemptMutation = () => {
  return useMutation({
    mutationFn: postAttemptStart,
  });
};
