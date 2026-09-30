export const JOURNEY_STATUS = {
  SUBMITTED: "submitted",
  APPROVED: "approved",
  DECLINED: "declined",
  IN_REVIEW: "inReview",
  CURRENT: "current",
  UPCOMING: "upcoming",
};

export function journeyRoute(workflow) {
  if (!Array.isArray(workflow?.route)) return [];
  return [...workflow.route].sort((a, b) => a.stage - b.stage);
}

export function hasJourney(workflow) {
  return journeyRoute(workflow).length > 0;
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

export function journeyTimeline(workflow, { phase = "status", arrived = false } = {}) {
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
      case JOURNEY_STATUS.CURRENT:
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
