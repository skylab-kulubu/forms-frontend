"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    q: "Herhangi bir ön bilgi gerekiyor mu?",
    a: "Ekipten ekibe değişiyor. Çoğunlukla her seviyeden öğrenciyi kabul ediyoruz. Önemli olan öğrenme isteği. Bazı ekiplerde mentorluk sistemiyle sıfırdan başlayabilirsin.",
  },
  {
    q: "Birden fazla ekipte yer alabilir miyim?",
    a: "Evet, en fazla 2 ekipte aktif olarak çalışabilirsin. Ama öncelik her zaman ana ekibinde olmalı.",
  },
  {
    q: "Haftalık ne kadar zaman ayırmam gerekiyor?",
    a: "Ekip toplantıları genelde haftada 1-2 saat. Bunun dışında proje çalışmaları için haftada 3-5 saat ayırmanı öneriyoruz.",
  },
  {
    q: "Başvuru süreci nasıl işliyor?",
    a: "Başvuru formunu doldur → Ekip lideriyle kısa bir görüşme yap → Onay aldıktan sonra onboarding sürecine başla. Süreç genelde 1 hafta içinde tamamlanıyor.",
  },
  {
    q: "Sadece kendi üniversitenizden mi öğrenci alıyorsunuz?",
    a: "Şu an için evet, ama uzaktan katılım için farklı modeller üzerinde çalışıyoruz. Takipte kal.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="px-5 md:px-10 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline gap-4 mb-12">
          <span className="text-skylab-400 font-mono text-xs">
            ./sss
          </span>
          <div className="flex-1 border-b border-dashed border-neutral-800" />
        </div>

        <div className="">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="border-b border-white/6">
                <button onClick={() => setOpen(isOpen ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left cursor-pointer group"
                >
                  <span className="text-neutral-100 group-hover:text-skylab-500 transition-colors pr-4 text-[15px] font-medium tracking-tight">
                    {faq.q}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-neutral-600 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}/>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
                      <p className="text-neutral-500 pb-5 text-sm leading-loose">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}