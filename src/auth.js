import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"

function decodeJwtPayload(accessToken) {
    try {
        const payload = accessToken.split('.')[1];
        return JSON.parse(Buffer.from(payload, 'base64url').toString());
    } catch {
        return {};
    }
}

function skyformsRolesFrom(jwtPayload) {
    return jwtPayload.resource_access?.forms?.roles ?? [];
}

function refreshExpiryOf(refreshToken) {
    const exp = decodeJwtPayload(refreshToken ?? "").exp;
    return exp ? exp * 1000 : undefined;
}

const EXPIRY_BUFFER_MS = 60 * 1000;
const REFRESH_REUSE_MS = 60 * 1000;
const TRANSIENT_RETRY_MS = 10 * 1000;
const REFRESH_TIMEOUT_MS = 10 * 1000;

const refreshes = globalThis.__skyformsRefreshes ??= new Map();

async function requestRefresh(refreshToken) {
    try {
        const response = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
            method: "POST",
            cache: "no-store",
            signal: AbortSignal.timeout(REFRESH_TIMEOUT_MS),
        })

        const body = await response.json().catch(() => ({}))

        if (response.ok) return { ok: true, tokens: body }
        return { ok: false, dead: response.status === 400 || response.status === 401, status: response.status, reason: body.error, description: body.error_description }
    } catch (error) {
        return { ok: false, dead: false, reason: error.name, description: error.message }
    }
}

function refreshOnce(refreshToken) {
    const now = Date.now();
    for (const [key, entry] of refreshes) {
        if (entry.until < now) refreshes.delete(key);
    }

    const existing = refreshes.get(refreshToken);
    if (existing) return existing.promise;

    const entry = { until: Number.POSITIVE_INFINITY };
    entry.promise = requestRefresh(refreshToken).then((result) => {
        entry.until = Date.now() + (result.ok || result.dead ? REFRESH_REUSE_MS : TRANSIENT_RETRY_MS);
        return result;
    });
    refreshes.set(refreshToken, entry);
    return entry.promise;
}

function withRefreshedTokens(token, tokens) {
    const jwtPayload = decodeJwtPayload(tokens.access_token);
    const skyformsRoles = skyformsRolesFrom(jwtPayload);
    const refreshToken = tokens.refresh_token ?? token.refreshToken;

    return {
        ...token,
        accessToken: tokens.access_token,
        idToken: tokens.id_token ?? token.idToken,
        expiresAt: Date.now() + tokens.expires_in * 1000,
        refreshToken,
        refreshExpiresAt: refreshExpiryOf(refreshToken),
        skyformsRoles: skyformsRoles.length ? skyformsRoles : (token.skyformsRoles ?? []),
        realmRoles: jwtPayload.realm_access?.roles ?? token.realmRoles ?? [],
        error: undefined,
    }
}

function expired(token, reason) {
    console.warn(`[auth] session ended: ${reason}`);
    return { ...token, error: "RefreshAccessTokenError" }
}

async function refreshAccessToken(token) {
    if (!token.refreshToken) return expired(token, "no refresh token");
    if (token.refreshExpiresAt && Date.now() >= token.refreshExpiresAt) return expired(token, "refresh token expired");

    const result = await refreshOnce(token.refreshToken);
    if (result.ok) return withRefreshedTokens(token, result.tokens);

    const reason = [result.status, result.reason, result.description].filter(Boolean).join(" ");
    if (result.dead) return expired(token, `Keycloak refused the refresh (${reason})`);

    console.warn(`[auth] token refresh failed, will retry: ${reason}`);
    return token
}

async function endKeycloakSession(idToken) {
    if (!idToken) return;
    try {
        await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/logout?${new URLSearchParams({ id_token_hint: idToken })}`)
    } catch (error) { }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Keycloak({
            clientId: process.env.KEYCLOAK_CLIENT_ID,
            clientSecret: process.env.KEYCLOAK_CLIENT_SECRET,
            issuer: process.env.KEYCLOAK_ISSUER,
        }),
    ],
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                const jwtPayload = decodeJwtPayload(account.access_token);

                return {
                    accessToken: account.access_token,
                    idToken: account.id_token,
                    expiresAt: account.expires_at ? account.expires_at * 1000 : Date.now() + (account.expires_in ?? 300) * 1000,
                    refreshToken: account.refresh_token,
                    refreshExpiresAt: refreshExpiryOf(account.refresh_token),
                    skyformsRoles: skyformsRolesFrom(jwtPayload),
                    realmRoles: jwtPayload.realm_access?.roles ?? [],
                    user: {
                        id: jwtPayload.sub,
                        email: jwtPayload.email,
                        firstName: jwtPayload.given_name,
                        lastName: jwtPayload.family_name,
                        username: jwtPayload.preferred_username,
                        fullName: `${jwtPayload.given_name ?? ''} ${jwtPayload.family_name ?? ''}`.trim(),
                        university: jwtPayload.university,
                        department: jwtPayload.department
                    },
                    error: undefined
                }
            }

            if (token.error) return token;
            if (Date.now() < token.expiresAt - EXPIRY_BUFFER_MS) return token;
            if (process.env.NEXT_RUNTIME === "edge") return token;

            return await refreshAccessToken(token)
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.error = token.error;
            session.skyformsRoles = token.skyformsRoles;
            session.realmRoles = token.realmRoles;

            if (token.user) {
                session.user = {
                    ...session.user,
                    ...token.user,
                };
            }

            return session;
        },
    },
    events: {
        async signOut(message) {
            const token = "token" in message ? message.token : null;
            if (token?.error) return;
            await endKeycloakSession(token?.idToken);
        },
    },
})
