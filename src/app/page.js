"use client";

import { useRef, useCallback, useState, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import MainHeader from "./components/Headers";
import Background from "./components/Background";
import SkylabLogo from "./components/landing/SkylabLogo";
import TeamBento from "./components/landing/TeamBento";
import HowWeWork from "./components/landing/HowWeWork";
import FAQ from "./components/landing/FAQ";
import Marquee from "./components/landing/Marquee";

function CountUp({ value, suffix, delay }) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const controls = animate(motionVal, value, {
        duration: 2.5,
        ease: [0.22, 1, 0.36, 1],
        onComplete: () => setIsFinished(true),
      });
      return () => controls.stop();
    }, delay * 1000);
    return () => clearTimeout(timeout);
  }, [motionVal, value, delay]);

  useEffect(() => {
    const unsubscribe = rounded.on("change", (v) => setDisplay(v));
    return () => unsubscribe();
  }, [rounded]);

  return (
    <>
      {display}
      {suffix && (
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: isFinished ? 1 : 0 }} transition={{ duration: 0.5, ease: "easeInOut" }}>
          {suffix}
        </motion.span>
      )}
    </>
  );
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  show: {
    opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
  },
};

export default function Home() {
  const scrollRef = useRef(null);
  const bgRef = useRef(null);

  const handleScroll = useCallback((e) => {
    if (!bgRef.current) return;
    const y = e.currentTarget.scrollTop;
    const threshold = window.innerHeight * 0.8;
    bgRef.current.style.opacity = Math.max(0, 0.5 * (1 - y / threshold));
  }, []);

  return (
    <main ref={scrollRef} onScroll={handleScroll}
      className="relative h-screen overflow-y-auto overflow-x-hidden scroll-smooth   scrollbar bg-neutral-950 text-white selection:bg-violet-500 selection:text-white font-sans"
    >
      <div ref={bgRef} className="will-change-[opacity]" style={{ opacity: 0.5 }}>
        <Background />
      </div>

      <div className="relative z-10">
        <MainHeader />

        <section className="relative px-5 md:px-10 pt-20 md:pt-30 pb-24">
          <div className="absolute top-[55%] -translate-y-1/2 right-0 translate-x-1/2 w-[90vw] h-[90vw] max-w-[900px] max-h-[900px] md:max-w-[1050px] md:max-h-[1050px] lg:max-w-[1200px] lg:max-h-[1200px] pointer-events-none select-none transition-opacity duration-100"
            style={{ "--fill-0": "#43313a" }}
          >
            <div className="w-full h-full opacity-20">
              <SkylabLogo />
            </div>
          </div>

          <div className="relative z-10 max-w-6xl mx-auto min-h-[70vh]">
            <motion.div variants={container} initial="hidden" animate="show">
              <motion.div variants={item} className="flex items-center gap-3 mb-10">
                <div className="px-3 py-1 rounded-full border border-skylab-500/25 text-skylab-500 font-mono text-[11px]">
                  Bilgisayar Bilimleri Kulübü
                </div>
                <div className="hidden sm:block w-16 h-px bg-neutral-800" />
                <span className="hidden sm:block text-neutral-600 font-mono text-[11px]">
                  Yıldız Teknik Üniversitesi
                </span>
              </motion.div>

              <motion.h1 variants={item} className="text-white mb-8 max-w-3xl text-[clamp(2.4rem,6.5vw,5rem)] font-bold leading-[1.05] tracking-[-0.03em]">
                Arge ekipleriyle
                <br />
                <span className="text-neutral-600">birlikte üret.</span>
              </motion.h1>

              <motion.div variants={item} className="flex flex-col md:flex-row md:items-end gap-8 md:gap-20">
                <p className="text-neutral-500 max-w-md text-base leading-[1.7]">
                  8 farklı alanda proje geliştiren ekipler.
                  <br />
                  İlgini çekeni seç, katıl, üretmeye başla.
                </p>

                <div className="flex items-center gap-6">
                  {[
                    { val: 8, suffix: null, label: "ekip", delay: 0 },
                    { val: 50, suffix: "+", label: "üye", delay: 0.2 },
                    { val: 30, suffix: "+", label: "proje", delay: 0.4 },
                  ].map((s, i) => (
                    <div key={s.label} className="flex items-center gap-6">
                      {i > 0 && <div className="w-px h-8 bg-neutral-800" />}
                      <div>
                        <div className="text-white text-[32px] font-bold leading-none">
                          <CountUp value={s.val} suffix={s.suffix} delay={s.delay} />
                        </div>
                        <div className="text-neutral-600 font-mono text-xs mt-1">
                          {s.label}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={item} className="flex items-center gap-4 mt-12">
                <a href="#" className="group inline-flex items-center gap-3 px-8 py-3.5 bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-xl font-medium text-sm hover:text-white hover:border-skylab-500/50 hover:bg-neutral-800 transition-all duration-300 hover:shadow-[0_0_20px_rgba(224,200,229,0.15)]">
                  <span>Başvuru Yap</span>
                  <ArrowUpRight strokeWidth={2} className="w-5 h-5 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-px group-hover:text-skylab-500"/>
                </a>

                <a href="#ekipler" className="group inline-flex items-center gap-2 px-6 py-3.5 text-neutral-400 font-medium text-xs hover:text-white transition-colors duration-300">
                  <span>Ekiplere Göz At</span>
                  <ArrowDown strokeWidth={2} className="w-3 h-3 transition-transform duration-300 group-hover:translate-y-1"/>
                </a>
              </motion.div>
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.6, ease: [0.16, 1, 0.3, 1] }} className="-mt-20 md:-mt-20 relative z-20">
            <Marquee />
          </motion.div>
        </section>


        <div id="ekipler">
          <TeamBento />
        </div>

        <HowWeWork />

        <div id="sss">
          <FAQ />
        </div>

        {/* will add footer here */}
      </div>
    </main>
  );
}
