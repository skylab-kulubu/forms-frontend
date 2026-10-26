"use client";

import { Fragment, useState } from "react";
import { ChartColumn, ChevronRight, FileText, List, PencilLine, Timer, X } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";
import ApprovalOverlay from "../ApprovalOverlay";
import Pagination from "../utils/Pagination";
import { PANEL_SECTION, PANEL_STACK, PanelButton, PanelNotice, SectionHeader, ToggleRow } from "../utils/SidePanel";
import { InlineDateTime, TimingRow } from "../form-editor/components/TimingSection";
import { WORKFLOW_INTAKE } from "@/lib/form-settings";
import { defaultClosesAt, formatDay, isPastDate } from "@/lib/form-timing";
import { useUpdateWorkflowIntakeMutation, useUpdateWorkflowIntakeScheduleMutation } from "@/lib/hooks/useWorkflowAdmin";
import { StepBadge } from "../form-room/RoomCanvas";
import { RUN_STATE, RUN_TABS, elapsed, intakeOf, intakePill, publishedVersion, remainingText } from "./journey-data";

const MODE_LINKS = [["overview", "Özet", FileText], ["analytics", "Analitik", ChartColumn], ["response", "Cevaplar", List]];

function StepCounts({ counts }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1 text-2xs">
      <span className="text-neutral-300"><span className="font-semibold tabular-nums text-neutral-100">{counts?.count ?? 0}</span> kişi bu adımda</span>
      {counts?.awaitingReview ? <span className="inline-flex items-center gap-1.5 text-amber-200"><span className="size-1.5 rounded-full bg-amber-400" />{counts.awaitingReview} onay bekliyor</span> : null}
      {counts?.awaitingApplicant ? <span className="inline-flex items-center gap-1.5 text-neutral-400"><span className="size-1.5 rounded-full bg-neutral-500" />{counts.awaitingApplicant} aday bekleniyor</span> : null}
      {counts?.timerRunning ? <span className="inline-flex items-center gap-1.5 text-amber-100/80"><Timer size={11} />{counts.timerRunning} süre işliyor</span> : null}
      {counts?.revisionRequested ? <span className="inline-flex items-center gap-1.5 text-sky-200"><span className="size-1.5 rounded-full bg-sky-400" />{counts.revisionRequested} düzeltme</span> : null}
    </div>
  );
}

function RunRow({ run, depthOf, showStep, onOpen }) {
  const state = Number(run.state);
  const meta = RUN_STATE[state] ?? RUN_STATE[0];
  const finished = state >= 4;
  const depth = depthOf(run.nodeKey) ?? run.sequence;

  return (
    <button type="button" onClick={() => onOpen(run)} data-run={run.id}
      title={run.latestResponse ? (finished ? "Son cevabı aç" : "Cevabı aç: onay, ret, düzeltme") : "Bu başvurunun henüz cevabı yok"}
      className="group/row flex w-full items-center gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-white/3"
    >
      <Avatar name={run.applicant?.fullName || ""} email={run.applicant?.email || ""} photoUrl={run.applicant?.profilePictureUrl} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs text-neutral-200 group-hover/row:text-neutral-50">{run.applicant?.fullName || "Kullanıcı"}</span>
        <span className="mt-0.5 flex min-w-0 items-center gap-1.5 text-3xs">
          <span className={`size-1.5 shrink-0 rounded-full ${meta.dot}`} />
          <span className={`truncate ${meta.text}`}>{meta.label}</span>
          {state === 1 && run.deadlineAt ? <span className="shrink-0 font-mono text-neutral-500">{remainingText(run.deadlineAt)}</span> : null}
          {Number(run.round) > 1 && !finished ? <span className="shrink-0 text-neutral-600">{run.round}. gönderim</span> : null}
          {showStep && depth ? <span className="shrink-0 truncate text-neutral-600">· {depth}. adım</span> : null}
        </span>
      </span>
      <span className="shrink-0 text-right text-3xs tabular-nums text-neutral-500">{finished ? formatDay(run.completedAt) || "—" : elapsed(run.stepStartedAt)}</span>
      <ChevronRight size={14} className="shrink-0 text-neutral-600 transition-transform group-hover/row:translate-x-0.5" />
    </button>
  );
}

export function RunsList({
  stepKey, stepTitle, stepDepth, stepIsStart, stepNote, counts, tabCounts, tab, onTab, only, onClearOnly, onClear, onMode,
  runs, total, loading, error, live, page, totalPages, onPage, depthOf, onOpenRun,
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {stepKey ? (
        <div key={stepKey} className="space-y-3 border-b border-neutral-800/60 px-4 py-3">
          <div className="flex items-center gap-2">
            {stepNote
              ? <span className="grid size-5 shrink-0 place-items-center rounded-md border border-dashed border-white/15 text-3xs text-neutral-500">–</span>
              : <StepBadge depth={stepDepth} isStart={stepIsStart} size="md" />}
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-neutral-100">{stepTitle || "Adsız form"}</span>
            {stepNote ? <span className="shrink-0 rounded border border-dashed border-neutral-700 px-1.5 py-0.5 text-3xs text-neutral-500">{stepNote}</span> : null}
            <button type="button" onClick={onClear} title="Adım seçimini kaldır" aria-label="Adım seçimini kaldır"
              className="grid size-10 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200 sm:size-6"
            >
              <X size={13} />
            </button>
          </div>
          <StepCounts counts={counts} />
          {onMode ? (
            <div className="flex gap-1.5">
              {MODE_LINKS.map(([mode, label, Icon]) => (
                <PanelButton key={mode} touch icon={Icon} className="flex-1" onClick={() => onMode(mode)}>{label}</PanelButton>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex shrink-0 items-center px-4 pb-1 pt-2 text-2xs sm:pt-3">
        {RUN_TABS.map(([key, label], index) => (
          <Fragment key={key}>
            {index ? <span className="mx-2 h-3 w-px bg-neutral-800" /> : null}
            <button type="button" onClick={() => onTab(key)} aria-pressed={tab === key}
              className={`rounded py-2 transition-colors sm:py-0 ${tab === key ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-300"}`}
            >
              {label} {tabCounts[key] != null ? <span className="tabular-nums text-neutral-500">{tabCounts[key]}</span> : null}
            </button>
          </Fragment>
        ))}
      </div>

      {only != null ? (
        <div className="flex shrink-0 px-4 pt-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-white/10 py-0.5 pl-2 pr-0.5 text-2xs text-neutral-300">
            <span className={`size-1.5 rounded-full ${RUN_STATE[only].dot}`} />
            {RUN_STATE[only].label}
            <button type="button" onClick={onClearOnly} title="Süzgeci kaldır" aria-label="Süzgeci kaldır"
              className="grid size-8 place-items-center rounded text-neutral-500 transition-colors hover:text-neutral-200 sm:size-5"
            >
              <X size={11} />
            </button>
          </span>
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-1 scrollbar">
        {loading ? (
          <div className="space-y-2 px-2 pt-2">{Array.from({ length: 6 }, (_, index) => <div key={index} className="shimmer h-11 rounded-lg" />)}</div>
        ) : error ? (
          <p className="px-3 py-10 text-center text-2xs text-red-300">Başvuranlar yüklenemedi.</p>
        ) : runs.length === 0 ? (
          <p className="px-3 py-10 text-center text-2xs text-neutral-500">{live ? "Bu süzgeçte başvuran yok." : "Akış yayınlanınca başvuranlar burada görünür."}</p>
        ) : (
          <div className="divide-y divide-white/5">
            {runs.map((run) => <RunRow key={run.id} run={run} depthOf={depthOf} showStep={!stepKey} onOpen={onOpenRun} />)}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-neutral-800 px-4 py-2.5 text-2xs text-neutral-500">
        <span><span className="font-semibold tabular-nums text-neutral-200">{total}</span> başvuru</span>
        {totalPages > 1 ? <Pagination current={page} totalPages={totalPages} onPageChange={onPage} /> : <span className="tabular-nums">1 / 1</span>}
      </div>
    </div>
  );
}

export function OperationsPanel({ workflow, overview, versions, steps, onMode, onEdit, canEdit }) {
  const [closeOpen, setCloseOpen] = useState(false);
  const intakeMutation = useUpdateWorkflowIntakeMutation();
  const scheduleMutation = useUpdateWorkflowIntakeScheduleMutation();
  const isLive = Boolean(workflow.published);
  const archived = Number(workflow.status) === 2;
  const intake = intakeOf(workflow);
  const isOpen = intake !== WORKFLOW_INTAKE.CLOSED;
  const acceptsNewRuns = intake === WORKFLOW_INTAKE.OPEN;
  const closesAt = workflow.intakeClosesAt ?? null;
  const pending = intakeMutation.isPending || scheduleMutation.isPending;
  const published = publishedVersion(versions);
  const pill = intakePill(workflow);

  const changeIntake = (next, onDone) => intakeMutation.mutate({ workflowId: workflow.id, intake: next }, { onSettled: onDone });
  const changeClosesAt = (next) => scheduleMutation.mutate({ workflowId: workflow.id, closesAt: next });
  const reopenNewRuns = () => {
    if (closesAt && isPastDate(closesAt)) changeClosesAt(null);
    if (Number(workflow.intake) !== WORKFLOW_INTAKE.OPEN) changeIntake(WORKFLOW_INTAKE.OPEN);
  };

  return (
    <div className={PANEL_STACK}>
      <section className={PANEL_SECTION}>
        <SectionHeader title="Başvuru durumu" pill={pill.label} pillTone={pill.tone}
          description={archived ? "Akış arşivlendi; başvuru kabulü artık değişmez." : isLive ? "Akışı tamamen ya da yalnız yeni başvurulara kapatabilirsin." : "Akış yayınlanınca başvuru kabulünü buradan yönetirsin."}
        />
        {isLive && !archived ? (
          <div className="space-y-3">
            <ToggleRow title="Başvuru kabulü" checked={isOpen} disabled={pending || !canEdit}
              description="Kapatınca bütün adımlar durur; devam eden başvurular da bekler."
              onChange={() => (isOpen ? setCloseOpen(true) : changeIntake(WORKFLOW_INTAKE.OPEN))}
            />
            <ToggleRow title="Yeni başvurular" checked={acceptsNewRuns} disabled={pending || !isOpen || !canEdit} dimmed={!isOpen}
              description="Kapatınca kimse yeni başvuru başlatamaz; devam edenler sürer."
              onChange={() => (acceptsNewRuns ? changeIntake(WORKFLOW_INTAKE.NEW_RUNS_CLOSED) : reopenNewRuns())}
            />
            <TimingRow title="Otomatik kapanış" checked={Boolean(closesAt)} disabled={pending || !canEdit}
              description="Saat gelince yeni başvurular kapanır; devam edenler sürer."
              onChange={() => changeClosesAt(closesAt ? null : defaultClosesAt())}
            >
              <InlineDateTime value={closesAt} onChange={changeClosesAt} label="Otomatik kapanış" />
            </TimingRow>
          </div>
        ) : null}
        {isLive && !archived && intake !== WORKFLOW_INTAKE.OPEN ? (
          <PanelNotice tone="neutral">
            {intake === WORKFLOW_INTAKE.CLOSED
              ? "Akış kapalı. Başvuranlar kapalı ekranını görür; devam eden başvurular akış açılınca kaldığı yerden sürer."
              : intake !== Number(workflow.intake) ? "Otomatik kapanış saati geldi; yeni başvuru alınmıyor. Başlamış başvurular devam ediyor."
                : "Yeni başvuru alınmıyor. Başlamış başvurular normal şekilde devam ediyor."}
          </PanelNotice>
        ) : null}
        {intakeMutation.isError ? <p className="text-2xs text-red-300">Başvuru durumu değiştirilemedi. Lütfen tekrar deneyin.</p> : null}
        {scheduleMutation.isError ? <p className="text-2xs text-red-300">Kapanış saati kaydedilemedi. Lütfen tekrar deneyin.</p> : null}
      </section>

      <section className={PANEL_SECTION}>
        <SectionHeader title="Sürüm"
          description={published
            ? `v${published.version} yayında${published.publishedAt ? ` (${formatDay(published.publishedAt)})` : ""}. Devam eden başvurular başladıkları sürümde kalır.`
            : "Henüz yayınlanmadı. Adımları ve yönlendirmeleri düzenleme ekranında kurup oradan yayınlarsın."}
        />
        {published && workflow.draft ? <PanelNotice tone="neutral">Düzenleme ekranında yayınlanmamış değişiklik var.</PanelNotice> : null}
        <PanelButton touch icon={PencilLine} className="w-full" onClick={onEdit} disabled={!canEdit}>Düzenle</PanelButton>
      </section>

      <section className={PANEL_SECTION}>
        <SectionHeader title="Adımların formları" description="Her adımın formu aynı odada açılır: Özet, Analitik ya da Cevaplar." />
        <div className="divide-y divide-white/5">
          {steps.map((step) => (
            <div key={step.nodeKey} className="flex items-center gap-2.5 py-1.5">
              <StepBadge depth={step.depth} isStart={step.isStart} size="md" />
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-200" title={step.formTitle}>{step.formTitle || "Adsız form"}</span>
              {MODE_LINKS.map(([mode, label]) => (
                <button key={mode} type="button" onClick={() => onMode(mode, step.formId)}
                  className="min-h-10 rounded px-1 text-2xs text-neutral-500 transition-colors hover:text-neutral-200 sm:min-h-7"
                >
                  {label}
                </button>
              ))}
            </div>
          ))}
        </div>
      </section>

      <ApprovalOverlay open={closeOpen} preset="close-workflow" context={{ activeRunCount: overview?.activeRunCount ?? workflow.activeRunCount ?? null, isPending: intakeMutation.isPending }}
        onApprove={() => changeIntake(WORKFLOW_INTAKE.CLOSED, () => setCloseOpen(false))}
        onReject={() => setCloseOpen(false)}
      />
    </div>
  );
}

