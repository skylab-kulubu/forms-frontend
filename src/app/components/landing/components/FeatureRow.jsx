"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { useScrollContainer } from "../utils";

export default function FeatureRow({ feature, index }) {
  const ref = useRef(null);
  const scrollContainer = useScrollContainer();
  const { scrollYProgress } = useScroll({
    container: scrollContainer ?? undefined,
    target: ref,
    offset: ["start 90%", "end 20%"],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.85, 1], [0.4, 1, 1, 0.6]);
  const y = useTransform(scrollYProgress, [0, 0.4], [50, 0]);

  const flipped = index % 2 === 1;
  const { Demo } = feature;

  return (
    <motion.div ref={ref} id={feature.id} style={{ opacity, y }}
      className={`scroll-mt-24 grid gap-12 lg:gap-20 items-center grid-cols-1 ${flipped ? "lg:grid-cols-[1.35fr_minmax(0,1fr)]" : "lg:grid-cols-[minmax(0,1fr)_1.35fr]"}`}>
      <div className={flipped ? "lg:order-2" : ""}>
        <div className="flex items-center gap-3 mb-5">
          <span className="font-mono text-[11.5px] tracking-[0.22em] text-skylab-500">- {feature.num}</span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-neutral-500">{feature.eyebrow}</span>
        </div>
        <h3 style={{ fontFamily: "var(--sl-display)", fontWeight: 600, fontSize: "clamp(36px, 4.4vw, 60px)", letterSpacing: "-.03em", lineHeight: 0.98, color: "var(--sl-ink)" }}>
          {feature.title}
        </h3>
        <p className="mt-6 text-[16px] leading-[1.7] text-neutral-400 max-w-[54ch]">{feature.desc}</p>
        <ul className="mt-8 space-y-3 max-w-[48ch]">
          {feature.bullets.map((b, i) => (
            <motion.li key={b} initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }} transition={{ delay: 0.15 + i * 0.08, duration: 0.5 }}
              className="flex items-start gap-3 text-[14.5px] text-neutral-300">
              <span className="mt-2.5 h-1 w-1 rounded-full bg-skylab-500 shadow-[0_0_8px_var(--sl-accent)] shrink-0" />
              <span>{b}</span>
            </motion.li>
          ))}
        </ul>
      </div>

      <div className={flipped ? "lg:order-1" : ""}>
        <motion.div initial={{ opacity: 0, scale: 0.96, y: 20 }} whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }} transition={{ duration: 0.8, ease: [0.2, 0.7, 0.3, 1] }}
          className="relative">
          <div className="absolute -inset-8 rounded-4xl bg-linear-to-br from-skylab-600/10 via-skylab-600/0 to-skylab-600/0 blur-3xl pointer-events-none" />
          <div className="relative rounded-2xl border border-white/10 bg-linear-to-br from-white/4 to-white/0.5 backdrop-blur-sm overflow-hidden shadow-[0_24px_64px_-24px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/6 bg-white/1.5">
              <div className="h-2 w-2 rounded-full bg-white/15" />
              <div className="h-2 w-2 rounded-full bg-white/15" />
              <div className="h-2 w-2 rounded-full bg-white/15" />
              <span lang="en" className="ml-3 font-mono text-[9.5px] text-neutral-600 tracking-wider uppercase">forms · /{feature.id}</span>
            </div>
            <div className="p-6 lg:p-7 min-h-[440px] flex flex-col justify-start">
              <Demo />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}