import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchWorkflows = async ({ page = 1, pageSize, search, sortDirection } = {}) => {
  const params = new URLSearchParams();
  if (page !== undefined && page !== null) params.set("Page", page);
  if (pageSize !== undefined && pageSize !== null) params.set("PageSize", pageSize);
  if (search) params.set("Search", search);
  if (sortDirection) params.set("SortDirection", sortDirection);
  const query = params.toString();
  return request(`/api/admin/workflows${query ? `?${query}` : ""}`);
};

const fetchWorkflow = async (workflowId) => request(`/api/admin/workflows/${workflowId}`);

const fetchAvailableForms = async (workflowId) => request(`/api/admin/workflows/${workflowId}/available-forms`);

const fetchWorkflowVersions = async (workflowId) => request(`/api/admin/workflows/${workflowId}/versions`);

const createWorkflow = async (payload) => request("/api/admin/workflows", { method: "POST", body: payload });

const updateWorkflow = async ({ workflowId, payload }) => request(`/api/admin/workflows/${workflowId}`, { method: "PUT", body: payload });

const saveDefinition = async ({ workflowId, definition, token, keepalive }) =>
  request(`/api/admin/workflows/${workflowId}/definition`, { method: "PUT", body: definition, token, keepalive });

const validateWorkflow = async (workflowId) => request(`/api/admin/workflows/${workflowId}/validate`, { method: "POST" });

const publishWorkflow = async (workflowId) => request(`/api/admin/workflows/${workflowId}/publish`, { method: "POST" });

const archiveWorkflow = async (workflowId) => request(`/api/admin/workflows/${workflowId}`, { method: "DELETE" });

export const useWorkflowsQuery = (options = {}) => {
  const { page = 1, pageSize, search, sortDirection, ...queryOptions } = options;
  return useQuery({
    queryKey: ["workflows", page, pageSize, search, sortDirection],
    queryFn: () => fetchWorkflows({ page, pageSize, search, sortDirection }),
    retry: queryOptions.retry ?? false,
    ...queryOptions,
  });
};

export const useWorkflowQuery = (workflowId, options = {}) =>
  useQuery({
    queryKey: ["workflow", workflowId],
    queryFn: () => fetchWorkflow(workflowId),
    enabled: options.enabled ?? !!workflowId,
    retry: options.retry ?? false,
    ...options,
  });

export const useAvailableFormsQuery = (workflowId, options = {}) =>
  useQuery({
    queryKey: ["workflow-available-forms", workflowId],
    queryFn: () => fetchAvailableForms(workflowId),
    enabled: options.enabled ?? !!workflowId,
    retry: options.retry ?? false,
    ...options,
  });

export const useWorkflowVersionsQuery = (workflowId, options = {}) =>
  useQuery({
    queryKey: ["workflow-versions", workflowId],
    queryFn: () => fetchWorkflowVersions(workflowId),
    enabled: options.enabled ?? !!workflowId,
    retry: options.retry ?? false,
    ...options,
  });

export const useCreateWorkflowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWorkflow,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflows"] }),
  });
};

export const useUpdateWorkflowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWorkflow,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      if (variables?.workflowId) queryClient.invalidateQueries({ queryKey: ["workflow", variables.workflowId] });
    },
  });
};

export const useSaveDefinitionMutation = () => useMutation({ mutationFn: saveDefinition });

export const useValidateWorkflowMutation = () => useMutation({ mutationFn: validateWorkflow });

export const usePublishWorkflowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishWorkflow,
    onSuccess: (_data, workflowId) => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      queryClient.invalidateQueries({ queryKey: ["workflow-versions", workflowId] });
      if (workflowId) queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
    },
  });
};

export const useArchiveWorkflowMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: archiveWorkflow,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workflows"] }),
  });
};

export { saveDefinition };
