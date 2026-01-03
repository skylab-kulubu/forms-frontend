import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import { jwtDecode } from "jwt-decode";

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
                token.accessToken = account.access_token;
                try {
                    const decodedToken = jwtDecode(account.access_token);
                    token.roles = decodedToken.realm_access?.roles || [];
                } catch (error) {
                    token.roles = [];
                }
            }
            return token;
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken;
            session.roles = token.roles;
            return session;
        },
    },
})