"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useStudio } from "./StudioContext";
import StudioSheet from "./StudioSheet";

const INSPECTOR_HEADER = "flex h-10 min-w-0 shrink-0 items-center border-b border-neutral-800 px-4 text-sm font-semibold tracking-wide";

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

export default function StudioLayout({ outline, center, inspectorHeader, inspector, top = null, overlays = null }) {
  const { ui, actions: studio } = useStudio();
  const closeSheet = () => studio.setSheet(null);

  return (
    <div data-studio-root className="relative flex h-[calc(100dvh-3.5rem)] min-h-0 flex-col">
      {top}
      <div className="relative flex min-h-0 flex-1">
        <aside className="hidden h-full min-w-60 flex-[0_1_304px] flex-col py-2 pl-2 xl:flex">
          <div className="relative flex h-full min-h-0 flex-col">{outline}</div>
        </aside>

        <main className="relative min-w-0 flex-[1_1_784px] py-2">
          <div data-studio-center className="relative h-full overflow-hidden rounded-xl">
            {center}
            <Toast />
          </div>
        </main>

        <aside className="hidden h-full min-w-80 flex-[0_1_440px] flex-col py-2 pr-2 lg:flex">
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
