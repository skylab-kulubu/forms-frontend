"use client";

import { useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HOME_PATHS, SECTIONS } from "./config";
import { useScrollTo } from "./HomeContext";

const MAIL = "mailto:info@yildizskylab.com?subject=Skylab%20Forms";
const REPORT = "mailto:info@yildizskylab.com?subject=Skylab%20Forms%20-%20Sorun%20Bildirimi";
const LEGAL = "https://skyl.app/kvkk-metni";
const subscribe = () => () => {};
const currentYear = () => String(new Date().getFullYear());
const builtYear = () => "2026";

export default function HomeFooter({ page }) {
  const scrollTo = useScrollTo();
  const isT = page === "topluluklar";
  const ids = SECTIONS[page];
  const year = useSyncExternalStore(subscribe, currentYear, builtYear);

  const toTop = (e) => {
    e.preventDefault();
    scrollTo(ids.top);
  };

  return (
    <footer className="sf">
      <div className="sf-in">
        <div className="sf-top">
          <div className="sf-id">
            <Link className="f-brand" href={HOME_PATHS.kisiler} onClick={isT ? undefined : toTop} aria-label={isT ? "SKY LAB Forms, ana sayfa" : "SKY LAB Forms, sayfanın başına dönün"}>
              <Image src="/skylab.svg" alt="" width={22} height={22} unoptimized />
              <span className="f-brand-a">SKY LAB</span>
              <span className="f-brand-b">Forms</span>
            </Link>
            <span className="sf-by">by WEBLAB</span>
          </div>
          <nav className="sf-nav" aria-label="Alt bağlantılar">
            <Link href={HOME_PATHS.kisiler} aria-current={isT ? undefined : "page"} onClick={isT ? undefined : toTop}>
              Başvuranlar için
            </Link>
            <Link href={HOME_PATHS.topluluklar} aria-current={isT ? "page" : undefined} onClick={isT ? toTop : undefined}>
              Topluluklar için
            </Link>
            <a href={MAIL}>Bize yazın</a>
            <a href={REPORT}>Sorun bildir</a>
            <a href="https://yildizskylab.com" target="_blank" rel="noopener noreferrer">
              yildizskylab.com
              <ArrowUpRight size={12} aria-hidden="true" />
            </a>
          </nav>
        </div>
        <div className="sf-legal">
          <span>© {year} SKY LAB</span>
          <a href={LEGAL} target="_blank" rel="noopener noreferrer">KVKK aydınlatma metni</a>
          <a className="sf-dev" href="https://github.com/fatiihnaz" target="_blank" rel="noopener noreferrer">Developed by Fatih Naz</a>
        </div>
      </div>
    </footer>
  );
}
