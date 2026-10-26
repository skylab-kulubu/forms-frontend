"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Timer, X } from "lucide-react";
import Poster from "../poster/Poster";
import { HOME_PATHS, SECTIONS } from "../config";
import { useScrollTo } from "../HomeContext";
import "./communities-hero.css";

const IDS = SECTIONS.topluluklar;

const VIEW = { w: 1440, h: 920 };
const POST = { x: 561.6, y: 78.2, w: 396, h: 560.03, rot: -1.4 };

const HOT = [
  {
    n: 1,
    kind: "review",
    pin: [3.8, 54.7],
    at: [9, 50],
    r: -1.3,
    title: "Ekip değerlendirir",
    body: "Başvurular ekibin listesine düşer. Ekipten birinin incelemesinin ardından Forms otomatik olarak sıradaki adımı hazırlar ve başvuranı bilgilendirir. Sizin yönetmenize gerek kalmaz.",
  },
  {
    n: 2,
    kind: "timed",
    pin: [96.2, 62.9],
    at: [71.5, 13],
    r: 1.1,
    title: "Formlara istediğiniz gibi süre verin",
    body: "Aday “Görevi başlat”a basınca görev metni açılır ve süresi işlemeye başlar. Süre dolarsa o ana kadarki cevapları size gelir, isterseniz ek süre verirsiniz, isterseniz de değerlendirirsiniz.",
  },
  {
    n: 3,
    kind: "flow",
    pin: [3.8, 71.1],
    at: [20.5, 76.5],
    r: 0.8,
    title: "Adımlar birbirine bağlı",
    body: "Her adım ayrı bir form. Onay veya red durumuna göre sıradaki adımı belirlersiniz. Ayrıca akışı cevaba göre de yönetebilirsiniz.",
  },
  {
    n: 4,
    kind: "track",
    pin: [96.2, 88.6],
    at: [71.5, 56],
    r: -0.7,
    title: "İletişimi Forms halleder",
    body: "Aynı bağlantı başvurudan sonra adayın sayfası olur. Aday hangi adımda olduğunu ve ekibin notunu görebilir, ayrıca e-postayla da bilgilendirilir.",
  },
];

function stringPath(h) {
  const rad = (POST.rot * Math.PI) / 180;
  const cx = POST.x + POST.w / 2;
  const cy = POST.y + POST.h / 2;
  const dx = POST.x + (h.pin[0] / 100) * POST.w - cx;
  const dy = POST.y + (h.pin[1] / 100) * POST.h - cy;
  const px = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
  const py = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
  const bx = ((h.at[0] + 9.5) / 100) * VIEW.w;
  const by = (h.at[1] / 100) * VIEW.h + 11.5;
  const dist = Math.hypot(bx - px, by - py);
  const ax = px + ((bx - px) / dist) * 13;
  const ay = py + ((by - py) / dist) * 13;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2 + Math.min(70, dist * 0.16);
  return `M${ax.toFixed(1)} ${ay.toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`;
}

const SPOTS = HOT.map((h, i) => ({
  ...h,
  path: stringPath(h),
  pinStyle: { "--px": `${h.pin[0]}%`, "--py": `${h.pin[1]}%`, "--d": `${520 + i * 120}ms` },
  noteStyle: { "--x": `${h.at[0]}%`, "--y": `${h.at[1]}%`, "--nr": `${h.r}deg`, "--d": `${780 + i * 140}ms` },
  stringStyle: { "--d": `${660 + i * 140}ms` },
}));

const POSTER = <Poster kind="web" />;

function Frag({ kind }) {
  if (kind === "review") {
    return (
      <p className="at-frag">
        <b className="is-ok">
          <Check size={10} strokeWidth={3} aria-hidden="true" />
          Onayla
        </b>
        <b className="is-no">
          <X size={10} strokeWidth={3} aria-hidden="true" />
          Reddet
        </b>
      </p>
    );
  }
  if (kind === "timed") {
    return (
      <p className="at-frag">
        <Timer size={12} aria-hidden="true" />
        <code>47:59:12</code>
        · Teslim: GitHub bağlantısı
      </p>
    );
  }
  if (kind === "flow") {
    return (
      <p className="at-frag">
        <i />
        Onaylanırsa
        <ArrowRight size={10} strokeWidth={2.4} aria-hidden="true" />
        Görüşme adımı açılır
      </p>
    );
  }
  if (kind === "track") {
    return (
      <div className="at-frag at-jr">
        <p>
          <span className="at-jr-m is-done">
            <Check size={9} strokeWidth={3.2} aria-hidden="true" />
          </span>
          <b>Başvuru formu</b>
          <span>Onaylandı · Bugün</span>
        </p>
        <p>
          <span className="at-jr-m">2</span>
          <b>Kod ödevi</b>
          <span>Şimdi dolduracaksınız</span>
        </p>
      </div>
    );
  }
  return null;
}

export default function CommunitiesHero() {
  const uid = useId();
  const [hot, setHot] = useState(0);
  const scrollTo = useScrollTo();

  const goTo = (id) => (e) => {
    e.preventDefault();
    scrollTo(id);
  };

  const hotProps = (n) => ({
    onMouseEnter: () => setHot(n),
    onMouseLeave: () => setHot(0),
    onFocus: () => setHot(n),
    onBlur: () => setHot(0),
  });

  const pinGo = (n) => {
    setHot(n);
    if (window.matchMedia("(min-width: 1280px)").matches) return;
    document.getElementById(`${uid}n${n}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section className="at-board" id={IDS.top} data-page="" aria-label="Örnek afiş ve Forms'taki karşılıkları">
      <div className="at-board-in">
        <div className="at-intro">
          <h1 className="at-h1">Topluluklar için Forms</h1>
          <p className="at-p">
            Topluluğunuzun başvurularını Forms&apos;ta toplayın. Başvuruları adımlara bölebilir, detaylı analitikler çıkarabilir ve her adımı birbirinden bağımsız yönetebilirsiniz.
          </p>
          <p className="at-p2">Afişteki numaralara bakın; her biri Forms&apos;ta bir özelliğe karşılık geliyor.</p>
          <div className="at-acts">
            <a className="f-act" href={`#${IDS.access}`} onClick={goTo(IDS.access)}>
              Erişim isteyin
              <ArrowRight size={13} aria-hidden="true" />
            </a>
            <Link className="f-quiet" href={HOME_PATHS.kisiler}>
              Başvuranlar için
            </Link>
          </div>
        </div>
        <div className="at-stage">
          <figure className="at-post">
            {POSTER}
            {SPOTS.map((h) => (
              <button
                key={h.n}
                type="button"
                className={hot === h.n ? "at-ppin is-hot" : "at-ppin"}
                style={h.pinStyle}
                aria-label={`${h.n}. not: ${h.title}`}
                {...hotProps(h.n)}
                onClick={() => pinGo(h.n)}
              >
                {h.n}
              </button>
            ))}
          </figure>
          <ol className="at-notes">
            {SPOTS.map((h) => (
              <li
                key={h.n}
                id={`${uid}n${h.n}`}
                className={hot === h.n ? "at-note is-hot" : "at-note"}
                style={h.noteStyle}
                tabIndex={0}
                {...hotProps(h.n)}
              >
                <span className="at-note-pin" aria-hidden="true" />
                <p className="at-note-h">
                  <span className="at-num">{h.n}</span>
                  <span>{h.title}</span>
                </p>
                <p className="at-note-p">{h.body}</p>
                <Frag kind={h.kind} />
              </li>
            ))}
          </ol>
        </div>
        <svg className="at-strings" viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} aria-hidden="true">
          {SPOTS.map((h) => (
            <path
              key={h.n}
              className={hot === h.n ? "at-str is-hot" : "at-str"}
              d={h.path}
              pathLength="1"
              style={h.stringStyle}
            />
          ))}
        </svg>
      </div>
    </section>
  );
}
