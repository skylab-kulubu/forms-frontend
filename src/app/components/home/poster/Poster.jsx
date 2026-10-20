"use client";

import { memo, useId } from "react";
import Image from "next/image";
import { useDay } from "../dates";
import { posterQr } from "./posterQr";
import "./poster.css";

export const POSTER_KINDS = {
  rings: {
    bg: "#e0c8e5",
    fg: "#1d1422",
    ac: "#6e4576",
    org: "SKY LAB",
    right: "Ar-Ge",
    mark: "logo",
    alias: "ekip-basvurusu-2026",
    cta: "Başvurmak için okutun",
    note: "E-Skylab hesabıyla",
    label: "Ekip başvurusu 2026 afişi",
  },
  grid: {
    bg: "#0c0a0f",
    fg: "#f3e8f5",
    ac: "#e0c8e5",
    org: "SKY LAB",
    right: "8–9 Kasım",
    mark: "logo",
    alias: "hackathon-2026",
    cta: "Kayıt için okutun",
    note: "Tek adımlı kayıt",
    label: "Hackathon 2026 afişi",
  },
  paper: {
    bg: "#f1ece3",
    fg: "#1a1a1a",
    ac: "#6e4576",
    org: "SKY LAB",
    right: "Güz 2026",
    mark: "logo",
    alias: "yz-okuma-grubu",
    cta: "Başvurmak için okutun",
    note: "Giriş gerekmiyor",
    label: "Yapay zeka okuma grubu afişi",
  },
  bold: {
    bg: "#8f5e98",
    fg: "#fbf2fd",
    ac: "#fbf2fd",
    org: "SKYSIS",
    right: "Son gün",
    mark: "S",
    alias: "skysis-secmeler",
    cta: "Başvurmak için okutun",
    note: "E-Skylab hesabıyla",
    label: "SKYSIS takım seçmeleri afişi",
  },
  circles: {
    bg: "#2a1d33",
    fg: "#f3e8f5",
    ac: "#e0c8e5",
    org: "SKY LAB",
    right: "15 Ekim",
    mark: "logo",
    alias: "tanisma-ekim",
    cta: "Kayıt için okutun",
    note: "Tek soruluk kayıt",
    label: "Tanışma toplantısı afişi",
  },
  web: {
    bg: "#ff5a1f",
    fg: "#150a05",
    ac: "#fff1e6",
    org: "WEBLAB",
    right: "Son gün",
    mark: "logo",
    alias: "weblab-frontend",
    cta: "Başvurmak için okutun",
    note: "E-Skylab hesabıyla",
    label: "WEBLAB frontend geliştirici afişi",
  },
  phone: {
    bg: "#e9e3f5",
    fg: "#1d1726",
    ac: "#8f5e98",
    org: "SKY LAB",
    right: "4 hafta",
    mark: "logo",
    alias: "mobil-atolye",
    cta: "Başvurmak için okutun",
    note: "Kontenjan 30 kişi",
    label: "Mobil uygulama atölyesi afişi",
  },
  trial: {
    bg: "#141117",
    fg: "#f3e8f5",
    ac: "#e0c8e5",
    org: "WEBLAB",
    right: "Deneme",
    mark: "logo",
    alias: "forms-deneme",
    cta: "Denemek için okutun",
    note: "İki dakika sürer",
    label: "Forms'u deneyin afişi",
  },
};

const FALLBACK_KIND = "rings";
const EMPTY_QR = { d: "", size: 25 };
const RIGHT_DAY = { bold: 12, web: 12 };
const DEADLINE_DAY = 8;
const DATE_SLOT = "00 Ekim";

function isLight(bg) {
  const hex = bg.replace("#", "");
  const lum = (parseInt(hex.slice(0, 2), 16) * 299 + parseInt(hex.slice(2, 4), 16) * 587 + parseInt(hex.slice(4, 6), 16) * 114) / 1000;
  return lum > 150;
}

const VIEW = Object.fromEntries(
  Object.entries(POSTER_KINDS).map(([kind, { bg, fg, ac }]) => [
    kind,
    { light: !isLight(fg), style: { "--pbg": bg, "--pfg": fg, "--pac": ac } },
  ]),
);

function once(build) {
  let ready = false;
  let value;
  return () => {
    if (!ready) {
      value = build();
      ready = true;
    }
    return value;
  };
}

const RING_RADII = [28, 44, 60, 76, 92];
const RING_TEAMS = ["Web", "Mobil", "Oyun", "Yapay zeka", "Siber güvenlik"];
const RING_DOTS = [
  [28, 60, 1.6],
  [44, 330, 1.4],
  [44, 105, 1.8],
  [60, 25, 1.5],
  [60, 150, 1.4],
  [76, 300, 1.7],
  [76, 80, 1.3],
  [92, 345, 1.6],
  [92, 118, 1.5],
  [28, 250, 1.3],
];

function pill(text, angleDeg, radius, size) {
  const a = (angleDeg * Math.PI) / 180;
  const x = Math.cos(a) * radius;
  const y = Math.sin(a) * radius;
  const w = text.length * size * 0.56 + 9;
  return {
    t: `translate(${x.toFixed(1)} ${y.toFixed(1)})`,
    rx: (-w - 3).toFixed(1),
    w: w.toFixed(1),
    tx: (-w + 1.5).toFixed(1),
    text,
  };
}

const ringsGeometry = once(() => ({
  circles: RING_RADII.map((r, i) => ({ r, o: (0.62 - i * 0.07).toFixed(2) })),
  dots: RING_DOTS.map(([r, a, s]) => ({
    x: (Math.cos((a * Math.PI) / 180) * r).toFixed(1),
    y: (Math.sin((a * Math.PI) / 180) * r).toFixed(1),
    s,
  })),
  labels: RING_TEAMS.map((text, i) => pill(text, 200 + i * 5, RING_RADII[i], 6.2)),
}));

const DIGIT_4 = ["10010", "10010", "10010", "11111", "00010", "00010", "00010"];
const DIGIT_8 = ["01110", "10001", "10001", "01110", "10001", "10001", "01110"];

const gridPixels = once(() => {
  const { ac } = POSTER_KINDS.grid;
  const pixels = [];
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 11; c++) {
      let on = false;
      if (c < 5) on = DIGIT_4[r][c] === "1";
      else if (c > 5) on = DIGIT_8[r][c - 6] === "1";
      const white = on && (r * 11 + c) % 6 === 0;
      pixels.push({ x: c * 10, y: r * 10, f: on ? (white ? "#ffffff" : ac) : "none", s: on ? "none" : "rgba(243,232,245,0.16)" });
    }
  }
  return pixels;
});

const NET_LAYERS = [
  [10, 33, 56, 79],
  [5, 25, 45, 65, 85],
  [22, 45, 68],
];
const NET_XS = [6, 50, 94];

const paperNet = once(() => {
  const { ac, bg } = POSTER_KINDS.paper;
  const nodes = [];
  const lines = [];
  NET_LAYERS.forEach((ys, li) =>
    ys.forEach((y, ni) => nodes.push({ x: NET_XS[li], y, f: (li === 1 && ni === 2) || (li === 0 && ni === 1) || (li === 2 && ni === 0) ? ac : bg })),
  );
  for (let li = 0; li < 2; li++) {
    NET_LAYERS[li].forEach((y1) => NET_LAYERS[li + 1].forEach((y2) => lines.push({ x1: NET_XS[li], y1, x2: NET_XS[li + 1], y2 })));
  }
  return { nodes, lines };
});

const BUBBLES = [
  { x: 22, y: 26, r: 17 },
  { x: 41, y: 19, r: 14 },
  { x: 60, y: 28, r: 19 },
  { x: 80, y: 17, r: 12 },
  { x: 33, y: 41, r: 11 },
  { x: 52, y: 45, r: 10 },
  { x: 74, y: 40, r: 14 },
];

function Logo({ className }) {
  return <Image className={className} src="/skylab.svg" alt="" width={586} height={554} unoptimized />;
}

function Dated({ text, offset }) {
  const date = useDay(offset);
  return (
    <span>
      {text} {date || <span className="pst-ph" aria-hidden="true">{DATE_SLOT}</span>}
    </span>
  );
}

function RingsArt() {
  const { circles, dots, labels } = ringsGeometry();
  const { bg } = POSTER_KINDS.rings;
  return (
    <>
      <svg className="pk1-art" viewBox="-100 -100 200 200" aria-hidden="true">
        {circles.map((c) => (
          <circle key={c.r} cx="0" cy="0" r={c.r} fill="none" stroke="currentColor" strokeWidth="0.55" opacity={c.o} />
        ))}
        {dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={d.s} fill="currentColor" />
        ))}
        <circle cx="0" cy="0" r="13" fill="currentColor" />
        {labels.map((l) => (
          <g key={l.text} transform={l.t}>
            <rect x={l.rx} y="-4.8" width={l.w} height="9.6" rx="4.8" fill="currentColor" />
            <text x={l.tx} y="2.2" fontSize="6.2" fontWeight="600" fill={bg}>
              {l.text}
            </text>
          </g>
        ))}
      </svg>
      <Logo className="pk1-logo" />
    </>
  );
}

function GridArt() {
  const patternId = `pk2-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const pixels = gridPixels();
  return (
    <>
      <svg className="pk2-dots" viewBox="0 0 100 141.4" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id={patternId} width="4" height="4" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.28" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100" height="141.4" fill={`url(#${patternId})`} />
      </svg>
      <svg className="pk2-px" viewBox="0 0 110 70" aria-hidden="true">
        {pixels.map((p) => (
          <rect key={`${p.x}-${p.y}`} x={p.x} y={p.y} width="8.6" height="8.6" rx="0.7" fill={p.f} stroke={p.s} strokeWidth="0.45" />
        ))}
      </svg>
      <p className="pk2-saat">saat boyunca kod ve tasarım</p>
    </>
  );
}

function PaperArt() {
  const { nodes, lines } = paperNet();
  return (
    <svg className="pk3-art" viewBox="0 0 100 92" aria-hidden="true">
      {lines.map((l) => (
        <line key={`${l.x1}-${l.y1}-${l.x2}-${l.y2}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="currentColor" strokeWidth="0.35" opacity="0.28" />
      ))}
      {nodes.map((n) => (
        <circle key={`${n.x}-${n.y}`} cx={n.x} cy={n.y} r="3.1" fill={n.f} stroke="currentColor" strokeWidth="0.6" />
      ))}
    </svg>
  );
}

function BoldArt() {
  const { bg } = POSTER_KINDS.bold;
  return (
    <svg className="pk4-art" viewBox="0 0 100 90" aria-hidden="true">
      <rect x="8" y="80" width="40" height="8" rx="1.5" fill="currentColor" />
      <rect x="22" y="62" width="12" height="20" rx="1" fill="currentColor" />
      <line x1="28" y1="60" x2="60" y2="27" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
      <line x1="60" y1="27" x2="86" y2="42" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      <line x1="86" y1="42" x2="93" y2="35" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <line x1="86" y1="42" x2="94" y2="48" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="28" cy="60" r="7.5" fill="currentColor" />
      <circle cx="28" cy="60" r="2.6" fill={bg} />
      <circle cx="60" cy="27" r="6" fill="currentColor" />
      <circle cx="60" cy="27" r="2.1" fill={bg} />
      <rect x="84" y="56" width="9" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" transform="rotate(14 88.5 60.5)" />
      <line x1="2" y1="88" x2="98" y2="88" stroke="currentColor" strokeWidth="0.6" strokeDasharray="2 2" />
    </svg>
  );
}

function CirclesArt() {
  return (
    <svg className="pk5-art" viewBox="0 0 100 58" aria-hidden="true">
      {BUBBLES.map((b) => (
        <circle key={`${b.x}-${b.y}`} cx={b.x} cy={b.y} r={b.r} fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeOpacity="0.6" strokeWidth="0.35" />
      ))}
    </svg>
  );
}

function PhoneArt() {
  const { bg, ac } = POSTER_KINDS.phone;
  return (
    <svg className="pk7-art" viewBox="0 0 100 100" aria-hidden="true">
      <g transform="rotate(10 70 40)" opacity="0.35">
        <rect x="52" y="4" width="34" height="68" rx="6" fill="none" stroke="currentColor" strokeWidth="1" />
        <rect x="57" y="14" width="24" height="5" rx="1.5" fill="currentColor" />
        <rect x="57" y="23" width="24" height="12" rx="2" fill="currentColor" opacity="0.4" />
      </g>
      <g transform="rotate(-8 50 45)">
        <rect x="30" y="8" width="38" height="74" rx="6.5" fill={bg} stroke="currentColor" strokeWidth="1.2" />
        <rect x="44" y="11" width="10" height="2.4" rx="1.2" fill="currentColor" />
        <rect x="35" y="18" width="28" height="6" rx="1.8" fill="currentColor" />
        <rect x="35" y="28" width="28" height="13" rx="2.4" fill="currentColor" opacity="0.18" />
        <rect x="35" y="44" width="28" height="6" rx="1.6" fill="currentColor" opacity="0.18" />
        <rect x="35" y="53" width="20" height="6" rx="1.6" fill="currentColor" opacity="0.18" />
        <rect x="35" y="62" width="24" height="6" rx="1.6" fill="currentColor" opacity="0.18" />
        <circle cx="59" cy="73" r="4.2" fill={ac} />
      </g>
    </svg>
  );
}

function TrialArt() {
  return (
    <div className="pk8-form" aria-hidden="true">
      <div className="pk8-row">
        <span className="pk8-num">1</span>
        <div className="pk8-col">
          <i className="pk8-q" style={{ width: "62%" }} />
          <span className="pk8-in">Ayşe Yılmaz</span>
        </div>
      </div>
      <div className="pk8-row">
        <span className="pk8-num">2</span>
        <div className="pk8-col">
          <i className="pk8-q" style={{ width: "46%" }} />
          <span className="pk8-chips">
            <b className="is-on">Web</b>
            <b>Mobil</b>
            <b>Oyun</b>
          </span>
        </div>
      </div>
      <div className="pk8-row">
        <span className="pk8-num">3</span>
        <div className="pk8-col">
          <i className="pk8-q" style={{ width: "70%" }} />
          <span className="pk8-tog">
            <span>Evet</span>
            <i />
          </span>
        </div>
      </div>
    </div>
  );
}

function RingsCopy() {
  return (
    <div className="pk1-t">
      <p className="pk-kick">Ar-Ge ekipleri</p>
      <h3 className="pk1-h">
        Ekip
        <br />
        başvurusu
      </h3>
      <p className="pk1-y">2026</p>
      <div className="pk-info">
        <span>Ön başvuru → Mülakat</span>
        <Dated text="Son başvuru" offset={DEADLINE_DAY} />
      </div>
    </div>
  );
}

function GridCopy() {
  return (
    <div className="pk2-t">
      <h3 className="pk2-h">
        HACKATHON<span>2026</span>
      </h3>
      <ul className="pk2-list">
        <li>48 saat, takımla ya da tek başına</li>
        <li>Davutpaşa Kongre Merkezi</li>
        <li>Kayıt tek adım, ücretsiz</li>
      </ul>
    </div>
  );
}

function PaperCopy() {
  return (
    <>
      <h3 className="pk3-h">
        <em>Okuma</em>
        <em>grubu</em>
      </h3>
      <p className="pk3-s">Her hafta bir makaleyi birlikte okuyup tartışıyoruz.</p>
      <div className="pk3-b">
        <ol className="pk3-list">
          <li>
            <span>01</span>Attention Is All You Need
          </li>
          <li>
            <span>02</span>Denoising Diffusion Probabilistic Models
          </li>
          <li>
            <span>03</span>Constitutional AI
          </li>
        </ol>
        <div className="pk-info">
          <span>Çarşamba 18.00 · B-203</span>
          <span>Başvuru → Seçim</span>
        </div>
      </div>
    </>
  );
}

function BoldCopy() {
  return (
    <div className="pk4-t">
      <h3 className="pk4-h">
        Takım
        <br />
        seçmeleri
      </h3>
      <div className="pk4-tags">
        <span>Mekanik</span>
        <span>Elektronik</span>
        <span>Yazılım</span>
      </div>
      <p className="pk4-steps">Başvuru → Teknik görüşme → Deneme günü</p>
    </div>
  );
}

function CirclesCopy() {
  return (
    <div className="pk5-t">
      <h3 className="pk5-h">Merhaba.</h3>
      <p className="pk5-s">Kulübe yeni katılanlar için tanışma toplantısı. Ekipleri ve bu dönemin planını anlatıyoruz.</p>
      <dl className="pk5-dl">
        <div>
          <dt>Çarşamba, 15 Ekim</dt>
          <dd>17.30</dd>
        </div>
        <div>
          <dt>Kongre Merkezi</dt>
          <dd>B salonu</dd>
        </div>
      </dl>
    </div>
  );
}

function WebCopy() {
  return (
    <div className="pk9-t">
      <h3 className="pk9-h">
        Frontendci
        <br />
        arıyoruz.
      </h3>
      <p className="pk9-s">Forms&apos;u geliştiren ekibe katılın. React ve Next.js ile çalışıyoruz.</p>
      <ol className="pk9-steps">
        <li>
          <span>01</span>
          <b>Başvuru formu</b>
          <em>5 dakika</em>
        </li>
        <li>
          <span>02</span>
          <b>Kod ödevi</b>
          <em>48 saat</em>
        </li>
        <li>
          <span>03</span>
          <b>Görüşme</b>
          <em>onaylananlarla</em>
        </li>
      </ol>
    </div>
  );
}

function PhoneCopy() {
  return (
    <div className="pk7-t">
      <h3 className="pk7-h">
        Uygulama
        <br />
        atölyesi
      </h3>
      <p className="pk7-s">Flutter ile dört haftada ilk uygulamanızı yayınlayın.</p>
      <div className="pk-info">
        <span>Cumartesi 13.00</span>
        <span>Başvuru → Kontenjan onayı</span>
      </div>
    </div>
  );
}

function TrialCopy() {
  return (
    <div className="pk8-t">
      <h3 className="pk8-h">
        Forms&apos;u
        <br />
        deneyin.
      </h3>
      <p className="pk8-s">İki dakikalık bir deneme başvurusu. Gönderin; cevaplarınızın kopyası e-postanıza gelir.</p>
      <div className="pk-info">
        <span>Tek form</span>
        <span>Deneme başvurusu → E-posta kopyası</span>
      </div>
    </div>
  );
}

const ART = {
  rings: <RingsArt />,
  grid: <GridArt />,
  paper: <PaperArt />,
  bold: <BoldArt />,
  circles: <CirclesArt />,
  phone: <PhoneArt />,
  trial: <TrialArt />,
};

const COPY = {
  rings: <RingsCopy />,
  grid: <GridCopy />,
  paper: <PaperCopy />,
  bold: <BoldCopy />,
  circles: <CirclesCopy />,
  web: <WebCopy />,
  phone: <PhoneCopy />,
  trial: <TrialCopy />,
};

const Body = memo(function Body({ kind }) {
  const base = POSTER_KINDS[kind];
  const { light } = VIEW[kind];
  const qr = posterQr(base.alias) ?? EMPTY_QR;
  const rightDay = RIGHT_DAY[kind];
  return (
    <>
      <span className="pst-grain" aria-hidden="true" />
      <span className="pst-light" aria-hidden="true" />
      {ART[kind]}
      <div className="pst-in">
        <div className="pst-top">
          <span className="pst-org">
            {base.mark === "logo" ? <Logo className={light ? "pst-logo is-dark" : "pst-logo"} /> : <span className="pst-mono">{base.mark}</span>}
            <span>{base.org}</span>
          </span>
          {rightDay ? <Dated text={base.right} offset={rightDay} /> : <span>{base.right}</span>}
        </div>
        {COPY[kind]}
        <div className="pst-strip">
          <div className="pst-strip-l">
            <p className="pst-cta">{base.cta}</p>
            <p className="pst-link">skyl.app/{base.alias}</p>
            <p className="pst-note">{base.note}</p>
          </div>
          <div className="pst-qr">
            <svg viewBox={`0 0 ${qr.size} ${qr.size}`} shapeRendering="crispEdges" aria-hidden="true">
              <path d={qr.d} fill="#121212" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
});

export default function Poster({ kind = FALLBACK_KIND, className = "", decorative = false }) {
  const key = Object.hasOwn(POSTER_KINDS, kind) ? kind : FALLBACK_KIND;
  const { light, style } = VIEW[key];
  const access = decorative ? { "aria-hidden": "true" } : { role: "img", "aria-label": POSTER_KINDS[key].label };
  return (
    <div className={`pst${light ? " is-light" : ""}${className ? ` ${className}` : ""}`} style={style} {...access}>
      <Body kind={key} />
    </div>
  );
}
