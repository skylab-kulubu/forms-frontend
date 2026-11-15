"use client";

import { useEffect, useState } from "react";
import { useHome } from "./HomeContext";
import { scrollToSection } from "./usePager";
import { sceneName, useTourState, useTourStore } from "./tour/tourStore";

function sectionsOf(box) {
  return [...box.querySelectorAll("[data-page]")].filter((el) => el.getClientRects().length > 0);
}

function labelOf(el) {
  return el.getAttribute("aria-label") || el.querySelector("h1, h2")?.textContent?.trim() || "";
}

const stateOf = (i, active) => (i < active ? "is-done" : i === active ? "is-on" : undefined);

export default function PageRail({ containerRef }) {
  const { pager } = useHome();
  const store = useTourStore();
  const tour = useTourState();
  const [rail, setRail] = useState({ labels: [], active: 0, tour: -1 });

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
      const tourAt = list.findIndex((el) => el.hasAttribute("data-free"));
      setRail((prev) => (prev.active === active && prev.tour === tourAt && prev.labels.join("|") === labels.join("|") ? prev : { labels, active, tour: tourAt }));
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    schedule();
    box.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const sizes = new ResizeObserver(schedule);
    sizes.observe(box.querySelector(".hm-body") ?? box);
    return () => {
      box.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      sizes.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [containerRef]);

  const go = (i) => (e) => {
    if (e.detail > 0) e.currentTarget.blur();
    const box = containerRef.current;
    const el = box ? sectionsOf(box)[i] : null;
    if (el) scrollToSection(pager, el);
  };

  const goScene = (j) => (e) => {
    if (e.detail > 0) e.currentTarget.blur();
    store.actions.go?.(j);
  };

  const scenes = tour.captions;
  return (
    <nav className="hm-rail" aria-label="Sayfadaki bölümler">
      {rail.labels.map((label, i) => {
        const tick = (
          <button
            key={label || i}
            type="button"
            className={stateOf(i, rail.active)}
            aria-label={label}
            aria-current={i === rail.active ? "true" : undefined}
            onClick={go(i)}
          >
            <i />
          </button>
        );
        if (i !== rail.tour || !scenes.length) return tick;
        const open = i === rail.active && tour.state === "open";
        return (
          <div key="tour" className={open ? "tour-rail is-open" : "tour-rail"} style={{ "--n": scenes.length }}>
            <button
              type="button"
              className={stateOf(i, rail.active)}
              aria-label={label}
              aria-hidden={open ? "true" : undefined}
              tabIndex={open ? -1 : undefined}
              onClick={go(i)}
            >
              <i />
            </button>
            <div className="tour-rail-scenes" role="group" aria-label="Turun bölümleri" aria-hidden={open ? undefined : "true"}>
              {scenes.map((scene, j) => (
                <button
                  key={scene.at}
                  type="button"
                  className={stateOf(j, tour.active)}
                  aria-label={sceneName(scenes, scene)}
                  aria-current={open && j === tour.active ? "true" : undefined}
                  tabIndex={open ? undefined : -1}
                  onClick={goScene(j)}
                >
                  <i />
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
