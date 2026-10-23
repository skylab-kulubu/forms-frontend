"use client";

import { memo, useEffect, useRef, useState } from "react";
import { ChevronsUpDown, Eye, RotateCcw } from "lucide-react";
import Phone from "../Phone";
import Duo from "../Duo";
import { useInView, useNarrow, useReducedMotion } from "../useInView";
import "./editor-demo.css";

const TYPES = {
  short_text: { title: "Kısa Yanıt", label: "Kısa Yanıt" },
  long_text: { title: "Uzun Yanıt", label: "Uzun Yanıt" },
  toggle: { title: "Anahtar", label: "Aç / Kapat" },
  combobox: { title: "Açılır Liste", label: "Açılır Liste" },
  multi_choice: { title: "Çoklu Seçim", label: "Çoklu Seçim" },
  slider: { title: "Aralık", label: "Aralık (Slider)" },
  matrix: { title: "Matris / Tablo", label: "Matris Tablo" },
  date: { title: "Tarih Seçici", label: "Tarih" },
  time: { title: "Zaman Seçici", label: "Saat" },
  file: { title: "Dosya Yükleme", label: "Dosya" },
  separator: { title: "Ayıraç", label: "Ayıraç" },
};

const CATS = [
  ["Metin", ["short_text", "long_text"]],
  ["Seçim", ["toggle", "combobox", "multi_choice", "slider", "matrix"]],
  ["Tarih & Saat", ["date", "time"]],
  ["Diğer", ["file", "separator"]],
];

const SUB = { name: "İsim", email: "E-Posta", phone: "Telefon" };
const PH = { name: "Adınızı yazın.", email: "ornek@mail.com", phone: "+90 512 345 67 89" };
const FIELD_IC = { name: "user", email: "mail", phone: "phone" };

const SIDES = { editor: 0, preview: 1 };

const SCRIPT = [
  ["show", "editor", 0],
  ["wait", 900],
  ["hot", "short_text", 700],
  ["add", { type: "short_text", input: "name" }, 260],
  ["type", "Adınız ve soyadınız", 380],
  ["req", 0, 700],
  ["show", "preview", 1700],
  ["show", "editor", 400],
  ["hot", "combobox", 700],
  ["add", { type: "combobox" }, 260],
  ["type", "Hangi takıma başvuruyorsunuz?", 300],
  ["opt", "Frontend", 300],
  ["opt", "Backend", 300],
  ["opt", "DevOps", 420],
  ["req", 1, 700],
  ["show", "preview", 1700],
  ["show", "editor", 400],
  ["hot", "toggle", 700],
  ["add", { type: "toggle" }, 260],
  ["type", "Web geliştirme deneyiminiz var mı?", 700],
  ["hot", "long_text", 700],
  ["add", { type: "long_text" }, 260],
  ["type", "Hangi projelerde yer aldınız?", 420],
  ["condHot", 3, 700],
  ["cond", 3, 1300],
  ["show", "preview", 900],
  ["tap", 2, 1700],
  ["show", "editor", 400],
  ["tplHot", null, 800],
  ["tpl", null, 1100],
  ["show", "preview", 400],
  ["save", null, 4200],
  ["reset", null, 0],
];

const card = (id, type, q, extra) => ({ id, type, q, req: false, ops: [], cond: false, input: null, ...extra });

const BLANK = {
  cards: [],
  hot: null,
  tplHot: false,
  condHot: null,
  typing: null,
  exp: false,
  tap: null,
  saved: true,
  fresh: null,
  act: "start",
};

const FIRST = { ...BLANK, beadN: 0 };

const DONE = {
  ...BLANK,
  cards: [
    card(1, "short_text", "Adınız ve soyadınız", { input: "name", req: true }),
    card(2, "combobox", "Hangi takıma başvuruyorsunuz?", { req: true, ops: ["Frontend", "Backend", "DevOps"] }),
    card(3, "toggle", "Web geliştirme deneyiminiz var mı?"),
    card(4, "long_text", "Hangi projelerde yer aldınız?", { cond: true }),
    card(5, "short_text", "E-posta adresiniz", { input: "email", req: true }),
    card(6, "short_text", "Telefon numaranız", { input: "phone" }),
  ],
  exp: true,
  act: "save",
  beadN: 0,
};

const MUTED = { color: "var(--n600)" };
const MUTED_BLOCK = { display: "block", color: "var(--n600)" };

const cls = (...parts) => parts.filter(Boolean).join(" ");

function hintFor(act) {
  if (act === "start") return "Form boş başlıyor. Ekip soruları kütüphaneden ekliyor. Telefon ise başvuranın göreceği hâli gösteriyor.";
  if (act === "hot" || act === "add" || act === "type" || act === "req") return "Kütüphaneden soru ekleniyor ve soru metni yazılıyor. Soru zorunlu ise telefonda yıldızlanıyor.";
  if (act === "opt") return "Açılır listenin seçenekleri yazılıyor.";
  if (act === "condHot" || act === "cond") return "4. soru 3. sorunun cevabına bağlandı ve yalnız Evet denince görünecek. Bu yüzden telefonda şu an gizli.";
  if (act === "tap") return "Telefonda 3. soru Evet yapıldığından koşullu soru açıldı.";
  if (act === "tplHot" || act === "tpl") return "Şablondan iletişim bilgileri eklendi, böylece şablondaki bütün sorular hızlıca eklenebildi.";
  return "Form kaydedildi. Başvuran formu açtığında telefondaki hâlini görür.";
}

function createTimeline(clock, setView, setSide) {
  let timer = 0;

  const later = (fn, ms) => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };

  const commit = (patch) => {
    clock.view = { ...clock.view, ...patch };
    setView(clock.view);
  };

  const patchAt = (idx, patch) => {
    commit({ cards: clock.view.cards.map((c, n) => (n === idx ? { ...c, ...patch } : c)) });
  };

  const after = (ms) => {
    clock.i += 1;
    later(next, ms);
  };

  function next() {
    const step = SCRIPT[clock.i];
    if (!step) {
      clock.i = 0;
      next();
      return;
    }
    const [kind, arg, ms] = step;
    const s = clock.view;
    switch (kind) {
      case "wait":
        after(arg);
        return;
      case "show":
        if (clock.narrow) setSide(SIDES[arg]);
        after(clock.narrow ? ms : 0);
        return;
      case "hot":
        commit({ hot: arg, act: "hot" });
        after(ms);
        return;
      case "add": {
        clock.seq += 1;
        const added = card(clock.seq, arg.type, "", { input: arg.input || null });
        commit({ cards: [...s.cards, added], hot: null, fresh: added.id, saved: false, act: "add", beadN: s.beadN + 1 });
        after(ms);
        return;
      }
      case "type": {
        const idx = s.cards.length - 1;
        const typeOne = () => {
          const cur = clock.view.cards[idx];
          if (!cur) return;
          const len = cur.q.length;
          if (len >= arg.length) {
            commit({ typing: null });
            after(ms);
            return;
          }
          patchAt(idx, { q: arg.slice(0, len + 1) });
          later(typeOne, 42);
        };
        commit({ typing: s.cards[idx] ? s.cards[idx].id : null, act: "type" });
        typeOne();
        return;
      }
      case "opt": {
        const idx = s.cards.length - 1;
        patchAt(idx, { ops: [...s.cards[idx].ops, arg] });
        commit({ act: "opt" });
        after(ms);
        return;
      }
      case "req":
        patchAt(arg, { req: true });
        commit({ act: "req" });
        after(ms);
        return;
      case "condHot":
        commit({ condHot: arg, act: "condHot" });
        after(ms);
        return;
      case "cond":
        patchAt(arg, { cond: true });
        commit({ condHot: null, act: "cond", beadN: s.beadN + 1 });
        after(ms);
        return;
      case "tap":
        commit({ tap: arg, exp: true, act: "tap" });
        after(ms);
        return;
      case "tplHot":
        commit({ tplHot: true, tap: null, act: "tplHot" });
        after(ms);
        return;
      case "tpl": {
        const a = card(clock.seq + 1, "short_text", "E-posta adresiniz", { req: true, input: "email" });
        const b = card(clock.seq + 2, "short_text", "Telefon numaranız", { input: "phone" });
        clock.seq += 2;
        commit({ cards: [...s.cards, a, b], tplHot: false, fresh: b.id, act: "tpl", beadN: s.beadN + 1 });
        after(ms);
        return;
      }
      case "save":
        commit({ saved: true, act: "save" });
        after(ms);
        return;
      case "reset":
        clock.seq = 0;
        commit(BLANK);
        after(500);
        return;
      default:
        after(300);
    }
  }

  return { start: (ms) => later(next, ms), stop: () => clearTimeout(timer) };
}

const Library = memo(function Library({ hot, tplHot }) {
  return (
    <aside className="el-lib" aria-hidden="true">
      <p className="f-dm-k">Bileşenler</p>
      {CATS.map(([label, types]) => (
        <div key={label}>
          <p className="el-cat">{label}</p>
          {types.map((t) => (
            <span key={t} className={cls("el-it", hot === t && "is-hot")}>
              <span className={`ed-ic ic-${t}`} />
              {TYPES[t].label}
            </span>
          ))}
        </div>
      ))}
      <span className={cls("el-tpl", tplHot && "is-hot")}>
        <span className="ed-ic ic-layers" />
        Şablon ekle
      </span>
    </aside>
  );
});

function CardList({ cards, fresh, typing, condHot }) {
  const iTog = cards.findIndex((c) => c.type === "toggle");
  return (
    <div className="el-list">
      {cards.map((c, i) => {
        const sub = SUB[c.input];
        return (
          <div
            key={c.id}
            className={cls("el-card", c.id === fresh && "is-new", c.id === typing && "is-live", c.cond && i === iTog + 1 && "has-link")}
          >
            <div className="el-ch">
              <span className="el-num">{i + 1}</span>
              <span className={`ed-ic ic-${c.type}`} />
              <span className="el-type">{TYPES[c.type].title}</span>
              {sub && <span className="el-sub">{sub}</span>}
              <span className="f-dm-grow" />
              {i > 0 && (
                <span className={cls("el-pill", c.cond ? "is-on" : condHot === i && "is-hot")}>
                  <span className="ed-ic ic-branch" />
                  {c.cond ? "Aktif" : "Koşul"}
                </span>
              )}
              <span className={cls("el-req", c.req && "is-on")}>
                <span className="el-sw">
                  <i />
                </span>
                Zorunlu
              </span>
            </div>
            <div className="el-cb">
              <p className="el-q">
                {c.q}
                {c.id === typing && <i className="el-caret" />}
                {!c.q && c.id !== typing && <span className="el-ph">Sorunuzu buraya yazın.</span>}
              </p>
              {c.type === "combobox" && c.ops.length > 0 && (
                <div className="el-ops">
                  {c.ops.map((o) => (
                    <span key={o} className="el-op">
                      {o}
                    </span>
                  ))}
                </div>
              )}
              {c.cond && (
                <p className="el-cond">
                  <span className="ed-ic ic-branch" />
                  Eğer <b>Web geliştirme</b> cevabı <b>açıksa (evet)</b> ise gösterilecek.
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Preview({ cards, exp, fresh, tap }) {
  return (
    <div className="f-card el-form">
      <div className="f-card-in">
        <div className="f-fhead">
          <h2 className="f-ftitle">Seçme başvurusu</h2>
        </div>
        <div>
          {cards.length === 0 && <p className="el-empty-p">Bu formda gösterilecek soru yok.</p>}
          {cards.map((c, i) => {
            const on = c.type === "toggle" && exp;
            return (
              <div key={c.id} className={cls("f-reveal", (!c.cond || exp) && "is-open")}>
                <div>
                  <div className={cls("f-q", "el-pq", i < cards.length - 1 && "f-qsep", c.id === fresh && "is-new")}>
                    <div className="f-q-in">
                      <div className="f-qhead">
                        <div className="f-qnum">{i + 1}</div>
                        <p className="f-qtext">
                          {c.q || "…"}
                          {c.req && <span className="f-req">*</span>}
                        </p>
                      </div>
                      <div className="f-qctl">
                        {c.type === "short_text" && (
                          <div className="f-field">
                            <span className="f-fic">
                              <span className={`ed-ic ic-${FIELD_IC[c.input] || "short_text"}`} />
                            </span>
                            <span className="f-input has-ic" style={MUTED}>
                              {PH[c.input] || "Yanıtınızı yazın."}
                            </span>
                          </div>
                        )}
                        {c.type === "long_text" && (
                          <span className="f-input f-ta" style={MUTED_BLOCK}>
                            Cevabınızı buraya yazın.
                          </span>
                        )}
                        {c.type === "combobox" && (
                          <span className="f-dd-btn is-empty">
                            <span>Bir seçenek seçin</span>
                            <ChevronsUpDown size={16} aria-hidden="true" />
                          </span>
                        )}
                        {c.type === "toggle" && (
                          <div className={cls("el-tap", tap === i && "is-tap")}>
                            <div className="f-tog">
                              <span className={cls("f-tog-l", on && "is-on")}>{on ? "Evet" : "Hayır"}</span>
                              <span className={cls("f-sw", on && "is-on")}>
                                <span className="f-knob" />
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="f-ffoot">
          <div className="f-ffoot-row">
            <div className="f-next">
              <p className="f-next-k">Gönderdikten sonra</p>
              <p className="f-next-v">Cevabınızı ekip inceleyecek. Sonucu e-postayla bildireceğiz.</p>
            </div>
            <span className="f-submit">Gönder</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditorDemo() {
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const phoneRef = useRef(null);
  const clockRef = useRef({ i: 0, seq: 0, tick: 0, view: FIRST, narrow: false });
  const [view, setView] = useState(FIRST);
  const [side, setSide] = useState(SIDES.editor);
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const reduce = useReducedMotion();
  const inView = useInView(rootRef, { threshold: 0.2 });
  const narrow = useNarrow(rootRef);

  const live = !reduce || tick > 0;
  const run = live && !paused && inView;
  const s = live ? view : DONE;

  useEffect(() => {
    clockRef.current.narrow = narrow;
  }, [narrow]);

  useEffect(() => {
    if (!run) return undefined;
    const clock = clockRef.current;
    const delay = clock.tick === tick ? 60 : 300;
    clock.tick = tick;
    const timeline = createTimeline(clock, setView, setSide);
    timeline.start(delay);
    return timeline.stop;
  }, [run, tick]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) canvas.scrollTop = canvas.scrollHeight;
    const phone = phoneRef.current;
    if (phone) phone.scrollTop = phone.scrollHeight;
  }, [s.cards.length, s.fresh, s.exp]);

  const restart = () => {
    const clock = clockRef.current;
    clock.i = 0;
    clock.seq = 0;
    clock.view = { ...clock.view, ...BLANK };
    setView(clock.view);
    setPaused(false);
    setTick((n) => n + 1);
  };

  const toggle = () => {
    if (run) setPaused(true);
    else if (live) setPaused(false);
    else restart();
  };

  const tools = (
    <>
      <button type="button" className={cls("f-auto", run && "is-on")} aria-pressed={run} onClick={toggle}>
        {run ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z" />
          </svg>
        )}
        {run ? "Durdur" : "Oynat"}
      </button>
      <button type="button" className="f-reset" onClick={restart}>
        <RotateCcw size={13} aria-hidden="true" />
        Baştan
      </button>
    </>
  );

  const phone = (
    <Phone className="el-phone" scrollRef={phoneRef}>
      <Preview cards={s.cards} exp={s.exp} fresh={s.fresh} tap={s.tap} />
    </Phone>
  );

  const panel = (
    <div className="f-dm el-pan">
      <div className="f-dm-bar">
        <span className="f-dm-t">Seçme başvurusu</span>
        <span className={cls("el-save", s.saved && "is-ok")}>
          <i />
          {s.saved ? "Kaydedildi" : "Düzenleniyor"}
        </span>
        <span className="f-dm-grow" />
        <span className="el-pv">
          <Eye size={13} aria-hidden="true" />
          Önizleme
        </span>
      </div>
      <div className="el-body">
        <Library hot={s.hot} tplHot={s.tplHot} />
        <div className="el-cv f-dots" ref={canvasRef}>
          {s.cards.length === 0 && <p className="el-empty">Formunuzu oluşturmaya başlayın</p>}
          <CardList cards={s.cards} fresh={s.fresh} typing={s.typing} condHot={s.condHot} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="el" ref={rootRef}>
      <div className="el-top">
        <p className="f-hint" key={`h${s.act}`}>
          <i />
          <span>{hintFor(s.act)}</span>
        </p>
        {!narrow && <div className="el-top-r">{tools}</div>}
      </div>

      {narrow ? (
        <Duo labels={["Editör", "Önizleme"]} side={side} onSide={setSide} tools={tools}>
          <Phone scroll={false}>{panel}</Phone>
          {phone}
        </Duo>
      ) : (
        <div className="el-stage">
          <div className="el-phw">{phone}</div>

          <div className="el-link" aria-hidden="true">
            <svg viewBox="0 0 56 640" preserveAspectRatio="none">
              <path d="M56 320 C 28 320, 28 300, 0 300" />
            </svg>
            {s.beadN > 0 && <span className="el-bead" key={`b${s.beadN}`} />}
          </div>

          <div className="el-panw">{panel}</div>
        </div>
      )}
    </div>
  );
}
