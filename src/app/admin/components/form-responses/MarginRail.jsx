"use client";

import { useCallback, useEffect, useLayoutEffect } from "react";
import { AnimatePresence, MotionConfig } from "framer-motion";
import { FilePenLine, Flag } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";
import { BoardNote, placeBoardNotes } from "../form-studio/StudioBoard";
import { formatDateTime, formatPersonName, noteOf, plainAnswer } from "./response-data";

const REQUEST_INSET = 24;

export function Rail({ children, tone = "bg-neutral-700" }) {
  return (
    <div className="relative pl-3">
      <span className={`absolute inset-y-0 left-0 w-0.5 rounded-full ${tone}`} />
      {children}
    </div>
  );
}

export function RevisionNote({ previous }) {
  const count = previous.returnedQuestionIds?.length ?? 0;
  const reviewer = formatPersonName(previous.reviewer?.fullName) || "Ekipten biri";

  return (
    <div className="space-y-2.5">
      <p className="flex items-center gap-1.5 text-2xs font-medium text-sky-200/90"><FilePenLine size={12} className="shrink-0" />Düzeltme isteği</p>
      <div className="flex items-center gap-2.5">
        <Avatar name={previous.reviewer?.fullName ?? ""} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-2xs font-medium text-neutral-200">{reviewer}</p>
          <p className="text-3xs text-neutral-500">{formatDateTime(previous.reviewedAt)}</p>
        </div>
      </div>
      <p className="text-2xs leading-relaxed text-neutral-400">{previous.workflow?.round ?? 1}. gönderimde düzeltme istedi.</p>
      {noteOf(previous) ? (
        <Rail>
          <p className="text-3xs text-neutral-500">Not</p>
          <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-neutral-200">{noteOf(previous)}</p>
        </Rail>
      ) : null}
      {count ? <p className="flex items-center gap-1.5 text-3xs text-sky-200/80"><Flag size={11} className="shrink-0" />{count} soru işaretlenmişti</p> : null}
    </div>
  );
}

export function ChangeNote({ field, number, previous, previousAnswer, requested }) {
  const plain = ["file", "matrix", "repeater"].includes(field.type);

  return (
    <div className="space-y-2">
      <p className="flex flex-wrap items-center gap-1.5 text-3xs font-medium">
        <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-1.5 leading-4 text-sky-200">değişti</span>
        {requested ? <span className="inline-flex items-center gap-1 text-sky-300/80"><Flag size={10} />istenmişti</span> : null}
        <span className="text-neutral-600">{number}. soru</span>
      </p>
      <Rail>
        <p className="text-3xs text-neutral-500">{previous.workflow?.round ?? 1}. gönderimde</p>
        <p className="mt-0.5 line-clamp-6 whitespace-pre-wrap text-xs leading-relaxed text-neutral-400 wrap-anywhere">
          {plain ? "Farklı bir cevap vardı." : plainAnswer(field, previousAnswer)}
        </p>
      </Rail>
    </div>
  );
}

export default function MarginRail({ open, notes, sideRef, columnRef, onHover }) {
  const layout = useCallback(() => {
    const side = sideRef.current;
    const column = columnRef.current;
    if (!side || !column) return;
    const card = column.querySelector("[data-room-card]");
    const requestTop = card ? card.getBoundingClientRect().top - column.getBoundingClientRect().top + REQUEST_INSET : 0;
    placeBoardNotes(side, column, (id) => column.querySelector(`[data-q="${CSS.escape(id)}"]`), requestTop);
  }, [sideRef, columnRef]);

  useLayoutEffect(layout);

  useEffect(() => {
    const column = columnRef.current;
    if (!column) return undefined;
    const observer = new ResizeObserver(layout);
    observer.observe(column);
    return () => observer.disconnect();
  }, [columnRef, layout]);

  return (
    <aside ref={sideRef} aria-label="Kenar notları" className="pointer-events-none absolute top-0 z-20">
      <MotionConfig reducedMotion="user">
        <AnimatePresence onExitComplete={layout}>
          {open ? notes.map((note, index) => (
            <BoardNote key={note.key} anchor={note.anchor} index={index} onResize={layout} line={note.anchor ? "bg-neutral-700" : "bg-sky-400/50"}
              onMouseEnter={() => onHover(note.anchor)} onMouseLeave={() => onHover(null)}
            >
              <div className="relative">
                {note.anchor ? <span aria-hidden="true" className="absolute -left-7 top-2 h-px w-3 bg-neutral-700" /> : null}
                {note.node}
              </div>
            </BoardNote>
          )) : null}
        </AnimatePresence>
      </MotionConfig>
    </aside>
  );
}
