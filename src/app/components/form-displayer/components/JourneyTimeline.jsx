import { Check, Clock, Pause, X } from "lucide-react";

const MARK_TONE = {
  done: "border-emerald-400/30 bg-emerald-400/10 text-emerald-400",
  review: "border-amber-400/30 bg-amber-400/10 text-amber-400",
  declined: "border-red-400/30 bg-red-400/10 text-red-300",
  paused: "border-white/15 bg-white/5 text-neutral-400",
  current: "border-skylab-400/40 bg-skylab-500/10 text-skylab-300",
  future: "border-dashed border-neutral-700 bg-transparent",
};

function Mark({ tone, number }) {
  return (
    <span className={`grid size-6 place-items-center rounded-md border text-2xs font-semibold ${MARK_TONE[tone] ?? MARK_TONE.future}`}>
      {tone === "done" && <Check size={13} strokeWidth={2.5} />}
      {tone === "review" && <Clock size={13} strokeWidth={2.2} />}
      {tone === "declined" && <X size={13} strokeWidth={2.5} />}
      {tone === "paused" && <Pause size={11} strokeWidth={2.2} />}
      {tone === "current" && number}
    </span>
  );
}

export function ReviewNote({ note, date, className = "" }) {
  if (!note) return null;

  return (
    <div className={`relative text-left before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:rounded-full before:bg-neutral-700 ${className}`}>
      <p className="text-2xs text-neutral-500">{date ? `Ekibin notu · ${date}` : "Ekibin notu"}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-neutral-200">{note}</p>
    </div>
  );
}

export default function JourneyTimeline({ items, className = "" }) {
  if (!items?.length) return null;

  return (
    <ol className={`w-full max-w-88 text-left ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isFuture = item.tone === "future";

        return (
          <li key={item.key ?? index} className={`relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-3 ${isLast ? "" : "pb-4.5"}`}>
            {(!isLast || item.note) && (
              <span aria-hidden className={`absolute left-3 top-7.5 w-px -translate-x-1/2 bg-white/10 ${isLast ? "bottom-0" : "bottom-1.5"}`} />
            )}
            <Mark tone={item.tone} number={item.number} />
            <div className="min-w-0">
              <div className="flex items-baseline justify-between gap-3 pt-0.5">
                <span className={`text-sm ${isFuture ? "text-neutral-400" : "font-medium text-neutral-100"}`}>{item.title}</span>
                {item.date && <span className="shrink-0 text-2xs tabular-nums text-neutral-500">{item.date}</span>}
              </div>
              {item.detail && <p className="mt-px text-xs leading-5 text-neutral-400">{item.detail}</p>}
              {item.note && <ReviewNote note={item.note} className="-ml-6.25 mt-2.5 pl-6.25" />}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
