"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Timer, User2, ToggleLeft, ToggleRight, Workflow, Hash, Shield, TrendingUp, TrendingDown, Minus, Users, Megaphone, Link2, Copy, Check } from "lucide-react";
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { ROLE_BADGE } from "../../ListItem";
import ChannelIcon from "../../share/ChannelIcon";
import Avatar from "@/app/components/utils/Avatar";
import { effectiveFormSettings } from "@/lib/form-settings";
import { sourceLabel } from "@/lib/share-channels";
import { publicShortUrl } from "@/lib/short-url";
import { useShortLinkQuery } from "@/lib/hooks/useShortLink";

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
};

function formatDuration(seconds) {
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

const RESPONSE_STATS = [
  { key: "totalResponses", label: "Toplam", tone: "text-neutral-100", dot: "bg-neutral-500" },
  { key: "pendingCount", label: "Bekleyen", tone: "text-amber-300", dot: "bg-amber-400 shadow-[0_0_6px] shadow-amber-400/40" },
  { key: "approvedCount", label: "Onaylanan", tone: "text-emerald-300", dot: "bg-emerald-400 shadow-[0_0_6px] shadow-emerald-400/40" },
  { key: "rejectedCount", label: "Reddedilen", tone: "text-red-300", dot: "bg-red-400 shadow-[0_0_6px] shadow-red-400/40" },
];

function ResponseStats({ metrics }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {RESPONSE_STATS.map((s) => (
        <div key={s.key} className="flex items-center gap-2.5 rounded-md border border-white/5 bg-white/3 px-3 py-2.5">
          <span className={`size-1.5 shrink-0 rounded-full ${s.dot}`} />
          <div className="min-w-0">
            <p className="truncate text-3xs text-neutral-500">{s.label}</p>
            <p className={`text-lg font-semibold leading-tight tabular-nums ${s.tone}`}>{metrics?.[s.key] ?? 0}</p>
          </div>
        </div>
      ))}
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

function TrendChart({ hourlyData, dailyData, dailyTrendPercentage, hourlyTrendPercentage }) {
  const [mode, setMode] = useState("daily");
  const data = mode === "hourly" ? hourlyData : dailyData;
  const trendValue = mode === "hourly" ? hourlyTrendPercentage : dailyTrendPercentage;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SectionTitle>Cevap Trendi</SectionTitle>
          <span className="-mt-3"><TrendBadge value={trendValue} /></span>
        </div>
        <div className="flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 p-0.5">
          <button type="button" onClick={() => setMode("hourly")}
            className={`rounded px-2 py-0.5 text-3xs transition ${mode === "hourly" ? "bg-white/10 text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            Saatlik
          </button>
          <button type="button" onClick={() => setMode("daily")}
            className={`rounded px-2 py-0.5 text-3xs transition ${mode === "daily" ? "bg-white/10 text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
          >
            Günlük
          </button>
        </div>
      </div>

      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 10, bottom: -2, left: 10 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e0c8e5" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#e0c8e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "rgb(100,100,110)" }} interval={0} dy={4} />
            <YAxis hide domain={[0, "auto"]} />
            <Tooltip content={<TrendTooltip />} cursor={{ stroke: "#e0c8e5", strokeWidth: 0.5, strokeDasharray: "3 3" }} />
            <Area type="monotone" dataKey="count" stroke="#e0c8e5" strokeWidth={2} fill="url(#colorCount)"
              dot={{ r: 2.5, fill: "#e0c8e5", strokeWidth: 0 }} activeDot={{ r: 4, fill: "#f3e8f5", strokeWidth: 0 }} animationDuration={500} animationEasing="ease-out"
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

function ChannelsSection({ channels }) {
  const clicksKnown = channels.some((channel) => channel.clicks != null);
  const max = Math.max(1, ...channels.map((channel) => Math.max(channel.clicks ?? 0, channel.responses)));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Megaphone size={12} className="shrink-0 text-neutral-500" />
          <h3 className="text-2xs font-medium text-neutral-500">Kanallar</h3>
        </div>
        <span className="text-3xs text-neutral-600">Son 90 gün</span>
      </div>

      {channels.length === 0 ? (
        <p className="text-3xs leading-relaxed text-neutral-600">Kanal seçilerek paylaşılan linklerle gelenler burada görünür.</p>
      ) : (
        <>
          <div className="mb-2 flex gap-3 text-3xs text-neutral-500">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-2.5 rounded-r-sm bg-skylab-800" />Tıklama</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-2.5 rounded-r-sm bg-skylab-500" />Yanıt</span>
          </div>
          <div className={`${CHANNEL_GRID} pb-1 text-3xs text-neutral-600`}>
            <span>Kanal</span>
            <span className="text-right">Tıklama</span>
            <span className="text-right">Yanıt</span>
            <span className="text-right">Dönüşüm</span>
          </div>
          {channels.map((channel) => {
            const untagged = !channel.source;
            const label = sourceLabel(channel.source);
            const rate = !untagged && channel.clicks > 0 ? Math.round((channel.responses / channel.clicks) * 100) : null;
            const summary = `${label}: ${channel.responses} yanıt${channel.clicks != null ? `, ${channel.clicks} tıklama` : ""}${rate != null ? `, %${rate} dönüşüm` : ""}`;
            return (
              <div key={channel.source ?? "untagged"} title={summary} className={`${CHANNEL_GRID} group/channel py-1.5`}>
                <span className="flex min-w-0 items-center gap-2 text-2xs text-neutral-300 transition-colors group-hover/channel:text-neutral-100">
                  <span className="grid size-5 shrink-0 place-items-center rounded-md border border-white/10 bg-white/3 text-neutral-400">
                    <ChannelIcon source={channel.source} size={11} />
                  </span>
                  <span className="truncate">{label}</span>
                </span>
                <span className="text-right text-2xs tabular-nums text-neutral-200">{channel.clicks ?? "—"}</span>
                <span className="text-right text-2xs tabular-nums text-neutral-200">{channel.responses}</span>
                <span className="text-right text-2xs tabular-nums text-neutral-500">{rate == null ? "—" : `%${rate}`}</span>
                <span aria-hidden="true" className="relative col-span-4 mt-1.5 h-1.5 transition-[filter] group-hover/channel:brightness-110">
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
              ? "Tıklamalar kısa linkten, yanıtlar formdan; ikisi de son 90 gün. Etiketsiz: kanal seçilmeden paylaşılan link ve form adresi."
              : "Tıklamalara şu an ulaşılamadı; yanıtlar formdan sayılıyor."}
          </p>
        </>
      )}
    </div>
  );
}

function ShortLinkRow({ formId }) {
  const { data: link } = useShortLinkQuery(formId);
  const [copied, setCopied] = useState(false);
  const url = link?.alias ? publicShortUrl(link.alias) : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-1.5 text-2xs text-neutral-500">
        <Link2 size={12} className="shrink-0 text-neutral-600" />
        Kısa link
      </span>
      {url ? (
        <button type="button" onClick={copy} title="Kopyala"
          className={`inline-flex max-w-[60%] items-center gap-1.5 font-mono text-2xs transition-colors ${copied ? "text-emerald-300" : "text-skylab-300 hover:text-neutral-50"}`}
        >
          <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
          {copied ? <Check size={11} className="shrink-0" /> : <Copy size={11} className="shrink-0" />}
        </button>
      ) : (
        <span className="text-2xs font-medium text-neutral-500">Henüz yok</span>
      )}
    </div>
  );
}

function CollaboratorsSection({ formData }) {
  const collaborators = [...(formData?.data?.collaborators ?? formData?.collaborators ?? [])].sort((a, b) => b.role - a.role);

  return (
    <div>
      <SectionTitle icon={Users}>İşbirlikçiler</SectionTitle>
      {collaborators.length === 0 ? (
        <p className="text-center text-3xs text-neutral-600">İşbirlikçi yok</p>
      ) : (
        <div className="flex flex-col gap-2">
          {collaborators.map((c) => {
            const badge = ROLE_BADGE[c.role] ?? ROLE_BADGE.default;
            const name = c.user?.fullName || "??";
            const email = c.user?.email;
            return (
              <div key={c.user?.id} className="flex items-center gap-2.5">
                <Avatar name={c.user?.fullName || ""} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-2xs font-medium text-neutral-200">{name}</p>
                  {email && <p className="truncate text-3xs text-neutral-500">{email}</p>}
                </div>
                <span className={`shrink-0 rounded-md px-1 py-0.5 text-4xs uppercase tracking-[0.18em] ${badge.className}`}>
                  {badge.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FormInfoList({ formData }) {
  const formId = formData?.data?.id ?? formData?.id;
  const formSchema = formData?.data?.schema ?? formData?.schema ?? [];
  const settings = effectiveFormSettings(formData?.data ?? formData);
  const workflow = formData?.data?.workflow ?? formData?.workflow ?? null;
  const userRole = formData?.data?.userRole ?? formData?.userRole;

  const items = [
    { icon: Hash, label: "Soru", value: formSchema.length },
    { icon: User2, label: "Anonim", value: settings.allowAnonymousResponses ? "Açık" : "Kapalı" },
    {
      icon: settings.allowMultipleResponses ? ToggleRight : ToggleLeft,
      label: settings.managedByWorkflow ? "Tekrar başlatma" : "Çoklu cevap",
      value: settings.allowMultipleResponses ? "Açık" : "Kapalı",
    },
    { icon: Workflow, label: "Akış", value: workflow ? `${workflow.name || "Adsız akış"} · ${workflow.isStart ? "Başlangıç" : "Adım"}` : "Yok", href: workflow ? `/admin/workflows/${workflow.id}` : null },
    { icon: Shield, label: "Rol", value: userRole === 0 ? "Yok" : (ROLE_BADGE[userRole]?.label ?? ROLE_BADGE.default.label) },
  ];

  return (
    <div>
      <SectionTitle>Form Bilgileri</SectionTitle>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 items-center gap-1.5 text-2xs text-neutral-500">
              <item.icon size={12} className="shrink-0 text-neutral-600" />
              {item.label}
            </span>
            {item.href ? (
              <Link href={item.href} className="max-w-[55%] truncate text-2xs font-medium text-skylab-300 transition-colors hover:text-skylab-200">
                {item.value}
              </Link>
            ) : (
              <span className="max-w-[55%] truncate text-2xs font-medium text-neutral-200">{item.value}</span>
            )}
          </div>
        ))}
        {formId && <ShortLinkRow formId={formId} />}
      </div>
    </div>
  );
}

export default function FormMetrics({ formData, metrics }) {
  return (
    <div className="flex flex-col lg:h-full lg:overflow-hidden">
      <div className="flex items-center gap-2 px-1 lg:h-7">
        <span className="text-2xs font-medium text-neutral-500">Metrikler</span>
        <span className="h-px flex-1 bg-white/5" />
      </div>

      <div className="pt-4 scrollbar lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        <div className="divide-y divide-white/5">

          <Section delay={0}>
            <SectionTitle>Cevap İstatistikleri</SectionTitle>
            <ResponseStats metrics={metrics} />
          </Section>

          <Section delay={0.05}>
            <TrendChart
              hourlyData={metrics?.hourlyTrend ?? []}
              dailyData={metrics?.dailyTrend ?? []}
              dailyTrendPercentage={metrics?.dailyTrendPercentage}
              hourlyTrendPercentage={metrics?.hourlyTrendPercentage}
            />
          </Section>

          <Section delay={0.1}>
            <SectionTitle icon={Timer}>Katılım</SectionTitle>
            <div className="flex items-center justify-between">
              <span className="text-2xs text-neutral-500">Ortalama süre</span>
              <span className="text-sm font-semibold tabular-nums text-neutral-100">{formatDuration(metrics?.averageCompletionTime)}</span>
            </div>
            <div className="mt-4">
              <SourceBreakdownBar
                registered={metrics?.sourceBreakdown?.registered ?? 0}
                anonymous={metrics?.sourceBreakdown?.anonymous ?? 0}
              />
            </div>
          </Section>

          {Array.isArray(metrics?.channels) && (
            <Section delay={0.12}>
              <ChannelsSection channels={metrics.channels} />
            </Section>
          )}

          <Section delay={0.15}>
            <CollaboratorsSection formData={formData} />
          </Section>

          <Section delay={0.2}>
            <FormInfoList formData={formData} />
          </Section>

        </div>
      </div>
    </div>
  );
}
