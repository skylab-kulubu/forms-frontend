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
