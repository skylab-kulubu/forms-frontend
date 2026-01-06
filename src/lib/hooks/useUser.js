import { useQuery } from "@tanstack/react-query";
import { request } from "../apiClient";

const fetchUserByMail = async ({ email, roles }) => {
    const params = new URLSearchParams();
    if (email) params.set("email", email);
    if (roles && roles.length > 0) {roles.forEach(role => {params.append("roles", role);})}
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