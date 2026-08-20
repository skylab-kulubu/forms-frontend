"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

const VIEWPORT_PADDING = 8;

function resolveAnchor(anchor) {
  const target = anchor && "current" in anchor ? anchor.current : anchor;
  if (!target) return null;
  if (typeof target.getBoundingClientRect === "function") {
    const isElement = target.nodeType === 1;
    return { node: isElement ? target : null, rect: target.getBoundingClientRect() };
  }
  const { top, left, width = 0, height = 0 } = target;
  if (typeof top !== "number" || typeof left !== "number") return null;
  return { node: null, rect: { top, left, width, height, bottom: top + height, right: left + width } };
}

export function Floating({ anchor, onDismiss, placement = "bottom-start", offset = 8, matchWidth = false, className = "", children }) {
  const floatingRef = useRef(null);

  const applyPosition = useCallback(() => {
    const resolved = resolveAnchor(anchor);
    const floating = floatingRef.current;
    if (!resolved || !floating) return;

    const { rect } = resolved;
    if (matchWidth) floating.style.width = `${rect.width}px`;

    const width = floating.offsetWidth;
    const height = floating.offsetHeight;

    const spaceBelow = window.innerHeight - rect.bottom - offset;
    const spaceAbove = rect.top - offset;
    const wantsTop = placement.startsWith("top");
    const flip = wantsTop
      ? spaceAbove < height && spaceBelow > spaceAbove
      : spaceBelow < height && spaceAbove > spaceBelow;
    const onTop = wantsTop !== flip;

    const rawTop = onTop ? rect.top - height - offset : rect.bottom + offset;
    const maxTop = window.innerHeight - height - VIEWPORT_PADDING;
    const top = Math.min(Math.max(rawTop, VIEWPORT_PADDING), Math.max(maxTop, VIEWPORT_PADDING));

    const rawLeft = placement.endsWith("end") ? rect.right - width : rect.left;
    const maxLeft = window.innerWidth - width - VIEWPORT_PADDING;
    const left = Math.min(Math.max(rawLeft, VIEWPORT_PADDING), Math.max(maxLeft, VIEWPORT_PADDING));

    floating.style.top = `${top}px`;
    floating.style.left = `${left}px`;
    floating.style.visibility = "visible";
  }, [anchor, matchWidth, offset, placement]);

  useLayoutEffect(() => {
    applyPosition();
  });

  useEffect(() => {
    let frame = null;
    const schedule = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        applyPosition();
      });
    };

    window.addEventListener("scroll", schedule, true);
    window.addEventListener("resize", schedule);

    const observer = new ResizeObserver(schedule);
    if (floatingRef.current) observer.observe(floatingRef.current);
    const resolved = resolveAnchor(anchor);
    if (resolved?.node) observer.observe(resolved.node);

    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, true);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, [anchor, applyPosition]);

  useEffect(() => {
    if (!onDismiss) return;

    const onPointerDown = (event) => {
      const floating = floatingRef.current;
      if (floating && floating.contains(event.target)) return;
      const resolved = resolveAnchor(anchor);
      if (resolved?.node && resolved.node.contains(event.target)) return;
      onDismiss();
    };

    const onKeyDown = (event) => {
      if (event.key === "Escape") onDismiss();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchor, onDismiss]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div ref={floatingRef} className={`fixed z-50 ${className}`} style={{ top: 0, left: 0, visibility: "hidden" }}>
      {children}
    </div>,
    document.body
  );
}
