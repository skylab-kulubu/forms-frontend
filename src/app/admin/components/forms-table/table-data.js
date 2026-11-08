import { isDeletedUser } from "@/lib/deleted-user";
import { effectiveFormSettings } from "@/lib/form-settings";
import { currentTime } from "@/lib/form-timing";
import { workflowEditHref } from "@/lib/workflow-links";
import { formatUpdatedAt } from "../ListItem";
import { sameId } from "../form-room/room-flow";
import { formatPersonName } from "../form-responses/response-data";
import { finishedTotal } from "../workflow-page/journey-data";

export const PAGE_SIZE = 20;

const MINUTE = 60_000;
const DAY = 86_400_000;
const SOON_DAYS = 14;

export const STATE_TABS = [
  { id: "all", label: "Tümü" },
  { id: "pending", label: "Bekleyen" },
  { id: "open", label: "Açık" },
  { id: "draft", label: "Taslak" },
  { id: "closed", label: "Kapalı" },
];

export const TABLE_COLUMNS = [
  { id: "owner", label: "Sahip", sizes: { 5: "8rem", 6: "minmax(8.5rem,1fr)" } },
  { id: "updated", label: "Güncellendi", sizes: { 4: "6.5rem" } },
  { id: "last", label: "Son cevap", sizes: { 4: "5.5rem" }, off: true },
  { id: "role", label: "Yetki", sizes: { 5: "1.25rem", 6: "6.5rem" } },
  { id: "pending", label: "Bekleyen", sizes: { 2: "4rem" } },
  { id: "responses", label: "Cevap", sizes: { 2: "3.5rem" } },
  { id: "week", label: "7 gün", sizes: { 4: "6rem", 6: "7rem" } },
];

const ACTION_SIZES = { 0: "1.75rem", 2: "3.75rem", 4: "8rem" };
const GRID_STEPS = [0, 2, 4, 5, 6];

function sizeAt(sizes, step) {
  const reached = Object.keys(sizes).map(Number).filter((key) => key <= step);
  return reached.length ? sizes[Math.max(...reached)] : null;
}

export const defaultHidden = () => new Set(TABLE_COLUMNS.filter((column) => column.off).map((column) => column.id));

export function isDefaultHidden(hidden) {
  const base = defaultHidden();
  return hidden.size === base.size && [...hidden].every((id) => base.has(id));
}

export function gridVars(hidden) {
  const columns = TABLE_COLUMNS.filter((column) => !hidden.has(column.id));
  return Object.fromEntries(GRID_STEPS.map((step) => {
    const form = step === 6 && !hidden.has("owner") ? "minmax(0,24rem)" : "minmax(0,1fr)";
    const data = columns.map((column) => sizeAt(column.sizes, step)).filter(Boolean);
    return [`--table-${step}`, ["1.5rem", form, ...data, sizeAt(ACTION_SIZES, step)].join(" ")];
  }));
}

export function agoText(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const minutes = Math.floor((currentTime() - date.getTime()) / MINUTE);
  if (minutes < 1) return "az önce";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days} gün önce` : formatUpdatedAt(value);
}

export function closingText(value) {
  if (!value) return null;
  const minutes = Math.round((new Date(value).getTime() - currentTime()) / MINUTE);
  if (minutes <= 0) return null;
  const days = Math.floor(minutes / 1440);
  if (days >= 1) return `${days} gün sonra kapanıyor`;
  const hours = Math.floor(minutes / 60);
  return hours >= 1 ? `${hours} sa sonra kapanıyor` : `${minutes} dk sonra kapanıyor`;
}

const timeOf = (value) => (value ? new Date(value).getTime() : 0);
const sumOf = (days) => days.reduce((total, value) => total + value, 0);
const latestOf = (values) => values.filter(Boolean).sort((a, b) => timeOf(a) - timeOf(b)).pop() ?? null;
const isDraft = (form) => Number(form.publishedVersion ?? 1) === 0;
const stepsOf = (flow) => (flow?.runs?.steps ?? []).filter((step) => !step.isRemoved);

function groupForms(forms, flows) {
  const entries = [];
  const seen = new Map();

  forms.forEach((form) => {
    const flowId = form.workflow?.id;
    if (!flowId) {
      entries.push({ kind: "form", form });
      return;
    }
    let entry = seen.get(flowId);
    if (!entry) {
      const flow = flows.find((item) => sameId(item.id, flowId)) ?? null;
      entry = { kind: "flow", id: flowId, name: flow?.name || form.workflow.name || "Adsız akış", flow, forms: [] };
      seen.set(flowId, entry);
      entries.push(entry);
    }
    entry.forms.push(form);
  });

  entries.forEach((entry) => {
    if (entry.kind !== "flow") return;
    const order = stepsOf(entry.flow).map((step) => String(step.formId).toLowerCase());
    const rank = (form) => {
      const index = order.indexOf(String(form.id).toLowerCase());
      return index < 0 ? order.length : index;
    };
    entry.forms.sort((a, b) => rank(a) - rank(b));
  });

  return entries;
}

function ownerNameOf(owner) {
  if (isDeletedUser(owner?.id)) return "Silinmiş kullanıcı";
  return formatPersonName(owner?.fullName) || owner?.email || "Adsız kullanıcı";
}

function formRow(form, extra = {}) {
  const draft = isDraft(form);
  const base = `/admin/forms/${form.id}`;
  return {
    kind: "form",
    key: form.id,
    title: form.title || "Adsız form",
    href: draft ? `${base}/edit` : base,
    editHref: `${base}/edit`,
    responsesHref: draft ? null : `${base}/responses`,
    reviewHref: `${base}/responses?status=pending`,
    details: draft ? null : form,
    form,
    draft,
    role: Number(form.userRole),
    owner: form.createdBy ?? null,
    ownerName: ownerNameOf(form.createdBy),
    pending: form.pendingCount ?? 0,
    responses: form.responseCount ?? 0,
    days: form.last7Days ?? [],
    lastAt: form.lastResponseAt ?? null,
    closesAt: form.closesAt ?? null,
    updatedAt: form.updatedAt ?? form.createdAt ?? null,
    ...extra,
  };
}

function flowRow(entry) {
  const start = entry.forms.find((form) => form.workflow?.isStart) ?? entry.forms[0];
  const draft = entry.flow ? !entry.flow.publishedVersion : isDraft(start);
  const waiting = entry.forms.find((form) => (form.pendingCount ?? 0) > 0);
  const editHref = entry.flow ? workflowEditHref(entry.flow) : `/admin/forms/${start.id}/edit`;
  return {
    ...formRow(start),
    kind: "flow",
    key: `flow-${entry.id}`,
    title: entry.name,
    href: draft ? editHref : `/admin/workflows/${entry.id}`,
    editHref,
    responsesHref: null,
    reviewHref: waiting ? `/admin/forms/${waiting.id}/responses?status=pending` : null,
    details: draft ? null : start,
    draft,
    pending: entry.flow?.runs?.awaitingReviewCount ?? entry.forms.reduce((sum, form) => sum + (form.pendingCount ?? 0), 0),
    lastAt: latestOf(entry.forms.map((form) => form.lastResponseAt)),
    updatedAt: latestOf([entry.flow?.updatedAt, ...entry.forms.map((form) => form.updatedAt)]),
    flow: entry.flow,
    steps: entry.forms.map((form) => formRow(form)),
  };
}

export function columnsOf(row) {
  const steps = stepsOf(row.flow);
  const items = steps.length
    ? steps.map((step) => ({ key: step.nodeKey, title: step.formTitle, href: `/admin/forms/${step.formId}`, depth: step.depth ?? 1, people: step.count ?? 0, waiting: step.awaitingReview ?? 0 }))
    : row.steps.map((step, index) => ({ key: step.key, title: step.title, href: step.href, depth: index + 1, people: null, waiting: step.pending }));
  const depths = [...new Set(items.map((item) => item.depth))].sort((a, b) => a - b);
  const columns = depths.map((depth, index) => items.filter((item) => item.depth === depth).map((item) => ({ ...item, number: index + 1 })));
  return { columns, done: finishedTotal(row.flow?.runs?.finished) };
}

const statusRank = (row) => (row.draft ? 0 : effectiveFormSettings(row.form).isOpen ? 2 : 1);

const METRICS = {
  status: statusRank,
  week: (row) => sumOf(row.days),
  pending: (row) => row.pending,
  responses: (row) => row.responses,
  updatedAt: (row) => timeOf(row.updatedAt),
  lastAt: (row) => timeOf(row.lastAt),
  role: (row) => row.role,
};

export function closingNote(row) {
  if (!row.closesAt || row.draft) return null;
  const left = new Date(row.closesAt).getTime() - currentTime();
  if (left <= 0 || left > SOON_DAYS * DAY) return null;
  return closingText(row.closesAt).replace(" sonra kapanıyor", " kaldı");
}

export function matchesTab(row, tab) {
  if (tab === "pending") return row.pending > 0;
  if (tab === "draft") return statusRank(row) === 0;
  if (tab === "open") return statusRank(row) === 2;
  if (tab === "closed") return statusRank(row) === 1;
  return true;
}

export function tabCounts(rows) {
  return Object.fromEntries(STATE_TABS.map(({ id }) => [id, rows.filter((row) => matchesTab(row, id)).length]));
}

export function buildRows({ forms, flows, flat, sortField, sortValue }) {
  const rows = flat
    ? forms.map((form) => formRow(form, { flowName: form.workflow?.name ?? null }))
    : groupForms(forms, flows).map((entry) => (entry.kind === "flow" ? flowRow(entry) : formRow(entry.form)));

  const value = METRICS[sortField] ?? METRICS.updatedAt;
  const sign = sortValue === "asc" ? 1 : -1;
  const compare = sortField === "owner" ? (a, b) => a.ownerName.localeCompare(b.ownerName, "tr") : (a, b) => value(a) - value(b);
  const sorted = [...rows].sort((a, b) => sign * compare(a, b) || a.title.localeCompare(b.title, "tr"));
  const peak = Math.max(1, ...rows.flatMap((row) => [...row.days, ...(row.steps ?? []).flatMap((step) => step.days)]));

  return { rows: sorted, peak };
}
