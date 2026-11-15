"use client";

import { BarList, ProportionBar } from "@skylab-kulubu/skylcn-ui";
import { DonutChart } from "@skylab-kulubu/skylcn-ui/charts";
import { formatNumber, formatPercent } from "../form-overview/overview-stats";

export const KIND_LABEL = { 0: "Ayraç", 1: "Metin", 2: "Dosya", 3: "Seçim", 4: "Çoklu seçim", 5: "Aç/Kapa", 6: "Sayı", 7: "Matris", 8: "Tarih", 9: "Saat", 10: "Tekrarlanan grup" };
export const MONTH_SHORT = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const BUCKET_STEPS = [5, 10, 15, 30, 60, 120, 180, 360, 720, 1440, 2880, 10080];

const valueLabel = (value) => (value === "" || value == null ? "—" : String(value));

// The server's share in forms' percent format, so a bar never reads %19,6 beside a table that reads %19.6
function Share({ count, percentage, extra = null }) {
  return <><span className="text-secondary-foreground">{count}</span> · {formatPercent(percentage)}{extra ? ` · ${extra}` : ""}</>;
}

function shareRows(buckets, labelOf = (bucket) => valueLabel(bucket.value)) {
  return buckets.map((bucket, index) => {
    const label = labelOf(bucket);
    return { key: `${label}-${index}`, label: <span title={label}>{label}</span>, value: Number(bucket.percentage) || 0, detail: <Share count={bucket.count} percentage={bucket.percentage} /> };
  });
}

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

// BarList rows carry their own 10px inset; pulling the list out by it lines the labels up with the question text
export function Bars({ buckets, className = "mt-3" }) {
  if (!buckets?.length) return <EmptyNote />;
  return <BarList className={`-mx-2.5 ${className}`} max={100} items={shareRows(buckets)} />;
}

export function Donut({ buckets }) {
  if (!buckets?.length) return <EmptyNote />;
  return (
    <DonutChart framed={false} title="Pasta grafiği" className="mt-3"
      data={buckets.map((bucket, index) => ({ key: `${valueLabel(bucket.value)}-${index}`, label: valueLabel(bucket.value), value: bucket.count }))}
    />
  );
}

export function ChoiceRows({ field, q }) {
  const distribution = q.distribution ?? [];
  const choices = Array.isArray(field.props?.choices) ? field.props.choices : [];
  const extra = distribution.map((bucket) => bucket.value).filter((value) => !choices.includes(value));
  const values = [...choices, ...extra];
  if (values.length === 0) return <EmptyNote />;
  const buckets = values.map((value) => distribution.find((item) => item.value === value) ?? { value, count: 0, percentage: 0 });

  return (
    <div>
      <BarList className="-mx-2.5 mt-3" max={100} items={shareRows(buckets)} />
      <p className="mt-2 text-3xs text-neutral-600">Çoklu seçim: yüzdeler toplamı %100&apos;ü aşabilir.</p>
    </div>
  );
}

export function ToggleSplit({ field, q }) {
  const on = field.props?.trueLabel || "Evet";
  const off = field.props?.falseLabel || "Hayır";
  const countOf = (label) => (q.distribution ?? []).find((bucket) => bucket.value === label)?.count ?? 0;
  if (!q.answeredCount) return <EmptyNote />;

  return <ProportionBar className="mt-3" segments={[{ key: "on", label: on, value: countOf(on) }, { key: "off", label: off, value: countOf(off) }]} />;
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
    <div className="mt-3 rounded-lg border border-ink/10 bg-neutral-900/60 px-4 pb-3 pt-3">
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
        <div className="mx-1 h-5 w-px shrink-0 bg-ink/10" />
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
      <div className="mt-1.5 flex gap-1 border-t border-ink/5 pt-1.5">
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
    <div className="mt-3 overflow-x-auto rounded-lg border border-ink/10 scrollbar">
      <table className="w-full text-left text-xs">
        <thead className="bg-ink/3 text-neutral-400">
          <tr>
            <th className="px-3 py-2 font-medium" />
            {columns.map((column) => <th key={column} className="px-1 py-2 text-center font-medium">{column}</th>)}
            {same ? null : <th className="px-3 py-2 text-right text-3xs font-medium text-neutral-500">Cevap</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/5">
          {rows.map((row) => (
            <tr key={row.row}>
              <td className="px-3 py-2 text-neutral-200">{row.row}</td>
              {columns.map((column) => {
                const bucket = (row.distribution ?? []).find((item) => item.value === column) ?? { count: 0, percentage: 0 };
                return (
                  <td key={column} className="px-1 py-1.5 text-center">
                    <span className="inline-flex h-7 w-full min-w-10 items-center justify-center rounded-md text-2xs tabular-nums text-neutral-100" title={`${bucket.count} kişi`}
                      style={{ backgroundColor: `color-mix(in oklab, var(--chart-1) ${5 + (Number(bucket.percentage) || 0) * 0.5}%, transparent)` }}
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
    <BarList className="-mx-2.5" max={total}
      items={items.map(([label, count, extra]) => ({
        key: label,
        label,
        value: count,
        detail: <Share count={count} percentage={total > 0 ? Math.round((count / total) * 1000) / 10 : 0} extra={extra} />,
      }))}
    />
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
