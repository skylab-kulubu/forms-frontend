"use client";

import { useLayoutEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStudio } from "./StudioContext";
import StudioSheet from "./StudioSheet";

const INSPECTOR_HEADER = "flex h-10 min-w-0 shrink-0 items-center border-b border-neutral-800 px-4 text-sm font-semibold tracking-wide";
const INSPECTOR_GUTTER = 8;

function Toast() {
  const { ui } = useStudio();
  return (
    <AnimatePresence>
      {ui.toast ? (
        <motion.div key={ui.toast.id} role="status"
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}
          className={`pointer-events-none absolute left-1/2 top-3 z-40 max-w-[90%] -translate-x-1/2 truncate rounded-lg border px-3 py-1.5 text-2xs shadow-xl ${
            ui.toast.tone === "red" ? "border-red-400/30 bg-[#1f1414] text-red-200" : "border-white/10 bg-neutral-800 text-neutral-200"
          }`}
        >
          {ui.toast.text}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function StudioLayout({ outline, center, inspectorHeader, inspector, inspectorOpen = true, top = null, overlays = null }) {
  const { ui, actions: studio } = useStudio();
  const rootRef = useRef(null);
  const mainRef = useRef(null);
  const inspectorRef = useRef(null);
  const closeSheet = () => studio.setSheet(null);

  useLayoutEffect(() => {
    const measure = () => {
      const scroller = rootRef.current.querySelector("[data-studio-page]");
      const scrollbar = scroller ? scroller.offsetWidth - scroller.clientWidth : 0;
      rootRef.current.style.setProperty("--inspector-room", `${Math.max(inspectorRef.current.offsetWidth - INSPECTOR_GUTTER, 0)}px`);
      rootRef.current.style.setProperty("--canvas-width", `${mainRef.current.clientWidth - scrollbar}px`);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(mainRef.current);
    observer.observe(inspectorRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={rootRef} data-studio-root className="relative flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col">
      {top}
      <div className="relative flex min-h-0 flex-1">
        <aside className="hidden h-full min-w-60 flex-[0_1_304px] flex-col py-2 pl-2 xl:flex">
          <div className="relative flex h-full min-h-0 flex-col">{outline}</div>
        </aside>

        <main ref={mainRef} className="relative min-w-0 flex-[1_1_784px] py-2">
          <div data-studio-center className={`relative h-full rounded-xl ${inspectorOpen ? "overflow-hidden" : ""}`}>
            {center}
            <Toast />
          </div>
        </main>

        <aside ref={inspectorRef} inert={!inspectorOpen}
          className={`hidden h-full min-w-80 flex-[0_1_440px] flex-col py-2 pr-2 transition-opacity duration-200 ease-out motion-reduce:transition-none lg:flex ${inspectorOpen ? "" : "pointer-events-none opacity-0"}`}
        >
          <div className="relative flex h-full min-h-0 flex-col">
            <div className={INSPECTOR_HEADER}>{inspectorHeader}</div>
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar">{inspector}</div>
          </div>
        </aside>

        <StudioSheet open={ui.sheet === "outline"} onClose={closeSheet} label="Sorular">{outline}</StudioSheet>
        <StudioSheet open={ui.sheet === "inspector"} onClose={closeSheet} label="Ayarlar" header={<div className={INSPECTOR_HEADER}>{inspectorHeader}</div>}>
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar">{inspector}</div>
        </StudioSheet>
      </div>
      {overlays}
    </div>
  );
}
