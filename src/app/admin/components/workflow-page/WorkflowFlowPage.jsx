"use client";

import { Fragment, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronRight, PencilLine, Timer, X } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";
import ApprovalOverlay from "../ApprovalOverlay";
import Pagination from "../utils/Pagination";
import { ACTION_ICON, FOCUS_RING, PANEL_SECTION, PanelNotice, ROW, SectionHeader, StatePill, ToggleRow, actionClass } from "../utils/SidePanel";
import { InlineDateTime, TimingRow } from "../form-editor/components/TimingSection";
import { WORKFLOW_INTAKE } from "@/lib/form-settings";
import { defaultClosesAt, formatDay, isPastDate, leftText } from "@/lib/form-timing";
import { formatUpdatedAt } from "../ListItem";
import { workflowEditHref } from "@/lib/workflow-links";
import {
  useUpdateWorkflowIntakeMutation, useUpdateWorkflowIntakeScheduleMutation, useWorkflowRunsOverviewQuery, useWorkflowRunsQuery, useWorkflowVersionsQuery,
} from "@/lib/hooks/useWorkflowAdmin";

const emptySubscribe = () => () => {};

export const RUN_STATE = {
  0: { label: "Aday bekleniyor", dot: "bg-neutral-500", text: "text-neutral-300" },
  1: { label: "Süre işliyor", dot: "bg-amber-400", text: "text-amber-100/80" },
  2: { label: "Düzeltme istendi", dot: "bg-sky-400", text: "text-sky-200" },
  3: { label: "Onay bekliyor", dot: "bg-amber-400", text: "text-amber-200" },
  4: { label: "Tamamlandı", dot: "bg-emerald-400", text: "text-emerald-300" },
  5: { label: "Elendi", dot: "bg-red-400", text: "text-red-300" },
  6: { label: "Süre doldu", dot: "bg-amber-600", text: "text-amber-200/70" },
  7: { label: "Geçersiz sayıldı", dot: "bg-neutral-600", text: "text-neutral-400" },
  8: { label: "Durdu", dot: "bg-neutral-500", text: "text-neutral-400" },
};

const FINISHED_ROWS = [
  ["completed", 4],
  ["declined", 5],
  ["timedOut", 6],
  ["voided", 7],
  ["stopped", 8],
];

const RUNS_GRID = "grid items-center gap-3 grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1.5fr)_minmax(0,1.1fr)_minmax(0,1.2fr)_4.5rem_4.5rem_1.25rem]";
const COLUMN = "text-3xs font-medium text-neutral-600";
const PAGE_SIZE = 20;

function HeaderPortal({ children }) {
  const isMounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const targets = isMounted ? ["admin-header-slot", "admin-header-slot-mobile"].map((id) => document.getElementById(id)).filter(Boolean) : [];
  return targets.map((target) => createPortal(children, target, target.id));
}

function elapsed(value) {
  if (!value) return "—";
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  return `${Math.floor(hours / 24)} gün`;
}

function remainingText(deadlineAt) {
  return leftText(new Date(deadlineAt).getTime() - Date.now());
}

function intakeOf(workflow) {
  const intake = Number(workflow?.intake ?? WORKFLOW_INTAKE.OPEN);
  return intake === WORKFLOW_INTAKE.OPEN && workflow?.intakeClosesAt && isPastDate(workflow.intakeClosesAt) ? WORKFLOW_INTAKE.NEW_RUNS_CLOSED : intake;
}

function payloadOf(data) {
  return data?.data ?? data ?? null;
}

function StepTile({ step, index, total, selected, disabled, onClick }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`relative flex min-w-44 flex-col justify-start rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-default ${
        selected ? "border-skylab-400/40 bg-skylab-500/[0.07]" : "border-white/10 hover:border-white/20 hover:bg-white/3"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className={`grid size-5 shrink-0 place-items-center rounded-md border text-3xs font-semibold ${step.isStart ? "border-skylab-400/40 bg-skylab-500/10 text-skylab-300" : "border-white/10 bg-white/5 text-neutral-400"}`}>
          {step.isRemoved ? "–" : step.depth || "?"}
        </span>
        <span className="min-w-0 truncate text-xs font-medium text-neutral-200" title={step.formTitle}>{step.formTitle}</span>
        {step.isRemoved ? <span className="ml-auto shrink-0 text-3xs text-neutral-500">Eski sürümde</span> : step.requiresManualReview ? <span className="ml-auto shrink-0 text-3xs text-neutral-500">Manuel onay</span> : null}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className={`text-2xl font-semibold tabular-nums ${disabled ? "text-neutral-600" : "text-neutral-50"}`}>{disabled ? "—" : step.count}</span>
        <span className="text-2xs text-neutral-500">{disabled ? "yayınlanınca dolar" : "kişi bu adımda"}</span>
      </div>
      <div className="mt-1.5 flex min-h-4 flex-wrap gap-x-3 gap-y-0.5 text-2xs">
        {!disabled && step.awaitingReview > 0 ? <span className="inline-flex items-center gap-1.5 text-amber-200"><span className="size-1.5 rounded-full bg-amber-400" />{step.awaitingReview} onay bekliyor</span> : null}
        {!disabled && step.awaitingApplicant > 0 ? <span className="inline-flex items-center gap-1.5 text-neutral-400"><span className="size-1.5 rounded-full bg-neutral-500" />{step.awaitingApplicant} aday bekleniyor</span> : null}
        {!disabled && step.timerRunning > 0 ? <span className="inline-flex items-center gap-1.5 text-amber-100/80"><Timer size={11} />{step.timerRunning} süre işliyor</span> : null}
        {!disabled && step.revisionRequested > 0 ? <span className="inline-flex items-center gap-1.5 text-sky-200"><span className="size-1.5 rounded-full bg-sky-400" />{step.revisionRequested} düzeltme</span> : null}
      </div>
      {index < total - 1 ? <ChevronRight size={14} className="absolute -right-[11px] top-1/2 z-10 -translate-y-1/2 text-neutral-600" /> : null}
    </button>
  );
}

function OperationsPanel({ workflow, overview, versions }) {
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
  const published = versions.find((version) => Number(version.status) === 1) ?? null;

  const changeIntake = (next, onDone) => intakeMutation.mutate({ workflowId: workflow.id, intake: next }, { onSettled: onDone });
  const changeClosesAt = (next) => scheduleMutation.mutate({ workflowId: workflow.id, closesAt: next });
  const reopenNewRuns = () => {
    if (closesAt && isPastDate(closesAt)) changeClosesAt(null);
    if (Number(workflow.intake) !== WORKFLOW_INTAKE.OPEN) changeIntake(WORKFLOW_INTAKE.OPEN);
  };

  const pill = archived ? ["Arşivde", "neutral"] : !isLive ? ["Taslak", "neutral"] : !isOpen ? ["Kapalı", "red"] : !acceptsNewRuns ? ["Yeni başvuru kapalı", "amber"] : ["Açık", "emerald"];

  return (
    <div className="flex flex-col divide-y divide-neutral-800/60 text-sm text-neutral-200">
      <section className={PANEL_SECTION}>
        <SectionHeader title="Başvuru durumu" pill={pill[0]} pillTone={pill[1]}
          description={archived ? "Akış arşivlendi; başvuru kabulü artık değişmez." : isLive ? "Akışı tamamen ya da yalnız yeni başvurulara kapatabilirsin." : "Akış yayınlanınca başvuru kabulünü buradan yönetirsin."}
        />
        {isLive && !archived ? (
          <div className="space-y-3">
            <ToggleRow title="Başvuru kabulü" checked={isOpen} disabled={pending}
              description="Kapatınca bütün adımlar durur; devam eden başvurular da bekler."
              onChange={() => (isOpen ? setCloseOpen(true) : changeIntake(WORKFLOW_INTAKE.OPEN))}
            />
            <ToggleRow title="Yeni başvurular" checked={acceptsNewRuns} disabled={pending || !isOpen} dimmed={!isOpen}
              description="Kapatınca kimse yeni başvuru başlatamaz; devam edenler sürer."
              onChange={() => (acceptsNewRuns ? changeIntake(WORKFLOW_INTAKE.NEW_RUNS_CLOSED) : reopenNewRuns())}
            />
            <TimingRow title="Otomatik kapanış" checked={Boolean(closesAt)} disabled={pending}
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
        <Link href={workflowEditHref(workflow)} className={`${actionClass()} w-full`}>
          <PencilLine size={13} className={ACTION_ICON} />
          Düzenle
        </Link>
      </section>

      <section className={PANEL_SECTION}>
        <SectionHeader title="Adımların formları" description="Her adımın formu düzenlenebilir; Cevaplar ve Analitik sayfaları da ayrı duruyor." />
        <div className="space-y-2">
          {(overview?.steps ?? []).filter((step) => !step.isRemoved).map((step) => (
            <div key={step.nodeKey} className={`${ROW} flex items-center gap-3 border-white/10 px-3 py-2.5`}>
              <span className="grid size-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-neutral-900/60 text-xs font-semibold text-neutral-400">{step.depth || "?"}</span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-neutral-200" title={step.formTitle}>{step.formTitle}</span>
              <Link href={`/admin/forms/${step.formId}/edit`} className={`rounded text-2xs text-neutral-500 transition-colors hover:text-neutral-200 ${FOCUS_RING}`}>Düzenle</Link>
              <Link href={`/admin/forms/${step.formId}/responses`} className={`rounded text-2xs text-neutral-500 transition-colors hover:text-neutral-200 ${FOCUS_RING}`}>Cevaplar</Link>
              <Link href={`/admin/forms/${step.formId}/analytics`} className={`rounded text-2xs text-neutral-500 transition-colors hover:text-neutral-200 ${FOCUS_RING}`}>Analitik</Link>
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

export default function WorkflowFlowPage({ workflow }) {
  const [stepFilter, setStepFilter] = useState(null);
  const [tab, setTab] = useState(0);
  const [page, setPage] = useState(1);

  const { data: overviewData, isLoading: overviewLoading } = useWorkflowRunsOverviewQuery(workflow.id, { refetchInterval: 60000 });
  const { data: versionsData } = useWorkflowVersionsQuery(workflow.id);
  const { data: runsData, isLoading: runsLoading, isError: runsError } = useWorkflowRunsQuery(workflow.id, { page, pageSize: PAGE_SIZE, filter: tab, nodeKey: stepFilter });

  const overview = payloadOf(overviewData);
  const versionsPayload = payloadOf(versionsData);
  const versions = Array.isArray(versionsPayload) ? versionsPayload : versionsPayload?.items ?? [];
  const runsPage = payloadOf(runsData);
  const runs = runsPage?.items ?? [];
  const steps = overview?.steps ?? [];
  const finished = overview?.finished ?? { completed: 0, declined: 0, timedOut: 0, voided: 0, stopped: 0 };
  const finishedTotal = FINISHED_ROWS.reduce((sum, [key]) => sum + (finished[key] ?? 0), 0);
  const isLive = Boolean(workflow.published);
  const intake = intakeOf(workflow);
  const archived = Number(workflow.status) === 2;
  const filteredStep = steps.find((step) => step.nodeKey === stepFilter) ?? null;

  const pill = archived ? ["Arşivde", "neutral"] : !isLive ? ["Taslak", "neutral"] : intake === WORKFLOW_INTAKE.CLOSED ? ["Kapalı", "red"]
    : intake === WORKFLOW_INTAKE.NEW_RUNS_CLOSED ? ["Yeni başvuru kapalı", "amber"]
      : [`Açık${versions.find((version) => Number(version.status) === 1) ? ` · v${versions.find((version) => Number(version.status) === 1).version}` : ""}`, "emerald"];

  const tabs = [
    [0, "Devam eden", overview?.activeRunCount ?? 0],
    [1, "Onay bekleyen", overview?.awaitingReviewCount ?? 0],
    [2, "Bitenler", finishedTotal],
  ];

  const chooseTab = (next) => {
    setTab(next);
    setPage(1);
  };

  const chooseStep = (nodeKey) => {
    setStepFilter((current) => (current === nodeKey ? null : nodeKey));
    if (tab === 2) setTab(0);
    setPage(1);
  };

  return (
    <div className="flex h-auto flex-col gap-6 p-4 md:h-[calc(100dvh-3.5rem)] md:min-h-0 lg:p-6">
      <HeaderPortal>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block"><StatePill tone={pill[1]}>{pill[0]}</StatePill></span>
          <Link href={workflowEditHref(workflow)}
            className={`flex items-center gap-1.5 rounded-lg border border-skylab-400/40 bg-skylab-500/15 px-2.5 py-1 text-xs font-semibold text-skylab-300 transition-colors hover:bg-skylab-500/25 ${FOCUS_RING}`}
          >
            <PencilLine size={14} />
            Düzenle
          </Link>
        </div>
      </HeaderPortal>

      <div className="-mx-1 overflow-x-auto px-1 pb-1 scrollbar">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(1, steps.length)}, minmax(11rem,1fr)) minmax(11rem,0.85fr)` }}>
          {overviewLoading ? Array.from({ length: 3 }, (_, index) => <div key={index} className="shimmer h-28 rounded-lg" />) : null}
          {steps.map((step, index) => (
            <StepTile key={step.nodeKey} step={step} index={index} total={steps.length} selected={stepFilter === step.nodeKey}
              disabled={!isLive && step.count === 0} onClick={() => chooseStep(step.nodeKey)}
            />
          ))}
          {!overviewLoading ? (
            <button type="button" disabled={!isLive && finishedTotal === 0} onClick={() => { setStepFilter(null); chooseTab(2); }}
              className={`flex min-w-44 flex-col justify-start rounded-lg border px-3 py-2.5 text-left transition-colors disabled:cursor-default ${
                tab === 2 && stepFilter == null ? "border-skylab-400/40 bg-skylab-500/[0.07]" : "border-white/10 hover:border-white/20 hover:bg-white/3"
              }`}
            >
              <p className="text-xs font-medium text-neutral-200">Bitenler</p>
              <div className="mt-2 grid grid-cols-1 gap-y-1 text-2xs">
                {FINISHED_ROWS.filter(([key]) => key !== "stopped" || finished.stopped > 0).map(([key, state]) => (
                  <span key={key} className="flex items-center justify-between gap-2">
                    <span className="inline-flex min-w-0 items-center gap-1.5 text-neutral-400">
                      <span className={`size-1.5 shrink-0 rounded-full ${RUN_STATE[state].dot}`} />
                      <span className="truncate">{RUN_STATE[state].label}</span>
                    </span>
                    <span className="tabular-nums text-neutral-200">{finished[key] ?? 0}</span>
                  </span>
                ))}
              </div>
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-8 lg:grid-cols-12">
        <section className="flex min-h-0 flex-col lg:col-span-8">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-base font-semibold text-neutral-100">Başvuranlar</h2>
            <span className="hidden h-px flex-1 bg-white/5 sm:block" />
            <div className="flex items-center text-2xs">
              {tabs.map(([key, label, count], index) => (
                <Fragment key={key}>
                  {index ? <span className="mx-2 h-3 w-px bg-neutral-800" /> : null}
                  <button type="button" onClick={() => chooseTab(key)} className={`rounded transition-colors ${FOCUS_RING} ${tab === key ? "text-neutral-100" : "text-neutral-500 hover:text-neutral-300"}`}>
                    {label} <span className="tabular-nums text-neutral-500">{count}</span>
                  </button>
                </Fragment>
              ))}
            </div>
          </div>
          {filteredStep ? (
            <div className="mt-2.5 flex">
              <button type="button" onClick={() => { setStepFilter(null); setPage(1); }}
                className="inline-flex items-center gap-1.5 rounded-md border border-skylab-400/30 bg-skylab-500/10 px-2 py-0.5 text-2xs text-skylab-300"
              >
                {filteredStep.depth ? `${filteredStep.depth}. adım: ` : ""}{filteredStep.formTitle}
                <X size={11} />
              </button>
            </div>
          ) : null}

          <div className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1 scrollbar">
            <div className={`${RUNS_GRID} sticky top-0 z-10 border-b border-white/10 bg-neutral-900 px-3 pb-2`}>
              <span className={COLUMN}>Başvuran</span>
              <span className={`hidden md:block ${COLUMN}`}>Adım</span>
              <span className={`hidden md:block ${COLUMN}`}>Durum</span>
              <span className={`hidden text-center md:block ${COLUMN}`}>{tab === 2 ? "Bitti" : "Adımda"}</span>
              <span className={`hidden text-center md:block ${COLUMN}`}>Başladı</span>
              <span />
            </div>
            {runsLoading ? (
              <div className="space-y-2 pt-2">{Array.from({ length: 5 }, (_, index) => <div key={index} className="shimmer h-12 rounded-lg" />)}</div>
            ) : runsError ? (
              <p className="px-3 py-10 text-center text-2xs text-red-300">Başvuranlar yüklenemedi.</p>
            ) : runs.length === 0 ? (
              <p className="px-3 py-10 text-center text-2xs text-neutral-500">{isLive ? "Bu süzgeçte başvuran yok." : "Akış yayınlanınca başvuranlar burada görünür."}</p>
            ) : (
              <div className="divide-y divide-white/5">
                {runs.map((run) => {
                  const state = RUN_STATE[Number(run.state)] ?? RUN_STATE[0];
                  const step = steps.find((item) => item.nodeKey === run.nodeKey);
                  const href = run.latestResponse ? `/admin/forms/${run.latestResponse.formId}/responses/${run.latestResponse.id}` : null;
                  const finishedRun = Number(run.state) >= 4;
                  const stateLine = (
                    <>
                      <span className={`size-1.5 shrink-0 rounded-full ${state.dot}`} />
                      <span className={`truncate ${state.text}`}>{state.label}</span>
                      {Number(run.state) === 1 && run.deadlineAt ? <span className="shrink-0 font-mono text-3xs text-neutral-500">{remainingText(run.deadlineAt)}</span> : null}
                      {Number(run.round) > 1 && !finishedRun ? <span className="shrink-0 text-3xs text-neutral-600">{run.round}. gönderim</span> : null}
                    </>
                  );
                  const content = (
                    <div className={`${RUNS_GRID} px-3 py-2.5`}>
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar name={run.applicant?.fullName} email={run.applicant?.email} photoUrl={run.applicant?.profilePictureUrl} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm text-neutral-200 transition-colors group-hover/row:text-neutral-50">{run.applicant?.fullName || "Kullanıcı"}</p>
                          <p className="truncate text-3xs text-neutral-500">{run.applicant?.email ?? ""}</p>
                          <p className="mt-1 flex min-w-0 items-center gap-1.5 text-2xs md:hidden">
                            {stateLine}
                            <span className="shrink-0 text-3xs text-neutral-600">· {step?.depth || run.sequence}. adım</span>
                          </p>
                        </div>
                      </div>
                      <div className="hidden min-w-0 md:block">
                        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-white/10 bg-white/3 px-1.5 py-0.5 text-2xs text-neutral-300">
                          <span className="tabular-nums text-neutral-500">{step?.depth || run.sequence}</span>
                          <span className="truncate">{run.formTitle}</span>
                        </span>
                      </div>
                      <div className="hidden min-w-0 items-center gap-1.5 text-2xs md:flex">{stateLine}</div>
                      <div className="hidden text-center text-2xs tabular-nums text-neutral-400 md:block">{finishedRun ? formatDay(run.completedAt) || "—" : elapsed(run.stepStartedAt)}</div>
                      <div className="hidden text-center text-2xs tabular-nums text-neutral-500 md:block">{formatDay(run.startedAt)}</div>
                      {href ? <ChevronRight size={15} className="text-neutral-500 transition-transform group-hover/row:translate-x-0.5" /> : <span />}
                    </div>
                  );
                  return href ? (
                    <Link key={run.id} href={href} className="group/row block transition-colors hover:bg-white/3" title={finishedRun ? "Son cevabı aç" : "Cevabı aç: onay, ret, düzeltme"}>
                      {content}
                    </Link>
                  ) : (
                    <div key={run.id} className="group/row" title="Bu başvurunun henüz cevabı yok">{content}</div>
                  );
                })}
              </div>
            )}
          </div>

          {runsPage && runsPage.totalCount > PAGE_SIZE ? (
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
              <p className="text-2xs text-neutral-500"><span className="font-semibold tabular-nums text-neutral-200">{runsPage.totalCount}</span> başvuru</p>
              <Pagination current={runsPage.page ?? page} totalPages={runsPage.totalPages ?? Math.ceil(runsPage.totalCount / PAGE_SIZE)} onPageChange={setPage} />
            </div>
          ) : null}
        </section>

        <aside className="flex min-h-0 flex-col lg:col-span-4">
          <div className="flex h-7 items-center gap-2">
            <span className="text-2xs font-medium text-neutral-500">İşletme</span>
            <span className="h-px flex-1 bg-white/5" />
            <span className="text-3xs text-neutral-600">{formatUpdatedAt(workflow.updatedAt ?? workflow.createdAt)}</span>
          </div>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar">
            <OperationsPanel workflow={workflow} overview={overview} versions={versions} />
          </div>
        </aside>
      </div>
    </div>
  );
}
