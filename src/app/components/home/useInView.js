"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { useScrollContainer } from "./scroll";

export function useInView(ref, { margin = "0px", once = false, threshold = 0 } = {}) {
  const scrollRef = useScrollContainer();
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (once && entry.isIntersecting) io.disconnect();
      },
      { root: scrollRef?.current ?? null, rootMargin: margin, threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, scrollRef, margin, once, threshold]);

  return inView;
}

export function useMedia(query) {
  const subscribe = useCallback(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    [query]
  );
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches, () => false);
}

export function useReducedMotion() {
  return useMedia("(prefers-reduced-motion: reduce)");
}
