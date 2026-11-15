import { Check, Clock, Pause, PencilLine, X } from "lucide-react";
import { Timeline } from "@skylab-kulubu/skylcn-ui";

// forms' journey tones as skylcn marks; "future" is an upcoming step and "current" carries its number
const MARK = {
  done: { tone: "success", icon: Check },
  review: { tone: "warning", icon: Clock },
  declined: { tone: "danger", icon: X },
  paused: { tone: "neutral", icon: Pause },
  current: { tone: "brand" },
  returned: { tone: "info", icon: PencilLine },
};

export function ReviewNote({ note, date, className = "" }) {
  if (!note) return null;

  return (
    <div className={`relative text-left before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:rounded-full before:bg-border-strong ${className}`}>
      <p className="text-2xs text-subtle-foreground">{date ? `Ekibin notu · ${date}` : "Ekibin notu"}</p>
      <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-secondary-foreground">{note}</p>
    </div>
  );
}

function markOf(item) {
  if (item.tone === "current") return { ...MARK.current, marker: item.number, current: true };
  return MARK[item.tone] ?? { upcoming: true };
}

export default function JourneyTimeline({ items, className = "" }) {
  if (!items?.length) return null;

  return (
    <Timeline className={`w-full max-w-88 text-left ${className}`}
      items={items.map((item, index) => ({
        id: String(item.key ?? index),
        title: item.title,
        time: item.date ?? undefined,
        ...markOf(item),
        description: item.detail || item.note ? (
          <>
            {item.detail && <span className={item.tone === "returned" ? "text-info" : undefined}>{item.detail}</span>}
            {item.note && <ReviewNote note={item.note} className="mt-2 pl-3" />}
          </>
        ) : undefined,
      }))}
    />
  );
}
