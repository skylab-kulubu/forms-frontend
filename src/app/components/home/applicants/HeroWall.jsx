"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, X } from "lucide-react";
import { shortOrigin } from "@/lib/short-url";
import Poster from "../poster/Poster";
import { posterQr } from "../poster/posterQr";
import HomeForm from "../HomeForm";
import { HOME_FORMS, HOME_PATHS, SECTIONS, TRIAL_ALIAS } from "../config";
import { useHome, useScrollTo } from "../HomeContext";
import { useMedia } from "../useInView";
import "./hero-wall.css";

const WIDE = "(min-width: 1024px)";
const REDUCE = "(prefers-reduced-motion: reduce)";
const SCAN_MS = 560;
const FOCUS_MS = 90;
const SHORT_PREFIX = `${shortOrigin().replace(/^https?:\/\//i, "")}/`;
const TRIAL_QR = posterQr(TRIAL_ALIAS);

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, iframe, [tabindex]:not([tabindex="-1"])';

function focusedElement() {
  const el = document.activeElement;
  return el && el !== document.body ? el : null;
}

const WALL = [
  { id: "ekip", kind: "rings", x: 33.4, y: 5.6, w: 17.6, rot: -2.2, zi: 3, col: 0, row: 0 },
  { id: "hack", kind: "grid", x: 53, y: 3.6, w: 15.6, rot: 1.6, zi: 2, col: 1, row: 0 },
  { id: "yz", kind: "paper", x: 70.2, y: 8.6, w: 14.2, rot: -1.2, zi: 2, col: 2, row: 0 },
  { id: "robo", kind: "bold", x: 85.6, y: 3.2, w: 13.2, rot: 2.2, zi: 1, col: 3, row: 0 },
  { id: "trial", kind: "trial", x: 35.2, y: 52.5, w: 18.4, rot: 1.2, zi: 4, col: 0, row: 1, trial: true },
  { id: "tanis", kind: "circles", x: 56, y: 53.5, w: 14.4, rot: -2, zi: 3, col: 1, row: 1 },
  { id: "web", kind: "web", x: 71.6, y: 51, w: 13.8, rot: 1.8, zi: 2, col: 2, row: 1 },
  { id: "mobil", kind: "phone", x: 86.3, y: 55.5, w: 12.6, rot: -1.6, zi: 1, col: 3, row: 1 },
].map((item, i) => ({
  ...item,
  style: {
    left: `${item.x}%`,
    top: `${item.y}%`,
    width: `${item.w}%`,
    "--rot": `${item.rot}deg`,
    "--zi": String(item.zi),
    "--fd": `${(6 + (i % 3) * 1.4).toFixed(1)}s`,
    "--fdl": `-${(i * 1.1).toFixed(1)}s`,
    "--ind": `${(0.2 + item.col * 0.07 + item.row * 0.12).toFixed(2)}s`,
  },
}));

function PhoneForm({ formId, onEscape }) {
  if (!formId) return <div className="a2-try-off">Form henüz bağlanmadı.</div>;

  const prepare = (e) => {
    try {
      const win = e.currentTarget.contentWindow;
      const style = win.document.createElement("style");
      style.textContent = "*{scrollbar-width:none!important}";
      win.document.head.appendChild(style);
      win.addEventListener("keydown", (ev) => {
        if (ev.key === "Escape" && !ev.defaultPrevented) onEscape();
      });
    } catch { }
  };

  return <iframe className="a2-try-frame" src={`/${formId}`} title="Deneme formu" onLoad={prepare} />;
}

export default function HeroWall() {
  const { trial: trialRef, pager: pagerRef } = useHome();
  const scrollTo = useScrollTo();
  const boardRef = useRef(null);
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const waitRef = useRef(null);
  const pressRef = useRef(null);
  const openerRef = useRef(null);
  const phaseRef = useRef("idle");
  const lastPhaseRef = useRef("idle");
  const [phase, setPhase] = useState("idle");
  const [armed, setArmed] = useState(false);
  const wide = useMedia(WIDE);

  const trying = phase === "open";
  const scanning = phase === "scan";

  const move = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const arm = useCallback(() => setArmed(true), []);

  const begin = useCallback(() => {
    setArmed(true);
    if (phaseRef.current !== "idle") return;
    if (!openerRef.current) openerRef.current = focusedElement();
    move(window.matchMedia(REDUCE).matches ? "open" : "scan");
  }, [move]);

  const close = useCallback(() => move("idle"), [move]);

  const tryAnywhere = useCallback(() => {
    if (phaseRef.current === "open") return;
    openerRef.current = focusedElement();
    setArmed(true);
    const board = boardRef.current;
    let far = false;
    if (board) {
      const { top } = board.getBoundingClientRect();
      far = top < -120 || top > 160;
      if (far) scrollTo(board);
    }
    clearTimeout(waitRef.current);
    const delay = far ? (pagerRef?.current?.on() ? 1000 : 520) : 0;
    waitRef.current = setTimeout(begin, delay);
  }, [begin, scrollTo, pagerRef]);

  useEffect(() => {
    if (!trialRef) return;
    trialRef.current = tryAnywhere;
    return () => {
      trialRef.current = null;
    };
  }, [trialRef, tryAnywhere]);

  useEffect(() => () => clearTimeout(waitRef.current), []);

  useEffect(() => {
    if (phase !== "scan") return;
    const t = setTimeout(() => move("open"), SCAN_MS);
    return () => clearTimeout(t);
  }, [phase, move]);

  useEffect(() => {
    const was = lastPhaseRef.current;
    lastPhaseRef.current = phase;
    if (phase !== "idle" || was === "idle") return;
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }, [phase]);

  useEffect(() => {
    if (phase !== "open") return;
    const onKey = (e) => {
      if (e.key === "Escape") {
        move("idle");
        return;
      }
      if (e.key !== "Tab" || !window.matchMedia(WIDE).matches) return;
      const box = panelRef.current;
      const items = box ? [...box.querySelectorAll(FOCUSABLE)].filter((el) => el.getClientRects().length > 0) : [];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!box.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const t = setTimeout(() => {
      if (window.matchMedia(WIDE).matches) closeRef.current?.focus({ preventScroll: true });
      else panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, FOCUS_MS);
    return () => {
      document.removeEventListener("keydown", onKey);
      clearTimeout(t);
    };
  }, [phase, move]);

  return (
    <section className={"a2-board" + (trying ? " is-trying" : "")} id={SECTIONS.kisiler.top} data-page="" aria-label="Afiş panosu" ref={boardRef}>
      <div className="a2-board-in">
        <div className="a2-intro">
          <p className="a2-eyebrow">SKY LAB Forms</p>
          <h1 className="a2-h1">Afişteki QR&apos;ın açtığı yer.</h1>
          <p className="a2-p">Kampüsteki afişlerin QR kodları ve ekiplerin paylaştığı bağlantılar Forms&apos;a açılır. Başvurunuzun alınmasından değerlendirmesine kadar her adım buradan yönetilir.</p>
          <div className="a2-acts">
            <button type="button" className="f-act" onClick={tryAnywhere} onPointerEnter={arm} onFocus={arm}>
              Forms&apos;u deneyin
              <ArrowRight size={13} aria-hidden="true" />
            </button>
            <Link className="f-quiet" href={HOME_PATHS.topluluklar}>Topluluklar için</Link>
          </div>
        </div>
        <div className="a2-rail">
          {WALL.map((item) => {
            const scan = scanning && item.trial;
            return (
              <div key={item.id} className={"a2-item" + (item.trial ? " is-trial" : "") + (scan ? " is-scan" : "")} style={item.style}>
                <div className="a2-float">
                  <div className="a2-card">
                    <div className="a2-front">
                      <Poster kind={item.kind} />
                      {item.trial && (
                        <p className="a2-sticky">
                          <i />
                          Buradan deneyin
                        </p>
                      )}
                      {item.trial && phase === "idle" && (
                        <span className="a2-scan is-idle" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                          <i />
                        </span>
                      )}
                      {scan && (
                        <span className="a2-scan" aria-hidden="true">
                          <i />
                          <i />
                          <i />
                          <i />
                          <b />
                        </span>
                      )}
                      {item.trial && (
                        <button type="button" className="a2-hit" onClick={begin} onPointerEnter={arm} onFocus={arm} aria-label="Forms'u deneyin afişi. QR'ını okutup formu açın." />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="a2-swipe">Kaydırarak afişlere bakabilirsiniz. Deneme formu için afişe tıklayın.</p>
        <div className={"a2-try scrollbar" + (trying ? " is-open" : "")} ref={panelRef} role="dialog" aria-modal={trying && wide ? "true" : undefined} aria-label="Forms'u deneyin" inert={!trying}>
          <div className="a2-try-bg" aria-hidden="true" />
          <div
            className="a2-try-in"
            onPointerDown={(e) => {
              pressRef.current = e.target;
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && pressRef.current === e.currentTarget) close();
            }}
          >
            <div className="a2-try-cap">
              <p className="a2-try-k">Afişteki QR telefonda bu formu açar</p>
              <h2 className="a2-try-h">Forms&apos;u deneyin</h2>
              <p className="a2-try-p">İki dakikalık bir deneme başvurusu. Gönderdikten sonra cevaplarınızın kopyası e-postanıza gelecek.</p>
              {TRIAL_QR && (
                <div className="a2-try-scan">
                  <span className="a2-try-qr">
                    <svg viewBox={`0 0 ${TRIAL_QR.size} ${TRIAL_QR.size}`} shapeRendering="crispEdges" aria-hidden="true">
                      <path d={TRIAL_QR.d} fill="#121212" />
                    </svg>
                  </span>
                  <span className="a2-try-scan-t">
                    <b>Kendi telefonunuzla okutun</b>
                    <span>Bu formu telefonunuzda denemek için QR&apos;ı okutun.</span>
                    <code>{SHORT_PREFIX + TRIAL_ALIAS}</code>
                  </span>
                </div>
              )}
              <p className="a2-try-or">ya da yandaki telefonda doldurun</p>
              <button type="button" className="f-quiet a2-try-back" onClick={close}>Panoya dönün</button>
            </div>
            <div className="a2-try-sheet">
              <div className="a2-try-hd">
                <span className="a2-try-thumb">
                  <Poster kind="trial" />
                </span>
                <div className="a2-try-hm">
                  <p>Forms&apos;u deneyin</p>
                  <small>{SHORT_PREFIX + TRIAL_ALIAS} · WEBLAB</small>
                </div>
                <button type="button" className="a2-try-xm" onClick={close} aria-label="Formu kapatın">
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
              <div className="a2-try-scr">
                {armed && (wide ? <PhoneForm formId={HOME_FORMS.trial} onEscape={close} /> : <HomeForm formId={HOME_FORMS.trial} eager />)}
              </div>
            </div>
            <button type="button" className="a2-try-x" ref={closeRef} onClick={close}>
              <X size={16} aria-hidden="true" />
              Kapatın
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
