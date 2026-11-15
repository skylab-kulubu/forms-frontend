const UNCOUNTED = [4, 6];
const DECIDABLE = [3, 4, 5, 6];
const ZONE = "Europe/Istanbul";
const DAY_MS = 86400000;
const KIND = { combobox: 3, multi_choice: 4, toggle: 5, slider: 6, matrix: 7, date: 8, time: 9, short_text: 1, long_text: 1, link: 1, file: 2, repeater: 10, separator: 0 };
const CLICKS = { instagram: [312, 0], whatsapp: [154, 0], email: [33, 0], "": [96, 38] };

const round2 = (value) => Math.round(value * 100) / 100;
const pct = (count, base) => (base > 0 ? round2((count / base) * 100) : 0);
const at = (value) => new Date(value).getTime();
const partsOf = (value) => String(value ?? "").split(",").map((part) => part.trim()).filter(Boolean);
const folded = (value) => String(value ?? "").trim().toLocaleLowerCase("tr-TR");
const hasAnswer = (detail, { q, v }) => partsOf(detail.schema.find((entry) => entry.id === q)?.answer).some((part) => folded(part) === folded(v));

const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

function localParts(time) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false }).formatToParts(new Date(time));
  const get = (type) => parts.find((part) => part.type === type)?.value;
  return { day: `${get("year")}-${get("month")}-${get("day")}`, hour: Number(get("hour")) % 24 };
}

export const kindOf = (field) => (field.type === "short_text" && field.props?.inputType === "number" ? 6 : KIND[field.type] ?? 0);

function buckets(values, base) {
  const counts = new Map();
  values.forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count, percentage: pct(count, base) }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export const countedOf = (details) => details.filter((detail) => !UNCOUNTED.includes(Number(detail.status)) && !detail.isArchived);

export function computeAnalytics(form, details, { status = null, sinceDays = null, answer = null, nowMs = Date.now() } = {}) {
  let base = countedOf(details);
  if (status === "approved") base = base.filter((detail) => detail.status === 2);
  if (status === "pending") base = base.filter((detail) => detail.status === 1 || detail.status === 5);
  if (status === "declined") base = base.filter((detail) => detail.status === 3);
  if (sinceDays) base = base.filter((detail) => at(detail.submittedAt) >= nowMs - sinceDays * DAY_MS);
  if (answer?.q) base = base.filter((detail) => hasAnswer(detail, answer));

  const questions = form.schema.map((field) => {
    const kind = kindOf(field);
    const head = { questionId: field.id, question: field.props?.question ?? field.props?.title ?? field.id, type: field.type, kind, aggregatable: ![0, 1, 2, 10].includes(kind) };
    if (kind === 0) return { ...head, answeredCount: 0, skippedCount: 0, askedCount: 0 };
    const raw = base.map((detail) => detail.schema.find((entry) => entry.id === field.id)).filter(Boolean).map((entry) => entry.answer);
    const answered = raw.map((value) => String(value ?? "").trim()).filter(Boolean);
    let answeredCount = answered.length;
    const out = { ...head, askedCount: raw.length };

    if (kind === 3 || kind === 5) out.distribution = buckets(answered, answeredCount);
    if (kind === 4) out.distribution = buckets(answered.flatMap(partsOf), answeredCount);
    if (kind === 6) {
      out.distribution = buckets(answered, answeredCount);
      const numbers = answered.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
      out.numeric = numbers.length ? { average: round2(numbers.reduce((sum, value) => sum + value, 0) / numbers.length), min: numbers[0], max: numbers[numbers.length - 1], median: median(numbers), count: numbers.length } : null;
    }
    if (kind === 7) {
      const parsed = answered.map((value) => {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      }).filter((value) => value && Object.keys(value).length);
      answeredCount = parsed.length;
      const order = [];
      const byRow = new Map();
      parsed.forEach((entry) => Object.entries(entry).forEach(([row, column]) => {
        if (!String(column ?? "").trim()) return;
        if (!byRow.has(row)) {
          byRow.set(row, []);
          order.push(row);
        }
        byRow.get(row).push(String(column).trim());
      }));
      out.rows = order.map((row) => ({ row, answeredCount: byRow.get(row).length, distribution: buckets(byRow.get(row), byRow.get(row).length) }));
    }

    if (out.distribution && DECIDABLE.includes(kind)) {
      out.distribution = out.distribution.map((bucket) => {
        const rows = base.filter((detail) => hasAnswer(detail, { q: field.id, v: bucket.value }));
        return { ...bucket, approvedCount: rows.filter((detail) => detail.status === 2).length, declinedCount: rows.filter((detail) => detail.status === 3).length };
      });
    }

    out.answeredCount = answeredCount;
    out.skippedCount = Math.max(0, raw.length - answeredCount);
    return out;
  });

  return {
    formId: form.id, totalResponses: base.length, generatedAt: new Date(nowMs).toISOString(), questions,
    decisions: { approved: base.filter((detail) => detail.status === 2).length, declined: base.filter((detail) => detail.status === 3).length },
  };
}

function lifetimeOf(details, closesAt, nowMs) {
  const counts = new Map();
  details.forEach((detail) => {
    const day = localParts(at(detail.submittedAt)).day;
    counts.set(day, (counts.get(day) ?? 0) + 1);
  });
  if (!counts.size) return null;
  const first = [...counts.keys()].sort()[0];
  const today = localParts(nowMs).day;
  const days = [];
  for (let cursor = at(`${first}T12:00:00Z`); ; cursor += DAY_MS) {
    const date = new Date(cursor).toISOString().slice(0, 10);
    days.push({ date, count: counts.get(date) ?? 0 });
    if (date >= today) break;
  }
  return { closesAt, days };
}

function trendChange(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return round2(((current - previous) / previous) * 100);
}

function channelsOf(form, live, reviewed, nowMs) {
  if (!form.id.startsWith("3f6d")) return [];
  const empty = () => ({ responses: 0, approved: 0, declined: 0, campaigns: new Map() });
  const rows = new Map();
  live.filter((detail) => at(detail.submittedAt) >= nowMs - 90 * DAY_MS).forEach((detail) => {
    const key = detail.attribution?.source ?? "";
    const row = rows.get(key) ?? empty();
    const campaign = detail.attribution?.campaign ?? "";
    const entry = row.campaigns.get(campaign) ?? { responses: 0, approved: 0, declined: 0 };
    [row, entry].forEach((item) => {
      item.responses += 1;
      if (detail.status === 2) item.approved += 1;
      if (detail.status === 3) item.declined += 1;
    });
    row.campaigns.set(campaign, entry);
    rows.set(key, row);
  });
  Object.keys(CLICKS).forEach((key) => {
    if (!rows.has(key)) rows.set(key, empty());
  });
  return [...rows.entries()].map(([key, row]) => ({
    source: key || null,
    responses: row.responses,
    clicks: CLICKS[key]?.[0] ?? null,
    scans: CLICKS[key]?.[1] ?? 0,
    ...(reviewed ? { approved: row.approved, declined: row.declined } : {}),
    ...(key ? {
      campaigns: [...row.campaigns.entries()].map(([campaign, entry]) => ({ campaign: campaign || null, ...entry }))
        .sort((a, b) => (a.campaign === null) - (b.campaign === null) || b.responses - a.responses),
    } : {}),
  })).sort((a, b) => (a.source === null) - (b.source === null) || b.responses - a.responses);
}

export function computeMetrics(form, details, { nowMs = Date.now(), reviewed = true } = {}) {
  const live = countedOf(details).filter((detail) => at(detail.submittedAt) <= nowMs);
  const times = live.map((detail) => at(detail.submittedAt));

  const days = Array.from({ length: 7 }, (_, offset) => {
    const time = nowMs - (6 - offset) * DAY_MS;
    return { key: `d-${offset}`, day: localParts(time).day, label: new Date(time).toLocaleDateString("tr-TR", { weekday: "short", timeZone: ZONE }) };
  });
  const dailyTrend = days.map((item) => ({ key: item.key, label: item.label, count: times.filter((time) => localParts(time).day === item.day).length }));
  const hourStart = nowMs - (nowMs % 3600000);
  const hourlyTrend = Array.from({ length: 24 }, (_, offset) => {
    const from = hourStart - (23 - offset) * 3600000;
    return { key: `h-${offset}`, label: `${String(localParts(from).hour).padStart(2, "0")}:00`, count: times.filter((time) => time >= from && time < from + 3600000).length };
  });
  const inWindow = (from, to) => times.filter((time) => time >= from && time < to).length;

  const spent = live.map((detail) => Number(detail.timeSpent)).filter((value) => value > 0);
  const average = spent.length ? spent.reduce((sum, value) => sum + value, 0) / spent.length : null;
  const decided = live.filter((detail) => detail.reviewedAt && [2, 3].includes(detail.status));
  const pending = live.filter((detail) => detail.status === 1 || detail.status === 5).sort((a, b) => at(a.submittedAt) - at(b.submittedAt));
  const byReviewer = new Map();
  decided.forEach((detail) => {
    const id = detail.reviewer?.id;
    if (!id) return;
    const row = byReviewer.get(id) ?? { user: detail.reviewer, decisions: 0 };
    row.decisions += 1;
    byReviewer.set(id, row);
  });

  return {
    totalResponses: live.length,
    pendingCount: reviewed ? pending.length : 0,
    approvedCount: reviewed ? live.filter((detail) => detail.status === 2).length : 0,
    rejectedCount: reviewed ? live.filter((detail) => detail.status === 3).length : 0,
    averageCompletionTime: average == null ? null : Math.round(average),
    medianCompletionTime: spent.length ? Math.round(median(spent)) : null,
    flaggedCount: reviewed ? live.filter((detail) => detail.status === 5).length : 0,
    dailyTrendPercentage: trendChange(inWindow(nowMs - 7 * DAY_MS, nowMs), inWindow(nowMs - 14 * DAY_MS, nowMs - 7 * DAY_MS)),
    hourlyTrendPercentage: trendChange(inWindow(nowMs - DAY_MS, nowMs), inWindow(nowMs - 2 * DAY_MS, nowMs - DAY_MS)),
    sourceBreakdown: { registered: live.filter((detail) => detail.user).length, anonymous: live.filter((detail) => !detail.user).length },
    dailyTrend,
    hourlyTrend,
    channels: channelsOf(form, live, reviewed, nowMs),
    lifetime: lifetimeOf(live, form.demo?.closesAt ?? form.closesAt ?? null, nowMs),
    review: reviewed ? {
      decidedCount: decided.length,
      medianDecisionSeconds: decided.length ? Math.round(median(decided.map((detail) => (at(detail.reviewedAt) - at(detail.submittedAt)) / 1000))) : null,
      oldestPending: pending[0] ? { responseId: pending[0].id, submittedAt: pending[0].submittedAt, user: pending[0].user } : null,
      reviewers: [...byReviewer.values()].sort((a, b) => b.decisions - a.decisions),
    } : null,
  };
}

export function weeklyService(nowMs = Date.now()) {
  const weekMs = 7 * DAY_MS;
  const forms = [3, 5, 2, 6, 4, 7, 5, 1];
  const responses = [96, 141, 88, 173, 120, 204, 186, 52];
  const labelOf = (index) => new Date(nowMs - (7 - index) * weekMs).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", timeZone: ZONE });
  return {
    totalForms: 46,
    totalResponsesReceived: 1271,
    pendingResponsesCount: 63,
    formsWeeklyTrendPercentage: 9.1,
    responsesWeeklyTrendPercentage: 14.6,
    formsCreatedWeeklyTrend: forms.map((count, index) => ({ key: `fw-${7 - index}`, label: labelOf(index), count })),
    responsesWeeklyTrend: responses.map((count, index) => ({ key: `rw-${7 - index}`, label: labelOf(index), count })),
  };
}
