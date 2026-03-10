"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { FileText, Plus, Layers, ChartColumn, ArrowUpRight, Clock, ClipboardCheck, UserX, Repeat2, BookOpen, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useUserFormsQuery, useServiceMetricsQuery } from "@/lib/hooks/useFormAdmin";
import { useGroupsQuery } from "@/lib/hooks/useGroupAdmin";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 12, filter: "blur(2px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

function getDisplayName(user) {
  if (!user?.fullName) return "Kullanıcı";
  return user.fullName.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map((w) => w.replace(/^\p{L}/u, (c) => c.toLocaleUpperCase("tr-TR"))).join(" ");
}

function StatCard({ icon: Icon, label, value, href }) {
  const inner = (
    <div className="group relative flex h-full items-center gap-4 rounded-xl border border-white/6 bg-white/2 p-4 transition-colors hover:border-white/12 hover:bg-white/4">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-white/8 bg-white/3">
        <Icon className="h-5 w-5 text-neutral-400" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-500">{label}</p>
        <p className="text-lg font-semibold text-neutral-100 tabular-nums">{value ?? "--"}</p>
      </div>
      {href && (
        <ArrowUpRight className="h-4 w-4 text-neutral-600 transition-all group-hover:text-neutral-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      )}
    </div>
  );

  if (href) return <Link href={href}>{inner}</Link>;
  return inner;
}

function QuickAction({ icon: Icon, label, description, href, variant = "default" }) {
  const variantClass =
    variant === "primary"
      ? "border-skylab-400/25 bg-skylab-500/[0.06] hover:border-skylab-400/40 hover:bg-skylab-500/[0.1]"
      : "border-white/6 bg-white/2 hover:border-white/12 hover:bg-white/4";

  return (
    <Link href={href} className={`group flex items-center gap-3.5 rounded-xl border p-4 transition-all ${variantClass}`}>
      <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${variant === "primary" ? "border border-skylab-400/30 bg-skylab-500/10" : "border border-white/8 bg-white/3"}`}>
        <Icon className={`h-4 w-4 ${variant === "primary" ? "text-skylab-300" : "text-neutral-400"}`} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-neutral-200">{label}</p>
        <p className="text-[11px] text-neutral-500 truncate">{description}</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-neutral-700 transition-all group-hover:text-neutral-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
    </Link>
  );
}

function RecentFormItem({ form }) {
  if (!form) return null;
  const responsesHref = `/admin/forms/${form.id}/responses`;
  const editHref = `/admin/forms/${form.id}/edit`;

  return (
    <div className="group/row relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white/4">
      <Link href={`/admin/forms/${form.id}`} className="absolute inset-0 z-0" tabIndex={-1} />
      <div className="min-w-0 flex-1 relative z-10">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-neutral-200 truncate">{form.title || "--"}</p>
          <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[7px] uppercase tracking-[0.18em] ${form.status === 2 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>
            {form.status === 2 ? "Aktif" : "Pasif"}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
            <ChartColumn size={10} />
            {form.responseCount ?? 0} cevap
          </span>
          <div className="flex items-center gap-1">
            {form.allowMultipleResponses && <Repeat2 size={10} className="text-skylab-500/70" />}
            {form.allowAnonymousResponses && <UserX size={10} className="text-skylab-500/70" />}
            {form.requiresManualReview && <ClipboardCheck size={10} className="text-skylab-500/70" />}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1 relative z-10">
        <Link href={responsesHref} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/8 bg-transparent text-neutral-400 hover:bg-white/5 hover:text-neutral-200 transition-colors" title="Cevaplar">
          <ChartColumn className="h-3.5 w-3.5" />
        </Link>
        <Link href={editHref} className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-skylab-400/30 bg-skylab-500/10 text-skylab-300 hover:bg-skylab-400/20 transition-colors" title="Düzenle">
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function SkeletonBlock({ className = "" }) {
  return <div aria-hidden="true" className={`shimmer ${className}`} />;
}

function RecentFormsSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-3.5 w-32 rounded-md" />
              <SkeletonBlock className="h-3 w-10 rounded-md" />
            </div>
            <SkeletonBlock className="mt-1.5 h-2.5 w-20 rounded-md" />
          </div>
          <div className="flex items-center gap-1">
            <SkeletonBlock className="h-7 w-7 rounded-md" />
            <SkeletonBlock className="h-7 w-7 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

function TrendBadge({ value }) {
  if (value === null || value === undefined) return null;
  const rounded = Math.round(value * 10) / 10;
  const isUp = rounded > 0;
  const isDown = rounded < 0;
  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
  const color = isUp ? "text-emerald-400" : isDown ? "text-red-400" : "text-neutral-400";

  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${color}`}>
      <Icon size={10} />
      {isUp ? "+" : ""}{rounded}%
    </span>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border border-white/10 bg-neutral-900/90 px-2.5 py-1.5 shadow-xl">
      <p className="text-[10px] text-neutral-500">{label}</p>
      <p className="text-[12px] font-medium text-indigo-300">{payload[0].value}</p>
    </div>
  );
}

function TrendChart({ title, data, gradientId, color = "rgb(129,140,248)", trendPercentage }) {
  const hasData = data && data.length > 0;

  return (
    <div className="rounded-xl border border-white/6 bg-white/2 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">{title}</h3>
        <TrendBadge value={trendPercentage} />
      </div>
      {hasData ? (
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 10 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "rgb(100,100,110)" }} dy={6}/>
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: color, strokeWidth: 0.5, strokeDasharray: "3 3" }} />
              <Area type="monotone" dataKey="count" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
                activeDot={{ r: 4, fill: color, strokeWidth: 2, stroke: "rgb(23,23,23)" }} animationDuration={600} animationEasing="ease-out"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-40 items-center justify-center">
          <p className="text-[12px] text-neutral-600">Veri bulunamadı</p>
        </div>
      )}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-white/6 bg-white/2 p-4">
      <div className="mb-3 h-2.5 w-28 rounded shimmer" />
      <div className="h-40 w-full rounded shimmer" />
    </div>
  );
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const displayName = getDisplayName(user);
  const greeting = getGreeting();

  const { data: formsData, isLoading: formsLoading } = useUserFormsQuery({
    pageSize: 5,
    sortDirection: "descending",
  });

  const { data: groupsData, isLoading: groupsLoading } = useGroupsQuery({
    pageSize: 1,
  });

  const { data: metricsData, isLoading: metricsLoading } = useServiceMetricsQuery();

  const metrics = metricsData?.data ?? metricsData;

  const forms = useMemo(() => {
    const meta = formsData?.data ?? {};
    return Array.isArray(meta.items) ? meta.items : Array.isArray(formsData) ? formsData : [];
  }, [formsData]);

  const totalForms = formsData?.data?.totalCount ?? forms.length;
  const totalGroups = groupsData?.data?.totalCount ?? 0;

  const totalResponses = useMemo(() => {
    return forms.reduce((sum, f) => sum + (f.responseCount ?? 0), 0);
  }, [forms]);

  const isLoading = status === "loading" || formsLoading;

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-y-auto overflow-x-hidden p-6 scrollbar">
      <motion.div variants={container} initial="hidden" animate="show" className="mx-auto w-full max-w-7xl space-y-8">
        <motion.div variants={item}>
          <h1 className="text-2xl font-bold text-neutral-100">
            {greeting},{" "}
            {status === "loading" ? (
              <SkeletonBlock className="inline-block h-6 w-32 rounded-md align-middle" />
            ) : (
              <span className="text-neutral-400">{displayName.split(" ")[0]}</span>
            )}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Formlarını yönet, cevapları takip et ve yeni projeler oluştur.
          </p>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard icon={FileText} label="Toplam Form" value={isLoading ? "--" : totalForms} href="/admin/forms" />
          <StatCard icon={ChartColumn} label="Toplam Cevap" value={isLoading ? "--" : totalResponses} />
          <StatCard icon={Layers} label="Bileşen Grubu" value={groupsLoading ? "--" : totalGroups} href="/admin/component-groups" />
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {metricsLoading ? (
            <>
              <ChartSkeleton />
              <ChartSkeleton />
            </>
          ) : (
            <>
              <TrendChart
                title="Haftalık Form Oluşturma Trendi"
                data={metrics?.formsCreatedWeeklyTrend}
                gradientId="formsGradient"
                color="#e0c8e5"
                trendPercentage={metrics?.formsWeeklyTrendPercentage}
              />
              <TrendChart
                title="Haftalık Cevap Trendi"
                data={metrics?.responsesWeeklyTrend}
                gradientId="responsesGradient"
                color="#e0c8e5"
                trendPercentage={metrics?.responsesWeeklyTrendPercentage}
              />
            </>
          )}
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch">
          <motion.div variants={item} className="lg:col-span-7 flex">
            <div className="flex-1 rounded-xl border border-white/6 bg-white/1.5 flex flex-col">
              <div className="flex items-center justify-between border-b border-white/6 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-neutral-200">Son Formlar</h2>
                  <p className="text-[10px] text-neutral-500">En son oluşturduğunuz formlar</p>
                </div>
                <Link href="/admin/forms" className="inline-flex items-center gap-1 rounded-lg border border-white/8 bg-white/3 px-2.5 py-1.5 text-[11px] font-medium text-neutral-400 transition-colors hover:border-white/15 hover:text-neutral-200">
                  Tümünü Gör
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="p-2">
                {formsLoading ? (
                  <RecentFormsSkeleton />
                ) : forms.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-8 w-8 text-neutral-700 mb-2" />
                    <p className="text-sm text-neutral-400">Henüz form oluşturulmamış</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5">İlk formunuzu oluşturmak için hızlı aksiyonları kullanın.</p>
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {forms.slice(0, 5).map((form) => (
                      <RecentFormItem key={form.id} form={form} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div variants={item} className="lg:col-span-5 flex flex-col gap-2">
              <QuickAction
                icon={Plus}
                label="Yeni Form Oluştur"
                description="Sıfırdan yeni bir form oluşturun"
                href="/admin/forms/new-form"
                variant="primary"
              />
              <QuickAction
                icon={FileText}
                label="Formları Görüntüle"
                description="Tüm formları listeleyin ve yönetin"
                href="/admin/forms"
              />
              <QuickAction
                icon={Layers}
                label="Bileşen Grupları"
                description="Hazır bileşen gruplarını yönetin"
                href="/admin/component-groups"
              />
              <QuickAction
                icon={Plus}
                label="Yeni Bileşen Grubu"
                description="Yeniden kullanılabilir bileşen grubu oluşturun"
                href="/admin/component-groups/new-group"
              />
              <QuickAction
                icon={BookOpen}
                label="Nasıl Kullanılır"
                description="Platform rehberi ve dökümentasyon"
                href="/admin/how-to-use"
              />
          </motion.div>
        </div>

      </motion.div>
    </div>
  );
}
