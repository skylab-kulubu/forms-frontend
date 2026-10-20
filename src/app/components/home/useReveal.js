"use client";

import { useEffect } from "react";

export function useReveal(containerRef) {
  useEffect(() => {
    const box = containerRef.current;
    if (!box || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      },
      { root: box, rootMargin: "0px 0px -12% 0px" }
    );

    const top = box.getBoundingClientRect().top;
    const limit = box.clientHeight * 0.88;
    for (const el of box.querySelectorAll("[data-rv]")) {
      const r = el.getBoundingClientRect();
      if (r.top - top < limit && r.bottom - top > 0) el.classList.add("is-in");
      else io.observe(el);
    }
    box.classList.add("is-armed");

    return () => {
      io.disconnect();
      box.classList.remove("is-armed");
    };
  }, [containerRef]);
}
