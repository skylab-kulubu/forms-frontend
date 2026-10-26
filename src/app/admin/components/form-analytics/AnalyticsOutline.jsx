"use client";

import { useMemo } from "react";
import { Activity } from "lucide-react";
import { fieldLabel, questionNumbers } from "../form-studio/studio-schema";
import { askedCount, formatPercent, percentOf } from "../form-overview/overview-stats";
import { PARTICIPATION } from "./AnalyticsCard";

export default function AnalyticsOutline({ form, analytics, participation = null, openIds, focus, touch = false, onRow }) {
  const schema = form?.schema;
  const fields = useMemo(() => (Array.isArray(schema) ? schema : []), [schema]);
  const numbers = useMemo(() => questionNumbers(fields), [fields]);
  const byId = useMemo(() => new Map((analytics?.questions ?? []).map((q) => [q.questionId, q])), [analytics]);
  const total = analytics?.totalResponses ?? 0;
  const delivered = participation && participation.opened > 0 ? (participation.submitted / participation.opened) * 100 : 0;

  const rateOf = (field, q) => {
    const asked = askedCount(field, fields, byId, total);
    return percentOf(q?.answeredCount ?? 0, asked != null && asked >= (q?.answeredCount ?? 0) ? asked : total);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 px-3 pb-1 pt-3">
        <span className="text-2xs font-medium text-neutral-500">Cevaplanma oranı</span>
        <span className="h-px flex-1 bg-white/5" />
        {analytics ? <span className="text-3xs tabular-nums text-neutral-600">{total} cevap</span> : null}
      </div>
      <p className="shrink-0 px-3 pb-1.5 text-3xs text-neutral-600">{touch ? "Soruya gitmek için dokunun" : "Açıp kapatmak için sorulara tıklayın"}</p>
      <div className="min-h-0 flex-1 overflow-y-auto px-1.5 pb-2 scrollbar">
        {participation ? (
          <button type="button" onClick={() => onRow(PARTICIPATION)} aria-pressed={focus === PARTICIPATION}
            className={`mb-1 w-full rounded-lg px-2.5 py-2 text-left transition-colors ${focus === PARTICIPATION ? "bg-skylab-500/10" : "hover:bg-white/5"}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <Activity size={11} className="shrink-0 text-neutral-500" />
                <span className="truncate text-2xs text-neutral-200">Katılım ve süre</span>
              </span>
              <span className="shrink-0 text-3xs tabular-nums text-neutral-500">{formatPercent(Math.round(delivered))} teslim</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-skylab-500 transition-[width] duration-500" style={{ width: `${Math.min(100, delivered)}%` }} />
            </div>
          </button>
        ) : null}
        {!analytics ? (
          <div className="space-y-2 px-2.5 py-2">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="space-y-1.5 py-1">
                <span className="shimmer block h-2.5 w-32 rounded-md" />
                <span className="shimmer block h-1.5 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : null}
        {analytics && fields.length === 0 ? <p className="px-2 py-3 text-2xs text-neutral-600">Henüz soru yok.</p> : null}
        {analytics ? fields.map((field) => {
          if (field.type === "separator") {
            return (
              <div key={field.id} className="flex items-start gap-2 px-2 pb-1 pt-3">
                <span className="w-4 shrink-0" />
                <span className="min-w-0 truncate text-2xs font-medium text-neutral-500">{fieldLabel(field)}</span>
                <span className="mt-2 h-px flex-1 bg-white/5" />
              </div>
            );
          }

          const q = byId.get(field.id);
          const aggregatable = Boolean(q?.aggregatable);
          const open = openIds.includes(field.id);
          const rate = rateOf(field, q);
          const body = (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="w-5 shrink-0 text-3xs tabular-nums text-neutral-600">S{numbers.get(field.id)}</span>
                  <span className={`truncate text-2xs ${!aggregatable ? "text-neutral-400" : open ? "text-neutral-50" : "text-neutral-200"}`}>
                    {field.props?.question ? fieldLabel(field) : <span className="text-neutral-600">Soru metni yok</span>}
                  </span>
                </span>
                <span className="shrink-0 text-3xs tabular-nums text-neutral-500">{formatPercent(rate)}</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className={`h-full rounded-full transition-[width] duration-500 ${!aggregatable ? "bg-neutral-600" : open ? "bg-skylab-400" : "bg-skylab-500"}`} style={{ width: `${Math.min(100, rate)}%` }} />
              </div>
            </>
          );

          return aggregatable ? (
            <button key={field.id} type="button" onClick={() => onRow(field.id)} aria-pressed={open}
              className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${open ? "bg-skylab-500/10" : "hover:bg-white/5"} ${focus === field.id ? "ring-1 ring-skylab-400/30" : ""}`}
            >
              {body}
            </button>
          ) : (
            <div key={field.id} title="Metin, bağlantı, dosya ve tekrarlanan grup soruları analiz edilmez" className="rounded-lg px-2.5 py-2 opacity-60">{body}</div>
          );
        }) : null}
      </div>
    </div>
  );
}
