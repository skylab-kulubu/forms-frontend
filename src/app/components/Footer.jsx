"use client";

import { Mail, MapPin, ArrowRight } from "lucide-react";

const currentYear = new Date().getFullYear();

const quickLinks = [
  { name: "Hakkımızda", href: "https://yildizskylab.com" },
  { name: "Yönetim Kurulu", href: "https://yildizskylab.com" },
  { name: "Denetim Kurulu", href: "https://yildizskylab.com" },
];

export default function Footer() {
  return (
    <footer className="relative bg-neutral-950 pt-10 pb-10 overflow-hidden">
      <div className="relative z-10 mx-auto max-w-6xl px-5 md:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-16">          
          
          <div className="md:col-span-5 flex flex-col items-center md:items-start gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <img src="/skylab.svg" alt="Skylab Logo" className="h-10 w-10 object-contain opacity-80" />
              <div className="-mt-1 text-left">
                <h3 className="text-white font-bold text-lg tracking-wide">SKY LAB</h3>
                <p className="text-skylab-500 font-mono text-[10px] tracking-wider uppercase mt-0.5">Bilgisayar Bilimleri Kulübü</p>
              </div>
            </div>
            
            <p className="text-neutral-500 text-sm leading-[1.8] max-w-sm">
              Teknoloji tutkunlarını bir araya getiren, proje odaklı çalışan ve sürekli öğrenmeyi hedefleyen bir teknoloji topluluğuyuz. Ar-Ge ekipleriyle <strong className="text-neutral-300 font-medium">birlikte üret!</strong>
            </p>
          </div>

          <div className="md:col-span-3 flex flex-col items-center md:items-start gap-5">
            <h4 className="text-white font-semibold mb-2">Keşfet</h4>
            <ul className="flex flex-col items-center md:items-start gap-3.5">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer" 
                    className="text-neutral-500 text-sm hover:text-skylab-400 transition-colors inline-flex items-center gap-2 group"
                  >
                    <ArrowRight size={14} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300" />
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 flex flex-col items-center md:items-start gap-5 text-center md:text-left">
            <h4 className="text-white font-semibold mb-2">İletişim</h4>
            <ul className="flex flex-col items-center md:items-start gap-4">
              <li className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-3 text-neutral-500 text-sm">
                <MapPin size={18} className="text-neutral-600 shrink-0 md:mt-0.5" />
                <span className="leading-[1.6]">
                  Yıldız Teknik Üniversitesi <br className="hidden md:block" /> Davutpaşa Kampüsü, Kulüpler Vadisi
                </span>
              </li>
              <li className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-neutral-500 text-sm">
                <Mail size={18} className="text-neutral-600 shrink-0" />
                <a href="mailto:info@yildizskylab.com" className="hover:text-white transition-colors">
                  info@yildizskylab.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-white/10">
          <p className="text-neutral-600 text-xs text-center md:text-left">
            © {currentYear} SKY LAB. Tüm hakları saklıdır.
          </p>
          
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-600">
            <span>developed by</span>
            <a href="https://github.com/fatiihnaz" target="_blank" rel="noopener noreferrer" className="hover:text-skylab-700 transition-colors">Fatih Naz</a>
          </div>
        </div>

      </div>
    </footer>
  );
}