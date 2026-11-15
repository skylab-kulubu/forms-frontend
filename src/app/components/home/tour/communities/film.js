import { Actor, M, REDUCED, RIM, clamp, ease, evalTrack, lerp, seg, setStage, visibleOf } from "../film/engine.js";
import { CAPTIONS, T } from "./script.js";
import { createStudio } from "./studio.js";
import { ANSWERS, SUBMIT_AT, createPhone } from "./phone.js";
import { APPROVE_AT, NOTE, createRoom } from "./room.js";
import { createShare } from "./share.js";
import { createFlow } from "./flow.js";
import { createCommunitiesServer } from "@/lib/demo/server/communities";
import { demoBackend } from "@/lib/demo/server/serve";
import { IDS as SEED } from "@/lib/demo/server/communities/seed";
import { TEMPLATE_IDS } from "@/lib/demo/server/communities/templates";

const IDS = { FB: SEED.FB, F1: SEED.F1, W1: SEED.W1, TEAM: TEMPLATE_IDS.team };

const OMEGA = 4.4;
const HORIZON = 0.5;
const STEPS = 30;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitFor(test, ms) {
  const started = performance.now();
  while (performance.now() - started < ms) {
    if (test()) return true;
    await sleep(80);
  }
  return test();
}

function deskSize() {
  const wide = M.V.w >= 1340;
  const scale = Math.min(1, M.V.w / (wide ? 1376 : 1056));
  return { w: wide ? 1960 : 1600, h: Math.round(clamp(M.V.h / scale + 16, 620, 1100)) };
}

function compactSize() {
  const w = Math.round(clamp(M.V.w, 340, 414));
  const scale = Math.min(1, M.V.w / w);
  return { w, h: Math.round(clamp(M.V.h / scale, 460, 900)) };
}

function fitSize() {
  const w = Math.max(1280, Math.round(M.V.w));
  const scale = Math.min(1, M.V.w / w);
  return { w, h: Math.round(clamp(M.V.h / scale, 420, 1600)) };
}

const DOCK = 1288;

function fillSize(lead, rim = RIM, top = 0) {
  const whole = M.V.w >= 1700;
  return { w: Math.round(M.V.w + rim.right + (whole ? 0 : lead)), h: Math.round(clamp(M.V.h - top + rim.bottom, 480, 1700)), whole };
}

function headerBand() {
  const bar = document.querySelector(".f-hdr-in");
  return bar ? Math.max(0, Math.round(bar.getBoundingClientRect().bottom + 8)) : 0;
}

export { CAPTIONS, T };

const WIDE_AT = T.build + 0.5;

export const REPLAY_AT = T.build + 0.3;

export const framed = (u) => (u >= T.end - 0.04 ? 0 : ease(seg(u, 0.34, T.build + 0.22)));

export function createFilm({ scene, world, area: areaOf, sway = true, onFrame = null, compact = false, fit = false, fill = false, band = null, hold = false }) {
  const state = { u: 0, v: 0, target: 0, last: 0, px: 0, py: 0, tx: 0, ty: 0, live: null, flat: 0, running: false, raf: 0, lead: 556, fitAt: 0, hold };
  const server = { state: "none", responseId: null, busy: false };
  const backend = demoBackend(createCommunitiesServer);
  const demo = backend.get;
  const binding = backend.bind;
  const bled = fill && !fit && !compact;
  const top = bled ? band ?? headerBand() : 0;
  const area = (u) => {
    const box = areaOf(u);
    return box.top === undefined ? { ...box, top } : box;
  };

  setStage(area(WIDE_AT));
  const sizeNow = (lead = state.lead, rim = RIM) => (compact ? compactSize() : fit ? fitSize() : fill ? fillSize(lead, rim, 0) : deskSize());
  const sideSize = (rim = RIM) => sizeNow(Math.max(rim.left, DOCK - M.V.w - rim.right), rim);
  const DESK = sizeNow();
  const mode = { compact, fit: fit && !compact, fill: bled, whole: Boolean(DESK.whole), sheets: DESK.w < 1024, home: () => area(0) };

  const deskA = new Actor(world, "deskA", DESK);
  const deskB = new Actor(world, "deskB", bled ? sideSize() : DESK);
  const deskC = new Actor(world, "deskC", bled ? sideSize() : DESK);
  const deskD = new Actor(world, "deskD", bled ? sideSize() : DESK);
  const handset = new Actor(world, "phone", compact ? DESK : { w: 390, h: Math.round(clamp(M.S.h - 90, 560, 800)), phone: true });
  if (compact) [deskA, deskB, deskC, deskD, handset].forEach((actor) => { actor.touch = true; });
  const deskE = bled ? new Actor(world, "deskE", DESK) : null;
  [deskA, deskB, deskC, deskE].forEach((actor) => actor?.bind(binding("admin")));
  deskD.bind(binding("komsu"));
  handset.bind(binding("aday"));
  if (bled) [deskA, deskB, deskC, deskD, deskE].forEach((actor) => {
    actor.bleed = true;
    actor.plane.classList.add("is-fill");
  });

  const studio = createStudio(deskA, IDS, mode);
  const phone = createPhone(handset, IDS, mode);
  const room = createRoom(deskB, IDS, server, mode);
  const share = createShare(deskC, deskD, IDS, mode, () => demo().control.resetShare());
  const flow = deskE ? createFlow(deskE, IDS) : null;
  const directors = flow ? [studio, phone, room, share, flow] : [studio, phone, room, share];

  const tracks = [
    [deskA, studio.track],
    [deskB, room.track],
    [deskC, share.trackOwner],
    [deskD, share.trackGuest],
    [handset, phone.track],
  ];
  if (flow) tracks.push([deskE, flow.track]);

  const loaded = { studio: false, phone: false, share: false, flow: false };

  async function stepServer(want) {
    const { applicant } = demo().control;
    if (server.state === "none") {
      if (phone.submit()) await waitFor(() => phone.submitted(), 2600);
      server.responseId = applicant.ensure(ANSWERS).responseId;
      server.state = "pending";
      room.refresh();
      if (!phone.submitted()) phone.refresh();
      return;
    }
    if (server.state === "pending" && want === "approved") {
      const done = await room.approve();
      if (!done) {
        demo().control.approve(server.responseId, NOTE);
        room.refresh();
      }
      server.state = "approved";
      phone.refresh();
      return;
    }
    if (server.state === "approved") {
      server.responseId = applicant.pending(ANSWERS).responseId;
      server.state = "pending";
      room.refresh();
      phone.refresh();
      return;
    }
    applicant.reset();
    server.state = "none";
    server.responseId = null;
    room.refresh();
    phone.load();
  }

  function syncServer(u) {
    const want = u >= APPROVE_AT ? "approved" : u >= SUBMIT_AT ? "pending" : "none";
    if (server.busy || server.state === want) return;
    server.busy = true;
    stepServer(want).catch((error) => console.error("film:", error)).finally(() => { server.busy = false; });
  }

  function layout() {
    setStage(area(WIDE_AT));
    if (compact || fit || fill) {
      const size = sizeNow(state.lead, deskA.rim ?? RIM);
      mode.sheets = size.w < 1024;
      mode.whole = Boolean(size.whole);
      [deskA, handset, deskE].forEach((actor) => actor?.setSize(size.w, size.h));
      [deskB, deskC, deskD].forEach((actor) => {
        const own = bled ? sideSize(actor.rim ?? RIM) : size;
        actor.setSize(own.w, own.h);
      });
    }
    const origin = `${M.V.x + M.V.w / 2}px ${M.V.y + M.V.h / 2}px`;
    scene.style.perspectiveOrigin = origin;
    world.style.transformOrigin = origin;
  }

  function leadAt(u) {
    if (u < T.build + 0.3 || u >= T.end - 0.1) return null;
    if (compact) {
      if (u < T.fill - 0.06) return deskA;
      if (u < T.review - 0.06) return handset;
      if (u < APPROVE_AT + 0.2) return deskB;
      if (u < T.stats - 0.06) return handset;
      if (u < T.share - 0.06) return deskB;
      return u < T.share + 0.72 ? deskC : deskD;
    }
    if (u < T.live + 0.44) return deskA;
    if (u < T.review - 0.2) return handset;
    if ((mode.fit || mode.fill) && u >= APPROVE_AT + 0.14 && u < T.stats + 0.02) return handset;
    if (u < (flow ? T.flow - 0.08 : T.share - 0.15)) return deskB;
    if (flow && u < T.share - 0.15) return deskE;
    if (u < T.share + 0.72) return deskC;
    return deskD;
  }

  function floatOf(actor, u) {
    if (REDUCED || compact) return 0;
    if (mode.fill) return actor === handset && ((u > T.fill - 0.2 && u < T.review - 0.36) || (u > APPROVE_AT + 0.2 && u < T.stats - 0.1)) ? 0.35 : 0;
    if (actor === deskA && u < T.build + 0.1) return 1 - seg(u, 0.4, T.build + 0.1);
    if (actor === handset && u > T.fill - 0.2 && u < T.review - 0.36) return 0.35;
    if (u > T.end + 0.1 && actor !== deskC) return 0.5 * seg(u, T.end + 0.1, T.end + 0.3);
    return 0;
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
    if (!actor) directors.forEach((director) => director.resync?.());
    state.live = actor;
    if (actor) {
      actor.live = true;
      actor.plane.classList.add("is-live");
      actor.iframe.removeAttribute("aria-hidden");
      tracks.forEach(([each]) => each.setHand(null));
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

  function stepOf(actor, track, index, t, seconds) {
    const u = t ? ahead(t) : state.u;
    setStage(area(u));
    const goal = state.live ? 1 : 0;
    const flat = goal + (state.flat - goal) * Math.exp(-t / 0.18);
    const pose = evalTrack(actor, track, u);
    if (!t) actor.visible = visibleOf(pose);
    const amount = floatOf(actor, u) * (1 - flat);
    if (amount > 0) {
      pose.ry += Math.sin(seconds * 0.52 + index * 1.7) * 1.3 * amount;
      pose.rx += Math.cos(seconds * 0.41 + index * 0.9) * 0.8 * amount;
      pose.ay += Math.sin(seconds * 0.66 + index * 2.3) * 5 * amount;
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
    const calm = mode.fill ? seg(u, 0.1, 0.5) * (1 - seg(u, T.end - 0.1, T.end + 0.2)) : 1;
    const swing = REDUCED || !sway || compact || fit ? 0 : (1 - state.flat) * calm;
    state.px = lerp(state.px, state.tx, 1 - Math.exp(-dt / 0.3));
    state.py = lerp(state.py, state.ty, 1 - Math.exp(-dt / 0.3));
    const tilt = `rotateX(${(-state.py * 1.1 * swing).toFixed(3)}deg) rotateY(${(state.px * 1.6 * swing).toFixed(3)}deg)`;
    if (tilt !== state.tilt) {
      state.tilt = tilt;
      world.style.transform = tilt;
    }

    if (!loaded.phone && u >= T.live - 1.6) {
      loaded.phone = true;
      phone.load();
      if (server.state === "none") room.load();
    }
    if (flow && !loaded.flow && u >= T.flow - 1.6) {
      loaded.flow = true;
      flow.load();
    }
    if (!loaded.share && u >= T.share - 1.4) {
      loaded.share = true;
      share.load();
    }
    if (loaded.phone && !state.live) syncServer(u);

    const seconds = now / 1000;
    const clock = document.timeline.currentTime ?? now;
    const gliding = state.u !== state.target || state.v !== 0 || state.flat !== flatWas;
    tracks.forEach(([actor, track], index) => {
      const fadeWas = actor.fade;
      actor.tick(elapsed);
      const steps = [stepOf(actor, track, index, 0, seconds)];
      const steady = !gliding && actor.fade === fadeWas;
      if (steady && actor.motion && now - actor.motionAt < 240) return;
      if (!steady || floatOf(actor, u) > 0) {
        actor.motionAt = now;
        for (let step = 1; step <= STEPS; step += 1) {
          const t = (HORIZON * step) / STEPS;
          steps.push(stepOf(actor, track, index, t, seconds + t));
        }
      }
      actor.setMotion(steps, HORIZON * 1000, clock);
    });
    if (mode.fill && now - state.fitAt > 400) {
      state.fitAt = now;
      let moved = [deskA, deskB, deskC, deskD, deskE].filter((actor) => actor?.measure()).length > 0;
      const lead = deskA.ready ? Math.round(studio.regions.center().x) : state.lead;
      if (!mode.whole && Math.abs(lead - state.lead) > 3) {
        state.lead = lead;
        moved = true;
      }
      if (moved) layout();
    }
    setStage(area(u));

    if (!state.live) directors.forEach((director) => director.update(u, dt, now));

    onFrame?.(u, elapsed);
    state.raf = requestAnimationFrame(frame);
  }

  function boot() {
    if (loaded.studio || state.hold) return;
    loaded.studio = true;
    studio.load();
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
    tracks.forEach(([actor]) => actor.plane.remove());
  }

  return {
    T, CAPTIONS, state, server, compact, fit: mode.fit, mode,
    get u() { return state.u; },
    get target() { return state.target; },
    get live() { return Boolean(state.live); },
    get ready() { return deskA.ready; },
    get covered() { return Boolean(deskA.cover); },
    get held() { return state.hold; },
    setTarget(u) { state.target = clamp(u, 0, T.total); },
    jump(u) {
      state.target = clamp(u, 0, T.total);
      state.u = state.target;
      state.v = 0;
    },
    lead: () => leadAt(state.u),
    settled: () => Math.abs(state.target - state.u) < 0.0005 && !server.busy && tracks.every(([actor]) => !actor.url || actor.ready) && !directors.some((director) => director.pending?.()),
    setLive, layout, start, stop, destroy, release,
    actors: { deskA, deskB, deskC, deskD, handset, ...(deskE ? { deskE } : {}) },
    directors: { studio, phone, room, share, ...(flow ? { flow } : {}) },
  };
}
