"use client";

import { AnimatePresence, motion } from "framer-motion";
import RoomSheet from "./RoomSheet";

export const INSPECTOR_HEADER = "flex h-10 min-w-0 shrink-0 items-center border-b border-neutral-800 px-4 text-sm font-semibold tracking-wide";

function RoomToast({ toast }) {
  return (
    <AnimatePresence>
      {toast ? (
        <motion.div key={toast.id} role="status"
          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }}
          className="pointer-events-none absolute left-1/2 top-3 z-[70] max-w-[90%] -translate-x-1/2 truncate rounded-lg border border-white/10 bg-neutral-800 px-3 py-1.5 text-2xs text-neutral-200 shadow-xl"
        >
          {toast.text}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export default function RoomFrame({
  centerRef, outline, center, toolbar, inspectorHeader = null, inspector = null, inspectorWidth = "flex-[0_1_440px]",
  leftDocked = false, rightDocked = false, sheet = null, onCloseSheet, toast = null, overlays = null,
}) {
  const blocked = Boolean(sheet);
  const inspectorBody = inspector ? (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain scrollbar">{inspector}</div>
  ) : null;

  return (
    <div data-room className="relative flex h-[calc(100dvh-57px)] min-h-0 flex-col md:h-[calc(100dvh-3.5rem)]">
      <div className="relative flex min-h-0 flex-1">
        {leftDocked ? (
          <aside inert={blocked} className="flex h-full min-w-60 flex-[0_1_304px] flex-col py-2 pl-2">
            <div className="relative flex h-full min-h-0 flex-col">{outline("dock")}</div>
          </aside>
        ) : null}

        <main inert={blocked} className="relative min-w-0 flex-[1_1_784px] py-2">
          <div ref={centerRef} data-room-center className="relative h-full overflow-hidden rounded-xl">
            {center}
            {toolbar}
          </div>
        </main>

        {inspector && rightDocked ? (
          <aside inert={blocked} className={`flex h-full min-w-80 flex-col py-2 pr-2 ${inspectorWidth}`}>
            <div className="relative flex h-full min-h-0 flex-col">
              <div className={INSPECTOR_HEADER}>{inspectorHeader}</div>
              {inspectorBody}
            </div>
          </aside>
        ) : null}

        <RoomSheet open={sheet === "left" && !leftDocked} onClose={onCloseSheet} label="Sol panel" side="left">{outline("sheet")}</RoomSheet>
        {inspector ? (
          <RoomSheet open={sheet === "right" && !rightDocked} onClose={onCloseSheet} label="Sağ panel" side="right"
            header={<div className={INSPECTOR_HEADER}>{inspectorHeader}</div>}
          >
            {inspectorBody}
          </RoomSheet>
        ) : null}

        <RoomToast toast={toast} />
        {overlays}
      </div>
    </div>
  );
}
