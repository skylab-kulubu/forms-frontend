"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { FilePenLine, Flag } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";
import { formatDateTime, formatPersonName, noteOf, plainAnswer } from "./response-data";

export const RAIL_W = 208;
export const RAIL_GAP = 28;
export const RAIL_PAD = 24;
export const RAIL_EXTRA = RAIL_GAP + RAIL_W + 2 * RAIL_PAD;
export const RAIL_MIN_CARD = 560;

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

export default function MarginRail({ cardRef, notes, onHover }) {
  const [positions, setPositions] = useState({});
  const refs = useRef({});
  const notesRef = useRef(notes);
  const signature = notes.map((note) => note.key).join("|");

  useLayoutEffect(() => {
    notesRef.current = notes;
  });

  useLayoutEffect(() => {
    const card = cardRef.current;
    if (!card) return undefined;
    const measure = () => {
      const base = card.getBoundingClientRect().top;
      const next = {};
      let floor = 0;
      notesRef.current.forEach((note) => {
        const anchor = note.anchor ? card.querySelector(`[data-q="${CSS.escape(note.anchor)}"]`) : null;
        const target = anchor ? anchor.getBoundingClientRect().top - base + 16 : 40;
        const top = Math.max(target, floor);
        next[note.key] = Math.round(top);
        floor = top + (refs.current[note.key]?.offsetHeight ?? 0) + 20;
      });
      setPositions((current) => (JSON.stringify(current) === JSON.stringify(next) ? current : next));
    };
    const observer = new ResizeObserver(measure);
    observer.observe(card);
    Object.values(refs.current).forEach((element) => element && observer.observe(element));
    return () => observer.disconnect();
  }, [signature, cardRef]);

  return (
    <div className="relative h-full">
      {notes.map((note) => (
        <div key={note.key} ref={(element) => { refs.current[note.key] = element; }}
          onMouseEnter={() => onHover(note.anchor)} onMouseLeave={() => onHover(null)}
          className="absolute inset-x-0 transition-[top] duration-200"
          style={{ top: positions[note.key] ?? 0, visibility: positions[note.key] == null ? "hidden" : "visible" }}
        >
          {note.anchor ? <span aria-hidden="true" className="absolute top-2 h-px bg-sky-400/30" style={{ left: 4 - RAIL_GAP, width: RAIL_GAP - 8 }} /> : null}
          {note.node}
        </div>
      ))}
    </div>
  );
}
