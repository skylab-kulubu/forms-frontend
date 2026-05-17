import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../apiClient";

const createGroupShare = async (groupId) => {
  return request(`/api/admin/forms/component-groups/${groupId}/share`, {
    method: "POST",
  });
};

const fetchGroupPreview = async (groupId, token) => {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return request(`/api/admin/forms/component-groups/${groupId}${query}`);
};

const cloneGroup = async ({ groupId, token }) => {
  const query = token ? `?token=${encodeURIComponent(token)}` : "";
  return request(`/api/admin/forms/component-groups/${groupId}/clone${query}`, {
    method: "POST",
  });
};

export const useCreateGroupShareMutation = () => {
  return useMutation({
    mutationFn: createGroupShare,
  });
};

export const useGroupPreviewQuery = (groupId, token, options = {}) =>
  useQuery({
    queryKey: ["group", groupId, token || null],
    queryFn: () => fetchGroupPreview(groupId, token),
    enabled: !!groupId && options.enabled !== false,
    retry: false,
    ...options,
  });

export const useCloneGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cloneGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};
