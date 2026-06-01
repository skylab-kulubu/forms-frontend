"use client";

import { Suspense, useEffect, useRef } from "react";
import { signIn, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import SkylabLoader from "@/app/components/SkylabLoader";

// Errors where retrying the login would just loop — send the user home after cleanup.
const NON_RECOVERABLE = new Set(["AccessDenied", "Configuration"]);

// Only auto-retry once within this window, so a genuinely failing flow can't loop.
const RETRY_GUARD_KEY = "authErrorRetryAt";
const RETRY_GUARD_MS = 20 * 1000;

function Loader() {
  return (
    <div className="grid h-dvh place-items-center">
      <SkylabLoader size={64} color="#525252" />
    </div>
  );
}

function AuthErrorLogic() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams?.get("error") ?? "Default";
  const callbackUrl = searchParams?.get("callbackUrl") || "/admin";
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      // Full cleanup first: drop the (possibly broken) session cookie and end the
      // Keycloak session, so recovery always starts from a clean slate.
      try { await signOut({ redirect: false }); } catch { }

      let lastRetry = 0;
      try { lastRetry = Number(sessionStorage.getItem(RETRY_GUARD_KEY)) || 0; } catch { }
      const looping = Date.now() - lastRetry < RETRY_GUARD_MS;

      if (!NON_RECOVERABLE.has(error) && !looping) {
        // Recoverable error → restart the Keycloak sign-in flow. A fresh flow gets new
        // state/PKCE cookies, so the user never sees the bare NextAuth error page.
        try { sessionStorage.setItem(RETRY_GUARD_KEY, String(Date.now())); } catch { }
        signIn("keycloak", { callbackUrl });
        return;
      }

      // Non-recoverable, or we already bounced through a retry → give up silently and
      // send the user to the home page instead of showing an error screen.
      try { sessionStorage.removeItem(RETRY_GUARD_KEY); } catch { }
      router.replace("/");
    })();
  }, [error, callbackUrl, router]);

  return <Loader />;
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<Loader />}>
      <AuthErrorLogic />
    </Suspense>
  );
}
