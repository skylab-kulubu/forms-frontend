"use client";

import { startTransition, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { X } from "lucide-react";
import FormSkeleton from "@/app/components/form-displayer/components/FormSkeleton";
import Poster from "../../poster/Poster";
import { posterQr } from "../../poster/posterQr";
import { TRIAL_ALIAS } from "../../config";
import { EASE_OUT, GLIDE, IDENTITY, SETTLE, flipFrom, freeze, reduced, settled, stopAll, wallPoster } from "./motion";
import "./trial.css";

const TrialForm = dynamic(() => import("./TrialForm"), { ssr: false, loading: () => <div className="tl-wait"><FormSkeleton /></div> });

export function preloadTrialForm() {
  import("./TrialForm").catch(() => null);
}

const QR = posterQr(TRIAL_ALIAS);
const RATIO = 1.4142;
const REST = "0 28px 40px -18px rgba(0, 0, 0, .85), 0 3px 8px rgba(0, 0, 0, .45)";
const LIFT = "0 70px 90px -34px rgba(0, 0, 0, .92), 0 12px 24px rgba(0, 0, 0, .5)";
const FLIGHT = 520;
const SPLIT = 440;
const UNROLL = 640;
const PAPER = 240;
const RETURN = 520;
const ROLL = 520;
const ROLL_EASE = "cubic-bezier(.65, 0, .35, 1)";
const BRAND_AT = SPLIT + UNROLL + 120;
const HIDDEN = { visibility: "hidden" };
const BRAND = ["was", "now", "lab", "tail"];
const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

function fitIn(s) {
  const h = s.width * RATIO;
  if (h <= s.height + 1) return { left: s.left, top: s.top, width: s.width, height: h };
  const w = s.height / RATIO;
  return { left: s.left + (s.width - w) / 2, top: s.top, width: w, height: s.height };
}

function inset(s, r, radius) {
  const t = Math.max(0, r.top - s.top);
  const l = Math.max(0, r.left - s.left);
  const b = Math.max(0, s.top + s.height - (r.top + r.height));
  const rt = Math.max(0, s.left + s.width - (r.left + r.width));
  return `inset(${t}px ${rt}px ${b}px ${l}px round ${radius}px)`;
}

function brandParts(sheet) {
  const parts = Object.fromEntries(BRAND.map((k) => [k, sheet.querySelector(`.tl-brand-${k}`)]));
  if (BRAND.some((k) => !parts[k])) return null;
  const em = parseFloat(getComputedStyle(parts.lab).fontSize) || 16;
  const shift = (parts.lab.getBoundingClientRect().left - parts.was.getBoundingClientRect().right) / em;
  const start = {
    was: { transform: "none" },
    now: { transform: "translateY(.85em)" },
    lab: { transform: `translateX(${-shift}em)` },
    tail: { transform: "translateY(.85em)" },
  };
  return { parts, start };
}

function brandRoll(brand, delay) {
  if (!brand) return [];
  const { parts, start } = brand;
  const timing = { duration: ROLL, delay, easing: ROLL_EASE, fill: "backwards" };
  return [
    parts.was.animate([start.was, { transform: "translateY(-.85em)" }], timing),
    parts.now.animate([start.now, { transform: "none" }], timing),
    parts.lab.animate([start.lab, { transform: "none" }], timing),
    parts.tail.animate([start.tail, { transform: "none" }], { ...timing, delay: delay + 140, easing: EASE_OUT }),
  ];
}

function twins(clone, sheet) {
  const list = [];
  const org = clone.querySelector(".pst-org");
  const sheetOrg = sheet.querySelector(".tl-sheet-org");
  const logo = org?.querySelector(".pst-logo");
  const sheetLogo = sheetOrg?.querySelector(".tl-sheet-logo");
  if (logo && sheetLogo) {
    const la = logo.getBoundingClientRect();
    const lb = sheetLogo.getBoundingClientRect();
    const ob = sheetOrg.getBoundingClientRect();
    const k = la.width / lb.width;
    list.push({ a: org, b: sheetOrg, from: `translate(${la.left - ob.left - (lb.left - ob.left) * k}px, ${la.top - ob.top - (lb.top - ob.top) * k}px) scale(${k})`, hide: HIDDEN });
    const text = org.querySelector(":scope > span:last-child");
    const brand = sheetOrg.querySelector(".tl-brand");
    if (text && brand) {
      const pa = text.getBoundingClientRect();
      const sb = brand.getBoundingClientRect();
      list.push({ a: text, b: brand, from: `translate(${(pa.left - la.left) / k - (sb.left - lb.left)}px, ${(pa.top - la.top) / k - (sb.top - lb.top)}px) scale(${pa.height / (sb.height * k)})`, hide: HIDDEN });
    }
  }
  const strip = clone.querySelector(".pst-strip");
  const sheetStrip = sheet.querySelector(".tl-sheet-strip");
  if (!strip || !sheetStrip) return list;
  const dy = strip.getBoundingClientRect().top - sheetStrip.getBoundingClientRect().top;
  list.push({ a: strip, b: sheetStrip, from: `translate(0px, ${dy}px)`, hide: { borderTopColor: "transparent" } });
  const qr = clone.querySelector(".pst-qr");
  const sheetQr = sheet.querySelector(".tl-sheet-qr");
  const rb = sheetQr?.getBoundingClientRect();
  if (qr && rb && rb.width >= 1) {
    const ra = qr.getBoundingClientRect();
    list.push({ a: qr, b: sheetQr, from: `translate(${ra.left - rb.left}px, ${ra.top - rb.top - dy}px) scale(${ra.width / rb.width})`, hide: HIDDEN });
  }
  return list;
}

function useAfterFirstFrame() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => startTransition(() => setReady(true)));
    });
    return () => cancelAnimationFrame(id);
  }, []);
  return ready;
}

function useDialogKeys(rootRef, onClose) {
  const closeRef = useRef(onClose);
  useLayoutEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (!e.defaultPrevented) closeRef.current();
        return;
      }
      const root = rootRef.current;
      if (e.key !== "Tab" || !root) return;
      const items = [...root.querySelectorAll(FOCUSABLE)].filter((el) => el.tabIndex >= 0 && el.getClientRects().length > 0);
      if (!items.length) return;
      const i = items.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) {
        e.preventDefault();
        items[items.length - 1].focus();
      } else if (!e.shiftKey && (i === -1 || i === items.length - 1)) {
        e.preventDefault();
        items[0].focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [rootRef]);
}

export default function PosterTrial({ formId, onClose, closing, onClosed, entry = "click" }) {
  const rootRef = useRef(null);
  const dimRef = useRef(null);
  const shadeRef = useRef(null);
  const sheetRef = useRef(null);
  const paperRef = useRef(null);
  const cloneRef = useRef(null);
  const scrollRef = useRef(null);
  const xRef = useRef(null);
  const actsRef = useRef(null);
  const animsRef = useRef([]);
  const geoRef = useRef(null);
  const [acts, setActs] = useState(null);
  const [openedAt] = useState(() => performance.now());
  const [plain] = useState(() => entry === "hash" || reduced());
  const ready = useAfterFirstFrame();
  useDialogKeys(rootRef, onClose);

  const actsSlot = useCallback((el) => {
    actsRef.current = el;
    setActs(el);
  }, []);

  useLayoutEffect(() => {
    const anims = animsRef.current;
    const sheet = sheetRef.current;
    const clone = cloneRef.current;
    const shade = shadeRef.current;
    const grain = clone.querySelector(".pst-grain");
    sheet.focus({ preventScroll: true });
    const S = sheet.getBoundingClientRect();
    const fit = fitIn(S);
    Object.assign(clone.style, { left: `${fit.left}px`, top: `${fit.top}px`, width: `${fit.width}px` });
    const box = plain ? null : wallPoster();
    geoRef.current = { fit, box, flight: null, grain: grain ? Number(getComputedStyle(grain).opacity) : 0 };
    anims.push(dimRef.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 460, easing: "ease-out" }));
    const brand = brandParts(sheet);

    if (!box) {
      const quick = reduced();
      anims.push(sheet.animate([{ opacity: 0, transform: quick ? "none" : "translateY(18px) scale(.985)" }, { opacity: 1, transform: "none" }], { duration: quick ? 160 : 460, easing: EASE_OUT }));
      anims.push(shade.animate([{ opacity: 0 }, { opacity: 1 }], { duration: quick ? 160 : 460, easing: "ease-out" }));
      if (!quick) anims.push(...brandRoll(brand, 620));
      return () => stopAll(anims);
    }

    const pairs = twins(clone, sheet);
    const flight = clone.animate([{ transform: flipFrom(box, fit) }, { transform: IDENTITY }], { duration: FLIGHT, easing: GLIDE });
    geoRef.current.flight = flight;
    anims.push(flight);
    anims.push(clone.animate([{ boxShadow: REST }, { boxShadow: LIFT, offset: 0.4 }, { boxShadow: REST }], { duration: FLIGHT, easing: "ease-out" }));
    anims.push(clone.animate([{ opacity: 1 }, { opacity: 1 }], { duration: SPLIT + PAPER + 20 }));
    if (grain) anims.push(grain.animate([{ opacity: geoRef.current.grain }, { opacity: 0 }], { duration: 320, delay: 40, easing: "ease-out", fill: "forwards" }));

    anims.push(sheet.animate([{ opacity: 0 }, { opacity: 0 }], { duration: SPLIT }));
    anims.push(paperRef.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: PAPER, delay: SPLIT, easing: "ease-in-out", fill: "backwards" }));
    anims.push(sheet.animate([{ clipPath: inset(S, fit, 4) }, { clipPath: inset(S, S, 14) }], { duration: UNROLL, delay: SPLIT, easing: GLIDE, fill: "backwards" }));
    anims.push(shade.animate([{ opacity: 0, transform: `scaleY(${fit.height / S.height})` }, { opacity: 1, transform: "none" }], { duration: UNROLL, delay: SPLIT, easing: GLIDE, fill: "backwards" }));
    pairs.forEach(({ a, b, from, hide }) => {
      anims.push(b.animate([{ transform: from }, { transform: "none" }], { duration: UNROLL, delay: SPLIT, easing: GLIDE, fill: "backwards" }));
      anims.push(a.animate([hide, hide], { duration: 1, delay: SPLIT, fill: "forwards" }));
    });
    if (actsRef.current) anims.push(actsRef.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, delay: SPLIT + 60, easing: "ease-out", fill: "backwards" }));
    if (xRef.current) anims.push(xRef.current.animate([{ opacity: 0, transform: "scale(.8)" }, { opacity: 1, transform: "none" }], { duration: 360, delay: SPLIT + 200, easing: EASE_OUT, fill: "backwards" }));
    anims.push(...brandRoll(brand, BRAND_AT));
    return () => stopAll(anims);
  }, [plain]);

  useEffect(() => {
    if (!closing) return undefined;
    const sheet = sheetRef.current;
    const clone = cloneRef.current;
    const shade = shadeRef.current;
    const dim = dimRef.current;
    const grain = clone.querySelector(".pst-grain");
    const geo = geoRef.current;
    const anims = animsRef.current;
    const list = [];
    let live = true;
    const finish = () => settled(list).then(() => {
      if (live) onClosed();
    });
    const cleanup = () => {
      live = false;
    };

    const box = reduced() ? null : wallPoster() ?? geo?.box;
    const d0 = freeze(dim);
    const g0 = freeze(grain);

    if (!box) {
      stopAll(anims);
      list.push(rootRef.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: "ease-in", fill: "forwards" }));
      finish();
      return cleanup;
    }

    const flight = geo?.flight;
    if (flight && flight.playState === "running" && (flight.currentTime ?? 0) < SPLIT) {
      const c0 = freeze(clone);
      stopAll(anims);
      list.push(sheet.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "forwards" }));
      list.push(shade.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, fill: "forwards" }));
      list.push(clone.animate([{ transform: c0.transform, opacity: 1 }, { transform: flipFrom(box, geo.fit), opacity: 1 }], { duration: 460, easing: SETTLE, fill: "forwards" }));
      if (grain && g0) list.push(grain.animate([{ opacity: g0.opacity }, { opacity: geo.grain }], { duration: 460, easing: "ease-in", fill: "forwards" }));
      list.push(dim.animate([{ opacity: d0.opacity }, { opacity: 0 }], { duration: 420, easing: "ease-in-out", fill: "forwards" }));
      finish();
      return cleanup;
    }

    const S = sheet.getBoundingClientRect();
    const fit = fitIn(S);
    const clip0 = getComputedStyle(sheet).clipPath;
    const paper0 = freeze(paperRef.current);
    const shade0 = freeze(shade);
    const acts0 = freeze(actsRef.current);
    const x0 = freeze(xRef.current);
    const now = new Map(["tl-sheet-org", "tl-brand", "tl-sheet-strip", "tl-sheet-qr"].map((k) => [k, freeze(sheet.querySelector(`.${k}`))]));
    const poses = BRAND.map((k) => freeze(sheet.querySelector(`.tl-brand-${k}`)));
    stopAll(anims);
    Object.assign(clone.style, { left: `${fit.left}px`, top: `${fit.top}px`, width: `${fit.width}px` });
    const pairs = twins(clone, sheet);
    const brand = brandParts(sheet);
    const fold = S.height - fit.height > 24 ? 420 : 300;
    if (brand) BRAND.forEach((k, i) => {
      list.push(brand.parts[k].animate([{ transform: poses[i].transform }, brand.start[k]], { duration: Math.round(fold * 0.85), easing: SETTLE, fill: "forwards" }));
    });

    list.push(scrollRef.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease-in", fill: "forwards" }));
    if (acts0) list.push(actsRef.current.animate([{ opacity: acts0.opacity }, { opacity: 0 }], { duration: 140, easing: "ease-in", fill: "forwards" }));
    if (x0) list.push(xRef.current.animate([{ opacity: x0.opacity }, { opacity: 0 }], { duration: 120, easing: "ease-in", fill: "forwards" }));
    list.push(clone.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 1, fill: "forwards" }));
    if (grain) list.push(grain.animate([{ opacity: 0 }, { opacity: 0, offset: (fold + RETURN * 0.3) / (fold + RETURN) }, { opacity: geo?.grain ?? g0?.opacity ?? 0 }], { duration: fold + RETURN, fill: "forwards" }));
    pairs.forEach(({ a, b, from, hide }) => {
      const at = now.get([...b.classList].find((k) => now.has(k)))?.transform ?? "none";
      list.push(b.animate([{ transform: at }, { transform: from }], { duration: fold, easing: SETTLE, fill: "forwards" }));
      list.push(a.animate([hide, hide], { duration: fold }));
    });
    const fade = PAPER * paper0.opacity;
    list.push(paperRef.current.animate([{ opacity: paper0.opacity }, { opacity: 0 }], { duration: Math.max(1, fade), delay: Math.max(0, fold - fade), easing: "ease-in-out", fill: "both" }));
    list.push(sheet.animate([{ clipPath: clip0 && clip0 !== "none" ? clip0 : inset(S, S, 14) }, { clipPath: inset(S, fit, 4) }], { duration: fold, easing: SETTLE, fill: "forwards" }));
    list.push(shade.animate([{ opacity: shade0.opacity, transform: shade0.transform }, { opacity: 0, transform: `scaleY(${fit.height / S.height})` }], { duration: fold, easing: SETTLE, fill: "forwards" }));
    list.push(sheet.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 1, delay: fold, fill: "forwards" }));

    list.push(clone.animate([{ transform: IDENTITY }, { transform: flipFrom(box, fit) }], { duration: RETURN, delay: fold, easing: SETTLE, fill: "forwards" }));
    list.push(clone.animate([{ boxShadow: REST }, { boxShadow: LIFT, offset: 0.5 }, { boxShadow: REST }], { duration: RETURN, delay: fold, easing: "ease-in-out", fill: "forwards" }));
    list.push(dim.animate([{ opacity: d0.opacity }, { opacity: 0 }], { duration: 440, delay: fold - 40, easing: "ease-in-out", fill: "forwards" }));
    finish();
    return cleanup;
  }, [closing, onClosed]);

  return (
    <div className="hm-embed tl-layer tl-open" ref={rootRef} role="dialog" aria-modal="true" aria-label="Forms'u deneyin">
      <div className="tl-dim" ref={dimRef} onClick={onClose} />
      <div className="tl-sheet-shade" ref={shadeRef} aria-hidden="true" />
      <div className="tl-poster" ref={cloneRef} aria-hidden="true"><Poster kind="trial" decorative /></div>
      <div className="tl-sheet" ref={sheetRef} tabIndex={-1}>
        <span className="tl-sheet-paper" ref={paperRef} aria-hidden="true" />
        <div className="tl-sheet-top">
          <span className="tl-sheet-org">
            <Image className="tl-sheet-logo" src="/skylab.svg" alt="" width={586} height={554} unoptimized />
            <span className="tl-brand" aria-hidden="true">
              <span className="tl-brand-clip">
                <span className="tl-brand-was">WEB</span>
                <span className="tl-brand-now">SKY</span>
              </span>{" "}
              <span className="tl-brand-lab">LAB</span>{" "}
              <span className="tl-brand-clip"><span className="tl-brand-tail">Forms</span></span>
            </span>
            <span className="sr-only">SKY LAB Forms</span>
          </span>
          <button type="button" className="tl-x tl-sheet-x" ref={xRef} onClick={onClose} aria-label="Formu kapatın"><X size={18} aria-hidden="true" /></button>
        </div>
        <div className="tl-sheet-scroll scrollbar" ref={scrollRef}>
          {ready && <TrialForm formId={formId} acts={acts} scrollRef={scrollRef} openedAt={openedAt} delay={plain ? 140 : SPLIT + 150} />}
        </div>
        <div className="tl-sheet-strip">
          <span className="tl-sheet-line" aria-hidden="true" />
          <div className="tl-sheet-act" ref={actsSlot} />
          {QR && (
            <span className="tl-sheet-qr" aria-hidden="true">
              <svg viewBox={`0 0 ${QR.size} ${QR.size}`} shapeRendering="crispEdges"><path d={QR.d} fill="#121212" /></svg>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
