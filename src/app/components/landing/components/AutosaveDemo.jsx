"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Save } from "lucide-react";
import { useShouldAnimate } from "../utils";

const PHRASES = [
  "Yıldız Teknik Üniversitesi'nde",
  "Yıldız Teknik Üniversitesi'nde Bilgisayar",
  "Yıldız Teknik Üniversitesi'nde Bilgisayar Mühendisliği",
];

export default function AutosaveDemo() {
  const rootRef = useRef(null);
  const active = useShouldAnimate(rootRef);
  const [phase, setPhase] = useState("typing");
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    const cycle = async () => {
      while (alive) {
        setPhase("typing");
        const full = PHRASES[phraseIdx];
        for (let i = 0; i <= full.length; i += 2) {
          if (!alive) return;
          setText(full.slice(0, i));
          await new Promise((r) => setTimeout(r, 22));
        }
        setPhase("saving");
        await new Promise((r) => setTimeout(r, 700));
        if (!alive) return;
        setPhase("saved");
        await new Promise((r) => setTimeout(r, 1800));
        if (!alive) return;
        setPhase("restoring");
        setText("");
        await new Promise((r) => setTimeout(r, 1400));
        setPhraseIdx((p) => (p + 1) % PHRASES.length);
      }
    };
    cycle();
    return () => { alive = false; };
  }, [phraseIdx, active]);

  return (
    <div ref={rootRef} className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Form Yanıtı · Soru 3</span>
        <AnimatePresence mode="wait">
          {phase === "saving" && (
            <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-mono text-[10px] text-skylab-500 flex items-center gap-1.5">
              <motion.span className="h-1 w-1 rounded-full bg-skylab-500"
                animate={{ scale: [1, 1.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
              Kaydediliyor…
            </motion.span>
          )}
          {phase === "saved" && (
            <motion.span key="sd" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-mono text-[10px] text-emerald-400 flex items-center gap-1.5">
              <Check size={10} /> 2 saniye önce kaydedildi
            </motion.span>
          )}
          {phase === "typing" && (
            <motion.span key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-mono text-[10px] text-neutral-500">Yazılıyor…</motion.span>
          )}
          {phase === "restoring" && (
            <motion.span key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-mono text-[10px] text-amber-400">Taslak bulundu</motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/2.5 px-4 py-3.5 min-h-20">
        <div className="text-[12.5px] text-neutral-300 mb-2">Kısaca kendinden bahset.</div>
        <div className="text-[13px] text-neutral-100 leading-relaxed">
          {text}
          <motion.span className="inline-block w-0.5 h-3.5 bg-skylab-500 ml-0.5 align-middle"
            animate={{ opacity: phase === "typing" ? [1, 0] : 0 }} transition={{ duration: 0.6, repeat: Infinity }} />
        </div>
      </div>

      <AnimatePresence>
        {phase === "restoring" && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-lg border border-amber-500/25 bg-amber-500/6 px-3.5 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Save size={11} className="text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[11.5px] text-amber-200">Kaydedilmiş taslak bulundu</div>
                <div className="font-mono text-[9.5px] text-amber-300/60 mt-0.5">3 dakika önce - devam etmek ister misin?</div>
              </div>
            </div>
            <div className="flex gap-1.5 shrink-0">
              <button className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] text-amber-300">Yükle</button>
              <button className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] text-neutral-400">Sıfırla</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}