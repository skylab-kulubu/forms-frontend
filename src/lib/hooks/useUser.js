import { useQuery } from "@tanstack/react-query";
import { request } from "../apiClient";

function asList(payload) {
    return Array.isArray(payload) ? payload : [];
}

function hasFormsSeat(role) {
    const name = role?.role || "";
    if (!name.startsWith("skyforms:")) return false;
    const client = role?.clientId || role?.clientID || "";
    return client === "dotnet" || client === "skyforms";
}

function matchesQuery(user, q) {
    const n = q.trim().toLocaleLowerCase("tr-TR");
    if (!n) return true;
    const blob = [
        user.email,
        user.firstName,
        user.lastName,
        user.username,
        user.schoolEmail,
        `${user.firstName || ""} ${user.lastName || ""}`,
    ].join(" ").toLocaleLowerCase("tr-TR");
    return blob.includes(n);
}

let seatCache = { at: 0, users: null };

async function formsSeatUsers() {
    const now = Date.now();
    if (seatCache.users && now - seatCache.at < 60_000) return seatCache.users;
    const groups = asList(await request("/v1/groups"));
    const byId = new Map();
    await Promise.all(groups.map(async (group) => {
        if (!group?.id) return;
        const roles = asList(await request(`/v1/groups/${group.id}/client-roles`));
        if (!roles.some(hasFormsSeat)) return;
        for (const user of asList(await request(`/v1/groups/${group.id}/members`))) {
            if (user?.id) byId.set(user.id, user);
        }
    }));
    seatCache = { at: now, users: [...byId.values()] };
    return seatCache.users;
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
    const users = await formsSeatUsers();
    if (!email) return users;
    return users.filter((user) => matchesQuery(user, email));
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
