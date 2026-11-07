"use client";

import { Fragment, useId, useState } from "react";
import { motion } from "framer-motion";
import { ChevronRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import ChannelIcon from "../../share/ChannelIcon";
import { sourceLabel } from "@/lib/share-channels";
import { MIN_DECIDED, approvalRate } from "../overview-stats";

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

export function TrendArea({ data, className = "h-24 w-full" }) {
  const gradientId = `trend-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  return (
    <div className={className}>
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

const TIP_EDGE = 0.2;
const BAR_LABEL = "0.875rem";
const MIN_SCALE = 4;

function BarTip({ item, at }) {
  const align = at < TIP_EDGE ? "" : at > 1 - TIP_EDGE ? "-translate-x-full" : "-translate-x-1/2";
  return (
    <div className={`pointer-events-none absolute bottom-full z-20 mb-1 whitespace-nowrap rounded-md border border-white/10 bg-neutral-900/95 px-2.5 py-1.5 shadow-xl ${align}`} style={{ left: `${at * 100}%` }}>
      <p className="text-3xs text-neutral-400">{item.title}</p>
      <p className="text-2xs font-medium tabular-nums text-neutral-100">{item.line}</p>
    </div>
  );
}

function TrendBars({ items, height = 76, labeled = false }) {
  const [hovered, setHovered] = useState(null);
  const peak = Math.max(MIN_SCALE, ...items.map((item) => item.count ?? 0));
  const active = hovered == null ? null : items[hovered];
  const room = labeled ? `100% - ${BAR_LABEL}` : "100%";

  return (
    <div className="relative" style={{ height }} onPointerLeave={() => setHovered(null)}>
      <div className="grid h-full items-end gap-0.5" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item, index) => (
          <div key={item.key} onPointerEnter={() => setHovered(index)} className="relative flex h-full flex-col items-center justify-end">
            {item.closing ? <span className="absolute inset-y-0 -right-px border-r border-dashed border-white/30" /> : null}
            {labeled ? <span className={`pb-0.5 text-3xs leading-3 tabular-nums ${item.count ? "text-neutral-300" : "text-neutral-600"}`}>{item.count}</span> : null}
            {item.count ? (
              <span className={`w-full max-w-6 rounded-t-[3px] transition-colors ${item.now ? "bg-skylab-300" : hovered === index ? "bg-skylab-500" : "bg-skylab-500/40"}`}
                style={{ height: `calc((${room}) * ${Math.max(0.06, item.count / peak)})` }}
              />
            ) : <span className={`h-0.5 w-full max-w-6 rounded-full ${item.count === 0 ? "bg-white/10" : "bg-white/5"}`} />}
          </div>
        ))}
      </div>
      {active ? <BarTip item={active} at={(hovered + 0.5) / items.length} /> : null}
    </div>
  );
}

function TrendRows({ items }) {
  const peak = Math.max(1, ...items.map((item) => item.count ?? 0));

  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <div key={item.key} title={item.line} className="grid grid-cols-[2.625rem_minmax(0,1fr)_1.375rem] items-center gap-2 text-3xs tabular-nums text-neutral-500">
          <span className="truncate">{item.title}</span>
          <span className="flex h-3.5 items-center">
            {item.count ? (
              <span className={`h-full min-w-[3px] rounded-r-[3px] ${item.now ? "bg-skylab-300" : "bg-skylab-500/40"}`} style={{ width: `${(item.count / peak) * 100}%` }} />
            ) : <span className="h-0.5 w-full rounded-full bg-white/10" />}
          </span>
          <span className="text-right font-medium text-neutral-200">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

export function WindowBars({ data, hourly = false }) {
  const items = data.map((item, index) => ({ key: item.key, title: item.label, line: `${item.count} cevap`, count: item.count, now: index === data.length - 1 }));
  if (items.length === 0) return null;

  return (
    <div role="img" aria-label={`${data[0].label} ile ${data[data.length - 1].label} arasındaki cevaplar`} className="space-y-1.5">
      <TrendBars items={items} labeled={!hourly} />
      {hourly ? (
        <div className="flex justify-between text-3xs tabular-nums text-neutral-500">
          <span>{data[0].label}</span>
          <span>{data[Math.floor(data.length / 2)].label}</span>
          <span>{data[data.length - 1].label}</span>
        </div>
      ) : (
        <div className="grid gap-0.5 text-center text-[0.5625rem] leading-3 text-neutral-500" style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
          {data.map((item) => <span key={item.key}>{item.label}</span>)}
        </div>
      )}
    </div>
  );
}

export function LifeBars({ life, height }) {
  const { points, closeKey, ended, weekly, sparse, total } = life;
  const first = points[0];
  const last = points[points.length - 1];
  const lastKnown = points.findLastIndex((point) => point.count != null);
  const closing = closeKey ? points.find((point) => point.key === closeKey) : null;
  const items = points.map((point, index) => ({
    key: point.key,
    title: `${point.label}${weekly ? " haftası" : ""}`,
    line: point.count == null ? (point.key === closeKey ? "Kapanış" : "Henüz gelmedi") : `${point.count} cevap · toplam ${point.total}`,
    count: point.count,
    closing: point.key === closeKey,
    now: index === lastKnown && !ended,
  }));

  return (
    <div role="img" aria-label={`${first.label} ile ${last.label} arasında ${total} cevap`} className="space-y-1.5">
      {sparse ? <TrendRows items={items} /> : <TrendBars items={items} height={height} />}
      {sparse ? null : (
        <div className="flex items-baseline justify-between text-3xs tabular-nums text-neutral-500">
          <span>{first.label}</span>
          {closing ? <span className="text-neutral-400">Kapanış {closing.label}</span> : <span>{last.label}</span>}
        </div>
      )}
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
const CHANNEL_GRID_DECISIONS = "grid grid-cols-[minmax(0,1fr)_2.5rem_2.5rem_2.5rem_2.75rem] items-center gap-x-2";

export function ChannelsTable({ channels, view = "clicks" }) {
  const [openSource, setOpenSource] = useState(null);
  if (channels.length === 0) {
    return <p className="text-3xs leading-relaxed text-neutral-600">Kanal seçilerek paylaşılan linklerle gelenler burada görünür.</p>;
  }

  const clicksKnown = channels.some((channel) => channel.clicks != null);
  const scansKnown = channels.some((channel) => channel.scans != null);
  const decisions = view === "decisions";
  const grid = decisions ? CHANNEL_GRID_DECISIONS : scansKnown ? CHANNEL_GRID_SCANS : CHANNEL_GRID;
  const rows = decisions ? channels.filter((channel) => channel.responses > 0) : channels;
  const outerOf = (channel) => (decisions ? channel.responses : channel.clicks ?? 0);
  const innerOf = (channel) => (decisions ? channel.approved ?? 0 : channel.responses);
  const max = Math.max(1, ...rows.map((channel) => Math.max(outerOf(channel), innerOf(channel))));

  return (
    <div>
      <div className="mb-2 flex gap-3 text-3xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-2.5 rounded-r-sm bg-skylab-800" />{decisions ? "Yanıt" : "Tıklama"}</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-2.5 rounded-r-sm bg-skylab-500" />{decisions ? "Onay" : "Yanıt"}</span>
      </div>
      <div className={`${grid} pb-1 text-3xs text-neutral-600`}>
        <span>Kanal</span>
        {decisions ? (
          <>
            <span className="text-right">Yanıt</span>
            <span className="text-right">Onay</span>
            <span className="text-right">Ret</span>
            <span className="text-right">Oran</span>
          </>
        ) : (
          <>
            <span className="text-right">Tıklama</span>
            {scansKnown && <span className="text-right">QR&apos;dan</span>}
            <span className="text-right">Yanıt</span>
            <span className="text-right">Dönüşüm</span>
          </>
        )}
      </div>
      {rows.map((channel) => {
        const untagged = !channel.source;
        const label = sourceLabel(channel.source);
        const rate = decisions
          ? approvalRate(channel.approved, channel.declined)
          : !untagged && channel.clicks > 0 ? Math.round((channel.responses / channel.clicks) * 100) : null;
        const summary = decisions
          ? `${label}: ${channel.responses} yanıt, ${channel.approved ?? 0} onay, ${channel.declined ?? 0} ret${rate != null ? `, %${rate} onay oranı` : ""}`
          : `${label}: ${channel.responses} yanıt${channel.clicks != null ? `, ${channel.clicks} tıklama` : ""}${channel.scans > 0 ? `, ${channel.scans} QR okutması` : ""}${rate != null ? `, %${rate} dönüşüm` : ""}`;
        const campaigns = Array.isArray(channel.campaigns) && channel.campaigns.length > 1 ? channel.campaigns : null;
        const open = campaigns && openSource === channel.source;
        const toggle = () => setOpenSource(open ? null : channel.source);
        return (
          <Fragment key={channel.source ?? "untagged"}>
          <div title={summary} className={`${grid} group/channel py-1.5 ${campaigns ? "cursor-pointer" : ""}`}
            {...(campaigns ? { role: "button", tabIndex: 0, "aria-expanded": Boolean(open), onClick: toggle, onKeyDown: (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); } } } : {})}
          >
            <span className="flex min-w-0 items-center gap-2 text-2xs text-neutral-300 transition-colors group-hover/channel:text-neutral-100">
              <span className="grid size-5 shrink-0 place-items-center rounded-md border border-white/10 bg-white/3 text-neutral-400">
                <ChannelIcon source={channel.source} size={11} />
              </span>
              <span className="truncate">{label}</span>
              {campaigns ? <ChevronRight size={11} className={`shrink-0 text-neutral-600 transition-transform duration-200 ${open ? "rotate-90" : ""}`} /> : null}
            </span>
            {decisions ? (
              <>
                <span className="text-right text-2xs tabular-nums text-neutral-200">{channel.responses}</span>
                <span className="text-right text-2xs tabular-nums text-neutral-200">{channel.approved ?? 0}</span>
                <span className="text-right text-2xs tabular-nums text-neutral-500">{channel.declined ?? 0}</span>
              </>
            ) : (
              <>
                <span className="text-right text-2xs tabular-nums text-neutral-200">{channel.clicks ?? "—"}</span>
                {scansKnown && <span className="text-right text-2xs tabular-nums text-neutral-500">{channel.scans ? channel.scans : "·"}</span>}
                <span className="text-right text-2xs tabular-nums text-neutral-200">{channel.responses}</span>
              </>
            )}
            <span className="text-right text-2xs tabular-nums text-neutral-500">{rate == null ? "—" : `%${rate}`}</span>
            <span aria-hidden="true" className={`relative mt-1.5 h-1.5 transition-[filter] group-hover/channel:brightness-110 ${decisions || scansKnown ? "col-span-5" : "col-span-4"}`}>
              {outerOf(channel) > 0 && (
                <span className={`absolute inset-y-0 left-0 rounded-r-[3px] ${untagged ? "bg-neutral-700" : "bg-skylab-800"}`}
                  style={{ width: `${(outerOf(channel) / max) * 100}%` }}
                />
              )}
              {innerOf(channel) > 0 && (
                <span className={`absolute inset-y-0 left-0 rounded-r-[3px] shadow-[2px_0_0_0_var(--color-neutral-900)] ${untagged ? "bg-neutral-500" : "bg-skylab-500"}`}
                  style={{ width: `${(innerOf(channel) / max) * 100}%` }}
                />
              )}
            </span>
          </div>
          {open ? (
            <div className="mb-1.5 ml-2.5 space-y-1 border-l border-white/10 pl-4">
              {campaigns.map((item) => (
                <div key={item.campaign ?? "none"} className="flex items-center gap-2 text-3xs">
                  <span className={`min-w-0 flex-1 truncate ${item.campaign ? "font-mono text-neutral-400" : "text-neutral-600"}`}>{item.campaign ?? "Kampanyasız"}</span>
                  <span className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-white/5">
                    <span className="block h-full rounded-full bg-skylab-500/70" style={{ width: `${(item.responses / Math.max(1, channel.responses)) * 100}%` }} />
                  </span>
                  <span className="w-12 shrink-0 text-right tabular-nums text-neutral-300">{decisions ? `${item.approved ?? 0} onay` : `${item.responses} yanıt`}</span>
                </div>
              ))}
            </div>
          ) : null}
          </Fragment>
        );
      })}
      <p className="mt-2 text-3xs leading-relaxed text-neutral-600">
        {decisions
          ? `Oran: karar verilen yanıtların onaylanma oranı; ${MIN_DECIDED}'ten az kararda gösterilmez. Bekleyenler sayılmaz.`
          : clicksKnown
            ? "Tıklamalar kısa linkten, yanıtlar formdan; ikisi de son 90 gün. QR'dan: tıklamaların QR okutmasıyla gelen kısmı. Etiketsiz: kaynağı tanınamayan açılışlar ve form adresi."
            : "Tıklamalara şu an ulaşılamadı; yanıtlar formdan sayılıyor."}
      </p>
    </div>
  );
}
