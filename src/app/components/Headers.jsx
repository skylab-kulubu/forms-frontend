"use client";

import { useMemo } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { LogOut, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import LoginButton from "./utils/LoginButton";
import HoverCard from "./utils/HoverCard";

function getInitial(name, email) {
  const source = (name || email || "").trim();
  return source ? source[0].toUpperCase() : "?";
}

export default function MainHeader() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const user = session?.user;
  const name = user?.firstName?.trim().toLocaleLowerCase("tr-TR").replace(/^\p{L}/u, (c) => c.toLocaleUpperCase("tr-TR")) || "Kullanıcı";
  const avatarUrl = user?.profilePictureUrl?.trim() || "";

  const initial = useMemo(() => getInitial(user?.name, user?.email), [user]);

  const roles = Array.isArray(user?.roles) ? user.roles : [];
  const isAdmin = roles.some(role => role.toLowerCase() === "admin");

  const handleLogin = () => {
    const callbackUrl =
      typeof window !== "undefined" ? window.location.href : "/admin";
    signIn("keycloak", { callbackUrl });
  };

  const handleLogout = async () => {
    const logoutRedirectUrl = `${process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER}/protocol/openid-connect/logout?post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
    signOut({ callbackUrl: logoutRedirectUrl });
  };

  return (
    <motion.header initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 left-[calc(50%-5px)] -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center justify-between w-full px-5 py-2 rounded-2xl bg-neutral-900/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <div className="flex items-center gap-3.5">
          <img src="/skylab.svg" alt="Skylab Logo" className="h-9 w-9 object-contain" />
          <p className="text-lg font-sans text-skylab-500 tracking-[3px] -ml-1">
            FORMS
          </p>
        </div>

        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="w-24 h-10 rounded-xl bg-white/5 animate-pulse" />
          ) : !isAuthed ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
              <LoginButton onClick={handleLogin} disabled={status === "loading"} label="Giriş Yap" />
            </motion.div>
          ) : (
            <>
              {isAdmin && (
                <Link href="/admin">
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} title="Admin Paneli"
                    className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 text-neutral-400 p-2.25 sm:px-2.5 sm:py-1.5 text-[11px] font-medium hover:bg-white/10 hover:text-neutral-200 transition-colors"
                  >
                    <LayoutDashboard size={13} />
                    <span className="hidden sm:inline">Admin</span>
                  </motion.div>
                </Link>
              )}
              <HoverCard user={user}>
                <div className="flex items-center gap-2 rounded-xl bg-transparent border border-transparent hover:border-white/10 hover:bg-white/5 px-2 py-1.5">
                  <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-right hidden min-[400px]:inline"
                  >
                    <p className="text-[12.5px] font-semibold text-neutral-100 truncate max-w-[140px]">
                      Merhaba, {name}
                    </p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
                    className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-neutral-800 text-xs font-semibold text-neutral-200"
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      <span>{initial}</span>
                    )}
                  </motion.div>
                  <motion.button type="button" onClick={handleLogout} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
                    className="rounded-lg bg-transparent text-xs py-1 font-semibold text-neutral-400 transition hover:text-pink-200"
                  >
                    <LogOut size={14} />
                  </motion.button>
                </div>
              </HoverCard>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}