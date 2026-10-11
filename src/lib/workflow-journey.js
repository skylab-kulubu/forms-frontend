export const JOURNEY_STATUS = {
  SUBMITTED: "submitted",
  APPROVED: "approved",
  DECLINED: "declined",
  IN_REVIEW: "inReview",
  CURRENT: "current",
  UPCOMING: "upcoming",
  TIMED_OUT: "timedOut",
};

export function journeyRoute(workflow) {
  if (!Array.isArray(workflow?.route)) return [];
  return [...workflow.route].sort((a, b) => a.stage - b.stage);
}

export function hasJourney(workflow) {
  return journeyRoute(workflow).length > 0;
}

export function stepBarModel(workflow, stage) {
  const route = journeyRoute(workflow);
  const current = Math.max(1, Number(stage) || 1);

  if (!route.length) {
    return { segments: [...Array(current - 1).fill("done"), "current"], tail: true, stage: current, total: null, uncertain: false };
  }

  const segments = route.map((item) => {
    if (item.status === JOURNEY_STATUS.CURRENT || item.status === JOURNEY_STATUS.IN_REVIEW) return "current";
    if (item.status === JOURNEY_STATUS.UPCOMING) return item.certain ? "next" : "maybe";
    return "done";
  });

  const total = Math.max(route.length, Number(workflow.maxSteps) || 0);
  while (segments.length < total) segments.push("maybe");

  const currentItem = route.find((item) => item.status === JOURNEY_STATUS.CURRENT);

  return { segments, tail: false, stage: currentItem?.stage ?? current, total, uncertain: segments.includes("maybe") };
}

export function nextStepCopy({ workflow, isWorkflow, requiresManualReview, isAuthed }) {
  if (!isWorkflow) {
    if (!requiresManualReview) return null;
    return isAuthed ? "Cevabınızı ekip inceleyecek. Sonucu e-postayla bildireceğiz." : "Cevabınızı ekip inceleyecek.";
  }

  const route = journeyRoute(workflow);
  const index = route.findIndex((item) => item.status === JOURNEY_STATUS.CURRENT);
  if (index < 0) return null;

  const current = route[index];
  const next = route[index + 1] ?? null;
  const mayContinue = Boolean(next) || (Number(workflow.maxSteps) || 0) > index + 1;

  if (current.requiresManualReview) {
    if (!mayContinue) return "Ekip cevaplarınızı inceleyecek. Bu, başvurunun son adımı; sonucu e-postayla bildireceğiz.";
    if (!next?.certain) return "Ekip cevaplarınızı inceleyecek; sonucu e-postayla bildireceğiz.";
    return "Ekip cevaplarınızı inceleyecek. Onaylanırsa sıradaki adımın bağlantısı e-postanıza gelir.";
  }

  if (!mayContinue) return "Bu, başvurunun son adımı.";
  if (!next?.certain) return "Cevaplarınıza göre sıradaki adım bu sayfada açılabilir.";
  return "Gönderince sıradaki adım bu sayfada açılır.";
}

export function formatJourneyDate(value, { withTime = false } = {}) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const now = new Date();
  const time = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  if (date.toDateString() === now.toDateString()) return withTime ? `Bugün ${time}` : "Bugün";

  const day = date.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });

  return withTime ? `${day}, ${time}` : day;
}

const withDate = (label, value) => {
  const date = formatJourneyDate(value);
  return date ? `${label} · ${date}` : label;
};

function upcomingDetail(item, previous, phase) {
  if (!item.certain) return "Cevaplarınıza göre açılabilir";

  const directlyNext = previous && (previous.status === JOURNEY_STATUS.CURRENT || previous.status === JOURNEY_STATUS.IN_REVIEW);
  const previousTitle = previous?.formTitle || "Önceki adım";

  if (previous?.requiresManualReview) {
    if (phase === "status" && previous.status === JOURNEY_STATUS.IN_REVIEW) return "Onaylanırsa bağlantısı e-postanıza gelir";
    return directlyNext ? "Onaylanırsa açılır" : `${previousTitle} onaylanırsa açılır`;
  }

  return directlyNext ? "Bu formu gönderince açılır" : `${previousTitle} gönderilince açılır`;
}

export function journeyTimeline(workflow, { phase = "status", arrived = false, current = null } = {}) {
  const route = journeyRoute(workflow);

  return route.map((item, index) => {
    const title = item.formTitle || "Sıradaki adım";
    const date = formatJourneyDate(item.submittedAt);

    switch (item.status) {
      case JOURNEY_STATUS.APPROVED:
        return { key: item.stage, tone: "done", title, date, detail: withDate("Onaylandı", item.reviewedAt), note: item.reviewNote };
      case JOURNEY_STATUS.DECLINED:
        return { key: item.stage, tone: "declined", title, date, detail: withDate("Kabul edilmedi", item.reviewedAt), note: item.reviewNote };
      case JOURNEY_STATUS.IN_REVIEW:
        return { key: item.stage, tone: "review", title, date, detail: "Gönderildi · inceleniyor" };
      case JOURNEY_STATUS.TIMED_OUT:
        return { key: item.stage, tone: "declined", title, detail: "Süre doldu · teslim yok" };
      case JOURNEY_STATUS.CURRENT:
        if (current) return { key: item.stage, title, ...current };
        return phase === "intro"
          ? { key: item.stage, tone: "current", number: item.stage, title, detail: arrived ? "Şimdi açılıyor" : "Şimdi dolduracaksınız" }
          : { key: item.stage, tone: "paused", title, detail: "Başvurular açılınca doldurabilirsiniz." };
      case JOURNEY_STATUS.UPCOMING:
        return { key: item.stage, tone: "future", title, detail: upcomingDetail(item, route[index - 1], phase) };
      default:
        return { key: item.stage, tone: "done", title, date, detail: "Gönderildi" };
    }
  });
}

export function singleResponseTimeline({ state, submittedAt, reviewedAt, reviewNote, isAuthed }) {
  const sent = { key: "sent", tone: "done", title: "Gönderildi", date: formatJourneyDate(submittedAt, { withTime: true }) };
  const reviewDate = formatJourneyDate(reviewedAt, { withTime: true });

  switch (state) {
    case "pending":
      return [sent, { key: "review", tone: "review", title: "İnceleniyor", detail: isAuthed ? "Sonucu e-postayla bildireceğiz." : null }];
    case "approved":
      return [sent, { key: "result", tone: "done", title: "Onaylandı", date: reviewDate, note: reviewNote }];
    case "declined":
      return [sent, { key: "result", tone: "declined", title: "Kabul edilmedi", date: reviewDate, note: reviewNote }];
    default:
      return null;
  }
}

const INTRO_KEY = "skyforms:intro";

export function introStorageKey(formId, instanceId) {
  return `${INTRO_KEY}:${instanceId ?? "new"}:${formId}`;
}

export function hasSeenIntro(formId, instanceId) {
  try {
    return localStorage.getItem(introStorageKey(formId, instanceId)) === "1";
  } catch {
    return false;
  }
}

export function markIntroSeen(formId, instanceId) {
  try {
    localStorage.setItem(introStorageKey(formId, instanceId), "1");
  } catch { }
}
