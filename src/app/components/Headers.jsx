"use client";

import { useMemo } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";

function getInitial(name, email) {
  const source = (name || email || "").trim();
  return source ? source[0].toUpperCase() : "?";
}

export default function MainHeader() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const user = session?.user;
  const name = user?.firstName?.trim().toLocaleLowerCase("tr-TR").replace(/^\p{L}/u, (c) => c.toLocaleUpperCase("tr-TR")) || "--";
  const email = user?.email?.trim() || "";
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
        <div className="flex items-center gap-4">
          <img src="/skylab.svg" alt="Skylab Logo" className="h-12 w-12 object-contain p-0.5" />
          <div>
            <p className="text-[21px] font-semibold text-[#e0c8e5] uppercase tracking-[6px] -mt-1">Forms</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isAuthed ? (
            <button type="button" onClick={handleLogin} disabled={status === "loading"}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-neutral-100 transition hover:border-white/20 hover:bg-white/10"
            >
              Login
            </button>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-2 py-1.5">
                <button type="button" onClick={handleLogout} className="rounded-lg bg-transparent text-xs p-1 -mr-2 font-semibold text-neutral-400 transition hover:text-indigo-200">
                  <LogOut size={12} style={{ transform: "scaleX(-1)" }} />
                </button>
                <div className="hidden text-right sm:block">
                  <p className="text-xs font-semibold text-neutral-100">
                    Merhaba, {name}
                  </p>
                </div>
                <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-neutral-800 text-xs font-semibold text-neutral-200">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{initial}</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
