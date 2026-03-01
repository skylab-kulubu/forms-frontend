import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchGroups = async ({ page = 1, pageSize, search, sortDirection } = {}) => {
  const params = new URLSearchParams();
  if (page !== undefined && page !== null) params.set("Page", page);
  if (pageSize !== undefined && pageSize !== null) params.set("PageSize", pageSize);
  if (search) params.set("Search", search);
  if (sortDirection) params.set("SortDirection", sortDirection);
  const query = params.toString();
  return request(`/api/admin/forms/component-groups${query ? `?${query}` : ""}`);
};

const fetchGroupById = async (groupId) => {
  return request(`/api/admin/forms/component-groups/${groupId}`);
};

const createGroup = async (payload) => {
  return request("/api/admin/forms/component-groups/", {
    method: "POST",
    body: payload,
  });
};

const updateGroup = async ({ id, payload }) => {
  return request(`/api/admin/forms/component-groups/${id}`, {
    method: "PUT",
    body: payload,
  });
};

const deleteGroup = async (groupId) => {
  return request(`/api/admin/forms/component-groups/${groupId}`, {
    method: "DELETE",
  });
};

export const useGroupsQuery = (options = {}) => {
  const { page = 1, pageSize, search, sortDirection, ...queryOptions } = options;
  return useQuery({
    queryKey: ["groups", page, pageSize, search, sortDirection],
    queryFn: () => fetchGroups({ page, pageSize, search, sortDirection }),
    retry: queryOptions.retry ?? false,
    ...queryOptions,
  });
};

export const useGroupQuery = (groupId) =>
  useQuery({
    queryKey: ["group", groupId],
    queryFn: () => fetchGroupById(groupId),
    enabled: !!groupId,
    retry: false,
  });

export const useGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload, isUpdate }) => {
      if (isUpdate && id) {
        return updateGroup({ id, payload });
      }
      return createGroup(payload);
    },
    onSuccess: (data) => {
      const group = data?.data ?? data;
      const groupId = group?.id;
      if (groupId) {
        queryClient.setQueryData(["group", groupId], data);
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};

export const useDeleteGroupMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGroup,
    onSuccess: (_data, groupId) => {
      if (groupId) {
        queryClient.removeQueries({ queryKey: ["group", groupId] });
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
};
