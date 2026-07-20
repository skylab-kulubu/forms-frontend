"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ListX, TextSearch } from "lucide-react";
import StateCard from "@/app/components/StateCard";

const BAR_FILL = "#e0c8e5";
const PIE_COLORS = ["#d8b4fe", "#6366f1", "#c084fc", "#7c3aed", "#9d84f0"];

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
};

const KIND_LABEL = {
  0: "Ayraç", 1: "Metin", 2: "Dosya", 3: "Seçim", 4: "Çoklu seçim",
  5: "Aç/Kapa", 6: "Sayı", 7: "Matris", 8: "Tarih", 9: "Saat",
};

const questionText = (q) => {
  const text = (q.question ?? "").trim();
  return text && text !== q.questionId ? text : "";
};

const formatNumber = (value) => {
  if (value === null || value === undefined) return "--";
  const rounded = Math.round(Number(value) * 100) / 100;
  return Number.isFinite(rounded) ? String(rounded) : "--";
};

const formatPercent = (value) => {
  const pct = Number(value) || 0;
  return `%${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}`;
};

function EmptyNote({ children }) {
  return <p className="py-3 text-center text-3xs text-neutral-600">{children}</p>;
}

function DistributionBars({ buckets }) {
  if (!buckets || buckets.length === 0) return <EmptyNote>Yanıt yok</EmptyNote>;

  return (
    <div className="space-y-3">
      {buckets.map((bucket, i) => {
        const label = bucket.value === "" || bucket.value === null || bucket.value === undefined ? "—" : String(bucket.value);
        const pct = Number(bucket.percentage) || 0;
        return (
          <div key={`${label}-${i}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-2xs text-neutral-300" title={label}>{label}</span>
              <span className="shrink-0 text-2xs tabular-nums text-neutral-500">
                <span className="text-neutral-300">{bucket.count}</span> · {formatPercent(pct)}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div className="h-full rounded-full bg-skylab-500 transition-[width] duration-500 ease-out" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SliceTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const slice = payload[0].payload;
  return (
    <div className="rounded-md border border-white/10 bg-neutral-900/90 px-2.5 py-1.5 shadow-xl">
      <p className="text-2xs text-neutral-200">{slice.value}</p>
      <p className="text-3xs text-skylab-300">{slice.count} yanıt · {formatPercent(slice.percentage)}</p>
    </div>
  );
}

function DonutChart({ buckets }) {
  if (!buckets || buckets.length === 0) return <EmptyNote>Yanıt yok</EmptyNote>;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-4 sm:flex-row sm:gap-10">
      <div className="h-44 w-44 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={buckets} dataKey="count" nameKey="value" innerRadius={48} outerRadius={78} paddingAngle={2} stroke="none" animationDuration={500}>
              {buckets.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<SliceTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="w-full max-w-[16rem] space-y-2">
        {buckets.map((bucket, i) => {
          const label = bucket.value === "" || bucket.value === null || bucket.value === undefined ? "—" : String(bucket.value);
          return (
            <li key={`${label}-${i}`} className="flex items-center gap-2 text-2xs">
              <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
              <span className="min-w-0 flex-1 truncate text-neutral-300" title={label}>{label}</span>
              <span className="shrink-0 tabular-nums text-neutral-500">{bucket.count} · {formatPercent(bucket.percentage)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function CategoricalChart({ buckets, view }) {
  if (!buckets || buckets.length === 0) return <EmptyNote>Yanıt yok</EmptyNote>;
  return view === "pie" ? <DonutChart buckets={buckets} /> : <DistributionBars buckets={buckets} />;
}

const NUMERIC_STATS = [
  { key: "average", label: "Ort" },
  { key: "median", label: "Medyan" },
  { key: "min", label: "Min" },
  { key: "max", label: "Maks" },
];

function NumericSummary({ numeric }) {
  if (!numeric) return null;
  return (
    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1">
      {NUMERIC_STATS.map((stat) => (
        <span key={stat.key} className="text-2xs text-neutral-500">
          {stat.label} <span className="font-semibold tabular-nums text-neutral-200">{formatNumber(numeric[stat.key])}</span>
        </span>
      ))}
    </div>
  );
}

function MatrixView({ rows }) {
  if (!rows || rows.length === 0) return <EmptyNote>Yanıt yok</EmptyNote>;

  return (
    <div className="divide-y divide-white/5">
      {rows.map((row, i) => (
        <div key={`${row.row}-${i}`} className="py-4 first:pt-0 last:pb-0">
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <span className="min-w-0 truncate text-2xs font-medium text-neutral-200">{row.row}</span>
            <span className="shrink-0 text-3xs tabular-nums text-neutral-500">{row.answeredCount ?? 0} yanıt</span>
          </div>
          <DistributionBars buckets={row.distribution} />
        </div>
      ))}
    </div>
  );
}

function BucketTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const bucket = payload[0].payload;
  return (
    <div className="rounded-md border border-white/10 bg-neutral-900/90 px-2.5 py-1.5 shadow-xl">
      <p className="text-3xs text-neutral-400">{label}</p>
      <p className="text-2xs font-medium text-skylab-300">{bucket.count} yanıt · {formatPercent(bucket.percentage)}</p>
    </div>
  );
}

function TimeSeriesChart({ buckets }) {
  if (!buckets || buckets.length === 0) return <EmptyNote>Yanıt yok</EmptyNote>;

  return (
    <div className="h-44 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
          <XAxis dataKey="value" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: "rgb(115,115,125)" }} interval="preserveStartEnd" />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip cursor={{ fill: "rgba(224,200,229,0.08)" }} content={<BucketTooltip />} />
          <Bar dataKey="count" fill={BAR_FILL} radius={[3, 3, 0, 0]} maxBarSize={44} animationDuration={500} animationEasing="ease-out" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function QuestionBody({ q, view }) {
  switch (q.kind) {
    case 3:
    case 5:
      return <CategoricalChart buckets={q.distribution} view={view} />;
    case 4:
      return (
        <>
          <DistributionBars buckets={q.distribution} />
          {q.distribution?.length > 0 && (
            <p className="mt-3 text-3xs text-neutral-600">Çoklu seçim: yüzdeler toplamı %100&apos;ü aşabilir.</p>
          )}
        </>
      );
    case 6:
      return (
        <>
          <NumericSummary numeric={q.numeric} />
          <DistributionBars buckets={q.distribution} />
        </>
      );
    case 7:
      return <MatrixView rows={q.rows} />;
    case 8:
      return (
        <>
          <TimeSeriesChart buckets={q.distribution} />
          {q.dateRange && (q.dateRange.earliest || q.dateRange.latest) && (
            <p className="mt-2 text-center text-3xs tabular-nums text-neutral-500">{q.dateRange.earliest ?? "?"} — {q.dateRange.latest ?? "?"}</p>
          )}
        </>
      );
    case 9:
      return <TimeSeriesChart buckets={q.distribution} />;
    default:
      return null;
  }
}

function ViewToggle({ view, onChange }) {
  const options = [["bar", "Bar"], ["pie", "Pasta"]];
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-white/10 bg-white/5 p-0.5">
      {options.map(([value, label]) => (
        <button key={value} type="button" onClick={() => onChange(value)}
          className={`rounded px-2.5 py-1 text-3xs transition ${view === value ? "bg-white/10 text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function OpenQuestionBlock({ question }) {
  const [view, setView] = useState("bar");
  const text = questionText(question);
  const canPie = question.kind === 3 || question.kind === 5;

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="shrink-0 text-3xs font-medium tabular-nums text-neutral-600">S{question.ordinal}</span>
            <h3 className="truncate text-sm font-medium text-neutral-100" title={text || undefined}>
              {text || <span className="font-normal italic text-neutral-500">Bu sorunun metni yok</span>}
            </h3>
          </div>
          <p className="mt-0.5 text-3xs text-neutral-500">
            <span className="uppercase tracking-[0.18em]">{KIND_LABEL[question.kind] ?? question.type}</span>
            <span className="text-neutral-600"> · {question.answeredCount ?? 0} yanıt{(question.skippedCount ?? 0) > 0 ? ` · ${question.skippedCount} boş` : ""}</span>
          </p>
        </div>
        {canPie && <ViewToggle view={view} onChange={setView} />}
      </div>
      <div className="pt-4">
        <QuestionBody q={question} view={view} />
      </div>
    </div>
  );
}

function AnalyticsPanel({ questions }) {
  return (
    <div className="flex flex-col lg:h-full lg:overflow-hidden">
      <div>
        <div className="flex items-center gap-2 px-1 lg:h-7">
          <span className="text-2xs font-medium text-neutral-500 lg:text-base">Analitik</span>
          <span className="h-px flex-1 bg-white/5" />
        </div>
      </div>

      <div className="pt-4 scrollbar lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        {questions.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-center text-2xs text-neutral-600">Analiz için sağdan bir soru seçin.</p>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-2xl divide-y divide-white/5">
            {questions.map((q) => (
              <motion.div key={q.questionId} {...fadeIn} className="py-5 first:pt-0 last:pb-0">
                <OpenQuestionBlock question={q} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RateRow({ q, total, open, onToggle }) {
  const rate = total > 0 ? (q.answeredCount / total) * 100 : 0;
  const text = questionText(q);
  const label = text || "Bu sorunun metni yok";
  const selectable = q.aggregatable;

  const titleClass = text ? (open ? "text-neutral-50" : "text-neutral-200") : "italic text-neutral-500";
  const barClass = !selectable ? "bg-neutral-600" : open ? "bg-skylab-400" : "bg-skylab-500";

  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <span className="shrink-0 text-3xs tabular-nums text-neutral-600">S{q.ordinal}</span>
          <span className={`truncate text-2xs ${titleClass}`} title={label}>{label}</span>
        </span>
        <span className="shrink-0 text-3xs tabular-nums text-neutral-500">{formatPercent(rate)}</span>
      </div>
      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full transition-[width] duration-500 ease-out ${barClass}`} style={{ width: `${rate}%` }} />
      </div>
    </>
  );

  if (!selectable) {
    return <div className="rounded-lg px-2.5 py-2 opacity-60">{body}</div>;
  }

  return (
    <button type="button" onClick={() => onToggle(q.questionId)} aria-pressed={open}
      className={`w-full rounded-lg px-2.5 py-2 text-left transition-colors ${open ? "bg-skylab-500/10" : "hover:bg-white/5"}`}
    >
      {body}
    </button>
  );
}

function RatePanel({ questions, totalResponses, openIds, onToggle }) {
  return (
    <div className="flex flex-col lg:h-full lg:overflow-hidden">
      <div>
        <div className="mb-1 flex items-center gap-2 px-1 lg:h-7">
          <span className="text-2xs font-medium text-neutral-500">Cevaplanma oranı</span>
          <span className="h-px flex-1 bg-white/5" />
        </div>
        <p className="mb-2 px-1 text-3xs text-neutral-600">Görüntülemek için sorulara tıklayın</p>
      </div>
      <div className="space-y-0.5 scrollbar lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        {questions.map((q) => (
          <RateRow key={q.questionId ?? q.ordinal} q={q} total={totalResponses} open={openIds.includes(q.questionId)} onToggle={onToggle} />
        ))}
      </div>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:h-full lg:grid-cols-12">
      <div className="order-2 lg:order-1 lg:col-span-7">
        <div className="mb-4 flex items-center gap-2 pb-1">
          <div className="shimmer h-4 w-20 rounded-md" />
          <span className="h-px flex-1 bg-white/5" />
        </div>
        <div className="mx-auto w-full max-w-2xl space-y-3 pt-4">
          <div className="shimmer h-3.5 w-40 rounded-md" />
          <div className="shimmer h-3 w-24 rounded-md" />
          {Array.from({ length: 3 }, (_, j) => (
            <div key={j} className="space-y-1.5 pt-2">
              <div className="shimmer h-2.5 w-28 rounded-md" />
              <div className="shimmer h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="order-1 lg:order-2 lg:col-span-5">
        <div className="mb-3 flex items-center gap-2">
          <div className="shimmer h-3 w-28 rounded-md" />
          <span className="h-px flex-1 bg-white/5" />
        </div>
        <div className="space-y-2 pt-4">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="space-y-1.5 px-1 py-1">
              <div className="shimmer h-2.5 w-32 rounded-md" />
              <div className="shimmer h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FormAnalytics({ analytics, isLoading, error }) {
  const [openIds, setOpenIds] = useState(null);

  if (isLoading) {
    return (
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto scrollbar lg:overflow-hidden">
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <StateCard title="Analitik yüklenemedi" Icon={ListX} description="Analiz verileri yüklenirken bir hata oluştu." />
      </div>
    );
  }

  const questions = (analytics?.questions ?? [])
    .filter((q) => q.kind !== 0)
    .map((q, i) => ({ ...q, ordinal: i + 1 }));

  if (questions.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <StateCard title="Analitik için veri yok" Icon={TextSearch} description="Bu formda henüz analiz edilecek cevap bulunmuyor." />
      </div>
    );
  }

  const aggregatable = questions.filter((q) => q.aggregatable);
  const defaultOpen = aggregatable[0] ? [aggregatable[0].questionId] : [];
  const effectiveOpenIds = openIds ?? defaultOpen;

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const base = prev ?? defaultOpen;
      return base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
    });
  };

  const openQuestions = aggregatable.filter((q) => effectiveOpenIds.includes(q.questionId));

  return (
    <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1 scrollbar lg:overflow-hidden lg:pr-0">
      <div className="grid grid-cols-1 gap-6 lg:h-full lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-7 lg:min-h-0">
          <AnalyticsPanel questions={openQuestions} />
        </div>
        <div className="order-1 lg:order-2 lg:col-span-5 lg:min-h-0">
          <RatePanel questions={questions} totalResponses={analytics.totalResponses} openIds={effectiveOpenIds} onToggle={toggleOpen} />
        </div>
      </div>
    </div>
  );
}
