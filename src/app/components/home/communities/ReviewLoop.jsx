"use client";

import { useEffect, useId, useReducer, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  FileClock,
  FileX,
  LoaderCircle,
  RotateCcw,
  Route,
  UserRound,
  X,
} from "lucide-react";
import { formatDay } from "../dates";
import { useInView } from "../useInView";
import "./review-loop.css";

const TEAMS = ["Frontend", "Backend", "DevOps"];

const OUTCOME = {
  wait: { label: "Beklemede", tone: "t-amber", dot: "amber", chip: "wait" },
  ok: { label: "Onaylandı", tone: "t-green", dot: "green", chip: "ok" },
  no: { label: "Reddedildi", tone: "t-red", dot: "red", chip: "no" },
};

const BASE_ROWS = [
  { av: "KK", name: "Kaan Necip Kalp", outcome: "wait", at: "Bugün, 11:05" },
  { av: "EG", name: "Enes Genç", outcome: "ok", at: "Dün, 19:42" },
  { av: "YA", name: "Yusuf Açmacı", outcome: "no", at: "Dün, 16:20" },
];

const INITIAL = {
  stage: 0,
  view: "list",
  team: "Backend",
  dd: false,
  exp: true,
  story: "Lisede React öğrenmeye başladım. Kendi portfolyo sitemi ve lise kulübümün sitesini yaptım.",
  note: null,
  ask: null,
  pend: null,
  busy: null,
  dec: null,
  sentAt: "",
  decidedAt: "",
  beadGo: 0,
  beadBack: 0,
  showGo: false,
  showBack: false,
};

function stamp() {
  const d = new Date();
  return `Bugün, ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function toTop(el) {
  el?.scrollTo({ top: 0, behavior: "smooth" });
}

function nextTitle(team) {
  return team === "Backend" ? "Kod ödevi" : "Teknik görüşme";
}

function noteFor(kind, team, exp) {
  if (kind === "no") return `Bu dönem ${team} takımı doldu. Bahar seçmelerinde yeniden bekleriz.`;
  const opener = exp ? "Geçmiş projelerini beğendik. " : "Başvurun için teşekkürler. ";
  return opener + (team === "Backend" ? "Sonraki adımda backend tarafını görelim." : "Teknik görüşmede devam edelim.");
}

function hintFor(s) {
  if (s.stage === 0) return "Telefonda formu doldurun ve en alttaki Gönder'e basın.";
  if (s.stage === 1 && s.view === "list") return "Başvuru ekibin listesine düştü. Satıra tıklayıp açın.";
  if (s.stage === 1 && s.ask) return "Kararı onaylayın.";
  if (s.stage === 1) return "Onaylayın ya da reddedin. Açıklama yazarsanız başvuran onu görür.";
  if (s.dec === "ok") return "Başvurana e-posta gitti. Formun sayfasını açınca sıradaki adımı ve ekibin notunu görür.";
  return "Başvurana e-posta gitti. Formun sayfasını açınca kararı ve notunuzu görür.";
}

function reducer(s, a) {
  switch (a.type) {
    case "set":
      return { ...s, ...a.patch };
    case "send":
      if (s.stage !== 0) return s;
      return { ...s, stage: 1, dd: false, sentAt: a.at, beadGo: s.beadGo + 1, showGo: true };
    case "confirm":
      if (!s.ask) return s;
      return { ...s, ask: null, pend: s.ask, busy: "loading" };
    case "advance":
      if (s.busy !== "loading") return s;
      return { ...s, busy: "success" };
    case "finish":
      if (!s.pend) return s;
      return {
        ...s,
        busy: null,
        pend: null,
        dec: s.pend,
        stage: 2,
        note: s.note != null ? s.note : noteFor(s.pend, s.team, s.exp),
        decidedAt: a.at,
        beadBack: s.beadBack + 1,
        showBack: true,
      };
    case "reset":
      return INITIAL;
    default:
      return s;
  }
}

function StatusBar() {
  return (
    <div className="sl-status" aria-hidden="true">
      <span>9:41</span>
      <span>
        <svg width="16" height="11" viewBox="0 0 16 11">
          <rect x="0" y="7" width="3" height="4" rx=".8" fill="currentColor" />
          <rect x="4.3" y="5" width="3" height="6" rx=".8" fill="currentColor" />
          <rect x="8.6" y="2.6" width="3" height="8.4" rx=".8" fill="currentColor" />
          <rect x="12.9" y="0" width="3" height="11" rx=".8" fill="currentColor" />
        </svg>
        <svg width="22" height="11" viewBox="0 0 22 11">
          <rect x=".5" y=".5" width="18" height="10" rx="3" fill="none" stroke="currentColor" opacity=".5" />
          <rect x="2" y="2" width="13" height="7" rx="1.6" fill="currentColor" />
          <rect x="19.6" y="3.6" width="1.6" height="3.8" rx=".8" fill="currentColor" opacity=".5" />
        </svg>
      </span>
    </div>
  );
}

function TeamNote({ note }) {
  if (!note) return null;
  return (
    <div className="f-rnote">
      <p className="f-rnote-k">Ekibin notu</p>
      <p className="f-rnote-v">{note}</p>
    </div>
  );
}

function FormCard({ s, set, closeLong, onSend }) {
  const fill = s.exp && !s.story.trim() ? 75 : 100;

  return (
    <div className="f-card">
      <div className="f-card-in">
        <div className="f-wp">
          <div className="f-wp-top">
            <span className="f-wp-title">Takım seçmeleri</span>
            <span className="f-wp-step">Adım 1<span> / en fazla 3</span></span>
          </div>
          <div className="f-wp-segs">
            <span className="f-seg"><span className="f-seg-fill" style={{ width: `${fill}%` }} /></span>
            <span className="f-seg is-maybe" />
            <span className="f-seg is-maybe" />
          </div>
        </div>
        <div className="f-fhead">
          <h2 className="f-ftitle">Seçme başvurusu</h2>
          <div className="f-hnotes">
            <div className="f-hnote">
              <CalendarClock size={13} aria-hidden="true" />
              <span>
                <span style={{ color: "var(--n200)" }}>{closeLong}</span>
                {" itibarıyla kapanır"}
                <span style={{ color: "var(--n500)" }}>{" · gönderilmemiş taslaklar alınmaz"}</span>
              </span>
            </div>
          </div>
        </div>
        <div>
          <div className="f-q f-qsep">
            <div className="f-q-in">
              <div className="f-qhead">
                <div className="f-qnum">1</div>
                <p className="f-qtext">Adınız ve soyadınız<span className="f-req">*</span></p>
              </div>
              <div className="f-qctl">
                <input className="f-input" type="text" value="Ayşe Yılmaz" readOnly aria-label="Adınız ve soyadınız" />
              </div>
            </div>
          </div>
          <div className="f-q f-qsep" style={{ position: "relative", zIndex: 3 }}>
            <div className="f-q-in">
              <div className="f-qhead">
                <div className="f-qnum">2</div>
                <p className="f-qtext">Hangi takıma başvuruyorsunuz?<span className="f-req">*</span></p>
              </div>
              <div className="f-qctl">
                <div className="sl-dd">
                  <button type="button" className="f-dd-btn" onClick={() => set({ dd: !s.dd })} aria-expanded={s.dd}>
                    <span>{s.team}</span>
                    <ChevronsUpDown size={16} aria-hidden="true" />
                  </button>
                  {s.dd && (
                    <div className="f-dd-menu" role="listbox">
                      {TEAMS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className="f-dd-opt"
                          onClick={() => set({ team: t, dd: false })}
                          role="option"
                          aria-selected={s.team === t}
                        >
                          {t}
                          {s.team === t && <Check size={14} strokeWidth={2.5} aria-hidden="true" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className={s.exp ? "f-q f-qsep" : "f-q"}>
            <div className="f-q-in">
              <div className="f-qhead">
                <div className="f-qnum">3</div>
                <p className="f-qtext">Web geliştirme deneyiminiz var mı?</p>
              </div>
              <div className="f-qctl">
                <div className="f-tog" onClick={() => set({ exp: !s.exp })}>
                  <span className={s.exp ? "f-tog-l is-on" : "f-tog-l"}>{s.exp ? "Evet" : "Hayır"}</span>
                  <button
                    type="button"
                    role="switch"
                    className={s.exp ? "f-sw is-on" : "f-sw"}
                    aria-checked={s.exp}
                    aria-label="Web geliştirme deneyiminiz var mı?"
                  >
                    <span className="f-knob" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className={s.exp ? "f-reveal is-open" : "f-reveal"}>
            <div>
              <div className="f-q" style={{ paddingTop: 18 }}>
                <div className="f-q-in">
                  <div className="f-qhead">
                    <div className="f-qnum">4</div>
                    <p className="f-qtext">Hangi projelerde yer aldınız?<span className="f-req">*</span></p>
                  </div>
                  <div className="f-qctl">
                    <textarea
                      className="f-input f-ta"
                      rows={3}
                      value={s.story}
                      onChange={(e) => set({ story: e.target.value })}
                      aria-label="Hangi projelerde yer aldınız"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="f-ffoot">
          <div className="f-ffoot-row">
            <div className="f-next">
              <p className="f-next-k">Gönderdikten sonra</p>
              <p className="f-next-v">Ekip cevaplarınızı inceleyecek; sonucu e-postayla bildireceğiz.</p>
            </div>
            <button type="button" className="f-submit sl-send is-pulse" onClick={onSend}>Gönder</button>
          </div>
          <p className="f-who">
            <span className="f-who-i">
              <UserRound size={12} aria-hidden="true" />
              <span><b>Ayşe Yılmaz</b> olarak yanıtlıyorsunuz</span>
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function PendingCard() {
  return (
    <div className="f-card f-fade">
      <div className="f-st">
        <span className="f-st-ic is-wait"><FileClock size={32} strokeWidth={1.5} aria-hidden="true" /></span>
        <p className="f-st-ctx">Takım seçmeleri · <em>1. adım</em></p>
        <h2 className="f-st-title">Başvurunuz inceleniyor</h2>
        <div className="f-st-body">
          <ol className="f-jr">
            <li className="f-jr-li">
              <span className="f-jr-line" />
              <span className="f-mark is-review"><Clock size={13} strokeWidth={2.2} aria-hidden="true" /></span>
              <div>
                <div className="f-jr-row">
                  <span className="f-jr-title">Seçme başvurusu</span>
                  <span className="f-jr-date">Bugün</span>
                </div>
                <p className="f-jr-detail">Gönderildi · inceleniyor</p>
              </div>
            </li>
            <li className="f-jr-li">
              <span className="f-jr-line" />
              <span className="f-mark is-future" />
              <div>
                <div className="f-jr-row"><span className="f-jr-title is-future">Teknik görüşme</span></div>
                <p className="f-jr-detail">Cevaplarınıza göre açılabilir</p>
              </div>
            </li>
            <li className="f-jr-li">
              <span className="f-mark is-future" />
              <div>
                <div className="f-jr-row"><span className="f-jr-title is-future">Deneme günü</span></div>
                <p className="f-jr-detail">Cevaplarınıza göre açılabilir</p>
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function ApprovedCard({ next, note }) {
  return (
    <div className="sl-intro">
      <Route size={30} strokeWidth={1.6} style={{ color: "var(--s300)" }} aria-hidden="true" />
      <p className="sl-intro-c">Takım seçmeleri · <em>2. adım</em></p>
      <h2 className="sl-intro-t">{next}</h2>
      <ol className="f-jr">
        <li className="f-jr-li">
          <span className="f-jr-line" />
          <span className="f-mark is-done"><Check size={13} strokeWidth={2.5} aria-hidden="true" /></span>
          <div>
            <div className="f-jr-row">
              <span className="f-jr-title">Seçme başvurusu</span>
              <span className="f-jr-date">Bugün</span>
            </div>
            <p className="f-jr-detail">Onaylandı · Bugün</p>
            <TeamNote note={note} />
          </div>
        </li>
        <li className="f-jr-li">
          <span className="f-jr-line" />
          <span className="f-mark is-current">2</span>
          <div>
            <div className="f-jr-row"><span className="f-jr-title">{next}</span></div>
            <p className="f-jr-detail">Şimdi dolduracaksınız</p>
          </div>
        </li>
        <li className="f-jr-li">
          <span className="f-mark is-future" />
          <div>
            <div className="f-jr-row"><span className="f-jr-title is-future">Deneme günü</span></div>
            <p className="f-jr-detail">Onaylanırsa açılır</p>
          </div>
        </li>
      </ol>
      <span className="sl-bar2"><i /></span>
      <button type="button" className="f-login sl-go">
        <span className="t">Forma geç</span>
        <span className="i"><ArrowRight size={15} aria-hidden="true" /></span>
      </button>
    </div>
  );
}

function DeclinedCard({ note }) {
  return (
    <div className="f-card f-fade">
      <div className="f-st">
        <span className="f-st-ic is-neutral"><FileX size={32} strokeWidth={1.5} aria-hidden="true" /></span>
        <p className="f-st-ctx">Takım seçmeleri</p>
        <h2 className="f-st-title">Başvurunuz kabul edilmedi</h2>
        <div className="f-st-body">
          <ol className="f-jr">
            <li className="f-jr-li">
              <span className="f-mark is-declined"><X size={13} strokeWidth={2.5} aria-hidden="true" /></span>
              <div>
                <div className="f-jr-row">
                  <span className="f-jr-title">Seçme başvurusu</span>
                  <span className="f-jr-date">Bugün</span>
                </div>
                <p className="f-jr-detail">Kabul edilmedi · Bugün</p>
                <TeamNote note={note} />
              </div>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function PhoneScreen({ s, set, closeLong, next, noteShown, onSend }) {
  if (s.stage === 0) return <FormCard s={s} set={set} closeLong={closeLong} onSend={onSend} />;
  if (s.stage === 1) return <PendingCard />;
  if (s.dec === "ok") return <ApprovedCard next={next} note={noteShown} />;
  if (s.dec === "no") return <DeclinedCard note={noteShown} />;
  return null;
}

function Row({ r, ping, onOpen }) {
  const o = OUTCOME[r.outcome];
  const open = r.mine
    ? {
        role: "button",
        tabIndex: 0,
        "aria-label": `${r.name} cevabını açın`,
        onClick: onOpen,
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        },
      }
    : null;

  return (
    <li>
      <div className={r.mine ? `rl-row is-click is-new${ping ? " is-ping" : ""}` : "rl-row"} {...open}>
        <span className={`rl-dot ${o.dot}`} />
        <span className="rl-av">{r.av}</span>
        <span className="rl-who">
          <b>{r.name}</b>
          <small className={o.tone}>{o.label}</small>
        </span>
        <span className="rl-at">{r.at}</span>
        <span className="rl-go">{r.mine && <ChevronRight size={16} aria-hidden="true" />}</span>
      </div>
    </li>
  );
}

function Deciding({ s, set, dispatch, next, noteId, noteText }) {
  const ping = s.stage === 1 && s.view === "detail" && !s.ask;
  const no = s.ask === "no";

  return (
    <div className="rl-box">
      <p className="f-dm-k">Değerlendirme</p>
      {!s.ask && !s.busy && (
        <>
          <div className={ping ? "rl-btns is-ping" : "rl-btns"}>
            <button type="button" className="f-ok" onClick={() => set({ ask: "ok" })}>
              <Check size={15} aria-hidden="true" />
              Onayla
            </button>
            <button type="button" className="f-no" onClick={() => set({ ask: "no" })}>
              <X size={15} aria-hidden="true" />
              Reddet
            </button>
          </div>
          <div className="rl-rh">
            <p>
              <i className="ok" />
              <span>Onaylanırsa</span>
              <ArrowRight size={10} aria-hidden="true" />
              <b>{next} adımı açılır</b>
            </p>
            <p>
              <i className="no" />
              <span>Reddedilirse</span>
              <ArrowRight size={10} aria-hidden="true" />
              <b>Başvuru sonlanır</b>
            </p>
          </div>
        </>
      )}
      {s.ask && (
        <div className="rl-cf">
          <p>{no ? "Cevabı reddet" : "Cevabı onayla"}</p>
          <p className="o">{no ? "Başvuru sonlanır." : `${next} adımı açılır.`}</p>
          <p className="w">Bu karar başvurunun yönünü belirler ve geri alınamaz.</p>
          <div className="rl-cf-b">
            <button type="button" className="v" onClick={() => set({ ask: null })}>Vazgeç</button>
            <button type="button" className={no ? "no" : "ok"} onClick={() => dispatch({ type: "confirm" })}>
              {no ? "Reddet" : "Onayla"}
            </button>
          </div>
        </div>
      )}
      {s.busy && (
        <div className={s.busy === "success" ? "rl-fb done" : "rl-fb load"}>
          {s.busy === "loading" && <LoaderCircle className="spin" size={16} aria-hidden="true" />}
          {s.busy === "success" && <Check size={16} aria-hidden="true" />}
        </div>
      )}
      <div className="rl-note">
        <label htmlFor={noteId}>Açıklama</label>
        <textarea
          id={noteId}
          rows={3}
          placeholder="Açıklama ekle..."
          value={noteText}
          onChange={(e) => set({ note: e.target.value })}
          maxLength={500}
        />
        <p><span>Başvuran bu notu kendi sayfasında görür.</span><span>{noteText.length}/500</span></p>
      </div>
    </div>
  );
}

function Decided({ decidedAt, note }) {
  return (
    <div className="rl-box">
      <p className="f-dm-k">İnceleyen</p>
      <div className="rl-ucard">
        <span className="rl-av">FN</span>
        <div>
          <p>Fatih Naz</p>
          <small>{decidedAt}</small>
        </div>
      </div>
      {note && (
        <div className="rl-rv-n">
          <small>Not</small>
          <p>{note}</p>
        </div>
      )}
    </div>
  );
}

function Detail({ s, set, dispatch, next, noteId, noteText, noteShown }) {
  const outcome = OUTCOME[s.dec ?? "wait"];
  const answers = [
    { q: "Adınız ve soyadınız", v: "Ayşe Yılmaz" },
    { q: "Hangi takıma başvuruyorsunuz?", v: s.team },
    { q: "Web geliştirme deneyiminiz var mı?", v: s.exp ? "Evet" : "Hayır" },
  ];
  if (s.exp) answers.push({ q: "Hangi projelerde yer aldınız?", v: s.story || "Cevap yok" });

  return (
    <div className="rl-det">
      <div className="rl-main">
        <div className="rl-head">
          <span className="rl-av lg">AY</span>
          <div className="rl-hm">
            <p>Ayşe Yılmaz</p>
            <small>{s.sentAt} · 1. adım</small>
          </div>
          <span className={`rl-st ${outcome.chip}`}>{outcome.label}</span>
        </div>
        <ol className="rl-ans">
          {answers.map((a) => (
            <li key={a.q}>
              <small>{a.q}</small>
              <p>{a.v}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="rl-side">
        {s.dec ? (
          <Decided decidedAt={s.decidedAt} note={noteShown} />
        ) : (
          <Deciding s={s} set={set} dispatch={dispatch} next={next} noteId={noteId} noteText={noteText} />
        )}
      </div>
    </div>
  );
}

function ReviewPanel({ s, set, dispatch, rows, next, noteId, noteText, noteShown }) {
  const detail = s.view === "detail";
  const ping = s.stage === 1 && s.view === "list";
  const open = () => set({ view: "detail" });

  return (
    <div className="rl-app f-dm">
      <div className="f-dm-bar">
        {detail && (
          <button type="button" className="rl-back" onClick={() => set({ view: "list", ask: null })} aria-label="Cevaplara dönün">
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
        )}
        <span className="f-dm-t">Seçme başvurusu</span>
        <span className="f-dm-m">{detail ? "Ayşe Yılmaz" : `${rows.length} cevap`}</span>
      </div>
      <div className="rl-body">
        {detail ? (
          <Detail s={s} set={set} dispatch={dispatch} next={next} noteId={noteId} noteText={noteText} noteShown={noteShown} />
        ) : (
          <ul className="rl-list">
            {rows.map((r) => (
              <Row key={r.name} r={r} ping={ping} onOpen={open} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default function ReviewLoop() {
  const rootRef = useRef(null);
  const scrollerRef = useRef(null);
  const noteId = useId();
  const inView = useInView(rootRef);
  const [closeLong] = useState(() => `${formatDay(12, { day: "numeric", month: "long", weekday: "long" })}, 23:59`);
  const [s, dispatch] = useReducer(reducer, INITIAL);

  useEffect(() => {
    if (!inView || !s.busy) return undefined;
    const loading = s.busy === "loading";
    const id = setTimeout(
      () => {
        if (loading) {
          dispatch({ type: "advance" });
          return;
        }
        dispatch({ type: "finish", at: stamp() });
        toTop(scrollerRef.current);
      },
      loading ? 650 : 500
    );
    return () => clearTimeout(id);
  }, [inView, s.busy]);

  const set = (patch) => dispatch({ type: "set", patch });

  const send = () => {
    if (s.stage !== 0) return;
    dispatch({ type: "send", at: stamp() });
    toTop(scrollerRef.current);
  };

  const reset = () => {
    dispatch({ type: "reset" });
    toTop(scrollerRef.current);
  };

  const next = nextTitle(s.team);
  const pending = s.ask ?? s.pend;
  const noteText = s.note != null ? s.note : noteFor(pending === "no" ? "no" : "ok", s.team, s.exp);
  const noteShown = (s.note || "").trim();
  const rows = s.stage >= 1 ? [{ av: "AY", name: "Ayşe Yılmaz", outcome: s.dec ?? "wait", at: s.sentAt, mine: true }, ...BASE_ROWS] : BASE_ROWS;

  return (
    <div className="sl" ref={rootRef}>
      <div className="sl-bar">
        <p className="sl-hint" key={`h${s.stage}${s.view}${s.ask || ""}${s.dec || ""}`}>
          <i />
          <span>{hintFor(s)}</span>
        </p>
        <button type="button" className="sl-reset" onClick={reset} disabled={s.stage === 0}>
          <RotateCcw size={13} aria-hidden="true" />
          Baştan
        </button>
      </div>
      <div className="sl-stage">
        <div className="sl-phone">
          <div className="sl-scr">
            <StatusBar />
            <div className="sl-scroll" ref={scrollerRef}>
              <PhoneScreen s={s} set={set} closeLong={closeLong} next={next} noteShown={noteShown} onSend={send} />
            </div>
          </div>
        </div>

        <div className="sl-link" aria-hidden="true">
          <svg viewBox="0 0 56 640" preserveAspectRatio="none">
            <path className={s.showGo ? "is-on" : undefined} d="M0 548 C 28 548, 28 150, 56 150" />
            <path className={s.showBack ? "is-on" : undefined} d="M56 360 C 28 360, 28 300, 0 300" />
          </svg>
          {s.beadGo > 0 && <span className="sl-bead go" key={`g${s.beadGo}`} />}
          {s.beadBack > 0 && <span className="sl-bead back" key={`b${s.beadBack}`} />}
        </div>
        <div className="sl-vlink" aria-hidden="true">
          {s.beadGo > 0 && <i className="go" key={`g${s.beadGo}`} />}
          {s.beadBack > 0 && <i className="back" key={`b${s.beadBack}`} />}
        </div>

        <ReviewPanel
          s={s}
          set={set}
          dispatch={dispatch}
          rows={rows}
          next={next}
          noteId={noteId}
          noteText={noteText}
          noteShown={noteShown}
        />
      </div>
    </div>
  );
}
