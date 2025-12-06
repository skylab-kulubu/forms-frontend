import { useQuery } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchDisplayFormById = async (formId) => {
  return request(`/api/forms/${formId}`);
};

export const useDisplayFormQuery = (formId) =>
  useQuery({
    queryKey: ["display-form", formId],
    queryFn: () => fetchDisplayFormById(formId),
    enabled: !!formId,
    retry: false,
  });