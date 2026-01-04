"use client";

import { useMemo } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
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
    <header className={`w-full px-4 py-3 md:px-6`}>
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2">
        <div className="flex items-center gap-3 py-1">
          <img src="/skylab.svg" alt="Skylab Logo" className="h-10 w-10 object-contain p-0.5" />
          <div>
            <p className="text-[18px] font-semibold text-[#e0c8e5] uppercase tracking-[6px] -mt-1">Forms</p>
          </div>
        </div>

        <div className="flex items-center gap-3 py-1">
          {status === "loading" ? null : !isAuthed ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="-mt-1">
              <LoginButton onClick={handleLogin} disabled={status === "loading"} label="Giriş Yap"/>
            </motion.div>
          ) : (
            <>
              <HoverCard user={user}>
                <div className="flex items-center gap-2 rounded-xl bg-transparent border border-transparent hover:border-white/10 hover:bg-white/5 px-2 py-1.5 -mt-1">
                  <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
                    className="text-right block"
                  >
                    <p className="text-[12.5px] font-semibold text-neutral-100">
                      Merhaba, {name}
                    </p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
                    className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-neutral-800 text-xs font-semibold text-neutral-200"
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
    </header>
  );
}