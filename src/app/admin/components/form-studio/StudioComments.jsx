"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useIsPresent } from "framer-motion";
import { Check, PencilLine, RotateCcw, Trash2 } from "lucide-react";
import { formatDay } from "@/lib/form-timing";
import { useStudio } from "./StudioContext";
import { useComments, useStudioSession } from "./StudioSession";
import { PresenceAvatar, firstName, useStudioPresence } from "./StudioPresence";
import StudioSheet from "./StudioSheet";

const THREAD_GAP = 16;
const THREAD_WIDTH = 256;
const THREAD_MIN = 200;
const RIGHT_EDGE = 20;
const LEFT_EDGE = 16;
const STACK_GAP = 14;
const BLOCK_INSET = 14;
const RELEASE_DELAY_MS = 70;
const DISARM_MS = 3000;
const MAX_COMMENT_LENGTH = 2000;
const EASE = [0.22, 1, 0.36, 1];
const EASE_CLASS = "ease-[cubic-bezier(0.22,1,0.36,1)]";

const THREAD_MOTION = { hidden: {}, shown: {} };
const LINE_MOTION = {
  hidden: { scaleY: 0, transition: { duration: 0.16, ease: "easeIn", delay: 0.05 } },
  shown: (index) => ({ scaleY: 1, transition: { duration: 0.3, ease: EASE, delay: index * 0.03 } }),
};
const BODY_MOTION = {
  hidden: { opacity: 0, x: -8, transition: { duration: 0.13 } },
  shown: (index) => ({ opacity: 1, x: 0, transition: { duration: 0.3, ease: EASE, delay: 0.07 + index * 0.03 } }),
};

const COMMENT_KEY_PREFIX = "comment:";

function fitBoard(pageWidth, cardWidth) {
  const free = (pageWidth - cardWidth) / 2;
  let missing = Math.max(0, THREAD_WIDTH - (free - THREAD_GAP - RIGHT_EDGE));
  const clear = Math.min(missing, Math.max(0, free - LEFT_EDGE));
  missing -= clear;
  const trim = Math.min(missing, THREAD_WIDTH - THREAD_MIN);
  return { push: Math.round(clear + missing - trim), width: THREAD_WIDTH - trim };
}

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
  const { threads, unseen } = useComments(session, formId);
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

  useEffect(() => {
    if (open && unseen) session.comments.seen(formId);
  }, [open, unseen, session, formId]);

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
    session, formId, open, onBoard, phoneViewport, active, draftFor, compose, showResolved, unseen, counts,
    activeField: draftFor ?? activeThread?.fieldId ?? null,
    shown: showResolved ? placed : openThreads,
    openCount: openThreads.length,
    resolvedCount: placed.length - openThreads.length,
    openFor, focusThread,
  };
}

export function useBoardPush({ onBoard, scrollRef, cardRef, pushRef, sideRef }) {
  const applyFit = useCallback(() => {
    const page = scrollRef.current;
    const card = cardRef.current;
    const push = pushRef.current;
    if (!page || !card || !push) return;
    const fit = fitBoard(page.clientWidth, card.offsetWidth);
    push.style.transform = fit.push ? `translateX(${-fit.push}px)` : "";
    const side = sideRef.current;
    if (!side) return;
    side.style.left = `${card.offsetLeft + card.offsetWidth + THREAD_GAP}px`;
    side.style.width = `${fit.width}px`;
  }, [scrollRef, cardRef, pushRef, sideRef]);

  useLayoutEffect(() => {
    if (!onBoard) return undefined;
    applyFit();
    const observer = new ResizeObserver(applyFit);
    if (scrollRef.current) observer.observe(scrollRef.current);
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [onBoard, applyFit, scrollRef, cardRef]);

  useEffect(() => {
    if (onBoard) return undefined;
    const timer = setTimeout(() => {
      if (pushRef.current) pushRef.current.style.transform = "";
    }, RELEASE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onBoard, pushRef]);
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
  const ref = useRef(null);
  const isPresent = useIsPresent();

  useEffect(() => {
    const element = ref.current;
    if (!element || !onResize) return undefined;
    const observer = new ResizeObserver(onResize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [onResize]);

  return (
    <motion.div ref={ref} data-comment-thread="true" data-field={fieldId} data-focused={focused} data-leaving={!isPresent}
      variants={THREAD_MOTION} initial="hidden" animate="shown" exit="hidden" onClick={onClick}
      className={`group/thread pointer-events-auto pl-3.5 ${inline ? "relative" : `absolute inset-x-0 transition-[top] duration-300 ${EASE_CLASS}`} ${focused ? "" : "cursor-pointer"}`}
    >
      <motion.span variants={LINE_MOTION} custom={index}
        className={`absolute inset-y-0 left-0 w-0.5 origin-top rounded-full transition-colors duration-150 ${line ?? (focused ? "bg-skylab-400" : "bg-skylab-400/30 group-hover/thread:bg-skylab-400/55")}`}
      />
      <motion.div variants={BODY_MOTION} custom={index}>{children}</motion.div>
    </motion.div>
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
  const typingKey = `${COMMENT_KEY_PREFIX}${thread.id}`;
  const typing = presence.members.find((member) => member.editing === typingKey) ?? null;
  const last = thread.comments[thread.comments.length - 1];
  const replies = thread.comments.length - 1;
  const lastName = typing ? typing.name : nameOf(last?.author);

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
            <span className="min-w-0 flex-1 truncate text-xs leading-[17px] text-neutral-400">
              <span className="mr-1.5 font-medium text-neutral-200">{firstName(lastName)}</span>
              {typing ? "yazıyor" : last?.body}
            </span>
            {replies > 0 ? <span className="shrink-0 text-3xs tabular-nums text-neutral-600">{replies} cevap</span> : null}
          </div>
        </Fold>
        <Fold open={focused}>
          <div className="flex flex-col gap-2.5">
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

export function CommentSide({ board, sideRef, columnRef, fields, userId, canWrite, isOwner }) {
  const { actions: studio } = useStudio();
  const guard = useGuard();
  const resolvedRef = useRef(null);

  const layout = useCallback(() => {
    const side = sideRef.current;
    const column = columnRef.current;
    if (!side || !column) return;
    const base = column.getBoundingClientRect().top;
    const items = [...side.querySelectorAll("[data-comment-thread]")]
      .filter((element) => element.dataset.leaving !== "true")
      .map((element) => {
        const block = column.querySelector(`[data-fid="${CSS.escape(element.dataset.field)}"]`);
        return {
          element,
          desired: block ? block.getBoundingClientRect().top - base + BLOCK_INSET : 0,
          height: element.offsetHeight,
          focused: element.dataset.focused === "true",
        };
      })
      .sort((a, b) => a.desired - b.desired);

    const anchor = items.findIndex((item) => item.focused);
    if (anchor < 0) {
      items.forEach((item, index) => {
        item.top = index === 0 ? item.desired : Math.max(item.desired, items[index - 1].top + items[index - 1].height + STACK_GAP);
      });
    } else {
      items[anchor].top = items[anchor].desired;
      for (let index = anchor + 1; index < items.length; index += 1) items[index].top = Math.max(items[index].desired, items[index - 1].top + items[index - 1].height + STACK_GAP);
      for (let index = anchor - 1; index >= 0; index -= 1) items[index].top = Math.min(items[index].desired, items[index + 1].top - items[index].height - STACK_GAP);
    }
    items.forEach((item) => {
      const top = `${Math.round(item.top)}px`;
      if (item.element.style.top !== top) item.element.style.top = top;
    });

    const last = items[items.length - 1];
    if (resolvedRef.current) resolvedRef.current.style.top = `${last ? Math.round(last.top + last.height + STACK_GAP) : 0}px`;
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
