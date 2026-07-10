"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import { TimerOff } from "lucide-react";
import { loginWithKeycloak } from "@/lib/authActions";
import { SESSION_EXPIRED_EVENT } from "@/lib/apiClient";
import LoginButton from "./utils/LoginButton";

const AUTO_RELOGIN_KEY = "sessionAutoReloginAt";
const AUTO_RELOGIN_COOLDOWN_MS = 2 * 60 * 1000;

// Pages where a hard redirect could throw away unsaved user input; these get the banner
// instead of the automatic bounce through Keycloak.
function hasUnsavedInputRisk(pathname) {
  if (!pathname) return true;
  if (pathname.startsWith("/admin")) {
    return (
      pathname === "/admin/forms/new-form" ||
      pathname === "/admin/component-groups/new-group" ||
      /^\/admin\/forms\/[^/]+\/edit$/.test(pathname) ||
      /^\/admin\/component-groups\/[^/]+$/.test(pathname)
    );
  }
  if (pathname === "/") return false;
  if (pathname.startsWith("/responses") || pathname.startsWith("/component-groups")) return false;
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
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
        >
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-xl border border-white/10 bg-neutral-900/90 px-4 py-3 shadow-lg backdrop-blur">
            <div className="flex items-center gap-2 text-xs text-neutral-200">
              <TimerOff size={14} className="text-skylab-300" />
              <span>Oturumunuzun süresi doldu. Kaldığınız yerden devam etmek için yeniden giriş yapın.</span>
            </div>
            <LoginButton onClick={handleRelogin} label="Yeniden giriş yap" hoverIcon="arrow" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
