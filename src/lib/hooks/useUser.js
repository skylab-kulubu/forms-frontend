import { useQuery } from "@tanstack/react-query";
import { request } from "../apiClient";

function asList(payload) {
    return Array.isArray(payload) ? payload : [];
}

export const fetchUserByMail = async ({ email, roles }) => {
    if (roles && roles.length > 0) {
        const groups = asList(await request("/v1/groups"));
        const wanted = new Set(roles);
        const matches = groups.filter((group) => wanted.has(group?.name));
        const lists = await Promise.all(
            matches.map((group) => request(`/v1/groups/${group.id}/members`))
        );
        const byId = new Map();
        for (const list of lists) {
            for (const user of asList(list)) {
                if (user?.id) byId.set(user.id, user);
            }
        }
        return [...byId.values()];
    }
    const params = new URLSearchParams();
    if (email) params.set("q", email);
    params.set("clientId", "forms");
    params.set("role", "skyforms:access");
    return request(`/v1/users?${params.toString()}`);
}

export const useUserByMailQuery = (options = {}) => {
    const { email, roles, ...queryOptions } = options;
    return useQuery({
        queryKey: ["user-by-mail", email, roles],
        queryFn: () => fetchUserByMail({ email, roles }),
        retry: queryOptions.retry ?? false,
        ...queryOptions,
    })
}
