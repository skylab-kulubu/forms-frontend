import { OFF, R, bleed, crop, handAt, lerp, panelShot, part, scrollSpot, scrollTo, seg, shot, slot, splitArea, stint, throttle, typed } from "../film/engine.js";
import { T } from "./script.js";

const RV = T.review;
const ST = T.stats;
const FL = T.flow;

const OPEN_AT = RV + 0.46;
const NOTE_AT = [RV + 0.52, RV + 0.76];
export const APPROVE_AT = RV + 0.86;
export const NOTE = "Başvurun güzel, teknik görevde görüşürüz.";

const FOCUS_AT = ST + 0.2;
const FILTER_AT = [ST + 0.48, ST + 0.98];
const MATRIX_AT = ST + 1.04;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createRoom(actor, IDS, server, mode = {}) {
  const compact = Boolean(mode.compact);
  const mapped = Boolean(mode.fill);
  let applied = {};
  let switching = null;
  let stuckAt = 0;
  const noteTick = throttle(60);
  const sheetTick = throttle(260);
  const syncSheet = (room, u, now) => {
    if (!mode.sheets) return;
    const want = sheetAt(u);
    if ((room.sheet ?? null) !== want && sheetTick(now)) room.setSheet?.(want);
  };

  const center = () => actor.rect("[data-room-center]") ?? R(556, 56, 694, 700);
  const all = () => R(0, 0, actor.pw, actor.ph);
  const work = () => {
    const c = center();
    return R(c.x, 8, actor.pw - 8 - c.x, actor.ph - 16);
  };

  const side = () => {
    const c = center();
    const top = Math.max(0, c.y - 8);
    return R(c.x, top, actor.pw - c.x, actor.ph - top);
  };
  const pan = (ry = 0, rx = 0, extra = {}) => () => bleed(actor, { ry, rx, ...extra });
  const wide = (ry = -6, rx = 3) => () => shot(actor, all(), { pad: 6, max: mode.whole ? 0.88 : 1, rx, ry });
  const full = (ry = -1.2) => () => {
    if (!mode.fill) return shot(actor, work(), { max: 1, ry });
    return mode.whole ? shot(actor, all(), { max: 1, ry }) : panelShot(actor, side(), { ry });
  };
  const beside = (ry = -2) => () => (mode.fill ? panelShot(actor, side(), { ry, area: splitArea().left }) : shot(actor, work(), { max: 1, ry, area: splitArea().left }));
  const wideBeside = (ry = -7, rx = 3) => () => shot(actor, all(), { pad: 6, max: 1, rx, ry, area: splitArea().left });
  const fan = () => {
    const c = center();
    const r = crop(actor, c.x + c.w / 2);
    return shot(actor, r, { max: 0.5, rx: 5, ry: 0, z: -320, clip: r, veil: 1, hole: r, rad: 44, area: part(0.2, 0, 0.6, 0.5) });
  };
  const before = () => shot(actor, all(), { pad: 6, max: 0.7, rx: 5, ry: -30, dx: 0.55, z: -420, o: 0 });
  const gone = () => shot(actor, all(), { pad: 6, max: 0.5, rx: 4, ry: 30, dx: -0.6, shade: 0.7, z: -500, o: 0 });

  const hiddenLeft = () => slot(actor, OFF.after);
  const trackCompact = [
    ...stint(actor, RV, RV + 1.06),
    ...stint(actor, ST, T.share),
    { u: T.end - 0.1, f: hiddenLeft },
  ];

  const whole = (options) => () => slot(actor, options);
  const trackFit = [
    { u: RV - 0.3, f: whole({ o: 0, z: -220 }) },
    { u: RV - 0.04, f: whole() },
    { u: APPROVE_AT + 0.04, f: whole() },
    { u: APPROVE_AT + 0.2, f: whole({ shade: 0.62, z: -90 }) },
    { u: ST - 0.04, f: whole({ shade: 0.62, z: -90 }) },
    { u: ST + 0.12, f: whole() },
    { u: T.share - 0.26, f: whole() },
    { u: T.share - 0.04, f: whole({ o: 0, z: -220, shade: 0.6 }) },
    { u: T.end - 0.1, f: whole({ o: 0, z: -220, shade: 0.6 }) },
    { u: T.end + 0.22, f: fan },
  ];

  const trackSide = [
    { u: RV - 0.34, f: before },
    { u: RV - 0.04, f: beside(-2.4) },
    { u: ST - 0.22, f: beside(-0.8) },
    { u: ST - 0.02, f: full(-0.8) },
    { u: FL - 0.02, f: full(-2.2) },
    { u: T.share - 0.26, f: full(-0.8) },
    { u: T.share - 0.04, f: gone },
    { u: T.end - 0.1, f: gone },
    { u: T.end + 0.22, f: () => shot(actor, all(), { max: 0.5, rx: 5, ry: 0, z: -320, area: part(0.2, 0, 0.6, 0.5) }) },
  ];

  const track = compact ? trackCompact : mode.fit ? trackFit : !mode.fill ? trackSide : [
    { u: RV - 0.3, f: pan(-8, 2, { o: 0 }) },
    { u: RV - 0.04, f: pan(-2, 0.6) },
    { u: APPROVE_AT + 0.04, f: pan(-1) },
    { u: APPROVE_AT + 0.2, f: pan(2, 0.6, { shade: 0.62 }) },
    { u: ST - 0.04, f: pan(2, 0.6, { shade: 0.62 }) },
    { u: ST + 0.12, f: pan(-1.2) },
    { u: FL - 0.3, f: pan(-2) },
    { u: FL - 0.06, f: pan(5, 0, { o: 0, shade: 0.6 }) },
  ];

  const keep = (find) => {
    let last = null;
    return () => {
      const spot = find();
      if (spot) last = spot;
      return last;
    };
  };
  const park = keep(() => {
    const c = center();
    return [c.x + c.w * 0.86, c.y + c.h * 0.66];
  });
  const approveButton = keep(() => actor.point('[data-act="approve"]'));
  const noteBox = keep(() => actor.point("textarea[data-note]", 0.3, 0.5));
  const confirmButton = keep(() => actor.point('[data-act="confirm"]'));
  const ROWS = "[data-room] aside button, [data-room] aside [role='button'], [data-room-sheet] button, [data-room-sheet] [role='button']";
  const teamRow = keep(() => actor.point(actor.all(ROWS).find((entry) => /^WEBLAB/.test(entry.textContent.trim())) ?? null, 0.3, 0.5));
  const sheetAt = (u) => {
    if (!mode.sheets) return null;
    if (u >= FILTER_AT[0] - 0.12 && u < FILTER_AT[0] + 0.05) return "right";
    return null;
  };
  const chip = keep(() => actor.point('[data-room] button[title="Cevap süzgecini kaldır"]', 0.85, 0.5));

  const HAND = [
    { u: RV + 0.3, at: park },
    { u: OPEN_AT - 0.02, at: approveButton }, { u: OPEN_AT, at: approveButton, click: true },
    { u: NOTE_AT[0] - 0.01, at: noteBox }, { u: NOTE_AT[1] + 0.02, at: noteBox },
    { u: APPROVE_AT - 0.02, at: confirmButton }, { u: APPROVE_AT, at: confirmButton, click: true },
    { u: APPROVE_AT + 0.1, at: park }, { u: FILTER_AT[0] - 0.14, at: park },
    { u: FILTER_AT[0] - 0.02, at: teamRow }, { u: FILTER_AT[0], at: teamRow, click: true },
    { u: FILTER_AT[0] + 0.1, at: park }, { u: FILTER_AT[1] - 0.12, at: park },
    { u: FILTER_AT[1] - 0.02, at: chip }, { u: FILTER_AT[1], at: chip, click: true },
    { u: FILTER_AT[1] + 0.1, at: park },
  ];

  function load() {
    applied = {};
    switching = null;
    const path = server.responseId ? `/admin/forms/${IDS.F1}/responses/${server.responseId}` : `/admin/forms/${IDS.F1}/responses`;
    actor.load(path, (self) => Boolean(self.win.__formsTour?.room && self.q("[data-room-card]")));
  }

  function refresh() {
    const client = actor.ready ? actor.win.__formsTour?.query : null;
    if (!client) {
      load();
      return;
    }
    applied = {};
    client.invalidateQueries();
  }

  function setNote(text) {
    const element = actor.q("textarea[data-note]");
    if (!element || element.value === text) return;
    const setter = Object.getOwnPropertyDescriptor(actor.win.HTMLTextAreaElement.prototype, "value").set;
    setter.call(element, text);
    element.dispatchEvent(new actor.win.Event("input", { bubbles: true }));
  }

  async function approve() {
    if (!actor.ready) return false;
    const room = actor.win.__formsTour?.room;
    if (!room || room.route.mode !== "response" || room.route.responseId !== server.responseId) return false;
    if (!actor.q('[data-act="confirm"]')) {
      actor.q('[data-act="approve"]')?.click();
      await sleep(260);
    }
    setNote(NOTE);
    await sleep(40);
    const confirm = actor.q('[data-act="confirm"]');
    if (!confirm) return false;
    confirm.click();
    for (let tries = 0; tries < 30; tries += 1) {
      await sleep(100);
      if (!actor.q('[data-act="confirm"]') && !actor.q('[data-act="approve"]')) return true;
    }
    return false;
  }

  function update(u, dt, now) {
    if (!actor.ready) return;
    const room = actor.win.__formsTour?.room;
    if (!room) return;
    if (u < RV - 0.5) {
      actor.setHand(null);
      return;
    }

    if (!actor.q(".shimmer")) stuckAt = 0;
    else if (!stuckAt) stuckAt = now;
    else if (now - stuckAt > 3500) {
      stuckAt = now;
      actor.win.__formsTour?.query?.invalidateQueries();
    }

    const mode = u >= FL && !mapped ? "workflow" : u >= ST ? "analytics" : "response";
    const current = room.route.mode;
    if (switching) {
      const settled = current === switching.mode ? now - (switching.done ?? (switching.done = now)) > 450 : now - switching.at > 3000;
      if (!settled) return;
      switching = null;
    }
    if (current !== mode) {
      switching = { mode, at: now };
      applied = { ...applied, focus: undefined, filter: false };
      const patch = mode === "response" && server.responseId ? { responseId: server.responseId } : {};
      Promise.resolve(room.switchMode(mode, patch)).catch(() => {});
      return;
    }
    if (u > (mapped ? FL - 0.04 : T.share + 0.1)) {
      actor.setHand(null);
      return;
    }

    actor.setHand(handAt(u, HAND));
    const canvas = actor.q("[data-room-canvas]");


    if (mode === "response") {
      const r = u - RV;
      if (server.responseId && room.route.responseId !== server.responseId && applied.selected !== server.responseId) {
        applied.selected = server.responseId;
        room.go({ responseId: server.responseId });
        return;
      }
      if (!server.responseId && room.route.responseId && applied.selected !== "none") {
        applied.selected = "none";
        room.go({ responseId: null });
        return;
      }
      syncSheet(room, u, now);
      const next = actor.all('input[type="checkbox"]').find((entry) => entry.closest("label")?.textContent.includes("sıradaki bekleyeni"));
      if (next?.checked) next.click();

      if (server.state === "pending") {
        const confirming = Boolean(actor.q('[data-act="confirm"]'));
        const wantConfirm = u >= OPEN_AT;
        if (wantConfirm && !confirming) actor.q('[data-act="approve"]')?.click();
        if (!wantConfirm && confirming) actor.all("[data-decision] button").find((entry) => entry.textContent.trim().startsWith("Vazgeç"))?.click();
        if (noteTick(now)) setNote(typed(NOTE, seg(u, NOTE_AT[0], NOTE_AT[1])));
      }
      const decision = compact && u >= OPEN_AT - 0.14 ? actor.q("[data-decision]") : null;
      if (decision) scrollSpot(actor, canvas, decision, dt, { at: 0.16, head: 420, tau: 0.22 });
      else scrollTo(canvas, lerp(0, 300, seg(r, 0.12, 0.28)) - lerp(0, 300, seg(r, 0.32, 0.42)), dt, 0.22);
      return;
    }

    if (mode === "analytics") {
      syncSheet(room, u, now);
      const focus = u >= MATRIX_AT ? "f14" : u >= FOCUS_AT ? "f5" : null;
      if (focus !== applied.focus) {
        applied.focus = focus;
        if (focus || room.route.focus) room.go({ focus });
      }
      if (!focus && canvas) scrollTo(canvas, 0, dt, 0.22);
      const wantFilter = u >= FILTER_AT[0] && u < FILTER_AT[1];
      if (wantFilter !== Boolean(applied.filter)) {
        if (wantFilter) {
          const row = actor.all(ROWS).find((entry) => /^WEBLAB/.test(entry.textContent.trim()));
          if (row) {
            row.click();
            applied.filter = true;
          }
        } else {
          actor.q('[data-room] button[title="Cevap süzgecini kaldır"]')?.click();
          applied.filter = false;
        }
      }
      return;
    }

    if (canvas) scrollTo(canvas, lerp(0, Math.min(canvas.scrollHeight - canvas.clientHeight, 760), seg(u, FL + 0.3, T.share - 0.34)), dt, 0.22);
  }

  const pending = () => Boolean(switching) || Boolean(actor.ready && server.responseId && actor.win.__formsTour?.room?.route.mode === "response" && actor.win.__formsTour?.room.route.responseId !== server.responseId);

  return { actor, track, load, refresh, update, approve, pending, resync: () => { applied = {}; } };
}
