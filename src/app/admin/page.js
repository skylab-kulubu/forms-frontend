"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { FileText, Plus, LayoutTemplate, ChartColumn, ArrowRight, ArrowUpRight, BookOpen, PencilLine } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { useUserFormsQuery, useServiceMetricsQuery } from "@/lib/hooks/useFormAdmin";
import { useGroupsQuery } from "@/lib/hooks/useGroupAdmin";
import { DashboardHeader } from "./components/Headers";
import { FeatureIcons, StatusDot, formatUpdatedAt } from "./components/ListItem";
import { Section, SectionTitle, TrendBadge, TrendTooltip } from "./components/form-overview/components/FormMetrics";

const RECENT_FORMS_COUNT = 8;

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return "İyi geceler";
  if (h < 12) return "Günaydın";
  if (h < 18) return "İyi günler";
  return "İyi akşamlar";
}

function getFirstName(user) {
  const full = user?.fullName?.trim();
  if (!full) return "Kullanıcı";
  const first = full.split(/\s+/)[0].toLocaleLowerCase("tr-TR");
  return first.replace(/^\p{L}/u, (c) => c.toLocaleUpperCase("tr-TR"));
}

const GREETING_NOTES = [
  "Kolay gelsin.",
  "Bugün ne oluşturuyoruz?",
  "Formların hazır, sen hazır mısın?",
  "Nereden devam edelim?",
  "Bir kahve, bir form.",
  "Cevaplar seni bekliyor.",
  "Sıradaki form senden.",
  "Bugün de güzel geçsin.",
];

function Greeting({ greeting, firstName, ready }) {
  if (!ready) return <span className="shimmer inline-block h-3 w-32 rounded-md align-middle lg:h-4 lg:w-44" />;

  return (
    <motion.span {...fadeIn} className="inline-block">
      {greeting}, <span className="text-neutral-300">{firstName}</span>
    </motion.span>
  );
}

function PanelHeading({ mobileTitle, desktopTitle, mobileNote, desktopNote, emphasizeDesktop = false }) {
  return (
    <>
      <div className="flex items-center gap-2 px-1 lg:h-7">
        <span className={`min-w-0 truncate text-2xs font-medium text-neutral-500 ${emphasizeDesktop ? "lg:text-base" : ""}`}>
          <span className="lg:hidden">{mobileTitle}</span>
          <span className="hidden lg:inline">{desktopTitle}</span>
        </span>
        <span className="h-px flex-1 bg-white/5" />
      </div>
      <p className="mt-0.5 h-4 truncate px-1 text-3xs leading-4 text-neutral-600">
        <span className="lg:hidden">{mobileNote}</span>
        <span className="hidden lg:inline">{desktopNote}</span>
      </p>
    </>
  );
}

const QUICK_ACTIONS = [
  { icon: Plus, label: "Yeni form oluştur", href: "/admin/forms/new-form", primary: true },
  { icon: FileText, label: "Tüm formlar", href: "/admin/forms" },
  { icon: LayoutTemplate, label: "Şablonlar", href: "/admin/templates" },
  { icon: BookOpen, label: "Nasıl kullanılır", href: "/admin/how-to-use" },
];

function QuickActions() {
  return (
    <div className="flex flex-col gap-0.5">
      {QUICK_ACTIONS.map(({ icon: Icon, label, href, primary }) => (
        <Link key={href} href={href}
          className="group/action flex items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-white/5"
        >
          <Icon size={12} className={`shrink-0 ${primary ? "text-skylab-400" : "text-neutral-600"}`} strokeWidth={1.75} />
          <span className={`min-w-0 flex-1 truncate text-2xs ${primary ? "font-medium text-skylab-300" : "text-neutral-300"}`}>{label}</span>
          <ArrowUpRight size={12} className="shrink-0 text-neutral-700 transition-colors group-hover/action:text-neutral-400" />
        </Link>
      ))}
    </div>
  );
}

const SERVICE_STATS = [
  { key: "forms", label: "Sistemdeki toplam form", dot: "bg-neutral-500", tone: "text-neutral-100", href: "/admin/forms/all", superAdminOnly: true },
  { key: "responses", label: "Sistemdeki toplam cevap", dot: "bg-skylab-400 shadow-[0_0_6px] shadow-skylab-400/40", tone: "text-neutral-100" },
  { key: "pending", label: "Sistemdeki bekleyen onay", dot: "bg-amber-400 shadow-[0_0_6px] shadow-amber-400/40", tone: "text-amber-300" },
  { key: "groups", label: "Sana ait şablon", dot: "bg-neutral-500", tone: "text-neutral-100", href: "/admin/templates" },
];

function ServiceStats({ values, isLoading, isSuperAdmin }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SERVICE_STATS.map((stat) => {
        const body = (
          <>
            <span className={`size-1.5 shrink-0 rounded-full ${stat.dot}`} />
            <div className="min-w-0">
              <p className="truncate text-3xs text-neutral-500" title={stat.label}>{stat.label}</p>
              <p className={`text-lg font-semibold leading-tight tabular-nums ${stat.tone}`}>
                {isLoading ? "--" : values[stat.key] ?? 0}
              </p>
            </div>
          </>
        );

        const className = "flex items-center gap-2.5 rounded-md border border-white/5 bg-white/3 px-3 py-2.5 transition-colors";
        const href = stat.href && (!stat.superAdminOnly || isSuperAdmin) ? stat.href : null;

        if (href) {
          return (
            <Link key={stat.key} href={href} className={`${className} hover:border-white/10 hover:bg-white/5`}>
              {body}
            </Link>
          );
        }
        return <div key={stat.key} className={className}>{body}</div>;
      })}
    </div>
  );
}

function WeeklyTrend({ title, data, trendPercentage, gradientId }) {
  const hasData = Array.isArray(data) && data.length > 0;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <SectionTitle>{title}</SectionTitle>
        <span className="-mt-3"><TrendBadge value={trendPercentage} /></span>
      </div>

      {hasData ? (
        <div className="h-24 w-full">
          <ResponsiveContainer width="100%" height="100%">
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
      ) : (
        <p className="py-6 text-center text-3xs text-neutral-600">Veri bulunamadı</p>
      )}
    </div>
  );
}

function TrendSkeleton() {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="shimmer h-2.5 w-32 rounded-md" />
      </div>
      <div className="shimmer h-24 w-full rounded-md" />
    </div>
  );
}

function RecentFormItem({ form }) {
  const viewHref = `/admin/forms/${form.id}`;
  const canEdit = Number(form.userRole) >= 2;

  return (
    <div className="group/row relative transition-colors hover:bg-white/3">
      <Link href={viewHref} className="absolute inset-0 z-0" aria-label={form.title ?? "Form"} tabIndex={-1} />
      <div className="flex items-center gap-3 px-2 py-2.5">
        <StatusDot status={form.status} />

        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/3">
          <FileText className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-medium text-neutral-200 transition-colors group-hover/row:text-neutral-50">{form.title || "--"}</h3>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <span className="text-3xs tabular-nums text-neutral-500">{form.responseCount ?? 0} yanıt</span>
            <FeatureIcons form={form} />
          </div>
        </div>

        <span className="hidden shrink-0 text-2xs tabular-nums text-neutral-500 sm:block">
          {formatUpdatedAt(form.updatedAt ?? form.createdAt)}
        </span>

        <div className="flex shrink-0 items-center gap-1 lg:w-14 lg:justify-end lg:opacity-0 lg:transition-opacity lg:group-hover/row:opacity-100">
          <Link href={`${viewHref}/responses`} title="Cevaplar" aria-label="Cevaplar"
            className="relative z-10 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10 text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-200 lg:pointer-events-none lg:group-hover/row:pointer-events-auto"
          >
            <ChartColumn className="h-3 w-3" />
          </Link>
          {canEdit ? (
            <Link href={`${viewHref}/edit`} title="Düzenle" aria-label="Düzenle"
              className="relative z-10 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-skylab-400/30 bg-skylab-500/10 text-skylab-300 transition-colors hover:bg-skylab-400/20 lg:pointer-events-none lg:group-hover/row:pointer-events-auto"
            >
              <PencilLine className="h-3 w-3" />
            </Link>
          ) : (
            <span title="Düzenleme yetkiniz yok" className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/5 text-neutral-700">
              <PencilLine className="h-3 w-3" />
            </span>
          )}
        </div>

        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-neutral-700 transition-all group-hover/row:translate-x-0.5 group-hover/row:text-neutral-400" />
      </div>
    </div>
  );
}

function RecentFormsSkeleton() {
  return (
    <div className="divide-y divide-white/5">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2.5">
          <div className="shimmer size-1.5 shrink-0 rounded-full" />
          <div className="shimmer h-9 w-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="shimmer h-3.5 w-40 rounded-md" />
            <div className="shimmer h-2.5 w-20 rounded-md" />
          </div>
          <div className="shimmer hidden h-2.5 w-16 rounded-md sm:block" />
        </div>
      ))}
    </div>
  );
}

function RecentFormsPanel({ greeting, firstName, sessionReady, note, forms, isLoading }) {
  return (
    <div className="flex flex-col lg:h-full lg:overflow-hidden">
      <PanelHeading
        mobileTitle="Formların"
        desktopTitle={<Greeting greeting={greeting} firstName={firstName} ready={sessionReady} />}
        mobileNote=""
        desktopNote={note}
        emphasizeDesktop
      />

      <div className="pt-3 scrollbar lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        {isLoading ? (
          <RecentFormsSkeleton />
        ) : forms.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1 py-12 text-center">
            <FileText className="mb-1 h-7 w-7 text-neutral-700" strokeWidth={1.5} />
            <p className="text-2xs text-neutral-400">Henüz form oluşturulmamış</p>
            <Link href="/admin/forms/new-form" className="text-2xs font-medium text-skylab-300 transition-colors hover:text-skylab-200">
              İlk formunu oluştur
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {forms.map((form, i) => (
              <motion.div key={form.id} {...fadeIn} transition={{ ...fadeIn.transition, delay: Math.min(i, 6) * 0.03 }}>
                <RecentFormItem form={form} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 flex shrink-0 items-center justify-between gap-3 border-t border-white/5 px-1 pt-3">
        <span className="text-2xs text-neutral-600">{isLoading ? "--" : forms.length > 0 ? `Son güncellenen ${forms.length} form` : ""}</span>
        <Link href="/admin/forms" className="inline-flex items-center gap-1 text-2xs font-medium text-neutral-400 transition-colors hover:text-neutral-200">
          Tümünü gör
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function MetricsPanel({ greeting, firstName, sessionReady, note, stats, statsLoading, isSuperAdmin, metrics, metricsLoading }) {
  return (
    <div className="flex flex-col lg:h-full lg:overflow-hidden">
      <PanelHeading
        mobileTitle={<Greeting greeting={greeting} firstName={firstName} ready={sessionReady} />}
        desktopTitle="Metrikler"
        mobileNote={note}
        desktopNote=""
      />

      <div className="pt-3 scrollbar lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        <div className="divide-y divide-white/5">

          <Section delay={0}>
            <SectionTitle>Genel</SectionTitle>
            <ServiceStats values={stats} isLoading={statsLoading} isSuperAdmin={isSuperAdmin} />
          </Section>

          <Section delay={0.05}>
            {metricsLoading ? (
              <TrendSkeleton />
            ) : (
              <WeeklyTrend title="Haftalık form trendi" data={metrics?.formsCreatedWeeklyTrend}
                trendPercentage={metrics?.formsWeeklyTrendPercentage} gradientId="dashboardFormsTrend"
              />
            )}
          </Section>

          <Section delay={0.1}>
            {metricsLoading ? (
              <TrendSkeleton />
            ) : (
              <WeeklyTrend title="Haftalık cevap trendi" data={metrics?.responsesWeeklyTrend}
                trendPercentage={metrics?.responsesWeeklyTrendPercentage} gradientId="dashboardResponsesTrend"
              />
            )}
          </Section>

          <Section delay={0.15}>
            <SectionTitle>Hızlı işlemler</SectionTitle>
            <QuickActions />
          </Section>

        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const sessionReady = status !== "loading";

  const { data: formsData, isLoading: formsLoading, refetch: refetchForms } = useUserFormsQuery({
    pageSize: RECENT_FORMS_COUNT,
    sortBy: "updatedAt",
    sortDirection: "descending",
  });
  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } = useServiceMetricsQuery();
  const { data: groupsData, isLoading: groupsLoading, refetch: refetchGroups } = useGroupsQuery({ pageSize: 1 });

  const metrics = metricsData?.data ?? metricsData;

  const forms = useMemo(() => {
    const meta = formsData?.data ?? {};
    return Array.isArray(meta.items) ? meta.items : Array.isArray(formsData) ? formsData : [];
  }, [formsData]);

  const isSuperAdmin = Boolean(session?.skyformsRoles?.includes("skyforms:*"));
  const [randomNote] = useState(() => GREETING_NOTES[Math.floor(Math.random() * GREETING_NOTES.length)]);
  const greetingProps = {
    greeting: getGreeting(),
    firstName: getFirstName(session?.user),
    sessionReady,
    note: sessionReady ? randomNote : "",
  };

  const stats = {
    forms: metrics?.totalForms ?? 0,
    responses: metrics?.totalResponsesReceived ?? 0,
    pending: metrics?.pendingResponsesCount ?? 0,
    groups: groupsData?.data?.totalCount ?? 0,
  };

  const handleRefresh = () => {
    refetchForms();
    refetchMetrics();
    refetchGroups();
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] flex-col gap-4 overflow-hidden p-4 lg:gap-6 lg:p-6">
      <DashboardHeader onRefresh={handleRefresh} />

      <div className="min-h-0 flex-1 overflow-y-auto pr-1 scrollbar lg:overflow-hidden lg:pr-0">
        <div className="grid grid-cols-1 gap-6 lg:h-full lg:grid-cols-12">
          <div className="order-2 lg:order-1 lg:col-span-7 lg:min-h-0">
            <RecentFormsPanel
              {...greetingProps}
              forms={forms.slice(0, RECENT_FORMS_COUNT)}
              isLoading={formsLoading}
            />
          </div>
          <div className="order-1 lg:order-2 lg:col-span-5 lg:min-h-0">
            <MetricsPanel
              {...greetingProps}
              stats={stats}
              statsLoading={metricsLoading || groupsLoading}
              isSuperAdmin={isSuperAdmin}
              metrics={metrics}
              metricsLoading={metricsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
