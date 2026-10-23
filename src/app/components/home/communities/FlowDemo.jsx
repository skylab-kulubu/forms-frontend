"use client";

import { useEffect, useReducer, useRef } from "react";
import { ArrowRight, Check, Clock, Mail, RotateCcw, Route, X } from "lucide-react";
import Phone from "../Phone";
import { useInView, useReducedMotion } from "../useInView";
import "./flow-demo.css";

const NODES = {
  basvuru: { n: 1, title: "Seçme başvurusu", meta: "4 soru · Manuel onay", review: true, x: 24, y: 166 },
  kod: { n: 2, title: "Kod ödevi", meta: "2 soru · Manuel onay", review: true, x: 318, y: 62 },
  gorusme: { n: 2, title: "Teknik görüşme", meta: "3 soru · Manuel onay", review: true, x: 318, y: 270 },
  deneme: { n: 3, title: "Deneme günü", meta: "1 soru", review: false, x: 612, y: 166 },
};
const ORDER = ["basvuru", "kod", "gorusme", "deneme"];
const EDGES = [
  { from: "basvuru", to: "kod", k: "ok", d: "M200 200 C 259 200, 259 96, 318 96", label: "Takım = Backend", lx: 259, ly: 148, when: "Onaylanınca · Takım = Backend" },
  { from: "basvuru", to: "gorusme", k: "ok", dash: true, d: "M200 200 C 259 200, 259 304, 318 304", label: "aksi halde", lx: 259, ly: 252, when: "Onaylanınca · aksi halde" },
  { from: "basvuru", to: "x1", k: "no", d: "M112 234 L 112 296", when: "Reddedilirse" },
  { from: "kod", to: "deneme", k: "ok", d: "M494 96 C 553 96, 553 200, 612 200", when: "Onaylanırsa" },
  { from: "kod", to: "x2", k: "no", d: "M406 130 L 406 176", when: "Reddedilirse" },
  { from: "gorusme", to: "deneme", k: "ok", d: "M494 304 C 553 304, 553 200, 612 200", when: "Onaylanırsa" },
  { from: "gorusme", to: "x3", k: "no", d: "M406 338 L 406 360", when: "Reddedilirse" },
  { from: "deneme", to: "end", k: "sent", d: "M788 200 L 864 200", when: "Gönderilince" },
];
const CAPS = {
  x1: { k: "no", x: 80, y: 296, w: 64, h: 26 },
  x2: { k: "no", x: 374, y: 176, w: 64, h: 26 },
  x3: { k: "no", x: 374, y: 360, w: 64, h: 26 },
  end: { k: "sent", x: 864, y: 184, w: 92, h: 32 },
};
const TEAMS = ["Frontend", "Backend", "DevOps"];
const NOTES = {
  basvuru: "Bu dönem kontenjan doldu. Bahar seçmelerinde yeniden bekleriz.",
  kod: "Ödevin çalışıyor ama testlerin yarısı geçmedi. Baharda yeniden deneyebilirsin.",
  gorusme: "Görüşme için teşekkürler. Bu dönem başka adaylarla ilerliyoruz.",
};
const MAP_ARIA =
  "Örnek bir takım seçmeleri akışı: Seçme başvurusu onaylanırsa Backend seçenler Kod ödevine, öbürleri Teknik görüşmeye geçer ve bunlardan biri onaylanırsa Deneme günü açılır. Reddedilen adımda akış biter.";

const pct = (v, total) => `${((v / total) * 100).toFixed(2)}%`;
const box = (o) => ({ left: pct(o.x, 1000), top: pct(o.y, 400), width: pct(o.w, 1000), height: pct(o.h, 400) });

const NODE_BOX = Object.fromEntries(ORDER.map((id) => [id, box({ x: NODES[id].x, y: NODES[id].y, w: 176, h: 68 })]));
const CAP_LIST = Object.keys(CAPS).map((key) => ({
  key,
  k: CAPS[key].k,
  box: box(CAPS[key]),
  edge: EDGES.findIndex((e) => e.to === key),
}));
const LABELS = EDGES.flatMap((e, edge) =>
  e.label ? [{ edge, text: e.label, box: { left: pct(e.lx, 1000), top: pct(e.ly, 400) } }] : []
);
const ROUTES = Object.fromEntries(
  ORDER.map((id) => [id, EDGES.map((e, edge) => ({ ...e, edge })).filter((e) => e.from === id)])
);

const SWATCH = { sent: { background: "#a3a3a3" }, ok: { background: "#34d399" }, no: { background: "#f87171" } };
const KIND_CLS = { ok: "is-ok", no: "is-neutral", wait: "is-wait" };
const KIND_TITLE = {
  ok: "Başvurunuz tamamlandı",
  no: "Başvurunuz kabul edilmedi",
  wait: "Başvurunuz inceleniyor",
};

const PAUSE = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="4" width="4" height="16" rx="1" />
    <rect x="14" y="4" width="4" height="16" rx="1" />
  </svg>
);
const PLAY = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z" />
  </svg>
);
const STATUS_ICONS = {
  wait: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M16 22h2a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <circle cx="8" cy="16" r="6" />
      <path d="M9.5 17.5 8 16.25V14" />
    </svg>
  ),
  no: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m14.5 12.5-5 5" />
      <path d="m9.5 12.5 5 5" />
    </svg>
  ),
  ok: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="m9 15 2 2 4-4" />
    </svg>
  ),
};

const INITIAL = {
  ans: "Backend",
  pos: "basvuru",
  phase: "review",
  hist: [],
  out: null,
  mail: "Cevabınızı aldık · Seçme başvurusu",
};
const START = { ...INITIAL, auto: false, press: null, mailN: 0, decN: 0, touched: false, seen: false };

const branch = (ans) => (ans === "Backend" ? "kod" : "gorusme");
const finished = (s) => Boolean(s.out) || s.phase === "done";
const locked = (s) => s.hist.length > 0 || Boolean(s.out);
const manual = (s) => ({ ...s, touched: true, auto: false, press: null });

function approve(s) {
  if (s.phase !== "review" || s.out) return s;
  const from = s.pos;
  const to = from === "basvuru" ? branch(s.ans) : "deneme";
  return {
    ...s,
    hist: [...s.hist, from],
    pos: to,
    phase: "fill",
    mail: `Sonraki adıma geçtiniz · ${NODES[from].title}`,
    mailN: s.mailN + 1,
    decN: s.decN + 1,
  };
}

function decline(s) {
  if (s.phase !== "review" || s.out) return s;
  return {
    ...s,
    out: s.pos,
    phase: "out",
    mail: `Cevabınız incelendi · ${NODES[s.pos].title}`,
    mailN: s.mailN + 1,
    decN: s.decN + 1,
  };
}

function advance(s, to) {
  if (s.pos !== to || s.phase !== "fill") return s;
  const mail = `Cevabınızı aldık · ${NODES[to].title}`;
  if (NODES[to].review) return { ...s, phase: "review", mail, mailN: s.mailN + 1 };
  return { ...s, hist: [...s.hist, to], pos: "end", phase: "done", mail, mailN: s.mailN + 1 };
}

function restart(s, ans) {
  return { ...s, ...INITIAL, ans: ans || "Backend", mailN: s.mailN + 1, press: null };
}

function reducer(s, a) {
  switch (a.type) {
    case "view": {
      const next = { ...s, seen: a.visible };
      if (a.visible) return s.touched || s.auto || a.reduce ? next : { ...next, auto: true };
      return s.auto ? { ...next, auto: false, press: null } : next;
    }
    case "toggle":
      return s.auto ? { ...s, touched: true, auto: false, press: null } : { ...s, touched: true, auto: true };
    case "restart":
      return restart(s, a.ans);
    case "press":
      return s.auto ? { ...s, press: a.kind } : s;
    case "release": {
      const next = { ...s, press: null };
      if (!s.auto) return next;
      return a.kind === "ok" ? approve(next) : decline(next);
    }
    case "advance":
      return advance(s, a.to);
    case "approve":
      return approve(manual(s));
    case "decline":
      return decline(manual(s));
    case "pick":
      return locked(s) ? manual(s) : { ...manual(s), ans: a.team };
    default:
      return s;
  }
}

function nodeState(s, id) {
  if (s.out === id) return "out";
  if (s.hist.includes(id)) return "done";
  if (s.pos === id) return "cur";
  if (finished(s)) return "skip";
  if ((id === "kod" || id === "gorusme") && s.hist.includes("basvuru")) return "skip";
  if (s.pos === "basvuru" && id === branch(s.ans)) return "pre";
  return "idle";
}

function edgeState(s, e) {
  const path = s.out ? [...s.hist] : [...s.hist, s.pos];
  const i = path.indexOf(e.from);
  if (i >= 0 && path[i + 1] === e.to) return "lit";
  if (s.out && e.from === s.out && e.k === "no") return "lit";
  if (finished(s) || s.hist.includes(e.from) || s.out === e.from) return "dim";
  if (nodeState(s, e.from) === "skip") return "dim";
  if (s.pos === "basvuru" && e.from === "basvuru" && e.to === branch(s.ans)) return "pre";
  return "idle";
}

function journey(s) {
  const open = s.pos === "basvuru" && !s.out;
  const mid = open ? "gorusme" : ["kod", "gorusme"].find((id) => s.hist.includes(id) || s.pos === id || s.out === id) || branch(s.ans);
  const route = ["basvuru", mid, "deneme"];
  const items = [];
  for (let i = 0; i < route.length; i++) {
    const id = route[i];
    const node = NODES[id];
    const base = { n: i + 1, title: node.title, titleCls: "f-jr-title", mark: null, date: false, note: null };
    if (s.out === id) {
      items.push({ ...base, markCls: "f-mark is-declined", mark: "no", date: true, detail: "Kabul edilmedi · Bugün", note: NOTES[id] });
      break;
    }
    if (s.hist.includes(id)) {
      items.push({ ...base, markCls: "f-mark is-done", mark: "done", date: true, detail: node.review ? "Onaylandı · Bugün" : "Gönderildi" });
      continue;
    }
    if (s.pos === id && s.phase === "review") {
      items.push({ ...base, markCls: "f-mark is-review", mark: "rev", date: true, detail: "Gönderildi · inceleniyor" });
      continue;
    }
    if (s.pos === id && s.phase === "fill") {
      items.push({ ...base, markCls: "f-mark is-current", mark: "cur", detail: "Şimdi dolduracaksınız" });
      continue;
    }
    if (open) {
      items.push({ ...base, markCls: "f-mark is-future", titleCls: "f-jr-title is-future", detail: "Cevaplarınıza göre açılabilir" });
      continue;
    }
    const prevId = route[i - 1];
    const prev = NODES[prevId];
    const prevLive = s.pos === prevId;
    let detail;
    if (prev.review) {
      detail =
        prevLive && s.phase === "review"
          ? "Onaylanırsa bağlantısı e-postanıza gelir"
          : prevLive
            ? "Onaylanırsa açılır"
            : `${prev.title} onaylanırsa açılır`;
    } else {
      detail = prevLive ? "Bu formu gönderince açılır" : `${prev.title} gönderilince açılır`;
    }
    items.push({ ...base, markCls: "f-mark is-future", titleCls: "f-jr-title is-future", detail });
  }
  const at = s.out ? route.indexOf(s.out) + 1 : s.pos === "end" ? 3 : route.indexOf(s.pos) + 1;
  return { items, stage: Math.max(1, at) };
}

function hint(s) {
  if (s.out) return "Başvuru bu adımda bitti. Ayşe kararı ve ekibin notunu telefonunda görüyor.";
  if (s.phase === "done") return "Deneme günü adımında onay olmadığından Ayşe formu gönderince akış bitti.";
  if (s.phase === "fill") {
    return s.pos === "deneme"
      ? "Deneme günü formu açıldı. Bu adımda onay yok ve cevap gönderince akış bitecek."
      : `Onaylandı. ${NODES[s.pos].title} adımı Ayşe'nin telefonunda açıldı.`;
  }
  if (s.pos === "basvuru") return "Ayşe ilk formu gönderdi. İkinci adım, verdiği takım cevabına göre değişiyor.";
  return s.pos === "kod"
    ? "Ayşe kod ödevini gönderdi. Ekip onaylarsa deneme gününe geçer."
    : "Ayşe teknik görüşme formunu gönderdi. Ekip onaylarsa deneme gününe geçer.";
}

const edgeClass = (e, st) =>
  `fd-e k-${e.k}${e.dash ? " is-dash" : ""}${st === "dim" ? " is-dim" : st === "pre" ? " is-pre" : ""}`;
const litClass = (st) => (st === "lit" ? " is-lit" : st === "dim" ? " is-dim" : "");

function markNode(j) {
  if (j.mark === "done") return <Check size={13} strokeWidth={2.5} aria-hidden="true" />;
  if (j.mark === "no") return <X size={13} strokeWidth={2.5} aria-hidden="true" />;
  if (j.mark === "rev") return <Clock size={13} strokeWidth={2.2} aria-hidden="true" />;
  if (j.mark === "cur") return j.n;
  return null;
}

function Journey({ items }) {
  return (
    <ol className="f-jr">
      {items.map((j, i) => (
        <li className="f-jr-li" key={i}>
          {i < items.length - 1 && <span className="f-jr-line"></span>}
          <span className={j.markCls}>{markNode(j)}</span>
          <div>
            <div className="f-jr-row">
              <span className={j.titleCls}>{j.title}</span>
              {j.date && <span className="f-jr-date">Bugün</span>}
            </div>
            <p className="f-jr-detail">{j.detail}</p>
            {j.note && (
              <div className="f-rnote">
                <p className="f-rnote-k">Ekibin notu</p>
                <p className="f-rnote-v">{j.note}</p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

function Intro({ stage, title, items }) {
  return (
    <div className="fd-intro">
      <Route size={30} strokeWidth={1.6} aria-hidden="true" />
      <p className="fd-intro-c">
        Takım seçmeleri · <em>{stage}. adım</em>
      </p>
      <h2 className="fd-intro-t">{title}</h2>
      <Journey items={items} />
      <span className="fd-bar2">
        <i></i>
      </span>
      <span className="fd-go">Forma geç</span>
    </div>
  );
}

function Status({ kind, stage, items }) {
  return (
    <div className="f-card fd-pc">
      <div className="f-card-in">
        <div className="f-st">
          <span className={`f-st-ic ${KIND_CLS[kind]}`}>{STATUS_ICONS[kind]}</span>
          <p className="f-st-ctx">
            {kind === "wait" ? (
              <>
                Takım seçmeleri · <em>{stage}. adım</em>
              </>
            ) : (
              "Takım seçmeleri"
            )}
          </p>
          <h2 className="f-st-title">{KIND_TITLE[kind]}</h2>
          <div className="f-st-body">
            <Journey items={items} />
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowMap({ s }) {
  const states = EDGES.map((e) => edgeState(s, e));
  const lits = EDGES.filter((e, i) => states[i] === "lit");

  return (
    <div className="fd-canvas f-dots">
      <div className="fd-stage" role="img" aria-label={MAP_ARIA}>
        <svg className="fd-svg" viewBox="0 0 1000 400" aria-hidden="true">
          {EDGES.map((e, i) => (
            <path key={i} className={edgeClass(e, states[i])} d={e.d} />
          ))}
          {lits.map((e, i) => (
            <path key={i} className={`fd-lit k-${e.k}`} d={e.d} pathLength="1" />
          ))}
        </svg>
        {LABELS.map((b, i) => (
          <span key={i} className={states[b.edge] === "dim" ? "fd-el is-dim" : "fd-el"} style={b.box} aria-hidden="true">
            {b.text}
          </span>
        ))}
        {CAP_LIST.map((c) => (
          <span key={c.key} className={`fd-cap k-${c.k}${litClass(states[c.edge])}`} style={c.box} aria-hidden="true">
            biter
          </span>
        ))}
        {ORDER.map((id) => {
          const node = NODES[id];
          const st = nodeState(s, id);
          return (
            <div key={id} className={st === "idle" ? "fd-node" : `fd-node is-${st}`} style={NODE_BOX[id]} aria-hidden="true">
              <div className="fd-node-t">
                <span className="fd-n">{node.n}</span>
                <b>{node.title}</b>
              </div>
              <small>{node.meta}</small>
            </div>
          );
        })}
      </div>
      <ol className="fd-list">
        {ORDER.map((id) => {
          const node = NODES[id];
          const st = nodeState(s, id);
          return (
            <li key={id} className={st === "idle" || st === "pre" ? "fd-li" : `fd-li is-${st}`}>
              <div className="fd-li-h">
                <span className="fd-n">{node.n}</span>
                <b>{node.title}</b>
                <small>{node.meta}</small>
              </div>
              <ul className="fd-rts">
                {ROUTES[id].map((r, i) => (
                  <li key={i} className={`fd-rt k-${r.k}${litClass(states[r.edge])}`}>
                    <i></i>
                    <span>{r.when}</span>
                    <ArrowRight size={11} aria-hidden="true" />
                    <b>{NODES[r.to] ? NODES[r.to].title : "biter"}</b>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function FlowDemo() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef, { threshold: 0.2 });
  const reduce = useReducedMotion();
  const [s, dispatch] = useReducer(reducer, START);
  const { auto, press, ans, pos, phase, out, mail, mailN, decN } = s;

  if (s.seen !== inView) dispatch({ type: "view", visible: inView, reduce });

  useEffect(() => {
    if (!auto) return;
    let autoT;
    if (phase === "review" && !out) {
      const no = ans !== "Backend" && pos !== "basvuru";
      autoT = setTimeout(() => dispatch({ type: "press", kind: no ? "no" : "ok" }), pos === "basvuru" ? 2800 : 2400);
    } else if (out || phase === "done") {
      autoT = setTimeout(() => dispatch({ type: "restart", ans: ans === "Backend" ? "Frontend" : "Backend" }), 4600);
    }
    return () => clearTimeout(autoT);
  }, [auto, ans, pos, phase, out, mailN]);

  useEffect(() => {
    if (!press) return;
    const later = setTimeout(() => dispatch({ type: "release", kind: press }), 420);
    return () => clearTimeout(later);
  }, [press]);

  useEffect(() => {
    if (!inView || phase !== "fill") return;
    const later = setTimeout(() => dispatch({ type: "advance", to: pos }), 1800);
    return () => clearTimeout(later);
  }, [inView, phase, pos]);

  const isLocked = locked(s);
  const isIntro = phase === "fill";
  const cantDecide = phase !== "review" || Boolean(out);
  const kind = out ? "no" : phase === "done" ? "ok" : "wait";
  const j = journey(s);
  const screenKey = `s${pos}${phase}${out || ""}`;

  return (
    <div className="fd" ref={rootRef}>
      <div className="fd-top">
        <p className="f-hint" key={`h${pos}${phase}${out || ""}${ans}`}>
          <i></i>
          <span>{hint(s)}</span>
        </p>
        <div className="fd-top-r">
          <button type="button" className={auto ? "f-auto is-on" : "f-auto"} aria-pressed={auto} onClick={() => dispatch({ type: "toggle" })}>
            {auto ? PAUSE : PLAY}
            {auto ? "Durdur" : "Otomatik oynat"}
          </button>
          <button
            type="button"
            className="f-reset"
            onClick={() => dispatch({ type: "restart", ans: "Backend" })}
            disabled={!isLocked && ans === "Backend" && !auto}
          >
            <RotateCcw size={13} aria-hidden="true" />
            Baştan
          </button>
        </div>
      </div>

      <div className="fd-stage2">
        <div className="fd-phw">
          <Phone scroll={false}>
            <div className="fd-push" key={`p${mailN}`} role="status">
              <span className="fd-push-ic">
                <Mail size={15} aria-hidden="true" />
              </span>
              <div className="fd-push-m">
                <p>
                  <b>E-posta</b>
                  <span>şimdi</span>
                </p>
                <p>{mail}</p>
              </div>
            </div>
            <div className="f-phone-sc">
              {isIntro ? (
                <Intro key={screenKey} stage={j.stage} title={NODES[pos] ? NODES[pos].title : ""} items={j.items} />
              ) : (
                <Status key={screenKey} kind={kind} stage={j.stage} items={j.items} />
              )}
            </div>
          </Phone>
        </div>

        <div className="fd-link" aria-hidden="true">
          <svg viewBox="0 0 56 640" preserveAspectRatio="none">
            <path d="M56 320 C 28 320, 28 300, 0 300" />
          </svg>
          {decN > 0 && <span className="fd-bead" key={`b${decN}`}></span>}
        </div>

        <div className="fd-mapw">
          <div className="f-dm">
            <div className="f-dm-bar">
              <span className="f-dm-t">Takım seçmeleri</span>
              <span className="f-dm-m">Akış · 4 adım</span>
              <span className="f-dm-grow"></span>
              <span className="fd-leg" aria-hidden="true">
                <span>
                  <i style={SWATCH.sent}></i>
                  gönderilince
                </span>
                <span>
                  <i style={SWATCH.ok}></i>
                  onaylanınca
                </span>
                <span>
                  <i style={SWATCH.no}></i>
                  reddedilince
                </span>
              </span>
            </div>
            <FlowMap s={s} />
            <div className="fd-ctl">
              <div className="fd-ans">
                <span className="f-dm-k">Ayşe&apos;nin takım cevabı</span>
                <div className="f-seg2" role="group" aria-label="Ayşe'nin takım cevabı">
                  {TEAMS.map((t) => (
                    <button type="button" key={t} aria-pressed={ans === t} onClick={() => dispatch({ type: "pick", team: t })} disabled={isLocked}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="fd-acts">
                <button type="button" className={press === "ok" ? "f-ok is-press" : "f-ok"} onClick={() => dispatch({ type: "approve" })} disabled={cantDecide}>
                  <Check size={15} aria-hidden="true" />
                  Onayla
                </button>
                <button type="button" className={press === "no" ? "f-no is-press" : "f-no"} onClick={() => dispatch({ type: "decline" })} disabled={cantDecide}>
                  <X size={15} aria-hidden="true" />
                  Reddet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
