"use client";

import DOMPurify from "isomorphic-dompurify";
import { useSession } from "next-auth/react";
import { UserRoundX, UserRound } from "lucide-react";

export function FormRespondentBadge() {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const user = session?.user;

  if (status === "loading") return null;

  if (!isAuthed) {
    return (
      <div className="flex ml-4 items-center gap-1.5 text-[11px] text-neutral-500 px-1">
        <UserRoundX size={12} className="shrink-0" />
        <span>Anonim olarak yanıtlıyorsunuz</span>
      </div>
    );
  }

  const fullName = user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Kullanıcı";

  return (
    <div className="flex ml-4 items-center gap-1.5 text-[11px] text-neutral-500 px-1">
      <UserRound size={12} className="shrink-0" />
      <span><span className="text-neutral-300">{fullName}</span> olarak yanıtlıyorsunuz</span>
    </div>
  );
}

export function FormDisplayerHeader({ title, description }) {
  const hasTitle = typeof title === "string" && title.trim().length > 0;
  const hasDescription = typeof description === "string" && description.trim().length > 0;

  if (!hasTitle && !hasDescription) return null;

  const sanitizedDescription = hasDescription ? DOMPurify.sanitize(description) : "";

  return (
    <div className="rounded-xl px-4 pb-5 max-w-2xl">
      {hasTitle && (
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">
          {title}
        </h1>
      )}

      {hasDescription && (
        <div
          className="mt-3 text-[11px] leading-relaxed text-neutral-200 space-y-2 opacity-90
            [&_p]:m-0 [&_p+p]:mt-2 [&_strong]:text-neutral-100 [&_em]:text-neutral-300
            [&_blockquote]:border-l-2 [&_blockquote]:border-white/10 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-100 [&_blockquote]:italic
            [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
            [&_h1]:text-[14px] [&_h1]:font-semibold
            [&_h2]:text-[13px] [&_h2]:font-semibold
            [&_h3]:text-[12px] [&_h3]:font-semibold"
          dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
        />
      )}
    </div>
  );
}