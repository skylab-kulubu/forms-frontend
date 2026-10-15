"use client";

import { Flag } from "lucide-react";
import { FilePreview } from "./FilePreview";
import { RichText } from "@/app/components/rich-text/RichText";

const PLAIN_TYPES = new Set(["file", "matrix", "repeater"]);

const formatAnswer = (answer) => {
  if (answer == null) return "";
  if (Array.isArray(answer)) {
    return answer.map((item) => (item == null ? "" : String(item).trim())).filter(Boolean).join(", ");
  }

  if (typeof answer === "object" && answer !== null) {
    return Object.entries(answer).map(([key, value]) => `${key}: ${value}`).join("\n");
  }

  return String(answer).trim();
};

function RevisionMarker({ requested, flag }) {
  if (flag) {
    return (
      <button type="button" onClick={flag.onToggle} aria-pressed={flag.selected} title={flag.selected ? "İşareti kaldır" : "Düzeltilecek olarak işaretle"}
        className={`flex h-6 shrink-0 items-center gap-1 rounded-md border px-2 text-3xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${flag.selected ? "border-sky-400/40 bg-sky-400/15 text-sky-200" : "border-white/10 text-neutral-500 hover:border-sky-400/30 hover:text-sky-200"}`}
      >
        <Flag size={11} />
        {flag.selected ? "İşaretli" : "İşaretle"}
      </button>
    );
  }

  if (!requested) return null;

  return (
    <span className="flex h-6 shrink-0 items-center gap-1 text-3xs font-medium text-sky-300/80" title="Bu soruda düzeltme istendi">
      <Flag size={11} />
      İstendi
    </span>
  );
}

/**
 * @param changed  Önceki gönderimden farklıysa önceki cevap `before` ile altında gösterilir.
 * @param flag     Düzeltme isterken soru işaretleme: { selected, onToggle }.
 */
export function ResponseListItem({ questionNumber, question, answer, type, responseId = null, token = null, className = "", changed = false, before = null, beforeLabel = null, requested = false, flag = null }) {
  const hasNumber = Number.isFinite(Number(questionNumber));
  const questionText = typeof question === "string" ? question.trim() : "";

  let parsedMatrix = null;
  if (type === "matrix" && answer) {
    try {
      parsedMatrix = typeof answer === "string" ? JSON.parse(answer) : answer;
    } catch (e) {
      console.error("Matris verisi çözülemedi:", e);
    }
  }

  let parsedGroup = null;
  if (type === "repeater" && answer) {
    try {
      parsedGroup = typeof answer === "string" ? JSON.parse(answer) : answer;
    } catch (e) {
      console.error("Grup verisi çözülemedi:", e);
    }
  }
  const groupRows = Array.isArray(parsedGroup) ? parsedGroup : null;
  const groupColumns = groupRows && groupRows.length > 0 ? Object.keys(groupRows[0] ?? {}) : [];

  const answerText = formatAnswer(answer);
  const hasAnswer = parsedMatrix
    ? Object.keys(parsedMatrix).length > 0
    : type === "repeater"
      ? groupColumns.length > 0
      : answerText.length > 0;

  const beforeText = formatAnswer(before);
  const accent = changed || flag?.selected
    ? "relative before:absolute before:-left-3 before:top-5 before:bottom-5 first:before:top-0 last:before:bottom-0 before:w-0.5 before:rounded-full before:bg-sky-400/50"
    : "";

  return (
    <li className={`py-5 first:pt-0 last:pb-0 ${accent} ${className}`}>
      <div className="flex gap-3">
        {hasNumber && (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-300">
            {questionNumber}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-neutral-100 wrap-break-word">
            {questionText ? <RichText text={questionText} /> : <span className="font-normal italic text-neutral-500">Bu soru için metin yok</span>}
          </p>
        </div>
        <RevisionMarker requested={requested} flag={flag} />
      </div>

      <div className="mt-3 pl-9">
        <p className="mb-1.5 flex items-center gap-1.5 text-3xs font-medium text-neutral-500">
          Cevap{type === "repeater" && groupRows && groupRows.length > 0 ? ` · ${groupRows.length} kayıt` : ""}
          {changed && <span className="rounded-full border border-sky-400/30 bg-sky-400/10 px-1.5 leading-4 text-sky-200">değişti</span>}
        </p>

        {type === "file" && answerText ? (
          <FilePreview mediaId={answerText} responseId={responseId} token={token} />
        ) : type === "repeater" && groupColumns.length > 0 ? (
          <div className="flex flex-col gap-2">
            {groupRows.map((row, ri) => (
              <div key={ri} className="overflow-hidden rounded-lg border border-white/10 bg-white/3">
                <div className="border-b border-white/5 px-3 py-1.5">
                  <span className="text-3xs font-medium text-neutral-500">{ri + 1}. kayıt</span>
                </div>
                <div className="divide-y divide-white/5">
                  {groupColumns.map((col, ci) => {
                    const cell = row?.[col];
                    const text = cell == null ? "" : String(cell).trim();
                    return (
                      <div key={ci} className="flex gap-3 px-3 py-2">
                        <span className="w-28 shrink-0 text-xs font-medium text-neutral-400 wrap-break-word">{col}</span>
                        <span className={`min-w-0 flex-1 text-sm wrap-break-word whitespace-pre-wrap ${text ? "text-neutral-100" : "italic text-neutral-600"}`}>
                          {text || "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : parsedMatrix && typeof parsedMatrix === "object" ? (
          <div className="overflow-hidden rounded-lg border border-white/10 bg-white/3">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-white/5">
                {Object.entries(parsedMatrix).map(([rowLabel, colLabel], idx) => (
                  <tr key={idx}>
                    <td className="w-1/2 border-r border-white/5 px-3 py-2 font-medium text-neutral-300">
                      {rowLabel}
                    </td>
                    <td className="px-3 py-2 font-medium text-skylab-300">
                      {colLabel}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className={`text-sm wrap-break-word whitespace-pre-wrap ${hasAnswer ? "text-neutral-100" : "italic text-neutral-500"}`}>
            {hasAnswer ? answerText : "Cevap yok"}
          </p>
        )}

        {changed && (
          <div className="relative mt-3 pl-3 before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:rounded-full before:bg-neutral-700">
            <p className="text-3xs text-neutral-500">{beforeLabel ?? "Önceki gönderimde"}</p>
            <p className="mt-0.5 whitespace-pre-wrap text-xs leading-relaxed text-neutral-400 wrap-break-word">
              {PLAIN_TYPES.has(type) ? "Farklı bir cevap vardı." : beforeText || "Cevap yok"}
            </p>
          </div>
        )}
      </div>
    </li>
  );
}

export function ResponseHeaderSkeleton() {
  return (
    <div className="flex items-center gap-2 px-1 lg:h-7">
      <div className="shimmer h-3.5 w-24 rounded-md" />
      <span className="h-px flex-1 bg-white/5" />
      <div className="shimmer h-3 w-16 rounded-md" />
    </div>
  );
}

export function ResponseListSkeleton({ rows = 4 }) {
  return (
    <ul className="mx-auto w-full max-w-2xl divide-y divide-white/5">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="py-5 first:pt-0 last:pb-0">
          <div className="flex gap-3">
            <div className="shimmer h-6 w-6 shrink-0 rounded-md" />
            <div className="flex-1">
              <div className="shimmer h-3 w-40 rounded-md" />
            </div>
          </div>
          <div className="mt-3 space-y-2 pl-9">
            <div className="shimmer h-2.5 w-14 rounded-md" />
            <div className="shimmer h-3 w-3/4 rounded-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}
