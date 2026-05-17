import { useQuery } from "@tanstack/react-query";
import { request } from "../apiClient";

export const fetchUserByMail = async ({ email, roles }) => {
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (roles && roles.length > 0) params.set("roles", roles.join(","));
    const query = params.toString();
    return request(`/api/users${query ? `?${query}` : ""}`);
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