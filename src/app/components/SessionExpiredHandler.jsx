"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import { TimerOff } from "lucide-react";
import { loginWithKeycloak } from "@/lib/authActions";
import { SESSION_EXPIRED_EVENT } from "@/lib/apiClient";
import LoginButton from "./utils/LoginButton";
import NoticeDock from "./utils/NoticeDock";

const AUTO_RELOGIN_KEY = "sessionAutoReloginAt";
const AUTO_RELOGIN_COOLDOWN_MS = 2 * 60 * 1000;

// Pages where a hard redirect could throw away unsaved user input; these get the banner
// instead of the automatic bounce through Keycloak.
function hasUnsavedInputRisk(pathname) {
  if (!pathname) return true;
  if (pathname.startsWith("/admin")) {
    return (
      pathname === "/admin/forms/new-form" ||
      pathname === "/admin/templates/new-template" ||
      /^\/admin\/forms\/[^/]+\/edit$/.test(pathname) ||
      /^\/admin\/templates\/[^/]+$/.test(pathname)
    );
  }
  if (pathname === "/") return false;
  if (pathname.startsWith("/responses") || pathname.startsWith("/templates")) return false;
  // Everything else at the root segment is (or may be) the public form-fill page (/[id]);
  // unknown pages also land here so a misclassification degrades to the safe option.
  return true;
}

// Watches for a dead session (RefreshAccessTokenError on the session, or the apiClient
// announcing an unrecoverable 401) and recovers it: on read-only pages by bouncing through
// Keycloak (invisible while the SSO session is alive), on input-heavy pages via a banner.
export default function SessionExpiredHandler() {
  const { data: session, update } = useSession();
  const pathname = usePathname();

  // The access token the API refused (from the apiClient event). "Recovered" means a
  // different token showed up, not merely a session object without an error flag: the
  // session keeps handing out the same token until it expires, and that token is dead.
  const [rejectedToken, setRejectedToken] = useState(null);
  // The rejected token we already re-synced the SessionProvider for, so one dead token
  // triggers one update() and not one per rejected request.
  const resyncedTokenRef = useRef(null);
  // Loop guard: if this page load itself came from an auto re-login that still yielded a
  // broken session, don't bounce again; fall through to the banner.
  const [autoBlocked, setAutoBlocked] = useState(() => {
    try {
      return Date.now() - (Number(sessionStorage.getItem(AUTO_RELOGIN_KEY)) || 0) < AUTO_RELOGIN_COOLDOWN_MS;
    } catch {
      return false;
    }
  });
  const redirectingRef = useRef(false);

  // update's identity changes with the session; keep it in a ref so the re-sync effect
  // below runs once per rejected token instead of once per session change.
  const updateRef = useRef(update);
  useEffect(() => { updateRef.current = update; });

  const sessionToken = session?.accessToken ?? null;
  const sessionTokenRef = useRef(sessionToken);
  useEffect(() => { sessionTokenRef.current = sessionToken; });

  const sessionError = session?.error === "RefreshAccessTokenError";
  // Stand down only when a token other than the rejected one is in the session (a refresh
  // rotated it, or the user signed in again). The same token coming back means nothing
  // changed, so the banner stays and no request is retried on its account.
  const recovered = rejectedToken !== null && sessionToken !== null && sessionToken !== rejectedToken;
  const eventExpired = rejectedToken !== null && !recovered;
  const expired = sessionError || eventExpired;
  const onAuthPage = pathname?.startsWith("/auth") ?? false;

  useEffect(() => {
    const onExpired = (event) => {
      // Fall back to the token the context holds right now: that is the one the API saw.
      setRejectedToken(event?.detail?.token ?? sessionTokenRef.current ?? "unknown");
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // The event comes from apiClient's standalone getSession(), which does not update the
  // SessionProvider context. Re-sync it once per rejected token so session.error becomes
  // authoritative. update() flips useSession() through "loading", which re-enables
  // session-gated queries and gets them rejected again; doing it once per token keeps
  // that from turning into a request loop.
  useEffect(() => {
    if (rejectedToken === null || resyncedTokenRef.current === rejectedToken) return;
    resyncedTokenRef.current = rejectedToken;
    updateRef.current?.()?.catch?.(() => { });
  }, [rejectedToken]);

  // The signin page already redirects to Keycloak on its own, so stand down there.
  const showBanner = expired && !onAuthPage && (hasUnsavedInputRisk(pathname) || autoBlocked);

  useEffect(() => {
    if (!expired || onAuthPage || autoBlocked || hasUnsavedInputRisk(pathname)) return;
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    try { sessionStorage.setItem(AUTO_RELOGIN_KEY, String(Date.now())); } catch { }
    loginWithKeycloak(window.location.href).catch(() => {
      // The redirect never left the page; surface the banner as a manual fallback.
      redirectingRef.current = false;
      setAutoBlocked(true);
    });
  }, [expired, onAuthPage, autoBlocked, pathname]);

  const handleRelogin = () => loginWithKeycloak(window.location.href);

  return (
    <AnimatePresence>
      {showBanner && (
        <NoticeDock icon={TimerOff} role="alert" action={<LoginButton onClick={handleRelogin} label="Yeniden giriş yap" hoverIcon="arrow" className="shrink-0" />}>
          Oturumunuzun süresi doldu. Kaldığınız yerden devam etmek için yeniden giriş yapın.
        </NoticeDock>
      )}
    </AnimatePresence>
  );
}
