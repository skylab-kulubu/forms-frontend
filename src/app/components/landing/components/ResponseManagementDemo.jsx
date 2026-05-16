"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, X, CircleDot, CheckCircle, XCircle, Archive, LayoutGrid,
  Search, MoreHorizontal,
} from "lucide-react";
import { useShouldAnimate } from "../utils";

const RESPONSES = [
  { id: 1, name: "Ayşe Yılmaz", email: "ay@ytu", time: "2dk 34sn", date: "12 May", status: "approved" },
  { id: 2, name: "Mehmet Kara", email: "mk@ytu", time: "1dk 12sn", date: "12 May", status: "pending" },
  { id: 3, name: "Elif Sönmez", email: "es@ytu", time: "3dk 05sn", date: "11 May", status: "rejected" },
  { id: 4, name: "Burak Aksoy", email: "ba@ytu", time: "4dk 41sn", date: "11 May", status: "approved" },
  { id: 5, name: "Zeynep Aydın", email: "za@ytu", time: "2dk 08sn", date: "10 May", status: "pending" },
];

const STATUS_CONF = {
  approved: { dot: "bg-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", text: "text-emerald-300", label: "Onaylandı", Icon: CheckCircle },
  pending: { dot: "bg-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/25", text: "text-amber-300", label: "Bekliyor", Icon: CircleDot },
  rejected: { dot: "bg-red-400", bg: "bg-red-500/10", border: "border-red-500/25", text: "text-red-300", label: "Reddedildi", Icon: XCircle },
};

const FILTER_CHIPS = [
  { f: "all", Icon: LayoutGrid, label: "Tümü", tone: "neutral" },
  { f: "pending", Icon: CircleDot, label: "Bekleyen", tone: "amber" },
  { f: "approved", Icon: CheckCircle, label: "Onaylı", tone: "emerald" },
  { f: "rejected", Icon: XCircle, label: "Reddedilen", tone: "red" },
];

function chipClass(active, tone) {
  if (!active) return "border-white/10 bg-white/2.5 text-neutral-500 hover:text-neutral-300";
  if (tone === "emerald") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (tone === "amber") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (tone === "red") return "border-red-500/30 bg-red-500/10 text-red-300";
  return "border-skylab-600/30 bg-skylab-700/10 text-skylab-500";
}

export default function ResponseManagementDemo() {
  const rootRef = useRef(null);
  const active = useShouldAnimate(rootRef);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState(1);
  const [archived, setArchived] = useState([]);

  useEffect(() => {
    if (!active) return;
    let alive = true;
    const steps = [
      { filter: "all", archived: [], pick: 0 },
      { filter: "pending", archived: [], pick: 0 },
      { filter: "approved", archived: [], pick: 1 },
      { filter: "rejected", archived: [], pick: 0 },
      { filter: "all", archived: [3], pick: 2 },
      { filter: "all", archived: [], pick: 3 },
    ];
    const cycle = async () => {
      let i = 0;
      while (alive) {
        const step = steps[i];
        const visible = RESPONSES.filter((r) => step.filter === "all" || r.status === step.filter)
          .filter((r) => !step.archived.includes(r.id));
        const pick = visible[Math.min(step.pick, visible.length - 1)] ?? visible[0];
        setFilter(step.filter);
        setArchived(step.archived);
        if (pick) setSelected(pick.id);
        await new Promise((r) => setTimeout(r, 2400));
        if (!alive) return;
        i = (i + 1) % steps.length;
      }
    };
    cycle();
    return () => { alive = false; };
  }, [active]);

  const filtered = RESPONSES.filter((r) => filter === "all" || r.status === filter).filter((r) => !archived.includes(r.id));
  const current = RESPONSES.find((r) => r.id === selected) ?? RESPONSES[0];
  const sc = STATUS_CONF[current.status];
  const CurrentIcon = sc.Icon;

  return (
    <div ref={rootRef} className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <div className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/3 px-2.5 py-1.5 flex-1 min-w-0">
            <Search size={10} className="text-neutral-600 shrink-0" />
            <span className="text-[10.5px] text-neutral-600 truncate">Yanıtlarda ara…</span>
          </div>
          {FILTER_CHIPS.map(({ f, Icon, label, tone }) => {
            const active = filter === f;
            return (
              <motion.button key={f} onClick={() => setFilter(f)} title={label}
                animate={{ scale: active ? 1.05 : 1 }}
                className={`shrink-0 rounded-md border h-7 w-7 grid place-items-center transition-colors ${chipClass(active, tone)}`}>
                <Icon size={11} strokeWidth={2} />
              </motion.button>
            );
          })}
        </div>

        <div className="flex flex-col gap-1 min-h-[230px]">
          <AnimatePresence mode="popLayout">
            {filtered.map((r) => {
              const s = STATUS_CONF[r.status];
              const isSel = selected === r.id;
              return (
                <motion.button key={r.id} layout
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3 }} onClick={() => setSelected(r.id)}
                  className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${isSel ? "border-skylab-600/30 bg-skylab-700/7" : "border-white/10 bg-white/2 hover:border-white/20"}`}>
                  <div className="h-6 w-6 rounded-full grid place-items-center text-[9px] text-white bg-linear-to-br from-skylab-700 to-skylab-900">
                    {r.name.split(" ").map((p) => p[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] text-neutral-200 truncate">{r.name}</div>
                    <div className="font-mono text-[9.5px] text-neutral-500 mt-0.5">{r.email} · {r.time}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-md border ${s.border} ${s.bg} px-1.5 py-0.5 text-[9.5px] ${s.text}`}>
                    <span className={`h-1 w-1 rounded-full ${s.dot}`} /> {s.label}
                  </span>
                </motion.button>
              );
            })}
          </AnimatePresence>
          {archived.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="font-mono text-[10px] text-neutral-600 text-center py-1.5 flex items-center justify-center gap-1.5">
              <Archive size={9} /> {archived.length} arşivlendi
            </motion.div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/2.5 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-neutral-500">Yanıt #{current.id}</span>
          <MoreHorizontal size={12} className="text-neutral-600" />
        </div>
        <div className="flex items-center gap-3 mb-4">
          <div className="h-9 w-9 rounded-full grid place-items-center text-[11px] text-white bg-linear-to-br from-skylab-700 to-skylab-900">
            {current.name.split(" ").map((p) => p[0]).join("")}
          </div>
          <div>
            <div className="text-[13px] text-neutral-100">{current.name}</div>
            <div className="font-mono text-[10px] text-neutral-500">{current.date} · {current.time}</div>
          </div>
        </div>
        <motion.div key={current.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-center gap-2 rounded-lg border ${sc.border} ${sc.bg} px-3 py-2.5 mb-3`}>
          <CurrentIcon size={13} className={sc.text} />
          <span className={`text-[12px] ${sc.text}`}>{sc.label}</span>
        </motion.div>
        <div className="flex gap-1.5">
          <button className="flex-1 flex items-center justify-center gap-1 rounded-md border border-emerald-500/25 bg-emerald-500/5 py-1.5 text-[10.5px] text-emerald-300 hover:bg-emerald-500/10 transition-colors">
            <Check size={10} /> Onayla
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 rounded-md border border-red-500/25 bg-red-500/5 py-1.5 text-[10.5px] text-red-300 hover:bg-red-500/10 transition-colors">
            <X size={10} /> Reddet
          </button>
          <button className="flex items-center justify-center rounded-md border border-white/10 bg-white/2 px-2 py-1.5 text-neutral-500 hover:text-neutral-300 transition-colors">
            <Archive size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}