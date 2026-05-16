"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

export const ScrollContainerContext = createContext(null);
export const useScrollContainer = () => useContext(ScrollContainerContext);

/**
 * Gate for demo loops: returns true only when the target element is in (or near)
 * the viewport AND the user hasn't requested reduced motion. Pass a ref attached
 * to the demo's root element; wrap the demo's setTimeout cycle in
 * `useEffect(() => { if (!active) return; ... }, [active])` so it pauses cleanly
 * when scrolled out of view.
 */
export function useShouldAnimate(ref, { rootMargin = "200px" } = {}) {
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [ref, rootMargin]);
  return active;
}

export function Spotlight() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let pending = null;
    const flush = () => {
      raf = 0;
      if (!pending) return;
      el.style.setProperty("--mx", pending.x + "px");
      el.style.setProperty("--my", pending.y + "px");
      pending = null;
    };
    const onMove = (e) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!raf) raf = requestAnimationFrame(flush);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);
  return <div ref={ref} className="bg-spotlight" />;
}

export function useReveal(rootRef) {
  useEffect(() => {
    const root = rootRef?.current ?? null;
    const els = (root ?? document).querySelectorAll("[data-reveal], [data-stagger]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("on");
        }),
      { root, threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [rootRef]);
}

export function Magnetic({ children, strength = 0.25 }) {
  const inner = useRef(null);
  useEffect(() => {
    const el = inner.current;
    if (!el) return;
    const parent = el.parentElement;
    if (!parent) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) * strength;
      const dy = (e.clientY - (r.top + r.height / 2)) * strength;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const onLeave = () => {
      el.style.transform = "";
    };
    parent.addEventListener("mousemove", onMove);
    parent.addEventListener("mouseleave", onLeave);
    return () => {
      parent.removeEventListener("mousemove", onMove);
      parent.removeEventListener("mouseleave", onLeave);
    };
  }, [strength]);
  return (
    <span style={{ display: "inline-block", transition: "transform .25s cubic-bezier(.2,.7,.3,1)" }}>
      <span ref={inner} style={{ display: "inline-block", transition: "transform .15s cubic-bezier(.2,.7,.3,1)" }}>
        {children}
      </span>
    </span>
  );
}

export function CountUp({ to, suffix = "", duration = 1700, delay = 200 }) {
  const [v, setV] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let started = false;
    let raf = 0;
    let start = 0;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !started) {
          started = true;
          setTimeout(() => {
            raf = requestAnimationFrame(tick);
          }, delay);
          io.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) io.observe(ref.current);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [to, duration, delay]);
  return (
    <span ref={ref}>
      {v}
      {suffix && <span>{suffix}</span>}
    </span>
  );
}