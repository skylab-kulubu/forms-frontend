import { useMutation, useQueryClient } from "@tanstack/react-query";
import { request } from "../apiClient";

// Devirden sonra form editörde kalır (editör olarak), şablon ve akış ise sahibinin listesinden çıkar.
const KINDS = {
  form: {
    base: "/api/admin/forms",
    refresh: (id) => [["form", id], ["form-info", id], ["user-forms"], ["all-forms"]],
    drop: () => [],
  },
  group: {
    base: "/api/admin/forms/component-groups",
    refresh: () => [["groups"]],
    drop: (id) => [["group", id]],
  },
  workflow: {
    base: "/api/admin/workflows",
    refresh: () => [["workflows"], ["user-forms"]],
    drop: (id) => [["workflow", id]],
  },
};

const transferOwnership = ({ kind, id, userId }) =>
  request(`${KINDS[kind].base}/${id}/transfer`, { method: "POST", body: { userId } });

export const useTransferOwnershipMutation = (kind) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }) => transferOwnership({ kind, id, userId }),
    onSuccess: (_data, { id }) => {
      KINDS[kind].drop(id).forEach((queryKey) => queryClient.removeQueries({ queryKey }));
      KINDS[kind].refresh(id).forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    },
  });
};
