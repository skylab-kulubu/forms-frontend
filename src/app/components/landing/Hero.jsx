"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDown, ChevronDown, GitBranch } from "lucide-react";
import SkylabLogo from "./SkylabLogo";
import { Magnetic } from "./utils";

const SCHEMA_LINES = [
  { kind: "key", text: "title:", value: "\"Web Ekibi Başvurusu\"" },
  { kind: "key", text: "fields:" },
  { kind: "field", name: "Ad Soyad", type: "text" },
  { kind: "field", name: "Ekip", type: "select", options: "backend | frontend" },
  { kind: "field", name: "Portfolio", type: "url" },
  { kind: "field", name: "Deneyim", type: "slider", highlight: true },
  { kind: "cond", key: "show_if:", value: "ekip == \"backend\"" },
  { kind: "key", text: "submit:", value: "→ /api/respond" },
];

function SchemaCard() {
  return (
    <div className="rounded-xl border border-white/10 bg-neutral-950/60 backdrop-blur-sm overflow-hidden shadow-[0_24px_64px_-32px_rgba(0,0,0,0.6)]">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/6 bg-white/1.5">
        <div className="h-2 w-2 rounded-full bg-white/15" />
        <div className="h-2 w-2 rounded-full bg-white/15" />
        <div className="h-2 w-2 rounded-full bg-white/15" />
        <span className="ml-3 font-mono text-[10px] text-neutral-500 tracking-wider lowercase">form.schema</span>
        <span className="ml-auto font-mono text-[10px] text-neutral-700">yaml</span>
      </div>
      <div className="px-5 py-5 font-mono text-[12.5px] leading-[1.85] space-y-0.5">
        {SCHEMA_LINES.map((line, i) => (
          <motion.div key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 + i * 0.08, duration: 0.4, ease: [0.2, 0.7, 0.3, 1] }}
            className="flex items-center gap-2"
          >
            {line.kind === "key" && (
              <>
                <span className="text-skylab-500">{line.text}</span>
                {line.value && <span className="text-neutral-300">{line.value}</span>}
              </>
            )}
            {line.kind === "field" && (
              <>
                <span className="text-neutral-600 select-none w-3">{line.highlight ? "▸" : "-"}</span>
                <span className={line.highlight ? "text-neutral-100" : "text-neutral-300"}>{line.name}</span>
                <span className="text-neutral-700">·</span>
                <span className="text-skylab-600 px-1.5 py-0.5 rounded border border-skylab-700/25 bg-skylab-700/6 text-[10.5px] leading-none">
                  {line.type}
                </span>
                {line.options && (
                  <span className="text-neutral-600 text-[10.5px] pl-1">({line.options})</span>
                )}
              </>
            )}
            {line.kind === "cond" && (
              <span className="ml-6 inline-flex items-center gap-1.5 text-[11.5px]">
                <GitBranch size={10} className="text-skylab-500/70 shrink-0" />
                <span className="text-skylab-500">{line.key}</span>
                <span className="text-neutral-300">{line.value}</span>
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function RenderedForm() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.6, duration: 0.6, ease: [0.2, 0.7, 0.3, 1] }}
      className="rounded-xl border border-skylab-700/25 bg-linear-to-br from-skylab-700/6 to-transparent p-4 space-y-3"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-skylab-500">Web Ekibi Başvurusu</span>
        <span className="font-mono text-[9.5px] text-neutral-600">forms.yildizskylab.com</span>
      </div>

      <div className="space-y-2">
        <div className="space-y-1">
          <label className="font-mono text-[9.5px] text-neutral-500">Ad Soyad</label>
          <div className="h-7 rounded-md border border-white/8 bg-white/2.5" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="font-mono text-[9.5px] text-neutral-500">Ekip</label>
            <div className="h-7 rounded-md border border-white/8 bg-white/2.5 px-2 flex items-center justify-between">
              <span className="text-[11px] text-neutral-200">Backend</span>
              <ChevronDown size={10} className="text-neutral-600" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="font-mono text-[9.5px] text-neutral-500">Portfolio</label>
            <div className="h-7 rounded-md border border-white/8 bg-white/2.5" />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="font-mono text-[9.5px] text-skylab-500">Deneyim</label>
            <span className="font-mono text-[9.5px] text-neutral-500">2 yıl</span>
          </div>
          <div className="relative h-1 rounded-full bg-white/8">
            <div className="absolute left-0 top-0 h-full w-[28%] rounded-full bg-skylab-500" />
            <div className="absolute top-1/2 left-[28%] -translate-x-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-skylab-500 shadow-[0_0_10px_rgba(224,200,229,.6)]" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-1">
        <span className="text-[10.5px] font-medium text-neutral-900 bg-skylab-500 rounded-md px-3 py-1.5 inline-flex items-center gap-1.5">
          Gönder <ArrowUpRight size={11} strokeWidth={2.2} />
        </span>
      </div>
    </motion.div>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
};

export default function Hero() {
  const logoRef = useRef(null);

  useEffect(() => {
    const el = logoRef.current;
    if (!el) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let pending = null;
    const flush = () => {
      raf = 0;
      if (!pending) return;
      el.style.setProperty("--lx", pending.dx + "px");
      el.style.setProperty("--ly", pending.dy + "px");
      pending = null;
    };
    const onMove = (e) => {
      pending = {
        dx: (e.clientX / window.innerWidth - 0.5) * -20,
        dy: (e.clientY / window.innerHeight - 0.5) * -14,
      };
      if (!raf) raf = requestAnimationFrame(flush);
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="relative px-5 md:px-10 pt-28 md:pt-32 pb-24 min-h-dvh flex items-center overflow-x-clip">
      <div
        className="hero-logo hero-logo--bloom"
        ref={logoRef}
        aria-hidden
        style={{ "--fill-0": "#e0c8e5" }}
      >
        <SkylabLogo />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto w-full">
        <motion.div variants={container} initial="hidden" animate="show"
          className="grid grid-cols-1 lg:grid-cols-[1fr_1.05fr] gap-12 lg:gap-16 items-center"
        >
          <div className="min-w-0">
            <motion.div variants={item} className="flex items-baseline gap-4 mb-8">
              <span className="text-skylab-500 font-mono text-xs">./forms</span>
              <div className="flex-1 h-px bg-linear-to-r from-neutral-800 from-80% to-transparent" />
              <span className="hidden sm:inline font-mono text-[10px] text-neutral-600 tracking-[0.16em] uppercase">SKY LAB</span>
            </motion.div>

            <motion.h1 variants={item}
              className="text-white mb-6 -mr-3 text-[clamp(2.4rem,4.2vw,4.6rem)] font-bold leading-[1.02] tracking-[-0.03em]"
            >
              Dinamik formlar
              <br />
              <span className="text-neutral-600">Merkezi yönetim</span>
            </motion.h1>

            <motion.p variants={item} className="text-neutral-500 max-w-md text-[15px] leading-[1.7] mb-10">
              SKY LAB'in merkezi form yönetimi. Güçlü editör ve dinamik mimari ile tüm süreçleri tek platformdan kontrol edin.
            </motion.p>

            <motion.div variants={item} className="flex items-center gap-2 sm:gap-4 mb-12">
              <Magnetic strength={0.25}>
                <a href="https://arge.yildizskylab.com"
                  className="group inline-flex items-center gap-2 sm:gap-3 px-5 sm:px-7 py-2.5 sm:py-3 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl font-medium text-xs sm:text-sm hover:text-white hover:border-skylab-500/50 hover:bg-neutral-800 transition-all duration-300 hover:shadow-[0_0_20px_rgba(224,200,229,0.15)]"
                >
                  <span>Ekiplere göz at</span>
                  <ArrowUpRight strokeWidth={2} className="w-4 h-4 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-px group-hover:text-skylab-500" />
                </a>
              </Magnetic>

              <a href="#yetkinlikler"
                className="group inline-flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 text-neutral-400 font-medium text-[11px] sm:text-xs hover:text-white transition-colors duration-300"
              >
                <span>Uygulamayı incele</span>
                <ArrowDown strokeWidth={2} className="w-3 h-3 transition-transform duration-300 group-hover:translate-y-1" />
              </a>
            </motion.div>

            <motion.div variants={item} className="flex items-center gap-6 font-mono text-[11px] text-neutral-600">
              <div className="flex items-center gap-2">
                <span className="text-white text-lg font-bold leading-none">12</span>
                <span>bileşen</span>
              </div>
              <div className="w-px h-6 bg-neutral-800" />
              <div className="flex items-center gap-2">
                <span className="text-white text-lg font-bold leading-none">6</span>
                <span>operatör</span>
              </div>
              <div className="w-px h-6 bg-neutral-800" />
              <div className="flex items-center gap-2">
                <span className="text-white text-lg font-bold leading-none">Tek</span>
                <span>merkez</span>
              </div>
            </motion.div>
          </div>

          <motion.div variants={item} className="relative min-w-0">
            <SchemaCard />

            <div className="flex items-center justify-center gap-3 my-3">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 24 }}
                transition={{ delay: 1.3, duration: 0.5 }}
                className="w-px bg-linear-to-b from-skylab-700/0 via-skylab-500/60 to-skylab-500"
              />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5, duration: 0.4 }}
                className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-skylab-500 whitespace-nowrap"
              >
                canlı
              </motion.span>
            </div>

            <RenderedForm />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}