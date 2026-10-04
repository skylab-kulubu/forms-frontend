"use client";

import { Fragment, useState } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { Clock, RotateCcw, UserRound, UserRoundX } from "lucide-react";
import { sanitizeFormHtml } from "@/app/components/rich-text/sanitizeHtml";
import { loginWithKeycloak } from "@/lib/authActions";

const LINK_BUTTON = "underline underline-offset-3 transition-colors";

function formatDraftTime(savedAt) {
  if (!savedAt) return null;
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return null;
  const day = date.toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  const time = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
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

      {children && <div className="mt-3.5 flex flex-col gap-1.5 empty:hidden">{children}</div>}
    </div>
  );
}

export function HeaderNote({ icon: Icon, children }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-neutral-400">
      <Icon size={13} className="shrink-0 text-neutral-500" />
      {children}
    </div>
  );
}

function useLoginPrompt(hasAnswers) {
  const [confirming, setConfirming] = useState(false);
  const login = () => loginWithKeycloak(window.location.href);

  return {
    confirming,
    request: () => (hasAnswers ? setConfirming(true) : login()),
    confirm: login,
    cancel: () => setConfirming(false),
  };
}

function LoginConfirm({ prompt }) {
  return (
    <>
      <span className="text-neutral-300">Girişe giderseniz yazdığınız cevaplar silinir.</span>
      <button type="button" onClick={prompt.confirm} className={`${LINK_BUTTON} text-red-300 decoration-red-300/35 hover:decoration-red-300/80`}>
        Yine de giriş yap
      </button>
      <button type="button" onClick={prompt.cancel} className={`${LINK_BUTTON} text-neutral-300 decoration-white/20 hover:text-neutral-100 hover:decoration-white/50`}>
        Vazgeç
      </button>
    </>
  );
}

export function AnonymousNotice({ hasAnswers }) {
  const { status } = useSession();
  const prompt = useLoginPrompt(hasAnswers);

  if (status !== "unauthenticated") return null;

  return (
    <HeaderNote icon={UserRoundX}>
      {prompt.confirming ? <LoginConfirm prompt={prompt} /> : (
        <>
          <span>Anonim yanıtlıyorsunuz. Giriş yaparsanız cevaplarınız taslak olarak kaydedilir.</span>
          <button type="button" onClick={prompt.request}
            className={`${LINK_BUTTON} text-neutral-300 decoration-white/20 hover:text-neutral-100 hover:decoration-white/50`}
          >
            Giriş yap
          </button>
        </>
      )}
    </HeaderNote>
  );
}

export function DraftNotice({ savedAt, onDiscard }) {
  const [confirming, setConfirming] = useState(false);
  const time = formatDraftTime(savedAt);

  return (
    <motion.div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-neutral-400"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
    >
      <RotateCcw size={13} className="shrink-0 text-neutral-500" />
      {confirming ? (
        <>
          <span>Bütün cevaplarınız silinecek.</span>
          <button type="button" onClick={() => { setConfirming(false); onDiscard(); }}
            className={`${LINK_BUTTON} text-red-300 decoration-red-300/35 hover:decoration-red-300/80`}
          >
            Sil
          </button>
          <button type="button" onClick={() => setConfirming(false)}
            className={`${LINK_BUTTON} text-neutral-300 decoration-white/20 hover:text-neutral-100 hover:decoration-white/50`}
          >
            Vazgeç
          </button>
        </>
      ) : (
        <>
          <span>
            Kaldığınız yerden devam ediyorsunuz
            {time && <span className="text-neutral-500"> · taslak {time}</span>}
          </span>
          <button type="button" onClick={() => setConfirming(true)}
            className={`${LINK_BUTTON} text-neutral-300 decoration-white/20 hover:text-neutral-100 hover:decoration-white/50`}
          >
            Baştan başla
          </button>
        </>
      )}
    </motion.div>
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

export function NextStepNote({ text }) {
  if (!text) return null;

  return (
    <div className="min-w-0 max-w-104">
      <p className="text-2xs text-neutral-500">Gönderdikten sonra</p>
      <p className="mt-0.5 text-xs leading-5 text-neutral-300">{text}</p>
    </div>
  );
}

export function RespondentLine({ savedAt, hasAnswers = false }) {
  const { data: session, status } = useSession();
  const prompt = useLoginPrompt(hasAnswers);

  if (status === "loading") return null;

  const isAuthed = status === "authenticated";
  const user = session?.user;
  const fullName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Kullanıcı";
  const savedTime = savedAt ? savedAt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : null;

  if (!isAuthed && prompt.confirming) {
    return (
      <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-neutral-500">
        <UserRoundX size={12} className="shrink-0" />
        <LoginConfirm prompt={prompt} />
      </p>
    );
  }

  return (
    <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-neutral-500">
      <span className="inline-flex items-center gap-1.5">
        {isAuthed ? <UserRound size={12} className="shrink-0" /> : <UserRoundX size={12} className="shrink-0" />}
        {isAuthed
          ? <span><span className="text-neutral-300">{fullName}</span> olarak yanıtlıyorsunuz</span>
          : <span>Anonim olarak yanıtlıyorsunuz</span>}
      </span>
      {!isAuthed && (
        <>
          <span className="text-neutral-700">·</span>
          <span>Taslak kaydedilmiyor</span>
          <button type="button" onClick={prompt.request}
            className={`${LINK_BUTTON} text-neutral-300 decoration-white/20 hover:text-neutral-100 hover:decoration-white/50`}
          >
            Giriş yap
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
  );
}
