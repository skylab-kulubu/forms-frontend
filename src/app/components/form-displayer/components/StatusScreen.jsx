"use client";

import { motion } from "framer-motion";
import { FileCheck, FileClock, FileLock2, FilePenLine, FileSearchCorner, FileX, FileXCorner } from "lucide-react";
import { loginWithKeycloak } from "@/lib/authActions";
import { formatJourneyDate, hasJourney, journeyTimeline, singleResponseTimeline } from "@/lib/workflow-journey";
import { formatLongDate } from "@/lib/form-timing";
import LoginButton from "../../utils/LoginButton";
import JourneyTimeline, { ReviewNote } from "./JourneyTimeline";

const REPORT_MAILTO = "mailto:info@yildizskylab.com?subject=Skylab%20Forms%20-%20Sorun%20Bildirimi";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "/";

const ICON_TONE = {
  ok: "text-emerald-400",
  wait: "text-amber-400",
  bad: "text-red-300",
  brand: "text-skylab-300",
  neutral: "text-neutral-300",
};

export function FooterMark() {
  return (
    <div className="mt-10 flex items-center gap-1.5 text-2xs text-neutral-600">
      <img src="/skylab.svg" alt="" className="size-3.5 opacity-70" />
      <span>SKY LAB Forms</span>
    </div>
  );
}

function StageContext({ workflow, stage }) {
  if (workflow?.title && stage > 0) return <>{workflow.title} · <span className="text-skylab-300">{stage}. adım</span></>;
  if (workflow?.title) return workflow.title;
  if (stage > 0) return <span className="text-skylab-300">{stage}. adım</span>;
  return null;
}

function attemptTimeline(attempt, last) {
  const started = attempt?.startedAt
    ? { key: "started", tone: "done", title: "Görevi başlattınız", date: formatJourneyDate(attempt.startedAt, { withTime: true }) }
    : null;

  return [started, { key: "ended", title: "Süre doldu", date: formatJourneyDate(attempt?.deadlineAt, { withTime: true }), ...last }].filter(Boolean);
}

function buildScreen({ state, message, stage, startFormId, workflow, formTitle, submittedAt, reviewNote, reviewedAt, isWorkflow, isAuthed, isLastRun, attempt, closesAt }) {
  const journey = hasJourney(workflow);
  const workflowContext = <StageContext workflow={workflow} stage={0} />;
  const reviewDate = formatJourneyDate(reviewedAt, { withTime: true });
  const fallbackNote = !journey && reviewNote ? { note: reviewNote, date: reviewDate } : null;
  const single = { state, submittedAt, reviewedAt, reviewNote, isAuthed };
  const timedContext = journey ? <StageContext workflow={workflow} stage={stage} /> : formTitle;
  const nextFormId = attempt?.nextFormId ?? null;
  const nextAction = nextFormId ? { label: "Sonraki adıma geç", onClick: () => window.location.assign(`/${nextFormId}`) } : null;
  const nextTimeline = (options = {}) => journeyTimeline(workflow, nextFormId ? { ...options, phase: "intro" } : options);

  switch (state) {
    case "timeUp":
      return {
        Icon: FileClock, tone: "wait", context: timedContext, title: "Süreniz doldu",
        description: "O ana kadarki cevaplarınız ekibe iletildi. Ekip inceleyip sonucu e-postayla bildirecek.",
        timeline: journey
          ? journeyTimeline(workflow, { current: { tone: "review", detail: "Süre doldu · ekip inceliyor" } })
          : attemptTimeline(attempt, { tone: "review", detail: "Cevaplarınız ekibe iletildi · inceleniyor" }),
      };
    case "timeUpEmpty":
      return {
        Icon: FileClock, tone: "neutral", context: timedContext, title: "Süreniz doldu",
        description: journey
          ? "Süre dolduğunda cevap girilmemişti, teslim kaydedilmedi."
          : "Süre dolduğunda cevap girilmemişti, teslim kaydedilmedi. Ekip gerekirse sürenizi uzatabilir.",
        timeline: journey ? nextTimeline() : attemptTimeline(attempt, { tone: "paused", detail: "Teslim yok" }),
        action: nextAction,
      };
    case "timeUpClosed":
      return {
        Icon: FileX, tone: "bad", context: timedContext, title: "Teslim kaydedilmedi",
        description: "Süre dolduğunda teslim tamamlanmamıştı; ekip bu adımı teslim yok olarak kapattı.",
        timeline: journey ? nextTimeline() : attemptTimeline(attempt, { tone: "declined", detail: "Teslim yok" }),
        action: nextAction,
      };
    case "startClosed":
      return {
        Icon: FileLock2, tone: "neutral", context: formTitle, title: "Görev artık başlatılamıyor",
        description: closesAt ? `Son başlama saati ${formatLongDate(closesAt)} idi.` : "Son başlama saati geçti.",
      };
    case "formClosed":
      return {
        Icon: FileLock2, tone: "neutral", context: formTitle, title: "Form kapandı",
        description: closesAt
          ? `Bu form ${formatLongDate(closesAt)} itibarıyla kendiliğinden kapandı. Yeni cevap alınmıyor.`
          : "Bu form kapanış saatinde kendiliğinden kapandı. Yeni cevap alınmıyor.",
      };
    case "completed":
      return {
        Icon: FileCheck, tone: "ok", context: formTitle, title: "Cevabınız kaydedildi",
        description: submittedAt ? `Gönderildi · ${formatJourneyDate(submittedAt, { withTime: true })}` : null,
      };
    case "pending":
      if (isWorkflow) {
        return journey
          ? { Icon: FileClock, tone: "wait", context: <StageContext workflow={workflow} stage={stage} />, title: "Başvurunuz inceleniyor", timeline: journeyTimeline(workflow) }
          : { Icon: FileClock, tone: "wait", context: <StageContext workflow={workflow} stage={stage} />, title: "Başvurunuz inceleniyor", description: "Sonucu e-postayla bildireceğiz." };
      }
      return { Icon: FileClock, tone: "wait", context: formTitle, title: "Cevabınız inceleniyor", timeline: singleResponseTimeline(single) };
    case "approved":
      return { Icon: FileCheck, tone: "ok", context: formTitle, title: "Cevabınız onaylandı", timeline: singleResponseTimeline(single) };
    case "declined":
      if (isWorkflow) {
        return {
          Icon: FileX, tone: "neutral", context: journey ? workflowContext : <StageContext workflow={workflow} stage={stage} />,
          title: isLastRun ? "Son başvurunuz kabul edilmedi" : "Başvurunuz kabul edilmedi", timeline: journey ? journeyTimeline(workflow) : null, note: fallbackNote,
        };
      }
      return { Icon: FileX, tone: "neutral", context: formTitle, title: "Cevabınız kabul edilmedi", timeline: singleResponseTimeline(single) };
    case "fullyCompleted":
      return {
        Icon: FileCheck, tone: "ok", context: workflowContext, title: isLastRun ? "Son başvurunuz tamamlandı" : "Başvurunuz tamamlandı",
        timeline: journey ? journeyTimeline(workflow) : null,
        description: journey ? null : "Başvurunun bütün adımları tamamlandı.",
        note: fallbackNote,
      };
    case "requiresParent":
      return {
        Icon: FilePenLine, tone: "neutral", context: workflowContext, title: "Bu form başvurunun ilerleyen bir adımı",
        description: stage > 0 ? "Başvurunuz şu an başka bir adımda; kaldığınız yerden devam edebilirsiniz." : "Başvuruya ilk adımdan başlamanız gerekiyor.",
        action: startFormId ? { label: stage > 0 ? "Kaldığım yere git" : "Başvuruya başla", onClick: () => window.location.assign(`/${startFormId}`) } : null,
      };
    case "workflowPaused":
      return {
        Icon: FileClock, tone: "neutral", context: journey ? workflowContext : <StageContext workflow={workflow} stage={stage} />,
        title: "Başvurular geçici olarak durduruldu",
        description: "Başvurunuz kayıtlı. Başvurular yeniden açılınca kaldığınız yerden devam edebilirsiniz.",
        timeline: journey ? journeyTimeline(workflow) : null,
      };
    case "newRunsClosed":
      return { Icon: FileLock2, tone: "neutral", context: workflow?.title ?? formTitle, title: "Yeni başvuru alınmıyor", description: "Bu başvuru şu an yeni başvuru kabul etmiyor." };
    case "workflowClosed":
      return { Icon: FileLock2, tone: "neutral", context: workflow?.title ?? formTitle, title: "Başvurular kapalı", description: "Bu başvuru şu an kapalı." };
    case "faulted":
      return {
        Icon: FileXCorner, tone: "bad", context: <StageContext workflow={workflow} stage={stage} />, title: "Başvurunuz sıradaki adıma aktarılamadı",
        description: "Bu sizden kaynaklanan bir sorun değil. Lütfen bize bildirin.",
        action: { label: "Sorun bildir", onClick: () => window.location.assign(REPORT_MAILTO) },
      };
    case "rejected":
      return { Icon: FileXCorner, tone: "neutral", context: formTitle, title: "Cevabınız gönderilemedi", description: message || "Bu form şu anda yeni bir cevap kabul etmiyor." };
    case "notFound":
      return {
        Icon: FileSearchCorner, tone: "neutral", title: "Form bulunamadı", description: "Bağlantı hatalı olabilir ya da form kaldırılmış olabilir.",
        link: { label: "Ana sayfaya git", href: SITE_URL },
      };
    case "notAvailable":
      return { Icon: FileLock2, tone: "neutral", context: formTitle, title: "Form şu an cevap almıyor", description: "Form sahibi cevap almayı durdurmuş ya da formun süresi dolmuş olabilir." };
    case "unAuthorized":
      return {
        Icon: FileLock2, tone: "brand", context: formTitle, title: "Giriş yapmanız gerekiyor", description: "Bu form E-Skylab hesabıyla dolduruluyor.",
        action: { label: "E-Skylab ile giriş yap", hoverIcon: "skylab", onClick: () => loginWithKeycloak(window.location.href) },
      };
    case "notAuthorized":
      return { Icon: FileLock2, tone: "neutral", context: formTitle, title: "Bu forma erişiminiz yok", description: "Formu görüntüleme yetkiniz bulunmuyor." };
    default:
      return {
        Icon: FileXCorner, tone: "bad", title: "Bir hata oluştu", description: "Sayfayı yenileyip tekrar deneyin. Sorun sürerse bize bildirin.",
        action: { label: "Yenile", onClick: () => window.location.reload() },
        link: { label: "Sorun bildir", href: REPORT_MAILTO },
      };
  }
}

export default function StatusScreen({ onRerun = null, ...props }) {
  const base = buildScreen({ ...props, isLastRun: Boolean(onRerun) });
  const screen = onRerun ? { ...base, action: { label: "Yeniden başvur", onClick: onRerun }, hint: "Yeni başvuru ilk adımdan başlar." } : base;
  const { Icon } = screen;

  return (
    <motion.div className="relative z-10 flex min-h-full w-full flex-col items-center px-5 pb-7 pt-14"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12, transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] } }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="flex w-full max-w-104 flex-col items-center text-center">
          <Icon className={`size-8 ${ICON_TONE[screen.tone] ?? ICON_TONE.neutral}`} strokeWidth={1.6} />
          {screen.context && <p className="mt-4.5 text-xs text-neutral-500">{screen.context}</p>}
          <h1 className="mt-1.5 text-balance text-xl font-semibold tracking-tight text-neutral-50">{screen.title}</h1>
          {screen.description && <p className="mt-2 max-w-96 text-balance text-sm leading-relaxed text-neutral-400">{screen.description}</p>}
          <JourneyTimeline items={screen.timeline} className="mt-7" />
          {screen.note && <ReviewNote note={screen.note.note} date={screen.note.date} className="mt-5.5 w-full max-w-88 pl-3" />}
          {(screen.action || screen.link) && (
            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-4.5 gap-y-2.5">
              {screen.action && <LoginButton onClick={screen.action.onClick} label={screen.action.label} hoverIcon={screen.action.hoverIcon ?? "arrow"} />}
              {screen.link && (
                <a href={screen.link.href} className="text-xs text-neutral-300 underline decoration-white/20 underline-offset-3 transition-colors hover:text-neutral-100 hover:decoration-white/50">
                  {screen.link.label}
                </a>
              )}
            </div>
          )}
          {screen.hint && <p className="mt-2.5 text-xs text-neutral-500">{screen.hint}</p>}
        </div>
      </div>
      <FooterMark />
    </motion.div>
  );
}
