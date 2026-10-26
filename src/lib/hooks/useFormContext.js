import { useQuery } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchFormInfo = async (formId) => {
  const res = await request(`/api/admin/forms/${formId}/info`);
  return res?.data;
};

export const formInfoQuery = (formId) => ({
  queryKey: ["form-info", formId],
  queryFn: () => fetchFormInfo(formId),
  retry: false,
  staleTime: 60_000,
});

export const useFormInfoQuery = (formId, enabled = true) =>
  useQuery({ ...formInfoQuery(formId), enabled: !!formId && enabled });
