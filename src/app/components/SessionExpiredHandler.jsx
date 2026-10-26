"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { getSession, useSession } from "next-auth/react";
import { AnimatePresence } from "framer-motion";
import { TimerOff } from "lucide-react";
import { loginWithKeycloak, logout } from "@/lib/authActions";
import { SESSION_EXPIRED_EVENT } from "@/lib/apiClient";
import { SESSION_RESTORED_EVENT, popupReauth, settleRecovery, silentReauth, useRecoveryStatus } from "@/lib/session-recovery";
import LoginButton from "./utils/LoginButton";
import NoticeDock from "./utils/NoticeDock";

const AUTO_RELOGIN_KEY = "sessionAutoReloginAt";
const AUTO_RELOGIN_COOLDOWN_MS = 2 * 60 * 1000;
const PUBLIC_PAGE = /^\/(?:$|topluluklar(?:\/|$)|templates\/|responses\/)/;

// Pages where a hard redirect could throw away unsaved user input; these get the banner
// instead of the automatic bounce through Keycloak.
function hasUnsavedInputRisk(pathname) {
  return (
    pathname === "/admin/forms/new-form" ||
    pathname === "/admin/templates/new-template" ||
    pathname === "/admin/workflows/new-workflow" ||
    /^\/admin\/forms\/[^/]+\/edit$/.test(pathname) ||
    /^\/admin\/forms\/[^/]+\/responses\/[^/]+$/.test(pathname) ||
    /^\/admin\/templates\/[^/]+$/.test(pathname) ||
    /^\/admin\/workflows\/[^/]+\/edit$/.test(pathname)
  );
}

function areaOf(pathname) {
  if (!pathname) return "form";
  if (pathname.startsWith("/auth")) return "auth";
  if (pathname.startsWith("/admin")) return hasUnsavedInputRisk(pathname) ? "editor" : "admin";
  if (PUBLIC_PAGE.test(pathname)) return "public";
  // Everything else at the root segment is (or may be) the public form-fill page (/[id]);
  // unknown pages also land here so a misclassification degrades to the safe option.
  return "form";
}

async function freshSession(update) {
  return (await update?.()) ?? (await getSession());
}

export default function SessionExpiredHandler() {
  const { data: session, update } = useSession();
  const pathname = usePathname();
  const recovery = useRecoveryStatus();

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
  const wasExpiredRef = useRef(false);
  const silentTriedRef = useRef(false);

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
  const signedIn = Boolean(session?.user);
  const area = areaOf(pathname);
  const loginNeeded = (sessionError && recovery === "failed") || eventExpired;

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

  useEffect(() => {
    if (expired) {
      wasExpiredRef.current = true;
      return;
    }
    settleRecovery("idle");
    if (!wasExpiredRef.current) return;
    wasExpiredRef.current = false;
    if (signedIn) window.dispatchEvent(new Event(SESSION_RESTORED_EVENT));
  }, [expired, signedIn]);

  useEffect(() => {
    if (!sessionError) {
      silentTriedRef.current = false;
      return;
    }
    if (area === "auth" || silentTriedRef.current) return;
    silentTriedRef.current = true;
    silentReauth().then(async (ok) => {
      if (!ok) return;
      const fresh = await freshSession(updateRef.current).catch(() => null);
      if (!fresh?.user || fresh.error) settleRecovery("failed");
    });
  }, [sessionError, area]);

  useEffect(() => {
    if (!loginNeeded) return;
    if (area === "public") {
      if (sessionError) logout({ redirect: false }).catch(() => { });
      return;
    }
    if (area !== "admin" || autoBlocked || redirectingRef.current) return;
    redirectingRef.current = true;
    try { sessionStorage.setItem(AUTO_RELOGIN_KEY, String(Date.now())); } catch { }
    loginWithKeycloak(window.location.href).catch(() => {
      // The redirect never left the page; surface the banner as a manual fallback.
      redirectingRef.current = false;
      setAutoBlocked(true);
    });
  }, [loginNeeded, sessionError, area, autoBlocked]);

  const showBanner = loginNeeded && (area === "editor" || (area === "admin" && autoBlocked));

  const handleRelogin = () => {
    const signedInElsewhere = popupReauth();
    if (!signedInElsewhere) {
      loginWithKeycloak(window.location.href);
      return;
    }
    signedInElsewhere.then(() => freshSession(updateRef.current)).catch(() => { });
  };

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
