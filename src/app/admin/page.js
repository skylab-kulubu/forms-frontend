"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FileText, Plus, LayoutTemplate, ChartColumn, ArrowRight, BookOpen, PencilLine } from "lucide-react";
import { Button, DataListActions, IconButton, ListItem, ListPanel, Section, StatCard, TrendBadge } from "@skylab-kulubu/skylcn-ui";
import { AreaChart } from "@skylab-kulubu/skylcn-ui/charts";
import { useUserFormsQuery, useServiceMetricsQuery } from "@/lib/hooks/useFormAdmin";
import { useGroupsQuery } from "@/lib/hooks/useGroupAdmin";
import { DashboardHeader } from "./components/Headers";
import { FeatureIcons, IconTile, StatusDot, formatUpdatedAt } from "./components/ListItem";

const RECENT_FORMS_COUNT = 8;

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
    <span className="inline-block enter-fade">
      {greeting}, <span className="text-foreground">{firstName}</span>
    </span>
  );
}

// The greeting heads the forms on wide screens and the metrics on phones, where the metrics come first
function Responsive({ mobile, desktop }) {
  return (
    <>
      <span className="lg:hidden">{mobile}</span>
      <span className="hidden lg:inline">{desktop}</span>
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
    <ListPanel status={{ kind: "ready" }} framed={false} className="-mx-3">
      {QUICK_ACTIONS.map(({ icon: Icon, label, href, primary }) => (
        <ListItem key={href} href={href} title={label}
          leading={<Icon className={`size-4 shrink-0 ${primary ? "text-skylab-400" : "text-subtle-foreground"}`} strokeWidth={1.75} aria-hidden="true" />}
        />
      ))}
    </ListPanel>
  );
}

const SERVICE_STATS = [
  { key: "forms", label: "Sistemdeki toplam form", dot: "neutral", href: "/admin/forms/all", superAdminOnly: true },
  { key: "responses", label: "Sistemdeki toplam cevap", dot: "brand" },
  { key: "pending", label: "Sistemdeki bekleyen onay", dot: "warning", valueTone: "warning" },
  { key: "groups", label: "Sana ait şablon", dot: "neutral", href: "/admin/templates" },
];

function ServiceStats({ values, isLoading, isSuperAdmin }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SERVICE_STATS.map((stat) => (
        <StatCard key={stat.key} label={stat.label} dot={stat.dot} valueTone={stat.valueTone}
          value={isLoading ? "--" : values[stat.key] ?? 0}
          href={stat.href && (!stat.superAdminOnly || isSuperAdmin) ? stat.href : undefined}
        />
      ))}
    </div>
  );
}

function WeeklyTrend({ title, data, trendPercentage, series, loading }) {
  return (
    <AreaChart compact markers framed={false} title={title} badge={<TrendBadge value={trendPercentage} />}
      description="son 7 gün, önceki 7 güne göre" data={Array.isArray(data) ? data : []} x="label" xLabel="Gün"
      series={{ count: { label: series } }} loading={loading} emptyMessage="Veri bulunamadı" height={96}
    />
  );
}

function RecentFormItem({ form }) {
  const viewHref = `/admin/forms/${form.id}`;
  const canEdit = Number(form.userRole) >= 2;

  return (
    <ListItem href={viewHref} title={form.title || "--"}
      leading={
        <span className="flex shrink-0 items-center gap-3">
          <StatusDot form={form} />
          <IconTile icon={FileText} />
        </span>
      }
      subtitle={
        <span className="flex min-w-0 items-center gap-2">
          <span className="tabular-nums">{form.responseCount ?? 0} yanıt</span>
          <FeatureIcons form={form} />
        </span>
      }
      trailing={
        <>
          <span className="hidden shrink-0 text-2xs tabular-nums text-subtle-foreground sm:block">{formatUpdatedAt(form.updatedAt ?? form.createdAt)}</span>
          <DataListActions hoverFrom="lg">
            <IconButton icon={ChartColumn} label="Cevaplar" variant="outline" size="icon-sm" render={<Link href={`${viewHref}/responses`} />} />
            {canEdit ? (
              <IconButton icon={PencilLine} label="Düzenle" variant="primary" size="icon-sm" render={<Link href={`${viewHref}/edit`} />} />
            ) : (
              <IconButton icon={PencilLine} label="Düzenleme yetkiniz yok" variant="ghost" size="icon-sm" disabled />
            )}
          </DataListActions>
        </>
      }
    />
  );
}

function RecentFormsPanel({ greeting, firstName, sessionReady, note, forms, isLoading }) {
  const status = isLoading ? { kind: "loading" } : forms.length === 0 ? { kind: "empty", message: "Henüz form oluşturulmamış" } : { kind: "ready" };

  return (
    <Section className="lg:h-full"
      title={<Responsive mobile="Formların" desktop={<span className="lg:text-base"><Greeting greeting={greeting} firstName={firstName} ready={sessionReady} /></span>} />}
      description={<Responsive mobile="" desktop={note} />}
    >
      <div className="flex flex-col lg:h-full">
        <div className="scrollbar lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          <ListPanel status={status} framed={false} className="-mx-3" emptyIcon={FileText}
            emptyAction={<Button size="sm" variant="primary" render={<Link href="/admin/forms/new-form" />}>İlk formunu oluştur</Button>}
          >
            {forms.map((form) => <RecentFormItem key={form.id} form={form} />)}
          </ListPanel>
        </div>

        <div className="mt-3 flex shrink-0 items-center justify-between gap-3 border-t border-border-subtle pt-3">
          <span className="text-2xs text-subtle-foreground">{isLoading ? "--" : forms.length > 0 ? `Son güncellenen ${forms.length} form` : ""}</span>
          <Button size="sm" variant="ghost" render={<Link href="/admin/forms" />}>
            Tümünü gör
            <ArrowRight aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Section>
  );
}

function MetricsPanel({ greeting, firstName, sessionReady, note, stats, statsLoading, isSuperAdmin, metrics, metricsLoading }) {
  return (
    <Section className="lg:h-full"
      title={<Responsive mobile={<Greeting greeting={greeting} firstName={firstName} ready={sessionReady} />} desktop="Metrikler" />}
      description={<Responsive mobile={note} desktop="" />}
    >
      <div className="flex flex-col gap-6 scrollbar lg:h-full lg:overflow-y-auto lg:pr-1">
        <Section title="Genel" level={3}>
          <ServiceStats values={stats} isLoading={statsLoading} isSuperAdmin={isSuperAdmin} />
        </Section>

        <WeeklyTrend title="Haftalık form trendi" data={metrics?.formsCreatedWeeklyTrend} trendPercentage={metrics?.formsWeeklyTrendPercentage}
          series="Form" loading={metricsLoading}
        />

        <WeeklyTrend title="Haftalık cevap trendi" data={metrics?.responsesWeeklyTrend} trendPercentage={metrics?.responsesWeeklyTrendPercentage}
          series="Cevap" loading={metricsLoading}
        />

        <Section title="Hızlı işlemler" level={3}>
          <QuickActions />
        </Section>
      </div>
    </Section>
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
            <RecentFormsPanel {...greetingProps} forms={forms.slice(0, RECENT_FORMS_COUNT)} isLoading={formsLoading} />
          </div>
          <div className="order-1 lg:order-2 lg:col-span-5 lg:min-h-0">
            <MetricsPanel {...greetingProps} stats={stats} statsLoading={metricsLoading || groupsLoading} isSuperAdmin={isSuperAdmin}
              metrics={metrics} metricsLoading={metricsLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
