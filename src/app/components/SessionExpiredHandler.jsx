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
const PUBLIC_PAGE = /^\/(?:$|new-home(?:\/|$)|templates\/|responses\/)/;

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
    /^\/admin\/workflows\/[^/]+$/.test(pathname)
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

  const [eventExpired, setEventExpired] = useState(false);
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
  const episodeRef = useRef(false);

  // update's identity changes with the session; keep it in a ref so the re-sync effect
  // below runs once per expiry event instead of once per session change.
  const updateRef = useRef(update);
  useEffect(() => { updateRef.current = update; });

  const sessionError = session?.error === "RefreshAccessTokenError";
  const expired = sessionError || eventExpired;
  const signedIn = Boolean(session?.user);
  const area = areaOf(pathname);

  useEffect(() => {
    const onExpired = () => setEventExpired(true);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  // The event comes from apiClient's standalone getSession(), which does not update the
  // SessionProvider context. Re-sync it so session.error becomes authoritative; if the
  // refresh recovered in the meantime, stand down.
  useEffect(() => {
    if (!eventExpired) return;
    let cancelled = false;
    updateRef.current?.()
      .then((fresh) => {
        if (!cancelled && fresh && !fresh.error) setEventExpired(false);
      })
      .catch(() => { });
    return () => { cancelled = true; };
  }, [eventExpired]);

  useEffect(() => {
    if (expired) return;
    settleRecovery("idle");
    if (!episodeRef.current) return;
    episodeRef.current = false;
    if (signedIn) window.dispatchEvent(new Event(SESSION_RESTORED_EVENT));
  }, [expired, signedIn]);

  useEffect(() => {
    if (!expired || area === "auth" || episodeRef.current) return;
    episodeRef.current = true;
    silentReauth().then(async (ok) => {
      if (!ok) return;
      const fresh = await freshSession(updateRef.current).catch(() => null);
      if (fresh?.user && !fresh.error) setEventExpired(false);
      else settleRecovery("failed");
    });
  }, [expired, area]);

  useEffect(() => {
    if (!expired || recovery !== "failed") return;
    if (area === "public") {
      logout({ redirect: false }).catch(() => { });
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
  }, [expired, recovery, area, autoBlocked]);

  const showBanner = expired && recovery === "failed" && (area === "editor" || (area === "admin" && autoBlocked));

  const handleRelogin = () => {
    const signedInElsewhere = popupReauth();
    if (!signedInElsewhere) {
      loginWithKeycloak(window.location.href);
      return;
    }
    signedInElsewhere.then(async () => {
      const fresh = await freshSession(updateRef.current).catch(() => null);
      if (fresh?.user && !fresh.error) setEventExpired(false);
    });
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
