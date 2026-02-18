"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Timer, User2, ToggleLeft, ToggleRight, Link2, Hash, Shield } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
};

const ROLE_LABELS = {
  3: "Sahip",
  2: "Editör",
  default: "Görüntüleyici",
};

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "--";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}dk ${s}sn`;
}

function SectionTitle({ children }) {
  return <h3 className="text-[10px] uppercase tracking-wide text-neutral-500 mb-2">{children}</h3>;
}

function TrendChart({ hourlyData, dailyData }) {
  const [mode, setMode] = useState("daily");
  const data = mode === "hourly" ? hourlyData : dailyData;

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-neutral-900/90 border border-white/10 rounded-md px-2.5 py-1.5 shadow-xl">
        <span className="text-[11px] text-indigo-300 font-medium">{payload[0].value}</span>
      </div>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <SectionTitle>Cevap Trendi</SectionTitle>
        <div className="flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 p-0.5">
          <button type="button" onClick={() => setMode("hourly")}
            className={`px-2 py-0.5 text-[10px] rounded transition ${mode === "hourly" ? "bg-white/10 text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            Saatlik
          </button>
          <button type="button" onClick={() => setMode("daily")}
            className={`px-2 py-0.5 text-[10px] rounded transition ${mode === "daily" ? "bg-white/10 text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            Günlük
          </button>
        </div>
      </div>

      <div className="w-full h-24">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, bottom: -2, left: 10 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "rgb(100,100,110)" }} interval={0} dy={4}/>
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgb(129,140,248)", strokeWidth: 0.5, strokeDasharray: "3 3" }} />
            <Area type="monotone" dataKey="count" stroke="rgb(129,140,248)" strokeWidth={2} fill="url(#colorCount)"
              dot={{ r: 2.5, fill: "rgb(129,140,248)", strokeWidth: 0 }} activeDot={{ r: 4, fill: "rgb(165,180,252)", strokeWidth: 0 }} animationDuration={500} animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SourceBreakdownBar({ registered, anonymous }) {
  const total = registered + anonymous;
  const regPct = total > 0 ? (registered / total) * 100 : 50;
  const anonPct = total > 0 ? (anonymous / total) * 100 : 50;

  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        {total > 0 ? (
          <>
            {regPct > 0 && <div style={{ width: `${regPct}%` }} className="bg-indigo-300 transition-all duration-500" />}
            {anonPct > 0 && <div style={{ width: `${anonPct}%` }} className="bg-rose-300 transition-all duration-500" />}
          </>
        ) : null}
      </div>
      <div className="flex gap-3 mt-1.5 justify-center">
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-indigo-300" />
          <span className="text-[9px] text-neutral-500">Kayıtlı ({registered})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-1.5 rounded-full bg-rose-300" />
          <span className="text-[9px] text-neutral-500">Anonim ({anonymous})</span>
        </div>
      </div>
    </div>
  );
}

function FormInfoGrid({ formData }) {
  const formSchema = formData?.data?.schema ?? formData?.schema ?? [];
  const allowAnonymous = formData?.data?.allowAnonymousResponses ?? formData?.allowAnonymousResponses;
  const allowMultiple = formData?.data?.allowMultipleResponses ?? formData?.allowMultipleResponses;
  const linkedFormId = formData?.data?.linkedFormId ?? formData?.linkedFormId;
  const userRole = formData?.data?.userRole ?? formData?.userRole;

  const items = [
    { icon: Hash, label: "Soru", value: formSchema.length },
    { icon: User2, label: "Anonim", value: allowAnonymous ? "Açık" : "Kapalı" },
    { icon: allowMultiple ? ToggleRight : ToggleLeft, label: "Çoklu", value: allowMultiple ? "Açık" : "Kapalı" },
    { icon: Link2, label: "Bağlı", value: linkedFormId || "Yok", href: linkedFormId ? `/admin/forms/${linkedFormId}` : null },
    { icon: Shield, label: "Rol", value: ROLE_LABELS[userRole] ?? ROLE_LABELS.default },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <item.icon size={12} className="text-neutral-600 shrink-0" />
          <span className="text-[10px] text-neutral-500">{item.label}:</span>
          {item.href ? (
            <Link href={item.href} className="text-[10px] font-medium text-indigo-300 hover:text-indigo-200 truncate max-w-[100px]">
              {item.value}
            </Link>
          ) : (
            <span className="text-[10px] font-medium text-neutral-300">{item.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}

function StatBlock({ label, value }) {
  return (
    <div className="text-center">
      <p className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-sm font-semibold text-neutral-100">{value ?? 0}</p>
    </div>
  );
}

export default function FormMetrics({ formData, placeholderStats, stats }) {
  return (
    <div className="flex h-full flex-col rounded-xl p-2 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-2 scrollbar">
        {stats && (
          <motion.div {...fadeIn} className="p-4 border-b border-white/5">
            <SectionTitle>Cevap İstatistikleri</SectionTitle>
            <div className="flex items-center justify-around">
              <StatBlock label="Toplam" value={stats.totalResponses} />
              <StatBlock label="Bekleyen" value={stats.pendingCount} />
              <StatBlock label="Onaylanan" value={stats.approvedCount} />
              <StatBlock label="Reddedilen" value={stats.rejectedCount} />
            </div>
          </motion.div>
        )}

        <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.05 }} className="p-4 border-b border-white/5">
          <TrendChart hourlyData={placeholderStats?.hourlyTrend ?? []} dailyData={placeholderStats?.dailyTrend ?? []} />
        </motion.div>

        <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.05 }} className="p-4 border-b border-white/5">
          <SectionTitle>Ortalama Süre</SectionTitle>
          <div className="flex items-center justify-center gap-3">
            <Timer size={16} className="text-indigo-300 opacity-60" />
            <p className="text-lg font-bold text-neutral-100">{formatDuration(placeholderStats?.averageCompletionTime)}</p>
          </div>
        </motion.div>

        <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.1 }} className="p-4 border-b border-white/5">
          <SectionTitle>Kaynak Dağılımı</SectionTitle>
          <SourceBreakdownBar
            registered={placeholderStats?.sourceBreakdown?.registered ?? 0}
            anonymous={placeholderStats?.sourceBreakdown?.anonymous ?? 0}
          />
        </motion.div>

        <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.15 }} className="p-4">
          <SectionTitle>Form Bilgileri</SectionTitle>
          <FormInfoGrid formData={formData} />
        </motion.div>
      </div>
    </div>
  );
}
