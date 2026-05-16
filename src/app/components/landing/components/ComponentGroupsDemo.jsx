"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Check, Component, Layers, SlidersHorizontal, User, Mail, Phone,
  GraduationCap, BookOpen, Hash, Languages, Code2, Github, Linkedin, Globe,
} from "lucide-react";
import { useShouldAnimate } from "../utils";

const GROUPS = [
  {
    name: "Kişisel Bilgiler", tag: "kişisel",
    fields: [
      { name: "Ad Soyad", kind: "Kısa Metin", Icon: User },
      { name: "E-posta", kind: "Kısa Metin", Icon: Mail },
      { name: "Telefon", kind: "Kısa Metin", Icon: Phone },
      { name: "TC Kimlik", kind: "Kısa Metin", Icon: Hash },
    ],
  },
  {
    name: "Eğitim Geçmişi", tag: "akademik",
    fields: [
      { name: "Üniversite", kind: "Açılır Liste", Icon: GraduationCap },
      { name: "Bölüm", kind: "Açılır Liste", Icon: BookOpen },
      { name: "Sınıf", kind: "Kaydırıcı", Icon: SlidersHorizontal },
    ],
  },
  {
    name: "Yetkinlikler", tag: "teknik",
    fields: [
      { name: "Diller", kind: "Çoklu Seçim", Icon: Languages },
      { name: "Stack", kind: "Çoklu Seçim", Icon: Code2 },
      { name: "GitHub", kind: "Link", Icon: Github },
      { name: "LinkedIn", kind: "Link", Icon: Linkedin },
      { name: "Portfolyo", kind: "Link", Icon: Globe },
    ],
  },
];

export default function ComponentGroupsDemo() {
  const rootRef = useRef(null);
  const playing = useShouldAnimate(rootRef);
  const [active, setActive] = useState(0);
  const [imported, setImported] = useState(false);

  useEffect(() => {
    if (!playing) return;
    let alive = true;
    const cycle = async () => {
      while (alive) {
        await new Promise((r) => setTimeout(r, 1800));
        if (!alive) return;
        setActive((a) => (a + 1) % GROUPS.length);
        setImported(false);
        await new Promise((r) => setTimeout(r, 900));
        if (!alive) return;
        setImported(true);
      }
    };
    cycle();
    return () => { alive = false; };
  }, [playing]);

  const g = GROUPS[active];

  return (
    <div ref={rootRef} className="grid grid-cols-1 md:grid-cols-[210px_1fr] gap-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Kütüphane</span>
          <span className="font-mono text-[10px] text-neutral-600">{GROUPS.length}</span>
        </div>
        <div className="space-y-1.5">
          {GROUPS.map((gg, i) => {
            const isActive = active === i;
            return (
              <button key={gg.name} onClick={() => setActive(i)}
                className={`group relative w-full text-left rounded-lg border px-3 py-2.5 transition-all ${isActive ? "border-skylab-600/35 bg-skylab-700/8" : "border-white/10 bg-white/2 hover:border-white/20 hover:bg-white/3.5"}`}>
                {isActive && (
                  <motion.div layoutId="group-active-bar" className="absolute left-0 top-2 bottom-2 w-0.5 rounded-r bg-skylab-500" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <div className="flex items-center gap-2 pl-1">
                  <div className={`h-5 w-5 grid place-items-center rounded ${isActive ? "bg-skylab-700/15" : "bg-white/3"}`}>
                    <Layers size={10} className={isActive ? "text-skylab-500" : "text-neutral-500"} strokeWidth={1.8} />
                  </div>
                  <span className={`text-[12px] flex-1 truncate ${isActive ? "text-neutral-100" : "text-neutral-300"}`}>{gg.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 pl-1">
                  <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-neutral-600 px-1 py-px rounded border border-white/10">{gg.tag}</span>
                  <span className="font-mono text-[9.5px] text-neutral-500">{gg.fields.length} alan</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-linear-to-br from-white/3.5 to-white/1 p-4 min-h-[280px] relative overflow-hidden">
        <div className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-skylab-700/7 blur-2xl pointer-events-none" />
        <div className="relative flex items-start justify-between mb-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Component size={13} className="text-skylab-500" strokeWidth={1.8} />
              <div className="text-[14px] text-neutral-100 truncate">{g.name}</div>
            </div>
            <div className="font-mono text-[9.5px] text-neutral-500 mt-1 ml-5 uppercase tracking-[0.16em]">{g.fields.length} bileşen · yeniden kullanılabilir</div>
          </div>
          <motion.button animate={imported ? { backgroundColor: "rgba(110,231,183,.12)", borderColor: "rgba(110,231,183,.35)", color: "rgb(110,231,183)" } : {}}
            className="shrink-0 flex items-center gap-1.5 rounded-md border border-skylab-600/30 bg-skylab-700/10 px-2.5 py-1.5 text-[10.5px] text-skylab-500 transition-colors">
            {imported ? <><Check size={10} /> Eklendi</> : <><Plus size={10} /> İçe aktar</>}
          </motion.button>
        </div>
        <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-1.5 min-h-[170px] content-start">
          <AnimatePresence mode="popLayout">
            {g.fields.map((field, i) => {
              const { Icon } = field;
              return (
                <motion.div key={`${g.name}-${field.name}`} layout
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                  className="group flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/2.5 px-2.5 py-2 hover:border-skylab-600/25 hover:bg-skylab-700/4 transition-colors">
                  <div className="h-6 w-6 grid place-items-center rounded-md bg-skylab-700/10 border border-skylab-600/20">
                    <Icon size={11} className="text-skylab-500" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11.5px] text-neutral-200 truncate leading-tight">{field.name}</div>
                    <div className="font-mono text-[9px] text-neutral-500 mt-0.5">{field.kind}</div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}