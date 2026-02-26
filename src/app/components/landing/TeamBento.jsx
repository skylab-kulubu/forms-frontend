"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Brain, Globe, Shield, Smartphone, Gamepad2, Cpu, Link2, Code2, Users } from "lucide-react";

const teams = [
  {
    id: "algolab",
    name: "Algolab",
    desc: "Algoritma ve programlama alanında eğitimler veriyor, competitive programming dünyasında hızla ilerliyoruz.",
    longDesc: "Beginner, Algolearning ve Algostdy alt ekiplerimizle temelden ileri seviyeye C++ ve algoritma eğitimleri düzenliyoruz. Her hafta Algorithm Games Challenge (AGC) organize ediyor, İnzva ve çeşitli algoritma yarışmalarına katılarak yeteneklerimizi geliştiriyoruz.",
    stack: ["C++", "Algorithms", "Competitive Programming", "Data Structures"],
    icon: Code2,
  },
  {
    id: "weblab",
    name: "Weblab",
    desc: "Modern teknolojileri kullanarak kulübümüzün ve projelerimizin web uygulama ihtiyaçlarını karşılıyoruz.",
    longDesc: "React, Next.js, Java ve .NET gibi teknolojilerle hem frontend hem backend geliştirmeleri yapıyoruz. Kullanıcı deneyimini ve performansı ön planda tutarak çeşitli web siteleri ve uygulamalar oluşturuyoruz.",
    stack: ["React", "Next.js", "Java", ".NET"],
    icon: Globe,
  },
  {
    id: "skysec",
    name: "Sky-Sec",
    desc: "Siber güvenlik alanında sızma testleri, saldırı ve savunma senaryoları üzerine çalışarak ilerliyoruz.",
    longDesc: "Local pentesting, red teaming ve blue team senaryoları üzerine çalışıyoruz. TryHackMe, HackTheBox gibi platformlarda YTÜ'yü temsil ediyor, SKYDAYS CTF ile siber güvenliğin merkezini üniversitemize taşıyoruz. Bilgisayar bilimleri mottosuyla SKY LAB sistemlerine güvenlik otomasyonları yazıyoruz.",
    stack: ["Pentesting", "Red Teaming", "Blue Teaming", "CTF"],
    icon: Shield,
  },
  {
    id: "mobilab",
    name: "Mobilab",
    desc: "Flutter ile mobil uygulamalar geliştirerek kulübümüzün ve okulumuzun dijital ihtiyaçlarını karşılıyoruz.",
    longDesc: "Flutter kullanarak yaratıcı mobil uygulama fikirlerini hayata geçiriyoruz. Yeni ekip arkadaşlarımızı projelerde yer alacak şekilde yetiştiriyor, okulumuzu Teknofest gibi ulusal ve uluslararası yarışmalarda temsil etmeyi hedefliyoruz.",
    stack: ["Flutter", "Dart", "Mobile Development", "UI/UX"],
    icon: Smartphone,
  },
  {
    id: "gamelab",
    name: "Gamelab",
    desc: "Oyun geliştirme alanında eğitimler veriyor, farklı platformlar için yaratıcı oyunlar tasarlıyoruz.",
    longDesc: "Düzenlediğimiz etkinlikler ve eğitimlerle insanları oyun geliştirme dünyasıyla tanıştırıyoruz. Alt ekipler halinde çeşitli platformlar için oyunlar geliştiriyor, bu sene oyun geliştirme yarışmalarına iddialı bir şekilde hazırlanıyoruz.",
    stack: ["Unity", "Unreal Engine", "C#", "Game Design"],
    icon: Gamepad2,
  },
  {
    id: "airlab",
    name: "Airlab",
    desc: "Yapay zeka, makine öğrenmesi ve derin öğrenme projeleriyle TEKNOFEST ve Kaggle'da boy gösteriyoruz.",
    longDesc: "Ulaşımda, sağlıkta ve Türkçe doğal dil işlemede yapay zeka yarışmalarına katılıyoruz. Kaggle ve datathonlarda deneyim kazanıyor, ARTLAB etkinliğimizde sergilemek üzere yapay zeka projeleri geliştiriyoruz.",
    stack: ["Machine Learning", "Deep Learning", "NLP", "Python"],
    icon: Brain,
  },
  {
    id: "chainlab",
    name: "Chainlab",
    desc: "Blockchain teknolojisini araştırıyor; Web1, Web2 ve Web3 alanlarında projeler geliştiriyoruz.",
    longDesc: "Blockchain ekosistemini tanıtmayı amaçlıyoruz. Hackathonlara hazırlanarak ekipler çıkarıyor, projeler geliştiriyor ve merkeziyetsiz teknolojiler dünyasında adımızı daha çok duyurmak için çalışıyoruz.",
    stack: ["Blockchain", "Web3", "Smart Contracts", "Hackathons"],
    icon: Link2,
  },
  {
    id: "skysis",
    name: "Skysis",
    desc: "Gömülü sistemler, donanım ve mekanik tasarımı üzerine projeler üretiyor, yarışmalara katılıyoruz.",
    longDesc: "Disiplinler arası bir ekiple Skylite ve Çedar projelerimizle TEKNOFEST'te yarışıyoruz. Gömülü yazılım, donanım ve mekanik tasarımda kendimizi geliştiriyor, bu alanda araştırma yazıları yazarak teknolojiyi yakından takip ediyoruz.",
    stack: ["Embedded Systems", "Hardware Design", "C/C++", "Mechanics"],
    icon: Cpu,
  },
  {
    id: "organizasyon",
    name: "Organizasyon",
    desc: "SKY LAB'in dev etkinliklerini düzenliyor, kulübün akademik ve sosyal gelişimine katkı sağlıyoruz.",
    longDesc: "ARTLAB (Yapay Zeka Zirvesi), SKYDAYS (Siber Güvenlik Etkinliği) ve YILDIZ JAM (Oyun Geliştirme Zirvesi) gibi büyük organizasyonları planlıyoruz. BİZBİZE söyleşileri ve sosyal sorumluluk projeleriyle üyelerimizin iş dünyasıyla bağ kurmasını sağlıyoruz.",
    stack: ["Event Planning", "Coordination", "Networking", "PR"],
    icon: Users,
  },
];

export default function TeamBento() {
  const [expanded, setExpanded] = useState(null);

  const displayTeams = useMemo(() => {
    const lastTeamId = teams[teams.length - 1].id;
    
    if (expanded === lastTeamId) {
      const newTeams = [...teams];
      const last = newTeams[newTeams.length - 1];
      newTeams[newTeams.length - 1] = newTeams[newTeams.length - 2];
      newTeams[newTeams.length - 2] = last;
      return newTeams;
    }
    
    return teams;
  }, [expanded]);

  return (
    <section className="px-5 md:px-10 pb-32">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline gap-4 mb-12">
          <span className="text-skylab-400 font-mono text-xs">./ekipler</span>
          <div className="flex-1 border-b border-dashed border-neutral-800" />
        </div>

        <LayoutGroup>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 lg:grid-flow-dense gap-3">
            {displayTeams.map((team) => {
              const Icon = team.icon;
              const isOpen = expanded === team.id;
              
              return (
                <motion.button key={team.id} layoutId={team.id} layout="position"
                  onClick={() => setExpanded(isOpen ? null : team.id)}
                  transition={{ layout: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
                  className={`relative text-left rounded-xl border overflow-hidden cursor-pointer backdrop-blur-sm transition-colors duration-300 flex flex-col ${
                    isOpen ? "border-skylab-600/25 bg-skylab-600/4 lg:col-span-2 row-span-2 p-8"
                    : "border-white/6 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-900/70 p-6"
                  }`}
                >
                  <Icon className={`absolute -bottom-4 -right-4 text-white/3 pointer-events-none transition-all duration-300 ${isOpen ? "w-40 h-40" : "w-28 h-28"}`}
                    strokeWidth={1}
                  />

                  <div className="relative z-10 flex flex-col h-full w-full">
                    <div>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-5 border transition-colors duration-300 ${isOpen ? "bg-skylab-600/15 border-skylab-600/30" : "bg-skylab-600/10 border-skylab-600/20"}`}>
                        <Icon className="w-5 h-5 text-skylab-600" />
                      </div>
                      <h3 className={`text-white font-semibold mb-2 transition-all duration-300 ${isOpen ? "text-xl" : "text-base"}`}>
                        {team.name}
                      </h3>
                      <p className="text-neutral-500 text-sm leading-[1.6] mb-4">{team.desc}</p>
                    </div>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }}
                          className="overflow-hidden flex-1"
                        >
                          <p className="text-neutral-400 text-sm leading-[1.8] mb-5">{team.longDesc}</p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {team.stack.map((s) => (
                              <span key={s} className="rounded-md border border-white/6 bg-white/3 px-2.5 py-0.5 text-neutral-400 font-mono text-xs">
                                {s}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                          transition={{ delay: 0.1 }} className="mt-auto pt-6 hidden md:block"
                        >
                          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors">
                            Ekibe Başvur
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className={`absolute bottom-0 left-0 right-0 h-px transition-all duration-500 ${isOpen ? "bg-linear-to-r from-skylab-500 to-skylab-500/0" : "bg-transparent"}`}/>
                </motion.button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>
    </section>
  );
}