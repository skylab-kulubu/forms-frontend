"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SessionProvider } from "next-auth/react";
import { SkylcnProvider } from "@skylab-kulubu/skylcn-ui";
import SessionExpiredHandler from "@/app/components/SessionExpiredHandler";
import { exposeToTour } from "@/lib/demo/frame";

export default function Providers({ children }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 1000 * 60 * 5 },
        },
      })
  );

  useEffect(() => exposeToTour("query", queryClient), [queryClient]);

  return (
    // refetchInterval keeps the access token fresh in the background: every poll hits
    // /api/auth/session, which runs the jwt callback in auth.js and rotates the token
    // before it expires. Keep this below the Keycloak access-token lifespan (default 5m).
    <SessionProvider refetchInterval={4 * 60} refetchOnWindowFocus={true}>
      <QueryClientProvider client={queryClient}>
        {/* skylcn's links go through next/link and its motion parts animate only under this provider */}
        <SkylcnProvider locale="tr" linkComponent={Link}>
          <SessionExpiredHandler />
          {children}
        </SkylcnProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}