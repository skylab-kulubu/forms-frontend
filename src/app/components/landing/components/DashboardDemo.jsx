"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, FileText, MessageSquare, Component } from "lucide-react";
import { useShouldAnimate } from "../utils";

const SERIES = [
  [6, 8, 5, 12, 9, 14, 18],
  [8, 6, 10, 14, 11, 16, 22],
  [4, 9, 12, 8, 15, 18, 20],
];

const STATS = [
  { k: "Form", v: 42, delta: "+12%", Icon: FileText },
  { k: "Yanıt", v: 1284, delta: "+24%", Icon: MessageSquare },
  { k: "Grup", v: 18, delta: "+3", Icon: Component },
];

const DAYS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const MAX = 24;
const W = 100;
const H = 60;

export default function DashboardDemo() {
  const rootRef = useRef(null);
  const active = useShouldAnimate(rootRef);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) return;
    const i = setInterval(() => setTick((t) => (t + 1) % SERIES.length), 2600);
    return () => clearInterval(i);
  }, [active]);

  const data = SERIES[tick];
  const coords = data.map((v, i) => [
    (i / (data.length - 1)) * W,
    H - (v / MAX) * (H - 6) - 3,
  ]);
  const linePath = "M " + coords.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join(" L ");
  const areaPath = `${linePath} L ${W} ${H} L 0 ${H} Z`;

  return (
    <div ref={rootRef} className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {STATS.map(({ k, v, delta, Icon }) => (
          <div key={k} className="rounded-lg border border-white/10 bg-white/2.5 p-3">
            <div className="flex items-center justify-between mb-2">
              <Icon size={11} className="text-skylab-600" />
              <span className="font-mono text-[9.5px] text-emerald-400/80">{delta}</span>
            </div>
            <div style={{ fontFamily: "var(--sl-display)", fontSize: 22, fontWeight: 600, letterSpacing: "-.02em", lineHeight: 1, color: "var(--sl-ink)" }}>
              {v.toLocaleString("tr")}
            </div>
            <div className="font-mono text-[9.5px] text-neutral-500 mt-1 uppercase tracking-wider">{k}</div>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-white/10 bg-white/2.5 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={11} className="text-skylab-600" />
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Haftalık Yanıt</span>
          </div>
          <span className="font-mono text-[10px] text-skylab-500">son 7 gün</span>
        </div>
        <div className="relative h-[130px]">
          <svg viewBox={`0 0 ${W} ${H + 14}`} preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <defs>
              <linearGradient id="dashboard-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgba(224,200,229,0.4)" />
                <stop offset="100%" stopColor="rgba(224,200,229,0)" />
              </linearGradient>
            </defs>
            {[0.25, 0.5, 0.75].map((p) => (
              <line key={p} x1="0" x2={W} y1={p * H} y2={p * H} stroke="rgba(255,255,255,0.05)" strokeWidth="0.2" vectorEffect="non-scaling-stroke" />
            ))}
            <motion.path key={`a-${tick}`} d={areaPath} fill="url(#dashboard-grad)"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7, ease: "easeOut" }} />
            <motion.path d={linePath} fill="none" stroke="rgb(224,200,229)" strokeWidth="1.3"
              strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"
              animate={{ d: linePath }} transition={{ duration: 0.8, ease: [0.2, 0.7, 0.3, 1] }} />
          </svg>
          <div className="absolute inset-x-0 bottom-0 flex justify-between font-mono text-[9px] text-neutral-600 px-0.5">
            {DAYS.map((d) => <span key={d}>{d}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}