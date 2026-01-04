import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"

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

        return {
            ...token,
            accessToken: refreshedTokens.access_token,
            expiresAt: Date.now() + refreshedTokens.expires_in * 1000,
            refreshToken: refreshedTokens.refresh_token ?? token.refreshToken
        }
    } catch (error) {
        return { ...token, accessToken: undefined, refreshToken: undefined, expiresAt: 0, error: "RefreshAccessTokenError" }
    }
}

async function getUserProfile(accessToken) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;

        const response = await fetch(`${baseUrl}/api/users/me`, {
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            method: "GET",
        });

        if (!response.ok) return null;

        const json = await response.json();

        return json.data;
    } catch (error) {
        return null;
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
                const userProfile = await getUserProfile(account.access_token);

                return {
                    accessToken: account.access_token,
                    expiresAt: account.expires_at * 1000,
                    refreshToken: account.refresh_token,
                    userProfile: userProfile || {},
                    error: undefined
                }
            }

            if (Date.now() < token.expiresAt) return token;

            return await refreshAccessToken(token)
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.error = token.error;

            if (token.userProfile) {
                session.user = {
                    ...session.user,
                    ...token.userProfile,
                    fullName: `${token.userProfile.firstName} ${token.userProfile.lastName}`,
                };
            }
            return session;
        },
    },
})