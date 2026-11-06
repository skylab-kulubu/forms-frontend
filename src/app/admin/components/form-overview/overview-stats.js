const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export const formatPercent = (value) => {
  const pct = Number(value) || 0;
  return `%${pct % 1 === 0 ? pct.toFixed(0) : pct.toFixed(1)}`;
};

export const formatNumber = (value) => {
  if (value === null || value === undefined) return "--";
  const rounded = Math.round(Number(value) * 100) / 100;
  return Number.isFinite(rounded) ? String(rounded) : "--";
};

export const percentOf = (part, whole) => (whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0);

export const MIN_DECIDED = 5;

export function approvalRate(approved, declined) {
  const decided = (approved ?? 0) + (declined ?? 0);
  return decided >= MIN_DECIDED ? Math.round(((approved ?? 0) / decided) * 100) : null;
}

const DAY_MS = 86_400_000;
const WEEKS_AFTER_DAYS = 70;
const RUSH_DAYS = 3;
const RECENT_DAYS = 7;
const SHORT_DAY = new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: "UTC" });
const LOCAL_DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" });

const noonOf = (key) => new Date(`${key}T12:00:00Z`).getTime();
const shortDay = (key) => SHORT_DAY.format(noonOf(key));
const localDay = (time) => LOCAL_DAY.format(time);
const nextDay = (key) => new Date(noonOf(key) + DAY_MS).toISOString().slice(0, 10);

const SPARSE_POINTS = 5;

function byWeek(days) {
  const weeks = [];
  for (let index = 0; index < days.length; index += 7) {
    const chunk = days.slice(index, index + 7);
    const known = chunk.filter((day) => day.count != null);
    weeks.push({
      key: chunk[0].key,
      label: chunk[0].label,
      count: known.length ? known.reduce((sum, day) => sum + day.count, 0) : null,
      total: known.length ? known[known.length - 1].total : null,
    });
  }
  return weeks;
}

function lifeNote(days, total, closes, ended, now) {
  const countIn = (after, until) => days.filter((day) => day.count != null && day.key > after && day.key <= until).reduce((sum, day) => sum + day.count, 0);
  if (ended) {
    const late = countIn(localDay(closes - RUSH_DAYS * DAY_MS), localDay(closes));
    return `Kapanıştan önceki ${RUSH_DAYS} günde ${late} cevap geldi (${formatPercent(Math.round((late / total) * 100))}).`;
  }
  const left = closes != null && closes > now ? `Kapanışa ${Math.max(1, Math.ceil((closes - now) / DAY_MS))} gün var. ` : "";
  const recent = countIn(localDay(now - RECENT_DAYS * DAY_MS), localDay(now));
  if (recent) return `${left}Son ${RECENT_DAYS} günde ${recent} cevap geldi (${formatPercent(Math.round((recent / total) * 100))}).`;
  const last = days.findLast((day) => day.count > 0);
  return `${left}Son cevap ${Math.max(1, Math.round((now - noonOf(last.key)) / DAY_MS))} gün önce geldi.`;
}

export function lifeSeries(lifetime, now) {
  const counts = Array.isArray(lifetime?.days) ? lifetime.days : [];
  if (!counts.some((day) => day.count > 0)) return null;

  const closes = lifetime.closesAt ? new Date(lifetime.closesAt).getTime() : null;
  const closeDay = closes == null ? null : localDay(closes);
  const ended = closes != null && closes <= now && closeDay >= counts.findLast((day) => day.count > 0).date;

  let total = 0;
  const days = counts.filter((day) => !ended || day.date <= closeDay).map((day) => {
    total += day.count;
    return { key: day.date, label: shortDay(day.date), count: day.count, total };
  });
  const note = lifeNote(days, total, closes, ended, now);
  for (let key = days[days.length - 1].key; closeDay && key < closeDay;) {
    key = nextDay(key);
    days.push({ key, label: shortDay(key), count: null, total: null });
  }

  const span = days.filter((day) => day.count != null).length;
  const weekly = days.length > WEEKS_AFTER_DAYS;
  const points = weekly ? byWeek(days) : days;
  const known = points.filter((point) => point.count != null);
  const sparse = points.length <= SPARSE_POINTS;
  const peak = known.reduce((best, point) => (point.count > best.count ? point : best), known[0]);
  const closeKey = closeDay ? points.findLast((point) => point.key <= closeDay)?.key ?? null : null;

  return { points, closeKey, peak, total, weekly, note, span, ended, sparse };
}

export function decisionRows(metrics) {
  const flagged = metrics?.flaggedCount ?? 0;
  return [
    ["pending", Math.max(0, (metrics?.pendingCount ?? 0) - flagged)],
    ...(flagged > 0 ? [["flagged", flagged]] : []),
    ["approved", metrics?.approvedCount ?? 0],
    ["declined", metrics?.rejectedCount ?? 0],
  ];
}

function topBucket(q) {
  const buckets = q?.distribution ?? [];
  return buckets.reduce((best, bucket) => (!best || bucket.count > best.count ? bucket : best), null);
}

function monthLabel(value) {
  const [year, month] = String(value).split("-").map(Number);
  return MONTHS[month - 1] ? `${MONTHS[month - 1]} ${year}` : String(value);
}

function bucketCount(q, value) {
  return (q?.distribution ?? []).find((bucket) => bucket.value === value)?.count ?? 0;
}

function matches(source, operator, target, value) {
  const number = Number(value);
  switch (operator) {
    case "equals": return source.type === "slider" ? number === Number(target) : value === target;
    case "not_equals": return source.type === "slider" ? number !== Number(target) : value !== target;
    case "greater_than": return number > Number(target);
    case "less_than": return number < Number(target);
    default: return null;
  }
}

export function askedCount(field, fields, byId, total) {
  const condition = field?.condition;
  const stats = byId.get(field?.id);
  const served = stats?.askedCount;
  if (typeof served === "number" && served >= (stats.answeredCount ?? 0)) {
    return condition?.fieldId || served < total ? served : null;
  }
  if (!condition?.fieldId) return null;
  const source = fields.find((item) => item.id === condition.fieldId);
  const sourceStats = byId.get(condition.fieldId);
  if (!source || !sourceStats) return null;

  const { operator, value } = condition;
  if (operator === "is_set") return sourceStats.answeredCount;
  if (operator === "is_empty") return total - sourceStats.answeredCount;

  if (source.type === "toggle") {
    if (operator === "is_true") return bucketCount(sourceStats, source.props?.trueLabel || "Evet");
    if (operator === "is_false") return bucketCount(sourceStats, source.props?.falseLabel || "Hayır");
  }

  if (["toggle", "combobox", "multi_choice"].includes(source.type)) {
    if (operator === "equals") return bucketCount(sourceStats, value);
    if (operator === "not_equals") return sourceStats.answeredCount - bucketCount(sourceStats, value);
    return null;
  }

  if (source.type === "slider") {
    const buckets = sourceStats.distribution ?? [];
    if (!["equals", "not_equals", "greater_than", "less_than"].includes(operator)) return null;
    return buckets.reduce((sum, bucket) => sum + (matches(source, operator, value, bucket.value) ? bucket.count : 0), 0);
  }

  return null;
}

export function questionStats(field, q, { fields, byId, total }) {
  if (!q) return { rate: 0, grey: true, signal: null };

  const asked = askedCount(field, fields, byId, total);
  const base = asked != null && asked >= q.answeredCount ? asked : total;
  const rate = percentOf(q.answeredCount, base);
  const grey = !q.aggregatable;
  const kind = Number(q.kind);
  const top = topBucket(q);

  let signal = null;
  if (field.type === "toggle") {
    const on = field.props?.trueLabel || "Evet";
    const off = field.props?.falseLabel || "Hayır";
    const share = (label) => (q.distribution ?? []).find((bucket) => bucket.value === label)?.percentage ?? 0;
    if (q.answeredCount > 0) signal = [[on, formatPercent(share(on))], [off, formatPercent(share(off))]];
  } else if (kind === 6 && q.numeric) {
    signal = { lead: "Ortalama", strong: formatNumber(q.numeric.average), rest: `medyan ${formatNumber(q.numeric.median)}${top ? ` · en çok ${top.value}` : ""}` };
  } else if (kind === 7) {
    const best = (q.rows ?? [])
      .flatMap((row) => (row.distribution ?? []).map((bucket) => ({ row: row.row, bucket })))
      .reduce((winner, item) => (!winner || item.bucket.percentage > winner.bucket.percentage ? item : winner), null);
    if (best) signal = { lead: "En çok:", strong: best.bucket.value, rest: `${best.row} satırında ${formatPercent(best.bucket.percentage)}` };
  } else if (kind === 8 && top) {
    signal = { lead: "En çok:", strong: monthLabel(top.value), rest: `${top.count} kişi` };
  } else if (kind === 9 && top) {
    signal = { lead: "En yoğun saat:", strong: top.value, rest: `${top.count} kişi` };
  } else if ((kind === 3 || kind === 4) && top) {
    signal = { lead: "En çok:", strong: top.value, rest: formatPercent(top.percentage) };
  } else if (kind === 2) {
    signal = { text: `${q.answeredCount} dosya yüklendi${q.skippedCount ? ` · ${q.skippedCount} kişi boş bıraktı` : ""}` };
  } else if (kind === 10) {
    signal = { text: `${q.answeredCount} kişi doldurdu${q.skippedCount ? ` · ${q.skippedCount} kişi boş bıraktı` : ""}` };
  } else if (asked != null && asked >= q.answeredCount) {
    signal = { text: `${q.answeredCount} cevap · ${asked} kişiye gösterildi` };
  } else if (q.skippedCount) {
    signal = { text: `${q.answeredCount} kişi yazdı · ${q.skippedCount} kişi boş bıraktı` };
  }

  return { rate, grey, signal };
}
