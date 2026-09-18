"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { loginWithKeycloak, logout } from "@/lib/authActions";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import Link from "next/link";
import LoginButton from "./utils/LoginButton";
import HoverCard from "./utils/HoverCard";
import Avatar from "./utils/Avatar";
import { useScrollContainer } from "./landing/utils";

const TOP_THRESHOLD = 40;

function useIsAtTop() {
  const scrollRef = useScrollContainer();
  const [atTop, setAtTop] = useState(true);

  useEffect(() => {
    const node = scrollRef?.current;
    const target = node ?? (typeof window !== "undefined" ? window : null);
    if (!target) return;

    const read = () => {
      const y = node ? node.scrollTop : window.scrollY;
      setAtTop(y <= TOP_THRESHOLD);
    };
    read();

    target.addEventListener("scroll", read, { passive: true });
    return () => target.removeEventListener("scroll", read);
  }, [scrollRef]);

  return atTop;
}

function FormsTag({ show }) {
  return (
    <motion.span initial={false} animate={show ? "show" : "hide"} transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      variants={{
        show: { opacity: 1, x: 0, maxWidth: 120, marginLeft: 4 },
        hide: { opacity: 0, x: -8, maxWidth: 0, marginLeft: 0 },
      }}
      className="inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.2em] uppercase text-neutral-600 overflow-hidden whitespace-nowrap"
    >
      <span aria-hidden>|</span>
      <span>FORMS</span>
    </motion.span>
  );
}

export default function MainHeader() {
  const atTop = useIsAtTop();
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const user = session?.user;
  const name = user?.firstName?.trim().toLocaleLowerCase("tr-TR").replace(/^\p{L}/u, (c) => c.toLocaleUpperCase("tr-TR")) || "Kullanıcı";
  const avatarUrl = user?.profilePictureUrl?.trim() || "";

  const roles = Array.isArray(session?.skyformsRoles) ? session.skyformsRoles : [];
  const isAdmin = roles.includes("skyforms:access");

  const handleLogin = () => {
    const callbackUrl =
      typeof window !== "undefined" ? window.location.href : "/admin";
    loginWithKeycloak(callbackUrl);
  };

  const handleLogout = async () => {
    logout({ callbackUrl: window.location.origin });
  };

  return (
    <motion.header initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-6xl pointer-events-none"
    >
      <div className="pointer-events-auto flex items-center justify-between w-full pl-3 pr-2 py-1.5 rounded-2xl bg-neutral-900/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        <Link href="/" className="flex items-center group">
          <img src="/skylab.svg" alt="Skylab Logo" className="h-7 w-7 object-contain opacity-90 group-hover:opacity-100 transition-opacity"/>
          <span className="text-skylab-500/80 font-bold ml-2.5 -mt-0.5 text-[17px] tracking-wide">SKY LAB</span>
          <FormsTag show={atTop} />
        </Link>

        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="w-24 h-8 rounded-xl bg-white/5 animate-pulse" />
          ) : !isAuthed ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
              <LoginButton onClick={handleLogin} disabled={status === "loading"} label="Giriş Yap" />
            </motion.div>
          ) : isAdmin ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
              <Link href="/admin">
                <LoginButton label="Admin Paneli" hoverIcon="arrow" />
              </Link>
            </motion.div>
          ) : (
            <HoverCard user={user}>
              <div className="flex h-8 items-center gap-2 rounded-lg bg-transparent border border-transparent hover:border-white/10 hover:bg-white/5 px-2 py-1.5">
                <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.6 }}
                  className="text-right hidden min-[400px]:inline"
                >
                  <p className="text-[12.5px] font-semibold text-neutral-100 truncate max-w-[140px]">
                    Merhaba, {name}
                  </p>
                </motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
                  <Avatar name={user?.name} email={user?.email} photoUrl={avatarUrl} size="sm" />
                </motion.div>
                <motion.button type="button" onClick={handleLogout}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
                  className="rounded-lg bg-transparent text-xs py-1 font-semibold text-neutral-400 transition hover:text-skylab-500"
                >
                  <LogOut size={14} />
                </motion.button>
              </div>
            </HoverCard>
          )}
        </div>
      </div>
    </motion.header>
  );
}