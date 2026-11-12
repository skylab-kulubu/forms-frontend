"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { fetchDisplayFormById } from "@/lib/hooks/useForm";
import Poster from "../poster/Poster";
import { HOME_FORMS, HOME_PATHS, SECTIONS } from "../config";
import { useHome, useScrollTo } from "../HomeContext";
import PosterTrial, { preloadTrialForm } from "./trial/PosterTrial";
import "./hero-wall.css";

const HASH = "#deneme";

function focusedElement() {
  const el = document.activeElement;
  return el && el !== document.body ? el : null;
}

function dropHash() {
  window.history.replaceState(window.history.state, "", window.location.pathname + window.location.search);
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

export default function HeroWall() {
  const { trial: trialRef, pager: pagerRef } = useHome();
  const scrollTo = useScrollTo();
  const queryClient = useQueryClient();
  const boardRef = useRef(null);
  const waitRef = useRef(null);
  const openerRef = useRef(null);
  const phaseRef = useRef("idle");
  const lastPhaseRef = useRef("idle");
  const pushedRef = useRef(false);
  const [phase, setPhase] = useState("idle");
  const [entry, setEntry] = useState("click");
  const [landed, setLanded] = useState(0);

  const move = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  const open = useCallback((from) => {
    setEntry(from);
    move("open");
  }, [move]);

  const arm = useCallback(() => {
    if (!HOME_FORMS.trial) return;
    preloadTrialForm();
    queryClient.prefetchQuery({ queryKey: ["display-form", HOME_FORMS.trial], queryFn: () => fetchDisplayFormById(HOME_FORMS.trial), staleTime: 60_000 });
  }, [queryClient]);

  const begin = useCallback(() => {
    arm();
    if (phaseRef.current !== "idle") return;
    if (!openerRef.current) openerRef.current = focusedElement();
    open("click");
  }, [arm, open]);

  const startClosing = useCallback(() => {
    if (phaseRef.current === "open") move("closing");
  }, [move]);

  const close = useCallback(() => {
    if (pushedRef.current) {
      pushedRef.current = false;
      window.history.back();
      return;
    }
    if (window.location.hash === HASH) dropHash();
    startClosing();
  }, [startClosing]);

  const closed = useCallback(() => {
    if (phaseRef.current !== "closing") return;
    setLanded((n) => n + 1);
    move("idle");
  }, [move]);

  const tryAnywhere = useCallback(() => {
    if (phaseRef.current !== "idle") return;
    openerRef.current = focusedElement();
    arm();
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
  }, [arm, begin, scrollTo, pagerRef]);

  useEffect(() => {
    if (!trialRef) return;
    trialRef.current = tryAnywhere;
    return () => {
      trialRef.current = null;
    };
  }, [trialRef, tryAnywhere]);

  useEffect(() => () => clearTimeout(waitRef.current), []);

  useEffect(() => {
    const raf = window.location.hash === HASH ? requestAnimationFrame(() => {
      if (phaseRef.current === "idle") open("hash");
    }) : 0;
    const onPop = () => {
      if (window.location.hash !== HASH) {
        pushedRef.current = false;
        startClosing();
      } else if (phaseRef.current === "idle") {
        open("click");
      }
    };
    window.addEventListener("popstate", onPop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("popstate", onPop);
    };
  }, [open, startClosing]);

  useEffect(() => {
    if (phase !== "open" || window.location.hash === HASH) return;
    window.history.pushState(window.history.state, "", window.location.pathname + window.location.search + HASH);
    pushedRef.current = true;
  }, [phase]);

  useEffect(() => {
    const was = lastPhaseRef.current;
    lastPhaseRef.current = phase;
    if (phase !== "idle" || was === "idle") return;
    const opener = openerRef.current;
    openerRef.current = null;
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  }, [phase]);

  const active = phase !== "idle";

  return (
    <section className={"a2-board" + (active ? " is-tl" : "") + (phase === "closing" ? " is-tl-closing" : "")} id={SECTIONS.kisiler.top} data-page="" aria-label="Afiş panosu" ref={boardRef}>
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
          {WALL.map((item) => (
            <div key={item.id} className={"a2-item" + (item.trial ? " is-trial" : "")} style={item.style}>
              <div className="a2-float">
                <div className="a2-card">
                  <div className="a2-front">
                    <Poster kind={item.kind} />
                    {item.trial && (
                      <p className="a2-sticky" key={landed}>
                        <i />
                        Buradan deneyin
                      </p>
                    )}
                    {item.trial && !active && (
                      <span className="a2-scan" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                    {item.trial && (
                      <button type="button" className="a2-hit" onClick={begin} onPointerEnter={arm} onFocus={arm} aria-label="Forms'u deneyin afişi. QR'ını okutup formu açın." />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="a2-swipe">Kaydırarak afişlere bakabilirsiniz. Deneme formu için afişe tıklayın.</p>
        {active && <PosterTrial formId={HOME_FORMS.trial} onClose={close} closing={phase === "closing"} onClosed={closed} entry={entry} />}
      </div>
    </section>
  );
}
