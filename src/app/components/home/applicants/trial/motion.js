export const EASE_OUT = "cubic-bezier(.22, 1, .36, 1)";
export const GLIDE = "cubic-bezier(.2, .8, .2, 1)";
export const SETTLE = "cubic-bezier(.5, 0, .2, 1)";
export const IDENTITY = "translate(0px, 0px) scale(1) rotate(0deg)";

export function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function onScreen(r) {
  return r.width >= 8 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
}

export function wallPoster() {
  const front = document.querySelector(".a2-item.is-trial .a2-front");
  const item = front?.closest(".a2-item");
  if (!front || !item) return null;
  const r = front.getBoundingClientRect();
  if (!onScreen(r)) return null;
  const t = getComputedStyle(item).transform;
  const m = new DOMMatrixReadOnly(t && t !== "none" ? t : undefined);
  const rot = Math.atan2(m.b, m.a);
  const c = Math.abs(Math.cos(rot));
  const s = Math.abs(Math.sin(rot));
  const w0 = front.offsetWidth;
  const h0 = front.offsetHeight;
  const k = r.width / (w0 * c + h0 * s);
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, w: w0 * k, h: h0 * k, rot: (rot * 180) / Math.PI };
}

export function flipFrom(box, rect) {
  const dx = box.cx - (rect.left + rect.width / 2);
  const dy = box.cy - (rect.top + rect.height / 2);
  return `translate(${dx}px, ${dy}px) scale(${box.w / rect.width}) rotate(${box.rot}deg)`;
}

export function settled(list) {
  return Promise.all(list.filter(Boolean).map((a) => a.finished.catch(() => null)));
}

export function freeze(el) {
  if (!el) return null;
  const cs = getComputedStyle(el);
  const state = { transform: cs.transform === "none" ? IDENTITY : cs.transform, opacity: Number(cs.opacity) };
  el.getAnimations().forEach((a) => a.cancel());
  return state;
}

export function cascade(els, { delay = 0, step = 45, max = 7, dist = 14, duration = 560 } = {}) {
  return Array.from(els, (el, i) => el.animate(
    [{ opacity: 0, transform: `translateY(${dist}px)` }, { opacity: 1, transform: "translateY(0px)" }],
    { duration, delay: delay + Math.min(i, max) * step, easing: EASE_OUT, fill: "backwards" },
  ));
}

export function stopAll(list) {
  list.forEach((a) => a?.cancel());
  list.length = 0;
}
