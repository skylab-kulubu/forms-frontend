"use client";

import { Suspense, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import SkylabLoader from "@/app/components/SkylabLoader";
import { loginWithKeycloak, getPostLoginRedirect } from "@/lib/authActions";

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
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    (async () => {
      // Full cleanup first: drop the (possibly broken) session cookie and end the
      // Keycloak session, so recovery always starts from a clean slate. signOut leaves
      // sessionStorage untouched, so the stashed destination below still survives.
      try { await signOut({ redirect: false }); } catch { }

      let lastRetry = 0;
      try { lastRetry = Number(sessionStorage.getItem(RETRY_GUARD_KEY)) || 0; } catch { }
      const looping = Date.now() - lastRetry < RETRY_GUARD_MS;

      if (!NON_RECOVERABLE.has(error) && !looping) {
        // Recoverable error → restart the Keycloak sign-in flow, returning the user to
        // wherever they were headed before the failed callback (falls back to /admin).
        // A fresh flow gets new state/PKCE cookies, so the bare NextAuth error page is
        // never shown.
        const target = searchParams?.get("callbackUrl") || getPostLoginRedirect() || "/admin";
        try { sessionStorage.setItem(RETRY_GUARD_KEY, String(Date.now())); } catch { }
        loginWithKeycloak(target);
        return;
      }

      // Non-recoverable, or we already bounced through a retry → give up silently and
      // send the user to the home page instead of showing an error screen.
      try { sessionStorage.removeItem(RETRY_GUARD_KEY); } catch { }
      router.replace("/");
    })();
  }, [error, searchParams, router]);

  return <Loader />;
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<Loader />}>
      <AuthErrorLogic />
    </Suspense>
  );
}
