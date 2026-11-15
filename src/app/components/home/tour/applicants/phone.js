import { NOTES, stampOf } from "@/lib/demo/server/applicants";
import { M, R, handAt, scrollSpot, scrollTo, seg, shot, throttle, typed } from "../film/engine.js";
import { BEAT, T, TEXT } from "./script.js";
import { createMailSheet, mailOf, mailWindow } from "./mail.js";

const INTRO_KEY = "skyforms:intro";
const TEAM = "Frontend";
const STACK = ["0", "1", "4"];
const SLOTS = ["0", "2"];
const PLACE = "Yüz yüze, B-204";

export function createPhone(actor, IDS, mode = {}, { ghost = null, control = null } = {}) {
  const compact = Boolean(mode.compact);
  const { FA1, FA2, FA3, RUN } = IDS;

  const SCREENS = [
    { kind: "form1", url: FA1, phase: "fresh", until: BEAT.submit1 },
    { kind: "status1", url: FA1, phase: "sent1", until: BEAT.mail2.cta },
    { kind: "revise", url: FA1, phase: "returned", until: BEAT.submit2 },
    { kind: "status1b", url: FA1, phase: "sent2", until: BEAT.mail3.cta },
    { kind: "gate", url: FA2, phase: "approved1", until: BEAT.start },
    { kind: "task", url: FA2, phase: "running", until: BEAT.submit3 },
    { kind: "status2", url: FA2, phase: "sent3", until: BEAT.mail4.cta },
    { kind: "form3", url: FA3, phase: "approved2", until: BEAT.submit4 },
    { kind: "status3", url: FA3, phase: "sent4", until: Infinity },
  ];
  const indexAt = (u) => SCREENS.findIndex((screen) => u < screen.until);

  const phaseFor = (kind, u) => {
    if (kind === "status1") return u >= BEAT.returned ? "returned" : "sent1";
    if (kind === "status1b") return u >= BEAT.approved1 ? "approved1" : "sent2";
    if (kind === "status2") return u >= BEAT.approved2 ? "approved2" : "sent3";
    return SCREENS.find((screen) => screen.kind === kind).phase;
  };

  const sheet = createMailSheet(actor);
  const typeTick = throttle(70);
  const clickTick = throttle(600);
  let shown = -1;
  let pending = null;
  let posted = null;
  let posting = null;
  let applied = {};
  let loading = false;
  let lastU = 0;

  const all = () => R(0, 0, actor.pw, actor.ph);
  const flat = (extra = {}) => () => shot(actor, all(), { mode: "height", max: 1, min: 0.3, pad: 0, halign: M.hero, ...extra });
  const rest = (extra = {}) => () => shot(actor, all(), { mode: "height", max: 1, min: 0.3, pad: 10, rx: 1.5, ry: -6, ...extra });
  const near = (extra = {}) => rest({ z: 150, ry: -2.5, rx: 1, ...extra });
  const F = T.form;
  const trackPhone = [
    { u: 0, f: flat() },
    { u: 0.34, f: flat({ rx: 3, ry: -8 }) },
    { u: F + 0.22, f: rest({ ry: -9, rx: 2.5 }) },
    { u: F + 0.7, f: rest({ ry: -5 }) },
    { u: BEAT.submit1, f: rest({ ry: -4 }) },
    { u: BEAT.mail1.open, f: near() },
    { u: BEAT.mail1.close, f: near({ ry: -1.5 }) },
    { u: T.fix - 0.1, f: rest({ ry: -7, rx: 2 }) },
    { u: BEAT.mail2.open, f: near() },
    { u: BEAT.mail2.cta + 0.1, f: rest({ ry: -5 }) },
    { u: BEAT.submit2, f: rest({ ry: -3.5 }) },
    { u: T.result - 0.1, f: rest({ ry: -7, rx: 2 }) },
    { u: BEAT.mail3.open, f: near() },
    { u: BEAT.mail3.cta + 0.1, f: rest({ ry: -5 }) },
    { u: BEAT.start, f: near({ ry: -3 }) },
    { u: BEAT.submit3, f: rest({ ry: -4 }) },
    { u: T.meet - 0.1, f: rest({ ry: -7, rx: 2 }) },
    { u: BEAT.mail4.open, f: near() },
    { u: BEAT.mail4.cta + 0.1, f: rest({ ry: -5 }) },
    { u: BEAT.submit4 + 0.1, f: rest({ ry: -3 }) },
    { u: T.end - 0.3, f: rest({ ry: -3 }) },
    { u: T.end, f: flat({ rx: 2, ry: -5 }) },
    { u: T.end + 0.3, f: flat() },
  ];
  const card = () => shot(actor, all(), { mode: "width", max: 1, valign: "top" });
  const trackCompact = [{ u: 0, f: card }, { u: T.total, f: card }];
  const track = compact ? trackCompact : trackPhone;

  const formOf = () => (actor.ready ? actor.win?.__formsTour?.form ?? null : null);
  const buttonByText = (text) => actor.all("button").find((element) => element.textContent.trim() === text) ?? null;
  const scroller = () => actor.q(".h-dvh.overflow-y-auto") ?? actor.doc?.scrollingElement ?? null;

  const markIntro = (formId, round, seen) => {
    const key = `${INTRO_KEY}:${RUN}:${formId}${round > 1 ? `:${round}` : ""}`;
    const seeds = actor.binding?.storage?.localStorage;
    if (!seeds) return;
    if (seen) seeds[key] = "1";
    else delete seeds[key];
  };

  const readyCheck = (self) => Boolean(self.q('[data-slot="screen-title"]') || (self.win.__formsTour?.form && self.q('[data-slot="form-card"]')));

  async function setPhase(phase, force = false) {
    if (!force && posted === phase) return;
    posted = phase;
    posting = Promise.resolve(control?.().setPhase(phase));
    await posting;
    posting = null;
  }

  async function hardSet(index, u) {
    const screen = SCREENS[index];
    shown = index;
    loading = true;
    pending = { to: index, at: performance.now(), hard: true };
    applied = {};
    await setPhase(screen.phase, true);
    markIntro(FA1, 1, true);
    markIntro(FA1, 2, screen.kind === "revise" ? u >= BEAT.revise : true);
    markIntro(FA2, 1, screen.kind === "gate" ? u >= BEAT.gate : true);
    markIntro(FA3, 1, screen.kind === "form3" ? u >= BEAT.slots[0] - 0.12 : true);
    if (actor.cover) actor.cover.style.backgroundImage = screen.kind === "form1" && ghost ? ghost : "";
    actor.load(`/${screen.url}`, readyCheck);
    pending.at = performance.now();
    loading = false;
  }

  function load() {
    loading = false;
    shown = -1;
    pending = null;
    posted = null;
    applied = {};
  }

  function screenNow() {
    const form = formOf();
    if (form?.state?.intro) return "intro";
    if (form?.state?.submissionState || actor.q('[data-slot="status-screen"]')) return "status";
    if (form && actor.q('[data-slot="form-card"]')) return "form";
    return null;
  }

  function settle(now) {
    if (!pending) return true;
    const want = SCREENS[pending.to].kind;
    const view = actor.ready ? screenNow() : null;
    const done = want.startsWith("status") ? view === "status"
      : want === "task" ? formOf()?.state?.attempt?.state === "running"
        : view === "form" || view === "intro";
    if (done) {
      pending = null;
      return true;
    }
    if (now - pending.at > (pending.hard ? 20000 : 6000)) {
      pending = null;
      hardSet(indexAt(Math.max(lastU, 0)), lastU);
    }
    return false;
  }

  function values(entries) {
    const form = formOf();
    if (!form) return;
    entries.forEach(([id, value]) => {
      const mark = JSON.stringify(value ?? null);
      if (applied[`v:${id}`] === mark) return;
      applied[`v:${id}`] = mark;
      form.set(id, value);
    });
  }

  function clickOnce(key, element) {
    if (!element || applied[`c:${key}`]) return false;
    applied[`c:${key}`] = true;
    element.click();
    return true;
  }

  function spot(id, dt, at = 0.42) {
    const target = id === "submit" ? actor.q('[data-slot="submit"]') : actor.doc?.getElementById(id);
    scrollSpot(actor, scroller(), target, dt, { at, head: 160, tau: 0.22 });
  }

  function formOne(u, dt, now, round) {
    const form = formOf();
    if (!form) return;
    if (round === 2) {
      if (form.state.intro) {
        const button = buttonByText("Düzeltmeye başla");
        if (u >= BEAT.revise) clickOnce("revise", button);
        if (u < BEAT.revise - 0.14 || !button) scrollTo(scroller(), 0, dt, 0.2);
        else scrollSpot(actor, scroller(), button, dt, { at: 0.62, head: 60, tau: 0.2 });
        return;
      }
      const link = u < BEAT.fixLink[0] ? TEXT.githubWrong : typed(TEXT.github, seg(u, BEAT.fixLink[0], BEAT.fixLink[1])) || "https://";
      if (typeTick(now)) values([["a6", link]]);
      if (u < BEAT.fixLink[0] - 0.06) scrollTo(scroller(), 0, dt, 0.22);
      else spot(u < BEAT.submit2 - 0.12 ? "a6" : "submit", dt);
      return;
    }
    if (form.state.intro) form.endIntro?.();
    const entries = [["a3", u >= BEAT.team ? TEAM : ""], ["a4", u >= BEAT.web]];
    const projects = typed(TEXT.projects, seg(u, BEAT.projects[0], BEAT.projects[1]));
    const github = typed(TEXT.githubWrong, seg(u, BEAT.github[0], BEAT.github[1]));
    entries.push(["a5", projects], ["a6", github], ["a7", STACK.slice(0, Math.round(seg(u, BEAT.stack[0], BEAT.stack[1]) * STACK.length))]);
    if (typeTick(now)) values(entries);
    const focus = u < BEAT.team + 0.06 ? (u < T.form + 0.08 ? "top" : "a3") : u < BEAT.projects[0] ? "a4" : u < BEAT.github[0] ? "a5" : u < BEAT.stack[0] ? "a6" : u < BEAT.submit1 - 0.14 ? "a7" : "submit";
    if (focus === "top") scrollTo(scroller(), 0, dt, 0.22);
    else spot(focus, dt);
  }

  function task(u, dt, now) {
    const form = formOf();
    if (!form) return;
    if (typeTick(now)) values([["b1", typed(TEXT.repo, seg(u, BEAT.repo[0], BEAT.repo[1]))], ["b2", typed(TEXT.summary, seg(u, BEAT.summary[0], BEAT.summary[1]))]]);
    if (u < BEAT.repo[0] - 0.08) scrollTo(scroller(), 0, dt, 0.22);
    else spot(u < BEAT.summary[0] ? "b1" : u < BEAT.submit3 - 0.12 ? "b2" : "submit", dt);
  }

  function gate(u, dt) {
    const form = formOf();
    if (!form) return;
    if (form.state.intro) {
      if (u >= BEAT.gate) form.endIntro?.();
      return;
    }
    const button = buttonByText("Başlat") ?? buttonByText("Görevi başlat");
    if (u < BEAT.begin - 0.1 || !button) scrollTo(scroller(), 0, dt, 0.22);
    else scrollSpot(actor, scroller(), button, dt, { at: 0.62, head: 60, tau: 0.2 });
    if (u >= BEAT.begin) clickOnce("begin", buttonByText("Görevi başlat"));
  }

  function meet(u, dt, now) {
    const form = formOf();
    if (!form) return;
    if (form.state.intro) {
      if (u >= BEAT.slots[0] - 0.08) form.endIntro?.();
      return;
    }
    const picked = SLOTS.slice(0, Math.round(seg(u, BEAT.slots[0], BEAT.slots[1]) * SLOTS.length));
    if (typeTick(now)) values([["c1", picked], ["c2", u >= BEAT.place ? PLACE : ""]]);
    if (u < BEAT.slots[0] - 0.04) scrollTo(scroller(), 0, dt, 0.22);
    else spot(u < BEAT.place + 0.02 ? "c1" : "submit", dt);
  }

  const FINAL = {
    form1: () => [["a3", TEAM], ["a4", true], ["a5", TEXT.projects], ["a6", TEXT.githubWrong], ["a7", STACK]],
    revise: () => [["a6", TEXT.github]],
    task: () => [["b1", TEXT.repo], ["b2", TEXT.summary]],
    form3: () => [["c1", SLOTS], ["c2", PLACE]],
  };

  function advance(from, u, now) {
    const kind = SCREENS[from].kind;
    const form = formOf();
    if (FINAL[kind]) {
      if (!form) return false;
      if (form.state.intro) {
        if (kind === "revise") clickOnce("revise", buttonByText("Düzeltmeye başla"));
        else form.endIntro?.();
        return false;
      }
      const before = JSON.stringify(applied);
      values(FINAL[kind]());
      if (JSON.stringify(applied) !== before || !clickTick(now)) return false;
      const submit = actor.q('[data-slot="submit"]');
      if (!submit) return false;
      submit.click();
      pending = { to: from + 1, at: now };
      shown = from + 1;
      posted = null;
      applied = {};
      return true;
    }
    if (kind === "gate") {
      if (!form || !clickTick(now)) return false;
      const start = buttonByText("Başlat");
      if (!start) {
        clickOnce("begin", buttonByText("Görevi başlat"));
        return false;
      }
      start.click();
      pending = { to: from + 1, at: now };
      shown = from + 1;
      posted = null;
      applied = {};
      return true;
    }
    hardSet(from + 1, u);
    return true;
  }

  const mails = [
    { key: "received", beat: BEAT.mail1, info: () => ({ at: stampOf("sent1") }) },
    { key: "returned", beat: BEAT.mail2, info: () => ({ at: stampOf("returned"), note: NOTES.fix }) },
    { key: "approved1", beat: BEAT.mail3, info: () => ({ at: stampOf("approved1"), note: NOTES.pass1 }) },
    { key: "approved2", beat: BEAT.mail4, info: () => ({ at: stampOf("approved2"), note: NOTES.pass2 }) },
  ];
  const built = new Map();
  const mailAt = (u) => {
    for (const entry of mails) {
      const view = mailWindow(u, entry.beat);
      if (view.banner > 0 || view.open > 0) {
        const read = entry.beat.read;
        let scroll = 0;
        if (entry.key === "received") scroll = seg(u, read[0], read[1]);
        else scroll = seg(u, read[0], read[1]) * sheet.ctaScroll();
        return { entry, ...view, scroll };
      }
    }
    return null;
  };

  const inScreen = (point) => Boolean(point) && point[0] >= actor.inset && point[0] <= actor.pw - actor.inset && point[1] >= actor.inset + actor.head && point[1] <= actor.ph - actor.inset - 6;
  const keep = (find) => {
    let last = null;
    return () => {
      const point = find();
      if (inScreen(point)) last = point;
      return last;
    };
  };
  const at = {
    submit: keep(() => actor.point('[data-slot="submit"]')),
    banner: keep(() => sheet.bannerPoint()),
    cta: keep(() => sheet.ctaPoint()),
    revise: keep(() => actor.point(buttonByText("Düzeltmeye başla"))),
    begin: keep(() => actor.point(buttonByText("Görevi başlat"))),
    start: keep(() => actor.point(buttonByText("Başlat"))),
  };
  const tap = (point, u) => [
    { u: u - 0.06, at: () => null }, { u: u - 0.05, at: point }, { u, at: point, click: true }, { u: u + 0.04, at: point }, { u: u + 0.05, at: () => null },
  ];
  const HAND = [
    ...tap(at.submit, BEAT.submit1),
    ...tap(at.banner, BEAT.mail1.open),
    ...tap(at.banner, BEAT.mail2.open), ...tap(at.cta, BEAT.mail2.cta),
    ...tap(at.revise, BEAT.revise),
    ...tap(at.submit, BEAT.submit2),
    ...tap(at.banner, BEAT.mail3.open), ...tap(at.cta, BEAT.mail3.cta),
    ...tap(at.begin, BEAT.begin), ...tap(at.start, BEAT.start),
    ...tap(at.submit, BEAT.submit3),
    ...tap(at.banner, BEAT.mail4.open), ...tap(at.cta, BEAT.mail4.cta),
    ...tap(at.submit, BEAT.submit4),
  ];

  function update(u, dt, now, target = u) {
    const mail = u > T.form - 0.2 ? mailAt(u) : null;
    if (mail && !built.has(mail.entry.key)) built.set(mail.entry.key, mailOf(mail.entry.key, mail.entry.info()));
    sheet.update(mail ? { key: mail.entry.key, mail: built.get(mail.entry.key), banner: mail.banner, open: mail.open, scroll: mail.scroll } : { key: null });
    actor.setHand(actor.ready ? handAt(u, HAND) : null);

    lastU = target;
    const want = indexAt(Math.max(u, 0));
    const goal = indexAt(Math.max(target, 0));
    if (loading) return;
    if (shown < 0) {
      hardSet(goal, target);
      return;
    }
    if (pending && goal !== pending.to) {
      pending = null;
      hardSet(goal, target);
      return;
    }
    if (!actor.ready || !settle(now)) return;
    if (goal !== shown) {
      if (goal !== shown + 1) {
        hardSet(goal, target);
        return;
      }
      if (want === goal) {
        advance(shown, u, now);
        return;
      }
    }

    const kind = SCREENS[shown].kind;
    const phase = phaseFor(kind, u);
    if (phase !== posted && !posting) setPhase(phase);

    if (kind === "form1") formOne(u, dt, now, 1);
    else if (kind === "revise") formOne(u, dt, now, 2);
    else if (kind === "gate") gate(u, dt);
    else if (kind === "task") task(u, dt, now);
    else if (kind === "form3") meet(u, dt, now);
    else scrollTo(scroller(), 0, dt, 0.2);
  }

  return {
    actor, track, load, update, sheet,
    pending: () => Boolean(pending) || Boolean(posting),
    resync: () => { applied = {}; },
    screen: () => (shown >= 0 ? SCREENS[shown].kind : null),
  };
}
