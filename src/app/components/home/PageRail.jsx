"use client";

import { useEffect, useState } from "react";
import { useHome } from "./HomeContext";
import { scrollToSection } from "./usePager";

function sectionsOf(box) {
  return [...box.querySelectorAll("[data-page]")].filter((el) => !el.classList.contains("sf") && el.getClientRects().length > 0);
}

function labelOf(el) {
  return el.getAttribute("aria-label") || el.querySelector("h1, h2")?.textContent?.trim() || "";
}

export default function PageRail({ containerRef }) {
  const { pager } = useHome();
  const [rail, setRail] = useState({ labels: [], active: 0 });

  useEffect(() => {
    const box = containerRef.current;
    if (!box) return undefined;
    let raf = 0;

    const measure = () => {
      raf = 0;
      const list = sectionsOf(box);
      const h = box.clientHeight;
      const top = box.getBoundingClientRect().top;
      let active = 0;
      let best = -1;
      list.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const seen = Math.min(r.bottom - top, h) - Math.max(r.top - top, 0);
        if (seen > best + 1) {
          best = seen;
          active = i;
        }
      });
      if (box.scrollTop >= box.scrollHeight - h - 2) active = list.length - 1;
      const labels = list.map(labelOf);
      setRail((prev) => (prev.active === active && prev.labels.join("|") === labels.join("|") ? prev : { labels, active }));
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    schedule();
    box.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      box.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(raf);
    };
  }, [containerRef]);

  const go = (i) => (e) => {
    if (e.detail > 0) e.currentTarget.blur();
    const box = containerRef.current;
    const el = box ? sectionsOf(box)[i] : null;
    if (el) scrollToSection(pager, el);
  };

  return (
    <nav className="hm-rail" aria-label="Sayfadaki bölümler">
      {rail.labels.map((label, i) => (
        <button
          key={label || i}
          type="button"
          className={i < rail.active ? "is-done" : i === rail.active ? "is-on" : undefined}
          aria-label={label}
          aria-current={i === rail.active ? "true" : undefined}
          onClick={go(i)}
        >
          <i />
        </button>
      ))}
    </nav>
  );
}
