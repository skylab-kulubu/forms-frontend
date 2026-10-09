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
const FORM_PAGE = /^\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$/i;

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

  // update's identity changes with the session; keep it in a ref so the re-sync effect
  // below runs once per expiry event instead of once per session change.
  const updateRef = useRef(update);
  useEffect(() => { updateRef.current = update; });

  const sessionError = session?.error === "RefreshAccessTokenError";
  const expired = sessionError || eventExpired;
  const onAuthPage = pathname?.startsWith("/auth") ?? false;
  const onFormPage = FORM_PAGE.test(pathname ?? "");

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

  // The signin page already redirects to Keycloak on its own, so stand down there.
  const showBanner = expired && !onAuthPage && !onFormPage && (hasUnsavedInputRisk(pathname) || autoBlocked);

  useEffect(() => {
    if (!expired || onAuthPage || onFormPage || autoBlocked || hasUnsavedInputRisk(pathname)) return;
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    try { sessionStorage.setItem(AUTO_RELOGIN_KEY, String(Date.now())); } catch { }
    loginWithKeycloak(window.location.href).catch(() => {
      // The redirect never left the page; surface the banner as a manual fallback.
      redirectingRef.current = false;
      setAutoBlocked(true);
    });
  }, [expired, onAuthPage, onFormPage, autoBlocked, pathname]);

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
