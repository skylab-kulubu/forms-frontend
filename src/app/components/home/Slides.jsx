"use client";

import { Children, useEffect, useRef } from "react";
import { useReducedMotion } from "./useInView";
import "./slides.css";

export default function Slides({ index, onIndex, link = null, className = "", children }) {
  const ref = useRef(null);
  const settle = useRef(0);
  const reduce = useReducedMotion();
  const items = Children.toArray(children);

  useEffect(() => {
    const track = ref.current;
    const el = track?.children[index];
    if (!el || track.scrollWidth <= track.clientWidth + 1) return;
    const left = el.offsetLeft + el.offsetWidth / 2 - track.clientWidth / 2;
    if (Math.abs(track.scrollLeft - left) > 1) track.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  }, [index, reduce]);

  useEffect(() => () => clearTimeout(settle.current), []);

  const onScroll = () => {
    clearTimeout(settle.current);
    settle.current = setTimeout(() => {
      const track = ref.current;
      if (!track) return;
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = index;
      let gap = Infinity;
      [...track.children].forEach((el, i) => {
        const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
        if (d < gap) {
          gap = d;
          best = i;
        }
      });
      if (best !== index) onIndex(best);
    }, 140);
  };

  return (
    <div ref={ref} className={`hm-slides ${className}`.trim()} onScroll={onScroll}>
      {items.map((item, i) => (
        <div
          key={i}
          className={i === index ? "hm-slide is-on" : "hm-slide"}
          onPointerDown={i === index ? undefined : () => onIndex(i)}
        >
          {item}
          {i < items.length - 1 && link}
        </div>
      ))}
    </div>
  );
}
