"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Link2, ListChecks, Share2 } from "lucide-react";
import { Button, CopyButton, ProportionBar, SegmentedControl, Skeleton } from "@skylab-kulubu/skylcn-ui";
import Avatar from "@/app/components/utils/Avatar";
import { PANEL_SECTION, PANEL_STACK, PanelButton, SectionHeader } from "@/app/admin/components/utils/SidePanel";
import { RoleBadge, formatUpdatedAt } from "@/app/admin/components/ListItem";
import { ROW_STATUS } from "@/lib/attempt-status";
import { effectiveFormSettings } from "@/lib/form-settings";
import { currentTime, formatShortDate, shortDuration, spanText } from "@/lib/form-timing";
import { publicShortUrl } from "@/lib/short-url";
import { useShortLinkQuery } from "@/lib/hooks/useShortLink";
import { ChannelsTable, LifeBars, TrendBadge, WindowBars, formatDuration } from "./components/FormMetrics";
import { formatPersonName } from "../form-responses/response-data";
import { decisionRows, lifeSeries } from "./overview-stats";
import { KV } from "../form-room/RoomParts";

const segmentsOf = (options) => options.map(([value, label]) => ({ value, label }));

function Hairline({ children, right = null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-2xs font-medium text-neutral-500">{children}</span>
      <span className="h-px flex-1 bg-ink/5" />
      {right}
    </div>
  );
}

function ResponseCounts({ metrics, reviewed, inFlow, canReview, onReview }) {
  if (!metrics) {
    return (
      <section className={PANEL_SECTION}>
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-1.5 w-full rounded-full" />
        <div className="space-y-2">{[0, 1, 2].map((index) => <Skeleton key={index} className="h-5 w-full" />)}</div>
      </section>
    );
  }

  const total = metrics.totalResponses ?? 0;
  const rows = decisionRows(metrics);
  const pending = rows[0][1];

  return (
    <section className={PANEL_SECTION}>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold leading-none tabular-nums text-neutral-50">{total}</span>
        <span className="text-xs text-neutral-400">cevap</span>
      </div>
      {reviewed ? (
        <div>
          <div className="flex h-1.5 w-full gap-0.5 overflow-hidden rounded-full bg-ink/5">
            {rows.map(([kind, count]) => (count && total ? (
              <span key={kind} className={`h-full ${ROW_STATUS[kind].dot.split(" ")[0]}`} style={{ width: `${(count / total) * 100}%` }} />
            ) : null))}
          </div>
          <div className="mt-2 divide-y divide-ink/5">
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

const TREND_RANGES = [["hourly", "24 saat"], ["daily", "7 gün"], ["life", "Tümü"]];

function TrendSection({ metrics }) {
  const [picked, setPicked] = useState(null);
  const lifetime = metrics?.lifetime;
  const life = useMemo(() => lifeSeries(lifetime, currentTime()), [lifetime]);
  if (!metrics) return null;

  const quiet = !(metrics.dailyTrend ?? []).some((day) => day.count > 0);
  const mode = (picked === "life" && !life ? null : picked) ?? (life && quiet ? "life" : "daily");
  const whole = mode === "life";
  const daily = mode === "daily";
  const series = (daily ? metrics.dailyTrend : metrics.hourlyTrend) ?? [];
  const count = whole ? life.total : series.reduce((sum, item) => sum + item.count, 0);
  const range = whole ? `cevap, ${life.span} günde` : daily ? "cevap, son 7 gün" : "cevap, son 24 saat";
  const peak = whole && !life.sparse ? `En yoğun ${life.peak.label}${life.weekly ? " haftası" : ""}, ${life.peak.count} cevap. ` : "";
  const note = whole ? `${peak}${life.note}` : daily ? "Değişim önceki 7 güne göre." : "Değişim önceki 24 saate göre.";

  return (
    <section className={PANEL_SECTION}>
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-neutral-100">Cevap trendi</p>
        <SegmentedControl size="sm" aria-label="Aralık" options={segmentsOf(TREND_RANGES.filter(([key]) => key !== "life" || life))} value={mode} onValueChange={setPicked} />
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold leading-none tabular-nums text-neutral-50">{count}</span>
        <span className="text-2xs text-neutral-400">{range}</span>
        {whole ? null : <span className="ml-auto"><TrendBadge value={daily ? metrics.dailyTrendPercentage : metrics.hourlyTrendPercentage} /></span>}
      </div>
      {whole ? <LifeBars life={life} /> : <WindowBars key={mode} data={series} hourly={!daily} />}
      <p className="text-3xs leading-relaxed text-neutral-500">{note}</p>
    </section>
  );
}

function ReviewSection({ review, team = [], onOpenResponse }) {
  const oldest = review.oldestPending;
  const waited = oldest ? currentTime() - new Date(oldest.submittedAt).getTime() : null;
  const reviewers = review.reviewers ?? [];

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="İnceleme" description={review.decidedCount ? `${review.decidedCount} karar üzerinden.` : "Henüz karar verilmedi."} />
      <div className="divide-y divide-ink/5">
        <KV label="Karara kadar geçen süre" hint="Gönderimden onaya ya da redde, medyan">
          <span className="tabular-nums">{review.medianDecisionSeconds != null ? spanText(review.medianDecisionSeconds * 1000) : "--"}</span>
        </KV>
        <KV label="En eski bekleyen" hint={oldest ? formatShortDate(oldest.submittedAt) : null}>
          {oldest ? (
            <button type="button" onClick={() => onOpenResponse?.(oldest.responseId)}
              className="tabular-nums text-amber-200/90 underline decoration-ink/20 underline-offset-2 transition-colors hover:text-amber-100"
            >
              {spanText(waited)} önce geldi
            </button>
          ) : <span>Yok</span>}
        </KV>
      </div>
      {reviewers.length ? (
        <div className="flex flex-col gap-2">
          {reviewers.map((item) => {
            const user = team.find((member) => member.user?.id === item.userId)?.user;
            const name = formatPersonName(user?.fullName) || "Ekipten biri";
            return (
              <div key={item.userId} className="flex items-center gap-2.5">
                <Avatar name={name} email={user?.email || ""} size="sm" />
                <span className="min-w-0 flex-1 truncate text-2xs text-neutral-300">{name}</span>
                <span className="shrink-0 text-2xs tabular-nums text-neutral-500"><span className="text-neutral-200">{item.decisions}</span> karar</span>
              </div>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

function ShareSection({ formId, metrics, stepForm, canShare, onShare, reviewed = false }) {
  const { data: link } = useShortLinkQuery(formId);
  const [channelView, setChannelView] = useState("clicks");
  const decided = reviewed && (metrics?.channels ?? []).some((channel) => (channel.approved ?? 0) + (channel.declined ?? 0) > 0);
  const view = decided ? channelView : "clicks";
  const url = link?.alias ? publicShortUrl(link.alias) : "";

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Paylaşım"
        description={stepForm ? "Bu form akışın bir adımı; başvuranlar önceki adımı geçince açılır." : "Kısa linki kopyala ya da Paylaş'tan kanal seç; kanaldan gelenler aşağıda ayrı sayılır."}
      />
      <div className="flex items-center gap-2">
        <div className="flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-lg border border-input bg-background/60 pl-2.5 pr-1 pointer-coarse:h-10">
          <Link2 size={13} className="shrink-0 text-subtle-foreground" />
          <span className={`min-w-0 flex-1 truncate font-mono text-2xs ${url ? "text-skylab-300" : "text-subtle-foreground"}`}>
            {url ? url.replace(/^https?:\/\//, "") : "Henüz kısa link yok"}
          </span>
          {url ? <CopyButton value={url} label="Kısa linki kopyala" /> : null}
        </div>
        <Button variant="outline" size="md" onClick={onShare} disabled={!canShare}>
          <Share2 aria-hidden="true" />
          Paylaş
        </Button>
      </div>
      {!stepForm && Array.isArray(metrics?.channels) ? (
        <div>
          <Hairline right={(
            <>
              <span className="text-3xs text-neutral-600">Son 90 gün</span>
              {decided ? (
                <SegmentedControl size="sm" aria-label="Kanal görünümü" options={segmentsOf([["clicks", "Tıklama"], ["decisions", "Karar"]])} value={view} onValueChange={setChannelView} />
              ) : null}
            </>
          )}>Kanallar</Hairline>
          <div className="mt-3"><ChannelsTable channels={metrics.channels} view={view} /></div>
        </div>
      ) : null}
    </section>
  );
}

function medianOf(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function ParticipationSection({ metrics, attempts, timed }) {
  if (!metrics) return null;
  const durations = attempts?.durationMinutes ?? [];
  const middle = medianOf(durations);
  const median = metrics.medianCompletionTime;

  return (
    <section className={PANEL_SECTION}>
      <p className="font-semibold text-neutral-100">Katılım</p>
      <div className="divide-y divide-ink/5">
        {timed && attempts ? (
          <>
            <KV label="Teslim süresi" hint="Medyan"><span className="tabular-nums">{middle != null ? shortDuration(middle * 60_000) : "--"}</span></KV>
            <KV label="Formu açan">
              <span className="tabular-nums">{attempts.opened}</span>
              <span className="text-neutral-600">·</span>
              <span className="tabular-nums">{attempts.submitted} teslim</span>
            </KV>
          </>
        ) : (
          median != null ? (
            <KV label="Doldurma süresi" hint="Medyan; sayfayı açık bırakanlar sonucu bozmaz">
              <span className="font-semibold tabular-nums text-neutral-100">{spanText(median * 1000)}</span>
            </KV>
          ) : <KV label="Ortalama süre"><span className="font-semibold tabular-nums text-neutral-100">{formatDuration(metrics.averageCompletionTime)}</span></KV>
        )}
      </div>
      {/* The channel bars above draw in these two, so the panel keeps one palette */}
      <ProportionBar segments={[
        { key: "registered", label: "Kayıtlı", value: metrics.sourceBreakdown?.registered ?? 0, color: "var(--skylab-500)" },
        { key: "anonymous", label: "Anonim", value: metrics.sourceBreakdown?.anonymous ?? 0, color: "var(--skylab-800)" },
      ]}
      />
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

function InfoSection({ form, flow, onFlow, readOnly = false }) {
  const settings = effectiveFormSettings(form);
  const workflow = form?.workflow ?? null;
  const questionCount = (form?.schema ?? []).filter((field) => field.type !== "separator").length;
  const depth = flow?.node ? flow.stages.depths.get(flow.node.nodeKey) : null;
  const role = Number(form?.userRole);

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Form bilgileri" />
      <div className="divide-y divide-ink/5">
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
        <KV label="Rolün">{role > 0 ? <RoleBadge role={role} /> : readOnly ? <span className="text-neutral-400">Süper admin · salt okunur</span> : <span>Yok</span>}</KV>
        <KV label="Son güncelleme"><span className="tabular-nums text-neutral-300">{formatUpdatedAt(form?.updatedAt ?? form?.createdAt)}</span></KV>
      </div>
    </section>
  );
}

export default function OverviewPanel({ form, flow, metrics, attempts, onReview, onShare, onFlow = null, onOpenResponse = null, readOnly = false, canView = Number(form?.userRole) >= 1 }) {
  const settings = effectiveFormSettings(form);
  const stepForm = Boolean(form?.workflow && !form.workflow.isStart);
  const timed = Number(form?.timeLimitMinutes) > 0;

  return (
    <div className={PANEL_STACK}>
      <ResponseCounts metrics={metrics} reviewed={settings.requiresManualReview} inFlow={Boolean(form?.workflow)} canReview={canView} onReview={onReview} />
      {settings.requiresManualReview && metrics?.review ? <ReviewSection review={metrics.review} team={form?.collaborators} onOpenResponse={onOpenResponse} /> : null}
      <TrendSection metrics={metrics} />
      <ShareSection formId={form?.id} metrics={metrics} stepForm={stepForm} canShare={canView} onShare={onShare} reviewed={settings.requiresManualReview} />
      <ParticipationSection metrics={metrics} attempts={attempts} timed={timed} />
      <TeamSection collaborators={form?.collaborators} />
      <InfoSection form={form} flow={flow} onFlow={onFlow} readOnly={readOnly} />
    </div>
  );
}
