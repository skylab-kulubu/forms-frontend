"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { motion, useIsPresent } from "framer-motion";

const NOTE_GAP = 16;
const NOTE_WIDTH = 256;
const NOTE_MIN = 200;
const RIGHT_EDGE = 20;
const LEFT_EDGE = 16;
const STACK_GAP = 14;
const BLOCK_INSET = 14;
const HEAD_INSET = 16;
const RELEASE_DELAY_MS = 70;
export const EASE = [0.22, 1, 0.36, 1];
export const EASE_CLASS = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const NOTE_MOTION = { hidden: {}, shown: {} };
const LINE_MOTION = {
  hidden: { scaleY: 0, transition: { duration: 0.16, ease: "easeIn", delay: 0.05 } },
  shown: (index) => ({ scaleY: 1, transition: { duration: 0.3, ease: EASE, delay: index * 0.03 } }),
};
const BODY_MOTION = {
  hidden: { opacity: 0, x: -8, transition: { duration: 0.13 } },
  shown: (index) => ({ opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE, delay: 0.07 + index * 0.03 } }),
};

function fitBoard(pageWidth, cardWidth) {
  const free = (pageWidth - cardWidth) / 2;
  let missing = Math.max(0, NOTE_WIDTH - (free - NOTE_GAP - RIGHT_EDGE));
  const clear = Math.min(missing, Math.max(0, free - LEFT_EDGE));
  missing -= clear;
  const trim = Math.min(missing, NOTE_WIDTH - NOTE_MIN);
  return { push: Math.round(clear + missing - trim), width: NOTE_WIDTH - trim };
}

export function boardFits(pageWidth, cardWidth) {
  return fitBoard(pageWidth, cardWidth).push <= (pageWidth - cardWidth) / 2;
}

export function useBoardPush({ onBoard, scrollRef, cardRef, pushRef, sideRef, insetRef = null }) {
  const applyFit = useCallback(() => {
    const page = scrollRef.current;
    const card = cardRef.current;
    const push = pushRef.current;
    if (!page || !card || !push) return;
    const fit = fitBoard(page.clientWidth, card.offsetWidth);
    push.style.transform = fit.push ? `translateX(${-fit.push}px)` : "";
    if (insetRef?.current) {
      const hidden = fit.push - (page.clientWidth - card.offsetWidth) / 2;
      insetRef.current.style.paddingLeft = hidden > 0 ? `${Math.round(hidden + HEAD_INSET)}px` : "";
    }
    const side = sideRef.current;
    if (!side) return;
    side.style.left = `${card.offsetLeft + card.offsetWidth + NOTE_GAP}px`;
    side.style.width = `${fit.width}px`;
  }, [scrollRef, cardRef, pushRef, sideRef, insetRef]);

  useLayoutEffect(() => {
    if (!onBoard) return undefined;
    applyFit();
    const observer = new ResizeObserver(applyFit);
    if (scrollRef.current) observer.observe(scrollRef.current);
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [onBoard, applyFit, scrollRef, cardRef]);

  useEffect(() => {
    if (onBoard) return undefined;
    const timer = setTimeout(() => {
      if (pushRef.current) pushRef.current.style.transform = "";
      if (insetRef?.current) insetRef.current.style.paddingLeft = "";
    }, RELEASE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onBoard, pushRef, insetRef]);
}

export function placeBoardNotes(side, column, anchorOf, fallback = 0) {
  const base = column.getBoundingClientRect().top;
  const items = [...side.querySelectorAll("[data-board-note]")]
    .filter((element) => element.dataset.leaving !== "true")
    .map((element) => {
      const block = element.dataset.anchor ? anchorOf(element.dataset.anchor) : null;
      return {
        element,
        desired: block ? block.getBoundingClientRect().top - base + BLOCK_INSET : fallback,
        height: element.offsetHeight,
        focused: element.dataset.focused === "true",
      };
    })
    .sort((a, b) => a.desired - b.desired);

  const anchor = items.findIndex((item) => item.focused);
  if (anchor < 0) {
    items.forEach((item, index) => {
      item.top = index === 0 ? item.desired : Math.max(item.desired, items[index - 1].top + items[index - 1].height + STACK_GAP);
    });
  } else {
    items[anchor].top = items[anchor].desired;
    for (let index = anchor + 1; index < items.length; index += 1) items[index].top = Math.max(items[index].desired, items[index - 1].top + items[index - 1].height + STACK_GAP);
    for (let index = anchor - 1; index >= 0; index -= 1) items[index].top = Math.min(items[index].desired, items[index + 1].top - items[index].height - STACK_GAP);
  }
  items.forEach((item) => {
    const top = `${Math.round(item.top)}px`;
    if (item.element.style.top !== top) item.element.style.top = top;
  });

  const last = items[items.length - 1];
  return last ? Math.round(last.top + last.height + STACK_GAP) : 0;
}

export function BoardNote({ anchor = null, focused = false, index, inline = false, line, className = "", onResize, children, ...rest }) {
  const ref = useRef(null);
  const isPresent = useIsPresent();

  useEffect(() => {
    const element = ref.current;
    if (!element || !onResize) return undefined;
    const observer = new ResizeObserver(onResize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onResize]);

  return (
    <motion.div ref={ref} data-board-note="true" data-anchor={anchor ?? undefined} data-focused={focused} data-leaving={!isPresent}
      variants={NOTE_MOTION} initial="hidden" animate="shown" exit="hidden" {...rest}
      className={`group/note pointer-events-auto pl-3.5 ${inline ? "relative" : `absolute inset-x-0 transition-[top] duration-300 ${EASE_CLASS}`} ${className}`}
    >
      <motion.span variants={LINE_MOTION} custom={index} className={`absolute inset-y-0 left-0 w-0.5 origin-top rounded-full transition-colors duration-150 ${line}`} />
      <motion.div variants={BODY_MOTION} custom={index}>{children}</motion.div>
    </motion.div>
  );
}
