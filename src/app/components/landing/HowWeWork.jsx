"use client";

import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Ekibini Seç",
    desc: "İlgi alanına göre 8 ekipten birini seç. Birden fazla ekipte de yer alabilirsin.",
  },
  {
    num: "02",
    title: "Başvurunu Yap",
    desc: "Seçtiğin ekibe başvuru at, ekip lideri ile iletişime geç.",
  },
  {
    num: "03",
    title: "Onboarding",
    desc: "Ekip liderleriyle tanış, kullanılan teknolojileri öğren, ilk görevini al.",
  },
  {
    num: "04",
    title: "Projede Çalış",
    desc: "Dönem boyunca ekibinle birlikte gerçek bir proje geliştir. Portfolyona Ekle.",
  },
];

export default function HowWeWork() {
  return (
    <section className="px-5 md:px-10 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline gap-4 mb-12">
          <span className="text-skylab-500 font-mono text-xs">
            ./süreç
          </span>
          <div className="flex-1 border-b border-dashed border-neutral-800" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px rounded-xl overflow-hidden border border-white/6">
          {steps.map((step, i) => (
            <motion.div key={step.num} initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="bg-neutral-950/50 backdrop-blur-sm p-6 md:p-8 relative group"
            >
              <span className="text-skylab-600/60 mb-6 block font-mono text-[40px] font-bold leading-none">
                {step.num}
              </span>
              <h3 className="text-white mb-3 text-lg font-semibold">
                {step.title}
              </h3>
              <p className="text-neutral-500 text-sm leading-[1.7]">
                {step.desc}
              </p>
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 right-2 translate-x-1/2 -translate-y-1/2 text-neutral-700 z-10">
                  →
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}