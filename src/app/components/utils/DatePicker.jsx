"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Undo2 } from "lucide-react";

const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",];
const weekdays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function startOfMonth(y, m) { return new Date(y, m, 1); }
function endOfMonth(y, m) { return new Date(y, m + 1, 0); }

function getCalendarMatrix(viewYear, viewMonth, firstDayOfWeek = 1) {
  const first = startOfMonth(viewYear, viewMonth);
  const last = endOfMonth(viewYear, viewMonth);
  const firstWeekDay = (first.getDay() + 7 - firstDayOfWeek) % 7; 
  const totalDays = last.getDate();

  const cells = [];

  for (let i = 0; i < firstWeekDay; i++) { 
    const d = new Date(viewYear, viewMonth, -i);
    cells.unshift({ date: d, inMonth: false });
  }
  for (let day = 1; day <= totalDays; day++) { 
    const d = new Date(viewYear, viewMonth, day);
    cells.push({ date: d, inMonth: true });
  }
  while (cells.length % 7 !== 0) { 
    const d = new Date(viewYear, viewMonth, totalDays + (cells.length - firstWeekDay - totalDays) + 1);
    cells.push({ date: d, inMonth: false });
  }
  while (cells.length < 42) {
    const lastCell = cells[cells.length - 1].date;
    const d = new Date(lastCell.getFullYear(), lastCell.getMonth(), lastCell.getDate() + 1);
    cells.push({ date: d, inMonth: false });
  }
  return cells;
}

const isSameDay = (a, b) => a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const panelVariants = {
  hidden: { opacity: 0, scale: 0.9, y: -8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, scale: 0.95, y: -4, transition: { duration: 0.15, ease: "easeIn" } },
};

const staggerContainerVariants = {
  hidden: {},
  visible: { transition: { delayChildren: 0.05, staggerChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const staggerItemVariants = {
  hidden: { opacity: 0, y: 10, filter: "blur(2px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.25, ease: "easeOut" } },
  exit: { opacity: 0, y: 5, filter: "blur(2px)", transition: { duration: 0.15 } },
};

const slideVariants = {
  enter: (directionection) => ({ x: directionection > 0 ? 25 : -25, opacity: 0 }),
  center: { x: 0, opacity: 1, zIndex: 1 },
  exit: (directionection) => ({ x: directionection < 0 ? 25 : -25, opacity: 0, zIndex: 0 }),
};

const verticalMenuVariants = {
  enter: (isSelecting) => ({ y: isSelecting ? 24 : -24, opacity: 0, filter: "blur(4px)", scale: 0.98 }),
  center: { zIndex: 1, y: 0, opacity: 1, filter: "blur(0px)", scale: 1, transition: { duration: 0.25, ease: [0.32, 0.72, 0, 1] } },
  exit: (isSelecting) => ({ zIndex: 0, y: isSelecting ? -24 : 24, opacity: 0, filter: "blur(4px)", scale: 0.98, transition: { duration: 0.2, ease: "easeIn" } }),
};

export default function DatePicker({ value = null, onChange, onClose, className = "" }) {
  const now = new Date();
  const initialYear = value?.getFullYear() ?? now.getFullYear();
  const initialMonth = value?.getMonth() ?? now.getMonth();
  
  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);
  const [directionection, setDirection] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    if (value) { setViewYear(value.getFullYear()); setViewMonth(value.getMonth()); }
  }, [value]);

  const matrix = useMemo(() => getCalendarMatrix(viewYear, viewMonth, 1), [viewYear, viewMonth]);
  const headerLabel = `${months[viewMonth]} ${viewYear}`;

  const changeMonth = (direction) => {
    setDirection(direction);
    const m = viewMonth + direction;
    setViewMonth((m + 12) % 12);
    if (m < 0) setViewYear(viewYear - 1);
    else if (m > 11) setViewYear(viewYear + 1);
  };

  const handleToday = () => {
    const t = new Date();
    setDirection(t > new Date(viewYear, viewMonth) ? 1 : -1);
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    onChange?.(t);
  };

  const handleClear = () => {
    onChange?.(null);
    onClose?.();
  };

  return (
    <motion.div variants={panelVariants} initial="hidden" animate="visible" exit="exit" onMouseDown={(e) => e.stopPropagation()}
      className={`absolute z-20 mt-2 w-[280px] rounded-xl border border-white/10 bg-neutral-900/30 p-3 text-neutral-100 shadow-2xl backdrop-blur-md supports-backdrop-filter:bg-neutral-900/30 ${className}`}
    >
      <motion.div variants={staggerContainerVariants} className="flex flex-col gap-2">
        
        <motion.div variants={staggerItemVariants} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-1">
          <button type="button" onClick={() => isSelecting ? setViewYear(viewYear - 1) : changeMonth(-1)} 
            className="grid size-7 place-items-center rounded-md text-neutral-400 transition hover:bg-white/10 hover:text-neutral-200"
          >
            {isSelecting ? <ChevronsLeft className="size-4" /> : <ChevronLeft className="size-4" />}
          </button>

          <button type="button" onClick={() => setIsSelecting(!isSelecting)} className="flex items-center gap-1 rounded px-2 py-1 text-sm font-semibold text-neutral-100 transition hover:bg-white/10">
            {isSelecting ? viewYear : headerLabel}
          </button>

          <button type="button" 
            onClick={() => isSelecting ? setViewYear(viewYear + 1) : changeMonth(1)} 
            className="grid size-7 place-items-center rounded-md text-neutral-400 transition hover:bg-white/10 hover:text-neutral-200"
          >
            {isSelecting ? <ChevronsRight className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        </motion.div>

        <motion.div variants={staggerItemVariants} className="relative h-[210px] w-full overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false} custom={isSelecting}>
            
            {!isSelecting ? (
              <motion.div key="calendar" custom={isSelecting} variants={verticalMenuVariants}
                initial="enter" animate="center" exit="exit" className="absolute inset-0 flex flex-col"
              >
                <div className="mb-1 grid grid-cols-7 text-center">
                  {weekdays.map((d) => (
                    <div key={d} className="text-[11px] font-medium uppercase tracking-wide text-neutral-500 select-none py-1">{d}</div>
                  ))}
                </div>
                
                <div className="relative flex-1 overflow-hidden">
                  <AnimatePresence initial={false} custom={directionection} mode="popLayout">
                    <motion.div key={`${viewYear}-${viewMonth}`} custom={directionection} variants={slideVariants}
                      initial="enter" animate="center" exit="exit" transition={{ type: "spring", stiffness: 300, damping: 30 }} className="absolute inset-0 grid grid-cols-7 gap-1 mt-0.5"
                    >
                      {matrix.map(({ date, inMonth }, idx) => {
                        const isToday = isSameDay(date, now);
                        const isSelected = isSameDay(date, value);
                        return (
                          <button key={idx} type="button" onClick={() => { onChange?.(date); onClose?.(); }}
                            className={`relative flex size-full items-center justify-center rounded-md text-[13px] transition select-none border
                              ${!inMonth ? "border-transparent text-neutral-600" : "text-neutral-300"}
                              ${inMonth && !isSelected ? "hover:bg-white/10 hover:text-neutral-100" : ""}
                              ${isSelected ? "border-indigo-400/40 bg-indigo-500/10 text-indigo-100 shadow-sm font-medium" : "border-transparent"}
                              ${isToday && !isSelected ? "ring-1 ring-white/10 bg-white/5 text-neutral-200" : ""}
                            `}
                          >
                            {date.getDate()}
                          </button>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div key="selector" custom={isSelecting} variants={verticalMenuVariants}
                initial="enter" animate="center" exit="exit" className="absolute inset-0 flex flex-col gap-2"
              >
                <div className="grid flex-1 grid-cols-3 gap-2 overflow-y-hidden pr-1">
                  {months.map((month, idx) => (
                    <button key={month} type="button" onClick={() => { setDirection(idx > viewMonth ? 1 : -1); setViewMonth(idx); setIsSelecting(false); }}
                      className={`rounded-md border py-2 text-xs font-medium transition
                        ${idx === viewMonth ? "border-indigo-400/40 bg-indigo-500/10 text-indigo-100 hover:border-indigo-300/60 hover:bg-indigo-400/20" : "border-white/5 bg-white/5 text-neutral-200 hover:border-white/10 hover:bg-white/10"}`}
                    >
                      {month}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div variants={staggerItemVariants} className="flex items-center justify-between border-t border-white/5 pt-2">
          <button type="button" onClick={handleToday} className="rounded-md px-2 py-1 text-[11px] font-medium text-neutral-400 transition hover:bg-white/5 hover:text-neutral-200">
            Bugün
          </button>
          <button type="button" onClick={handleClear} className="rounded-md px-2 py-1 text-[11px] font-medium text-neutral-400 transition hover:bg-white/5 hover:text-neutral-200">
            Temizle
          </button>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}