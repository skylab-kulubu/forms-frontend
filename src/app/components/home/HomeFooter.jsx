"use client";

import { useRef, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { HOME_PATHS, SECTIONS } from "./config";
import { useOpenTrial, useScrollTo } from "./HomeContext";
import { useInView } from "./useInView";

const MAIL = "mailto:info@yildizskylab.com?subject=Skylab%20Forms";
const REPORT = "mailto:info@yildizskylab.com?subject=Skylab%20Forms%20-%20Sorun%20Bildirimi";
const LEGAL = "https://skyl.app/kvkk-metni";
const subscribe = () => () => {};
const currentYear = () => String(new Date().getFullYear());
const builtYear = () => "2026";
const onClient = () => true;
const onServer = () => false;

export default function HomeFooter({ page }) {
  const scrollTo = useScrollTo();
  const openTrial = useOpenTrial();
  const rootRef = useRef(null);
  const shown = useInView(rootRef, { once: true, threshold: 0.2 });
  const ready = useSyncExternalStore(subscribe, onClient, onServer);
  const isT = page === "topluluklar";
  const ids = SECTIONS[page];
  const year = useSyncExternalStore(subscribe, currentYear, builtYear);

  const jump = (id) => (e) => {
    e.preventDefault();
    scrollTo(id);
  };

  return (
    <footer ref={rootRef} className={"sf" + (ready ? " is-armed" : "") + (shown ? " is-in" : "")} data-page="">
      <span className="sf-glow" aria-hidden="true" />
      <div className="sf-hz" aria-hidden="true">
        <i />
        <Image src="/skylab.svg" alt="" width={30} height={30} unoptimized />
        <i />
      </div>
      <div className="sf-in">
        <div className="sf-top">
          <div className="sf-rv">
            <div className="sf-brand-row">
              <Link className="f-brand" href={HOME_PATHS.kisiler} onClick={isT ? undefined : jump(ids.top)} aria-label={isT ? "SKY LAB Forms, ana sayfa" : "SKY LAB Forms, sayfanın başına dönün"}>
                <Image src="/skylab.svg" alt="" width={28} height={28} unoptimized />
                <span className="f-brand-a">SKY LAB</span>
                <span className="f-brand-b">Forms</span>
              </Link>
              <span className="sf-by">by WEBLAB</span>
            </div>
            <p className="sf-desc">Yıldız Teknik Üniversitesi SKY LAB Web Arge Ekibi tarafından geliştirilen form ve başvuru altyapısı.</p>
          </div>
          <div className="sf-cols">
            <nav className="sf-col sf-rv" aria-label="Forms" style={{ "--d": ".06s" }}>
              <p className="sf-h">Forms</p>
              <ul className="sf-list">
                <li>
                  {isT ? (
                    <Link className="sf-a" href={HOME_PATHS.kisiler}>Başvuranlar için</Link>
                  ) : (
                    <a className="sf-a" href={`#${ids.top}`} onClick={jump(ids.top)} aria-current="page">Başvuranlar için</a>
                  )}
                </li>
                <li>
                  {isT ? (
                    <a className="sf-a" href={`#${ids.top}`} onClick={jump(ids.top)} aria-current="page">Topluluklar için</a>
                  ) : (
                    <Link className="sf-a" href={HOME_PATHS.topluluklar}>Topluluklar için</Link>
                  )}
                </li>
                <li>
                  {isT ? (
                    <a className="sf-a" href={`#${ids.access}`} onClick={jump(ids.access)}>Erişim isteyin</a>
                  ) : (
                    <button type="button" className="sf-a" onClick={openTrial}>Forms&apos;u deneyin</button>
                  )}
                </li>
              </ul>
            </nav>
            <nav className="sf-col sf-rv" aria-label="Destek" style={{ "--d": ".12s" }}>
              <p className="sf-h">Destek</p>
              <ul className="sf-list">
                <li><a className="sf-a" href={MAIL}>Bize yazın</a></li>
                <li><a className="sf-a" href={REPORT}>Sorun bildir</a></li>
              </ul>
            </nav>
            <div className="sf-col is-lab sf-rv" style={{ "--d": ".18s" }}>
              <p className="sf-h">SKY LAB</p>
              <ul className="sf-list">
                <li>
                  <a className="sf-a" href="https://yildizskylab.com" target="_blank" rel="noopener noreferrer">
                    yildizskylab.com
                    <ArrowUpRight size={12} aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <address className="sf-addr">
                    Yıldız Teknik Üniversitesi
                    <br />
                    Davutpaşa Kampüsü
                    <br />
                    Kulüpler Vadisi
                  </address>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="sf-bar sf-rv" style={{ "--d": ".26s" }}>
          <span>© {year} SKY LAB</span>
          <a href={LEGAL} target="_blank" rel="noopener noreferrer">KVKK aydınlatma metni</a>
          <a className="sf-dev" href="https://github.com/fatiihnaz" target="_blank" rel="noopener noreferrer">Developed by Fatih Naz</a>
        </div>
      </div>
    </footer>
  );
}
