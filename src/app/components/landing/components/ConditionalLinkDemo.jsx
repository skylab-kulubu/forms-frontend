"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, GitBranch, Link2 } from "lucide-react";
import { useShouldAnimate } from "../utils";

export default function ConditionalLinkDemo() {
  const rootRef = useRef(null);
  const active = useShouldAnimate(rootRef);
  const [hasExp, setHasExp] = useState(false);
  const [linked, setLinked] = useState(false);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    const cycle = async () => {
      while (alive) {
        await new Promise((r) => setTimeout(r, 1600));
        if (!alive) return;
        setHasExp(true);
        await new Promise((r) => setTimeout(r, 1400));
        if (!alive) return;
        setLinked(true);
        await new Promise((r) => setTimeout(r, 1800));
        if (!alive) return;
        setHasExp(false);
        setLinked(false);
      }
    };
    cycle();
    return () => { alive = false; };
  }, [active]);

  return (
    <div ref={rootRef} className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Koşullu Mantık</span>
          <span className="font-mono text-[10px] text-skylab-500">if · then</span>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/2.5 px-3.5 py-3">
            <div>
              <div className="text-[12.5px] text-neutral-200">Yazılım deneyimin var mı?</div>
              <div className="font-mono text-[10px] text-neutral-500 mt-0.5">Toggle · q01</div>
            </div>
            <button onClick={() => setHasExp((v) => !v)}
              className={`h-5 w-9 rounded-full p-0.5 transition-colors ${hasExp ? "bg-skylab-700" : "bg-neutral-700"}`}>
              <motion.div className="h-4 w-4 rounded-full bg-white" animate={{ x: hasExp ? 16 : 0 }} transition={{ type: "spring", stiffness: 500, damping: 30 }} />
            </button>
          </div>

          <div className="grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ gridTemplateRows: hasExp ? "1fr" : "0fr" }}>
            <div className="overflow-hidden">
              <motion.div animate={{ opacity: hasExp ? 1 : 0, y: hasExp ? 0 : -8 }} transition={{ duration: 0.35 }}
                className="mt-1.5 rounded-lg border border-skylab-600/25 bg-skylab-700/7 px-3.5 py-3">
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch size={11} className="text-skylab-600" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-skylab-500">q01 = Evet</span>
                </div>
                <div className="text-[12.5px] text-skylab-300">Kaç yıllık tecrüben var?</div>
                <div className="mt-2.5 flex items-center gap-3">
                  <input disabled className="flex-1 bg-transparent border-b border-skylab-600/30 text-[12px] text-skylab-400 pb-1" placeholder="örn. 2.5" />
                  <span className="font-mono text-[10px] text-skylab-500/60">Kaydırıcı</span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/2.5 px-3.5 py-3">
            <div className="text-[12.5px] text-neutral-200 flex-1">İlgilendiğin ekip</div>
            <span className="font-mono text-[10px] text-neutral-500">Açılır Liste · q02</span>
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-white/5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Form Bağlama</span>
          <motion.span className="font-mono text-[10px]" animate={{ color: linked ? "rgb(110,231,183)" : "rgb(115,115,115)" }}>
            {linked ? "✓ Zincirlendi" : "Beklemede"}
          </motion.span>
        </div>
        <div className="grid grid-cols-[1fr_44px_1fr] items-stretch gap-0">
          <div className="rounded-lg border border-white/10 bg-white/2.5 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <FileText size={11} className="text-skylab-600" />
              <span className="text-[11.5px] text-neutral-200">Ön Başvuru</span>
            </div>
            <div className="font-mono text-[9.5px] text-neutral-500 mt-1">5 alan · onaylandı</div>
          </div>
          <div className="relative flex items-center justify-center self-center h-6">
            <motion.div className="absolute left-1 right-1 h-px"
              animate={{
                backgroundColor: linked ? "rgb(224,200,229)" : "rgb(64,64,64)",
                opacity: linked ? 0.55 : 0.4,
              }}
              transition={{ duration: 0.4 }} />
            <motion.div
              animate={{
                color: linked ? "rgb(224,200,229)" : "rgb(82,82,91)",
                scale: linked ? 1 : 0.92,
              }}
              transition={{ duration: 0.4 }}
              className="relative rounded-full bg-neutral-950 p-1">
              <Link2 size={11} strokeWidth={2} />
            </motion.div>
          </div>
          <motion.div className="rounded-lg border px-3 py-2.5"
            animate={{ borderColor: linked ? "rgba(224,200,229,.3)" : "rgba(255,255,255,.06)", backgroundColor: linked ? "rgba(224,200,229,.05)" : "rgba(255,255,255,.02)" }}>
            <div className="flex items-center gap-2">
              <FileText size={11} className={linked ? "text-skylab-500" : "text-neutral-600"} />
              <span className={`text-[11.5px] ${linked ? "text-neutral-100" : "text-neutral-500"}`}>Mülakat Formu</span>
            </div>
            <div className="font-mono text-[9.5px] text-neutral-500 mt-1">otomatik tetiklenir</div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}