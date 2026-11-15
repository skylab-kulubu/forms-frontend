"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ArrowDown, ChevronRight } from "lucide-react";
import { useHome, useScrollTo } from "../HomeContext";
import { useScrollContainer } from "../scroll";
import { scrollToSection } from "../usePager";
import { recall, remember, watch as watchScroll } from "../scrollMemo";
import { MOTION_QUERY, WIDE_QUERY, useTourState, useTourStore } from "./tourStore";
import "./film/film.css";
import "./tour.css";

const WARM_MS = 1200;
const LAND_MS = 1600;
const HOP = 1.6;
const AWAY = 0.3;
const PACE = { wide: 1, narrow: 0.7 };
const INTRO_MS = { wide: 1700, narrow: 1300 };
const SWAP_OUT = 140;
const SWAP_IN = 260;
const CLOSE = 0.1;
const STORY_RATE = 0.4;
const READ = { base: 1.2, chars: 28, min: 4, max: 6 };
const SCROLL_KEYS = { ArrowDown: 40, ArrowUp: -40, PageDown: 0.875, PageUp: -0.875, " ": 0.875, Home: -1e9, End: 1e9 };

export default function Tour({ film, sections, deep, intro, slim = false, tryable = false, column = false }) {
  const scrollRef = useScrollContainer();
  const { pager, headerSlot: slot } = useHome();
  const scrollTo = useScrollTo();
  const store = useTourStore();
  const tour = useTourState();
  const trackRef = useRef(null);
  const stageRef = useRef(null);
  const sceneRef = useRef(null);
  const worldRef = useRef(null);
  const areaARef = useRef(null);
  const areaBRef = useRef(null);
  const slimRef = useRef(null);

  useEffect(() => {
    const box = scrollRef?.current;
    const track = trackRef.current;
    const stage = stageRef.current;
    const scene = sceneRef.current;
    if (!box || !track) return undefined;

    const wideMq = window.matchMedia(WIDE_QUERY);
    const motionMq = window.matchMedia(MOTION_QUERY);
    const S = {
      mod: null, film: null, mode: null, state: "open", open: false, top: 0, span: 0, vh: 1, per: 1, raw: 0, liveAt: 0, near: false, dead: false,
      wanted: false, armed: false, cut: false, hold: null, dip: 0, intro: 0, rest: 0, timer: 0, idle: 0, docs: new WeakMap(), lost: null,
      pin: "", tight: null, wide: null, loading: false, land: 0, slim: false, swap: null, shown: false, story: false, play: 0, view: false, k: "", pace: [],
    };
    const bar = box.querySelector(".f-hdr");
    const capsule = bar?.querySelector(".f-hdr-in") ?? null;

    const setSlim = (slim, animate = true) => {
      if (slim === S.slim) return;
      S.slim = slim;
      const apply = () => box.classList.toggle("tour-slim", S.slim);
      const running = S.swap;
      S.swap = null;
      if (!capsule || !animate || typeof capsule.animate !== "function") {
        running?.cancel();
        apply();
        return;
      }
      const shown = Number(getComputedStyle(capsule).opacity);
      running?.cancel();
      const out = capsule.animate(
        [{ opacity: shown }, { opacity: 0, transform: "translateY(-4px)" }],
        { duration: SWAP_OUT * shown, easing: "cubic-bezier(.4, 0, 1, 1)", fill: "forwards" },
      );
      S.swap = out;
      out.finished.then(() => {
        if (S.swap !== out) return;
        apply();
        const back = capsule.animate(
          [{ opacity: 0, transform: S.slim ? "translateX(-8px)" : "translateY(-4px)" }, { opacity: 1, transform: "none" }],
          { duration: SWAP_IN, easing: "cubic-bezier(.22, 1, .36, 1)" },
        );
        out.cancel();
        S.swap = back;
        back.finished.then(() => {
          if (S.swap === back) S.swap = null;
        }, () => {});
      }, () => {});
    };

    const modeNow = () => (!motionMq.matches ? null : wideMq.matches ? "wide" : box.clientHeight >= 520 ? "narrow" : null);
    const sections = () => [...box.querySelectorAll("[data-page]")].filter((el) => el.getClientRects().length > 0);

    const rectIn = (el) => {
      const a = el.getBoundingClientRect();
      const s = scene.getBoundingClientRect();
      return { x: Math.round(a.left - s.left), y: Math.round(a.top - s.top), w: Math.floor(a.width / 2) * 2, h: Math.floor(a.height / 2) * 2 };
    };
    const mix = (a, b, k) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, w: a.w + (b.w - a.w) * k, h: a.h + (b.h - a.h) * k });

    const areaBox = (u = 0) => {
      const a = S.tight ?? rectIn(areaARef.current);
      const b = S.wide ?? rectIn(areaBRef.current);
      return { ...mix(a, b, S.mod ? S.mod.framed(u) : 0), hero: S.mode === "wide" ? "right" : "center" };
    };

    const lenOf = () => String(S.mod.T.total * (S.per / S.vh) + 1);
    const yOf = (u) => Math.round(S.top + u * S.per);

    const sync = () => {
      const y = box.scrollTop;
      if (!S.shown && S.mode && y + S.vh - S.top > S.vh * 0.35) {
        S.shown = true;
        store.set({ shown: true });
      }
      const slack = pager?.current?.paging() ? -0.5 : S.vh * 0.6;
      const pin = y < S.top + slack ? "before" : y > S.top + S.span - S.vh - slack ? "after" : "pinned";
      if (pin === S.pin) return;
      S.pin = pin;
      track.dataset.pin = pin;
    };

    const scrollToY = (y) => {
      const api = pager?.current;
      if (api) api.toY(y);
      else box.scrollTo({ top: y, behavior: "smooth" });
    };

    const travel = (y) => {
      const api = pager?.current;
      const film = S.film;
      if (!film) {
        scrollToY(y);
        return;
      }
      const to = (y - S.top) / S.per;
      const fixed = S.raw >= 0 && S.raw <= S.mod.T.total;
      if (!fixed && api) {
        S.hold = to;
        film.jump(to);
        api.toY(y, true);
        return;
      }
      if (Math.abs(to - S.raw) <= HOP) {
        scrollToY(y);
        return;
      }
      scene.classList.add("is-cut");
      clearTimeout(S.dip);
      S.dip = setTimeout(() => {
        S.dip = 0;
        S.hold = to;
        box.scrollTop = y;
        remember(box);
        requestAnimationFrame(() => requestAnimationFrame(() => scene.classList.remove("is-cut")));
      }, 170);
    };

    const place = () => {
      const vh = box.clientHeight;
      const per = vh * (PACE[S.mode] ?? 1);
      if (S.open && !S.story) track.style.setProperty("--tour-len", String(S.mod.T.total * (per / vh) + 1));
      const frame = track.getBoundingClientRect();
      const top = frame.top - box.getBoundingClientRect().top + box.scrollTop;
      const moved = vh !== S.vh || per !== S.per || Math.abs(top - S.top) > 0.5;
      const keep = !S.story && moved && S.open && S.raw > 0.001 && S.raw < S.mod.T.total - 0.001 ? S.raw : null;
      S.vh = vh;
      S.per = per;
      S.top = top;
      S.span = frame.height;
      stage.style.setProperty("--tour-left", `${frame.left}px`);
      stage.style.setProperty("--tour-width", `${frame.width}px`);
      if (slim && bar && S.mode === "wide" && slimRef.current) {
        const slim = slimRef.current.getBoundingClientRect();
        bar.style.setProperty("--tour-hdr-c", `${Math.round(slim.left + slim.width / 2)}px`);
        bar.style.setProperty("--tour-hdr-w", `${Math.round(slim.width)}px`);
      }
      if (S.mode) {
        S.tight = rectIn(areaARef.current);
        S.wide = rectIn(areaBRef.current);
      }
      if (keep !== null) {
        const y = yOf(keep);
        if (Math.abs(y - box.scrollTop) > 1) {
          box.scrollTop = y;
          remember(box);
        }
      }
      sync();
      S.film?.layout();
    };

    const steady = (change) => {
      const edge = box.getBoundingClientRect().top;
      const anchor = sections().find((el) => el !== track && el.getBoundingClientRect().bottom - edge > 1) ?? null;
      const before = anchor ? anchor.getBoundingClientRect().top : 0;
      change();
      if (!anchor || anchor.getClientRects().length === 0) return;
      const shift = anchor.getBoundingClientRect().top - before;
      if (Math.abs(shift) > 1) {
        box.scrollTop += shift;
        remember(box);
      }
    };

    const setState = (state) => {
      S.state = state;
      S.open = state === "open" && Boolean(S.mod) && Boolean(S.mode) && S.mode !== "off";
      track.style.setProperty("--tour-len", S.open && !S.story ? lenOf() : "1");
      store.set({ state, active: 0, note: -1, live: false, pinned: false, away: false });
      place();
    };

    const setLive = (on) => {
      if (!S.film) return;
      const live = S.film.setLive(on);
      if (live) S.liveAt = box.scrollTop;
      else if (document.activeElement?.tagName === "IFRAME" && stage.contains(document.activeElement)) document.activeElement.blur();
    };

    const keyScroll = (event) => {
      const step = SCROLL_KEYS[event.key];
      if (step === undefined || event.altKey || event.ctrlKey || event.metaKey) return false;
      const sign = event.key === " " && event.shiftKey ? -1 : 1;
      box.scrollBy({ top: sign * (Math.abs(step) < 2 ? step * S.vh : step), behavior: "smooth" });
      return true;
    };

    const inTour = () => (S.story ? S.open && S.view : S.open && S.raw > -0.02 && S.raw < S.mod.T.total + 0.02);

    const captionAt = (u) => {
      let index = 0;
      S.mod.CAPTIONS.forEach((item, at) => {
        if (u >= item.at - 0.02) index = at;
      });
      return index;
    };

    const paceOf = (mod) => mod.CAPTIONS.map((item, index) => {
      const span = (mod.CAPTIONS[index + 1]?.at ?? mod.T.total) - item.at;
      const length = `${item.title} ${item.compactText ?? item.text}`.length;
      const read = Math.min(READ.max, Math.max(READ.min, READ.base + length / READ.chars));
      return span / Math.max(span / STORY_RATE, read);
    });

    const onInnerKey = (event) => {
      if (S.film?.live) return;
      if (event.key === "Escape" && inTour()) {
        skip();
        return;
      }
      if (event.key === "Tab") {
        document.activeElement?.blur?.();
        return;
      }
      if (SCROLL_KEYS[event.key] === undefined || event.altKey || event.ctrlKey || event.metaKey) return;
      if (pager?.current?.paging()) window.dispatchEvent(new KeyboardEvent("keydown", { key: event.key, code: event.code, shiftKey: event.shiftKey, repeat: event.repeat, bubbles: true, cancelable: true }));
      else keyScroll(event);
    };

    const onInnerFocus = () => {
      if (S.film?.live) return;
      const y = recall(box);
      const back = S.lost && performance.now() - S.lost.at < 30 && S.lost.el.isConnected ? S.lost.el : null;
      const hold = () => {
        if (Math.abs(box.scrollTop - y) > 0.5) box.scrollTop = y;
      };
      hold();
      queueMicrotask(() => {
        hold();
        if (back) back.focus({ preventScroll: true });
      });
    };

    const bridge = () => {
      worldRef.current?.querySelectorAll("iframe").forEach((frame) => {
        let doc = null;
        try {
          doc = frame.contentDocument;
        } catch {
          return;
        }
        if (!doc || doc === S.docs.get(frame) || doc.location.href === "about:blank") return;
        S.docs.set(frame, doc);
        frame.contentWindow.addEventListener("keydown", onInnerKey, true);
        frame.contentWindow.addEventListener("focusin", onInnerFocus, true);
      });
    };

    const onFrame = (u, dt = 0) => {
      const film = S.film;
      if (!film) return;
      bridge();
      sync();
      const end = S.mod.T.end;
      setSlim(slim && S.open && S.mode === "wide" && (S.slim ? u > 0.38 && u < end - CLOSE : u > 0.46 && u < end - CLOSE - 0.04));
      const total = S.mod.T.total;
      S.raw = (box.scrollTop - S.top) / S.per;
      const lead = film.lead();
      const ready = lead ? lead.ready && !lead.masked : film.ready || film.covered;
      if (!S.open) {
        if (film.u > 0.0005 || film.target > 0.0005) film.jump(0);
        S.cut = false;
      } else if (S.story) {
        if (S.cut) {
          film.jump(S.play);
          S.cut = false;
        } else {
          if (S.view && ready && !film.live && !S.dip && S.play < total) S.play = Math.min(total, S.play + Math.min(0.25, dt) * (S.pace[captionAt(S.play)] ?? STORY_RATE));
          film.setTarget(S.play);
        }
      } else {
        const aim = pager?.current?.aim?.() ?? null;
        const passing = aim !== null && (aim < S.top - 1 || aim > S.top + total * S.per + 1);
        const edge = S.vh / S.per - 0.003;
        const seen = S.raw > -edge && S.raw < total + edge;
        if (S.hold !== null) {
          film.jump(S.hold);
          if (aim === null) S.hold = null;
        } else if (S.cut || !seen) {
          film.jump(S.raw);
          S.cut = false;
        } else if (!passing) {
          film.setTarget(S.raw);
        }
      }
      if (film.live && Math.abs(box.scrollTop - S.liveAt) > S.vh * 0.04) setLive(false);

      const list = S.mod.CAPTIONS;
      const active = captionAt(u);
      let note = -1;
      list[active].notes?.forEach((item, index) => {
        if (u >= item.at) note = index;
      });
      if (S.story) {
        const from = list[active].at;
        const to = list[active + 1]?.at ?? total;
        const k = Math.max(0, Math.min(1, (u - from) / Math.max(0.01, to - from))).toFixed(3);
        if (k !== S.k) {
          S.k = k;
          stage.style.setProperty("--tour-k", k);
        }
      }
      store.set({
        active, note, live: film.live, framed: S.mod.framed(u) > 0.5, pinned: inTour(), away: S.open && !S.story && u > AWAY, closing: S.open && u >= S.mod.T.end - CLOSE,
        waiting: !ready && !lead?.masked,
        canTry: S.open && (film.live || Boolean(lead?.ready)),
      });
    };

    const run = () => {
      if (!S.film) return;
      if (S.near) S.film.start();
      else {
        S.film.stop();
        setSlim(false);
      }
    };

    const create = () => {
      if (S.film || !S.mod || S.dead || !S.mode || S.mode === "off") return;
      place();
      S.film = S.mod.createFilm({ scene, world: worldRef.current, area: areaBox, onFrame, compact: S.mode === "narrow", fill: S.mode === "wide", band: 0, hold: true });
      S.cut = true;
      worldRef.current.querySelectorAll("iframe").forEach((frame) => frame.addEventListener("load", bridge));
      run();
    };

    const disarm = () => {
      S.armed = false;
      cancelAnimationFrame(S.land);
      S.land = 0;
      clearTimeout(S.timer);
      if (S.idle) (window.cancelIdleCallback ?? clearTimeout)(S.idle);
      S.idle = 0;
      box.removeEventListener("wheel", wake);
      box.removeEventListener("touchstart", wake);
      box.removeEventListener("scroll", wake);
      window.removeEventListener("keydown", wake);
    };

    function wake() {
      disarm();
      if (!S.mod) {
        S.wanted = true;
        return;
      }
      const asked = performance.now();
      const land = () => {
        S.land = 0;
        if (S.dead) return;
        if ((pager?.current?.aim?.() ?? null) !== null && performance.now() - asked < LAND_MS) S.land = requestAnimationFrame(land);
        else {
          create();
          S.film?.release();
        }
      };
      land();
    }

    const arm = () => {
      if (S.armed || (S.film && !S.film.held) || !S.mode || S.mode === "off") return;
      S.armed = true;
      S.timer = setTimeout(() => {
        S.idle = (window.requestIdleCallback ?? setTimeout)(wake, { timeout: 1500 });
      }, WARM_MS);
      box.addEventListener("wheel", wake, { passive: true });
      box.addEventListener("touchstart", wake, { passive: true });
      box.addEventListener("scroll", wake, { passive: true });
      window.addEventListener("keydown", wake);
    };

    const seek = (smooth) => {
      const key = deep[decodeURIComponent(window.location.hash.slice(1))];
      if (!key || !S.mod || !S.mode || S.mode === "off") return;
      if (!S.open) steady(() => setState("open"));
      if (S.story) {
        S.play = S.mod.T[key] + 0.02;
        S.cut = true;
        wake();
        if (smooth) scrollToY(S.top);
        else {
          box.scrollTop = S.top;
          remember(box);
        }
        return;
      }
      const y = yOf(S.mod.T[key] + 0.02);
      wake();
      if (smooth) travel(y);
      else {
        box.scrollTop = y;
        remember(box);
        S.cut = true;
      }
    };

    const load = async () => {
      if (S.loading || S.mod) return;
      S.loading = true;
      try {
        const mod = await film();
        if (S.dead) return;
        S.mod = mod;
        S.pace = paceOf(mod);
        store.set({ captions: mod.CAPTIONS });
        steady(() => setState(S.state));
        seek(false);
        arm();
        create();
        if (S.wanted) wake();
      } catch {
        if (S.dead) return;
        S.mode = "off";
        S.open = false;
        box.classList.remove("tour-wide", "tour-narrow");
        store.set({ mode: null });
      }
    };

    const applyMode = () => {
      if (S.mode === "off") return;
      const next = modeNow();
      if (next === S.mode) return;
      cancelAnimationFrame(S.intro);
      S.intro = 0;
      clearTimeout(S.dip);
      S.dip = 0;
      scene.classList.remove("is-cut");
      disarm();
      S.film?.destroy();
      S.film = null;
      S.mode = next;
      S.story = next === "narrow";
      S.play = 0;
      setSlim(false, false);
      box.classList.toggle("tour-wide", next === "wide");
      box.classList.toggle("tour-narrow", next === "narrow");
      store.set({ mode: next, live: false, canTry: false, waiting: false, framed: false });
      steady(() => setState(S.state));
      if (!next) return;
      if (S.mod) {
        create();
        arm();
      } else load();
    };

    function skip() {
      if (S.state !== "open") return;
      setLive(false);
      cancelAnimationFrame(S.intro);
      S.intro = 0;
      scene.classList.add("is-cut");
      clearTimeout(S.dip);
      S.dip = setTimeout(() => {
        S.dip = 0;
        setState("skipped");
        box.scrollTop = S.top;
        remember(box);
        S.film?.jump(0);
        requestAnimationFrame(() => requestAnimationFrame(() => {
          scene.classList.remove("is-cut");
          const list = sections();
          const next = list[list.indexOf(track) + 1];
          if (next) scrollToSection(pager, next);
        }));
      }, 170);
    }

    function watch() {
      if (!S.mod || !S.mode || S.mode === "off") return;
      if (S.state === "open") {
        if (S.dip) return;
        setLive(false);
        cancelAnimationFrame(S.intro);
        S.intro = 0;
        scene.classList.add("is-cut");
        S.dip = setTimeout(() => {
          S.dip = 0;
          replay();
          requestAnimationFrame(() => requestAnimationFrame(() => scene.classList.remove("is-cut")));
        }, 170);
        return;
      }
      wake();
      setState("open");
      replay();
    }

    function replay() {
      if (S.story) {
        S.play = 0;
        S.cut = true;
        scrollToY(S.top);
        return;
      }
      box.scrollTop = S.top;
      remember(box);
      S.cut = true;
      const from = box.scrollTop;
      const to = yOf(S.mod.REPLAY_AT);
      const span = INTRO_MS[S.mode] ?? 1500;
      const began = performance.now();
      const halt = () => {
        cancelAnimationFrame(S.intro);
        S.intro = 0;
      };
      const step = (now) => {
        const t = Math.min(1, (now - began) / span);
        const eased = t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
        box.scrollTop = from + (to - from) * eased;
        remember(box);
        if (t < 1 && S.open) S.intro = requestAnimationFrame(step);
        else {
          S.intro = 0;
          box.removeEventListener("wheel", halt);
          box.removeEventListener("touchstart", halt);
        }
      };
      box.addEventListener("wheel", halt, { passive: true, once: true });
      box.addEventListener("touchstart", halt, { passive: true, once: true });
      S.intro = requestAnimationFrame(step);
    }

    const rest = () => {
      S.rest = 0;
      if (!S.open || S.story || S.intro || S.dip || (pager?.current?.aim?.() ?? null) !== null) return;
      if (box.scrollTop < S.top + S.span - 1) return;
      setLive(false);
      steady(() => setState("done"));
      S.film?.jump(0);
    };

    const onScroll = () => {
      remember(box);
      S.raw = (box.scrollTop - S.top) / S.per;
      if (!S.open) return;
      clearTimeout(S.rest);
      S.rest = setTimeout(rest, 260);
    };
    const onKey = (event) => {
      if (event.key === "Escape" && S.film?.live) {
        setLive(false);
        return;
      }
      if (event.key === "Escape" && inTour()) {
        skip();
        return;
      }
      if (event.defaultPrevented || S.mode !== "wide" || pager?.current?.paging()) return;
      const target = event.target;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|IFRAME|A)$/.test(target.tagName))) return;
      if (keyScroll(event)) event.preventDefault();
    };
    const onHash = () => seek(true);
    const onFocusOut = (event) => {
      if (!event.relatedTarget) S.lost = { el: event.target, at: performance.now() };
    };

    const near = new IntersectionObserver(([entry]) => {
      S.near = entry.isIntersecting;
      run();
    }, { root: box, rootMargin: "100% 0px" });
    near.observe(track);
    const view = new IntersectionObserver(([entry]) => {
      S.view = entry.intersectionRatio >= 0.6;
    }, { root: box, threshold: [0, 0.6, 1] });
    view.observe(track);

    const jumpTo = (u) => {
      if (!S.open || !S.mod) return;
      if (!S.story) {
        travel(yOf(u));
        return;
      }
      scene.classList.add("is-cut");
      clearTimeout(S.dip);
      S.dip = setTimeout(() => {
        S.dip = 0;
        S.play = Math.max(0, u);
        S.cut = true;
        requestAnimationFrame(() => requestAnimationFrame(() => scene.classList.remove("is-cut")));
      }, 170);
    };
    const step = (dir) => {
      if (!S.mod) return;
      const list = S.mod.CAPTIONS;
      const active = captionAt(S.play);
      const into = S.play - list[active].at;
      const next = dir < 0 && into > 0.6 ? active : Math.max(0, Math.min(list.length - 1, active + dir));
      jumpTo(list[next].at + 0.02);
    };
    const sizes = new ResizeObserver(() => {
      applyMode();
      place();
    });
    sizes.observe(box);
    sizes.observe(track.parentElement);

    remember(box);
    const unwatch = watchScroll(box, sync);
    const withdraw = store.provide({
      skip,
      watch,
      live: () => setLive(!S.film?.live),
      go: (index) => jumpTo(S.mod.CAPTIONS[index].at + 0.02),
      step,
    });
    wideMq.addEventListener("change", applyMode);
    motionMq.addEventListener("change", applyMode);
    box.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("hashchange", onHash);
    document.addEventListener("focusout", onFocusOut, true);
    applyMode();

    return () => {
      S.dead = true;
      clearTimeout(S.dip);
      clearTimeout(S.rest);
      cancelAnimationFrame(S.intro);
      disarm();
      unwatch();
      near.disconnect();
      view.disconnect();
      sizes.disconnect();
      wideMq.removeEventListener("change", applyMode);
      motionMq.removeEventListener("change", applyMode);
      box.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("hashchange", onHash);
      document.removeEventListener("focusout", onFocusOut, true);
      S.film?.destroy();
      S.film = null;
      S.swap?.cancel();
      box.classList.remove("tour-wide", "tour-narrow", "tour-playing", "tour-slim");
      ["--tour-hdr-c", "--tour-hdr-w"].forEach((name) => bar?.style.removeProperty(name));
      withdraw();
    };
  }, [scrollRef, pager, store, film, deep, slim]);

  const narrow = tour.mode === "narrow";
  const open = tour.state === "open";
  const list = tour.captions.length ? tour.captions : [{ at: 0, label: "Tur", ...intro }];
  const last = tour.captions.length - 1;
  const touring = open && tour.pinned && tour.active < last && !tour.closing;
  const hint = narrow && open && tour.active <= 1 && !tour.waiting;

  useEffect(() => {
    const box = scrollRef?.current;
    if (!box || !slot) return undefined;
    box.classList.toggle("tour-playing", touring);
    const usual = slot.querySelector(".f-hdr-r");
    if (usual) usual.inert = touring;
    return () => {
      if (usual) usual.inert = false;
    };
  }, [scrollRef, slot, touring]);

  const press = (run) => (event) => {
    if (event.detail > 0) event.currentTarget.blur();
    run?.();
  };

  const toSection = (id) => (event) => {
    event.preventDefault();
    scrollTo(id);
  };

  return (
    <section className={column ? "tour is-column" : "tour"} id="tur" data-page="" data-free="" aria-label="Tur" ref={trackRef}>
      <div className={`tour-stage${open ? " is-open" : ""}${tour.live ? " is-live" : ""}${tour.shown ? " is-in" : ""}${tour.framed ? " is-wide" : ""}`} ref={stageRef}>
        <div className="film-scene tour-scene" ref={sceneRef}>
          <div className="film-world" ref={worldRef} />
        </div>
        {narrow && open && !tour.live && (
          <div className="tour-taps">
            <button type="button" aria-label="Önceki bölüm" onClick={press(() => store.actions.step?.(-1))} />
            <button type="button" aria-label="Sonraki bölüm" onClick={press(() => store.actions.step?.(1))} />
          </div>
        )}
        <div className="tour-m tour-m-area-a" ref={areaARef} aria-hidden="true" />
        <div className="tour-m tour-m-area-b" ref={areaBRef} aria-hidden="true" />
        {slim && <div className="tour-m tour-m-hdr" ref={slimRef} aria-hidden="true" />}
        <div className="tour-note">
          <p className={tour.waiting ? "tour-wait is-on" : "tour-wait"} aria-hidden={tour.waiting ? undefined : "true"}>
            Ekranlar yükleniyor
            <i />
          </p>
        </div>
        <div className="tour-seg" aria-hidden="true">
          {tour.captions.map((item, index) => (
            <i key={item.at} className={index < tour.active ? "is-done" : index === tour.active ? "is-on" : undefined} />
          ))}
        </div>
        <div className="tour-copy">
          {list.map((item, index) => {
            const on = index === tour.active && !(index === 0 && tour.away);
            const edge = index === 0 || index === last;
            return (
              <div key={item.at} className={`tour-cap${edge ? " is-col" : ""}${on ? " is-on" : index < tour.active || index === 0 ? " is-past" : ""}`} aria-hidden={on ? undefined : "true"} inert={!on}>
                <p className="tour-cap-k">{index === 0 ? "Tur" : item.label}</p>
                <h2 className="tour-cap-t">{item.title}</h2>
                <p className="tour-cap-p">{narrow ? item.compactText ?? item.text : item.fillText ?? item.text}</p>
                {item.notes?.length > 0 && (
                  <ul className="tour-cap-notes">
                    {item.notes.map((note, step) => (
                      <li key={note.at} className={!on ? undefined : step === tour.note ? "is-on" : step < tour.note ? "is-done" : undefined}>
                        {note.text}
                      </li>
                    ))}
                  </ul>
                )}
                {index === 0 && open && !narrow && (
                  <div className="tour-cap-acts">
                    <p className="tour-cap-hint">
                      <ArrowDown size={12} aria-hidden="true" />
                      Aşağı kaydırın
                    </p>
                  </div>
                )}
                {index === 0 && !open && (
                  <div className="tour-cap-acts">
                    <button type="button" className="f-act tour-watch" onClick={press(() => store.actions.watch?.())}>
                      {tour.state === "done" ? "Turu yeniden izleyin" : "Turu izleyin"}
                    </button>
                  </div>
                )}
                {index === last && item.actions?.length > 0 && (
                  <div className="tour-cap-acts">
                    {item.actions.map((action) => {
                      const kind = action.quiet ? "f-quiet" : "f-act";
                      if (action.restart) {
                        return (
                          <button key={action.label} type="button" className={kind} onClick={press(() => store.actions.watch?.())}>
                            {action.label}
                          </button>
                        );
                      }
                      const id = action.section ? sections[action.section] : null;
                      return (
                        <a key={action.label} className={kind} href={id ? `#${id}` : action.href} onClick={id ? toSection(id) : undefined}>
                          {action.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className={hint ? "tour-hint" : "tour-hint is-off"} aria-hidden={hint ? undefined : "true"}>
          Sonraki bölüm için ekranın sağına dokunun
          <ChevronRight size={12} aria-hidden="true" />
        </p>
        <p className={tour.live ? "tour-live is-on" : "tour-live"} aria-hidden={tour.live ? undefined : "true"}>
          Ekranı kullanabilirsiniz. Tura dön&apos;e basınca tur kaldığı yerden devam eder.
        </p>
      </div>
      {slot && createPortal(
        <div className={touring ? "tour-hdr is-on" : "tour-hdr"} inert={!touring}>
          <button type="button" className="f-quiet" onClick={press(() => store.actions.skip?.())}>
            {narrow ? "Geç" : "Turu geç"}
          </button>
          {tryable && (
            <span className={tour.canTry ? "tour-try is-on" : "tour-try"} inert={!tour.canTry}>
              <span>
                <button type="button" className="f-act" onClick={press(() => store.actions.live?.())}>
                  {tour.live ? "Tura dön" : narrow ? "Dene" : "Durdur ve dene"}
                </button>
              </span>
            </span>
          )}
        </div>,
        slot,
      )}
    </section>
  );
}
