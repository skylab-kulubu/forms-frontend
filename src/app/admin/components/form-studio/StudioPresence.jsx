"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { questionNumbers } from "./studio-schema";

const PALETTE = ["#b5a3e6", "#e2a1c4", "#ae7eb6", "#d79ade", "#c49ae4", "#c8a4ce"];
const NAME_FADE_MS = 3000;
const CURSOR_HIDE_MS = 10000;
const TYPING_IDLE_MS = 2500;
const EMPTY_PRESENCE = { members: [], byField: new Map() };

export function colorOf(userId) {
  const text = String(userId ?? "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export function initialsOf(name) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return `${parts[0][0]}${parts.length > 1 ? parts[parts.length - 1][0] : ""}`.toLocaleUpperCase("tr-TR");
}

export function firstName(name) {
  return String(name ?? "").trim().split(/\s+/)[0] || "Editör";
}

export function uniquePeople(members) {
  const seen = new Set();
  return members.filter((member) => {
    if (seen.has(member.userId)) return false;
    seen.add(member.userId);
    return true;
  });
}

const PresenceContext = createContext(EMPTY_PRESENCE);

export function StudioPresenceProvider({ members, children }) {
  const value = useMemo(() => {
    const byField = new Map();
    members.forEach((member) => {
      (member.selection ?? []).forEach((fieldId) => byField.set(fieldId, [...(byField.get(fieldId) ?? []), member]));
    });
    return { members, byField };
  }, [members]);

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}

export function useStudioPresence() {
  return useContext(PresenceContext);
}

export function PresenceAvatar({ member, small = false }) {
  return (
    <span title={member.name}
      className={`grid shrink-0 place-items-center rounded-full border-[1.5px] bg-neutral-800 font-semibold tracking-wide text-neutral-100 ${small ? "size-4 text-[7px]" : "size-5.5 text-[9px]"}`}
      style={{ borderColor: colorOf(member.userId) }}
    >
      {initialsOf(member.name)}
    </span>
  );
}

export function PresenceDots({ members, max = 3 }) {
  const people = uniquePeople(members);
  if (people.length === 0) return null;
  const extra = people.length - max;

  return (
    <span className="flex shrink-0 items-center -space-x-1">
      {people.slice(0, max).map((member) => (
        <span key={member.userId} className="rounded-full ring-[1.5px] ring-neutral-900"><PresenceAvatar member={member} small /></span>
      ))}
      {extra > 0 ? <span className="pl-1.5 text-3xs tabular-nums text-neutral-500">+{extra}</span> : null}
    </span>
  );
}

export function PeopleStack({ people, onGo }) {
  const [hovered, setHovered] = useState(null);
  if (people.length === 0) return null;

  return (
    <div className="mr-3 flex items-center -space-x-1.5">
      {people.map((person) => (
        <div key={person.userId} className="relative" onMouseEnter={() => setHovered(person.userId)} onMouseLeave={() => setHovered(null)}>
          <button type="button" onClick={() => onGo?.(person)} aria-label={`${person.name}, ${person.where}`}
            className="block rounded-full ring-2 ring-neutral-900 transition-transform hover:-translate-y-px focus-visible:outline-none focus-visible:ring-skylab-400/60"
          >
            <PresenceAvatar member={person} />
          </button>
          {hovered === person.userId ? (
            <div role="tooltip" className="absolute right-0 top-8 z-50 w-56 rounded-[10px] border border-white/15 bg-[#1e1e1e] px-2.5 py-2 text-left text-2xs shadow-2xl shadow-black/50">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-100">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: colorOf(person.userId) }} />
                <span className="truncate">{person.name}</span>
              </p>
              <p className="mt-0.5 text-neutral-400">{person.where}</p>
              {onGo ? <p className="mt-1.5 text-neutral-500">Tıklayınca yanına gidersin</p> : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function PeopleCount({ people }) {
  if (people.length === 0) return null;
  return (
    <span title={people.map((person) => person.name).join(", ")} className="mr-1 inline-flex items-center gap-1 rounded-md border border-white/10 px-1.5 py-0.5 text-3xs tabular-nums text-neutral-400">
      <span className="size-1.5 rounded-full" style={{ backgroundColor: colorOf(people[0].userId) }} />
      {people.length} kişi
    </span>
  );
}

function cursorNode(color, name) {
  const root = document.createElement("div");
  root.className = "absolute left-0 top-0 transition-opacity duration-300";
  root.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" style="display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,0.5))"><path d="M4 2.5 20 11l-7.2 1.9L9.4 20 4 2.5Z" fill="${color}" stroke="#0b0b0b" stroke-width="1.2" stroke-linejoin="round"/></svg>`;
  const label = document.createElement("span");
  label.className = "absolute left-3.25 top-3.75 whitespace-nowrap rounded-[5px] px-1.5 py-0.5 text-3xs font-semibold text-neutral-950 transition-opacity duration-300";
  label.style.backgroundColor = color;
  label.textContent = name;
  root.append(label);
  return { root, label };
}

export function RemoteCursors({ session, formId, members }) {
  const layerRef = useRef(null);
  const membersRef = useRef(members);

  useEffect(() => {
    membersRef.current = members;
  });

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer || !formId) return undefined;
    const nodes = new Map();
    let frame = 0;

    const draw = () => {
      frame = 0;
      const cursors = session.cursors.get(formId);
      const page = layer.parentElement?.querySelector("[data-studio-page]");
      const box = layer.getBoundingClientRect();
      const now = Date.now();
      const seen = new Set();
      let moving = false;

      cursors.forEach((cursor, key) => {
        const member = membersRef.current.find((item) => item.key === key);
        const anchor = !member || !page ? null
          : cursor.anchor === "card" ? page.querySelector(".studio-card") : page.querySelector(`[data-fid="${CSS.escape(cursor.anchor)}"]`);
        if (!anchor) return;

        const rect = anchor.getBoundingClientRect();
        const x = rect.left - box.left + cursor.x * rect.width;
        const y = rect.top - box.top + cursor.y * (cursor.anchor === "card" ? rect.width : rect.height);
        let node = nodes.get(key);
        if (!node) {
          node = { ...cursorNode(colorOf(member.userId), firstName(member.name)), x, y };
          layer.append(node.root);
          nodes.set(key, node);
        }
        node.x += (x - node.x) * 0.35;
        node.y += (y - node.y) * 0.35;
        node.root.style.transform = `translate(${node.x}px, ${node.y}px)`;

        const idle = now - cursor.at;
        node.label.style.opacity = idle > NAME_FADE_MS ? "0" : "1";
        node.root.style.opacity = idle > CURSOR_HIDE_MS ? "0" : "1";
        if (idle < CURSOR_HIDE_MS + 400) moving = true;
        seen.add(key);
      });

      nodes.forEach((node, key) => {
        if (seen.has(key)) return;
        node.root.remove();
        nodes.delete(key);
      });

      if (moving) frame = requestAnimationFrame(draw);
    };

    const stop = session.cursors.subscribe((changed) => {
      if (changed === formId && !frame) frame = requestAnimationFrame(draw);
    });
    frame = requestAnimationFrame(draw);

    return () => {
      stop();
      if (frame) cancelAnimationFrame(frame);
      nodes.forEach((node) => node.root.remove());
    };
  }, [session, formId]);

  return <div ref={layerRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden" />;
}

const round = (value) => Math.round(value * 1000) / 1000;

export function useCursorBroadcast(session, formId) {
  useEffect(() => {
    if (!formId) return undefined;
    let inside = false;

    const leave = () => {
      if (!inside) return;
      inside = false;
      session.sendCursor(formId, null);
    };

    const move = (event) => {
      if (event.pointerType === "touch") return;
      const target = event.target instanceof Element ? event.target : null;
      const page = target?.closest("[data-studio-page]");
      if (!page) {
        leave();
        return;
      }
      const block = target.closest("[data-fid]");
      const anchor = block ?? page.querySelector(".studio-card");
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      inside = true;
      session.sendCursor(formId, {
        anchor: block ? block.dataset.fid : "card",
        x: round((event.clientX - rect.left) / rect.width),
        y: round((event.clientY - rect.top) / (block ? rect.height : rect.width)),
      });
    };

    document.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", leave);
    window.addEventListener("blur", leave);
    return () => {
      document.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
      window.removeEventListener("blur", leave);
      leave();
    };
  }, [session, formId]);
}

export function useTypingField() {
  const [fieldId, setFieldId] = useState(null);

  useEffect(() => {
    let timer = null;
    const stop = () => {
      clearTimeout(timer);
      timer = null;
      setFieldId(null);
    };
    const input = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest("[data-studio-page]")) return;
      setFieldId(target.closest("[data-typing-key]")?.dataset.typingKey ?? target.closest("[data-fid]")?.dataset.fid ?? null);
      clearTimeout(timer);
      timer = setTimeout(stop, TYPING_IDLE_MS);
    };
    const focusOut = (event) => {
      if (event.target instanceof Element && event.target.closest("[data-studio-page]")) stop();
    };

    document.addEventListener("input", input);
    document.addEventListener("focusout", focusOut);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("input", input);
      document.removeEventListener("focusout", focusOut);
    };
  }, []);

  return fieldId;
}

export function revealField(fieldId, color) {
  const block = document.querySelector(`[data-studio-page] [data-fid="${CSS.escape(fieldId)}"]`);
  if (!block) return false;
  block.scrollIntoView({ behavior: "smooth", block: "center" });
  block.firstElementChild?.animate([{ backgroundColor: `${color}29` }, { backgroundColor: "transparent" }], { duration: 1400, easing: "ease-out" });
  return true;
}

export function whereOf(member, { fields = [], formTitle = null } = {}) {
  const fieldId = member.selection?.[0];
  const number = fieldId ? questionNumbers(fields).get(fieldId) : null;
  const place = number ? `${number}. soru` : fieldId ? "bir bölüm başlığı" : null;
  const typing = member.editing && member.editing === fieldId ? " · yazıyor" : "";
  if (formTitle) return place ? `${formTitle} · ${place}${typing}` : `${formTitle} adımında`;
  return place ? `${place}${typing}` : "Formda";
}
