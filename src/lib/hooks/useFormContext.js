import { useQuery } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchFormInfo = async (formId) => {
  const res = await request(`/api/admin/forms/${formId}/info`);
  return res?.data;
};

export const useFormInfoQuery = (formId, enabled = true) =>
  useQuery({
    queryKey: ["form-info", formId],
    queryFn: () => fetchFormInfo(formId),
    enabled: !!formId && enabled,
    retry: false,
    staleTime: 60_000,
  });
