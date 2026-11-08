import { COMPONENTS } from "@/app/components/form-registry";

export const PAGE_SIZE = 20;

const TYPES = new Map(COMPONENTS.map((item) => [item.type, item]));

export const typeOf = (field) => TYPES.get(field?.type) ?? null;

export const isQuestion = (field) => field?.type !== "separator";

export const fold = (value) => String(value ?? "").toLocaleLowerCase("tr-TR");

export const labelOf = (field) => field?.props?.question?.trim() || typeOf(field)?.label || "Adsız soru";

const timeOf = (value) => (value ? new Date(value).getTime() : 0);

export function rowOf(template) {
  const schema = Array.isArray(template?.schema) ? template.schema : [];
  const questions = schema.filter(isQuestion);
  return {
    key: template.id,
    id: template.id,
    title: template.title?.trim() || "Adsız şablon",
    description: template.description?.trim() || "",
    schema,
    questions,
    count: questions.length,
    required: questions.filter((field) => field.props?.required).length,
    updatedAt: template.updatedAt ?? template.createdAt ?? null,
    createdAt: template.createdAt ?? null,
    href: `/admin/templates/${template.id}`,
    template,
  };
}

export function matchOf(row, query) {
  const needle = fold(query.trim());
  if (!needle) return { hit: true, questions: new Set() };
  const questions = new Set(row.questions.filter((field) => fold(labelOf(field)).includes(needle)).map((field) => field.id));
  const hit = fold(row.title).includes(needle) || fold(row.description).includes(needle) || questions.size > 0;
  return { hit, questions };
}

export function previewOf(row, matched) {
  const items = row.questions.map((field) => ({ id: field.id, label: labelOf(field), hit: matched.has(field.id) }));
  return matched.size ? [...items.filter((item) => item.hit), ...items.filter((item) => !item.hit)] : items;
}

const METRICS = {
  updatedAt: (row) => timeOf(row.updatedAt),
  count: (row) => row.count,
};

export function sortRows(rows, field, direction) {
  const sign = direction === "asc" ? 1 : -1;
  const compare = field === "title"
    ? (a, b) => a.title.localeCompare(b.title, "tr")
    : (a, b) => (METRICS[field] ?? METRICS.updatedAt)(a) - (METRICS[field] ?? METRICS.updatedAt)(b);
  return [...rows].sort((a, b) => sign * compare(a, b) || a.title.localeCompare(b.title, "tr"));
}

const COPY_SUFFIX = / \(kopya(?: \d+)?\)$/;

export function copyTitle(title, titles, limit = 100) {
  const base = title.replace(COPY_SUFFIX, "");
  const named = (suffix) => `${base.slice(0, limit - suffix.length)}${suffix}`;
  if (!titles.has(named(" (kopya)"))) return named(" (kopya)");
  let index = 2;
  while (titles.has(named(` (kopya ${index})`))) index += 1;
  return named(` (kopya ${index})`);
}
