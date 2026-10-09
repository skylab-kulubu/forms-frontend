"use client";

import { createContext, Fragment, useContext, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, LogOut, Mail, TimerOff, UserRound, UserRoundX } from "lucide-react";
import { sanitizeFormHtml } from "@/app/components/rich-text/sanitizeHtml";
import NoticeDock from "@/app/components/utils/NoticeDock";
import LoginButton from "@/app/components/utils/LoginButton";
import { loginWithKeycloak } from "@/lib/authActions";

const LINK_BUTTON = "underline underline-offset-3 transition-colors";
const LINK_NEUTRAL = `${LINK_BUTTON} text-neutral-300 decoration-white/20 hover:text-neutral-100 hover:decoration-white/50`;
const LINK_DANGER = `${LINK_BUTTON} text-red-300 decoration-red-300/35 hover:decoration-red-300/80`;
const NOTE_EASE = [0.22, 1, 0.36, 1];

export const WARNING_SECONDS = 30;

const FALLBACK_AUTH = {
  respondent: "loading",
  user: null,
  allowsAnonymous: true,
  hasGuestFiles: false,
  logoutConfirming: false,
  login: () => loginWithKeycloak(window.location.href),
  requestLogout: () => { },
  confirmLogout: () => { },
  cancelLogout: () => { },
};

export const FormAuthContext = createContext(null);

export function useFormAuth() {
  return useContext(FormAuthContext) ?? FALLBACK_AUTH;
}

export function formatDraftTime(savedAt) {
  if (!savedAt) return null;
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  const time = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
}

function displayName(user) {
  return user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Kullanıcı";
}

function NoteLink({ onClick, danger = false, children }) {
  return (
    <button type="button" onClick={onClick} className={`${danger ? LINK_DANGER : LINK_NEUTRAL} whitespace-nowrap`}>
      {children}
    </button>
  );
}

export function FormDisplayerHeader({ title, description, children }) {
  const hasTitle = typeof title === "string" && title.trim().length > 0;
  const hasDescription = typeof description === "string" && description.trim().length > 0;

  if (!hasTitle && !hasDescription && !children) return null;

  const sanitizedDescription = hasDescription ? sanitizeFormHtml(description) : "";

  return (
    <div className="max-w-2xl px-2 md:px-4">
      {hasTitle && (
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50 sm:text-3xl">
          {title}
        </h1>
      )}

      {hasDescription && (
        <div
          className="mt-3 space-y-2 text-sm leading-relaxed text-neutral-300
            [&_p]:m-0 [&_p+p]:mt-2 [&_strong]:text-neutral-100 [&_em]:text-neutral-300
            [&_a]:text-skylab-300 [&_a]:underline [&_a]:decoration-skylab-300/30 [&_a]:underline-offset-2 [&_a]:wrap-break-word [&_a:hover]:decoration-skylab-300/70
            [&_blockquote]:border-l-2 [&_blockquote]:border-white/10 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-100 [&_blockquote]:italic
            [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
            [&_h1]:text-lg [&_h1]:font-semibold [&_h1]:text-neutral-100
            [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-neutral-100
            [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-neutral-100"
          dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
        />
      )}

      {children && <div className="mt-3.5 flex flex-col gap-2 empty:hidden">{children}</div>}
    </div>
  );
}

export function HeaderNote({ icon: Icon, children }) {
  return (
    <motion.div className="flex items-start gap-2 text-xs leading-5 text-neutral-400"
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, transition: { duration: 0.15, ease: NOTE_EASE } }}
      transition={{ duration: 0.2, ease: NOTE_EASE }}
    >
      <span className="flex h-5 shrink-0 items-center text-neutral-500">
        <Icon size={13} />
      </span>
      <p className="min-w-0 flex-1">{children}</p>
    </motion.div>
  );
}

export function SwapNote({ swapKey, icon, children }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <HeaderNote key={swapKey} icon={icon}>{children}</HeaderNote>
    </AnimatePresence>
  );
}

export function useLoginPrompt() {
  const { login, hasGuestFiles } = useFormAuth();
  const [confirming, setConfirming] = useState(false);

  return {
    confirming,
    request: () => (hasGuestFiles ? setConfirming(true) : login()),
    confirm: login,
    cancel: () => setConfirming(false),
  };
}

export function LoginConfirm({ prompt }) {
  return (
    <>
      <span className="text-neutral-300">Yüklediğiniz dosyaları girişten sonra yeniden yüklemeniz gerekecek.</span>{" "}
      <NoteLink onClick={prompt.confirm} danger>Yine de giriş yap</NoteLink>{" "}
      <NoteLink onClick={prompt.cancel}>Vazgeç</NoteLink>
    </>
  );
}

function identityNoteOf(auth, prompt) {
  const dot = <span className="text-neutral-600"> · </span>;

  if (auth.respondent === "user" && auth.logoutConfirming) {
    return {
      key: "logout", icon: LogOut,
      content: (
        <>
          Çıkınca cevaplarınız ekranda kalsın mı? Taslağınız hesabınızda kayıtlı.{" "}
          <span className="whitespace-nowrap">
            <NoteLink onClick={() => auth.confirmLogout(false)}>Temizle</NoteLink>{dot}
            <NoteLink onClick={() => auth.confirmLogout(true)}>Kalsın</NoteLink>{dot}
            <NoteLink onClick={auth.cancelLogout}>Vazgeç</NoteLink>
          </span>
        </>
      ),
    };
  }
  if (auth.respondent === "user") {
    return {
      key: "user", icon: UserRound,
      content: (
        <>
          <span className="text-neutral-200">{displayName(auth.user)}</span> olarak yanıtlıyorsunuz.{" "}
          <NoteLink onClick={auth.requestLogout}>Çıkış yap</NoteLink>
        </>
      ),
    };
  }
  if (prompt.confirming) return { key: "login", icon: UserRoundX, content: <LoginConfirm prompt={prompt} /> };
  if (auth.respondent === "expired" && auth.allowsAnonymous === false) {
    return {
      key: "expired-locked", icon: TimerOff,
      content: <>Oturumunuzun süresi doldu. Göndermek için yeniden giriş yapın. <NoteLink onClick={prompt.request}>Yeniden giriş yap</NoteLink></>,
    };
  }
  if (auth.respondent === "expired") {
    return {
      key: "expired", icon: UserRoundX,
      content: <>Oturumunuzun süresi doldu, şu an anonim yanıtlıyorsunuz. <NoteLink onClick={prompt.request}>Yeniden giriş yap</NoteLink></>,
    };
  }
  return {
    key: "guest", icon: UserRoundX,
    content: <>Anonim yanıtlıyorsunuz. Giriş yaparsanız cevaplarınız taslak olarak kaydedilir. <NoteLink onClick={prompt.request}>Giriş yap</NoteLink></>,
  };
}

export function IdentityNote() {
  const auth = useFormAuth();
  const prompt = useLoginPrompt();

  if (auth.respondent === "loading") return null;

  const note = identityNoteOf(auth, prompt);
  return <SwapNote swapKey={note.key} icon={note.icon}>{note.content}</SwapNote>;
}

export function RestoreNoticeDock({ icon, duration, onDiscard, onClose, children }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <NoticeDock icon={icon} duration={duration} paused={confirming} onClose={onClose}>
      {confirming ? (
        <>
          Bütün cevaplarınız silinecek.{" "}
          <NoteLink onClick={() => { setConfirming(false); onDiscard(); }} danger>Sil</NoteLink>{" "}
          <NoteLink onClick={() => setConfirming(false)}>Vazgeç</NoteLink>
        </>
      ) : (
        <>
          {children}{" "}
          <NoteLink onClick={() => setConfirming(true)}>Baştan başla</NoteLink>
        </>
      )}
    </NoticeDock>
  );
}

export function MissingFields({ fields, onJump }) {
  return (
    <>
      {fields.length} zorunlu soru boş:{" "}
      {fields.map((field, index) => (
        <Fragment key={field.id}>
          {index > 0 && ", "}
          <button type="button" onClick={() => onJump(field.id)}
            className={`${LINK_BUTTON} text-red-200 decoration-red-200/35 hover:decoration-red-200/80`}
          >
            {field.number}. soru
          </button>
        </Fragment>
      ))}
    </>
  );
}

export function GuestNoticeDock({ notice, onClose, onJump, onRetry = null }) {
  const prompt = useLoginPrompt();
  const action = prompt.confirming ? null
    : notice.login ? <LoginButton onClick={prompt.request} label="Giriş yap" className="shrink-0" />
      : onRetry ? <LoginButton onClick={onRetry} label="Tekrar dene" hoverIcon="arrow" className="shrink-0" />
        : null;

  return (
    <NoticeDock icon={notice.icon} tone={notice.tone} role="alert" onClose={onClose} action={action} duration={WARNING_SECONDS} paused={prompt.confirming}>
      {prompt.confirming ? <LoginConfirm prompt={prompt} /> : (
        <>
          {notice.jump && (
            <button type="button" onClick={() => onJump(notice.jump.id)} className={`${LINK_BUTTON} text-neutral-100 decoration-white/30 hover:decoration-white/70`}>
              {notice.jump.label}
            </button>
          )}
          {notice.text}
        </>
      )}
    </NoticeDock>
  );
}

export function NextStepNote({ text }) {
  if (!text) return null;

  return (
    <div className="min-w-0 max-w-104">
      <p className="text-2xs text-neutral-500">Gönderdikten sonra</p>
      <p className="mt-0.5 text-xs leading-5 text-neutral-300">{text}</p>
    </div>
  );
}

export function CopyEmailNote({ email, className = "mt-1.5" }) {
  return (
    <p className={`${className} flex items-center gap-1.5 text-2xs text-neutral-500`}>
      <Mail size={12} className="shrink-0" />
      <span className="min-w-0">
        Bu formla ilgili e-postalar <span className="break-all text-neutral-200">{email}</span> adresine gönderilecek.
      </span>
    </p>
  );
}

export function RespondentLine({ savedAt, copyEmail = null, compact = false }) {
  const auth = useFormAuth();
  const prompt = useLoginPrompt();

  if (auth.respondent === "loading") return null;

  const isAuthed = auth.respondent === "user";
  const lockedOut = auth.respondent === "expired" && auth.allowsAnonymous === false;
  const loginLabel = auth.respondent === "expired" ? "Yeniden giriş yap" : "Giriş yap";
  const fullName = displayName(auth.user);
  const guestText = lockedOut ? "Oturumunuzun süresi doldu" : "Anonim olarak yanıtlıyorsunuz";
  const savedTime = savedAt ? savedAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : null;

  if (!isAuthed && prompt.confirming) {
    return (
      <p className={`${compact ? "" : "mt-5 "}flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-neutral-500`}>
        <UserRoundX size={12} className="shrink-0" />
        <LoginConfirm prompt={prompt} />
      </p>
    );
  }

  if (compact) {
    return (
      <p className="flex h-4 min-w-0 flex-wrap items-center gap-x-2 overflow-hidden text-2xs text-neutral-500">
        <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
          {isAuthed ? <UserRound size={12} className="shrink-0" /> : <UserRoundX size={12} className="shrink-0" />}
          {isAuthed
            ? <span className="min-w-0 truncate"><span className="text-neutral-300">{fullName}</span> olarak yanıtlıyorsunuz</span>
            : <span className="min-w-0 truncate">{guestText}</span>}
        </span>
        {!isAuthed && (
          <span className="inline-flex items-center gap-x-2 whitespace-nowrap">
            <span className="text-neutral-700">·</span>
            <button type="button" onClick={prompt.request} className={LINK_NEUTRAL}>
              {loginLabel}
            </button>
          </span>
        )}
        {isAuthed && savedTime && (
          <span className="inline-flex items-center gap-x-2 whitespace-nowrap">
            <span className="text-neutral-700">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={11} className="shrink-0" />
              Taslak kaydedildi {savedTime}
            </span>
          </span>
        )}
      </p>
    );
  }

  return (
    <>
      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-neutral-500">
        <span className="inline-flex items-center gap-1.5">
          {isAuthed ? <UserRound size={12} className="shrink-0" /> : <UserRoundX size={12} className="shrink-0" />}
          {isAuthed
            ? <span><span className="text-neutral-300">{fullName}</span> olarak yanıtlıyorsunuz</span>
            : <span>{guestText}</span>}
        </span>
        {!isAuthed && (
          <>
            <span className="text-neutral-700">·</span>
            {!lockedOut && <span>Taslak kaydedilmiyor</span>}
            <button type="button" onClick={prompt.request} className={LINK_NEUTRAL}>
              {loginLabel}
            </button>
          </>
        )}
        {isAuthed && savedTime && (
          <>
            <span className="text-neutral-700">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={11} className="shrink-0" />
              Taslak kaydedildi {savedTime}
            </span>
          </>
        )}
      </p>
      {/* Kayıtlı kullanıcının mailleri hesabındaki adrese gider; formda yazılan adres yalnızca misafirde kullanılır.
          Metin kopyanın bu gönderimde gideceğini vaat etmez: aynı adrese form başına tek kopya ve günlük sınır var. */}
      {!isAuthed && copyEmail && <CopyEmailNote email={copyEmail} />}
    </>
  );
}
