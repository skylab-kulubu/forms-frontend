"use client";

import { useState } from "react";
import { formatNumber, formatPercent } from "../form-overview/overview-stats";

export const PIE_COLORS = ["#d8b4fe", "#6366f1", "#c084fc", "#7c3aed", "#9d84f0"];
export const KIND_LABEL = { 0: "Ayraç", 1: "Metin", 2: "Dosya", 3: "Seçim", 4: "Çoklu seçim", 5: "Aç/Kapa", 6: "Sayı", 7: "Matris", 8: "Tarih", 9: "Saat", 10: "Tekrarlanan grup" };
export const MONTH_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const BUCKET_STEPS = [5, 10, 15, 30, 60, 120, 180, 360, 720, 1440, 2880, 10080];
const GROW = "transition-[width] duration-500 ease-out";

export function EmptyNote({ children = "Yanıt yok" }) {
  return <p className="py-3 text-center text-3xs text-neutral-600">{children}</p>;
}

export function monthName(value) {
  const [year, month] = String(value).split("-").map(Number);
  return MONTHS[month - 1] ? `${MONTHS[month - 1]} ${year}` : String(value);
}

export function dayName(value) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value ?? "");
  return `${date.getDate()} ${MONTH_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

function topIndex(items) {
  return items.reduce((best, item, index) => (item.count > items[best].count ? index : best), 0);
}

export function Bars({ buckets, className = "mt-3" }) {
  if (!buckets?.length) return <EmptyNote />;

  return (
    <div className={`${className} space-y-3`}>
      {buckets.map((bucket, index) => {
        const label = bucket.value === "" || bucket.value == null ? "—" : String(bucket.value);
        return (
          <div key={`${label}-${index}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-2xs text-neutral-300" title={label}>{label}</span>
              <span className="shrink-0 text-2xs tabular-nums text-neutral-500"><span className="text-neutral-300">{bucket.count}</span> · {formatPercent(bucket.percentage)}</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div className={`h-full rounded-full bg-skylab-500 ${GROW}`} style={{ width: `${Math.min(100, Number(bucket.percentage) || 0)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function arc(cx, cy, inner, outer, from, to) {
  const point = (radius, angle) => [cx + radius * Math.sin(angle), cy - radius * Math.cos(angle)];
  const large = to - from > Math.PI ? 1 : 0;
  const [x0, y0] = point(outer, from);
  const [x1, y1] = point(outer, to);
  const [x2, y2] = point(inner, to);
  const [x3, y3] = point(inner, from);
  return `M ${x0} ${y0} A ${outer} ${outer} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${inner} ${inner} 0 ${large} 0 ${x3} ${y3} Z`;
}

export function Donut({ buckets }) {
  const [hover, setHover] = useState(null);
  if (!buckets?.length) return <EmptyNote />;

  const items = buckets.length > 5
    ? [
      ...buckets.slice(0, 4),
      {
        value: "Diğer",
        count: buckets.slice(4).reduce((sum, bucket) => sum + bucket.count, 0),
        percentage: Math.round(buckets.slice(4).reduce((sum, bucket) => sum + (Number(bucket.percentage) || 0), 0) * 10) / 10,
        rest: buckets.length - 4,
      },
    ]
    : buckets;
  const total = items.reduce((sum, bucket) => sum + bucket.count, 0) || 1;
  const gap = items.length > 1 ? Math.PI / 90 : 0;
  const slices = items.reduce((list, bucket, index) => {
    const start = list.length ? list[list.length - 1].end : 0;
    const span = (bucket.count / total) * Math.PI * 2;
    return [...list, { from: start + gap / 2, to: start + span - gap / 2, end: start + span, color: PIE_COLORS[index % PIE_COLORS.length], bucket, full: span >= Math.PI * 2 - 0.0001 }];
  }, []);

  return (
    <div className="mt-3 flex flex-col items-center justify-center gap-6 py-2 sm:flex-row sm:gap-10">
      <div className="relative size-44 shrink-0">
        <svg viewBox="0 0 176 176" className="size-44" role="img" aria-label="Pasta grafiği">
          {slices.map((slice, index) => (slice.full ? (
            <circle key={index} cx="88" cy="88" r="63" fill="none" stroke={slice.color} strokeWidth="30"
              opacity={hover == null || hover === index ? 1 : 0.4} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)}
            />
          ) : slice.to > slice.from ? (
            <path key={index} d={arc(88, 88, 48, 78, slice.from, slice.to)} fill={slice.color}
              opacity={hover == null || hover === index ? 1 : 0.4} onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)}
            />
          ) : null))}
        </svg>
        {hover != null ? (
          <div className="pointer-events-none absolute inset-0 grid place-items-center px-12 text-center">
            <div className="min-w-0">
              <p className="text-sm font-semibold tabular-nums text-neutral-100">{formatPercent(slices[hover].bucket.percentage)}</p>
              <p className="truncate text-3xs text-neutral-400">{slices[hover].bucket.value}</p>
            </div>
          </div>
        ) : null}
      </div>
      <ul className="w-full max-w-[16rem] space-y-2">
        {slices.map((slice, index) => (
          <li key={index} className="flex items-center gap-2 text-2xs" onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)}>
            <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: slice.color }} />
            <span className="min-w-0 flex-1 truncate text-neutral-300">
              {slice.bucket.value}
              {slice.bucket.rest ? <span className="text-neutral-500"> · {slice.bucket.rest} seçenek</span> : null}
            </span>
            <span className="shrink-0 tabular-nums text-neutral-500">{slice.bucket.count} · {formatPercent(slice.bucket.percentage)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChoiceRows({ field, q }) {
  const distribution = q.distribution ?? [];
  const choices = Array.isArray(field.props?.choices) ? field.props.choices : [];
  const extra = distribution.map((bucket) => bucket.value).filter((value) => !choices.includes(value));
  const values = [...choices, ...extra];
  if (values.length === 0) return <EmptyNote />;
  const top = Math.max(0, ...distribution.map((bucket) => bucket.count));

  return (
    <div>
      <div className="mt-3 flex flex-col gap-2">
        {values.map((value, index) => {
          const bucket = distribution.find((item) => item.value === value) ?? { count: 0, percentage: 0 };
          return (
            <div key={`${value}-${index}`} className={`relative flex items-center gap-3 overflow-hidden rounded-md border bg-neutral-900/60 p-2 ${top > 0 && bucket.count === top ? "border-skylab-400/25" : "border-white/10"}`}>
              <span className={`absolute inset-y-0 left-0 bg-skylab-500/[0.14] ${GROW}`} style={{ width: `${Math.min(100, Number(bucket.percentage) || 0)}%` }} />
              <span className="relative min-w-0 flex-1 truncate text-sm text-neutral-200">{value}</span>
              <span className="relative shrink-0 text-2xs tabular-nums text-neutral-400"><span className="text-neutral-100">{bucket.count}</span> · {formatPercent(bucket.percentage)}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-3xs text-neutral-600">Çoklu seçim: yüzdeler toplamı %100&apos;ü aşabilir.</p>
    </div>
  );
}

export function ToggleSplit({ field, q }) {
  const on = field.props?.trueLabel || "Evet";
  const off = field.props?.falseLabel || "Hayır";
  const yes = (q.distribution ?? []).find((bucket) => bucket.value === on) ?? { count: 0, percentage: 0 };
  const no = (q.distribution ?? []).find((bucket) => bucket.value === off) ?? { count: 0, percentage: 0 };
  if (!q.answeredCount) return <EmptyNote />;

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-neutral-900/60 px-4 py-3">
      <div className="mb-2 flex items-baseline justify-between gap-3 text-2xs">
        <span className="min-w-0 truncate font-medium text-skylab-300">{on} <span className="font-normal tabular-nums text-neutral-400">{yes.count} · {formatPercent(yes.percentage)}</span></span>
        <span className="min-w-0 truncate text-right font-medium text-neutral-300">{off} <span className="font-normal tabular-nums text-neutral-400">{no.count} · {formatPercent(no.percentage)}</span></span>
      </div>
      <div className="flex h-2 w-full gap-0.5 overflow-hidden rounded-full">
        <span className={`h-full rounded-l-full bg-skylab-400 ${GROW}`} style={{ width: `${Math.min(100, Number(yes.percentage) || 0)}%` }} />
        <span className="h-full flex-1 rounded-r-full bg-neutral-700" />
      </div>
    </div>
  );
}

function sliderBins(field, q) {
  const min = Number(field.props?.min ?? 0);
  const max = Number(field.props?.max ?? 100);
  const step = Number(field.props?.step) > 0 ? Number(field.props.step) : 1;
  const span = max - min;
  const counts = new Map((q.distribution ?? []).map((bucket) => [Number(bucket.value), bucket.count]));
  const position = (value) => (span > 0 ? ((value - min) / span) * 100 : 50);

  if (span <= 0) return { min, max, position, bins: [{ label: String(min), at: 50, count: counts.get(min) ?? 0 }] };

  const values = [];
  for (let value = min; value <= max + 1e-9 && values.length <= 40; value += step) values.push(Math.round(value * 1000) / 1000);

  if (values.length <= 21) {
    return { min, max, position, width: 62 / Math.max(1, values.length - 1), bins: values.map((value) => ({ label: formatNumber(value), at: position(value), count: counts.get(value) ?? 0, value })) };
  }

  const size = span / 10;
  const bins = Array.from({ length: 10 }, (_, index) => {
    const from = min + index * size;
    const to = index === 9 ? max : min + (index + 1) * size;
    return { label: `${formatNumber(from)}-${formatNumber(to)}`, at: position((from + to) / 2), count: 0, from, to };
  });
  (q.distribution ?? []).forEach((bucket) => {
    const value = Number(bucket.value);
    if (!Number.isFinite(value)) return;
    bins[Math.min(9, Math.max(0, Math.floor((value - min) / size)))].count += bucket.count;
  });
  return { min, max, position, width: 7, bins };
}

export function SliderHistogram({ field, q }) {
  if (!q.answeredCount || !q.numeric) return <EmptyNote />;
  const { min, max, position, width, bins } = sliderBins(field, q);
  const peak = Math.max(1, ...bins.map((bin) => bin.count));
  const average = Number(q.numeric.average);
  const highlight = bins.reduce((best, bin, index) => (Math.abs(bin.at - position(average)) < Math.abs(bins[best].at - position(average)) ? index : best), 0);

  return (
    <div className="mt-3 rounded-lg border border-white/10 bg-neutral-900/60 px-4 pb-3 pt-3">
      <div className="flex items-end gap-4">
        <span className="w-6 shrink-0" />
        <div className="relative h-[72px] flex-1">
          {bins.map((bin, index) => (
            <div key={`${bin.label}-${index}`} className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${bin.at}%`, width: `${width ?? 8}%` }} title={`${bin.label}: ${bin.count} kişi`}>
              <span className="mb-1 text-4xs tabular-nums text-neutral-500">{bin.count}</span>
              <span className={`w-full rounded-t-[3px] transition-[height] duration-500 ease-out ${highlight === index ? "bg-skylab-400" : "bg-skylab-500/80"}`} style={{ height: `${(bin.count / peak) * 52}px` }} />
            </div>
          ))}
        </div>
        <span className="w-6 shrink-0" />
        <div className="mx-1 h-5 w-px shrink-0" />
        <span className="min-w-10" />
      </div>
      <div className="mt-2 flex items-center gap-4">
        <span className="w-6 shrink-0 text-right text-xs font-medium text-neutral-500">{formatNumber(min)}</span>
        <span className="relative h-1 flex-1 rounded-lg bg-neutral-800">
          <span className="absolute inset-y-0 left-0 rounded-lg bg-pink-400/40" style={{ width: `${position(average)}%` }} />
          <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-200" style={{ left: `${position(average)}%` }} title="Ortalama" />
        </span>
        <span className="w-6 shrink-0 text-xs font-medium text-neutral-500">{formatNumber(max)}</span>
        <div className="mx-1 h-5 w-px shrink-0 bg-white/10" />
        <span className="min-w-10 text-center text-sm tabular-nums text-neutral-200">{formatNumber(average)}</span>
      </div>
      <NumericLine numeric={q.numeric} className="mt-2.5" />
    </div>
  );
}

export function NumericLine({ numeric, prefix = null, className = "mt-2" }) {
  if (!numeric) return null;
  return (
    <p className={`${className} text-2xs text-neutral-500`}>
      {prefix ? `${prefix} · ` : null}
      Ort <span className="font-semibold tabular-nums text-neutral-200">{formatNumber(numeric.average)}</span> · Medyan <span className="font-semibold tabular-nums text-neutral-200">{formatNumber(numeric.median)}</span>
      {" "}· Min <span className="font-semibold tabular-nums text-neutral-200">{formatNumber(numeric.min)}</span> · Maks <span className="font-semibold tabular-nums text-neutral-200">{formatNumber(numeric.max)}</span>
    </p>
  );
}

export function Columns({ items, height = 80, unit = "kişi", highlight = null, labelOf = (item) => item.value }) {
  const peak = Math.max(1, ...items.map((item) => item.count));

  return (
    <div className="mt-3">
      <div className="flex items-end gap-1" style={{ height: height + 16 }}>
        {items.map((item, index) => (
          <div key={`${labelOf(item)}-${index}`} className="flex min-w-0 flex-1 flex-col items-center justify-end" title={`${labelOf(item)}: ${item.count} ${unit} · ${formatPercent(item.percentage)}`}>
            <span className="mb-1 text-4xs tabular-nums text-neutral-500">{item.count || ""}</span>
            <span className={`w-full max-w-11 rounded-t-[3px] transition-[height] duration-500 ease-out ${highlight === index ? "bg-skylab-400" : "bg-skylab-500/80"}`}
              style={{ height: `${Math.max(item.count ? 3 : 0, (item.count / peak) * height)}px` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1 border-t border-white/5 pt-1.5">
        {items.map((item, index) => (
          <span key={`${labelOf(item)}-${index}`} className="min-w-0 flex-1 truncate text-center text-4xs tabular-nums text-neutral-500">{labelOf(item)}</span>
        ))}
      </div>
    </div>
  );
}

export function NumberHistogram({ q }) {
  const items = [...(q.distribution ?? [])].sort((a, b) => Number(a.value) - Number(b.value));
  if (items.length === 0) return <EmptyNote />;
  return (
    <div>
      <Columns items={items} highlight={topIndex(items)} />
      <NumericLine numeric={q.numeric} />
    </div>
  );
}

export function MonthColumns({ q }) {
  const items = [...(q.distribution ?? [])].sort((a, b) => String(a.value).localeCompare(String(b.value)));
  if (items.length === 0) return <EmptyNote />;
  const years = new Set(items.map((item) => String(item.value).slice(0, 4)));
  const labelOf = (item) => {
    const [year, month] = String(item.value).split("-").map(Number);
    const name = MONTH_SHORT[month - 1] ?? String(item.value);
    return years.size > 1 ? `${name} ${String(year).slice(2)}` : name;
  };
  const top = topIndex(items);
  const range = q.dateRange?.earliest && q.dateRange?.latest ? `${dayName(q.dateRange.earliest)} - ${dayName(q.dateRange.latest)}` : null;

  return (
    <div>
      <Columns items={items} highlight={top} labelOf={labelOf} />
      <p className="mt-2 text-2xs tabular-nums text-neutral-500">
        {range ? `${range} · ` : null}en çok {monthName(items[top].value)} ({items[top].count} kişi)
      </p>
    </div>
  );
}

export function HourColumns({ q }) {
  const items = [...(q.distribution ?? [])].sort((a, b) => String(a.value).localeCompare(String(b.value)));
  if (items.length === 0) return <EmptyNote />;
  const top = topIndex(items);

  return (
    <div>
      <Columns items={items} highlight={top} labelOf={(item) => String(item.value).slice(0, 2)} />
      <p className="mt-2 text-2xs tabular-nums text-neutral-500">Saat başına sayılır · en yoğun {items[top].value} ({items[top].count} kişi)</p>
    </div>
  );
}

export function MatrixHeat({ field, q }) {
  const rows = q.rows ?? [];
  if (rows.length === 0) return <EmptyNote />;
  const declared = Array.isArray(field.props?.columns) ? field.props.columns : [];
  const seen = rows.flatMap((row) => (row.distribution ?? []).map((bucket) => bucket.value));
  const columns = [...declared, ...seen.filter((value, index) => !declared.includes(value) && seen.indexOf(value) === index)];
  const same = rows.every((row) => row.answeredCount === rows[0].answeredCount);

  return (
    <div className="mt-3 overflow-x-auto rounded-lg border border-white/10 scrollbar">
      <table className="w-full text-left text-xs">
        <thead className="bg-white/3 text-neutral-400">
          <tr>
            <th className="px-3 py-2 font-medium" />
            {columns.map((column) => <th key={column} className="px-1 py-2 text-center font-medium">{column}</th>)}
            {same ? null : <th className="px-3 py-2 text-right text-3xs font-medium text-neutral-500">Cevap</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row) => (
            <tr key={row.row}>
              <td className="px-3 py-2 text-neutral-200">{row.row}</td>
              {columns.map((column) => {
                const bucket = (row.distribution ?? []).find((item) => item.value === column) ?? { count: 0, percentage: 0 };
                return (
                  <td key={column} className="px-1 py-1.5 text-center">
                    <span className="inline-flex h-7 w-full min-w-10 items-center justify-center rounded-md text-2xs tabular-nums text-neutral-100" title={`${bucket.count} kişi`}
                      style={{ backgroundColor: `rgba(224, 200, 229, ${0.05 + ((Number(bucket.percentage) || 0) / 100) * 0.5})` }}
                    >
                      {formatPercent(bucket.percentage)}
                    </span>
                  </td>
                );
              })}
              {same ? null : <td className="px-3 py-2 text-right text-2xs tabular-nums text-neutral-500">{row.answeredCount}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FunnelBars({ items, total }) {
  return (
    <div className="space-y-3">
      {items.map(([label, count, extra]) => {
        const share = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="min-w-0 truncate text-2xs text-neutral-300">{label}</span>
              <span className="shrink-0 text-2xs tabular-nums text-neutral-500">
                <span className="text-neutral-300">{count}</span> · {formatPercent(Math.round(share * 10) / 10)}{extra ? ` · ${extra}` : ""}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/5">
              <div className={`h-full rounded-full bg-skylab-500 ${GROW}`} style={{ width: `${Math.min(share, 100)}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function bucketLabel(from, to, step) {
  if (step % 1440 === 0) return `${from / 1440}-${to / 1440} gün`;
  if (step % 60 === 0) return `${from / 60}-${to / 60} sa`;
  return `${from}-${to} dk`;
}

export function durationBuckets(minutes, limitMinutes) {
  if (minutes.length === 0) return [];
  const top = Math.max(Number(limitMinutes) || 0, minutes[minutes.length - 1], 1);
  const step = BUCKET_STEPS.find((value) => top / value <= 8) ?? BUCKET_STEPS[BUCKET_STEPS.length - 1];
  const count = Math.max(1, Math.ceil(top / step));
  const counts = new Array(count).fill(0);
  minutes.forEach((value) => { counts[Math.min(count - 1, Math.floor(value / step))] += 1; });
  return counts.map((value, index) => ({ value: bucketLabel(index * step, (index + 1) * step, step), count: value, percentage: Math.round((value / minutes.length) * 1000) / 10 }));
}

export function durationStats(minutes) {
  const sorted = [...minutes].sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return {
    sorted,
    average: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    median: sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2,
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}
