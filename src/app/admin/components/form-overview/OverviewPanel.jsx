"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Link2, ListChecks, Share2 } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";
import { PANEL_SECTION, PANEL_STACK, PanelButton, SectionHeader } from "@/app/admin/components/utils/SidePanel";
import { RoleBadge, formatUpdatedAt } from "@/app/admin/components/ListItem";
import { ROW_STATUS } from "@/lib/attempt-status";
import { effectiveFormSettings } from "@/lib/form-settings";
import { shortDuration } from "@/lib/form-timing";
import { publicShortUrl } from "@/lib/short-url";
import { useShortLinkQuery } from "@/lib/hooks/useShortLink";
import { ChannelsTable, SourceBreakdownBar, TrendArea, TrendBadge, formatDuration } from "./components/FormMetrics";
import { KV } from "../form-room/RoomParts";

const DECISIONS = [
  ["pending", "pendingCount"],
  ["approved", "approvedCount"],
  ["declined", "rejectedCount"],
];

function Shimmer({ className = "" }) {
  return <span aria-hidden="true" className={`shimmer block rounded-md ${className}`} />;
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-white/10 bg-white/5 p-0.5">
      {options.map(([key, label]) => (
        <button key={key} type="button" onClick={() => onChange(key)} aria-pressed={value === key}
          className={`rounded px-2 py-1.5 text-3xs transition sm:py-0.5 ${value === key ? "bg-white/10 text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Hairline({ children, right = null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-2xs font-medium text-neutral-500">{children}</span>
      <span className="h-px flex-1 bg-white/5" />
      {right}
    </div>
  );
}

function ResponseCounts({ metrics, reviewed, inFlow, canReview, onReview }) {
  if (!metrics) {
    return (
      <section className={PANEL_SECTION}>
        <Shimmer className="h-8 w-24" />
        <Shimmer className="h-1.5 w-full rounded-full" />
        <div className="space-y-2">{[0, 1, 2].map((index) => <Shimmer key={index} className="h-5 w-full" />)}</div>
      </section>
    );
  }

  const total = metrics.totalResponses ?? 0;
  const rows = DECISIONS.map(([kind, key]) => [kind, metrics[key] ?? 0]);
  const pending = metrics.pendingCount ?? 0;

  return (
    <section className={PANEL_SECTION}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold leading-none tabular-nums text-neutral-50">{total}</span>
        <span className="text-xs text-neutral-400">cevap</span>
        <span className="ml-auto"><TrendBadge value={metrics.dailyTrendPercentage} /></span>
      </div>
      {reviewed ? (
        <div>
          <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-white/5">
            {rows.map(([kind, count]) => (count && total ? (
              <span key={kind} className={`h-full ${ROW_STATUS[kind].dot.split(" ")[0]}`} style={{ width: `${(count / total) * 100}%` }} />
            ) : null))}
          </div>
          <div className="mt-2 divide-y divide-white/5">
            {rows.map(([kind, count]) => (
              <div key={kind} className="flex items-center gap-2 py-2 text-xs">
                <span className={`size-1.5 shrink-0 rounded-full ${ROW_STATUS[kind].dot}`} />
                <span className="text-neutral-400">{ROW_STATUS[kind].label}</span>
                <span className="ml-auto tabular-nums text-neutral-100">{count}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-2xs leading-relaxed text-neutral-500">
          {inFlow ? "Bu adımda manuel onay yok; cevap gönderilince akış ilerler." : "Bu formda cevap kontrolü kapalı; gelen cevaplar onay beklemez."}
        </p>
      )}
      {reviewed && pending > 0 && canReview ? (
        <PanelButton touch icon={ListChecks} className="w-full" onClick={onReview}>Bekleyenleri incele · {pending}</PanelButton>
      ) : null}
    </section>
  );
}

function TrendSection({ metrics }) {
  const [mode, setMode] = useState("daily");
  if (!metrics) return null;
  const daily = mode === "daily";

  return (
    <section className={PANEL_SECTION}>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 font-semibold text-neutral-100">
          Cevap trendi
          <TrendBadge value={daily ? metrics.dailyTrendPercentage : metrics.hourlyTrendPercentage} />
        </p>
        <Segmented options={[["hourly", "Saatlik"], ["daily", "Günlük"]]} value={mode} onChange={setMode} />
      </div>
      <TrendArea key={mode} data={(daily ? metrics.dailyTrend : metrics.hourlyTrend) ?? []} />
    </section>
  );
}

function ShareSection({ formId, metrics, stepForm, canShare, onShare }) {
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
    <section className={PANEL_SECTION}>
      <SectionHeader title="Paylaşım"
        description={stepForm ? "Bu form akışın bir adımı; başvuranlar önceki adımı geçince açılır." : "Kısa linki kopyala ya da Paylaş'tan kanal seç; kanaldan gelenler aşağıda ayrı sayılır."}
      />
      <div className="flex items-center gap-2">
        <div className="flex h-11 min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-white/10 bg-black/20 pl-2.5 pr-1 sm:h-8">
          <Link2 size={13} className="shrink-0 text-neutral-500" />
          <span className={`min-w-0 flex-1 truncate font-mono text-2xs ${url ? "text-skylab-300" : "text-neutral-500"}`}>
            {url ? url.replace(/^https?:\/\//, "") : "Henüz kısa link yok"}
          </span>
          {url ? (
            <button type="button" onClick={copy} title="Kopyala" aria-label="Kısa linki kopyala"
              className={`grid size-9 shrink-0 place-items-center rounded-md transition-colors sm:size-6 ${copied ? "text-emerald-300" : "text-neutral-400 hover:bg-white/5 hover:text-neutral-100"}`}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
          ) : null}
        </div>
        <PanelButton touch icon={Share2} onClick={onShare} disabled={!canShare}>Paylaş</PanelButton>
      </div>
      {!stepForm && Array.isArray(metrics?.channels) ? (
        <div>
          <Hairline right={<span className="text-3xs text-neutral-600">Son 90 gün</span>}>Kanallar</Hairline>
          <div className="mt-3"><ChannelsTable channels={metrics.channels} /></div>
        </div>
      ) : null}
    </section>
  );
}

function ParticipationSection({ metrics, attempts, timed }) {
  if (!metrics) return null;
  const durations = attempts?.durationMinutes ?? [];
  const average = durations.length ? durations.reduce((sum, minutes) => sum + minutes, 0) / durations.length : null;

  return (
    <section className={PANEL_SECTION}>
      <p className="font-semibold text-neutral-100">Katılım</p>
      <div className="divide-y divide-white/5">
        {timed && attempts ? (
          <>
            <KV label="Ort. teslim süresi"><span className="tabular-nums">{average != null ? shortDuration(average * 60_000) : "--"}</span></KV>
            <KV label="Formu açan">
              <span className="tabular-nums">{attempts.opened}</span>
              <span className="text-neutral-600">·</span>
              <span className="tabular-nums">{attempts.submitted} teslim</span>
            </KV>
          </>
        ) : (
          <KV label="Ortalama süre"><span className="font-semibold tabular-nums text-neutral-100">{formatDuration(metrics.averageCompletionTime)}</span></KV>
        )}
      </div>
      <SourceBreakdownBar registered={metrics.sourceBreakdown?.registered ?? 0} anonymous={metrics.sourceBreakdown?.anonymous ?? 0} />
    </section>
  );
}

function TeamSection({ collaborators }) {
  const team = [...(collaborators ?? [])].sort((a, b) => b.role - a.role);

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Düzenleme ekibi" />
      {team.length === 0 ? <p className="text-2xs text-neutral-600">Ekipte kimse yok.</p> : (
        <div className="flex flex-col gap-2.5">
          {team.map((collaborator) => (
            <div key={collaborator.user?.id} className="flex items-center gap-2.5">
              <Avatar name={collaborator.user?.fullName || ""} email={collaborator.user?.email || ""} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-2xs font-medium text-neutral-200">{collaborator.user?.fullName || "??"}</p>
                {collaborator.user?.email ? <p className="truncate text-3xs text-neutral-500">{collaborator.user.email}</p> : null}
              </div>
              <span className="shrink-0"><RoleBadge role={collaborator.role} /></span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function InfoSection({ form, flow, onFlow }) {
  const settings = effectiveFormSettings(form);
  const workflow = form?.workflow ?? null;
  const questionCount = (form?.schema ?? []).filter((field) => field.type !== "separator").length;
  const depth = flow?.node ? flow.stages.depths.get(flow.node.nodeKey) : null;
  const role = Number(form?.userRole);

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Form bilgileri" />
      <div className="divide-y divide-white/5">
        <KV label="Soru"><span className="tabular-nums">{questionCount}</span></KV>
        <KV label="Akış">
          {workflow ? (
            onFlow ? (
              <button type="button" onClick={onFlow} className="max-w-48 truncate text-skylab-300 transition-colors hover:text-skylab-200">
                {workflow.name || "Adsız akış"} · {workflow.isStart ? "Başlangıç" : depth ? `${depth}. adım` : "Adım"}
              </button>
            ) : (
              <Link href={`/admin/workflows/${workflow.id}`} className="max-w-48 truncate text-skylab-300 transition-colors hover:text-skylab-200">
                {workflow.name || "Adsız akış"} · {workflow.isStart ? "Başlangıç" : depth ? `${depth}. adım` : "Adım"}
              </Link>
            )
          ) : <span>Yok</span>}
        </KV>
        <KV label="Manuel onay" hint={settings.managedByWorkflow ? "Akışta ayarlanır" : null}><span>{settings.requiresManualReview ? "Açık" : "Kapalı"}</span></KV>
        <KV label="Anonim"><span>{settings.allowAnonymousResponses ? "Açık" : "Kapalı"}</span></KV>
        <KV label={settings.managedByWorkflow ? "Tekrar başlatma" : "Çoklu cevap"} hint={settings.managedByWorkflow ? "Akışta ayarlanır" : null}>
          <span>{settings.allowMultipleResponses ? "Açık" : "Kapalı"}</span>
        </KV>
        <KV label="Rolün">{role > 0 ? <RoleBadge role={role} /> : <span>Yok</span>}</KV>
        <KV label="Son güncelleme"><span className="tabular-nums text-neutral-300">{formatUpdatedAt(form?.updatedAt ?? form?.createdAt)}</span></KV>
      </div>
    </section>
  );
}

export default function OverviewPanel({ form, flow, metrics, attempts, onReview, onShare, onFlow = null }) {
  const settings = effectiveFormSettings(form);
  const stepForm = Boolean(form?.workflow && !form.workflow.isStart);
  const canView = Number(form?.userRole) >= 1;
  const timed = Number(form?.timeLimitMinutes) > 0;

  return (
    <div className={PANEL_STACK}>
      <ResponseCounts metrics={metrics} reviewed={settings.requiresManualReview} inFlow={Boolean(form?.workflow)} canReview={canView} onReview={onReview} />
      <TrendSection metrics={metrics} />
      <ShareSection formId={form?.id} metrics={metrics} stepForm={stepForm} canShare={canView} onShare={onShare} />
      <ParticipationSection metrics={metrics} attempts={attempts} timed={timed} />
      <TeamSection collaborators={form?.collaborators} />
      <InfoSection form={form} flow={flow} onFlow={onFlow} />
    </div>
  );
}
