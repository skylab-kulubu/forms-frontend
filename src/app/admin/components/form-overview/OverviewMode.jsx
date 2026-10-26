"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileXCorner, ListTree, PencilLine, RefreshCw, Share2 } from "lucide-react";
import StateCard from "@/app/components/StateCard";
import { StatePill } from "@/app/admin/components/utils/SidePanel";
import { formAnalyticsQuery, formMetricsQuery, formQuery } from "@/lib/hooks/useFormAdmin";
import { attemptAnalyticsQuery } from "@/lib/hooks/useResponse";
import RoomFrame from "../form-room/RoomFrame";
import RoomCanvas from "../form-room/RoomCanvas";
import RoomHeader, { HeaderButton, HeaderIcon, HeaderTouch } from "../form-room/RoomHeader";
import { OutlineFooter } from "../form-room/RoomOutline";
import { CardSkeleton } from "../form-room/RoomSkeleton";
import { useRoom } from "../form-room/room-context";
import { sameId } from "../form-room/room-flow";
import OverviewCard from "./OverviewCard";
import OverviewNext from "./OverviewNext";
import OverviewPanel from "./OverviewPanel";
import OverviewQuestions from "./OverviewQuestions";

const FRESH = 30_000;

export function prefetchOverview(queryClient, route) {
  if (!route.formId) return Promise.resolve();
  return Promise.all([
    queryClient.prefetchQuery({ ...formMetricsQuery(route.formId), staleTime: FRESH }),
    queryClient.prefetchQuery({ ...formAnalyticsQuery(route.formId), staleTime: FRESH }),
  ]);
}

export function scrollCanvasTo(questionId, delay = 0) {
  setTimeout(() => {
    const canvas = document.querySelector("[data-room] [data-room-canvas]");
    const target = canvas?.querySelector(`[data-q="${CSS.escape(questionId)}"]`);
    if (!canvas || !target) return;
    const top = target.getBoundingClientRect().top - canvas.getBoundingClientRect().top + canvas.scrollTop;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    canvas.scrollTo({ top: Math.max(0, top - (canvas.clientHeight - target.offsetHeight) / 2), behavior: smooth ? "smooth" : "auto" });
  }, delay);
}

export default function OverviewMode() {
  const room = useRoom();
  const queryClient = useQueryClient();
  const { formId, form, shell, flow, settings, canView, canEdit, phone, rightDocked } = room;

  const timed = Number(form?.timeLimitMinutes) > 0;
  const metrics = useQuery({ ...formMetricsQuery(formId), enabled: Boolean(formId), staleTime: FRESH }).data?.data ?? null;
  const analytics = useQuery({ ...formAnalyticsQuery(formId), enabled: Boolean(formId), staleTime: FRESH }).data?.data ?? null;
  const attemptsResult = useQuery({ ...attemptAnalyticsQuery(formId), enabled: Boolean(formId) && timed, staleTime: FRESH });
  const attempts = timed ? attemptsResult.data?.data ?? null : null;

  const stepForm = Boolean(shell?.workflow && !shell.workflow.isStart);
  const fields = Array.isArray(shell?.schema) ? shell.schema : [];
  const questionCount = fields.filter((field) => field.type !== "separator").length;
  const conditionCount = fields.filter((field) => field.condition?.fieldId).length;
  const hint = ["Ö özet", "A analitik", "C cevaplar", flow ? "M akış" : null, flow ? "← → adım" : null].filter(Boolean).join(" · ");
  const pill = stepForm ? ["neutral", "Akış adımı"] : settings.isOpen ? ["emerald", "Aktif"] : ["red", "Pasif"];
  const schemaOf = (id) => (sameId(id, formId) ? form?.schema : queryClient.getQueryData(formQuery(id).queryKey)?.data?.schema);

  const refresh = () => {
    [["form", formId], ["form-metrics", formId], ["form-analytics", formId], ["attempt-analytics", formId], ["form-short-link", formId]]
      .forEach((queryKey) => queryClient.invalidateQueries({ queryKey }));
    if (room.workflowId) queryClient.invalidateQueries({ queryKey: ["workflow", room.workflowId] });
    room.toast("Yenilendi");
  };

  const pickQuestion = (questionId) => {
    const wasOpen = Boolean(room.sheet);
    room.setSheet(null);
    scrollCanvasTo(questionId, wasOpen ? 280 : 0);
  };

  const openQuestion = (questionId) => room.switchMode("analytics", { focus: questionId });
  const reviewPending = () => room.switchMode("response", { status: "pending" });

  const outline = (where) => (
    <>
      {room.outlineHead(where)}
      {room.steps((node) => {
        const total = room.stepMetrics[node.formId]?.totalResponses;
        return total == null ? null : { text: total };
      })}
      <OverviewQuestions form={form} analytics={analytics} onPick={pickQuestion} />
      <OutlineFooter hint={hint}>{questionCount} soru · {conditionCount} koşullu</OutlineFooter>
    </>
  );

  const inspectorHeader = (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <span className="min-w-0 truncate text-neutral-200">Özet</span>
      <span className="ml-auto font-normal"><StatePill tone={pill[0]}>{pill[1]}</StatePill></span>
    </div>
  );
  const inspector = shell ? (
    <OverviewPanel form={form ?? shell} flow={flow} metrics={metrics} attempts={attempts} onReview={reviewPending} onShare={room.openShare}
      onFlow={flow ? () => room.switchMode("workflow") : null}
    />
  ) : null;

  const card = form ? (
    <OverviewCard form={form} analytics={analytics} stepInfo={room.stepInfo} phone={room.cardPhone} touch={phone} onOpenQuestion={canView ? openQuestion : null} />
  ) : room.formResult.isError ? (
    <div className="rounded-3xl border border-white/10 bg-[#1a1a1a] p-10">
      <StateCard title="Bu adımın formu açılamadı" Icon={FileXCorner} description="Form silinmiş olabilir ya da görüntüleme yetkiniz yok." />
    </div>
  ) : <CardSkeleton />;

  const center = (
    <RoomCanvas key={formId} width={room.centerWidth} cardWidth={room.cardWidth}
      top={room.cardTop()}
      above={!rightDocked && inspector ? <div className="overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/90">{inspector}</div> : null}
      card={card}
      below={flow?.node && form ? <OverviewNext flow={flow} schemaOf={schemaOf} onPickStep={(id) => room.pickStep(id)} onShowFlow={() => room.switchMode("workflow")} /> : null}
    />
  );

  return (
    <>
      <RoomHeader
        desktop={(
          <>
            <HeaderIcon icon={RefreshCw} label="Yenile" onClick={refresh} />
            <HeaderButton icon={Share2} label="Paylaş" onClick={room.openShare} disabled={!canView} />
          </>
        )}
        mobile={(
          <>
            <HeaderTouch icon={Share2} label="Paylaş" onClick={room.openShare} disabled={!canView} />
            <HeaderTouch icon={PencilLine} label="Düzenle" onClick={() => room.switchMode("edit")} disabled={!canEdit} />
          </>
        )}
      />
      <RoomFrame {...room.frameProps} outline={outline} center={center}
        toolbar={room.toolbar({ left: room.leftButton("Sorular", ListTree, "Sorular ve adımlar") })}
        inspectorHeader={inspectorHeader} inspector={rightDocked ? inspector : null}
      />
    </>
  );
}

