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
            expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
            skyformsRoles: jwtPayload.resource_access?.skyforms?.roles ?? [],
            realmRoles: jwtPayload.realm_access?.roles ?? [],
        }
    } catch (error) {
        return { ...token, accessToken: undefined, refreshToken: undefined, expiresAt: 0, error: "RefreshAccessTokenError" }
    }
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
                    expiresAt: account.expires_at * 1000,
                    refreshToken: account.refresh_token,
                    skyformsRoles: jwtPayload.resource_access?.skyforms?.roles ?? [],
                    realmRoles: jwtPayload.realm_access?.roles ?? [],
                    user: {
                        id: jwtPayload.sub,
                        email: jwtPayload.email,
                        firstName: jwtPayload.given_name,
                        lastName: jwtPayload.family_name,
                        username: jwtPayload.preferred_username,
                        fullName: `${jwtPayload.given_name ?? ''} ${jwtPayload.family_name ?? ''}`.trim(),
                    },
                    error: undefined
                }
            }

            if (Date.now() < token.expiresAt) return token;

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
})