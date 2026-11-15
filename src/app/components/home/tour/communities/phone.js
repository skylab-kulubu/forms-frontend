import { M, OFF, R, lerp, part, scrollSpot, scrollTo, seg, shot, slot, splitArea, stint, throttle, typed } from "../film/engine.js";
import { T } from "./script.js";
import { APPROVE_AT } from "./room.js";

const S = T.fill;
const WHY = "Okulda öğrendiklerimi bir ekiple gerçek bir ürüne dönüştürmek istiyorum.";
const GITHUB = "https://github.com/egeyildirim";

export const SUBMIT_AT = S + 1.32;
export const ANSWERS = {
  f1: "Ege Yıldırım", f2: "ege@example.com", f3: "20", f4: WHY, f5: "WEBLAB", f7: GITHUB, f10: "12", f12: "", f13: "Evet", f15: "8",
  f14: JSON.stringify({ React: "İyi", Go: "Orta" }),
};

export function fillAt(u) {
  const f = u - S;
  const values = {};
  const age = typed("20", seg(f, 0.12, 0.2));
  if (age) values.f3 = age;
  const why = typed(WHY, seg(f, 0.24, 0.54));
  if (why) values.f4 = why;
  if (f >= 0.62) values.f5 = "WEBLAB";
  const link = typed(GITHUB, seg(f, 0.7, 0.88));
  if (link) values.f7 = link;
  if (f >= 0.92) values.f10 = Math.round(lerp(2, 12, seg(f, 0.92, 1.0)));
  if (f >= 1.04) values.f13 = true;
  if (f >= 1.08) values.f14 = f >= 1.12 ? { React: "İyi", Go: "Orta" } : { React: "İyi" };
  if (f >= 1.16) values.f15 = Math.round(lerp(1, 8, seg(f, 1.16, 1.24)));

  let spot = "submit";
  if (f < 0.08) spot = "f1";
  else if (f < 0.22) spot = "f3";
  else if (f < 0.58) spot = "f4";
  else if (f < 0.68) spot = "f5";
  else if (f < 0.9) spot = "f7";
  else if (f < 1.02) spot = "f10";
  else if (f < 1.07) spot = "f13";
  else if (f < 1.15) spot = "f14";
  else if (f < 1.27) spot = "f15";
  return { values, spot };
}

export function createPhone(actor, IDS, mode = {}) {
  const compact = Boolean(mode.compact);
  let applied = {};
  let formId = null;
  const fillTick = throttle(70);

  const all = () => R(0, 0, actor.pw, actor.ph);
  const rest = (dx, ry) => () => shot(actor, all(), { mode: "height", max: 0.98, min: 0.78, pad: 8, ry, rx: 1.5, dx, z: 140 });
  const away = (dx, dy, ry) => () => shot(actor, all(), { mode: "height", max: 0.9, min: 0.7, pad: 8, ry, rx: 6, dx, dy, o: 0, z: 400 });
  const side = () => shot(actor, all(), { max: 0.8, min: 0.3, pad: 6, ry: -12, rx: 2, z: 80, area: splitArea().right });
  const enter = () => shot(actor, all(), { mode: "height", max: 0.94, min: 0.74, pad: 8, ry: -34, rx: 4, dx: 0.52, dy: 0.16, z: 260 });

  const hiddenLeft = () => slot(actor, OFF.after);
  const trackCompact = [
    ...stint(actor, T.fill, T.review),
    ...stint(actor, T.review + 1.06, T.stats),
    { u: T.end - 0.1, f: hiddenLeft },
  ];

  const middle = (ry) => () => shot(actor, all(), { mode: "height", max: 1, min: 0.4, pad: 14, ry, rx: 1.5, z: 140 });
  const leftAway = () => shot(actor, all(), { mode: "height", max: 0.92, min: 0.4, pad: 14, ry: 30, rx: 4, dx: -0.14, dy: 0.08, o: 0, z: 240 });
  const rightAway = () => shot(actor, all(), { mode: "height", max: 0.92, min: 0.4, pad: 14, ry: -30, rx: 4, dx: 0.14, dy: 0.08, o: 0, z: 240 });
  const trackFit = [
    { u: T.live + 0.36, f: away(0.3, 0.3, -44) },
    { u: T.live + 0.52, f: () => shot(actor, all(), { mode: "height", max: 0.96, min: 0.4, pad: 14, ry: -26, rx: 4, dx: 0.16, dy: 0.12, z: 240 }) },
    { u: T.fill + 0.12, f: middle(-6) },
    { u: T.review - 0.34, f: middle(-3) },
    { u: T.review - 0.08, f: leftAway },
    { u: APPROVE_AT + 0.04, f: rightAway },
    { u: APPROVE_AT + 0.2, f: middle(-5) },
    { u: T.stats - 0.06, f: middle(-3) },
    { u: T.stats + 0.1, f: leftAway },
    { u: T.end - 0.1, f: leftAway },
    { u: T.end + 0.22, f: () => shot(actor, all(), { max: 0.76, ry: -8, rx: 2, z: 200, area: part(0.36, 0.3, 0.28, 0.68) }) },
  ];

  const trackSide = [
    { u: T.live + 0.36, f: away(0.66, 0.3, -48) },
    { u: T.live + 0.5, f: enter },
    { u: T.fill + 0.12, f: rest(0.2, -10) },
    { u: T.review - 0.34, f: rest(0.2, -5) },
    { u: T.review - 0.04, f: side },
    { u: T.stats - 0.22, f: side },
    { u: T.stats - 0.02, f: away(0.75, 0.1, -50) },
    { u: T.end - 0.1, f: away(0.75, 0.1, -50) },
    { u: T.end + 0.22, f: () => shot(actor, all(), { max: 0.76, ry: -8, rx: 2, z: 200, area: part(0.36, 0.3, 0.28, 0.68) }) },
  ];
  const safe = (options) => () => shot(actor, all(), { mode: "height", min: 0.4, pad: 14, rx: 1.5, z: 140, area: M.S, ...options });
  const trackBleed = [
    { u: T.live + 0.36, f: safe({ max: 0.9, ry: -44, rx: 6, dx: 0.3, dy: 0.3, o: 0, z: 400 }) },
    { u: T.live + 0.52, f: safe({ max: 0.96, ry: -26, rx: 4, dx: 0.16, dy: 0.12, z: 240 }) },
    { u: T.fill + 0.12, f: safe({ max: 1, ry: -6 }) },
    { u: T.review - 0.34, f: safe({ max: 1, ry: -3 }) },
    { u: T.review - 0.08, f: safe({ max: 0.92, ry: 30, rx: 4, dx: -0.14, dy: 0.08, o: 0, z: 240 }) },
    { u: APPROVE_AT + 0.04, f: safe({ max: 0.92, ry: -30, rx: 4, dx: 0.14, dy: 0.08, o: 0, z: 240 }) },
    { u: APPROVE_AT + 0.2, f: safe({ max: 1, ry: -5 }) },
    { u: T.stats - 0.06, f: safe({ max: 1, ry: -3 }) },
    { u: T.stats + 0.1, f: safe({ max: 0.92, ry: 30, rx: 4, dx: -0.14, dy: 0.08, o: 0, z: 240 }) },
  ];
  const track = compact ? trackCompact : mode.fit ? trackFit : mode.fill ? trackBleed : trackSide;

  function load() {
    applied = {};
    formId = null;
    actor.load(`/${IDS.F1}`, (self) => Boolean(self.win.__formsTour?.form && (self.q('[data-slot="form-card"]') || self.q('[data-slot="screen-title"]') || self.q("h1"))));
  }

  function refresh() {
    const client = actor.ready ? actor.win.__formsTour?.query : null;
    if (!client) {
      load();
      return;
    }
    applied = {};
    client.invalidateQueries({ queryKey: ["display-form"] });
  }

  function submitted() {
    return Boolean(actor.ready && actor.win.__formsTour?.form?.state?.submissionState);
  }

  function hasForm() {
    const form = actor.ready ? actor.win.__formsTour?.form : null;
    return Boolean(form?.state?.form?.id === IDS.F1 && !form.state.submissionState);
  }

  function submit() {
    if (!hasForm()) return false;
    const form = actor.win.__formsTour?.form;
    const { values } = fillAt(SUBMIT_AT);
    Object.entries(values).forEach(([id, value]) => form.set(id, value));
    setTimeout(() => actor.win?.__formsTour?.form?.submit?.(), 60);
    return true;
  }

  function update(u, dt, now) {
    if (!actor.ready) return;
    const form = actor.win.__formsTour?.form;
    if (!form) return;
    const current = form.state?.form?.id ?? null;
    if (current !== formId) {
      formId = current;
      applied = {};
    }

    const scroller = actor.q(".h-dvh.overflow-y-auto") ?? actor.doc.scrollingElement;
    if (form.state?.submissionState || form.state?.intro || current !== IDS.F1) {
      scrollTo(scroller, 0, dt, 0.2);
      return;
    }
    if (u >= SUBMIT_AT) return;

    const state = fillAt(u);
    const key = JSON.stringify(state.values);
    if (key !== applied.key && fillTick(now)) {
      applied.key = key;
      const ids = new Set([...Object.keys(state.values), ...Object.keys(applied.values ?? {})]);
      const sent = {};
      ids.forEach((id) => {
        const next = state.values[id];
        const mark = JSON.stringify(next ?? null);
        sent[id] = mark;
        if (applied.values?.[id] === mark) return;
        form.set(id, next === undefined ? (id === "f13" ? false : id === "f14" ? {} : "") : next);
      });
      applied.values = sent;
    }

    const target = state.spot === "submit" ? actor.q('[data-slot="submit"]') : actor.doc.getElementById(state.spot);
    scrollSpot(actor, scroller, target, dt, { at: 0.42, head: 160, tau: 0.22 });
  }

  return { actor, track, load, refresh, update, submit, submitted, hasForm, resync: () => { applied = {}; } };
}
