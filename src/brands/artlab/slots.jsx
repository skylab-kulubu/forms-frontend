import { ArrowUpRight } from "lucide-react";

const AMBER = "var(--al-amber)";
const CYAN = "var(--al-cyan)";
const BG = "var(--al-bg)";

export function CardTop({ brand }) {
  return (
    <>
      <svg width="130" height="64" viewBox="0 0 130 64" aria-hidden="true" className="pointer-events-none absolute -top-[63px] left-6 sm:left-10">
        <circle cx="60" cy="46" r="26" fill={BG} stroke={AMBER} strokeWidth="2" />
        <path d="M39.7 38.2 Q60 24.7 80.3 38.2" fill="none" stroke={AMBER} strokeWidth="1.4" opacity="0.45" />
        <circle cx="35" cy="48.1" r="7.8" fill={BG} stroke={AMBER} strokeWidth="2" />
        <circle cx="35" cy="48.1" r="3.4" fill="none" stroke={AMBER} strokeWidth="1.2" opacity="0.7" />
        <circle cx="85" cy="48.1" r="7.8" fill={BG} stroke={AMBER} strokeWidth="2" />
        <circle cx="85" cy="48.1" r="3.4" fill="none" stroke={AMBER} strokeWidth="1.2" opacity="0.7" />
        <circle cx="60" cy="48.6" r="12.2" fill={BG} stroke={AMBER} strokeWidth="1.5" />
        <circle cx="60" cy="48.6" r="8.8" fill="none" stroke={CYAN} strokeWidth="2" />
        <circle cx="60" cy="48.6" r="5.2" fill="none" stroke={CYAN} strokeWidth="1.2" opacity="0.6" />
        <circle cx="63" cy="45.6" r="2.6" fill={CYAN} />
        <path d="M112 7 L113.5 12.5 L119 14 L113.5 15.5 L112 21 L110.5 15.5 L105 14 L110.5 12.5 Z" fill={AMBER} opacity="0.9" />
        <circle cx="122" cy="24" r="1.4" fill={AMBER} opacity="0.7" />
        <circle cx="104" cy="6" r="1.1" fill={CYAN} opacity="0.8" />
        <rect x="6" y="52" width="20" height="12" rx="4" fill={BG} stroke={AMBER} strokeWidth="2" />
        <path d="M12 55 V60 M16 55 V60 M20 55 V60" stroke={AMBER} strokeWidth="1.2" opacity="0.6" />
        <rect x="94" y="52" width="20" height="12" rx="4" fill={BG} stroke={AMBER} strokeWidth="2" />
        <path d="M100 55 V60 M104 55 V60 M108 55 V60" stroke={AMBER} strokeWidth="1.2" opacity="0.6" />
      </svg>
      <a href={brand.siteUrl} className="group absolute right-6 bottom-full mb-3 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 transition-colors hover:text-sky-400 sm:right-10">
        <span className="min-[380px]:hidden">{brand.name}</span>
        <span className="hidden min-[380px]:inline">{brand.siteLabel}</span>
        <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-px group-hover:translate-x-px" />
      </a>
      <span aria-hidden="true" className="al-guide" />
      <span aria-hidden="true" className="al-orbit" />
    </>
  );
}
