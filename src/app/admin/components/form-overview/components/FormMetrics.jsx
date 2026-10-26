"use client";

import { useId } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import ChannelIcon from "../../share/ChannelIcon";
import { sourceLabel } from "@/lib/share-channels";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
};

export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined) return "--";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}dk ${s}sn`;
}

export function Section({ children, delay = 0, className = "" }) {
  return (
    <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay }}
      className={`py-4 first:pt-0 last:pb-0 ${className}`}
    >
      {children}
    </motion.div>
  );
}

export function SectionTitle({ children, icon: Icon }) {
  return (
    <div className="mb-3 flex items-center gap-1.5">
      {Icon && <Icon size={12} className="shrink-0 text-neutral-500" />}
      <h3 className="text-2xs font-medium text-neutral-500">{children}</h3>
    </div>
  );
}

export function TrendBadge({ value }) {
  if (value === null || value === undefined) return null;
  const rounded = Math.round(value * 10) / 10;
  const isUp = rounded > 0;
  const isDown = rounded < 0;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const color = isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-neutral-400";

  return (
    <span className={`inline-flex items-center gap-1 text-3xs font-medium ${color}`}>
      <Icon size={10} />
      {isUp ? "+" : ""}{rounded}%
    </span>
  );
}

export function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-white/10 bg-neutral-900/90 px-2.5 py-1.5 shadow-xl">
      <span className="text-2xs font-medium text-skylab-300">{payload[0].value}</span>
    </div>
  );
}

export function TrendArea({ data }) {
  const gradientId = `trend-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 320, height: 96 }}>
        <AreaChart data={data} margin={{ top: 5, right: 10, bottom: -2, left: 10 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e0c8e5" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#e0c8e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "rgb(100,100,110)" }} interval={0} dy={4} />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#e0c8e5", strokeWidth: 0.5, strokeDasharray: "3 3" }} />
          <Area type="monotone" dataKey="count" stroke="#e0c8e5" strokeWidth={2} fill={`url(#${gradientId})`}
            dot={{ r: 2.5, fill: "#e0c8e5", strokeWidth: 0 }} activeDot={{ r: 4, fill: "#f3e8f5", strokeWidth: 0 }} animationDuration={500} animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function SourceBreakdownBar({ registered, anonymous }) {
  const total = registered + anonymous;
  const regPct = total > 0 ? (registered / total) * 100 : 50;
  const anonPct = total > 0 ? (anonymous / total) * 100 : 50;

  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-800">
        {total > 0 ? (
          <>
            {regPct > 0 && <div style={{ width: `${regPct}%` }} className="bg-skylab-600 transition-all duration-300" />}
            {anonPct > 0 && <div style={{ width: `${anonPct}%` }} className="bg-skylab-300 transition-all duration-300" />}
          </>
        ) : null}
      </div>
      <div className="mt-2 flex justify-center gap-3">
        <div className="flex items-center gap-1">
          <div className="size-1.5 rounded-full bg-skylab-600" />
          <span className="text-3xs text-neutral-500">Kayıtlı ({registered})</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="size-1.5 rounded-full bg-skylab-300" />
          <span className="text-3xs text-neutral-500">Anonim ({anonymous})</span>
        </div>
      </div>
    </div>
  );
}

const CHANNEL_GRID = "grid grid-cols-[minmax(0,1fr)_3.25rem_2.75rem_3.5rem] items-center gap-x-2";
const CHANNEL_GRID_SCANS = "grid grid-cols-[minmax(0,1fr)_3rem_2.75rem_2.75rem_3.25rem] items-center gap-x-2";

export function ChannelsTable({ channels }) {
  if (channels.length === 0) {
    return <p className="text-3xs leading-relaxed text-neutral-600">Kanal seçilerek paylaşılan linklerle gelenler burada görünür.</p>;
  }

  const clicksKnown = channels.some((channel) => channel.clicks != null);
  const scansKnown = channels.some((channel) => channel.scans != null);
  const grid = scansKnown ? CHANNEL_GRID_SCANS : CHANNEL_GRID;
  const max = Math.max(1, ...channels.map((channel) => Math.max(channel.clicks ?? 0, channel.responses)));

  return (
    <div>
      <div className="mb-2 flex gap-3 text-3xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-2.5 rounded-r-sm bg-skylab-800" />Tıklama</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-2.5 rounded-r-sm bg-skylab-500" />Yanıt</span>
      </div>
      <div className={`${grid} pb-1 text-3xs text-neutral-600`}>
        <span>Kanal</span>
        <span className="text-right">Tıklama</span>
        {scansKnown && <span className="text-right">QR&apos;dan</span>}
        <span className="text-right">Yanıt</span>
        <span className="text-right">Dönüşüm</span>
      </div>
      {channels.map((channel) => {
        const untagged = !channel.source;
        const label = sourceLabel(channel.source);
        const rate = !untagged && channel.clicks > 0 ? Math.round((channel.responses / channel.clicks) * 100) : null;
        const summary = `${label}: ${channel.responses} yanıt${channel.clicks != null ? `, ${channel.clicks} tıklama` : ""}${channel.scans > 0 ? `, ${channel.scans} QR okutması` : ""}${rate != null ? `, %${rate} dönüşüm` : ""}`;
        return (
          <div key={channel.source ?? "untagged"} title={summary} className={`${grid} group/channel py-1.5`}>
            <span className="flex min-w-0 items-center gap-2 text-2xs text-neutral-300 transition-colors group-hover/channel:text-neutral-100">
              <span className="grid size-5 shrink-0 place-items-center rounded-md border border-white/10 bg-white/3 text-neutral-400">
                <ChannelIcon source={channel.source} size={11} />
              </span>
              <span className="truncate">{label}</span>
            </span>
            <span className="text-right text-2xs tabular-nums text-neutral-200">{channel.clicks ?? "—"}</span>
            {scansKnown && <span className="text-right text-2xs tabular-nums text-neutral-500">{channel.scans ? channel.scans : "·"}</span>}
            <span className="text-right text-2xs tabular-nums text-neutral-200">{channel.responses}</span>
            <span className="text-right text-2xs tabular-nums text-neutral-500">{rate == null ? "—" : `%${rate}`}</span>
            <span aria-hidden="true" className={`relative mt-1.5 h-1.5 transition-[filter] group-hover/channel:brightness-110 ${scansKnown ? "col-span-5" : "col-span-4"}`}>
              {channel.clicks > 0 && (
                <span className={`absolute inset-y-0 left-0 rounded-r-[3px] ${untagged ? "bg-neutral-700" : "bg-skylab-800"}`}
                  style={{ width: `${(channel.clicks / max) * 100}%` }}
                />
              )}
              {channel.responses > 0 && (
                <span className={`absolute inset-y-0 left-0 rounded-r-[3px] shadow-[2px_0_0_0_var(--color-neutral-900)] ${untagged ? "bg-neutral-500" : "bg-skylab-500"}`}
                  style={{ width: `${(channel.responses / max) * 100}%` }}
                />
              )}
            </span>
          </div>
        );
      })}
      <p className="mt-2 text-3xs leading-relaxed text-neutral-600">
        {clicksKnown
          ? "Tıklamalar kısa linkten, yanıtlar formdan; ikisi de son 90 gün. QR'dan: tıklamaların QR okutmasıyla gelen kısmı. Etiketsiz: kaynağı tanınamayan açılışlar ve form adresi."
          : "Tıklamalara şu an ulaşılamadı; yanıtlar formdan sayılıyor."}
      </p>
    </div>
  );
}
