"use client";

import { useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, LogOut } from "lucide-react";
import { loginWithKeycloak, logout } from "@/lib/authActions";
import HoverCard from "../utils/HoverCard";
import Avatar from "../utils/Avatar";
import { HOME_PATHS, SECTIONS } from "./config";
import { useOpenTrial, useScrollTo } from "./HomeContext";

let lastPage = null;

function displayName(user) {
  return user?.firstName?.trim().toLocaleLowerCase("tr-TR").replace(/(^|[\s-])\p{L}/gu, (c) => c.toLocaleUpperCase("tr-TR")) || "Kullanıcı";
}

function Account({ status, user, isAdmin }) {
  if (status === "loading") return <div className="h-8 w-24 animate-pulse rounded-xl bg-white/5" />;

  if (status !== "authenticated") {
    return (
      <button type="button" className="f-quiet hm-lg" onClick={() => loginWithKeycloak(window.location.href)}>
        Giriş yapın
      </button>
    );
  }

  if (isAdmin) {
    return (
      <Link className="f-quiet" href="/admin">
        Admin paneli
        <ArrowRight size={13} aria-hidden="true" />
      </Link>
    );
  }

  return (
    <HoverCard user={user}>
      <div className="hm-me">
        <p>Merhaba, {displayName(user)}</p>
        <Avatar name={user?.name} email={user?.email} photoUrl={user?.profilePictureUrl?.trim() || ""} size="sm" />
        <button type="button" onClick={() => logout({ callbackUrl: window.location.href })} aria-label="Çıkış yap">
          <LogOut size={14} aria-hidden="true" />
        </button>
      </div>
    </HoverCard>
  );
}

export default function HomeHeader({ page }) {
  const scrollTo = useScrollTo();
  const openTrial = useOpenTrial();
  const { data: session, status } = useSession();
  const [from] = useState(() => lastPage);
  const tabsRef = useRef(null);
  const pillRef = useRef(null);
  const roles = Array.isArray(session?.skyformsRoles) ? session.skyformsRoles : [];
  const isAdmin = status === "authenticated" && roles.includes("skyforms:access");
  const isT = page === "topluluklar";
  const ids = SECTIONS[page];

  useLayoutEffect(() => {
    const tabs = tabsRef.current;
    const pill = pillRef.current;
    if (!tabs || !pill) return;
    const place = (el, animate) => {
      if (!el) return;
      pill.style.transition = animate ? "" : "none";
      pill.style.width = `${el.offsetWidth}px`;
      pill.style.transform = `translateX(${el.offsetLeft}px)`;
    };
    const current = tabs.querySelector('[aria-current="page"]');
    const previous = from && from !== page ? tabs.querySelector(`[data-key="${from}"]`) : null;
    if (previous) {
      place(previous, false);
      pill.getBoundingClientRect();
      place(current, true);
    } else {
      place(current, false);
    }
    lastPage = page;
    let width = tabs.offsetWidth;
    const resize = new ResizeObserver(() => {
      if (tabs.offsetWidth === width) return;
      width = tabs.offsetWidth;
      place(current, false);
    });
    resize.observe(tabs);
    return () => resize.disconnect();
  }, [page, from]);

  const toTop = (e) => {
    e.preventDefault();
    scrollTo(ids.top);
  };

  const toAccess = (e) => {
    e.preventDefault();
    scrollTo(SECTIONS.topluluklar.access);
  };

  return (
    <header className={"f-hdr" + (from === null ? " is-intro" : "")}>
      <div className="f-hdr-in">
        <Link className="f-brand" href={HOME_PATHS.kisiler} onClick={isT ? undefined : toTop} aria-label="SKY LAB Forms">
          <Image src="/skylab.svg" alt="" width={28} height={28} unoptimized />
          <span className="f-brand-a">SKY LAB</span>
          <span className="f-brand-b">Forms</span>
        </Link>
        <nav className="f-hdr-pg" aria-label="Sayfalar" ref={tabsRef}>
          <span className="f-hdr-pill" ref={pillRef} aria-hidden="true" />
          <Link href={HOME_PATHS.kisiler} data-key="kisiler" aria-current={isT ? undefined : "page"} onClick={isT ? undefined : toTop}>
            Başvuranlar için
          </Link>
          <Link href={HOME_PATHS.topluluklar} data-key="topluluklar" aria-current={isT ? "page" : undefined} onClick={isT ? toTop : undefined}>
            Topluluklar için
          </Link>
        </nav>
        <div className="f-hdr-r">
          <Account status={status} user={session?.user} isAdmin={isAdmin} />
          {isT ? (
            !isAdmin && (
              <a className="f-act" href={`#${SECTIONS.topluluklar.access}`} onClick={toAccess}>
                Erişim isteyin
                <ArrowRight size={13} aria-hidden="true" />
              </a>
            )
          ) : (
            <button type="button" className="f-act" onClick={openTrial}>
              Forms&apos;u deneyin
              <ArrowRight size={13} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
