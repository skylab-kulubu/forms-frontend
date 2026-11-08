"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { Check, PencilLine, RotateCcw, Trash2 } from "lucide-react";
import { formatDay } from "@/lib/form-timing";
import { BoardNote, EASE, EASE_CLASS, placeBoardNotes } from "./StudioBoard";
import { useStudio } from "./StudioContext";
import { useComments, useStudioSession } from "./StudioSession";
import { PresenceAvatar, firstName, useStudioPresence } from "./StudioPresence";
import StudioSheet from "./StudioSheet";

const DISARM_MS = 3000;
const NOTICE_MS = 5000;
const MAX_COMMENT_LENGTH = 2000;
const COMMENT_KEY_PREFIX = "comment:";

function nameOf(user) {
  return user?.fullName?.trim() || user?.firstName?.trim() || "Editör";
}

function whenOf(value) {
  const minutes = Math.floor((Date.now() - new Date(value).getTime()) / 60000);
  if (minutes < 1) return "şimdi";
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce`;
  return hours < 48 ? "dün" : formatDay(value);
}

function grow(element) {
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

export function useCommentBoard({ formId, fields, selectedIds, phoneViewport }) {
  const session = useStudioSession();
  const { ui, actions: studio } = useStudio();
  const { threads, news } = useComments(session, formId);
  const { open, active, draftFor, compose, showResolved } = ui.comments;
  const onBoard = open && !phoneViewport;

  const order = useMemo(() => new Map(fields.map((field, index) => [field.id, index])), [fields]);
  const placed = useMemo(
    () => threads.filter((thread) => order.has(thread.fieldId)).sort((a, b) => order.get(a.fieldId) - order.get(b.fieldId)),
    [threads, order],
  );
  const openThreads = useMemo(() => placed.filter((thread) => !thread.resolvedAt), [placed]);
  const counts = useMemo(() => {
    const map = new Map();
    openThreads.forEach((thread) => map.set(thread.fieldId, (map.get(thread.fieldId) ?? 0) + 1));
    return map;
  }, [openThreads]);

  const openThreadsRef = useRef(openThreads);
  const selectedField = selectedIds.length === 1 ? selectedIds[0] : null;
  const activeThread = threads.find((thread) => thread.id === active) ?? null;

  useEffect(() => {
    openThreadsRef.current = openThreads;
  });

  const unreadThreads = useMemo(() => new Set(news.map((item) => item.threadId)), [news]);
  const unreadFields = useMemo(() => new Set(news.map((item) => item.fieldId)), [news]);

  useEffect(() => {
    if (open && active && unreadThreads.has(active)) session.comments.seen(formId, active);
  }, [open, active, unreadThreads, session, formId]);

  useEffect(() => {
    if (!open || (selectedField && draftFor === selectedField)) return;
    if (activeThread && activeThread.fieldId === selectedField) return;
    const next = openThreads.find((thread) => thread.fieldId === selectedField)?.id ?? null;
    if (next !== active || draftFor) studio.focusComment(next);
  }, [open, selectedField, draftFor, activeThread, openThreads, active, studio]);

  const openFor = useCallback((fieldId) => {
    const thread = openThreadsRef.current.find((item) => item.fieldId === fieldId);
    studio.select({ kind: "fields", ids: [fieldId] });
    studio.openComments(thread ? { active: thread.id, compose: true } : { draftFor: fieldId, compose: true });
  }, [studio]);

  const focusThread = useCallback((thread) => {
    studio.select({ kind: "fields", ids: [thread.fieldId] });
    studio.focusComment(thread.id, true);
  }, [studio]);

  return {
    session, formId, open, onBoard, phoneViewport, active, draftFor, compose, showResolved, counts, news, unreadThreads, unreadFields,
    activeField: draftFor ?? activeThread?.fieldId ?? null,
    shown: showResolved ? placed : openThreads,
    openCount: openThreads.length,
    resolvedCount: placed.length - openThreads.length,
    openFor, focusThread,
  };
}

function Composer({ initial = "", placeholder, typingKey, autoFocus = false, onSubmit, onCancel }) {
  const ref = useRef(null);
  const { actions: studio } = useStudio();
  const [text, setText] = useState(initial);

  useEffect(() => {
    if (ref.current) grow(ref.current);
    if (autoFocus) ref.current?.focus({ preventScroll: true });
  }, [autoFocus]);

  const submit = () => {
    const body = text.trim();
    if (!body) return;
    setText("");
    if (ref.current) ref.current.style.height = "auto";
    onSubmit(body).catch(() => setText(body));
  };

  return (
    <textarea ref={ref} rows={1} value={text} maxLength={MAX_COMMENT_LENGTH} data-typing-key={typingKey} placeholder={placeholder} aria-label={placeholder}
      onChange={(event) => {
        setText(event.target.value);
        grow(event.target);
      }}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => {
        event.stopPropagation();
        if (event.key === "Escape") {
          if (onCancel) onCancel();
          else studio.closeComments();
          return;
        }
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          submit();
        }
      }}
      className="block max-h-32 w-full resize-none overflow-y-auto bg-transparent pb-1.25 pt-0.75 text-xs leading-[17px] text-neutral-100 shadow-[inset_0_-1px_0_rgba(255,255,255,0.1)] outline-none transition-shadow duration-150 placeholder:text-neutral-600 focus:shadow-[inset_0_-1px_0_rgba(235,213,238,0.6)]"
    />
  );
}

function CommentMessage({ comment, canEdit, canDelete, guard, board }) {
  const [editing, setEditing] = useState(false);
  const [armed, setArmed] = useState(false);
  const name = nameOf(comment.author);

  useEffect(() => {
    if (!armed) return undefined;
    const timer = setTimeout(() => setArmed(false), DISARM_MS);
    return () => clearTimeout(timer);
  }, [armed]);

  const remove = () => {
    if (!armed) {
      setArmed(true);
      return;
    }
    guard(board.session.deleteComment(board.formId, comment.id)).catch(() => {});
  };

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE }} className="group/msg flex gap-2">
      <PresenceAvatar member={{ userId: comment.author?.id, name }} small />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-2xs leading-4 text-neutral-600">
          <span className="min-w-0 truncate font-medium text-neutral-100">{name}</span>
          <span className="shrink-0">{whenOf(comment.createdAt)}{comment.editedAt ? " · düzenlendi" : ""}</span>
          <span className={`ml-auto flex shrink-0 items-center gap-1 transition-opacity duration-150 focus-within:opacity-100 group-hover/msg:opacity-100 ${armed ? "opacity-100" : "opacity-0"}`}>
            {canEdit && !editing ? (
              <button type="button" title="Düzenle" aria-label="Yorumu düzenle" onClick={() => setEditing(true)} className="text-neutral-600 transition-colors hover:text-neutral-100"><PencilLine size={11} /></button>
            ) : null}
            {canDelete ? (
              <button type="button" title={armed ? "Silmek için tekrar tıkla" : "Sil"} aria-label="Yorumu sil" onClick={remove} className={`transition-colors ${armed ? "text-red-300" : "text-neutral-600 hover:text-neutral-100"}`}>
                {armed ? <span className="text-3xs">Silinsin mi?</span> : <Trash2 size={11} />}
              </button>
            ) : null}
          </span>
        </p>
        {editing ? (
          <Composer initial={comment.body} placeholder="Yorumu düzenle, Enter kaydeder" autoFocus onCancel={() => setEditing(false)}
            onSubmit={(body) => guard(board.session.editComment(board.formId, comment.id, body)).then(() => setEditing(false))}
          />
        ) : (
          <p className="mt-px whitespace-pre-wrap text-xs leading-[17px] text-neutral-200 wrap-anywhere">{comment.body}</p>
        )}
      </div>
    </motion.div>
  );
}

function ThreadShell({ fieldId, focused, index, inline, onClick, onResize, children, line = null }) {
  return (
    <BoardNote anchor={fieldId} focused={focused} index={index} inline={inline} onResize={onResize} onClick={onClick}
      line={line ?? (focused ? "bg-skylab-400" : "bg-skylab-400/30 group-hover/note:bg-skylab-400/55")} className={focused ? "" : "cursor-pointer"}
    >
      {children}
    </BoardNote>
  );
}

function Fold({ open, children }) {
  return (
    <div className={`grid transition-[grid-template-rows,opacity] duration-300 ${EASE_CLASS} ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
      <div className="relative min-h-0 overflow-hidden" inert={!open}>{children}</div>
    </div>
  );
}

function CommentThread({ thread, index, focused, inline, label, board, userId, canWrite, isOwner, guard, onResize }) {
  const presence = useStudioPresence();
  const listRef = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const unread = board.unreadThreads.has(thread.id);
  const typingKey = `${COMMENT_KEY_PREFIX}${thread.id}`;
  const typing = presence.members.find((member) => member.editing === typingKey) ?? null;
  const last = thread.comments[thread.comments.length - 1];
  const replies = thread.comments.length - 1;
  const lastName = typing ? typing.name : nameOf(last?.author);

  useLayoutEffect(() => {
    const list = listRef.current;
    if (focused && list) list.scrollTop = list.scrollHeight;
  }, [focused, thread.comments.length]);

  return (
    <ThreadShell fieldId={thread.fieldId} focused={focused} index={index} inline={inline} onResize={onResize}
      onClick={(event) => {
        event.stopPropagation();
        if (!focused) board.focusThread(thread);
      }}
    >
      <div className={thread.resolvedAt ? "opacity-55" : ""}>
        {label ? <p className="mb-1.5 truncate text-3xs text-neutral-500">{label}</p> : null}
        <Fold open={!focused}>
          <div className="flex min-w-0 items-center gap-2 py-px">
            <PresenceAvatar member={{ userId: typing?.userId ?? last?.author?.id, name: lastName }} small />
            <span className={`min-w-0 flex-1 truncate text-xs leading-[17px] ${unread ? "text-neutral-200" : "text-neutral-400"}`}>
              <span className={`mr-1.5 ${unread ? "font-semibold text-neutral-50" : "font-medium text-neutral-200"}`}>{firstName(lastName)}</span>
              {typing ? "yazıyor" : last?.body}
            </span>
            {unread ? <span className="shrink-0 rounded-full bg-skylab-400 px-1.5 text-3xs font-semibold leading-4 text-neutral-950">yeni</span>
              : replies > 0 ? <span className="shrink-0 text-3xs tabular-nums text-neutral-600">{replies} cevap</span> : null}
          </div>
        </Fold>
        <Fold open={focused}>
          <div ref={listRef} onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 2)}
            className={`flex flex-col gap-2.5 overflow-y-auto overscroll-contain pr-1 scrollbar ${inline ? "" : "max-h-[max(9rem,calc(var(--anchor-h,26rem)-4.75rem))]"} ${scrolled ? "mask-[linear-gradient(to_bottom,transparent,black_18px)]" : ""}`}
          >
            {thread.comments.map((comment) => (
              <CommentMessage key={comment.id} comment={comment} board={board} guard={guard}
                canEdit={canWrite && comment.author?.id === userId} canDelete={canWrite && (comment.author?.id === userId || isOwner)}
              />
            ))}
          </div>
          {typing ? <p className="mt-2 text-2xs text-neutral-400">{firstName(typing.name)} yazıyor</p> : null}
          {canWrite ? (
            <div className="mt-2 flex items-start gap-1.5">
              <div className="min-w-0 flex-1">
                {thread.resolvedAt ? (
                  <p className="py-0.5 text-2xs text-neutral-500">Çözüldü{thread.resolvedBy ? ` · ${firstName(nameOf(thread.resolvedBy))}` : ""}</p>
                ) : (
                  <Composer placeholder="Cevap yaz, Enter gönderir" typingKey={typingKey} autoFocus={focused && board.compose}
                    onSubmit={(body) => guard(board.session.replyThread(board.formId, thread.id, body))}
                  />
                )}
              </div>
              <button type="button" title={thread.resolvedAt ? "Yeniden aç" : "Çözüldü"} aria-label={thread.resolvedAt ? "Yorumu yeniden aç" : "Yorumu çöz"}
                onClick={(event) => {
                  event.stopPropagation();
                  guard(board.session.resolveThread(board.formId, thread.id, !thread.resolvedAt)).catch(() => {});
                }}
                className="grid size-5 shrink-0 place-items-center text-neutral-600 transition-colors hover:text-neutral-100"
              >
                {thread.resolvedAt ? <RotateCcw size={13} /> : <Check size={14} />}
              </button>
            </div>
          ) : null}
        </Fold>
      </div>
    </ThreadShell>
  );
}

function DraftThread({ fieldId, index, inline, label, board, guard, onResize }) {
  const { actions: studio } = useStudio();

  return (
    <ThreadShell fieldId={fieldId} focused index={index} inline={inline} onResize={onResize} onClick={(event) => event.stopPropagation()}>
      {label ? <p className="mb-1.5 truncate text-3xs text-neutral-500">{label}</p> : null}
      <Composer placeholder="Yorum yaz, Enter gönderir" autoFocus={board.compose} onCancel={() => studio.focusComment(null)}
        onSubmit={(body) => guard(board.session.startThread(board.formId, fieldId, body)).then((thread) => studio.focusComment(thread.id, true))}
      />
    </ThreadShell>
  );
}

function useGuard() {
  const { actions: studio } = useStudio();
  return useCallback((promise) => promise.catch((error) => {
    studio.toast(error?.message ?? "Yorum kaydedilemedi", "red");
    throw error;
  }), [studio]);
}

export function CommentNotice({ board, numbers }) {
  const latest = board.news[board.news.length - 1] ?? null;
  const [closedId, setClosedId] = useState(null);
  const watching = Boolean(latest) && board.open && board.active === latest.threadId;
  const visible = Boolean(latest) && latest.commentId !== closedId && !watching;
  const more = board.news.length - 1;

  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(() => setClosedId(latest.commentId), NOTICE_MS);
    return () => clearTimeout(timer);
  }, [visible, latest]);

  const show = () => {
    setClosedId(latest.commentId);
    board.openFor(latest.fieldId);
    document.querySelector(`[data-studio-page] [data-fid="${CSS.escape(latest.fieldId)}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });
  };

  const name = latest ? nameOf(latest.author) : "";
  const number = latest ? numbers.get(latest.fieldId) : null;

  return (
    <AnimatePresence>
      {visible ? (
        <motion.button key={latest.commentId} type="button" onClick={show} onPointerDown={(event) => event.stopPropagation()}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } }} exit={{ opacity: 0, y: 4, transition: { duration: 0.15 } }}
          className="absolute bottom-17 left-1/2 z-30 flex w-[min(21rem,calc(100%-2rem))] -translate-x-1/2 gap-2.5 rounded-xl border border-white/10 bg-[#1e1e1e] py-2.5 pl-3 pr-3.5 text-left shadow-2xl shadow-black/50 sm:bottom-19"
        >
          <span className="w-0.5 shrink-0 self-stretch rounded-full bg-skylab-400" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1.5 text-2xs leading-4 text-neutral-500">
              <PresenceAvatar member={{ userId: latest.author?.id, name }} small />
              <span className="min-w-0 truncate font-medium text-neutral-100">{name}</span>
              <span className="shrink-0">{number ? `${number}. soruya yorum yazdı` : "yorum yazdı"}</span>
            </span>
            <span className="mt-1 line-clamp-2 block text-xs leading-[17px] text-neutral-300">{latest.body}</span>
            <span className="mt-1.5 block text-3xs text-skylab-300">{more > 0 ? `Göster · ${more} yeni yorum daha` : "Göster"}</span>
          </span>
        </motion.button>
      ) : null}
    </AnimatePresence>
  );
}

export function CommentSide({ board, sideRef, columnRef, fields, userId, canWrite, isOwner }) {
  const { actions: studio } = useStudio();
  const guard = useGuard();
  const resolvedRef = useRef(null);

  const layout = useCallback(() => {
    const side = sideRef.current;
    const column = columnRef.current;
    if (!side || !column) return;
    const bottom = placeBoardNotes(side, column, (id) => column.querySelector(`[data-fid="${CSS.escape(id)}"]`));
    if (resolvedRef.current) resolvedRef.current.style.top = `${bottom}px`;
  }, [sideRef, columnRef]);

  useLayoutEffect(layout);

  useEffect(() => {
    const column = columnRef.current;
    if (!column) return undefined;
    const observer = new ResizeObserver(layout);
    observer.observe(column);
    return () => observer.disconnect();
  }, [columnRef, layout]);

  const hint = board.onBoard && board.shown.length === 0 && !board.draftFor;

  return (
    <div ref={sideRef} data-comment-side className="pointer-events-none absolute top-0 z-20">
      <MotionConfig reducedMotion="user">
        <AnimatePresence onExitComplete={layout}>
          {board.onBoard ? board.shown.map((thread, index) => (
            <CommentThread key={thread.id} thread={thread} index={index} focused={board.active === thread.id} board={board} userId={userId}
              canWrite={canWrite} isOwner={isOwner} guard={guard} onResize={layout}
            />
          )) : null}
          {board.onBoard && board.draftFor ? <DraftThread key="draft" fieldId={board.draftFor} index={0} board={board} guard={guard} onResize={layout} /> : null}
          {hint && fields[0] ? (
            <ThreadShell key="hint" fieldId={fields[0].id} focused={false} index={0} line="bg-white/15" onResize={layout}>
              <p className="text-2xs leading-4 text-neutral-500">Henüz yorum yok. Bir sorunun sağ kenarına gelip artıya tıklayarak başlarsın.</p>
            </ThreadShell>
          ) : null}
        </AnimatePresence>
      </MotionConfig>
      {board.onBoard && board.resolvedCount > 0 ? (
        <button ref={resolvedRef} type="button" onClick={studio.toggleResolvedComments}
          className={`pointer-events-auto absolute left-3.5 py-0.5 text-2xs text-neutral-500 transition-[top,color] duration-300 hover:text-neutral-200 ${EASE_CLASS}`}
        >
          {board.showResolved ? "Çözülenleri gizle" : `Çözülenleri göster (${board.resolvedCount})`}
        </button>
      ) : null}
    </div>
  );
}

export function CommentSheet({ board, fields, numbers, userId, canWrite, isOwner }) {
  const { actions: studio } = useStudio();
  const guard = useGuard();
  const labelOf = (fieldId) => {
    const field = fields.find((item) => item.id === fieldId);
    const number = numbers.get(fieldId);
    const title = field?.props?.question || field?.props?.title || "";
    return number ? `${number}. soru · ${title}` : title;
  };

  return (
    <StudioSheet open={board.open && board.phoneViewport} onClose={studio.closeComments} label="Yorumlar"
      header={<p className="px-4 pb-2 text-sm font-semibold text-neutral-200">Yorumlar</p>}
    >
      <div className="min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain px-4 pb-6 pt-2 scrollbar">
        <AnimatePresence initial={false}>
          {board.shown.map((thread, index) => (
            <CommentThread key={thread.id} thread={thread} index={index} focused={board.active === thread.id} inline label={labelOf(thread.fieldId)} board={board}
              userId={userId} canWrite={canWrite} isOwner={isOwner} guard={guard}
            />
          ))}
          {board.draftFor ? <DraftThread key="draft" fieldId={board.draftFor} index={0} inline label={labelOf(board.draftFor)} board={board} guard={guard} /> : null}
        </AnimatePresence>
        {board.shown.length === 0 && !board.draftFor ? <p className="text-2xs text-neutral-500">Henüz yorum yok.</p> : null}
        {board.resolvedCount > 0 ? (
          <button type="button" onClick={studio.toggleResolvedComments} className="text-2xs text-neutral-500 transition-colors hover:text-neutral-200">
            {board.showResolved ? "Çözülenleri gizle" : `Çözülenleri göster (${board.resolvedCount})`}
          </button>
        ) : null}
      </div>
    </StudioSheet>
  );
}
