"use client";

import { useCallback, useEffect, useRef } from "react";
import { reduced } from "./motion";

const GAP = 28;

export function useFollowReveal(scrollRef, contentRef, visibleFields) {
  const seenRef = useRef(null);
  const rafRef = useRef(0);
  const revealedAtRef = useRef(0);
  const pressRef = useRef(null);
  const ids = visibleFields.map((field) => field.id).join(",");

  const follow = useCallback((targets, anchor = null, active = null, base = null) => {
    const box = scrollRef.current;
    const list = targets.filter(Boolean);
    if (!box || !list.length) return;
    cancelAnimationFrame(rafRef.current);
    const start = performance.now();
    const instant = reduced();
    const h0 = base ?? (anchor ? anchor.getBoundingClientRect().height : 0);
    let calm = 0;
    let lastH = -1;
    const tick = () => {
      const live = list.filter((el) => el.isConnected);
      if (!live.length) return;
      const b = box.getBoundingClientRect();
      const rects = live.map((el) => el.getBoundingClientRect());
      const top = Math.min(...rects.map((r) => r.top));
      const bottom = Math.max(...rects.map((r) => r.bottom));
      let keep = Infinity;
      if (anchor?.isConnected) {
        const ar = anchor.getBoundingClientRect();
        let lead = ar.top;
        if (ar.height > b.height - GAP * 2 && active?.isConnected) lead = active.getBoundingClientRect().top - Math.max(0, ar.height - h0);
        keep = lead - (b.top + GAP);
      }
      const want = Math.min(bottom - (b.bottom - GAP), top - (b.top + GAP), keep);
      const left = box.scrollHeight - box.clientHeight - box.scrollTop;
      const step = want > 0.5 ? Math.min(left, instant ? want : Math.max(1, want * 0.18)) : 0;
      if (step > 0) box.scrollTop += step;
      const h = bottom - top;
      calm = step < 0.5 && Math.abs(h - lastH) < 0.5 ? calm + 1 : 0;
      lastH = h;
      if (calm < 6 && performance.now() - start < 1800) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [scrollRef]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  useEffect(() => {
    const list = ids ? ids.split(",") : [];
    const seen = seenRef.current;
    seenRef.current = new Set(list);
    if (!seen) return;
    const added = list.filter((id) => !seen.has(id));
    const content = contentRef.current;
    const box = scrollRef.current;
    if (!added.length || !content || !box) return;
    revealedAtRef.current = performance.now();
    const active = content.contains(document.activeElement) ? document.activeElement : null;
    let anchor = null;
    if (active) {
      const b = box.getBoundingClientRect();
      const shown = (el) => {
        const r = el.getBoundingClientRect();
        return r.top >= b.top + GAP - 1 && r.top <= b.bottom - GAP;
      };
      const field = active.closest("[data-field]");
      anchor = field && shown(field) ? field : shown(active) ? active : null;
    }
    const press = pressRef.current;
    follow([active, ...added.map((id) => content.querySelector(`[data-field="${id}"]`))], anchor, active, press?.field === anchor ? press.h : null);
  }, [ids, follow, contentRef, scrollRef]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;
    const mark = (e) => {
      const field = e.target.closest?.("[data-field]");
      pressRef.current = field ? { field, h: field.getBoundingClientRect().height } : null;
    };
    content.addEventListener("pointerdown", mark, true);
    content.addEventListener("keydown", mark, true);
    return () => {
      content.removeEventListener("pointerdown", mark, true);
      content.removeEventListener("keydown", mark, true);
    };
  }, [contentRef]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return undefined;
    let lastH = content.offsetHeight;
    const ro = new ResizeObserver(() => {
      const h = content.offsetHeight;
      const grew = h > lastH + 1;
      lastH = h;
      if (!grew || performance.now() - revealedAtRef.current < 1000) return;
      const active = document.activeElement;
      if (active && content.contains(active)) follow([active]);
    });
    ro.observe(content);
    return () => ro.disconnect();
  }, [follow, contentRef]);
}
