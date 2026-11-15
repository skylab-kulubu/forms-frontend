"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "@skylab-kulubu/skylcn-ui";
import { Floating } from "./Floating";

const panelVariants = {
  hidden: { opacity: 0, scale: 0.97, y: -6 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.97, y: -4, transition: { duration: 0.15, ease: "easeIn" } },
};

const TEXT_BUTTON = "rounded-md px-2 py-1 text-2xs font-medium text-muted-foreground outline-hidden transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";

// skylcn's calendar in the anchored panel its callers open and close; skylcn's own DatePicker would bring its own trigger
export default function DatePicker({ value = null, onChange, onClose, anchor, className = "" }) {
  const [month, setMonth] = useState(() => value ?? new Date());
  // Callers build a new Date on every render, so the shown month follows the day itself, not the object
  const valueTime = value ? value.getTime() : null;
  const [seenTime, setSeenTime] = useState(valueTime);
  if (valueTime !== seenTime) {
    setSeenTime(valueTime);
    if (value) setMonth(value);
  }

  const handleToday = () => {
    const today = new Date();
    setMonth(today);
    onChange?.(today);
  };

  const handleClear = () => {
    onChange?.(null);
    onClose?.();
  };

  return (
    <Floating anchor={anchor} onDismiss={onClose}>
      <motion.div variants={panelVariants} initial="hidden" animate="visible" exit="exit" onMouseDown={(e) => e.stopPropagation()}
        className={`rounded-xl border border-border bg-popover p-3 text-foreground shadow-overlay ${className}`}
      >
        <Calendar entrance mode="single" required selected={value ?? undefined} month={month} onMonthChange={setMonth}
          onSelect={(day) => {
            if (!day) return;
            onChange?.(day);
            onClose?.();
          }}
        />
        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border-subtle pt-2">
          <button type="button" onClick={handleToday} className={TEXT_BUTTON}>Bugün</button>
          <button type="button" onClick={handleClear} className={TEXT_BUTTON}>Temizle</button>
        </div>
      </motion.div>
    </Floating>
  );
}
