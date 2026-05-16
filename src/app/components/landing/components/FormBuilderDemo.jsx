"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Type, AlignLeft, ToggleRight, ChevronDown, ListChecks, Calendar, Clock,
  Upload, Link2, SlidersHorizontal, Table, SeparatorHorizontal, Grip,
} from "lucide-react";
import { useShouldAnimate } from "../utils";

const FIELD_TYPES = [
  { Icon: Type, name: "Kısa Metin" },
  { Icon: AlignLeft, name: "Uzun Metin" },
  { Icon: ToggleRight, name: "Toggle" },
  { Icon: ChevronDown, name: "Açılır Liste" },
  { Icon: ListChecks, name: "Çoklu Seçim" },
  { Icon: Calendar, name: "Tarih" },
  { Icon: Clock, name: "Saat" },
  { Icon: Upload, name: "Dosya" },
  { Icon: Link2, name: "Link" },
  { Icon: SlidersHorizontal, name: "Kaydırıcı" },
  { Icon: Table, name: "Matris" },
  { Icon: SeparatorHorizontal, name: "Ayıraç" },
];

const INITIAL_FIELDS = [
  { id: "f1", Icon: Type, name: "Ad Soyad", kind: "Kısa Metin" },
  { id: "f2", Icon: Link2, name: "Portfolio URL", kind: "Link" },
  { id: "f3", Icon: ChevronDown, name: "Ekip", kind: "Açılır Liste" },
  { id: "f4", Icon: AlignLeft, name: "Motivasyon", kind: "Uzun Metin" },
];

const EXTRA_FIELD = { id: "f5", Icon: SlidersHorizontal, name: "Deneyim (yıl)", kind: "Kaydırıcı" };

export default function FormBuilderDemo() {
  const rootRef = useRef(null);
  const active = useShouldAnimate(rootRef);
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [dragging, setDragging] = useState(null);
  const [pulse, setPulse] = useState(null);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    const cycle = async () => {
      while (alive) {
        await new Promise((r) => setTimeout(r, 1600));
        if (!alive) return;
        setDragging(1);
        await new Promise((r) => setTimeout(r, 950));
        if (!alive) return;
        setFields([INITIAL_FIELDS[0], INITIAL_FIELDS[2], INITIAL_FIELDS[1], INITIAL_FIELDS[3]]);
        setDragging(null);
        await new Promise((r) => setTimeout(r, 1800));
        if (!alive) return;
        setPulse(4);
        setFields((f) => [...f, EXTRA_FIELD]);
        await new Promise((r) => setTimeout(r, 2000));
        setPulse(null);
        if (!alive) return;
        await new Promise((r) => setTimeout(r, 1400));
        setFields(INITIAL_FIELDS);
      }
    };
    cycle();
    return () => { alive = false; };
  }, [active]);

  return (
    <div ref={rootRef} className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Form Düzenleyici</span>
          <span className="font-mono text-[10px] text-neutral-600">{fields.length} alan</span>
        </div>
        <div className="flex flex-col gap-2 min-h-[340px]">
          {fields.map((f, i) => {
            const { Icon } = f;
            const isDragging = dragging === i;
            const isPulse = pulse === i;
            return (
              <motion.div key={f.id} layout
                animate={
                  isDragging
                    ? { y: [-2, -8, -2], scale: 1.02, boxShadow: "0 12px 32px rgba(224,200,229,.18)" }
                    : isPulse
                    ? { y: 0, scale: [1, 1.03, 1], boxShadow: "0 0 0 rgba(0,0,0,0)" }
                    : { y: 0, scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" }
                }
                transition={{ duration: isDragging ? 0.6 : 0.4, repeat: isDragging ? Infinity : 0 }}
                className={`group flex items-center gap-3.5 rounded-xl border px-4 py-3.5 transition-colors ${
                  isDragging ? "border-skylab-600/40 bg-skylab-700/10"
                    : isPulse ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-white/10 bg-white/2.5 hover:border-white/20"
                }`}>
                <Grip size={12} className="text-neutral-600 cursor-grab shrink-0" />
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-skylab-700/10 border border-skylab-600/20 shrink-0">
                  <Icon size={14} className="text-skylab-500" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] text-neutral-100 truncate leading-tight">{f.name}</div>
                  <div className="font-mono text-[10px] text-neutral-500 mt-1">{f.kind}</div>
                </div>
                <span className="font-mono text-[10px] text-neutral-600">0{i + 1}</span>
              </motion.div>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Bileşenler</span>
          <span className="font-mono text-[10px] text-neutral-600">12</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-2 gap-1.5">
          {FIELD_TYPES.map(({ Icon, name }) => (
            <div key={name} className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/2 px-2 py-1.5 hover:border-skylab-600/30 hover:bg-skylab-700/5 transition-colors">
              <Icon size={11} className="text-skylab-600 shrink-0" strokeWidth={1.75} />
              <span className="text-[10.5px] text-neutral-400 truncate">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}