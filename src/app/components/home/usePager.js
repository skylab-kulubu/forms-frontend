"use client";

import { useEffect, useRef } from "react";
import { remember } from "./scrollMemo";

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
const FREE_TAU = { notch: 0.085, fine: 0.035, key: 0.11 };
const FREE_REST = 420;
const FREE_KEY = { tap: 110, hold: 26, page: 0.85, pageMs: 560 };

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
    let glideTo = 0;
    let vel = 0;
    let pushAt = -Infinity;
    let leaving = false;
    let leftAt = -Infinity;
    let gesture = { at: -Infinity, mode: "", sum: 0, recent: [] };
    const free = { raf: 0, target: 0, pos: 0, set: 0, last: 0, tau: FREE_TAU.notch, restAt: -Infinity };

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
    const isFree = (el) => Boolean(el) && el.hasAttribute("data-free") && !fits(el);
    const span = (el) => {
      const r = rect(el);
      const y = box.scrollTop;
      return { start: Math.round(y + r.top), end: Math.round(y + r.bottom - vh()) };
    };
    const stopFree = () => {
      if (free.raf) cancelAnimationFrame(free.raf);
      free.raf = 0;
    };
    const follow = (now) => {
      free.raf = 0;
      if (Math.abs(box.scrollTop - free.set) > 2) return;
      const dt = Math.min(0.25, Math.max(0.001, (now - free.last) / 1000));
      free.last = now;
      free.pos += (free.target - free.pos) * (1 - Math.exp(-dt / free.tau));
      if (Math.abs(free.target - free.pos) < 0.5) free.pos = free.target;
      box.scrollTop = free.pos;
      free.set = box.scrollTop;
      remember(box);
      if (free.pos !== free.target) free.raf = requestAnimationFrame(follow);
    };
    const drive = (to, tau) => {
      if (!free.raf) {
        free.pos = box.scrollTop;
        free.set = free.pos;
        free.last = performance.now();
        free.raf = requestAnimationFrame(follow);
      }
      free.target = to;
      free.tau = tau;
    };
    const reach = (el, dir) => {
      const { start, end } = span(el);
      const from = free.raf ? free.target : box.scrollTop;
      return { start, end, from, left: dir > 0 ? end - from : from - start };
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
    const pinned = (from, to, land) => {
      const el = secs().find((item) => isFree(item));
      if (!el) return null;
      const { start, end } = span(el);
      if (to > end + 1 && from < end - 1) return { at: Math.max(from, start), to: end };
      if (to < start - 1 && from > start + 1) return { at: Math.min(from, end), to: start };
      if (land && to >= start && to <= end) {
        if (from < start - 1) return { at: start, to };
        if (from > end + 1) return { at: end, to };
      }
      return null;
    };
    const glide = (to, ms, idx = -1, dir = 0, v0 = 0, land = false) => {
      stopFree();
      const from = box.scrollTop;
      const skip = pinned(from, to, land);
      const lead = skip ? skip.at - from : 0;
      const delta = to - from - (skip ? skip.to - skip.at : 0);
      if (Math.abs(delta) < 1 && Math.abs(v0) < 0.05) {
        if (skip) {
          box.scrollTop = to;
          remember(box);
        }
        return;
      }
      const dur = ms ?? Math.min(1000, Math.max(720, 620 + Math.abs(delta) * 0.2));
      const t0 = performance.now();
      let lastOff = 0;
      let lastAt = t0;
      glideIdx = idx;
      glideDir = dir;
      glideTo = to;
      const step = (now) => {
        const p = Math.max(0, Math.min(1, (now - t0) / dur));
        const off = v0 ? hermite(0, delta, v0 * dur, p) : delta * ease(p);
        box.scrollTop = !skip || Math.abs(off) < Math.abs(lead) ? from + off : skip.to + off - lead;
        remember(box);
        vel = (off - lastOff) / Math.max(1, now - lastAt);
        lastOff = off;
        lastAt = now;
        if (p < 1) {
          anim = requestAnimationFrame(step);
          return;
        }
        anim = 0;
        vel = 0;
        glideIdx = -1;
        if (leaving) {
          leaving = false;
          leftAt = performance.now();
        }
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
      if (!anim && now <= leftAt) {
        e.preventDefault();
        return;
      }
      const mag = Math.abs(dy);
      const dir = dy > 0 ? 1 : -1;
      const gap = now - gesture.at;
      const recent = gesture.recent;
      const fading = recent.length >= 2 && recent[recent.length - 1] <= recent[recent.length - 2];
      const surge = fading && mag > 8 && mag > 1.6 * Math.max(...recent);
      const notch = notched(e, dy);
      const push = notch ? now - pushAt >= NOTCH_GAP : (gap >= PUSH_GAP || surge) && now - pushAt >= PUSH_MIN;
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

      if (isFree(list[cur]) && (!gesture.mode || gesture.mode === "free")) {
        const { start, end, from, left } = reach(list[cur], dir);
        if (left > FIT) {
          e.preventDefault();
          gesture.mode = "free";
          const to = dir > 0 ? Math.min(end, from + dy) : Math.max(start, from + dy);
          if (to === (dir > 0 ? end : start)) free.restAt = now;
          drive(to, notch ? FREE_TAU.notch : FREE_TAU.fine);
          return;
        }
        if (now - free.restAt < FREE_REST) {
          e.preventDefault();
          free.restAt = now;
          gesture.mode = "free";
          return;
        }
        if (gesture.mode === "free") gesture = { at: now, mode: "", sum: 0, recent: [mag] };
      }

      if (!gesture.mode || gesture.mode === "native") {
        if (!isFree(list[cur]) && inside(list, cur, dir)) {
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
      if (isFree(list[cur])) {
        glide(targetY(list, Math.max(0, Math.min(list.length - 1, cur + dir)), dir), undefined, -1, dir);
        leaving = true;
      } else go(list, cur + dir, dir);
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
      if (isFree(list[cur])) {
        const { start, end, from, left } = reach(list[cur], dir);
        if (left > FIT) {
          if (e.key.startsWith("Arrow")) {
            const step = e.repeat ? FREE_KEY.hold : FREE_KEY.tap;
            drive(dir > 0 ? Math.min(end, from + step) : Math.max(start, from - step), FREE_TAU.key);
          } else {
            glide(box.scrollTop + dir * Math.min(Math.round(vh() * FREE_KEY.page), left), FREE_KEY.pageMs);
          }
          return;
        }
        if (e.repeat) return;
      } else if (inside(list, cur, dir)) {
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
        if (Math.abs(to - box.scrollTop) > 1) {
          box.scrollTop = to;
          remember(box);
        }
      }, 160);
    };

    const toEl = (el) => {
      const list = secs();
      if (!el || !list.length) return;
      const i = list.findIndex((s) => s === el || s.contains(el) || el.contains(s));
      if (i < 0 || rm.matches) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (on()) {
        go(list, i, i >= current(list) ? 1 : -1);
        return;
      }
      const margin = parseFloat(getComputedStyle(list[i]).scrollMarginTop) || 0;
      const y = i === 0 ? 0 : box.scrollTop + rect(list[i]).top - margin;
      glide(Math.max(0, Math.min(box.scrollHeight - vh(), Math.round(y))));
    };

    const toY = (y, land = false) => {
      const to = Math.max(0, Math.min(box.scrollHeight - vh(), Math.round(y)));
      glide(to, land ? undefined : Math.min(1200, Math.max(620, 520 + Math.abs(to - box.scrollTop) * 0.12)), -1, 0, 0, land);
    };

    box.addEventListener("wheel", onWheel, { passive: false });
    box.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    api.current = { on: () => on() || secs().some(isFree), paging: on, toEl, toY, aim: () => (anim ? glideTo : null) };
    return () => {
      box.removeEventListener("wheel", onWheel);
      box.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(scrollRaf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
      clearTimeout(resizeT);
      stopFree();
      if (anim) cancelAnimationFrame(anim);
      api.current = null;
    };
  }, [containerRef, selector, block]);

  return api;
}
