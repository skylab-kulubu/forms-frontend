"use client";

import FormBuilderDemo from "./components/FormBuilderDemo";
import ConditionalLinkDemo from "./components/ConditionalLinkDemo";
import ResponseManagementDemo from "./components/ResponseManagementDemo";
import ComponentGroupsDemo from "./components/ComponentGroupsDemo";
import DashboardDemo from "./components/DashboardDemo";
import AutosaveDemo from "./components/AutosaveDemo";
import FeatureRow from "./components/FeatureRow";

const FEATURES = [
  {
    id: "builder", num: "01", eyebrow: "Sürükle & Bırak Editör",
    title: "Sürükle. Bırak. Yayınla.",
    desc: "12 farklı bileşen türü ile ihtiyacınız olan yapıyı saniyeler içinde kurun. Yaptığınız her değişiklik anında arka planda kaydedilir.",
    bullets: [
      "12 farklı form bileşeni",
      "Akıcı sürükle-bırak deneyimi",
      "Zengin metin (Rich Text) desteği",
    ],
    Demo: FormBuilderDemo,
  },
  {
    id: "logic", num: "02", eyebrow: "Koşullu Mantık",
    title: "Akıllı formlar, dinamik akışlar.",
    desc: "Kullanıcının verdiği yanıtlara göre sonraki soruları gizleyin veya gösterin. Formları birbirine bağlayarak ardışık süreçler yaratın.",
    bullets: [
      "Gelişmiş görünürlük kuralları",
      "Çoklu koşul dallanmaları",
      "Otomatik form tetikleme",
    ],
    Demo: ConditionalLinkDemo,
  },
  {
    id: "responses", num: "03", eyebrow: "Yanıt Yönetimi",
    title: "Veriyi eyleme dönüştürün.",
    desc: "Gelen yanıtları detaylıca filtreleyin ve arayın. Başvuruları tek ekrandan not ekleyerek onayla, reddet veya beklemeye al.",
    bullets: [
      "Not eklenebilir onay akışı",
      "Detaylı filtreleme yeteneği",
      "Tek tıkla Excel'e aktarım",
    ],
    Demo: ResponseManagementDemo,
  },
  {
    id: "groups", num: "04", eyebrow: "Bileşen Grupları",
    title: "Bir kez tasarla, her yerde kullan.",
    desc: "Sık kullandığınız soru setlerini yapı taşı olarak kaydedin. İstediğiniz formda tek tıkla yeniden kullanın ve merkezden güncelleyin.",
    bullets: [
      "Yeniden kullanılabilir soru setleri",
      "Tek tıkla forma entegrasyon",
      "Merkezi güncelleme altyapısı",
    ],
    Demo: ComponentGroupsDemo,
  },
  {
    id: "dashboard", num: "05", eyebrow: "Yönetim Paneli",
    title: "Tüm süreçler tek bakışta.",
    desc: "Aktif formlarınızı, yanıt trendlerini ve genel istatistikleri merkezi bir ekrandan takip edin. Gelişmiş grafiklerle Skylab iş akışlarını analiz edin.",
    bullets: [
      "Kapsamlı sistem metrikleri",
      "Haftalık aktivite grafikleri",
      "Sık kullanılanlara hızlı erişim",
    ],
    Demo: DashboardDemo,
  },
  {
    id: "autosave", num: "06", eyebrow: "Taslak Sistemi",
    title: "Hiçbir veri kaybolmaz.",
    desc: "Hem formu hazırlarken hem de yanıtlarken her anınız güvende. Gelişmiş taslak sistemiyle sekme kapansa bile kaldığınız yerden anında devam edin.",
    bullets: [
      "Anlık otomatik kaydetme",
      "Kaldığın yerden devam etme",
      "İstendiğinde taslağı sıfırlama",
    ],
    Demo: AutosaveDemo,
  },
];

export default function Features() {
  return (
    <section className="px-5 md:px-10 py-24 md:py-32" id="yetkinlikler">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-baseline gap-4 mb-10">
          <span className="text-skylab-500 font-mono text-xs">./özellikler</span>
          <div className="flex-1 h-px bg-linear-to-r from-neutral-800 from-80% to-transparent" />
          <span className="hidden sm:inline font-mono text-[10px] text-neutral-600 tracking-[0.16em] uppercase">
            Uygulamanın yetenekleri
          </span>
        </div>

        <div className="mb-20 max-w-3xl">
          <h2 className="text-white text-4xl md:text-5xl font-bold tracking-[-0.025em] mb-4 leading-[1.05]">
            Form aracı değil, süreç yönetimi.
          </h2>
          <p className="text-neutral-500 text-sm md:text-[15px] leading-[1.7]">
            Sürükle-bırak editörden gelişmiş onay mekanizmalarına kadar tüm iş akışınızı yapılandırın. Sistem yeteneklerini aşağıda canlı olarak deneyimleyin.
          </p>
        </div>

        <div className="space-y-32 lg:space-y-40">
          {FEATURES.map((f, i) => <FeatureRow key={f.id} feature={f} index={i} />)}
        </div>
      </div>
    </section>
  );
}