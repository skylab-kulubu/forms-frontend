import { DEMO_BINDING, DEMO_PARAM } from "@/lib/demo/protocol";

export const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
export const lerp = (a, b, t) => a + (b - a) * t;
export const seg = (u, a, b) => clamp((u - a) / (b - a));
export const typed = (text, t) => text.slice(0, Math.round(clamp(t) * text.length));
export const R = (x, y, w, h) => ({ x, y, w, h });
export const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const PERSPECTIVE = 2200;
export const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const COMPOSE = typeof Element.prototype.animate === "function";
const GLIDE = COMPOSE && "scrollBehavior" in document.documentElement.style;

export const M = { V: R(0, 0, 0, 0), S: R(0, 0, 0, 0) };

export function setStage(area) {
  const top = area.top ?? 0;
  M.V = R(area.x, area.y, area.w, area.h);
  M.S = R(area.x, area.y + top, area.w, area.h - top);
  M.hero = area.hero ?? "center";
}

export const RIM = { top: 8, right: 8, bottom: 8, left: 264 };

export function bleed(actor, options = {}) {
  const rim = actor.rim ?? RIM;
  const w = Math.min(actor.pw - rim.right, M.V.w);
  const clip = R(0, 0, actor.pw - rim.right, actor.ph - rim.bottom);
  return shot(actor, R(actor.pw - rim.right - w, 0, w, actor.ph - rim.bottom), { mode: "height", max: 1, clip, rad: 0, ...options });
}

export function part(x, y, w, h) {
  return R(M.V.x + x * M.V.w, M.V.y + y * M.V.h, w * M.V.w, h * M.V.h);
}

export function splitArea() {
  const strip = clamp(M.V.w * 0.27, 250, 330);
  return { left: R(M.V.x, M.V.y, M.V.w - strip - 20, M.V.h), right: R(M.V.x + M.V.w - strip, M.V.y, strip, M.V.h) };
}

const POSE_KEYS = ["fx", "fy", "s", "ax", "ay", "az", "rx", "ry", "rz", "o", "shade", "cx", "cy", "cw", "ch", "rad", "corner", "veil", "hx", "hy", "hw", "hh"];

const HOLD_KEYS = ["hx", "hy", "hw", "hh", "rad"];

export function mixPose(a, b, t) {
  const pose = {};
  POSE_KEYS.forEach((key) => { pose[key] = lerp(a[key], b[key], t); });
  const held = a.veil >= b.veil ? a : b;
  HOLD_KEYS.forEach((key) => { pose[key] = held[key]; });
  if (a.veil !== b.veil) pose.veil = a.veil > b.veil ? lerp(a.veil, b.veil, clamp(t * 2.5)) : lerp(a.veil, b.veil, clamp(1 - (1 - t) * 2.5));
  return pose;
}

export function shot(actor, region, options = {}) {
  const { mode = "contain", max = 1, min = 0.12, pad = 0, rx = 0, ry = 0, rz = 0, z = 0, o = 1, shade = 0, clip = null, rad = 16, dx = 0, dy = 0, valign = "auto", halign = "center", area = M.V, veil = 0, hole = null } = options;
  const availW = Math.max(40, area.w - pad * 2);
  const availH = Math.max(40, area.h - pad * 2);
  let s = mode === "width" ? availW / region.w : mode === "height" ? availH / region.h : Math.min(availW / region.w, availH / region.h);
  s = clamp(s, min, max);
  const top = valign === "top" || (valign === "auto" && region.h * s > availH + 0.5);
  const left = halign === "left";
  const right = halign === "right";
  const c = clip ?? R(0, 0, actor.pw, actor.ph);
  const h = hole ?? c;
  const depth = (PERSPECTIVE - z) / PERSPECTIVE;
  const cx = M.V.x + M.V.w / 2;
  const cy = M.V.y + M.V.h / 2;
  const ax = (left ? area.x + pad : right ? area.x + area.w : area.x + area.w / 2) + dx * area.w;
  const ay = (top ? area.y + pad : area.y + area.h / 2) + dy * area.h;
  return {
    fx: left ? region.x : right ? region.x + region.w : region.x + region.w / 2,
    fy: top ? region.y : region.y + region.h / 2,
    s: s * depth,
    ax: cx + (ax - cx) * depth,
    ay: cy + (ay - cy) * depth,
    az: z, rx, ry, rz, o, shade,
    cx: c.x, cy: c.y, cw: c.w, ch: c.h, rad, corner: rad,
    veil, hx: h.x, hy: h.y, hw: h.w, hh: h.h,
  };
}

export function crop(actor, middle, ratio = 1.5) {
  const w = Math.min(actor.pw, Math.round(actor.ph * ratio));
  return R(clamp(middle - w / 2, 0, actor.pw - w), 0, w, actor.ph);
}

export function panelShot(actor, region, options = {}) {
  return shot(actor, region, { max: 1, clip: region, rad: 16, veil: 1, hole: region, ...options });
}

export function slot(actor, options = {}) {
  return shot(actor, R(0, 0, actor.pw, actor.ph), { max: 1, ...options });
}

export const OFF = { before: { dx: 0.14, o: 0, z: -60 }, after: { dx: -0.14, o: 0, z: -60 } };

export function stint(actor, from, to) {
  const on = () => slot(actor);
  const before = () => slot(actor, OFF.before);
  const after = () => slot(actor, OFF.after);
  return [{ u: from - 0.16, f: before }, { u: from + 0.04, f: on }, { u: to - 0.16, f: on }, { u: to + 0.04, f: after }];
}

export function visibleOf(pose, area = M.V) {
  const depth = PERSPECTIVE / (PERSPECTIVE - pose.az);
  const s = pose.s * depth;
  const cx = area.x + area.w / 2;
  const cy = area.y + area.h / 2;
  const ax = cx + (pose.ax - cx) * depth;
  const ay = cy + (pose.ay - cy) * depth;
  return R(pose.fx - (ax - area.x) / s, pose.fy - (ay - area.y) / s, area.w / s, area.h / s);
}

export function evalTrack(actor, track, u) {
  if (u <= track[0].u) return track[0].f(actor);
  for (let index = 0; index < track.length - 1; index += 1) {
    const a = track[index];
    const b = track[index + 1];
    if (u < b.u) {
      const t = ease((u - a.u) / (b.u - a.u));
      return t <= 0 ? a.f(actor) : mixPose(a.f(actor), b.f(actor), t);
    }
  }
  return track[track.length - 1].f(actor);
}

const SCROLL_KEYS = { ArrowDown: 80, ArrowUp: -80, PageDown: 0.9, PageUp: -0.9, " ": 0.9, Home: -1e9, End: 1e9 };

const BAR = '<span>9:41</span><span><svg width="16" height="11" viewBox="0 0 16 11"><rect x="0" y="7" width="3" height="4" rx=".8" fill="currentColor"/><rect x="4.3" y="5" width="3" height="6" rx=".8" fill="currentColor"/><rect x="8.6" y="2.6" width="3" height="8.4" rx=".8" fill="currentColor"/><rect x="12.9" y="0" width="3" height="11" rx=".8" fill="currentColor"/></svg><svg width="22" height="11" viewBox="0 0 22 11"><rect x=".5" y=".5" width="18" height="10" rx="3" fill="none" stroke="currentColor" opacity=".5"/><rect x="2" y="2" width="13" height="7" rx="1.6" fill="currentColor"/><rect x="19.6" y="3.6" width="1.6" height="3.8" rx=".8" fill="currentColor" opacity=".5"/></svg></span>';

const HAND = '<svg width="15" height="23" viewBox="0 0 15 23" aria-hidden="true"><path d="M1.5 1.5v16.3l3.9-3.7 3 6.9 2.5-1.1-3-6.8h5.4L1.5 1.5Z" fill="#fff" stroke="#16151a" stroke-width="1.2" stroke-linejoin="round"/></svg>';

const GUARDED = new WeakSet();

const demoUrl = (target) => {
  const url = new URL(target, window.location.origin);
  url.searchParams.set(DEMO_PARAM, "1");
  return `${url.pathname}${url.search}`;
};

function holePath(width, height, x, y, w, h, r) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  return `M0 0H${width}V${height}H0Z M${x + k} ${y}H${x + w - k}A${k} ${k} 0 0 1 ${x + w} ${y + k}V${y + h - k}A${k} ${k} 0 0 1 ${x + w - k} ${y + h}H${x + k}A${k} ${k} 0 0 1 ${x} ${y + h - k}V${y + k}A${k} ${k} 0 0 1 ${x + k} ${y}Z`;
}

export class Actor {
  constructor(world, name, { w, h, phone = false, head = 0 }) {
    this.name = name;
    this.w = w;
    this.h = h;
    this.phone = phone;
    this.inset = phone ? 11 : 0;
    this.head = phone ? 40 : head;
    this.frameTop = phone ? 0 : this.head;
    this.bleed = false;
    this.pw = w + this.inset * 2;
    this.ph = h + this.head + this.inset * 2;
    this.ready = false;
    this.live = false;
    this.masked = false;
    this.fade = 0;
    this.frame = 0;
    this.rects = new Map();
    this.visible = R(0, 0, this.pw, this.ph);
    this.applied = {};
    this.hand = null;

    this.plane = document.createElement("div");
    this.plane.className = phone ? "film-plane film-phone" : "film-plane";
    this.plane.dataset.name = name;
    this.plane.style.width = `${this.pw}px`;
    this.plane.style.height = `${this.ph}px`;

    this.shadow = document.createElement("div");
    this.shadow.className = "film-shadow";
    this.lift = document.createElement("div");
    this.lift.className = "film-shadow is-win";
    this.body = document.createElement("div");
    this.body.className = "film-body";
    this.inner = document.createElement("div");
    this.inner.className = "film-inner";
    this.ring = document.createElement("div");
    this.ring.className = "film-ring";
    this.iframe = document.createElement("iframe");
    this.iframe.setAttribute("tabindex", "-1");
    this.iframe.setAttribute("aria-hidden", "true");
    this.iframe.title = name;
    this.veil = document.createElement("div");
    this.veil.className = "film-veil";
    this.shade = document.createElement("div");
    this.shade.className = "film-shade";
    this.over = document.createElement("div");
    this.over.className = "film-over";
    if (phone) {
      this.bar = document.createElement("div");
      this.bar.className = "film-phone-bar";
      this.bar.innerHTML = BAR;
      this.iframe.style.height = `${h + this.head}px`;
    } else if (this.head) {
      this.band = document.createElement("div");
      this.band.className = "film-band";
      this.inner.append(this.band);
      this.iframe.style.height = `${h}px`;
      this.iframe.style.marginTop = `${this.head}px`;
    }
    this.inner.append(this.iframe, this.veil, this.shade);
    if (this.bar) this.inner.append(this.bar);
    this.body.append(this.inner, this.ring);
    this.plane.append(this.shadow, this.lift, this.body, this.over);
    world.append(this.plane);
    this.dress();

    this.iframe.addEventListener("load", () => this.onLoad());
  }

  bind(binding) {
    this.binding = binding;
    this.iframe[DEMO_BINDING] = binding;
  }

  get win() {
    return this.iframe.contentWindow;
  }

  get doc() {
    try {
      return this.iframe.contentDocument;
    } catch {
      return null;
    }
  }

  dress() {
    const rim = this.rim ?? RIM;
    if (this.band) this.band.style.height = `${this.head + rim.top}px`;
    this.plane.style.setProperty("--film-seam", `${rim.left}px`);
  }

  setSize(w, h) {
    if (this.phone || (w === this.w && h === this.h)) return;
    this.w = w;
    this.h = h;
    this.pw = w;
    this.ph = h + this.head;
    this.plane.style.width = `${this.pw}px`;
    this.plane.style.height = `${this.ph}px`;
    if (this.head) this.iframe.style.height = `${h}px`;
    this.applied = { on: this.applied.on };
  }

  load(url, isReady, retry = false) {
    this.url = url;
    this.isReady = isReady;
    this.ready = false;
    this.fade = 0;
    this.tries = retry ? this.tries + 1 : 0;
    this.askedAt = performance.now();
    this.iframe.src = demoUrl(url);
  }

  onLoad() {
    const doc = this.doc;
    if (!doc) return;
    doc.addEventListener("keydown", (event) => {
      if (this.live) return;
      event.preventDefault();
      event.stopPropagation();
      const step = SCROLL_KEYS[event.key];
      if (step === undefined) return;
      window.scrollBy({ top: Math.abs(step) < 2 ? step * window.innerHeight : step, behavior: "smooth" });
    }, true);
    this.guard();
    const style = doc.createElement("style");
    const cursors = this.touch ? "" : "[data-studio-center] > div[aria-hidden='true'] > div { visibility: hidden; } ";
    const safe = this.phone ? `.h-dvh.overflow-y-auto { margin-top: ${this.head}px !important; height: calc(100dvh - ${this.head}px) !important; } * { scrollbar-width: none !important; } *::-webkit-scrollbar { width: 0 !important; height: 0 !important; } ` : "";
    style.textContent = `html { scrollbar-width: none; } ::-webkit-scrollbar { width: 0; height: 0; } ${safe}${cursors}[data-studio-page], [data-studio-root] aside .overflow-y-auto, [data-studio-menu] .overflow-y-auto, [data-room-canvas], [data-room] aside .overflow-y-auto, .h-dvh.overflow-y-auto { will-change: scroll-position; } nav[aria-label='Breadcrumb'] { transition: opacity .2s ease; } html[data-film-cut] nav[aria-label='Breadcrumb'] { opacity: 0; }`;
    this.applied.cut = undefined;
    doc.head?.append(style);
  }

  surface() {
    const doc = this.doc;
    const win = this.win;
    if (!doc?.body || !win) return;
    const clear = (value) => !value || value === "transparent" || /^rgba\(.*,\s*0\)$/.test(value);
    let color = "";
    let node = doc.elementFromPoint(4, 4) ?? doc.body;
    while (node && node.nodeType === 1 && !color) {
      const value = win.getComputedStyle(node).backgroundColor;
      if (!clear(value)) color = value;
      node = node.parentElement;
    }
    if (color && color !== this.back) {
      this.back = color;
      this.plane.style.setProperty("--film-back", color);
    }
  }

  measure() {
    const doc = this.doc;
    const win = this.win;
    if (!this.ready || !doc?.body || !win) return false;
    const clear = (value) => !value || value === "transparent" || /^rgba\(.*,\s*0\)$/.test(value);
    let card = this.card?.isConnected ? this.card : null;
    if (!card) {
      let node = doc.elementFromPoint(this.w - 30, 30);
      while (node && node.nodeType === 1 && !card) {
        const box = node.getBoundingClientRect();
        if (box.width > this.w * 0.4 && box.height > this.h * 0.5 && parseFloat(win.getComputedStyle(node).borderTopRightRadius) >= 6) card = node;
        else node = node.parentElement;
      }
      if (!card) return false;
      this.card = card;
      card.style.borderRadius = "0";
    }
    const look = win.getComputedStyle(card);
    if (!clear(look.backgroundColor) && look.backgroundColor !== this.back) {
      this.back = look.backgroundColor;
      this.plane.style.setProperty("--film-back", this.back);
    }
    let side = "";
    let node = card.parentElement;
    while (node && node.nodeType === 1 && !side) {
      const value = win.getComputedStyle(node).backgroundColor;
      if (!clear(value)) side = value;
      node = node.parentElement;
    }
    if (side && side !== this.side) {
      this.side = side;
      this.plane.style.setProperty("--film-side", side);
    }
    const box = card.getBoundingClientRect();
    const edge = (name) => parseFloat(look[name]) || 0;
    const rim = {
      top: Math.round(box.top + edge("borderTopWidth")), right: Math.round(this.w - box.right + edge("borderRightWidth")),
      bottom: Math.round(this.h - box.bottom + edge("borderBottomWidth")), left: Math.round(box.left + edge("borderLeftWidth")),
    };
    const sane = rim.top >= 0 && rim.top <= 40 && rim.right >= 0 && rim.right <= 40 && rim.bottom >= 0 && rim.bottom <= 40 && rim.left >= 0 && rim.left <= 420;
    if (!sane) return false;
    const old = this.rim;
    if (old && old.top === rim.top && old.right === rim.right && old.bottom === rim.bottom && old.left === rim.left) return false;
    this.rim = rim;
    this.dress();
    return true;
  }

  guard() {
    let win = null;
    try {
      win = this.win;
      const doc = win?.document;
      if (!doc || GUARDED.has(doc) || !win.HTMLElement) return;
      GUARDED.add(doc);
    } catch {
      return;
    }
    const focus = win.HTMLElement.prototype.focus;
    win.HTMLElement.prototype.focus = function (options) {
      return focus.call(this, { ...(options ?? {}), preventScroll: true });
    };
    win.Element.prototype.scrollIntoView = function (options) {
      const block = typeof options === "object" && options ? options.block ?? "start" : options === false ? "end" : "start";
      const smooth = typeof options === "object" && options?.behavior === "smooth";
      const root = this.ownerDocument.scrollingElement;
      let box = this.parentElement;
      while (box && box !== root) {
        const flow = win.getComputedStyle(box).overflowY;
        if ((flow === "auto" || flow === "scroll") && box.scrollHeight > box.clientHeight + 1) break;
        box = box.parentElement;
      }
      if (!box) box = root;
      if (!box) return;
      const own = this.getBoundingClientRect();
      const frame = box === root ? { top: 0, bottom: win.innerHeight, height: win.innerHeight } : box.getBoundingClientRect();
      let delta = own.top - frame.top;
      if (block === "center") delta = own.top + own.height / 2 - (frame.top + frame.height / 2);
      else if (block === "end") delta = own.bottom - frame.bottom;
      else if (block === "nearest") delta = own.top < frame.top ? own.top - frame.top : own.bottom > frame.bottom ? own.bottom - frame.bottom : 0;
      if (Math.abs(delta) > 0.5) box.scrollTo({ top: box.scrollTop + delta, behavior: smooth ? "smooth" : "auto" });
    };
  }

  tick(dt) {
    this.frame += 1;
    this.rects.clear();
    this.guard();
    if (!this.ready && this.isReady) {
      try {
        if (this.doc && this.isReady(this)) this.ready = true;
      } catch {}
      if (this.ready && this.bleed && !this.card) this.surface();
    }
    this.fade = clamp(this.fade + (this.ready ? dt / 0.45 : -dt / 0.2));
    if (this.cover) {
      const shown = this.fade.toFixed(3);
      if (shown !== this.coverShown) {
        this.coverShown = shown;
        this.iframe.style.opacity = shown;
        this.cover.style.opacity = (1 - this.fade).toFixed(3);
      }
      if (this.ready && this.fade >= 1 && !this.keepCover) {
        this.cover.remove();
        this.cover = null;
        this.iframe.style.opacity = "";
      }
    }
    if (!this.ready && this.url && this.tries < 3 && performance.now() - this.askedAt > 25000) this.load(this.url, this.isReady, true);
  }

  q(selector) {
    return this.doc?.querySelector(selector) ?? null;
  }

  all(selector) {
    return [...(this.doc?.querySelectorAll(selector) ?? [])];
  }

  byText(selector, text) {
    return this.all(selector).find((item) => item.textContent.trim() === text) ?? null;
  }

  rect(target) {
    const cached = typeof target === "string" ? this.rects.get(target) : undefined;
    if (cached !== undefined) return cached;
    const element = typeof target === "string" ? this.q(target) : target;
    let result = null;
    if (element) {
      const box = element.getBoundingClientRect();
      if (box.width !== 0 || box.height !== 0) result = R(box.left + this.inset, box.top + this.inset + this.frameTop, box.width, box.height);
    }
    if (typeof target === "string") this.rects.set(target, result);
    return result;
  }

  clipped(region) {
    if (!region) return null;
    const x = clamp(region.x, 0, this.pw);
    const y = clamp(region.y, 0, this.ph);
    return R(x, y, clamp(region.x + region.w, 0, this.pw) - x, clamp(region.y + region.h, 0, this.ph) - y);
  }

  point(target, fx = 0.5, fy = 0.5) {
    const box = this.rect(target);
    return box ? [box.x + box.w * fx, box.y + box.h * fy] : null;
  }

  setHand(spot) {
    if (!spot) {
      if (this.hand) this.hand.root.style.opacity = "0";
      return;
    }
    if (!this.hand) {
      const root = document.createElement("div");
      root.className = this.touch ? "film-hand is-touch" : "film-hand";
      root.innerHTML = HAND;
      this.over.append(root);
      this.hand = { root, pressed: false };
    }
    const hand = this.hand;
    hand.root.style.opacity = "1";
    hand.root.style.transform = `translate3d(${spot.x.toFixed(1)}px, ${spot.y.toFixed(1)}px, 46px)`;
    if (hand.pressed !== spot.pressed) {
      hand.pressed = spot.pressed;
      hand.root.classList.toggle("is-down", spot.pressed);
    }
  }

  format(pose) {
    const rx = REDUCED ? 0 : pose.rx;
    const tilt = REDUCED ? 0 : pose.ry;
    const ry = Math.abs(tilt) < 0.02 ? (tilt < 0 ? -0.02 : 0.02) : tilt;
    const rz = REDUCED ? 0 : pose.rz;
    return `translate3d(${pose.ax.toFixed(2)}px, ${pose.ay.toFixed(2)}px, ${pose.az.toFixed(2)}px) rotateX(${rx.toFixed(3)}deg) rotateY(${ry.toFixed(3)}deg) rotateZ(${rz.toFixed(3)}deg) scale(${pose.s.toFixed(5)}) translate(${(-pose.fx).toFixed(2)}px, ${(-pose.fy).toFixed(2)}px)`;
  }

  release() {
    if (this.motion) {
      this.motion.cancel();
      this.motion = null;
    }
    this.releaseClip();
  }

  releaseClip() {
    if (!this.clipMotion) return;
    this.clipMotion.forEach((motion) => motion.cancel());
    this.clipMotion = null;
  }

  clipOf(pose) {
    const sx = Math.max(0.02, pose.cw / this.pw);
    const sy = Math.max(0.02, pose.ch / this.ph);
    return {
      sx, sy,
      body: `translate(${pose.cx.toFixed(1)}px, ${pose.cy.toFixed(1)}px) scale(${sx.toFixed(5)}, ${sy.toFixed(5)})`,
      inner: `scale(${(1 / sx).toFixed(6)}, ${(1 / sy).toFixed(6)}) translate(${(-pose.cx).toFixed(1)}px, ${(-pose.cy).toFixed(1)}px)`,
    };
  }

  setMotion(steps, duration, startTime) {
    const applied = this.applied;
    const on = steps.some((step) => step.o > 0.003);
    if (on !== applied.on) {
      applied.on = on;
      this.plane.classList.toggle("is-on", on);
    }
    if (!on) {
      this.release();
      return;
    }

    const frames = steps.map((step) => ({ transform: this.format(step.pose), opacity: step.o.toFixed(3) }));
    const first = frames[0];
    const still = !COMPOSE || frames.every((frame) => frame.transform === first.transform && frame.opacity === first.opacity);
    if (still) {
      if (first.transform !== applied.transform) {
        applied.transform = first.transform;
        this.plane.style.transform = first.transform;
      }
      if (first.opacity !== applied.o) {
        applied.o = first.opacity;
        this.plane.style.opacity = first.opacity;
      }
      this.release();
    } else {
      const motion = this.plane.animate(frames, { duration, fill: "forwards" });
      motion.startTime = startTime;
      this.motion?.cancel();
      this.motion = motion;
    }

    const pose = steps[0].pose;
    const shade = pose.shade.toFixed(3);
    if (shade !== applied.shade) {
      applied.shade = shade;
      this.shade.style.opacity = shade;
      if (this.bleed) this.shadow.style.setProperty("--film-shade", shade);
    }
    if (this.phone) return;

    const open = this.bleed && pose.veil < 0.02 && pose.ch >= this.ph * 0.9;
    if (open !== applied.open) {
      applied.open = open;
      this.plane.classList.toggle("is-bleed", open);
    }

    const cut = pose.cx > 8 || (this.bleed && this.visible.x > 8);
    if (cut !== applied.cut) {
      const root = this.doc?.documentElement;
      if (root) {
        applied.cut = cut;
        root.toggleAttribute("data-film-cut", cut);
      }
    }

    const clips = steps.map((step) => this.clipOf(step.pose));
    const clip = clips[0];
    if (COMPOSE && clips.some((entry) => entry.body !== clip.body)) {
      const outline = clips.map((entry) => ({ transform: entry.body }));
      const outer = this.body.animate(outline, { duration, fill: "forwards" });
      const inner = this.inner.animate(clips.map((entry) => ({ transform: entry.inner })), { duration, fill: "forwards" });
      const under = this.shadow.animate(outline, { duration, fill: "forwards" });
      outer.startTime = startTime;
      inner.startTime = startTime;
      under.startTime = startTime;
      this.releaseClip();
      this.clipMotion = [outer, inner, under];
      applied.clip = null;
    } else {
      if (clip.body !== applied.clip) {
        applied.clip = clip.body;
        this.body.style.transform = clip.body;
        this.inner.style.transform = clip.inner;
        this.shadow.style.transform = clip.body;
      }
      this.releaseClip();
    }

    if (this.bleed) {
      const corner = pose.corner ?? pose.rad;
      const round = `${(corner / clip.sx).toFixed(2)}px / ${(corner / clip.sy).toFixed(2)}px`;
      if (round !== applied.round) {
        applied.round = round;
        this.body.style.borderRadius = round;
      }
    }

    const amount = pose.veil < 0.004 ? 0 : pose.veil > 0.996 ? 1 : pose.veil;
    const hole = `${pose.hx.toFixed(1)}|${pose.hy.toFixed(1)}|${pose.hw.toFixed(1)}|${pose.hh.toFixed(1)}|${pose.rad.toFixed(1)}`;
    if (amount > 0 && hole !== applied.hole) {
      applied.hole = hole;
      this.veil.style.clipPath = `path(evenodd, "${holePath(this.pw, this.ph, pose.hx, pose.hy, pose.hw, pose.hh, pose.rad)}")`;
      this.lift.style.left = `${pose.hx.toFixed(1)}px`;
      this.lift.style.top = `${pose.hy.toFixed(1)}px`;
      this.lift.style.width = `${pose.hw.toFixed(1)}px`;
      this.lift.style.height = `${pose.hh.toFixed(1)}px`;
      this.lift.style.borderRadius = `${pose.rad.toFixed(1)}px`;
    }
    const veil = amount.toFixed(3);
    if (veil !== applied.veil) {
      const shown = amount > 0;
      if (shown !== applied.veiled) {
        applied.veiled = shown;
        this.veil.style.display = shown ? "block" : "none";
      }
      applied.veil = veil;
      const rest = (1 - amount).toFixed(3);
      this.veil.style.opacity = veil;
      this.lift.style.opacity = veil;
      this.shadow.style.opacity = rest;
      this.ring.style.opacity = rest;
    }
  }
}

export function handAt(u, keys) {
  if (!keys.length || u < keys[0].u || u > keys[keys.length - 1].u) return null;
  let index = 0;
  while (index < keys.length - 2 && u >= keys[index + 1].u) index += 1;
  const a = keys[index];
  const b = keys[index + 1] ?? a;
  const from = a.at();
  const to = b.at();
  if (!from && !to) return null;
  const start = from ?? to;
  const end = to ?? from;
  const t = b === a ? 0 : ease(seg(u, a.u, b.u));
  const pressed = keys.some((key) => key.click && u >= key.u && u < key.u + 0.035);
  return { x: lerp(start[0], end[0], t), y: lerp(start[1], end[1], t), pressed };
}

const glides = new WeakMap();

export function scrollTo(scroller, want, dt, tau = 0.2) {
  if (!scroller) return;
  const goal = clamp(want, 0, scroller.scrollHeight - scroller.clientHeight);
  if (GLIDE) {
    const now = performance.now();
    const last = glides.get(scroller);
    const here = scroller.scrollTop;
    if (last && Math.abs(goal - last.goal) < 2.5 && (now - last.at < 900 || Math.abs(goal - here) < 2)) return;
    if (!last && Math.abs(goal - here) < 2) return;
    glides.set(scroller, { goal, at: now });
    scroller.scrollTo({ top: goal, behavior: Math.abs(goal - here) > scroller.clientHeight * 1.5 ? "instant" : "smooth" });
    return;
  }
  const gap = goal - scroller.scrollTop;
  if (Math.abs(gap) < 0.6) return;
  const next = scroller.scrollTop + gap * (1 - Math.exp(-dt / tau));
  scroller.scrollTop = Math.abs(goal - next) < 0.6 ? goal : next;
}

export function scrollSpot(actor, scroller, element, dt, { at = 0.4, head = 200, tau = 0.2 } = {}) {
  if (!scroller || !element) return;
  const box = scroller.getBoundingClientRect();
  const target = element.getBoundingClientRect();
  const visible = actor.visible;
  const offset = actor.inset + actor.frameTop;
  const top = Math.max(visible.y - offset, box.top);
  const bottom = Math.min(visible.y - offset + visible.h, box.bottom);
  const wantY = top + (bottom - top) * at;
  const nowY = target.top + Math.min(target.height, head) / 2;
  scrollTo(scroller, scroller.scrollTop + (nowY - wantY), dt, tau);
}

export function throttle(ms) {
  let last = -Infinity;
  return (now, wait = ms) => {
    if (now - last < wait) return false;
    last = now;
    return true;
  };
}
