import { M, R, bleed, clamp, crop, handAt, lerp, panelShot, part, scrollSpot, scrollTo, seg, shot, slot, throttle, typed } from "../film/engine.js";
import { AHMET, BEAT, COMMENT, DESCRIPTION, ME, Q, REPLY, SELIN, T, TEAMS, TEMPLATE_IDS, TITLE } from "./script.js";
import { GHOST_CARD } from "./ghost.js";

const SETTLE_MS = 520;

const B = T.build;
const TM = T.team;
const K = T.talk;
const TH = T.theme;
const L = T.live;

const STAMP = new Date().toISOString();
const THREAD_ID = "t-film-1";

const blank = (field) => {
  const props = { ...field.props, question: "", required: false };
  if (field.type === "short_text") props.inputType = "text";
  if (field.type === "slider") Object.assign(props, { min: 0, max: 100 });
  if (field.type === "file") Object.assign(props, { acceptedFiles: ".pdf,.jpg,.png", maxSize: 0 });
  return { ...field, props };
};

function grown(field, u, { at, type, set = [] }) {
  if (u < at) return null;
  let next = blank(field);
  next = { ...next, props: { ...next.props, question: typed(field.props.question, seg(u, type[0], type[1])) } };
  set.forEach(([when, patch]) => {
    if (u >= when) next = { ...next, props: { ...next.props, ...patch } };
  });
  return next;
}

function path(u, keys) {
  if (u < keys[0][0]) return null;
  let current = keys[0];
  for (let index = 0; index < keys.length - 1; index += 1) {
    const a = keys[index];
    const b = keys[index + 1];
    if (u >= a[0] && u < b[0]) {
      if (a[1] !== b[1]) return { anchor: a[1], x: a[2], y: a[3] };
      const t = (u - a[0]) / (b[0] - a[0]);
      return { anchor: a[1], x: lerp(a[2], b[2], t), y: lerp(a[3], b[3], t) };
    }
    current = b;
  }
  return { anchor: current[1], x: current[2], y: current[3] };
}

const within = (u, from, to) => u >= from && u < to;

export function studioAt(u) {
  const { q1, q2, q3, q4, q12, q13, q15, tpl, c4, c5 } = BEAT;
  const schema = [];
  const doc = { title: typed(TITLE, seg(u, BEAT.title[0], BEAT.title[1])), description: null, status: u >= BEAT.accept ? 2 : 1, schema, brand: within(u, BEAT.theme.pick, BEAT.theme.back) ? "artlab" : null };
  const state = { doc, sel: null, type: null, menu: null, hover: null, toast: null, spot: "title", members: [], cursors: [], threads: [], board: null, reply: "", saved: u >= BEAT.save, inspect: null, pill: within(u, BEAT.theme.open, BEAT.theme.pick) || within(u, BEAT.theme.reopen, BEAT.theme.back) };

  const describe = seg(u, BEAT.desc[0], BEAT.desc[1]);
  if (describe > 0) doc.description = `<p>${typed(DESCRIPTION, describe)}</p>`;
  if (within(u, BEAT.title[0] - 0.03, BEAT.desc[0])) state.type = { key: "form-title", text: doc.title };

  const f1 = grown(Q.f1, u, { at: q1.pick, type: q1.type, set: [[q1.kind, { inputType: "name" }], [q1.must, { required: true }]] });
  const f2 = grown(Q.f2, u, { at: q2.pick, type: q2.type, set: [[q2.kind, { inputType: "email" }], [q2.must, { required: true }]] });
  const f3 = grown(Q.f3, u, { at: q3.at, type: q3.type, set: [[q3.kind, { inputType: "number" }], [q3.must, { required: true }]] });
  const f4 = grown(Q.f4, u, { at: q4.at, type: q4.type, set: [[q4.must, { required: true }]] });
  const f12 = grown(Q.f12, u, { at: q12.at, type: q12.type, set: [[q12.kind, { acceptedFiles: ".pdf", maxSize: 5 }]] });
  const f13 = grown(Q.f13, u, { at: q13.at, type: q13.type, set: [[q13.must, { required: true }]] });
  const f15 = grown(Q.f15, u, { at: q15.pick, type: q15.type, set: [[q15.kind, { min: 1, max: 10 }], [q15.must, { required: true }]] });

  const choices = TEAMS.slice(0, 3);
  if (u >= c4.add) choices.push(typed(TEAMS[3], seg(u, c4.type[0], c4.type[1])));
  if (u >= c5.add) choices.push(typed(TEAMS[4], seg(u, c5.type[0], c5.type[1])));

  [f1, f2, f3, f4].forEach((field) => { if (field) schema.push(field); });
  if (u >= tpl.pick) {
    TEMPLATE_IDS.forEach((id) => {
      if (id === "f14") [f12, f13].forEach((field) => { if (field) schema.push(field); });
      schema.push(id === "f5" ? { ...Q.f5, props: { ...Q.f5.props, choices } } : Q[id]);
    });
  }
  if (f15) schema.push(f15);

  [[q1, "Kısa Yanıt"], [q2, "Kısa Yanıt"], [q15, "Aralık"]].forEach(([beat, label]) => {
    if (!within(u, beat.open, beat.pick)) return;
    state.menu = "add";
    if (u >= beat.open + 0.07) state.hover = label;
  });
  if (within(u, tpl.open, tpl.list)) {
    state.menu = "add";
    if (u >= tpl.open + 0.06) state.hover = "Şablon ekle";
  } else if (within(u, tpl.list, tpl.pick)) {
    state.menu = "templates";
    if (u >= tpl.list + 0.07) state.hover = "Ekip başvurusu";
  }
  if (within(u, tpl.pick, tpl.pick + 0.5)) state.toast = { id: "template", text: "Ekip başvurusu şablonundan 7 bileşen eklendi" };

  if (within(u, q1.pick, q2.pick)) {
    state.sel = "f1";
    state.spot = "f1";
    if (u < q1.type[1] + 0.02) state.type = { key: "q-f1", text: f1.props.question };
  } else if (within(u, q2.pick, tpl.pick)) {
    state.sel = "f2";
    state.spot = "f2";
    if (u < q2.type[1] + 0.02) state.type = { key: "q-f2", text: f2.props.question };
  } else if (within(u, tpl.pick, BEAT.cond)) {
    state.spot = u < tpl.pick + 0.1 ? "f5" : "f7";
  } else if (within(u, BEAT.cond, q3.at)) {
    state.sel = "f7";
    state.spot = "f7";
  }

  const selin = { ...SELIN, here: u >= BEAT.selin, selection: [], editing: null };
  const ahmet = { ...AHMET, here: u >= BEAT.ahmet, selection: [], editing: null };

  if (within(u, q3.at, K)) {
    state.spot = u < q12.at - 0.05 ? "f3" : u < q15.pick ? "f12" : "f15";
    if (within(u, q3.at, q3.away)) Object.assign(selin, { selection: ["f3"], editing: u < q3.type[1] ? "f3" : null });
    if (within(u, q4.at, q4.away)) Object.assign(ahmet, { selection: ["f4"], editing: u < q4.type[1] ? "f4" : null });
    if (within(u, q12.at, q12.away)) Object.assign(selin, { selection: ["f12"], editing: u < q12.type[1] ? "f12" : null });
    if (within(u, q13.at, q13.away)) Object.assign(ahmet, { selection: ["f13"], editing: u < q13.type[1] ? "f13" : null });
    if (u >= q15.pick) {
      state.sel = "f15";
      if (u < q15.type[1] + 0.02) state.type = { key: "q-f15", text: f15.props.question };
    }
  }

  const noted = u >= BEAT.note;
  const replied = u >= BEAT.sent;
  const solved = u >= BEAT.solved;
  if (noted) {
    const comments = [{ id: "c-film-1", author: { id: SELIN.userId, fullName: SELIN.name }, body: COMMENT, createdAt: STAMP, editedAt: null }];
    if (replied) comments.push({ id: "c-film-2", author: { id: ME.id, fullName: ME.fullName }, body: REPLY, createdAt: STAMP, editedAt: null });
    state.threads.push({ id: THREAD_ID, fieldId: "f5", resolvedAt: solved ? STAMP : null, resolvedBy: solved ? { id: SELIN.userId, fullName: SELIN.name } : null, comments });
  }

  if (within(u, TH, L)) {
    state.spot = "title";
    state.inspect = "Görünüm";
  } else if (within(u, K, TH)) {
    state.spot = "f5";
    if (u >= BEAT.board) state.sel = "f5";
    if (within(u, BEAT.board, BEAT.boardOff)) {
      state.board = { active: THREAD_ID };
      if (!replied) state.reply = typed(REPLY, seg(u, BEAT.reply[0], BEAT.reply[1]));
    }
    if (within(u, c4.add, c4.type[1] + 0.02)) state.type = { key: "o-f5-3", text: choices[3] };
    if (within(u, c5.add, c5.type[1] + 0.02)) state.type = { key: "o-f5-4", text: choices[4] };
    if (within(u, BEAT.note - 0.04, BEAT.solved + 0.04)) Object.assign(selin, { selection: ["f5"] });
  } else if (u >= L) {
    state.spot = "title";
    state.inspect = u < L + 0.5 ? "Form durumu" : null;
  }

  state.members = [selin, ahmet].filter((member) => member.here);

  const selinAt = path(u, [
    [BEAT.selin, "card", 0.94, 0.12], [q3.at - 0.03, "f2", 0.55, 0.9], [q3.at, "f3", 0.3, 0.3], [q3.type[1], "f3", 0.62, 0.34], [q3.away, "f3", 0.84, 0.6],
    [q12.at - 0.04, "f10", 0.5, 0.9], [q12.at, "f12", 0.3, 0.28], [q12.type[1], "f12", 0.52, 0.32], [q12.away, "f12", 0.8, 0.62],
    [K, "f5", 0.9, 0.3], [BEAT.note, "f5", 0.97, 0.16], [BEAT.sent, "f5", 0.8, 0.5], [BEAT.solved, "f5", 0.97, 0.2], [BEAT.solved + 0.08, "f6", 0.7, 0.5],
  ]);
  const ahmetAt = path(u, [
    [BEAT.ahmet, "card", 0.06, 0.3], [q4.at - 0.04, "f3", 0.4, 0.96], [q4.at, "f4", 0.3, 0.2], [q4.type[1], "f4", 0.72, 0.24], [q4.away, "f4", 0.5, 0.62],
    [q13.at - 0.03, "f12", 0.4, 0.95], [q13.at, "f13", 0.3, 0.3], [q13.type[1], "f13", 0.7, 0.34], [q13.away, "f13", 0.82, 0.7],
    [K, "f8", 0.6, 0.5], [K + 0.5, "f9", 0.5, 0.4], [K + 0.9, "f10", 0.4, 0.5],
  ]);
  if (selin.here && selinAt) state.cursors.push({ key: SELIN.key, userId: SELIN.userId, ...selinAt });
  if (ahmet.here && ahmetAt) state.cursors.push({ key: AHMET.key, userId: AHMET.userId, ...ahmetAt });

  return state;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function reuse(current, target) {
  const known = new Map(current.map((field) => [field.id, field]));
  return target.map((field) => {
    const old = known.get(field.id);
    if (!old || old.type !== field.type) return field;
    if (same(old, field)) return old;
    const props = {};
    Object.keys(field.props ?? {}).forEach((key) => {
      props[key] = same(old.props?.[key], field.props[key]) ? old.props[key] : field.props[key];
    });
    const next = { ...field, props };
    if (field.condition && same(old.condition, field.condition)) next.condition = old.condition;
    return next;
  });
}

const FALLBACK = { card: R(585, 130, 558, 600), center: R(536, 56, 664, 700) };

export function createStudio(actor, IDS, mode = {}) {
  const compact = Boolean(mode.compact);
  const formId = IDS.FB;
  let api = null;
  let applied = {};
  let cursorAt = 0;
  let clock = 0;
  const docTick = throttle(90);
  const menuTick = throttle(160);
  const pillTick = throttle(280);
  const typeTick = throttle(48);
  const replyTick = throttle(60);

  const realCard = () => actor.clipped(actor.rect(".studio-card"));
  const predict = () => {
    const w = Math.round(clamp(502 + 0.519 * (actor.w - 1493), 280, 672));
    const x = Math.round(816 + 0.481 * (actor.w - 1493) - w / 2);
    const bottom = Math.max(721, actor.h - 95);
    const whole = R(x, 129, w, bottom - 129);
    if (bottom <= actor.ph - 1) return { card: whole, view: whole };
    const rows = [bottom - 41, bottom - 97, bottom - 154].filter((value) => value <= actor.ph - 12);
    return { card: whole, view: R(x, 129, w, (rows.length ? rows[0] : actor.ph) + 10 - 129) };
  };
  const settle = { at: 0 };
  const mixRect = (a, b, k) => R(lerp(a.x, b.x, k), lerp(a.y, b.y, k), lerp(a.w, b.w, k), lerp(a.h, b.h, k));
  const placed = { key: "" };
  const place = (rect) => {
    if (!actor.cover) return;
    const key = `${rect.x.toFixed(1)}|${rect.y.toFixed(1)}|${rect.w.toFixed(1)}|${rect.h.toFixed(1)}`;
    if (key === placed.key) return;
    placed.key = key;
    Object.assign(actor.cover.style, { left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.w}px`, height: `${rect.h}px` });
  };
  if (mode.fill) {
    const cover = document.createElement("div");
    cover.className = "film-cover hm-embed";
    cover.setAttribute("aria-hidden", "true");
    cover.innerHTML = GHOST_CARD;
    actor.inner.insertBefore(cover, actor.veil);
    actor.cover = cover;
    actor.iframe.style.opacity = "0";
    place(predict().card);
  }
  const card = () => realCard() ?? (mode.fill ? predict().card : FALLBACK.card);
  const center = () => actor.rect("[data-studio-center]") ?? FALLBACK.center;
  const all = () => R(0, 0, actor.pw, actor.ph);
  const edit = () => {
    const c = center();
    return R(c.x, 8, actor.pw - 8 - c.x, actor.ph - 16);
  };
  const side = () => {
    const c = center();
    return R(c.x, 0, actor.pw - c.x, actor.ph);
  };

  const hero = (rx, ry, rz) => () => {
    const c = card();
    return shot(actor, c, { pad: 34, max: 0.92, halign: M.hero, rx, ry, rz, clip: c, rad: 24, veil: 1, hole: c });
  };
  const view = { frame: -1, value: null };
  const cardView = () => {
    if (view.frame === actor.frame && view.value) return view.value;
    const c = card();
    let value = c;
    const fields = actor.all(".studio-card [data-fid]");
    const rows = fields.length ? fields : actor.all(".studio-card .divide-y > button");
    if (rows.length && c.y + c.h >= actor.ph - 1) {
      const limit = c.y + c.h - 12;
      let bottom = 0;
      rows.forEach((element) => {
        const box = actor.rect(element);
        if (box && box.y + box.h <= limit) bottom = Math.max(bottom, box.y + box.h);
      });
      const list = fields.length ? null : actor.rect(rows[0].parentElement.parentElement);
      if (bottom > c.y + 160) value = R(c.x, c.y, c.w, bottom + 10 - c.y);
      else if (list && list.y - 16 > c.y + 160) value = R(c.x, c.y, c.w, list.y - 16 - c.y);
    }
    if (mode.fill) {
      const guess = predict();
      const real = realCard();
      if (!actor.ready || !real) {
        value = guess.view;
        place(guess.card);
      } else if (settle.at) {
        const k = clamp((performance.now() - settle.at) / SETTLE_MS);
        if (k < 1) {
          const eased = 1 - (1 - k) ** 3;
          value = mixRect(guess.view, value, eased);
          place(mixRect(guess.card, real, eased));
        } else place(real);
      }
    }
    view.frame = actor.frame;
    view.value = value;
    return value;
  };
  const cardShot = (rx, ry, extra = {}, home = false) => () => {
    const c = cardView();
    return shot(actor, c, { pad: 34, max: 1, halign: M.hero, rx, ry, clip: c, rad: 24, veil: 1, hole: c, ...(home ? { area: mode.home() } : {}), ...extra });
  };
  const pan = (ry = 0, rx = 0, extra = {}) => () => bleed(actor, { ry, rx, hole: card(), ...extra });
  const wide = (ry = -7, rx = 3, shade = 0) => () => shot(actor, all(), { pad: 6, max: mode.whole ? 0.88 : 1, rx, ry, shade, hole: card() });
  const editShot = (ry = -1.2) => () => {
    if (!mode.fill) return shot(actor, edit(), { max: 1, ry, hole: card() });
    return mode.whole ? shot(actor, all(), { max: 1, ry, hole: card() }) : panelShot(actor, side(), { ry });
  };
  const paperShot = (ry = 1.5) => () => {
    const p = center();
    return shot(actor, p, { max: 1, min: 0.5, ry, clip: p, rad: 20, veil: 1, hole: p });
  };
  const aside = () => shot(actor, all(), { pad: 6, max: 0.62, rx: 4, ry: 24, dx: -0.36, shade: 0.45, z: -260 });
  const gone = () => shot(actor, all(), { pad: 6, max: 0.5, rx: 4, ry: 30, dx: -0.6, shade: 0.7, z: -500, o: 0 });

  const paper = (rx, ry, extra = {}, home = false) => () => {
    const c = cardView();
    return shot(actor, c, { pad: 8, max: 0.9, rx, ry, clip: c, rad: 24, veil: 1, hole: c, ...(home ? { area: mode.home() } : {}), ...extra });
  };
  const trackCompact = [
    { u: 0, f: paper(0, 0) },
    { u: 0.34, f: paper(4, -8) },
    { u: B + 0.22, f: () => slot(actor) },
    { u: T.fill - 0.16, f: () => slot(actor) },
    { u: T.fill + 0.04, f: () => slot(actor, { dx: -0.5, o: 0, ry: 16, z: -120 }) },
    { u: T.end - 0.24, f: () => slot(actor, { dx: -0.5, o: 0, ry: 16, z: -120 }) },
    { u: T.end - 0.22, f: paper(4, -8, { o: 0 }, true) },
    { u: T.end + 0.12, f: paper(0, 0, {}, true) },
  ];

  const whole = (options) => () => slot(actor, options);
  const fan = () => {
    const c = center();
    const r = crop(actor, c.x + c.w / 2);
    return shot(actor, r, { max: 0.5, rx: 4, ry: 26, z: -120, shade: 0.1, clip: r, veil: 1, hole: r, rad: 44, area: part(0, 0.2, 0.56, 0.62) });
  };
  const trackFit = [
    { u: 0, f: hero(13, -26, 4) },
    { u: 0.6, f: hero(9, -17, 2) },
    { u: B + 0.22, f: whole() },
    { u: L + 0.4, f: whole() },
    { u: L + 0.58, f: whole({ shade: 0.62, z: -90 }) },
    { u: T.review - 0.3, f: whole({ shade: 0.62, z: -90 }) },
    { u: T.review - 0.06, f: whole({ shade: 0.8, z: -220, o: 0 }) },
    { u: T.end - 0.1, f: whole({ shade: 0.8, z: -220, o: 0 }) },
    { u: T.end + 0.22, f: fan },
  ];

  const trackSide = [
    { u: 0, f: hero(13, -26, 4) },
    { u: 0.6, f: hero(9, -17, 2) },
    { u: B + 0.22, f: editShot(-2.4) },
    { u: K - 0.02, f: editShot(-0.8) },
    { u: K + 0.14, f: paperShot(2) },
    { u: BEAT.boardOff, f: paperShot(0.8) },
    { u: BEAT.boardOff + 0.12, f: editShot(-1.2) },
    { u: BEAT.save + 0.08, f: editShot(-2) },
    { u: L + 0.56, f: wide(-9, 4) },
    { u: T.fill + 0.12, f: aside },
    { u: T.review - 0.3, f: aside },
    { u: T.review - 0.06, f: gone },
    { u: T.end - 0.1, f: gone },
    { u: T.end + 0.22, f: () => shot(actor, all(), { max: 0.5, rx: 4, ry: 26, z: -120, shade: 0.1, area: part(0, 0.2, 0.56, 0.62) }) },
  ];

  const track = compact ? trackCompact : mode.fit ? trackFit : !mode.fill ? trackSide : [
    { u: 0, f: cardShot(0, 0) },
    { u: 0.34, f: cardShot(3, -7) },
    { u: B + 0.22, f: pan(-6, 2.4) },
    { u: B + 0.5, f: pan(-1.6, 0.6) },
    { u: BEAT.tpl.pick + 0.02, f: pan(-1) },
    { u: BEAT.tpl.pick + 0.16, f: pan(-3.6, 1.2) },
    { u: BEAT.cond, f: pan(-3, 1) },
    { u: BEAT.cond + 0.16, f: pan(-1) },
    { u: K - 0.02, f: pan(-1.8) },
    { u: K + 0.14, f: pan(1.6) },
    { u: BEAT.boardOff, f: pan(0.8) },
    { u: BEAT.boardOff + 0.12, f: pan(-1) },
    { u: TH + 0.04, f: pan(-1.6) },
    { u: BEAT.theme.pick + 0.1, f: pan(1.2) },
    { u: BEAT.theme.back + 0.06, f: pan(0.4) },
    { u: BEAT.save + 0.08, f: pan(-1.6) },
    { u: L + 0.56, f: pan(-4, 1.4, { shade: 0.62 }) },
    { u: T.review - 0.3, f: pan(-3, 1, { shade: 0.62 }) },
    { u: T.review - 0.06, f: pan(4, 0, { shade: 0.8, o: 0 }) },
    { u: T.end - 0.24, f: pan(4, 0, { shade: 0.8, o: 0 }) },
    { u: T.end - 0.22, f: cardShot(3, -7, { o: 0 }, true) },
    { u: T.end + 0.12, f: cardShot(0, 0, {}, true) },
  ];

  const keep = (find) => {
    let last = null;
    return () => {
      const spot = find();
      if (spot) last = spot;
      return last;
    };
  };
  const panel = () => actor.q('[data-studio-root] [role="dialog"][aria-label="Ayarlar"]') ?? actor.all("[data-studio-root] aside").at(-1) ?? null;
  const settings = keep(() => actor.point(actor.all("[data-studio-toolbar] button").find((button) => button.textContent.trim() === "Ayarlar") ?? null));
  const sheetTap = (when) => (mode.sheets ? [{ u: when - 0.01, at: settings }, { u: when, at: settings, click: true }] : []);
  const sheetAt = (u) => {
    if (!mode.sheets) return null;
    const { q1, q2 } = BEAT;
    const open = (from, to) => u >= from && u < to;
    return open(q1.type[1] + 0.05, q1.must + 0.06) || open(q2.type[1] + 0.04, q2.must + 0.05) || open(TH + 0.06, BEAT.theme.pick + 0.07) || open(BEAT.theme.reopen - 0.08, BEAT.theme.back + 0.07) || open(L + 0.06, BEAT.accept + 0.07) ? "inspector" : null;
  };
  const inPanel = (test) => [...(panel()?.querySelectorAll("button") ?? [])].find(test) ?? null;
  const park = keep(() => {
    const c = center();
    return [c.x + c.w * 0.9, c.y + c.h * 0.6];
  });
  const ekle = keep(() => actor.point('[data-studio-toolbar] button[aria-label^="Bileşen ekle"]'));
  const menuItem = (label) => actor.byText('[data-studio-menu] [role="menuitem"] span', label)?.closest("button") ?? null;
  const item = (label) => keep(() => actor.point(menuItem(label), 0.45, 0.5));
  const tile = (label) => keep(() => actor.point(inPanel((button) => button.textContent.trim() === label)));
  const flip = (label) => keep(() => actor.point(inPanel((button) => button.getAttribute("role") === "switch" && button.getAttribute("aria-label") === label)));
  const field = (id, fx = 0.5, fy = 0.3) => keep(() => actor.point(`[data-fid="${id}"]`, fx, fy));
  const notice = keep(() => actor.point('[data-fid="f5"] button[aria-label$="açık yorum"]', 0.5, 0.1));
  const replyBox = () => actor.q('[data-comment-side] [data-board-note][data-focused="true"] textarea') ?? actor.q('[role="dialog"][aria-label="Yorumlar"] textarea');
  const composer = keep(() => actor.point(replyBox(), 0.3, 0.5));
  const themePill = () => inPanel((button) => button.getAttribute("aria-haspopup") === "menu" && button.parentElement?.querySelector("p")?.textContent.trim() === "Tema");
  const pill = keep(() => actor.point(themePill()));
  const option = (label) => keep(() => actor.point(actor.all('[role="menu"] [role="menuitem"]').find((entry) => entry.textContent.trim().startsWith(label)) ?? null, 0.4, 0.5));
  const addChoice = keep(() => actor.point(actor.byText('[data-fid="f5"] button', "Seçenek ekle"), 0.25, 0.5));
  const saveButton = keep(() => actor.point('button[aria-label="Formu kaydet"]'));

  const tap = (at, when, lead = 0.1) => [{ u: when - lead, at: null }, { u: when - 0.02, at }, { u: when, at, click: true }];
  const steps = (list) => {
    const keys = [];
    list.forEach((entry) => {
      if (keys.length && entry.at === null) entry.at = keys[keys.length - 1].at;
      keys.push(entry);
    });
    return keys;
  };

  const { q1, q2, q15, tpl, c4, c5, theme } = BEAT;
  const HAND = steps([
    { u: B + 0.72, at: park },
    ...tap(ekle, q1.open, 0.12), ...tap(item("Kısa Yanıt"), q1.pick),
    { u: q1.pick + 0.08, at: park }, { u: q1.type[1] + 0.01, at: park },
    ...sheetTap(q1.type[1] + 0.05),
    ...tap(tile("İsim"), q1.kind, 0.06), ...tap(flip("Zorunlu"), q1.must, 0.08),
    { u: q1.must + 0.04, at: null },
    ...tap(ekle, q2.open), ...tap(item("Kısa Yanıt"), q2.pick),
    { u: q2.pick + 0.08, at: park }, { u: q2.type[1] + 0.01, at: park },
    ...sheetTap(q2.type[1] + 0.04),
    ...tap(tile("E-Posta"), q2.kind, 0.04), ...tap(flip("Zorunlu"), q2.must, 0.06),
    { u: q2.must + 0.04, at: null },
    ...tap(ekle, tpl.open), ...tap(item("Şablon ekle"), tpl.list), ...tap(item("Ekip başvurusu"), tpl.pick),
    { u: tpl.pick + 0.08, at: park },
    ...tap(field("f7", 0.6, 0.32), BEAT.cond, 0.12),
    { u: BEAT.cond + 0.12, at: park }, { u: q15.open - 0.12, at: park },
    ...tap(ekle, q15.open), ...tap(item("Aralık"), q15.pick),
    { u: q15.pick + 0.08, at: park }, { u: BEAT.board - 0.1, at: park },
    ...tap(notice, BEAT.board, 0.08),
    { u: BEAT.reply[0] - 0.01, at: composer }, { u: BEAT.sent + 0.02, at: composer },
    { u: BEAT.boardOff + 0.1, at: park },
    ...tap(addChoice, c4.add, 0.05), { u: c4.type[1], at: null }, ...tap(addChoice, c5.add, 0.03),
    { u: c5.type[1] + 0.02, at: null },
    ...sheetTap(TH + 0.06),
    ...tap(pill, theme.open, 0.08), ...tap(option("ARTLAB"), theme.pick, 0.08),
    { u: theme.pick + 0.08, at: null }, { u: theme.reopen - 0.12, at: null },
    ...sheetTap(theme.reopen - 0.08),
    ...tap(pill, theme.reopen, 0.06), ...tap(option("SKY LAB"), theme.back, 0.06),
    { u: theme.back + 0.06, at: null },
    ...sheetTap(L + 0.06),
    ...tap(flip("Cevap kabulü"), BEAT.accept, 0.1), ...tap(saveButton, BEAT.save, 0.1),
    { u: BEAT.save + 0.06, at: null }, { u: BEAT.save + 0.16, at: park },
  ]);

  function load() {
    applied = {};
    api = null;
    actor.load(`/admin/forms/${formId}/edit`, (self) => Boolean(self.win.__formsTour?.studio && self.q(".studio-card")
      && (!mode.fill || self.q(".studio-card [data-fid]") || self.q(".studio-card .divide-y > button") || performance.now() - self.askedAt > 12000)));
  }

  function focusText(key, text) {
    const doc = actor.doc;
    const element = actor.q(`[data-edit="${CSS.escape(key)}"]`);
    if (!element) return false;
    const fresh = doc.activeElement !== element;
    if (fresh) element.focus({ preventScroll: true });
    if (element.textContent !== text) element.textContent = text;
    else if (!fresh) return true;
    const range = doc.createRange();
    range.selectNodeContents(element);
    range.collapse(false);
    const selection = actor.win.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    return true;
  }

  function setText(element, text) {
    if (!element || element.value === text) return;
    const setter = Object.getOwnPropertyDescriptor(actor.win.HTMLTextAreaElement.prototype, "value").set;
    setter.call(element, text);
    element.dispatchEvent(new actor.win.Event("input", { bubbles: true }));
  }

  function menuNow() {
    const menu = actor.q("[data-studio-menu]");
    if (!menu) return null;
    return menu.querySelector('input[placeholder^="Şablon"]') ? "templates" : "add";
  }

  function syncMenu(want, hover, now, dt) {
    const current = menuNow();
    if (current !== want) {
      if (!menuTick(now)) return;
      if (!want) api.studio.closeMenu();
      else if (!current) actor.q('[data-studio-toolbar] button[aria-label^="Bileşen ekle"]')?.click();
      else if (want === "templates") menuItem("Şablon ekle")?.click();
      else actor.q('[data-studio-menu] button[aria-label="Geri"]')?.click();
      applied.hover = null;
      return;
    }
    const key = want && hover ? `${want}|${hover}` : null;
    if (key === applied.hover && (!key || menuItem(hover))) return;
    if (!key) {
      applied.hover = null;
      return;
    }
    const target = menuItem(hover);
    if (!target) return;
    const list = target.closest(".overflow-y-auto");
    if (list) {
      const box = list.getBoundingClientRect();
      const spot = target.getBoundingClientRect();
      if (spot.top < box.top + 4 || spot.bottom > box.bottom - 4) {
        scrollTo(list, list.scrollTop + spot.top - box.top - (box.height - spot.height) / 2, dt, 0.1);
        return;
      }
    }
    target.dispatchEvent(new actor.win.MouseEvent("mouseover", { bubbles: true, relatedTarget: null }));
    applied.hover = key;
  }

  const lifted = new Map();

  function liftCursors() {
    if (compact) return;
    const layer = actor.ready ? actor.q("[data-studio-center] > div[aria-hidden='true']") : null;
    const bounds = center();
    const seen = new Set();
    [...(layer?.children ?? [])].forEach((node) => {
      const spot = node.getBoundingClientRect();
      const box = { left: spot.left + actor.inset, top: spot.top + actor.inset + actor.head };
      let entry = lifted.get(node);
      if (!entry) {
        const root = document.createElement("div");
        root.className = "film-cursor";
        root.innerHTML = node.querySelector("svg")?.outerHTML ?? "";
        const svg = root.querySelector("svg");
        if (svg) svg.style.filter = "";
        const label = document.createElement("span");
        root.append(label);
        const shadow = document.createElement("div");
        shadow.className = "film-cursor-shadow";
        actor.over.append(shadow, root);
        entry = { root, label, shadow, text: null };
        lifted.set(node, entry);
      }
      const source = node.querySelector("span");
      const text = source?.textContent ?? "";
      if (entry.text !== text) {
        entry.text = text;
        entry.label.textContent = text;
      }
      const inside = box.left > bounds.x - 6 && box.left < bounds.x + bounds.w - 4 && box.top > bounds.y - 6 && box.top < bounds.y + bounds.h - 4;
      const opacity = inside ? node.style.opacity || "1" : "0";
      entry.root.style.opacity = opacity;
      entry.shadow.style.opacity = opacity === "0" ? "0" : "1";
      entry.label.style.opacity = source?.style.opacity || "1";
      entry.root.style.transform = `translate3d(${box.left.toFixed(1)}px, ${box.top.toFixed(1)}px, 42px)`;
      entry.shadow.style.transform = `translate3d(${(box.left + 4).toFixed(1)}px, ${(box.top + 11).toFixed(1)}px, 1px)`;
      seen.add(node);
    });
    lifted.forEach((entry, node) => {
      if (seen.has(node)) return;
      entry.root.remove();
      entry.shadow.remove();
      lifted.delete(node);
    });
  }

  function applyDoc(state) {
    const view = api.doc.getView();
    if ((view.title ?? "") !== state.doc.title) api.doc.edit([{ op: "set", path: ["title"], value: state.doc.title }], { record: false });
    if ((view.description ?? null) !== state.doc.description) api.doc.edit([{ op: "set", path: ["description"], value: state.doc.description }], { record: false });
    if (Number(view.status) !== state.doc.status) api.doc.edit([{ op: "set", path: ["status"], value: state.doc.status }], { record: false });
    if ((view.brand ?? null) !== state.doc.brand) api.doc.edit([{ op: "set", path: ["brand"], value: state.doc.brand }], { record: false });
    const next = reuse(api.doc.getView().schema, state.doc.schema);
    if (api.schemaOps) {
      const ops = api.schemaOps(api.doc.getView().schema, next);
      if (ops.length) api.doc.edit(ops, { record: false });
    } else {
      api.doc.setSchema(next);
    }
  }

  function update(u, dt, now) {
    clock += dt;
    liftCursors();
    if (!actor.ready) return;
    if (mode.fill && !settle.at) settle.at = performance.now();
    const current = actor.win.__formsTour?.studio;
    if (!current?.doc) return;
    if (current.doc !== api?.doc) {
      api = current;
      applied = {};
      setTimeout(() => actor.doc?.activeElement?.blur?.(), 90);
      return;
    }
    api = current;

    const at = Math.min(u, T.review);
    const state = studioAt(at);

    const docKey = JSON.stringify(state.doc);
    if (docKey !== applied.doc && docTick(now, state.type && !state.menu ? 240 : 90)) {
      applied.doc = docKey;
      applyDoc(state);
    }

    const sel = state.sel ?? "";
    if (sel !== applied.sel) {
      applied.sel = sel;
      api.studio.select(state.sel ? { kind: "fields", ids: [state.sel] } : { kind: "none" });
    }

    syncMenu(state.menu, state.hover, now, dt);

    const picker = themePill();
    if (picker && (picker.getAttribute("aria-expanded") === "true") !== state.pill && pillTick(now)) picker.click();

    const sheet = sheetAt(at);
    if (sheet !== (applied.sheet ?? null)) {
      applied.sheet = sheet;
      api.studio.setSheet?.(sheet);
    }

    if (state.type && !state.menu) {
      const key = `${state.type.key}|${state.type.text}`;
      const held = applied.typeKey === state.type.key && actor.doc.activeElement?.dataset?.edit === state.type.key;
      if ((key !== applied.type || !held) && (!held || typeTick(now))) {
        if (focusText(state.type.key, state.type.text)) {
          applied.type = key;
          applied.typeKey = state.type.key;
        }
      }
    } else if (applied.type) {
      applied.type = "";
      applied.typeKey = null;
      const active = actor.doc.activeElement;
      if (active?.dataset?.edit) active.blur();
    }

    const membersKey = JSON.stringify(state.members);
    if (membersKey !== applied.members) {
      applied.members = membersKey;
      api.session.presence.set(formId, state.members);
      api.session.cursors.keep(formId, new Set(state.members.map((member) => member.key)));
    }

    const cursorsKey = JSON.stringify(state.cursors);
    if (cursorsKey !== applied.cursors || clock - cursorAt > 0.9) {
      applied.cursors = cursorsKey;
      cursorAt = clock;
      state.cursors.forEach((cursor) => api.session.cursors.set(formId, cursor));
    }

    const threadsKey = JSON.stringify(state.threads);
    if (threadsKey !== applied.threads) {
      const before = applied.threadList ?? [];
      applied.threads = threadsKey;
      applied.threadList = state.threads;
      state.threads.forEach((thread) => {
        const old = before.find((entry) => entry.id === thread.id);
        if (old && JSON.stringify(old) === JSON.stringify(thread)) return;
        const last = thread.comments.at(-1);
        api.session.comments.merge(formId, thread, last?.author?.id !== ME.id && (!old || old.comments.length < thread.comments.length));
      });
      before.filter((old) => !state.threads.some((thread) => thread.id === old.id)).forEach((old) => api.session.comments.merge(formId, { ...old, comments: [] }));
    }

    const board = state.board ? `open|${state.board.active ?? ""}` : "";
    if (board !== applied.board) {
      applied.board = board;
      if (state.board) api.studio.openComments({ active: state.board.active });
      else api.studio.closeComments();
    }
    if (state.board) {
      const box = replyBox();
      if (box && state.reply !== applied.reply && replyTick(now)) {
        applied.reply = state.reply;
        setText(box, state.reply);
      }
    } else {
      applied.reply = null;
    }

    const toast = state.toast?.id ?? "";
    if (toast !== applied.toast) {
      applied.toast = toast;
      if (state.toast) api.studio.toast(state.toast.text);
    }

    if (state.saved !== Boolean(applied.saved) && applied.doc === docKey) {
      applied.saved = state.saved;
      if (state.saved) api.save?.();
    }

    const bar = actor.q("[data-studio-toolbar]");
    const tucked = mode.fill || compact ? u < 0.34 || u > T.end - 0.3 : u < 0.62;
    if (bar && (applied.tucked !== tucked || bar !== applied.bar)) {
      applied.tucked = tucked;
      applied.bar = bar;
      bar.style.transition = "opacity .25s ease";
      bar.style.opacity = tucked ? "0" : "";
    }

    const page = actor.q("[data-studio-page]");
    if (state.spot === "title") scrollTo(page, 0, dt, 0.24);
    else scrollSpot(actor, page, actor.q(`[data-fid="${CSS.escape(state.spot)}"]`), dt, { at: 0.36, tau: 0.24 });

    const side = panel()?.querySelector(".overflow-y-auto") ?? null;
    if (side) {
      if (state.inspect) {
        const heading = [...side.querySelectorAll("h2, h3, p, span")].find((entry) => entry.textContent.trim() === state.inspect);
        if (heading) scrollTo(side, side.scrollTop + heading.getBoundingClientRect().top - side.getBoundingClientRect().top - 90, dt, 0.24);
        applied.inspect = true;
      } else if (applied.inspect) {
        scrollTo(side, 0, dt, 0.24);
        if (side.scrollTop < 1) applied.inspect = false;
      }
    }

    actor.setHand(u <= T.fill ? handAt(at, HAND) : null);
  }

  return { actor, track, load, update, resync: () => { applied = {}; }, regions: { card, center, all } };
}
