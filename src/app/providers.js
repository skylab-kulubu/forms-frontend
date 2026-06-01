"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 1000 * 60 * 5 },
        },
      })
  );

  return (
    // refetchInterval keeps the access token fresh in the background: every poll hits
    // /api/auth/session, which runs the jwt callback in auth.js and rotates the token
    // before it expires. Keep this below the Keycloak access-token lifespan (default 5m).
    <SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus={true}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </SessionProvider>
  );
}