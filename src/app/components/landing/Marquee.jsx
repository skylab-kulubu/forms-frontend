"use client";

const marqueeItems = [
  "YAPAY ZEKA",
  "WEB",
  "SİBER GÜVENLİK",
  "MOBİL",
  "OYUN",
  "ALGORİTMA",
  "BLOCKCHAIN",
  "GÖMÜLÜ SİSTEMLER",
  "ORGANİZASYON"
];

export default function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-neutral-800/30 py-3 mask-[linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      <div className="flex whitespace-nowrap w-max animate-[marquee_50s_linear_infinite] hover:[animation-play-state:paused]">
        {[0, 1, 2, 3].map((loop) => (
          <div key={loop} className="flex items-center shrink-0">
            {marqueeItems.map((item) => (
              <div key={`${loop}-${item}`} className="flex items-center">
                <span className="text-neutral-700 tracking-[0.3em] px-8 font-mono text-[0.55rem]">
                  {item}
                </span>
                <span className="w-1 h-1 rounded-full bg-neutral-800 shrink-0" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}