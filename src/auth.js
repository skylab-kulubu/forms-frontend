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

const EXPIRY_BUFFER_MS = 60 * 1000;

async function refreshAccessToken(token) {
    try {
        const response = await fetch(`${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: process.env.KEYCLOAK_CLIENT_ID,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: token.refreshToken,
            }),
            method: "POST",
        })

        const refreshedTokens = await response.json()

        if (!response.ok) { throw refreshedTokens; }

        const jwtPayload = decodeJwtPayload(refreshedTokens.access_token);

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            idToken: refreshedTokens.id_token ?? token.idToken,
            expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            skyformsRoles: jwtPayload.resource_access?.dotnet?.roles ?? token.skyformsRoles ?? [],
            realmRoles: jwtPayload.realm_access?.roles ?? token.realmRoles ?? [],
            error: undefined,
        }
    } catch (error) {
        return { ...token, error: "RefreshAccessTokenError" }
    }
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
    callbacks: {
        async jwt({ token, account }) {
            if (account) {
                const jwtPayload = decodeJwtPayload(account.access_token);

                return {
                    accessToken: account.access_token,
                    idToken: account.id_token,
                    expiresAt: account.expires_at ? account.expires_at * 1000 : Date.now() + (account.expires_in ?? 300) * 1000,
                    refreshToken: account.refresh_token,
                    skyformsRoles: jwtPayload.resource_access?.dotnet?.roles ?? [],
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
            await endKeycloakSession(token?.idToken);
        },
    },
})