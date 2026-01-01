"use client";

const formatAnswer = (answer) => {
  if (answer == null) return "";
  if (Array.isArray(answer)) {
    return answer
      .map((item) => (item == null ? "" : String(item).trim()))
      .filter(Boolean)
      .join(", ");
  }
  return String(answer).trim();
};

export function ResponseListItem({ questionNumber, question, answer, className = "" }) {
  const hasNumber = Number.isFinite(Number(questionNumber));
  const questionText = typeof question === "string" && question.trim().length > 0 ? question.trim() : "Soru";
  const answerText = formatAnswer(answer);
  const hasAnswer = answerText.length > 0;

  return (
    <li className={`border-b border-white/10 last:border-b-0 bg-neutral-900/40 px-4 py-3 shadow-sm ${className}`}>
      <div className="flex items-start gap-3">
        {hasNumber && (
          <div className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-200">
            {questionNumber}
          </div>
        )}
        <div className="flex-1">
          <p className="mt-1 text-sm font-medium text-neutral-100 wrap-break-word">
            {questionText}
          </p>
        </div>
      </div>

      <div className="mt-3 rounded-lg border border-white/10 bg-neutral-950/30 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">Cevap</p>
        <p className={`mt-1 text-sm wrap-break-word whitespace-pre-wrap ${hasAnswer ? "text-neutral-100" : "text-neutral-500 italic"}`}>
          {hasAnswer ? answerText : "Cevap yok"}
        </p>
      </div>
    </li>
  );
}

export function ResponseHeaderSkeleton() {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3">
      <div className="space-y-2">
        <div className="shimmer h-3 w-24 rounded-md" />
        <div className="shimmer h-3 w-40 rounded-md" />
      </div>
      <div className="mt-5">
        <div className="shimmer h-3 w-20 rounded-md" />
      </div>
    </div>
  );
}

export function ResponseListSkeleton({ rows = 4 }) {
  return (
    <ul className="space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="border-b border-white/10 last:border-b-0 bg-neutral-900/40 px-4 py-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="shimmer h-7 w-7 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="shimmer h-3 w-28 rounded-md" />
              <div className="shimmer h-3 w-40 rounded-md" />
            </div>
          </div>
          <div className="mt-3 rounded-lg border border-white/10 bg-neutral-950/30 px-3 py-2">
            <div className="shimmer h-3 w-16 rounded-md" />
            <div className="mt-2 shimmer h-3 w-3/4 rounded-md" />
          </div>
        </li>
      ))}
    </ul>
  );
}