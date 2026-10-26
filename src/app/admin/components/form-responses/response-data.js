import { ATTEMPT_STATUS, ROW_STATUS, STATUS_FILTERS, attemptKindOf, rowKindOf, statusFilterParams } from "@/lib/attempt-status";
import { isDeletedUser } from "@/lib/deleted-user";

export const PROVISIONAL = 4;
export const FLAGGED = 5;
export const RETURNED = 6;

export const FILTER_DEFAULTS = { sort: "desc", status: "all", who: "all", time: "all", archived: false };

const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export const formatPersonName = (name) =>
  name?.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map((word) => word.replace(/^\p{L}/u, (c) => c.toLocaleUpperCase("tr-TR"))).join(" ") || "";

export function personOf(source) {
  const guest = source?.guest;
  const raw = source?.user?.fullName || (guest ? `${guest.firstName ?? ""} ${guest.lastName ?? ""}`.trim() : "");
  const userId = source?.user?.id ?? null;
  return {
    name: formatPersonName(raw) || "Anonim Kullanıcı",
    known: Boolean(raw),
    email: source?.user?.email || guest?.email || "",
    id: userId && !isDeletedUser(userId) ? userId : null,
    photoUrl: source?.user?.profilePictureUrl || null,
  };
}

export function searchKey(search) {
  return (search ?? "").trim().toLocaleLowerCase("tr-TR");
}

export function matchesSearch(row, query) {
  if (!query) return true;
  const person = personOf(row);
  return `${person.name} ${person.email}`.toLocaleLowerCase("tr-TR").includes(query);
}

export function noteOf(detail) {
  return detail?.reviewDescription || detail?.reviewerNote || "";
}

export function isAttemptRow(row) {
  return row?.status == null && Boolean(row?.attempt);
}

export function rowTarget(row) {
  return isAttemptRow(row) ? { responseId: row.attempt.id, attempt: true } : { responseId: row.id, attempt: false };
}

export function rowMatches(row, route) {
  const target = rowTarget(row);
  return Boolean(route?.responseId) && target.attempt === Boolean(route.attempt) && String(target.responseId).toLowerCase() === String(route.responseId).toLowerCase();
}

export function rowKind(row) {
  return rowKindOf(row);
}

export function kindOfDetail(detail, isAttempt) {
  if (isAttempt) return attemptKindOf(detail?.attempt);
  if (Number(detail?.status) === PROVISIONAL && detail?.attempt?.status === ATTEMPT_STATUS.NO_SUBMISSION) return "none";
  return rowKindOf({ status: detail?.status ?? 0 });
}

export function statusView(kind) {
  return ROW_STATUS[kind] ?? ROW_STATUS.submitted;
}

export function listParams(filters, page) {
  const status = statusFilterParams(filters.status);
  return {
    page,
    status: status.status ?? null,
    attemptStatus: status.attemptStatus ?? null,
    time: filters.time === "all" ? null : filters.time,
    responderType: filters.who === "registered" ? 1 : filters.who === "anonymous" ? 2 : 0,
    showArchived: Boolean(filters.archived),
    sortingDirection: filters.sort === "asc" ? "ascending" : "descending",
  };
}

export function statusFilterOf(value) {
  return STATUS_FILTERS.find((item) => item.value === value) ?? STATUS_FILTERS[0];
}

export function answerKey(answer) {
  return answer == null ? "" : String(answer).trim();
}

export function isEmptyAnswer(answer) {
  const text = answerKey(answer);
  return text === "" || text === "[]" || text === "{}" || text === "null";
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export function choiceItems(field, answer) {
  if (isEmptyAnswer(answer)) return { selected: [], extra: [] };
  const choices = Array.isArray(field?.props?.choices) ? field.props.choices.map(String) : [];
  const text = answerKey(answer);
  const parsed = text.startsWith("[") ? parseJson(text) : undefined;
  if (Array.isArray(parsed)) {
    const items = parsed.map((item) => String(item).trim()).filter(Boolean);
    return { selected: choices.filter((choice) => items.includes(choice)), extra: items.filter((item) => !choices.includes(item)) };
  }
  let rest = `, ${text}, `;
  const selected = [];
  [...choices].sort((a, b) => b.length - a.length).forEach((choice) => {
    const token = `, ${choice}, `;
    if (rest.includes(token)) {
      selected.push(choice);
      rest = rest.replace(token, ", ");
    }
  });
  const extra = rest.split(",").map((item) => item.trim()).filter(Boolean);
  return { selected: choices.filter((choice) => selected.includes(choice)), extra };
}

export function matrixOf(answer) {
  if (isEmptyAnswer(answer)) return {};
  if (typeof answer === "object") return answer ?? {};
  const parsed = parseJson(String(answer));
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

export function recordsOf(answer) {
  if (isEmptyAnswer(answer)) return [];
  if (Array.isArray(answer)) return answer;
  const parsed = parseJson(String(answer));
  return Array.isArray(parsed) ? parsed : [];
}

export function formatAnswerDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""));
  if (!match) return String(value ?? "");
  return `${Number(match[3])} ${MONTHS[Number(match[2]) - 1] ?? match[2]} ${match[1]}`;
}

export function plainAnswer(field, answer) {
  if (isEmptyAnswer(answer)) return "Cevap yok";
  const type = field?.type;
  if (type === "multi_choice") {
    const { selected, extra } = choiceItems(field, answer);
    const items = [...selected, ...extra];
    return items.length ? items.join(", ") : answerKey(answer);
  }
  if (type === "matrix") return Object.entries(matrixOf(answer)).map(([row, column]) => `${row}: ${column}`).join(" · ");
  if (type === "date") return formatAnswerDate(answer);
  return answerKey(answer);
}

function numericOf(field) {
  return field?.type === "slider" || field?.props?.inputType === "number";
}

export function conditionMet(condition, answers, fieldsById) {
  if (!condition?.fieldId) return true;
  const source = fieldsById.get(condition.fieldId);
  const raw = answers.get(condition.fieldId);
  const text = answerKey(raw);
  const empty = isEmptyAnswer(raw);
  const { operator } = condition;
  const target = String(condition.value ?? "");

  if (operator === "is_set") return !empty;
  if (operator === "is_empty") return empty;
  if (empty) return false;

  if (source?.type === "toggle") {
    if (operator === "is_true") return text === (source.props?.trueLabel || "Evet");
    if (operator === "is_false") return text === (source.props?.falseLabel || "Hayır");
  }
  if (operator === "is_true") return text === "true";
  if (operator === "is_false") return text === "false";

  if (source?.type === "multi_choice") {
    const { selected, extra } = choiceItems(source, raw);
    const items = [...selected, ...extra];
    if (operator === "equals") return items.includes(target);
    if (operator === "not_equals") return !items.includes(target);
  }

  if (numericOf(source)) {
    const number = Number(text);
    const value = Number(target);
    if (operator === "equals") return number === value;
    if (operator === "not_equals") return number !== value;
    if (operator === "greater_than") return number > value;
    if (operator === "less_than") return number < value;
  }

  switch (operator) {
    case "equals": return text === target;
    case "not_equals": return text !== target;
    case "contains": return text.toLocaleLowerCase("tr-TR").includes(target.toLocaleLowerCase("tr-TR"));
    case "before": return text < target;
    case "after": return text > target;
    case "greater_than": return Number(text) > Number(target);
    case "less_than": return Number(text) < Number(target);
    default: return true;
  }
}

export function hiddenByCondition(field, answers, fieldsById) {
  return Boolean(field?.condition?.fieldId) && isEmptyAnswer(answers.get(field.id)) && !conditionMet(field.condition, answers, fieldsById);
}

export function describeRoute(route, decision) {
  if (!route) return null;
  if (route.endsFlow) return decision === 2 ? "Başvuru tamamlanır" : "Başvuru sonlanır";
  return `${route.formTitle || "Sonraki adım"} adımı açılır`;
}

export function shortWhen(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const startOfDay = (item) => new Date(item.getFullYear(), item.getMonth(), item.getDate());
  const days = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (days === 0) return date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  if (days === 1) return "Dün";
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatDateTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()} ${date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}`;
}

export function formatDayMonth(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function formatSpent(seconds) {
  if (seconds === null || seconds === undefined) return "--";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.round(seconds % 60);
  if (minutes === 0) return `${rest} sn`;
  return rest ? `${minutes} dk ${rest} sn` : `${minutes} dk`;
}

export function stepKeyOf(step) {
  return `${step.stage}:${step.round ?? 1}`;
}
