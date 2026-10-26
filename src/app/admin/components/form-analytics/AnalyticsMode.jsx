"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, ListTree, ListX, PanelRight, RefreshCw } from "lucide-react";
import StateCard from "@/app/components/StateCard";
import { attemptAnalyticsQuery } from "@/lib/hooks/useResponse";
import { formAnalyticsQuery, formMetricsQuery, formQuery } from "@/lib/hooks/useFormAdmin";
import { questionNumbers } from "../form-studio/studio-schema";
import RoomFrame from "../form-room/RoomFrame";
import RoomCanvas from "../form-room/RoomCanvas";
import RoomHeader, { HeaderIcon, HeaderTouch } from "../form-room/RoomHeader";
import { OutlineFooter } from "../form-room/RoomOutline";
import { CardSkeleton } from "../form-room/RoomSkeleton";
import { useRoom, useRoomKeys, useRoomState } from "../form-room/room-context";
import AnalyticsCard, { PARTICIPATION } from "./AnalyticsCard";
import AnalyticsOutline from "./AnalyticsOutline";
import AnalyticsPanel from "./AnalyticsPanel";
import { Crumbs } from "../form-room/RoomParts";

const FRESH = 30_000;
const EMPTY = {};
const OPEN_LIMIT = 12;
const OPEN_FIRST = 8;

export function prefetchAnalytics(queryClient, route) {
  if (!route.formId) return Promise.resolve();
  const cached = queryClient.getQueryData(formQuery(route.formId).queryKey)?.data;
  return Promise.all([
    queryClient.prefetchQuery({ ...formAnalyticsQuery(route.formId), staleTime: FRESH }),
    queryClient.prefetchQuery({ ...formMetricsQuery(route.formId), staleTime: FRESH }),
    Number(cached?.timeLimitMinutes) > 0 ? queryClient.prefetchQuery({ ...attemptAnalyticsQuery(route.formId), staleTime: FRESH }) : null,
  ]);
}

function scrollToQuestion(questionId, { delay = 0, block = "center" } = {}) {
  setTimeout(() => {
    const canvas = document.querySelector("[data-room] [data-room-canvas]");
    const target = canvas?.querySelector(`[data-q="${CSS.escape(questionId)}"]`);
    if (!canvas || !target) return;
    const offset = target.getBoundingClientRect().top - canvas.getBoundingClientRect().top + canvas.scrollTop;
    const top = block === "start" ? offset - 16 : offset - (canvas.clientHeight - target.offsetHeight) / 2;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    canvas.scrollTo({ top: Math.max(0, top), behavior: smooth ? "smooth" : "auto" });
  }, delay);
}

export default function AnalyticsMode() {
  const room = useRoom();
  const queryClient = useQueryClient();
  const { formId, form, shell, flow, phone, route } = room;

  const timed = Number(form?.timeLimitMinutes) > 0;
  const analyticsResult = useQuery({ ...formAnalyticsQuery(formId), enabled: Boolean(formId), staleTime: FRESH });
  const analytics = analyticsResult.data?.data ?? null;
  const metrics = useQuery({ ...formMetricsQuery(formId), enabled: Boolean(formId), staleTime: FRESH }).data?.data ?? null;
  const attemptsResult = useQuery({ ...attemptAnalyticsQuery(formId), enabled: Boolean(formId) && timed, staleTime: FRESH });
  const participation = timed ? attemptsResult.data?.data ?? null : null;

  const [openMap, setOpenMap] = useRoomState("analytics.openIds", EMPTY);
  const [focusMap, setFocusMap] = useRoomState("analytics.focus", EMPTY);
  const [viewMap, setViewMap] = useRoomState("analytics.views", EMPTY);

  const schema = shell?.schema;
  const fields = useMemo(() => (Array.isArray(schema) ? schema : []), [schema]);
  const numbers = useMemo(() => questionNumbers(fields), [fields]);
  const byId = useMemo(() => new Map((analytics?.questions ?? []).map((q) => [q.questionId, q])), [analytics]);
  const aggregatableIds = useMemo(() => fields.filter((field) => byId.get(field.id)?.aggregatable).map((field) => field.id), [fields, byId]);

  const defaultOpen = useMemo(() => [
    ...(participation ? [PARTICIPATION] : []),
    ...(aggregatableIds.length > OPEN_LIMIT ? aggregatableIds.slice(0, OPEN_FIRST) : aggregatableIds),
  ], [participation, aggregatableIds]);
  const openIds = openMap[formId] ?? defaultOpen;
  const defaultFocus = participation ? PARTICIPATION : aggregatableIds[0] ?? null;
  const focus = Object.prototype.hasOwnProperty.call(focusMap, formId) ? focusMap[formId] : defaultFocus;
  const viewOf = (questionId) => viewMap[`${formId}:${questionId}`] ?? "bar";

  const setOpen = (update) => setOpenMap((map) => ({ ...map, [formId]: update(map[formId] ?? defaultOpen) }));
  const toggle = (questionId) => setOpen((ids) => (ids.includes(questionId) ? ids.filter((id) => id !== questionId) : [...ids, questionId]));
  const setFocus = (questionId) => setFocusMap((map) => ({ ...map, [formId]: questionId }));
  const focusQuestion = (questionId) => {
    setFocus(questionId);
    if (questionId !== PARTICIPATION && byId.get(questionId)?.aggregatable) setOpen((ids) => (ids.includes(questionId) ? ids : [...ids, questionId]));
  };

  const pickRow = (questionId) => {
    const wasOpen = Boolean(room.sheet);
    room.setSheet(null);
    if (phone) {
      if (questionId !== PARTICIPATION && !openIds.includes(questionId)) toggle(questionId);
      setFocus(questionId);
      scrollToQuestion(questionId, { delay: 280, block: "start" });
      return;
    }
    if (questionId !== PARTICIPATION) toggle(questionId);
    setFocus(questionId);
    scrollToQuestion(questionId, { delay: wasOpen ? 280 : 60 });
  };

  const consumeRef = useRef(null);
  const pendingFocus = route.focus;
  const ready = Boolean(analytics);

  useEffect(() => {
    consumeRef.current = (questionId) => {
      focusQuestion(questionId);
      room.go({ focus: null }, { replace: true });
      scrollToQuestion(questionId, { delay: 120 });
    };
  });

  useEffect(() => {
    if (pendingFocus && ready) consumeRef.current?.(pendingFocus);
  }, [pendingFocus, ready]);

  useRoomKeys((event, info) => {
    if (info.typing || info.modifier || event.altKey) return false;
    if (event.key === "Escape" && focus) {
      setFocus(null);
      return true;
    }
    return false;
  });

  const refresh = () => {
    [["form", formId], ["form-analytics", formId], ["form-metrics", formId], ["attempt-analytics", formId]]
      .forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    room.toast("Yenilendi");
  };

  const questionCount = fields.filter((field) => field.type !== "separator").length;
  const conditionCount = fields.filter((field) => field.condition?.fieldId).length;
  const openCount = openIds.filter((id) => id !== PARTICIPATION && byId.get(id)?.aggregatable).length;
  const hint = ["Ö özet", "A analitik", "C cevaplar", flow ? "M akış" : null, flow ? "← → adım" : null].filter(Boolean).join(" · ");
  const focusField = fields.find((field) => field.id === focus);
  const total = analytics?.totalResponses ?? 0;

  const outline = (where) => (
    <>
      {room.outlineHead(where)}
      {room.steps((node) => {
        const count = room.stepMetrics[node.formId]?.totalResponses;
        return count == null ? null : { text: count };
      })}
      <AnalyticsOutline form={shell} analytics={analytics} participation={participation} openIds={openIds} focus={focus} touch={phone} onRow={pickRow} />
      <OutlineFooter hint={hint}>{questionCount} soru · {conditionCount} koşullu</OutlineFooter>
    </>
  );

  const inspectorHeader = (
    <Crumbs items={[
      { label: "Analitik", onClick: focus ? () => setFocus(null) : undefined },
      ...(focus === PARTICIPATION && participation ? [{ label: "Katılım ve süre" }] : focusField ? [{ label: `${numbers.get(focusField.id)}. soru` }] : []),
    ]} />
  );

  const inspector = shell ? (
    <AnalyticsPanel form={form ?? shell} analytics={analytics} participation={participation} focus={focus} view={focus ? viewOf(focus) : "bar"}
      onView={(value) => setViewMap((map) => ({ ...map, [`${formId}:${focus}`]: value }))} onClear={() => setFocus(null)}
    />
  ) : null;

  const card = analyticsResult.isError ? (
    <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-10">
      <StateCard title="Analitik yüklenemedi" Icon={ListX} description="Analiz verileri yüklenirken bir hata oluştu." />
    </div>
  ) : form && analytics ? (
    <AnalyticsCard form={form} analytics={analytics} participation={participation} metrics={metrics} stepInfo={room.stepInfo} phone={room.cardPhone} touch={phone}
      openIds={openIds} focus={focus} viewOf={viewOf} onFocus={focusQuestion} onToggle={toggle} onRead={() => room.switchMode("response")}
    />
  ) : <CardSkeleton />;

  const center = (
    <RoomCanvas key={formId} width={room.centerWidth} cardWidth={room.cardWidth}
      top={room.cardTop({ right: analytics ? <span className="text-2xs tabular-nums text-neutral-500">{total} cevap · {openCount} soru açık</span> : null })}
      card={card}
    />
  );

  return (
    <>
      <RoomHeader
        desktop={(
          <>
            <HeaderIcon icon={RefreshCw} label="Yenile" onClick={refresh} />
            <HeaderIcon icon={Download} label="İndir" disabled />
          </>
        )}
        mobile={<HeaderTouch icon={RefreshCw} label="Yenile" onClick={refresh} />}
      />
      <RoomFrame {...room.frameProps} outline={outline} center={center}
        toolbar={room.toolbar({
          left: room.leftButton("Sorular", ListTree, "Cevaplanma oranı"),
          right: room.rightButton("Ayrıntı", PanelRight, "Seçili sorunun ayrıntısı"),
        })}
        inspectorHeader={inspectorHeader} inspector={inspector}
      />
    </>
  );
}
