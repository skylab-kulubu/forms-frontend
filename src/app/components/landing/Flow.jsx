"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll } from "framer-motion";
import { useScrollContainer } from "./utils";

const FLOW = [
  { k: "Oluştur", v: "Temel yapıyı kur ve çalışma alanını hazırla.", side: "yönetici" },
  { k: "Tasarla", v: "Bileşenleri yerleştir, mantık kurallarını belirle.", side: "yönetici" },
  { k: "Yayınla", v: "Tek tıkla canlıya al veya anında erişime kapat.", side: "yönetici" },
  { k: "Topla", v: "Gelen yanıtları anlık izle, veriyi güvenle depola.", side: "kullanıcı" },
  { k: "İncele", v: "Değerlendir, karar ver ve gerisi bizde.", side: "yönetici" },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 18, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};
const stepItem = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

export default function Flow() {
  const ref = useRef(null);
  const scrollContainer = useScrollContainer();
  const { scrollYProgress } = useScroll({
    container: scrollContainer ?? undefined,
    target: ref,
    offset: ["start 80%", "end 60%"],
  });
  const [lit, setLit] = useState(() => FLOW.map(() => false));

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      setLit(FLOW.map((_, i) => v >= (i + 0.5) / FLOW.length));
    });
    return () => unsub();
  }, [scrollYProgress]);

  return (
    <section className="px-5 md:px-10 py-24 md:py-32" id="akis">
      <div className="max-w-6xl mx-auto">
        <motion.div initial="hidden" whileInView="show" viewport={{ once: true, margin: "-80px" }} variants={container}>
          <motion.div variants={item} className="flex items-baseline gap-4 mb-10">
            <span className="text-skylab-500 font-mono text-xs">./akış</span>
            <div className="flex-1 h-px bg-linear-to-r from-neutral-800 from-80% to-transparent" />
            <span className="hidden sm:inline font-mono text-[10px] text-neutral-600 tracking-[0.16em] uppercase">
              yaşam döngüsü
            </span>
          </motion.div>

          <motion.div variants={item} className="mb-16 max-w-3xl">
            <h2 className="text-white text-4xl md:text-5xl font-bold tracking-[-0.025em] mb-4 leading-[1.05]">
              Bir formun yaşam döngüsü.
            </h2>
            <p className="text-neutral-500 text-sm md:text-[15px] leading-[1.7]">
              İlk taslaktan son arşive kadar tüm süreç tek ekranda.
            </p>
          </motion.div>

          <div ref={ref} className="relative">
            <motion.div
              variants={container}
              className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 pt-10"
            >
              <motion.div
                variants={item}
                className="hidden lg:block absolute left-0 right-0 top-[42px] h-px bg-neutral-800/60 pointer-events-none overflow-hidden origin-left"
              >
                <div className="flow-pulse" />
              </motion.div>

              {FLOW.map((s, i) => (
                <motion.div key={s.k} variants={stepItem}
                  className="relative flex flex-col items-center lg:items-start text-center lg:text-left"
                >
                  <div className="relative mb-5 lg:self-start">
                    <div
                      className={`h-2 w-2 rounded-full transition-all duration-500 ${lit[i]
                          ? "bg-skylab-500 shadow-[0_0_8px_rgba(224,200,229,0.5)]"
                          : "bg-neutral-700"
                        }`}
                    />
                  </div>

                  <div className="font-mono text-[10px] text-neutral-600 tracking-[0.16em] uppercase mb-2">
                    0{i + 1} · {s.side}
                  </div>
                  <h3 className="text-white text-lg font-semibold mb-2">{s.k}</h3>
                  <p className="text-neutral-500 text-sm leading-[1.65] max-w-[26ch]">{s.v}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}