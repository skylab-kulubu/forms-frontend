import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import { jwtDecode } from "jwt-decode";

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

        if (!response.ok) {
            throw refreshedTokens
        }

        return { ...token, accessToken: refreshedTokens.access_token, expiresAt: Date.now() + refreshedTokens.expires_in * 1000, refreshToken: refreshedTokens.refresh_token ?? token.refreshToken }
    } catch (error) {
        console.log("Token yenileme hatası:", error)
        return {
            ...token,
            error: "RefreshAccessTokenError",
        }
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
                let roles = [];
                try {
                    const decodedToken = jwtDecode(account.access_token);
                    roles = decodedToken.realm_access?.roles || [];
                } catch (error) {
                    console.error("JWT Decode Hatası", error);
                }
                return {
                    accessToken: account.access_token,
                    expiresAt: account.expires_at * 1000,
                    refreshToken: account.refresh_token,
                    roles: roles,
                }
            }

            if (Date.now() < token.expiresAt) return token;

            return await refreshAccessToken(token)
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.roles = token.roles;
            return session;
        },
    },
})