import { WORKFLOW_INTAKE } from "@/lib/form-settings";
import { formatDay, isPastDate, leftText } from "@/lib/form-timing";
import { TRIGGER, triggersForNode } from "../workflow-editor/workflow-graph";

export const RUN_STATE = {
  0: { label: "Aday bekleniyor", dot: "bg-neutral-500", text: "text-neutral-300" },
  1: { label: "Süre işliyor", dot: "bg-amber-400", text: "text-amber-100/80" },
  2: { label: "Düzeltme istendi", dot: "bg-sky-400", text: "text-sky-200" },
  3: { label: "Onay bekliyor", dot: "bg-amber-400", text: "text-amber-200" },
  4: { label: "Tamamlandı", dot: "bg-emerald-400", text: "text-emerald-300" },
  5: { label: "Elendi", dot: "bg-red-400", text: "text-red-300" },
  6: { label: "Süre doldu", dot: "bg-amber-600", text: "text-amber-200/70" },
  7: { label: "Geçersiz sayıldı", dot: "bg-neutral-600", text: "text-neutral-400" },
  8: { label: "Durdu", dot: "bg-neutral-500", text: "text-neutral-400" },
};

export const GROUPS = [["awaitingReview", 3], ["revisionRequested", 2], ["timerRunning", 1], ["awaitingApplicant", 0]];
export const GROUP_KEY = Object.fromEntries(GROUPS.map(([key, state]) => [state, key]));
export const FINISHED_ROWS = [["completed", 4], ["declined", 5], ["timedOut", 6], ["voided", 7], ["stopped", 8]];
export const RUN_TABS = [[0, "Devam eden"], [1, "Onay bekleyen"], [2, "Bitenler"]];
export const PAGE_SIZE = 20;
export const STEP_PEOPLE = 24;
export const STROKE = "rgba(52,211,153,0.5)";
export const NEUTRAL_STROKE = "#595959";

export function payloadOf(data) {
  return data?.data ?? data ?? null;
}

export function finishedTotal(finished) {
  return FINISHED_ROWS.reduce((sum, [key]) => sum + (finished?.[key] ?? 0), 0);
}

export function intakeOf(workflow) {
  const intake = Number(workflow?.intake ?? WORKFLOW_INTAKE.OPEN);
  return intake === WORKFLOW_INTAKE.OPEN && workflow?.intakeClosesAt && isPastDate(workflow.intakeClosesAt) ? WORKFLOW_INTAKE.NEW_RUNS_CLOSED : intake;
}

export function intakePill(workflow) {
  const archived = Number(workflow?.status) === 2;
  const live = Boolean(workflow?.published);
  const intake = intakeOf(workflow);
  if (archived) return { label: "Arşivde", tone: "neutral", dot: "bg-neutral-500" };
  if (!live) return { label: "Taslak", tone: "neutral", dot: "bg-neutral-500" };
  if (intake === WORKFLOW_INTAKE.CLOSED) return { label: "Kapalı", tone: "red", dot: "bg-red-400" };
  if (intake === WORKFLOW_INTAKE.NEW_RUNS_CLOSED) return { label: "Yeni başvuru kapalı", tone: "amber", dot: "bg-amber-400" };
  return { label: "Açık", tone: "emerald", dot: "bg-emerald-400" };
}

export function publishedVersion(versions) {
  return (versions ?? []).find((version) => Number(version.status) === 1) ?? null;
}

export function possessive(value) {
  const number = Math.abs(Math.round(Number(value) || 0));
  if (number === 0) return "'ı";
  const ones = number % 10;
  const tens = Math.floor(number / 10) % 10;
  if (ones) return ["", "'i", "'si", "'ü", "'ü", "'i", "'sı", "'si", "'i", "'u"][ones];
  if (tens) return ["", "'u", "'si", "'u", "'ı", "'si", "'ı", "'i", "'i", "'ı"][tens];
  return number % 1000 === 0 ? "'i" : "'ü";
}

export function elapsed(value) {
  if (!value) return "—";
  const minutes = Math.max(1, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa`;
  return `${Math.floor(hours / 24)} gün`;
}

export function remainingText(deadlineAt) {
  return leftText(new Date(deadlineAt).getTime() - Date.now());
}

export function runSubtitle(run) {
  const state = Number(run.state);
  const round = Number(run.round) > 1 ? `${run.round}. gönderim · ` : "";
  if (state === 3) return `${round}${elapsed(run.stepStartedAt)} önce gönderdi`;
  if (state === 1) return run.deadlineAt ? remainingText(run.deadlineAt) : "Süre işliyor";
  if (state === 2) return `Düzeltme ${elapsed(run.stepStartedAt)} önce istendi`;
  if (state === 0) return `Adım ${elapsed(run.stepStartedAt)} önce açıldı`;
  return `${RUN_STATE[state]?.label ?? "Bitti"}${run.completedAt ? ` · ${formatDay(run.completedAt)}` : ""}`;
}

export function shortDurationText(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest} dk`;
  return rest ? `${hours} sa ${rest} dk` : `${hours} saat`;
}

export function endTriggerOf(node, transitions) {
  const routed = (trigger) => transitions.some((transition) => transition.sourceNodeKey === node.nodeKey && Number(transition.trigger) === trigger && transition.targetNodeKey);
  return triggersForNode(node, transitions).find((trigger) => (trigger === TRIGGER.APPROVED || trigger === TRIGGER.SUBMITTED) && !routed(trigger)) ?? null;
}
