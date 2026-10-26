"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download, FileXCorner, GitCompare, History, Inbox, ListChecks, Loader2, Mail, PencilLine, RefreshCw, Users, X } from "lucide-react";
import StateCard from "@/app/components/StateCard";
import Avatar from "@/app/components/utils/Avatar";
import { ATTEMPT_STATUS, STATUS_FILTERS } from "@/lib/attempt-status";
import { formQuery, useExportResponses } from "@/lib/hooks/useFormAdmin";
import { attemptViewQuery, formResponsesQuery, responsePageQuery, useResponseStatusMutation } from "@/lib/hooks/useResponse";
import { responsePreviewQuery } from "@/lib/hooks/useResponseShare";
import RoomFrame, { INSPECTOR_HEADER } from "../form-room/RoomFrame";
import RoomCanvas, { CardTop } from "../form-room/RoomCanvas";
import RoomHeader, { HeaderButton, HeaderIcon, HeaderTouch } from "../form-room/RoomHeader";
import { CardSkeleton } from "../form-room/RoomSkeleton";
import { useRoom, useRoomKeys, useRoomState } from "../form-room/room-context";
import { sameId } from "../form-room/room-flow";
import { prefersReducedMotion } from "../form-studio/studio-motion";
import { questionNumbers } from "../form-studio/studio-schema";
import ApplicantList from "./ApplicantList";
import DecisionPanel, { decisionAccess } from "./DecisionPanel";
import JourneyChips from "./JourneyChips";
import MarginRail, { ChangeNote, RAIL_EXTRA, RAIL_GAP, RAIL_MIN_CARD, RAIL_W, RevisionNote } from "./MarginRail";
import PanelHead from "./PanelHead";
import ResponseCard, { changedIdsOf, fieldsOf } from "./ResponseCard";
import useMailTransfer from "./useMailTransfer";
import {
  FILTER_DEFAULTS, RETURNED, formatDateTime, isAttemptRow, kindOfDetail, listParams, matchesSearch, personOf, rowKind, rowMatches, rowTarget,
  searchKey, statusFilterOf, statusView, stepKeyOf,
} from "./response-data";

const FRESH = 30_000;
const OPEN_WAIT_MS = 700;
const EMPTY = {};
const IDLE = { pending: null, note: "", flags: null, phase: "idle", error: null };
const DECISION_KEYS = { 1: 2, 2: RETURNED, 3: 3 };
const VERB = { 2: "onaylandı", 3: "reddedildi", [RETURNED]: "için düzeltme istendi" };

let listMemory = { filters: FILTER_DEFAULTS, pages: {} };

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function validStatus(value) {
  return STATUS_FILTERS.some((item) => item.value === value) ? value : null;
}

function detailQueryOf(target) {
  return target.attempt ? attemptViewQuery(target.responseId) : responsePreviewQuery(target.responseId);
}

function detailOf(payload, attempt) {
  return attempt ? payload?.data ?? null : payload?.data ?? payload ?? null;
}

export function prefetchResponses(queryClient, route) {
  if (!route.formId) return Promise.resolve();
  const status = validStatus(route.status);
  const filters = status ? { ...listMemory.filters, status } : listMemory.filters;
  const page = status ? 1 : listMemory.pages[route.formId] ?? 1;
  return Promise.all([
    queryClient.prefetchQuery({ ...formResponsesQuery(route.formId, listParams(filters, page)), staleTime: FRESH }),
    route.responseId && !status ? queryClient.prefetchQuery({ ...detailQueryOf(route), staleTime: FRESH }) : null,
  ]);
}

function Spinner(props) {
  return <Loader2 {...props} className="animate-spin" />;
}

function StateBox({ title, description, Icon = FileXCorner }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-10">
      <StateCard title={title} Icon={Icon} description={description} />
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-hidden="true">
      <span className="shimmer block h-11 w-2/3 rounded-lg" />
      {Array.from({ length: 4 }, (_, index) => <span key={index} className="shimmer block h-9 rounded-lg" />)}
    </div>
  );
}

function NavButton({ label, disabled, onClick, children }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={label} aria-label={label}
      className="grid size-10 place-items-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100 disabled:opacity-30 sm:size-7"
    >
      {children}
    </button>
  );
}

function BarButton({ label, onClick, className = "text-neutral-300", children }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      className={`flex h-11 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-2xs font-medium transition-colors hover:bg-white/5 hover:text-neutral-100 ${className}`}
    >
      {children}
    </button>
  );
}

export default function ResponseMode() {
  const room = useRoom();
  const queryClient = useQueryClient();
  const { route, formId, form, go, slideTo, toast, phone, stacked, rightDocked, cardPhone, centerWidth, canView } = room;

  const [filters, setFiltersValue] = useRoomState("response.filters", FILTER_DEFAULTS);
  const [pages, setPages] = useRoomState("response.page", EMPTY);
  const [search, setSearch] = useRoomState("response.search", "");
  const [reviews, setReviews] = useRoomState("response.review", EMPTY);
  const [autoNext, setAutoNext] = useRoomState("response.autoNext", true);
  const [showChanges, setShowChanges] = useRoomState("response.showChanges", true);
  const [viewKeys, setViewKeys] = useRoomState("response.viewKey", EMPTY);
  const [placed, setPlaced] = useRoomState("response.placed", null);
  const [, setLastResp] = useRoomState("lastResp", EMPTY);
  const [hover, setHover] = useState(null);
  const repick = useRef(false);
  const routeRef = useRef(route);
  const timers = useRef(new Set());
  const mail = useMailTransfer(formId);
  const { exportToExcel, loading: exporting } = useExportResponses(formId);
  const statusMutation = useResponseStatusMutation();

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    listMemory = { filters, pages };
  }, [filters, pages]);

  const routeStatus = validStatus(route.status);
  const activeFilters = routeStatus ? { ...filters, status: routeStatus } : filters;
  const page = routeStatus ? 1 : pages[formId] ?? 1;
  const listResult = useQuery({
    ...formResponsesQuery(formId, listParams(activeFilters, page)),
    enabled: Boolean(formId) && canView,
    staleTime: FRESH,
    placeholderData: (previous, previousQuery) => (sameId(previousQuery?.queryKey?.[1], formId) ? previous : undefined),
  });
  const listData = listResult.data?.data ?? null;
  const pagination = listData?.paginationData ?? null;
  const rows = useMemo(() => pagination?.items ?? [], [pagination]);
  const counts = listData?.counts ?? null;
  const timed = Boolean(listData?.hasTimeLimit) || Number(form?.timeLimitMinutes) > 0;
  const listReady = listResult.isSuccess && !listResult.isPlaceholderData;
  const filtered = Object.keys(FILTER_DEFAULTS).some((key) => activeFilters[key] !== FILTER_DEFAULTS[key]);
  const query = searchKey(search);
  const navRows = query ? rows.filter((row) => matchesSearch(row, query)) : rows;
  const index = navRows.findIndex((row) => rowMatches(row, route));
  const pageNo = pagination?.page ?? page;
  const totalPages = Math.max(1, pagination?.totalPages ?? 1);

  const isAttempt = Boolean(route.attempt);
  const ownResult = useQuery({
    ...detailQueryOf({ responseId: route.responseId, attempt: isAttempt }),
    enabled: Boolean(route.responseId) && canView,
    staleTime: FRESH,
  });
  const own = route.responseId ? detailOf(ownResult.data, isAttempt) : null;

  const wantsPlace = Boolean(route.responseId) && !isAttempt && !routeStatus && listReady && !sameId(placed, route.responseId);
  const onPage = rows.some((row) => rowMatches(row, route));
  const placeResult = useQuery({
    ...responsePageQuery(formId, route.responseId, listParams(activeFilters, null)),
    enabled: wantsPlace && !onPage && canView,
    staleTime: FRESH,
  });
  const placeLoading = placeResult.isPending && placeResult.fetchStatus !== "idle";
  const placePage = placeResult.data?.data?.page ?? null;

  useEffect(() => {
    if (!wantsPlace || (!onPage && placeLoading)) return;
    setPlaced(route.responseId);
    if (!onPage && placePage && placePage !== page) setPages((current) => ({ ...current, [formId]: placePage }));
  }, [wantsPlace, onPage, placeLoading, placePage, page, route.responseId, formId, setPlaced, setPages]);

  const linkedId = isAttempt && [ATTEMPT_STATUS.SUBMITTED, ATTEMPT_STATUS.PROVISIONAL].includes(own?.attempt?.status) ? own.attempt.responseId ?? null : null;
  const linkedFormId = linkedId ? own?.formId ?? null : null;

  const steps = Array.isArray(own?.workflow?.steps) ? own.workflow.steps : [];
  const ownKey = own?.workflow ? stepKeyOf({ stage: own.workflow.stage, round: own.workflow.round }) : null;
  const viewKey = (own ? viewKeys[own.id] : null) ?? ownKey;
  const viewedStep = steps.find((step) => stepKeyOf(step) === viewKey) ?? null;
  const ownStep = steps.find((step) => stepKeyOf(step) === ownKey) ?? null;
  const isOwnView = !viewedStep || viewKey === ownKey || !viewedStep.responseId;
  const otherId = isOwnView ? null : viewedStep.responseId;
  const otherResult = useQuery({ ...responsePreviewQuery(otherId), enabled: Boolean(otherId), staleTime: FRESH });
  const shown = isOwnView ? own : detailOf(otherResult.data, false);
  const shownIsAttempt = isOwnView && isAttempt;
  const shownStep = isOwnView ? ownStep : viewedStep;
  const sameStage = !isOwnView && Boolean(ownStep) && viewedStep.stage === ownStep.stage;
  const previousStep = shownStep && (shownStep.round ?? 1) > 1
    ? steps.find((step) => step.stage === shownStep.stage && (step.round ?? 1) === (shownStep.round ?? 1) - 1) ?? null
    : null;
  const previousId = shownIsAttempt ? null : previousStep?.responseId ?? null;
  const previousResult = useQuery({ ...responsePreviewQuery(previousId), enabled: Boolean(previousId), staleTime: FRESH });
  const previous = previousId ? detailOf(previousResult.data, false) : null;

  const shownFormId = shown?.formId ?? null;
  const foreignForm = Boolean(shownFormId) && !sameId(shownFormId, formId);
  const shownFormResult = useQuery({ ...formQuery(shownFormId), enabled: foreignForm, staleTime: FRESH });
  const shownForm = foreignForm ? shownFormResult.data?.data ?? null : form;
  const shownFormPending = foreignForm ? shownFormResult.isPending : !form && !room.formResult.isError;

  const { fields, orphans, answers } = useMemo(() => fieldsOf(shownForm, shown), [shownForm, shown]);
  const allFields = useMemo(() => [...fields, ...orphans], [fields, orphans]);
  const numbers = useMemo(() => questionNumbers(allFields), [allFields]);
  const previousAnswers = useMemo(() => (previous ? new Map((previous.schema ?? []).map((item) => [item.id, item.answer])) : null), [previous]);
  const changedIds = useMemo(() => changedIdsOf(allFields, answers, previousAnswers), [allFields, answers, previousAnswers]);
  const requestedBefore = previous?.returnedQuestionIds ?? [];

  const ownResponseId = own && !isAttempt ? own.id : null;
  useEffect(() => {
    if (!ownResponseId || !formId) return;
    setLastResp((current) => (sameId(current[formId], ownResponseId) ? current : { ...current, [formId]: ownResponseId }));
  }, [ownResponseId, formId, setLastResp]);

  useEffect(() => {
    if (linkedId) go({ formId: linkedFormId ?? routeRef.current.formId, responseId: linkedId, attempt: false }, { replace: true });
  }, [linkedId, linkedFormId, go]);

  useEffect(() => {
    if (!route.status) return;
    if (!routeStatus) {
      go({ status: null }, { replace: true });
      return;
    }
    setFiltersValue((current) => ({ ...current, status: routeStatus }));
    setPages((current) => ({ ...current, [formId]: 1 }));
    go({ status: null, responseId: null, attempt: false }, { replace: true });
  }, [route.status, routeStatus, formId, go, setFiltersValue, setPages]);

  const firstRow = rows[0] ?? null;
  useEffect(() => {
    if (route.responseId || route.status || !listReady || !firstRow) return;
    go(rowTarget(firstRow), { replace: true });
  }, [route.responseId, route.status, listReady, firstRow, go]);

  useEffect(() => {
    if (!repick.current || !listReady) return;
    repick.current = false;
    if (!rows.length || rows.some((row) => rowMatches(row, route))) return;
    go(rowTarget(rows[0]), { replace: true, transition: "swap", ms: 160 });
  }, [listReady, rows, route, go]);

  const prevRow = index > 0 ? navRows[index - 1] : null;
  const nextRow = index >= 0 ? navRows[index + 1] ?? null : null;
  useEffect(() => {
    [prevRow, nextRow].forEach((row) => {
      if (row) queryClient.prefetchQuery({ ...detailQueryOf(rowTarget(row)), staleTime: FRESH });
    });
  }, [prevRow, nextRow, queryClient]);

  const later = (callback, ms) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      callback();
    }, ms);
    timers.current.add(id);
  };

  const reviewOf = (id) => ({ ...IDLE, ...(reviews[id] ?? EMPTY) });
  const patchReview = (id, patch) => setReviews((current) => ({ ...current, [id]: { ...IDLE, ...(current[id] ?? EMPTY), ...patch } }));

  const setFilters = (next) => {
    setFiltersValue(next);
    setPages((current) => ({ ...current, [formId]: 1 }));
    repick.current = true;
  };

  const prefetchTarget = (target) => queryClient.prefetchQuery({ ...detailQueryOf(target), staleTime: FRESH });

  const openRow = (row, direction = 0) => {
    const target = rowTarget(row);
    if (direction) {
      slideTo({ x: direction, y: 0 }, () => go(target, { replace: true }), () => prefetchTarget(target));
      return;
    }
    Promise.race([prefetchTarget(target), wait(OPEN_WAIT_MS)]).then(() => go(target, { replace: true, transition: "swap", ms: 160 }));
  };

  const selectRow = (row) => {
    room.setSheet(null);
    if (rowMatches(row, route)) return;
    const to = navRows.indexOf(row);
    openRow(row, phone || index < 0 || to < 0 ? 0 : Math.sign(to - index));
  };

  const stepResponse = (delta) => {
    if (!navRows.length) return;
    const next = navRows[index < 0 ? 0 : index + delta];
    if (next) {
      if (!rowMatches(next, route)) openRow(next, delta);
      return;
    }
    const target = pageNo + delta;
    if (query || target < 1 || target > totalPages) return;
    const pageQuery = formResponsesQuery(formId, listParams(activeFilters, target));
    const edgeOf = (payload) => {
      const items = payload?.data?.paginationData?.items ?? [];
      return (delta > 0 ? items[0] : items[items.length - 1]) ?? null;
    };
    slideTo({ x: delta, y: 0 }, () => {
      const row = edgeOf(queryClient.getQueryData(pageQuery.queryKey));
      if (!row) return;
      setPages((current) => ({ ...current, [formId]: target }));
      go(rowTarget(row), { replace: true });
    }, async () => {
      const row = edgeOf(await queryClient.fetchQuery({ ...pageQuery, staleTime: FRESH }));
      if (row) await prefetchTarget(rowTarget(row));
    });
  };

  const nextPendingOf = (id) => {
    const position = rows.findIndex((row) => !isAttemptRow(row) && sameId(row.id, id));
    const pending = (row) => rowKind(row) === "pending" && !sameId(row.id, id);
    return rows.slice(position + 1).find(pending) ?? rows.find(pending) ?? null;
  };
  const nextPending = shown && isOwnView && !shownIsAttempt ? nextPendingOf(shown.id) : null;

  const pickJourney = (step) => {
    if (!own) return;
    const key = stepKeyOf(step);
    if (key === viewKey || (!step.responseId && key !== ownKey)) return;
    const from = steps.findIndex((item) => stepKeyOf(item) === viewKey);
    const to = steps.findIndex((item) => stepKeyOf(item) === key);
    const targetId = key === ownKey ? null : step.responseId;
    slideTo({ x: to > from ? 1 : -1, y: 0 }, () => setViewKeys((current) => ({ ...current, [own.id]: key })), targetId ? async () => {
      const payload = await queryClient.fetchQuery({ ...responsePreviewQuery(targetId), staleTime: FRESH });
      const targetFormId = detailOf(payload, false)?.formId;
      if (targetFormId && !sameId(targetFormId, formId)) await queryClient.prefetchQuery({ ...formQuery(targetFormId), staleTime: FRESH });
    } : null);
  };

  const shownReview = shown ? reviewOf(shown.id) : IDLE;
  const access = shown ? decisionAccess(shown, shownIsAttempt, shownReview) : null;
  const flagMode = shownReview.pending === RETURNED;
  const flags = shownReview.flags ?? [];

  const scrollToDecision = (smooth = true) => {
    document.querySelector("[data-room] [data-decision]")?.scrollIntoView({ block: "start", behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto" });
  };
  const focusNote = (delay, preventScroll = false) => later(() => document.querySelector("[data-room] [data-note]")?.focus({ preventScroll }), delay);

  const decide = (detail, status, state) => {
    const next = isOwnView ? nextPendingOf(detail.id) : null;
    const advance = autoNext && next;
    const name = personOf(detail).name;
    const suffix = !isOwnView ? "" : advance ? ` · sıradaki ${personOf(next).name}` : next ? "" : " · bekleyen kalmadı";
    patchReview(detail.id, { phase: "loading", error: null });
    statusMutation.mutateAsync({
      responseId: detail.id,
      newStatus: status,
      note: state.note?.trim() || null,
      questionIds: status === RETURNED ? state.flags ?? [] : null,
    }).then(() => {
      patchReview(detail.id, { pending: null, flags: null, phase: "success", editing: undefined, decidedHere: true });
      queryClient.invalidateQueries({ queryKey: ["form-metrics"] });
      toast(`${name} ${VERB[status]}${suffix}`);
      later(() => {
        patchReview(detail.id, { phase: "idle" });
        const current = routeRef.current;
        if (advance && !current.attempt && sameId(current.responseId, detail.id)) openRow(next, 1);
      }, 700);
    }, (error) => {
      patchReview(detail.id, { phase: "idle", error: error?.status ? error.message : "Durum güncellenemedi; bağlantıyı kontrol edip tekrar deneyin." });
    });
  };

  const startDecision = (status) => {
    if (!shown || !access?.deciding || shownReview.phase !== "idle") return false;
    if (status === RETURNED && !access.canReturn) return false;
    patchReview(shown.id, { pending: status, flags: status === RETURNED ? shownReview.flags ?? [] : null, error: null });
    if (stacked) scrollToDecision(false);
    if (status === RETURNED) focusNote(120);
    return true;
  };

  const confirmDecision = () => {
    if (!shown || !shownReview.pending || shownReview.phase !== "idle") return false;
    if (shownReview.pending === RETURNED && !shownReview.note.trim()) {
      document.querySelector("[data-room] [data-note]")?.focus();
      return true;
    }
    decide(shown, shownReview.pending, shownReview);
    return true;
  };

  const cancelDecision = () => {
    if (!shown || !shownReview.pending) return false;
    patchReview(shown.id, { pending: null, flags: null });
    return true;
  };

  useRoomKeys((event, { typing, modifier }) => {
    if (typing) {
      if (!modifier || event.key !== "Enter" || !confirmDecision()) return false;
      event.preventDefault();
      return true;
    }
    if (modifier || event.altKey) return false;
    if (event.key === "Escape") return cancelDecision();
    if (DECISION_KEYS[event.key]) return startDecision(DECISION_KEYS[event.key]);
    if (event.key === "Enter") {
      if (!shownReview.pending || event.target?.closest?.("button, a, summary, [role='button']")) return false;
      event.preventDefault();
      return confirmDecision();
    }
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      stepResponse(event.key === "ArrowLeft" ? -1 : 1);
      return true;
    }
    return false;
  });

  const refresh = () => {
    [["form-responses", formId], ["response"], ["attempt"], ["form-metrics"]].forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    toast("Yenilendi");
  };

  const countOf = (node) => {
    const metrics = room.stepMetrics[node.formId];
    if (!metrics) return null;
    const pending = metrics.pendingCount ?? 0;
    return pending > 0 ? { text: pending, dot: "bg-amber-400", tone: "text-amber-300/80" } : { text: metrics.totalResponses ?? 0, tone: "text-neutral-600" };
  };

  const outline = (where) => (
    <>
      {room.outlineHead(where)}
      {room.steps(countOf, { keysHint: false })}
      {canView ? (
        <ApplicantList rows={rows} counts={counts} timed={timed} filters={activeFilters} setFilters={setFilters} search={search} setSearch={setSearch}
          isSelected={(row) => rowMatches(row, route)} onSelect={selectRow} pagination={pagination}
          onPage={(next) => setPages((current) => ({ ...current, [formId]: next }))}
          loading={listResult.isPending} error={listResult.isError} touch={phone}
        />
      ) : null}
    </>
  );

  const person = personOf(own);
  const shownView = statusView(shown ? kindOfDetail(shown, shownIsAttempt) : kindOfDetail(own, isAttempt));
  const filterOn = activeFilters.status !== "all";
  const filterInfo = statusFilterOf(activeFilters.status);
  const total = query ? navRows.length : pagination?.totalCount ?? rows.length;
  const position = index < 0 ? null : query ? index + 1 : (pageNo - 1) * (pagination?.pageSize ?? rows.length) + index + 1;
  const atStart = !navRows.length || (index === 0 && (Boolean(query) || pageNo <= 1));
  const atEnd = !navRows.length || (index === navRows.length - 1 && (Boolean(query) || pageNo >= totalPages));

  const nav = (
    <span className="flex shrink-0 items-center gap-0.5">
      {filterOn ? (
        <button type="button" onClick={() => setFilters({ ...activeFilters, status: "all" })} title="Filtreyi kaldır"
          className="mr-1 hidden h-6 items-center gap-1 rounded-md border border-white/10 px-1.5 text-3xs text-neutral-400 transition-colors hover:text-neutral-200 sm:flex"
        >
          <span className={`size-1.5 rounded-full ${filterInfo.dot ?? ""}`} />
          {filterInfo.label}
          <X size={10} />
        </button>
      ) : null}
      <NavButton label="Önceki (←)" disabled={atStart} onClick={() => stepResponse(-1)}><ChevronLeft size={15} /></NavButton>
      <span className="flex min-w-12 items-center justify-center gap-1 text-2xs tabular-nums text-neutral-500" title="← → ile listedeki sıradaki kişiye geçilir">
        {filterOn ? <span title={`Filtre: ${filterInfo.label}`} className={`size-1.5 rounded-full sm:hidden ${filterInfo.dot ?? ""}`} /> : null}
        {position ?? "–"} / {total}
      </span>
      <NavButton label="Sonraki (→)" disabled={atEnd} onClick={() => stepResponse(1)}><ChevronRight size={15} /></NavButton>
    </span>
  );

  const identity = own ? (
    <>
      <Avatar name={person.known ? person.name : ""} photoUrl={person.photoUrl} size="sm" />
      <span className="min-w-0 truncate text-sm font-medium text-neutral-100">{person.name}</span>
      <span className={`flex shrink-0 items-center gap-1.5 text-2xs ${shownView.text}`}>
        <span className={`size-1.5 rounded-full ${shownView.dot}`} />
        {shownView.label}
      </span>
      <span className="ml-auto" />
      {nav}
    </>
  ) : null;

  const row2 = own && steps.length ? (
    <>
      <JourneyChips steps={steps} viewKey={viewKey} ownKey={ownKey} onPick={pickJourney} />
      {previous ? (
        <button type="button" onClick={() => setShowChanges((value) => !value)} aria-pressed={showChanges} title={`${previousStep?.round ?? 1}. gönderimden farklı cevapları vurgula`}
          className={`flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-2.5 text-3xs font-medium transition-colors sm:h-6 sm:px-2 ${
            showChanges ? "border-sky-400/40 bg-sky-400/10 text-sky-200" : "border-white/10 text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <GitCompare size={11} />
          Değişenler
          <span className="tabular-nums opacity-70">{changedIds.length}</span>
        </button>
      ) : null}
    </>
  ) : null;

  const banner = own && !isOwnView ? (
    <div className="flex min-h-11 items-center gap-3 rounded-xl border border-white/10 bg-neutral-900/80 px-3 py-2">
      <History size={14} className="shrink-0 text-neutral-500" />
      <p className="min-w-0 flex-1 text-2xs leading-snug text-neutral-400">
        <span className="font-medium text-neutral-200">{sameStage ? `${viewedStep.round ?? 1}. gönderim` : viewedStep.formTitle || "Adsız form"}</span>
        {shown ? <> · {formatDateTime(shown.submittedAt)} · <span className={shownView.text}>{shownView.label}</span></> : null}
      </p>
      <button type="button" onClick={() => pickJourney(ownStep ?? { stage: own.workflow?.stage, round: own.workflow?.round })}
        className="flex min-h-9 shrink-0 items-center rounded-lg border border-white/10 bg-white/5 px-2.5 text-2xs font-medium text-neutral-200 transition-colors hover:bg-white/10 sm:min-h-7"
      >
        {sameStage ? `${own.workflow?.round ?? 1}. gönderime dön` : "Geri dön"}
      </button>
    </div>
  ) : null;

  const mailNotice = mail.message ? (
    <div role="status" className="flex items-start gap-3 rounded-xl border border-white/10 bg-neutral-900/80 px-3 py-2.5">
      <Mail size={14} className="mt-0.5 shrink-0 text-neutral-500" />
      <p className="min-w-0 flex-1 text-2xs leading-relaxed text-neutral-300">{mail.message}</p>
      {mail.loading ? <Loader2 size={13} className="mt-0.5 shrink-0 animate-spin text-neutral-500" /> : (
        <button type="button" onClick={mail.dismiss} aria-label="Bildirimi kapat"
          className="-my-1 grid size-8 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-200 sm:size-6"
        >
          <X size={13} />
        </button>
      )}
    </div>
  ) : null;
  const above = mailNotice || banner ? <div className="flex flex-col gap-2">{mailNotice}{banner}</div> : null;

  const railRoom = centerWidth - 10 - RAIL_EXTRA;
  const railOn = Boolean(previous) && Boolean(shown) && showChanges && !cardPhone && railRoom >= RAIL_MIN_CARD;
  const cardWidth = railOn ? Math.min(room.cardWidth, railRoom) : room.cardWidth;
  const fieldsById = new Map(allFields.map((field) => [field.id, field]));
  const notes = railOn ? [
    Number(previous.status) === RETURNED ? { key: `${shown.id}:req`, anchor: null, node: <RevisionNote previous={previous} /> } : null,
    ...changedIds.map((id) => ({
      key: `${shown.id}:${id}`,
      anchor: id,
      node: <ChangeNote field={fieldsById.get(id)} number={numbers.get(id)} previous={previous} previousAnswer={previousAnswers?.get(id)} requested={requestedBefore.includes(id)} />,
    })),
  ].filter(Boolean) : [];
  const hoverQ = railOn && hover?.id === shown?.id ? hover.q : null;
  const rail = railOn ? {
    extra: RAIL_EXTRA,
    gap: RAIL_GAP,
    width: RAIL_W,
    render: (cardRef) => <MarginRail cardRef={cardRef} notes={notes} onHover={(q) => setHover(q ? { id: shown.id, q } : null)} />,
  } : null;

  let card;
  if (!canView) card = <StateBox title="Cevapları görme yetkiniz yok" description="Bu formun cevaplarını görmek için görüntüleme yetkisi gerekir." />;
  else if (!route.responseId) {
    card = listResult.isError
      ? <StateBox title="Cevaplar yüklenemedi" description="Cevap listesi alınamadı." />
      : listReady && !rows.length
        ? <StateBox Icon={Inbox} title={filtered ? "Uygun cevap yok" : "Henüz cevap yok"} description={filtered ? "Verilen filtrelere uygun cevap bulunamadı." : "Bu forma henüz cevap gelmedi."} />
        : <CardSkeleton />;
  } else if (ownResult.isError) card = <StateBox title="Cevap açılamadı" description="Cevap silinmiş olabilir ya da görüntüleme yetkiniz yok." />;
  else if (!own || linkedId) card = <CardSkeleton />;
  else if (!isOwnView && otherResult.isError) card = <StateBox title="Bu adımın cevabı açılamadı" description="Cevap silinmiş olabilir ya da görüntüleme yetkiniz yok." />;
  else if (!shown || shownFormPending) card = <CardSkeleton />;
  else {
    card = (
      <ResponseCard form={shownForm} detail={shown} isAttempt={shownIsAttempt} previous={previous} showChanges={showChanges} flagMode={flagMode} flags={flags}
        onFlag={(id) => patchReview(shown.id, { flags: flags.includes(id) ? flags.filter((item) => item !== id) : [...flags, id] })}
        phone={cardPhone} railOn={railOn} hoverQ={hoverQ} compactHeader={phone} revisionRow={!railOn && Number(previous?.status) === RETURNED}
        onOpenPrevious={previousStep?.responseId ? () => pickJourney(previousStep) : null}
        stepInfo={room.stepInfo && !isOwnView ? { ...room.stepInfo, stage: viewedStep.stage } : room.stepInfo}
      />
    );
  }

  const panelHead = <PanelHead detail={shown} isAttempt={shownIsAttempt} />;
  const panel = shown && !linkedId ? (
    <DecisionPanel key={shown.id} detail={shown} isAttempt={shownIsAttempt} ownKind={isOwnView ? null : sameStage ? "round" : "stage"} numbers={numbers}
      state={shownReview} setState={(patch) => patchReview(shown.id, patch)} onStart={startDecision} onConfirm={confirmDecision} onCancel={cancelDecision}
      nextPending={nextPending ? { ...nextPending, name: personOf(nextPending).name } : null} onOpenNext={() => nextPending && openRow(nextPending, 1)}
      autoNext={autoNext} setAutoNext={setAutoNext} showAutoNext={isOwnView}
      onExtended={() => {
        if (shown.attempt?.id) go({ formId: shown.formId ?? formId, responseId: shown.attempt.id, attempt: true }, { replace: true });
      }}
    />
  ) : null;
  const inspector = !canView ? null : panel ?? (route.responseId || listResult.isPending ? <PanelSkeleton /> : null);
  const decisionBox = stacked && panel ? (
    <div data-decision className="scroll-mt-16 overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/90 sm:scroll-mt-4">
      <div className={INSPECTOR_HEADER}>{panelHead}</div>
      {panel}
    </div>
  ) : null;

  const toolbar = room.toolbar({
    left: room.leftButton("Liste", Users, "Başvuranlar"),
    right: stacked && panel ? { label: "Karar", Icon: ListChecks, title: "Karara git", onClick: () => scrollToDecision() } : null,
    bar: phone && flagMode ? (
      <>
        <BarButton label="İşaretlemeyi bırak" onClick={cancelDecision}><X size={15} />Vazgeç</BarButton>
        <span className="px-2 text-2xs tabular-nums text-sky-200">{flags.length ? `${flags.length} soru işaretli` : "Soruları işaretle"}</span>
        <BarButton label="Açıklama yaz" className="text-sky-100" onClick={() => { scrollToDecision(); focusNote(400, true); }}>
          <PencilLine size={15} />
          Açıklama yaz
        </BarButton>
      </>
    ) : null,
  });

  const center = (
    <RoomCanvas key={`${formId}:${route.responseId ?? ""}:${own ? viewKeys[own.id] ?? "" : ""}`} width={centerWidth} cardWidth={cardWidth}
      top={own && !linkedId ? <CardTop row1={phone ? null : identity} row2={row2} /> : null}
      sticky={phone && own && !linkedId ? <div className="flex h-12 min-w-0 items-center gap-2">{identity}</div> : null}
      above={above} card={card} rail={rail} below={decisionBox}
    />
  );

  return (
    <>
      <RoomHeader
        desktop={(
          <>
            <HeaderIcon icon={RefreshCw} label="Yenile" onClick={refresh} />
            <HeaderIcon icon={mail.loading ? Spinner : Mail} label="Yanıtlayanlara mail gönder" onClick={mail.start} disabled={mail.loading || !canView || !listResult.isSuccess} />
            <HeaderButton icon={exporting ? Spinner : Download} label="Excel" onClick={exportToExcel} disabled={exporting || !canView} />
          </>
        )}
        mobile={<HeaderTouch icon={exporting ? Spinner : Download} label="Excel İndir" onClick={exportToExcel} disabled={exporting || !canView} />}
      />
      <RoomFrame {...room.frameProps} outline={outline} center={center} toolbar={toolbar}
        inspectorHeader={panelHead} inspector={rightDocked ? inspector : null} inspectorWidth="flex-[0_1_340px]"
      />
    </>
  );
}
