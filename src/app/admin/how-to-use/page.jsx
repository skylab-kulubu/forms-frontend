"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FilePlus, GripVertical, Settings,
  Type, AlignLeft, ToggleRight, ChevronDown, ListChecks,
  Calendar, Clock, Upload, Link2, SlidersHorizontal, Table, SeparatorHorizontal,
  Eye, EyeOff, UserPlus, Users, ShieldCheck,
  Archive, Filter, GitBranch, CheckCircle, XCircle,
  CircleDot, MessageSquare, ArrowRightLeft, Save, UserRound,
} from "lucide-react";
import {
  DemoFormCreate, DemoDragDrop, DemoConditional, DemoSettings,
  DemoFormLink, DemoCollaboration, DemoResponses, DemoApproval,
  DemoArchive, DemoFilter,
} from "./components/Demo";

const sections = [
  { id: "form-olusturma", label: "Form Oluşturma" },
  { id: "form-duzenleme", label: "Form Düzenleme" },
  { id: "bilesen-turleri", label: "Bileşen Türleri" },
  { id: "kosullama", label: "Koşullama" },
  { id: "form-ayarlari", label: "Form Ayarları" },
  { id: "form-baglama", label: "Form Bağlama" },
  { id: "editor-isbirligi", label: "Editör ve İşbirliği" },
  { id: "yanitlari-goruntuleme", label: "Yanıtları Görüntüleme" },
  { id: "yanit-onaylama", label: "Yanıt Onaylama" },
  { id: "arsivleme", label: "Arşivleme" },
  { id: "filtreleme", label: "Formları Filtreleme" },
  { id: "taslaklar", label: "Taslak ve Otomatik Kayıt" },
];

const componentTypes = [
  { icon: Type, name: "Kısa Metin", desc: "Tek satırlık metin girişi (metin, isim, e-posta, telefon, sayı)" },
  { icon: AlignLeft, name: "Uzun Metin", desc: "Çok satırlı metin alanı" },
  { icon: ToggleRight, name: "Toggle", desc: "Evet/Hayır seçimi" },
  { icon: ChevronDown, name: "Açılır Liste", desc: "Tek seçimlik menü" },
  { icon: ListChecks, name: "Çoklu Seçim", desc: "Birden fazla seçenek" },
  { icon: Calendar, name: "Tarih", desc: "Tarih seçici" },
  { icon: Clock, name: "Saat", desc: "Saat seçici" },
  { icon: Upload, name: "Dosya Yükleme", desc: "Dosya yükletme alanı" },
  { icon: Link2, name: "Link", desc: "URL girişi" },
  { icon: SlidersHorizontal, name: "Kaydırıcı", desc: "Sayısal aralık seçici" },
  { icon: Table, name: "Matris / Tablo", desc: "Grid yapı, anket soruları" },
  { icon: SeparatorHorizontal, name: "Ayıraç", desc: "Bölüm ayırıcı başlık ve açıklama" },
];

function Tip({ children }) {
  return (
    <div className="flex gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/80">
      <span className="shrink-0 text-amber-400">!</span>
      <span>{children}</span>
    </div>
  );
}

function Warning({ children }) {
  return (
    <div className="flex gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-200/80">
      <span className="shrink-0 text-red-400">!</span>
      <span>{children}</span>
    </div>
  );
}

function BulletList({ items }) {
  return (
    <ul className="space-y-1 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm text-neutral-400">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-neutral-600" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SectionHeader({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-skylab-500/10 border border-skylab-400/20">
        <Icon className="h-4 w-4 text-skylab-400" strokeWidth={1.75} />
      </div>
      <h2 className="text-base font-semibold text-neutral-100">{title}</h2>
    </div>
  );
}

function SectionBlock({ id, icon, title, children, demo }) {
  return (
    <section id={id} className="scroll-mt-6">
      <SectionHeader icon={icon} title={title} />
      <div className="flex flex-col gap-5 lg:flex-row lg:gap-8">
        <div className="flex-1 space-y-3 text-sm text-neutral-300 leading-relaxed min-w-0">
          {children}
        </div>
        {demo && (
          <div className="w-full lg:w-72 shrink-0 flex items-start">
            <div className="sticky top-6 w-full rounded-xl border border-white/6 bg-white/2 p-4 overflow-hidden">
              {demo}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

const operators = [
  { type: "Metin", ops: "Eşittir, Eşit Değildir, İçerir, Doldurulmuş mu" },
  { type: "Sayı / Kaydırıcı", ops: "Eşittir, Büyüktür, Küçüktür, Doldurulmuş mu" },
  { type: "Tarih / Saat", ops: "Eşittir, Önce, Sonra, Doldurulmuş mu" },
  { type: "Liste / Çoklu Seçim", ops: "Eşittir, Eşit Değildir, Doldurulmuş mu" },
  { type: "Toggle", ops: "Evet (True), Hayır (False)" },
  { type: "Dosya / Matris", ops: "Doldurulmuş mu, Boş mu" },
];


export default function HowToUsePage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const scrollRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      let current = sections[0].id;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const elTop = el.getBoundingClientRect().top - containerRect.top;
          if (elTop <= 48) current = section.id;
        }
      }
      setActiveSection(current);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    const container = scrollRef.current;
    if (el && container) {
      const offset = el.offsetTop - container.offsetTop - 16;
      container.scrollTo({ top: offset, behavior: "smooth" });
    }
  };

  return (
    <div className="flex h-[calc(100dvh-3.5rem)] overflow-hidden">
      <motion.div ref={scrollRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }} className="flex-1 overflow-y-auto scrollbar">
        <div className="mx-auto max-w-5xl px-6 py-6 pb-30">
          <div className="flex gap-10">
            <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.05 }} className="hidden lg:block w-40 shrink-0">
              <div className="sticky top-6 space-y-0.5">
                <p className="mb-2 text-[9px] font-semibold text-neutral-600 tracking-[0.15em] uppercase">İçindekiler</p>
                {sections.map((s, i) => (
                  <button key={s.id} onClick={() => scrollToSection(s.id)}
                    className={`flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[11px] transition-colors ${
                      activeSection === s.id ? "text-skylab-300 font-medium" : "text-neutral-600 hover:text-neutral-400"
                    }`}
                  >
                    <span className="text-[9px] text-neutral-700 w-3 text-right tabular-nums">{i + 1}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>
            </motion.nav>

            <div className="flex-1 min-w-0">
          <div className="mb-8">
            <h1 className="text-xl font-bold text-neutral-100">Nasıl Kullanılır</h1>
            <p className="mt-1 text-sm text-neutral-500">Platform özellikleri ve kullanım rehberi</p>
          </div>

          <div className="space-y-10">

            {/* 1 - Form Oluşturma */}
            <SectionBlock id="form-olusturma" icon={FilePlus} title="Form Oluşturma" demo={<DemoFormCreate />}>
              <p>Yeni bir form oluşturmak için Formlar &gt; <strong className="text-neutral-100">Yeni Form</strong> seçeneğine tıklayın.</p>
              <BulletList items={[
                "Yan menüden Formlar > \"Yeni Form\" seçeneğine tıklayın.",
                "Form başlığını girin.",
                "Onaylama butonuna tıklayarak formu oluşturun.",
                "Otomatik olarak düzenleme sayfasına yönlendirilirsiniz.",
              ]} />
            </SectionBlock>

            <div className="h-px bg-white/5" />

            {/* 2 - Form Düzenleme */}
            <SectionBlock id="form-duzenleme" icon={GripVertical} title="Form Düzenleme" demo={<DemoDragDrop />}>
              <p>Sağ taraftaki bileşen kütüphanesinden soruları <strong className="text-neutral-100">sürükle-bırak</strong> ile form alanına ekleyin.</p>
              <BulletList items={[
                "Bileşen kütüphanesinden istediğiniz soru türünü sürükleyin.",
                "Eklenen soruları sürükleyerek sıralarını değiştirin.",
                "Silmek için çöp kutusu alanına bırakın.",
                "Bir soruya tıklayarak ayarlarını düzenleyin.",
                "Değişikliklerinizi kaydetmek için onaylama butonuna tıklayın.",
              ]} />
              <Tip>Sağ üstte bulunan göz butonuna basarak formunuzun önizlemesini görebilirsiniz.</Tip>
            </SectionBlock>

            <div className="h-px bg-white/5" />

            {/* 3 - Bileşen Türleri */}
            <section id="bilesen-turleri" className="scroll-mt-6">
              <SectionHeader icon={ListChecks} title="Bileşen Türleri" />
              <p className="text-sm text-neutral-400 mb-4">Form düzenleyicisinde kullanabileceğiniz <strong className="text-neutral-200">12 farklı bileşen türü</strong>:</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {componentTypes.map((comp) => (
                  <div key={comp.name} className="flex items-center gap-3 rounded-lg border border-white/6 bg-white/2 px-3 py-2.5">
                    <comp.icon className="h-4 w-4 text-skylab-400 shrink-0" strokeWidth={1.75} />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-200">{comp.name}</p>
                      <p className="text-[10px] text-neutral-500">{comp.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3">
                <div>
                  <p className="text-xs font-medium text-neutral-200 flex items-center gap-1.5"><SeparatorHorizontal size={12} className="text-skylab-400" /> Ayıraç</p>
                  <p className="text-xs text-neutral-500 ml-[18px]">Formunuzu bölümlere ayırmak için kullanın. Sadece başlık ve açıklama alır, soru numarası almaz ve yanıtlara dahil edilmez. Koşula bağlanabilir ancak başka bir koşulun kaynağı olamaz.</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-200 flex items-center gap-1.5"><UserRound size={12} className="text-skylab-400" /> Otomatik Doldurma (İsim & E-posta)</p>
                  <p className="text-xs text-neutral-500 ml-[18px]">Kısa metin bileşeninde veri tipi olarak "İsim" veya "E-posta" seçildiğinde, giriş yapmış kullanıcıların bilgileri oturumdan otomatik doldurulur. İsim alanı salt okunurdur, e-posta alanı düzenlenebilir.</p>
                </div>
              </div>
            </section>

            <div className="h-px bg-white/5" />

            {/* 4 - Koşullama */}
            <SectionBlock id="kosullama" icon={GitBranch} title="Koşullama (Koşullu Sorular)" demo={<DemoConditional />}>
              <p>Bir sorunun yalnızca belirli bir koşul sağlandığında görünmesini sağlayabilirsiniz.</p>

              <p className="font-medium text-neutral-200 text-xs">Nasıl eklenir?</p>
              <BulletList items={[
                "Koşul eklemek istediğiniz soruyu seçin.",
                "\"Koşul Ekle\" butonuna tıklayın.",
                "Hangi sorunun cevabına bağlı olacağını seçin.",
                "Operatörü seçin ve beklenen değeri girin.",
              ]} />

              <p className="font-medium text-neutral-200 text-xs mt-2">Operatörler:</p>
              <div className="space-y-1">
                {operators.map((op) => (
                  <div key={op.type} className="flex gap-2 text-xs">
                    <span className="font-medium text-neutral-300 shrink-0 w-28">{op.type}</span>
                    <span className="text-neutral-500">{op.ops}</span>
                  </div>
                ))}
              </div>

              <Tip>İlk soruya koşul eklenemez çünkü bağımlı olacağı önceki bir soru yoktur. Ayıraç bileşenleri koşul kaynağı olarak seçilemez.</Tip>
            </SectionBlock>

            <div className="h-px bg-white/5" />

            {/* 5 - Form Ayarları */}
            <SectionBlock id="form-ayarlari" icon={Settings} title="Form Ayarları" demo={<DemoSettings />}>
              <p>Düzenleyicinin <strong className="text-neutral-100">Ayarlar</strong> sekmesinden formunuzun davranışını kontrol edin.</p>

              <div className="space-y-2.5">
                <div>
                  <p className="text-xs font-medium text-neutral-200 flex items-center gap-1.5"><Eye size={12} className="text-skylab-400" /> Form Durumu</p>
                  <p className="text-xs text-neutral-500 ml-[18px]">Yayında: yanıt kabul eder. Duraklatıldı: görüntülenebilir ama yanıt gönderilemez.</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-200 flex items-center gap-1.5"><EyeOff size={12} className="text-skylab-400" /> Anonim Yanıtlar</p>
                  <p className="text-xs text-neutral-500 ml-[18px]">Kullanıcılar giriş yapmadan form doldurabilir. Çoklu yanıtlar otomatik aktif olur.</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-200 flex items-center gap-1.5"><Users size={12} className="text-skylab-400" /> Çoklu Yanıtlar</p>
                  <p className="text-xs text-neutral-500 ml-[18px]">Aynı kullanıcı birden fazla yanıt gönderebilir.</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-200 flex items-center gap-1.5"><ShieldCheck size={12} className="text-skylab-400" /> Manuel İnceleme</p>
                  <p className="text-xs text-neutral-500 ml-[18px]">Yanıtlar bir editör tarafından onaylanmalıdır.</p>
                </div>
              </div>

              <Warning>Anonim yanıtları açmak birden fazla ayarı etkiler. Bağlı form kaldırılır ve manuel inceleme devre dışı kalır.</Warning>
            </SectionBlock>

            <div className="h-px bg-white/5" />

            {/* 6 - Form Bağlama */}
            <SectionBlock id="form-baglama" icon={ArrowRightLeft} title="Form Bağlama" demo={<DemoFormLink />}>
              <p>Bir formu başka bir formla <strong className="text-neutral-100">zincirleyerek</strong> kullanıcıların otomatik yönlendirilmesini sağlayın.</p>

              <p className="font-medium text-neutral-200 text-xs">Bağlama süreci:</p>
              <BulletList items={[
                "Ayarlar > \"Bağlı Form\" bölümüne gidin.",
                "Hedef formu bulun ve seçin.",
                "Onay ekranında detayları inceleyin ve onaylayın.",
              ]} />

              <p className="font-medium text-neutral-200 text-xs">Bağlantı sonrası:</p>
              <BulletList items={[
                "Ana formun ayarları ve editörleri bağlı forma senkronize edilir.",
                "Kullanıcı ana formu tamamlayıp yanıtı onaylandığında bağlı forma yönlendirilir.",
                "Bağlı formun ayarları kilitlenir.",
              ]} />

              <Warning>İki formun da sahibi olmanız gerekir. Anonim yanıtlar açıkken form bağlama kullanılamaz.</Warning>
            </SectionBlock>

            <div className="h-px bg-white/5" />

            {/* 7 - Editör ve İşbirliği */}
            <SectionBlock id="editor-isbirligi" icon={UserPlus} title="Editör ve İşbirliği" demo={<DemoCollaboration />}>
              <p>Formunuza başka kullanıcıları <strong className="text-neutral-100">editör</strong> veya <strong className="text-neutral-100">görüntüleyici</strong> olarak ekleyin.</p>

              <div className="space-y-2">
                <div>
                  <p className="text-xs font-medium text-neutral-200 flex items-center gap-1.5"><ShieldCheck size={12} className="text-skylab-400" /> Sahip</p>
                  <p className="text-xs text-neutral-500 ml-[18px]">Tam kontrol. Formu silebilir, tüm ayarları değiştirebilir.</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-200 flex items-center gap-1.5"><Users size={12} className="text-skylab-400" /> Editör</p>
                  <p className="text-xs text-neutral-500 ml-[18px]">Formu düzenleyebilir, görüntüleyici ekleyebilir. Silemez.</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-neutral-200 flex items-center gap-1.5"><Eye size={12} className="text-skylab-400" /> Görüntüleyici</p>
                  <p className="text-xs text-neutral-500 ml-[18px]">Yalnızca görüntüleyebilir, düzenleme yapamaz.</p>
                </div>
              </div>

              <BulletList items={[
                "Ayarlar > \"Editörler\" sekmesine gidin.",
                "E-posta ile kullanıcı arayın ve rolünü belirleyin.",
                "Eklenen kullanıcıların rollerini sonradan değiştirebilirsiniz.",
              ]} />
            </SectionBlock>

            <div className="h-px bg-white/5" />

            {/* 8 - Yanıtları Görüntüleme */}
            <SectionBlock id="yanitlari-goruntuleme" icon={MessageSquare} title="Yanıtları Görüntüleme" demo={<DemoResponses />}>
              <p>Formun <strong className="text-neutral-100">Cevaplar</strong> sayfasından yanıtları görüntüleyin.</p>
              <BulletList items={[
                "Her yanıt için gönderim tarihi, süre ve durum görüntülenir.",
                "Yanıtlayan kullanıcının adı ve profili gösterilir.",
                "Bağlı formlar arasında ok butonları ile geçiş yapabilirsiniz.",
                "Mobilde yanıt detayları çekmece olarak açılır.",
              ]} />
            </SectionBlock>

            <div className="h-px bg-white/5" />

            {/* 9 - Yanıt Onaylama */}
            <SectionBlock id="yanit-onaylama" icon={CheckCircle} title="Yanıt Onaylama / Reddetme" demo={<DemoApproval />}>
              <p><strong className="text-neutral-100">Manuel İnceleme</strong> açık formlarda yanıtlar editör tarafından incelenir.</p>

              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/20 bg-amber-500/5 px-2 py-1 text-[11px] text-amber-300">
                  <CircleDot size={10} /> Bekliyor
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-[11px] text-emerald-300">
                  <CheckCircle size={10} /> Onaylandı
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-red-500/20 bg-red-500/5 px-2 py-1 text-[11px] text-red-300">
                  <XCircle size={10} /> Reddedildi
                </span>
              </div>

              <BulletList items={[
                "\"Onayla\" veya \"Reddet\" butonuna tıklayın.",
                "İsteğe bağlı açıklama notu ekleyin.",
                "İncelemeyi yapan kişi, tarih ve not kaydedilir.",
                "Kararı daha sonra düzenleyebilirsiniz.",
              ]} />

              <Tip>Bağlı form varsa, onaylanan yanıtın kullanıcısı otomatik olarak bağlı forma yönlendirilir.</Tip>
            </SectionBlock>

            <div className="h-px bg-white/5" />

            {/* 10 - Arşivleme */}
            <SectionBlock id="arsivleme" icon={Archive} title="Arşivleme" demo={<DemoArchive />}>
              <p>Yanıtları <strong className="text-neutral-100">arşivleyerek</strong> listeden gizleyin. Arşivleme kalıcı silme değildir.</p>
              <BulletList items={[
                "Yanıt detaylarındaki arşiv ikonuna tıklayın.",
                "Arşivleyen kişi ve tarih bilgisi kaydedilir.",
                "\"Arşivlenenleri Göster\" ile tekrar görüntüleyin.",
              ]} />
              <Tip>Çoklu yanıt açıksa arşivleme kullanıcının tekrar cevap verebilmesini sağlar.</Tip>
            </SectionBlock>

            <div className="h-px bg-white/5" />

            {/* 11 - Filtreleme */}
            <SectionBlock id="filtreleme" icon={Filter} title="Formları Filtreleme" demo={<DemoFilter />}>
              <p>Form listesinde çeşitli filtreler kullanarak aradığınız formu hızlıca bulun.</p>

              <p className="font-medium text-neutral-200 text-xs">Kullanılabilir filtreler:</p>
              <BulletList items={[
                "Başlığa göre arama",
                "Tarih sıralaması: Yeniden eskiye veya eskiden yeniye",
                "Rol filtresi: Tümü, Sahip, Editör, Görüntüleyici",
              ]} />

              <p className="font-medium text-neutral-200 text-xs">Üç durumlu özellik filtreleri:</p>
              <p className="text-xs text-neutral-500">
                <span className="text-neutral-400">Hepsi</span> → <span className="text-skylab-300">Sadece açık</span> → <span className="text-red-300">Sadece kapalı</span>
              </p>
              <BulletList items={[
                "Anonim yanıtlar, Çoklu yanıtlar, Bağlı form, Manuel inceleme",
              ]} />

              <p className="font-medium text-neutral-200 text-xs">Yanıt filtreleri:</p>
              <BulletList items={[
                "Durum: Tümü, Bekliyor, Onaylanmış, Reddedilmiş",
                "Yanıtlayan: Tümü, Anonim, Kayıtlı",
                "Arşiv durumu: Dahil et veya etme",
              ]} />
            </SectionBlock>

            <div className="h-px bg-white/5" />

            {/* 12 - Taslak ve Otomatik Kayıt */}
            <SectionBlock id="taslaklar" icon={Save} title="Taslak ve Otomatik Kayıt">
              <p>Hem form düzenleyicisi hem de form yanıtlama tarafında <strong className="text-neutral-100">otomatik taslak kaydetme</strong> özelliği bulunur.</p>

              <p className="font-medium text-neutral-200 text-xs">Editör taslakları:</p>
              <BulletList items={[
                "Form düzenleyicisinde yaptığınız değişiklikler belirli bir süre sonra otomatik olarak kaydedilir.",
                "Düzenleyiciyi tekrar açtığınızda taslak varsa otomatik yüklenir ve bildirim gösterilir.",
                "Taslağı silmek için kütüphanedeki sil butonunu kullanabilirsiniz.",
                "Geri alma (undo) özelliği ile son değişikliklerinizi geri alabilirsiniz.",
              ]} />

              <p className="font-medium text-neutral-200 text-xs mt-2">Yanıt taslakları:</p>
              <BulletList items={[
                "Giriş yapmış kullanıcılar için yanıtlar otomatik olarak taslak olarak kaydedilir.",
                "Formu tekrar açtığınızda önceki yanıtlarınız otomatik yüklenir.",
                "İsterseniz taslağı sıfırlayıp baştan başlayabilirsiniz.",
                "Gönder butonunun yanında son kayıt zamanı gösterilir.",
              ]} />

              <Tip>Yanıt taslakları yalnızca giriş yapmış kullanıcılar için çalışır. Anonim yanıtlarda taslak kaydedilmez.</Tip>
            </SectionBlock>

          </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}