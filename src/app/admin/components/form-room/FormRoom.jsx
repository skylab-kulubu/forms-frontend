"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { keepPreviousData, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileXCorner } from "lucide-react";
import { FormStatusHandler } from "@/app/components/FormStatusHandler";
import StateCard from "@/app/components/StateCard";
import { formMetricsQuery, formQuery } from "@/lib/hooks/useFormAdmin";
import { workflowQuery } from "@/lib/hooks/useWorkflowAdmin";
import { effectiveFormSettings } from "@/lib/form-settings";
import { workflowEditHref } from "@/lib/workflow-links";
import FormShareDialog from "../share/FormShareDialog";
import StudioPalette from "../form-studio/StudioPalette";
import { OutlineHeader } from "../form-studio/StudioOutline";
import { CARD_WIDTH } from "../form-studio/StudioCard";
import { useMediaQuery } from "../form-studio/useMediaQuery";
import { slideDirection } from "../form-studio/studio-flow";
import { SLIDE_IN_EASING, SLIDE_IN_MS, SLIDE_OUT_EASING, SLIDE_OUT_MS, SLIDE_PX, prefersReducedMotion, swapView } from "../form-studio/studio-motion";
import OverviewMode, { prefetchOverview } from "../form-overview/OverviewMode";
import AnalyticsMode, { prefetchAnalytics } from "../form-analytics/AnalyticsMode";
import ResponseMode, { prefetchResponses } from "../form-responses/ResponseMode";
import WorkflowMode, { prefetchWorkflow } from "../workflow-page/WorkflowMode";
import { RoomContext } from "./room-context";
import RoomSkeleton from "./RoomSkeleton";
import RoomToolbar from "./RoomToolbar";
import { RoomSteps } from "./RoomOutline";
import { CardTop, DeviceToggle, FlowChips, TitleRow, captureCanvasAnchor } from "./RoomCanvas";
import { EMPTY_ROUTE, ROOM_LINKS, hrefOfRoute, roomFlowOf, roomRouteOf, sameId } from "./room-flow";

const MODES = { overview: OverviewMode, analytics: AnalyticsMode, response: ResponseMode, workflow: WorkflowMode };
const PREFETCH = { overview: prefetchOverview, analytics: prefetchAnalytics, response: prefetchResponses, workflow: prefetchWorkflow };
const COLLAPSE_KEY = "skyforms:room-left-collapsed";
const STEP_WAIT_MS = 1500;
const MODE_WAIT_MS = 700;
const FRESH = 30_000;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

function isTyping(target) {
  return Boolean(target?.isContentEditable) || ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName);
}

function inRoom(target) {
  return !target?.closest || target === document.body || Boolean(target.closest("[data-room]"));
}

function currentHref() {
  return `${window.location.pathname}${window.location.search}`;
}

export default function FormRoom() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams?.toString() ?? "";
  const external = `${pathname}${search ? `?${search}` : ""}`;

  const [route, setRoute] = useState(() => roomRouteOf(pathname, search) ?? EMPTY_ROUTE);
  const [seen, setSeen] = useState(external);
  if (seen !== external) {
    setSeen(external);
    const parsed = roomRouteOf(pathname, search);
    if (parsed && hrefOfRoute(parsed) !== hrefOfRoute(route)) setRoute(parsed.mode === "workflow" ? { ...parsed, formId: route.formId } : parsed);
  }

  const routeRef = useRef(route);
  const returnRef = useRef(null);
  const modeKeysRef = useRef(null);
  const busyRef = useRef(false);
  const toastTimer = useRef(null);
  const keysRef = useRef(null);

  useEffect(() => {
    routeRef.current = route;
  }, [route]);

  const formId = route.formId;
  const formResult = useQuery({ ...formQuery(formId), enabled: Boolean(formId), staleTime: FRESH, placeholderData: keepPreviousData });
  const payload = formResult.data?.data ?? null;
  const form = sameId(payload?.id, formId) ? payload : null;
  const shell = form ?? payload;

  const workflowId = route.mode === "workflow" ? route.workflowId : shell?.workflow?.id ?? null;
  const workflowResult = useQuery({ ...workflowQuery(workflowId), enabled: Boolean(workflowId), retry: false, staleTime: 60_000 });
  const workflow = workflowResult.data?.data ?? workflowResult.data ?? null;
  const flow = useMemo(() => roomFlowOf(workflow, formId), [workflow, formId]);
  if (route.mode === "workflow" && !route.formId && flow?.start?.formId) setRoute({ ...route, formId: flow.start.formId });

  const stepIds = useMemo(() => flow?.order ?? [], [flow]);
  const stepMetricResults = useQueries({ queries: stepIds.map((id) => ({ ...formMetricsQuery(id), staleTime: 60_000 })) });
  const stepMetrics = {};
  stepIds.forEach((id, index) => {
    const metrics = stepMetricResults[index]?.data?.data;
    if (metrics) stepMetrics[id] = metrics;
  });

  const phone = useMediaQuery("(max-width: 767px)");
  const leftWide = useMediaQuery("(min-width: 1536px)");
  const rightDocked = useMediaQuery("(min-width: 1280px)");
  const [leftCollapsed, setLeftCollapsed] = useState(readCollapsed);
  const [sheet, setSheet] = useState(null);
  const [palette, setPalette] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [toastState, setToastState] = useState(null);
  const [devices, setDevices] = useState({});
  const [store, setStore] = useState({});
  const [centerWidth, setCenterWidth] = useState(0);
  const [observer] = useState(() => (typeof ResizeObserver === "undefined" ? null : new ResizeObserver((entries) => {
    const target = entries[entries.length - 1]?.target;
    if (target) setCenterWidth(target.clientWidth);
  })));

  const centerRef = useCallback((node) => {
    if (!observer) return;
    observer.disconnect();
    if (node) observer.observe(node);
  }, [observer]);

  useEffect(() => () => {
    observer?.disconnect();
    clearTimeout(toastTimer.current);
  }, [observer]);

  const setStoreValue = useCallback((key, next, initial) => {
    setStore((current) => {
      const base = Object.prototype.hasOwnProperty.call(current, key) ? current[key] : initial;
      const value = typeof next === "function" ? next(base) : next;
      return Object.is(value, current[key]) ? current : { ...current, [key]: value };
    });
  }, []);

  const toast = useCallback((text, tone = null) => {
    clearTimeout(toastTimer.current);
    setToastState({ id: Date.now(), text, tone });
    toastTimer.current = setTimeout(() => setToastState(null), 2600);
  }, []);

  const setCollapsed = (value) => {
    setLeftCollapsed(value);
    try {
      window.localStorage.setItem(COLLAPSE_KEY, value ? "1" : "0");
    } catch {}
  };

  const role = Number(shell?.userRole ?? 0);
  const canView = role >= 1;
  const canEdit = role >= 2;
  const editAllowed = route.mode === "workflow" && typeof workflow?.canEdit === "boolean" ? workflow.canEdit : canEdit;
  const disabledModes = [...(editAllowed ? [] : ["edit"]), ...(canView ? [] : ["analytics", "response"])];
  const settings = effectiveFormSettings(shell);
  const lastResp = useMemo(() => store.lastResp ?? {}, [store.lastResp]);

  const go = useCallback((patch, { replace = false, transition = "none", ms = 180 } = {}) => {
    const next = { ...routeRef.current, ...patch };
    const href = hrefOfRoute(next);
    const apply = () => {
      routeRef.current = next;
      setRoute(next);
      setSheet(null);
      if (href && href !== currentHref()) window.history[replace ? "replaceState" : "pushState"](null, "", href);
    };
    if (transition === "swap") return swapView(() => apply(), { duration: ms });
    apply();
    return Promise.resolve();
  }, []);

  const slideTo = useCallback(async (direction, apply, prefetch = null) => {
    if (busyRef.current) return;
    busyRef.current = true;
    const animate = !prefersReducedMotion();
    const column = document.querySelector("[data-room] [data-room-column]");
    const ready = prefetch ? Promise.race([Promise.resolve(prefetch()).catch(() => {}), wait(STEP_WAIT_MS)]) : null;
    const leaving = animate && column
      ? column.animate(
        [{ transform: "none", opacity: 1 }, { transform: `translate(${-direction.x * SLIDE_PX}px, ${-direction.y * SLIDE_PX}px)`, opacity: 0 }],
        { duration: SLIDE_OUT_MS, easing: SLIDE_OUT_EASING, fill: "forwards" },
      )
      : null;
    await Promise.all([leaving ? leaving.finished.catch(() => {}) : null, ready]);
    flushSync(apply);
    leaving?.cancel();
    if (animate) {
      document.querySelector("[data-room] [data-room-column]")?.animate(
        [{ transform: `translate(${direction.x * SLIDE_PX}px, ${direction.y * SLIDE_PX}px)`, opacity: 0 }, { transform: "none", opacity: 1 }],
        { duration: SLIDE_IN_MS, easing: SLIDE_IN_EASING },
      );
    }
    busyRef.current = false;
  }, []);

  const prefetchRoute = useCallback((next) => {
    const extra = PREFETCH[next.mode];
    return Promise.all([
      next.formId ? queryClient.prefetchQuery({ ...formQuery(next.formId), staleTime: FRESH }) : null,
      extra ? extra(queryClient, next) : null,
    ]).catch(() => {});
  }, [queryClient]);

  const pickStep = useCallback((targetFormId) => {
    const current = routeRef.current;
    setSheet(null);
    if (!flow || !targetFormId || sameId(targetFormId, current.formId)) return Promise.resolve();
    const patch = { formId: targetFormId, responseId: current.mode === "response" ? lastResp[targetFormId] ?? null : null, attempt: false, focus: null, status: null };
    const direction = slideDirection(flow.stages, flow.nodeOfForm(current.formId)?.formId ?? current.formId, targetFormId);
    return slideTo(direction, () => go(patch), () => prefetchRoute({ ...current, ...patch }));
  }, [flow, go, slideTo, prefetchRoute, lastResp]);

  const stepBy = (delta) => {
    if (!flow) return;
    const index = flow.order.findIndex((id) => sameId(id, routeRef.current.formId));
    const next = flow.order[index + delta];
    if (index >= 0 && next) pickStep(next);
  };

  const enterJourney = async () => {
    if (!flow) return;
    const current = routeRef.current;
    returnRef.current = current;
    const next = { ...current, mode: "workflow", workflowId: flow.id, step: flow.nodeOfForm(current.formId)?.nodeKey ?? null, responseId: null, attempt: false, focus: null, status: null };
    await Promise.race([prefetchRoute(next), wait(MODE_WAIT_MS)]);
    go(next, { transition: "swap", ms: 200 });
  };

  const leaveJourney = async (mode = null, targetFormId = null, patch = {}) => {
    const current = routeRef.current;
    const back = returnRef.current;
    returnRef.current = null;
    const formTarget = targetFormId ?? flow?.nodeOf(current.step)?.formId ?? back?.formId ?? current.formId ?? flow?.start?.formId;
    if (!formTarget) return;
    const nextMode = mode ?? back?.mode ?? "overview";
    const responseId = nextMode === "response"
      ? (back?.mode === "response" && sameId(back.formId, formTarget) ? back.responseId : lastResp[formTarget] ?? null)
      : null;
    const next = { ...current, mode: nextMode, formId: formTarget, responseId, attempt: false, step: null, focus: null, status: null, ...patch };
    await Promise.race([prefetchRoute(next), wait(MODE_WAIT_MS)]);
    go(next, { transition: "swap", ms: 200 });
  };

  const switchMode = async (mode, patch = {}) => {
    const current = routeRef.current;
    setSheet(null);
    if (mode === "edit") {
      if (!editAllowed) return;
      if (current.mode === "workflow") {
        const target = flow?.nodeOf(current.step) ?? flow?.start;
        router.push(target ? `/admin/forms/${target.formId}/edit?view=map` : workflowEditHref({ id: current.workflowId }));
      } else router.push(`/admin/forms/${current.formId}/edit`);
      return;
    }
    if (mode === "workflow") {
      if (current.mode === "workflow") leaveJourney();
      else enterJourney();
      return;
    }
    if (current.mode === "workflow") {
      leaveJourney(mode, null, patch);
      return;
    }
    if (disabledModes.includes(mode)) return;
    if (mode === current.mode) {
      if (Object.keys(patch).length) go(patch);
      return;
    }
    const next = { ...current, mode, responseId: mode === "response" ? lastResp[current.formId] ?? null : null, attempt: false, focus: null, status: null, ...patch };
    await Promise.race([prefetchRoute(next), wait(MODE_WAIT_MS)]);
    captureCanvasAnchor();
    go(next, { transition: "swap" });
  };

  useEffect(() => {
    keysRef.current = (event) => {
      if (event.defaultPrevented || !inRoom(event.target)) return;
      const typing = isTyping(event.target);
      const modifier = event.ctrlKey || event.metaKey;
      const key = event.key.toLocaleLowerCase("tr-TR");

      if (modifier && key === "k") {
        event.preventDefault();
        setPalette((open) => !open);
        return;
      }
      if (palette || shareOpen) return;
      if (event.key === "Escape" && sheet && !typing) {
        setSheet(null);
        return;
      }
      if (modeKeysRef.current?.(event, { typing, modifier, key })) return;
      if (typing) {
        if (event.key === "Escape") event.target.blur();
        return;
      }
      if (modifier || event.altKey) return;

      if (key === "d") switchMode("edit");
      else if (key === "o" || key === "ö") switchMode("overview");
      else if (key === "a") switchMode("analytics");
      else if (key === "c" || key === "ç") switchMode("response");
      else if (key === "m" && flow) switchMode("workflow");
      else if ((event.key === "ArrowLeft" || event.key === "ArrowRight") && flow && route.mode !== "workflow") {
        event.preventDefault();
        stepBy(event.key === "ArrowLeft" ? -1 : 1);
      }
    };
  });

  useEffect(() => {
    const onKey = (event) => keysRef.current?.(event);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (route.mode === "workflow" ? !workflowResult.data : !formResult.data) {
    const error = route.mode === "workflow" ? workflowResult.error : formResult.error;
    if (error) {
      return (
        <div className="flex h-[calc(100dvh-57px)] flex-col md:h-[calc(100dvh-3.5rem)]">
          {route.mode === "workflow"
            ? <StateCard title="Akış yüklenemedi" Icon={FileXCorner} description="Akış silinmiş olabilir ya da görüntüleme yetkiniz yok." />
            : <FormStatusHandler isLoading={false} error={error} data={null} renderForm={() => null} />}
        </div>
      );
    }
    return <RoomSkeleton />;
  }

  const leftDocked = leftWide && !leftCollapsed;
  const device = devices[formId] ?? "desktop";
  const cardNarrow = !phone && centerWidth > 0 && centerWidth - 58 < 560;
  const cardPhone = phone || device === "phone" || cardNarrow;
  const cardWidth = !phone && device === "phone" ? CARD_WIDTH.phone : CARD_WIDTH.desktop;
  const compactBar = phone || (centerWidth > 0 && centerWidth < 640);
  const node = flow?.nodeOfForm(formId) ?? null;
  const depth = node ? flow.stages.depths.get(node.nodeKey) ?? null : null;
  const title = form?.title ?? node?.formTitle ?? shell?.title ?? "";
  const stepInfo = node ? { flowName: flow.name, stage: depth, total: flow.stages.total } : null;
  const setDevice = (value) => setDevices((current) => ({ ...current, [formId]: value }));

  const openPalette = () => { setSheet(null); setPalette(true); };
  const openShare = () => { setSheet(null); setShareOpen(true); };

  const room = {
    route, go, switchMode, pickStep, slideTo, enterJourney, leaveJourney, prefetchRoute,
    formId, form, shell, formResult, workflowId, workflow, workflowResult, flow, node, depth, title, stepInfo, stepMetrics,
    role, canView, canEdit, disabledModes, settings,
    phone, leftWide, rightDocked, stacked: !rightDocked, leftDocked, centerWidth, compactBar, cardPhone, cardWidth, device, setDevice,
    sheet, setSheet, toast, openPalette, openShare, setCollapsed,
    store, setStoreValue, modeKeysRef,
    frameProps: {
      centerRef, leftDocked, rightDocked, sheet, toast: toastState, onCloseSheet: () => setSheet(null),
      overlays: (
        <AnimatePresence>
          {palette ? (
            <StudioPalette key="palette" root="[data-room]" links={ROOM_LINKS}
              current={{
                workflowId: flow?.id,
                workflowName: flow?.name,
                activeFormId: formId,
                steps: flow
                  ? flow.stages.ordered.map((item) => ({ formId: item.formId, title: item.formTitle, meta: `${flow.stages.depths.get(item.nodeKey) ?? "?"}. adım` }))
                  : formId ? [{ formId, title, meta: "açık" }] : [],
              }}
              onPickStep={(id) => {
                setPalette(false);
                if (route.mode === "workflow") leaveJourney(null, id);
                else pickStep(id);
              }}
              onNavigate={(href) => { setPalette(false); router.push(href); }}
              onClose={() => setPalette(false)}
            />
          ) : null}
        </AnimatePresence>
      ),
    },
    outlineHead: (where, { label = null } = {}) => (
      <OutlineHeader title={label ?? (flow ? flow.name : title || "Adsız form")} untitled={!label && !flow && !title} inFlow={Boolean(flow)} onOpenPalette={openPalette}
        onCollapse={where === "dock" ? () => setCollapsed(true) : () => setSheet(null)}
      />
    ),
    steps: (countOf, options = {}) => (flow ? (
      <RoomSteps flow={flow} activeFormId={formId} countOf={countOf} keysHint={options.keysHint ?? true}
        onPick={options.onPick ?? ((id) => pickStep(id))} onFlow={() => switchMode("workflow")}
      />
    ) : null),
    leftButton: (label, Icon, buttonTitle) => (leftDocked ? null : {
      label, Icon, title: buttonTitle,
      onClick: () => (leftWide ? setCollapsed(false) : setSheet("left")),
    }),
    rightButton: (label, Icon, buttonTitle) => (rightDocked ? null : { label, Icon, title: buttonTitle, onClick: () => setSheet("right") }),
    toolbar: ({ left = null, right = null, bar = null } = {}) => (
      <RoomToolbar mode={route.mode} onMode={switchMode} disabledModes={disabledModes} inFlow={Boolean(flow)} left={left} right={right} bar={bar}
        compact={compactBar} hideEdit={phone}
      />
    ),
    cardTop: ({ right } = {}) => (
      <CardTop
        row1={<TitleRow title={title} depth={depth} isStart={Boolean(node?.isStart)} timeLimitMinutes={form?.timeLimitMinutes}
          right={right !== undefined ? right : phone ? null : <DeviceToggle device={device} onChange={setDevice} />}
        />}
        row2={flow ? <FlowChips flow={flow} activeFormId={formId} onPick={(id) => pickStep(id)} /> : null}
      />
    ),
  };

  const Mode = MODES[route.mode] ?? OverviewMode;

  return (
    <RoomContext.Provider value={room}>
      <Mode key={route.mode} />
      {formId ? (
        <FormShareDialog open={shareOpen} onClose={() => setShareOpen(false)} formId={formId} formTitle={title}
          formStatus={settings.isOpen ? 2 : 1} allowAnonymous={settings.allowAnonymousResponses} canEdit={canEdit}
        />
      ) : null}
    </RoomContext.Provider>
  );
}
