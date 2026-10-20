"use client";

import { useEffect, useRef } from "react";

export function scrollToSection(pager, el) {
  if (!el) return;
  const api = pager?.current;
  if (api && api.on()) api.toEl(el);
  else el.scrollIntoView({ behavior: "smooth", block: "start" });
}

const WIDE = "(min-width: 1024px) and (min-height: 700px)";
const MAX_VH = 1100;
const FIT = 2;
const SLACK = 40;
const GAP = 200;
const TRIGGER = 24;
const NUDGE_MS = 220;
const STEP_MS = 320;
const PUSH_GAP = 110;
const PUSH_MIN = 180;
const NOTCH_GAP = 130;
const KEY_GAP = 140;
const LEAD = 2;

function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const x = (s) => ((ax * s + bx) * s + cx) * s;
  const y = (s) => ((ay * s + by) * s + cy) * s;
  const dx = (s) => (3 * ax * s + 2 * bx) * s + cx;
  return (t) => {
    if (t <= 0) return 0;
    if (t >= 1) return 1;
    let s = t;
    for (let i = 0; i < 8; i++) {
      const err = x(s) - t;
      if (Math.abs(err) < 1e-5) return y(s);
      const d = dx(s);
      if (Math.abs(d) < 1e-6) break;
      s -= err / d;
    }
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 24; i++) {
      s = (lo + hi) / 2;
      if (x(s) < t) lo = s;
      else hi = s;
    }
    return y((lo + hi) / 2);
  };
}

const ease = bezier(0.4, 0, 0.2, 1);
const pixels = (e, page) => (e.deltaMode === 1 ? e.deltaY * 40 : e.deltaMode === 2 ? e.deltaY * page : e.deltaY);
const notched = (e, dy) => e.deltaMode === 1 || (Math.abs(dy) >= 50 && Number.isInteger(e.deltaY) && Boolean(e.wheelDeltaY) && e.wheelDeltaY % 120 === 0);

function hermite(from, delta, m0, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return from + m0 * (t3 - 2 * t2 + t) + delta * (3 * t2 - 2 * t3);
}

export function usePager(containerRef, { selector = "[data-page]", block = "" } = {}) {
  const api = useRef(null);

  useEffect(() => {
    const box = containerRef.current;
    if (!box) return;
    const mq = window.matchMedia(WIDE);
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)");
    let anim = 0;
    let resizeT = 0;
    let scrollRaf = 0;
    let resizing = false;
    let lastIdx = 0;
    let glideIdx = -1;
    let glideDir = 0;
    let vel = 0;
    let pushAt = -Infinity;
    let gesture = { at: -Infinity, mode: "", sum: 0, recent: [] };

    const vh = () => box.clientHeight;
    const on = () => {
      if (!mq.matches || rm.matches) return false;
      if (vh() > MAX_VH) return false;
      if (box.scrollHeight <= vh() + 8) return false;
      if (block && box.querySelector(block)) return false;
      return true;
    };
    const secs = () => Array.from(box.querySelectorAll(selector)).filter((el) => el.getClientRects().length > 0);
    const rect = (el) => {
      const top = box.getBoundingClientRect().top;
      const r = el.getBoundingClientRect();
      return { top: r.top - top, bottom: r.bottom - top, height: r.height };
    };
    const current = (list) => {
      const h = vh();
      if (box.scrollTop <= 2) return 0;
      if (box.scrollTop >= box.scrollHeight - h - 2) return list.length - 1;
      let best = 0;
      let bestV = -1;
      list.forEach((el, i) => {
        const r = rect(el);
        const v = Math.min(r.bottom, h) - Math.max(r.top, 0);
        if (v > bestV + 1) {
          bestV = v;
          best = i;
        }
      });
      return best;
    };
    const innerScroll = (target, dir) => {
      let el = target && target.nodeType === 1 ? target : null;
      while (el && el !== box) {
        const oy = getComputedStyle(el).overflowY;
        if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
          if (dir > 0 && el.scrollTop + el.clientHeight < el.scrollHeight - 1) return true;
          if (dir < 0 && el.scrollTop > 0) return true;
        }
        el = el.parentElement;
      }
      return false;
    };
    const fits = (el) => rect(el).height <= vh() + SLACK;
    const room = (el, dir) => {
      const r = rect(el);
      return Math.max(0, dir > 0 ? r.bottom - vh() : -r.top);
    };
    const inside = (list, i, dir) => {
      const el = list[i];
      return Boolean(el) && !fits(el) && room(el, dir) > FIT;
    };
    const targetY = (list, i, dir) => {
      const h = vh();
      const maxY = box.scrollHeight - h;
      if (i <= 0) return 0;
      if (i >= list.length - 1) return maxY;
      const r = rect(list[i]);
      const y = box.scrollTop;
      const t = r.height <= h + FIT ? y + r.top + r.height / 2 - h / 2 : r.height <= h + SLACK || dir > 0 ? y + r.top : y + r.bottom - h;
      return Math.max(0, Math.min(maxY, Math.round(t)));
    };
    const glide = (to, ms, idx = -1, dir = 0, v0 = 0) => {
      const from = box.scrollTop;
      const delta = to - from;
      if (Math.abs(delta) < 1 && Math.abs(v0) < 0.05) return;
      const dur = ms ?? Math.min(1000, Math.max(720, 620 + Math.abs(delta) * 0.2));
      const t0 = performance.now();
      let lastPos = from;
      let lastAt = t0;
      glideIdx = idx;
      glideDir = dir;
      const step = (now) => {
        const p = Math.max(0, Math.min(1, (now - t0) / dur));
        const pos = v0 ? hermite(from, delta, v0 * dur, p) : from + delta * ease(p);
        box.scrollTop = pos;
        vel = (pos - lastPos) / Math.max(1, now - lastAt);
        lastPos = pos;
        lastAt = now;
        if (p < 1) {
          anim = requestAnimationFrame(step);
          return;
        }
        anim = 0;
        vel = 0;
        glideIdx = -1;
      };
      if (anim) cancelAnimationFrame(anim);
      anim = requestAnimationFrame(step);
    };
    const go = (list, i, dir) => {
      const idx = Math.max(0, Math.min(list.length - 1, i));
      glide(targetY(list, idx, dir), undefined, idx, dir);
    };
    const chain = (dir) => {
      if (glideIdx < 0) return false;
      const list = secs();
      const base = list[glideIdx];
      const next = glideIdx + dir;
      if (!base || next < 0 || next >= list.length) return false;
      if (dir === glideDir && !fits(base)) return false;
      if (Math.abs(next - current(list)) > LEAD) return false;
      const to = targetY(list, next, dir);
      glide(to, Math.min(950, Math.max(450, 380 + Math.abs(to - box.scrollTop) * 0.22)), next, dir, vel);
      return true;
    };

    const onWheel = (e) => {
      if (e.ctrlKey || !on()) return;
      const dy = pixels(e, vh());
      if (!dy || Math.abs(dy) < Math.abs(e.deltaX)) return;
      const now = e.timeStamp || performance.now();
      const mag = Math.abs(dy);
      const dir = dy > 0 ? 1 : -1;
      const gap = now - gesture.at;
      const recent = gesture.recent;
      const fading = recent.length >= 2 && recent[recent.length - 1] <= recent[recent.length - 2];
      const surge = fading && mag > 8 && mag > 1.6 * Math.max(...recent);
      const push = notched(e, dy) ? now - pushAt >= NOTCH_GAP : (gap >= PUSH_GAP || surge) && now - pushAt >= PUSH_MIN;
      if (gap > GAP) gesture = { at: now, mode: "", sum: 0, recent: [] };
      gesture.at = now;
      gesture.recent = [...gesture.recent.slice(-2), mag];

      if (anim) {
        e.preventDefault();
        gesture.mode = "glide";
        if (push && chain(dir)) pushAt = now;
        return;
      }
      if (gesture.mode === "glide") {
        if (!push) {
          e.preventDefault();
          return;
        }
        gesture = { at: now, mode: "", sum: 0, recent: [mag] };
      }
      if (!gesture.mode && innerScroll(e.target, dir)) gesture.mode = "inner";
      if (gesture.mode === "inner") return;

      const list = secs();
      if (list.length < 2) return;
      const cur = current(list);

      if (!gesture.mode || gesture.mode === "native") {
        if (inside(list, cur, dir)) {
          gesture.mode = "native";
          const left = room(list[cur], dir);
          if (mag > left + FIT) {
            e.preventDefault();
            glide(box.scrollTop + dir * left, NUDGE_MS);
          }
          return;
        }
        if (gesture.mode === "native") {
          e.preventDefault();
          return;
        }
      }

      e.preventDefault();
      if (gesture.mode) return;
      gesture.sum = Math.sign(gesture.sum) === dir ? gesture.sum + dy : dy;
      if (Math.abs(gesture.sum) < TRIGGER) return;
      gesture.mode = "glide";
      pushAt = now;
      go(list, cur + dir, dir);
    };

    const onKey = (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || !on()) return;
      const t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|IFRAME)$/.test(t.tagName))) return;
      const list = secs();
      if (list.length < 2) return;
      let dir = 0;
      if (e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !e.shiftKey)) dir = 1;
      else if (e.key === "ArrowUp" || e.key === "PageUp" || (e.key === " " && e.shiftKey)) dir = -1;
      else if (e.key === "Home" || e.key === "End") {
        e.preventDefault();
        if (!anim) go(list, e.key === "Home" ? 0 : list.length - 1, e.key === "Home" ? -1 : 1);
        return;
      }
      if (!dir) return;
      e.preventDefault();
      const now = performance.now();
      if (anim) {
        if (now - pushAt >= KEY_GAP && chain(dir)) pushAt = now;
        return;
      }
      const cur = current(list);
      if (inside(list, cur, dir)) {
        const stepPx = e.key.startsWith("Arrow") ? 160 : Math.round(vh() * 0.8);
        glide(box.scrollTop + dir * Math.min(stepPx, room(list[cur], dir)), STEP_MS);
        return;
      }
      pushAt = now;
      go(list, cur + dir, dir);
    };

    const onScroll = () => {
      if (scrollRaf || resizing) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        if (resizing) return;
        const list = secs();
        if (list.length) lastIdx = current(list);
      });
    };

    const onResize = () => {
      resizing = true;
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        resizing = false;
        if (!on() || anim) return;
        const list = secs();
        if (list.length < 2) return;
        const i = Math.min(lastIdx, list.length - 1);
        if (!fits(list[i])) return;
        const to = targetY(list, i, 1);
        if (Math.abs(to - box.scrollTop) > 1) box.scrollTop = to;
      }, 160);
    };

    const toEl = (el) => {
      const list = secs();
      if (!el || !list.length) return;
      const i = list.findIndex((s) => s === el || s.contains(el) || el.contains(s));
      if (i < 0) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      go(list, i, i >= current(list) ? 1 : -1);
    };

    box.addEventListener("wheel", onWheel, { passive: false });
    box.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    api.current = { on, toEl };
    return () => {
      box.removeEventListener("wheel", onWheel);
      box.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(scrollRaf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeT);
      if (anim) cancelAnimationFrame(anim);
      api.current = null;
    };
  }, [containerRef, selector, block]);

  return api;
}
