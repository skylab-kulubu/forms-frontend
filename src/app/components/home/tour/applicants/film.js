import { Actor, M, REDUCED, clamp, ease, evalTrack, lerp, seg, setStage, visibleOf } from "../film/engine.js";
import { IDS, createApplicantsServer } from "@/lib/demo/server/applicants";
import { demoBackend } from "@/lib/demo/server/serve";
import { CAPTIONS, T } from "./script.js";
import { createPhone } from "./phone.js";
import ghostPhone from "./ghost-phone.webp";

const GHOST = `url(${ghostPhone.src})`;

const OMEGA = 4.4;
const HORIZON = 0.5;
const STEPS = 30;

function compactSize() {
  const w = Math.round(clamp(M.V.w, 340, 414));
  const scale = Math.min(1, M.V.w / w);
  return { w, h: Math.round(clamp(M.V.h / scale, 460, 900)) };
}

function phoneSize() {
  return { w: 390, h: Math.round(clamp(M.S.h - 90, 560, 800)), phone: true };
}

export { CAPTIONS, T };

const WIDE_AT = T.form + 0.5;

export const REPLAY_AT = T.form + 0.3;

export const framed = (u) => ease(seg(u, 0.34, T.form + 0.22)) * (1 - ease(seg(u, T.end - 0.32, T.end + 0.02)));

export function createFilm({ scene, world, area: areaOf, sway = true, onFrame = null, compact = false, hold = false }) {
  const state = { u: 0, v: 0, target: 0, last: 0, px: 0, py: 0, tx: 0, ty: 0, live: null, flat: 0, running: false, raf: 0, hold };
  const area = (u) => {
    const box = areaOf(u);
    return box.top === undefined ? { ...box, top: 0 } : box;
  };

  setStage(area(WIDE_AT));
  const handset = new Actor(world, "phone", compact ? compactSize() : phoneSize());
  handset.touch = true;
  const backend = demoBackend(createApplicantsServer);
  handset.bind(backend.bind("ayse"));
  const mode = { compact, fill: false, fit: false, home: () => area(0) };
  const phone = createPhone(handset, IDS, mode, { ghost: GHOST, control: () => backend.get().control });

  const cover = document.createElement("div");
  cover.className = "film-cover film-phone-wait";
  cover.setAttribute("aria-hidden", "true");
  handset.inner.insertBefore(cover, handset.veil);
  handset.cover = cover;
  handset.keepCover = true;
  handset.iframe.style.opacity = "0";
  Object.assign(cover.style, { left: "0px", top: "0px", width: `${handset.w}px`, height: `${handset.h + handset.head}px`, backgroundImage: GHOST });

  const loaded = { phone: false };

  function layout() {
    setStage(area(WIDE_AT));
    if (compact) {
      const size = compactSize();
      handset.setSize(size.w, size.h);
      if (handset.cover) Object.assign(handset.cover.style, { width: `${size.w}px`, height: `${size.h + handset.head}px` });
    }
    const origin = `${M.V.x + M.V.w / 2}px ${M.V.y + M.V.h / 2}px`;
    scene.style.perspectiveOrigin = origin;
    world.style.transformOrigin = origin;
  }

  function leadAt(u) {
    if (u < T.form - 0.1 || u >= T.end - 0.1) return null;
    return handset;
  }

  function setLive(on) {
    const actor = on ? leadAt(state.u) : null;
    if (state.live === actor) return Boolean(actor);
    if (state.live) {
      state.live.live = false;
      state.live.plane.classList.remove("is-live");
      state.live.iframe.setAttribute("aria-hidden", "true");
      state.live.doc?.activeElement?.blur?.();
    }
    if (!actor) phone.resync();
    state.live = actor;
    if (actor) {
      actor.live = true;
      actor.plane.classList.add("is-live");
      actor.iframe.removeAttribute("aria-hidden");
      actor.setHand(null);
      phone.sheet.update({ key: null });
    }
    return Boolean(actor);
  }

  function onPointer(event) {
    const box = scene.getBoundingClientRect();
    state.tx = clamp((event.clientX - box.left - (M.V.x + M.V.w / 2)) / (M.V.w / 2), -1, 1);
    state.ty = clamp((event.clientY - box.top - (M.V.y + M.V.h / 2)) / (M.V.h / 2), -1, 1);
  }

  function advance(dt) {
    const target = clamp(state.target, 0, T.total);
    const gap = state.u - target;
    const pull = state.v + OMEGA * gap;
    const decay = Math.exp(-OMEGA * dt);
    state.u = target + (gap + pull * dt) * decay;
    state.v = (state.v - OMEGA * pull * dt) * decay;
    if (Math.abs(target - state.u) < 0.0003 && Math.abs(state.v) < 0.002) {
      state.u = target;
      state.v = 0;
    }
    state.u = clamp(state.u, 0, T.total);
  }

  function ahead(t) {
    const target = clamp(state.target, 0, T.total);
    const gap = state.u - target;
    return clamp(target + (gap + (state.v + OMEGA * gap) * t) * Math.exp(-OMEGA * t), 0, T.total);
  }

  const floatOf = (u) => (REDUCED || compact || u < T.form + 0.2 || u > T.end - 0.3 ? 0 : 0.35);

  function stepOf(actor, track, t, seconds) {
    const u = t ? ahead(t) : state.u;
    setStage(area(u));
    const goal = state.live ? 1 : 0;
    const flat = goal + (state.flat - goal) * Math.exp(-t / 0.18);
    const pose = evalTrack(actor, track, u);
    if (!t) actor.visible = visibleOf(pose);
    const amount = floatOf(u) * (1 - flat);
    if (amount > 0) {
      pose.ry += Math.sin(seconds * 0.52 + 1.7) * 1.3 * amount;
      pose.rx += Math.cos(seconds * 0.41 + 0.9) * 0.8 * amount;
      pose.ay += Math.sin(seconds * 0.66 + 2.3) * 5 * amount;
    }
    if (actor === state.live) {
      pose.rx *= 1 - flat;
      pose.ry *= 1 - flat;
      pose.rz *= 1 - flat;
    }
    return { pose, o: actor.cover ? pose.o : pose.o * clamp(actor.fade + (actor.ready ? t / 0.45 : -t / 0.2)) };
  }

  function frame(now) {
    if (!state.running) return;
    const elapsed = state.last ? Math.min(2, (now - state.last) / 1000) : 0.016;
    const dt = Math.min(0.05, elapsed);
    state.last = now;
    advance(elapsed);
    const u = state.u;

    const flatWas = state.flat;
    state.flat = lerp(state.flat, state.live ? 1 : 0, 1 - Math.exp(-elapsed / 0.18));
    if (Math.abs(state.flat - (state.live ? 1 : 0)) < 0.001) state.flat = state.live ? 1 : 0;
    const calm = seg(u, 0.1, 0.5) * (1 - seg(u, T.end - 0.1, T.end + 0.2));
    const swing = REDUCED || !sway || compact ? 0 : (1 - state.flat) * calm;
    state.px = lerp(state.px, state.tx, 1 - Math.exp(-dt / 0.3));
    state.py = lerp(state.py, state.ty, 1 - Math.exp(-dt / 0.3));
    const tilt = `rotateX(${(-state.py * 1.1 * swing).toFixed(3)}deg) rotateY(${(state.px * 1.6 * swing).toFixed(3)}deg)`;
    if (tilt !== state.tilt) {
      state.tilt = tilt;
      world.style.transform = tilt;
    }

    const seconds = now / 1000;
    const clock = document.timeline.currentTime ?? now;
    const gliding = state.u !== state.target || state.v !== 0 || state.flat !== flatWas;
    const fadeWas = handset.fade;
    handset.tick(elapsed);
    if (handset.ready && handset.fade >= 1 && cover.style.backgroundImage) cover.style.backgroundImage = "";
    const steps = [stepOf(handset, phone.track, 0, seconds)];
    const steady = !gliding && handset.fade === fadeWas;
    if (!(steady && handset.motion && now - handset.motionAt < 240)) {
      if (!steady || floatOf(u) > 0) {
        handset.motionAt = now;
        for (let step = 1; step <= STEPS; step += 1) {
          const t = (HORIZON * step) / STEPS;
          steps.push(stepOf(handset, phone.track, t, seconds + t));
        }
      }
      handset.setMotion(steps, HORIZON * 1000, clock);
    }
    setStage(area(u));

    if (!state.live && loaded.phone) phone.update(u, dt, now, clamp(state.target, 0, T.total));

    onFrame?.(u, dt);
    state.raf = requestAnimationFrame(frame);
  }

  function boot() {
    if (loaded.phone || state.hold) return;
    loaded.phone = true;
    phone.load();
  }

  function start() {
    if (state.running) return;
    state.running = true;
    layout();
    window.addEventListener("pointermove", onPointer, { passive: true });
    boot();
    state.last = 0;
    state.raf = requestAnimationFrame(frame);
  }

  function release() {
    state.hold = false;
    if (state.running) boot();
  }

  function stop() {
    state.running = false;
    cancelAnimationFrame(state.raf);
    window.removeEventListener("pointermove", onPointer);
  }

  function destroy() {
    stop();
    setLive(false);
    phone.sheet.destroy();
    handset.plane.remove();
  }

  return {
    T, CAPTIONS, state, compact, fit: false, mode,
    get u() { return state.u; },
    get target() { return state.target; },
    get live() { return Boolean(state.live); },
    get ready() { return handset.ready; },
    get covered() { return Boolean(handset.cover); },
    get held() { return state.hold; },
    setTarget(u) { state.target = clamp(u, 0, T.total); },
    jump(u) {
      state.target = clamp(u, 0, T.total);
      state.u = state.target;
      state.v = 0;
    },
    lead: () => leadAt(state.u),
    settled: () => Math.abs(state.target - state.u) < 0.0005 && handset.ready && !phone.pending(),
    setLive, layout, start, stop, destroy, release,
    actors: { handset },
    directors: { phone },
  };
}
