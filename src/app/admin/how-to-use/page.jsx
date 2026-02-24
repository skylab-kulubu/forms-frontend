"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  FilePlus, GripVertical, Settings,
  Type, AlignLeft, ToggleRight, ChevronDown, ListChecks,
  Calendar, Clock, Upload, Link2, SlidersHorizontal, Table,
  Eye, EyeOff, UserPlus, Users, ShieldCheck,
  Archive, Filter, GitBranch, CheckCircle, XCircle,
  CircleDot, MessageSquare, ArrowRightLeft
} from "lucide-react";

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
];

const componentTypes = [
  { icon: Type, name: "Kısa Metin", desc: "Tek satırlık metin girişi. E-posta, telefon, sayı gibi alt türleri vardır." },
  { icon: AlignLeft, name: "Uzun Metin", desc: "Çok satırlı metin alanı. Açık uçlu sorular için idealdir." },
  { icon: ToggleRight, name: "Toggle", desc: "Evet/Hayır seçimi. Özel etiketler tanımlanabilir." },
  { icon: ChevronDown, name: "Açılır Liste", desc: "Tek seçimlik açılır menü. Özel seçenekler eklenir." },
  { icon: ListChecks, name: "Çoklu Seçim", desc: "Birden fazla seçenek işaretlenebilir." },
  { icon: Calendar, name: "Tarih", desc: "Tarih seçici. Belirli bir tarih bilgisi toplamak için kullanılır." },
  { icon: Clock, name: "Saat", desc: "Saat seçici. Zaman bilgisi toplamak için kullanılır." },
  { icon: Upload, name: "Dosya Yükleme", desc: "Dosya yükletme alanı. Dosya türü ve boyut kısıtlaması ayarlanabilir." },
  { icon: Link2, name: "Link", desc: "URL girişi. Tekli veya çoklu link kabul edebilir." },
  { icon: SlidersHorizontal, name: "Kaydırıcı", desc: "Sayısal aralık seçici. Min, max ve adım değerleri ayarlanır." },
  { icon: Table, name: "Matris / Tablo", desc: "Satır ve sütunlardan oluşan grid yapı. Anket tarzı sorular için uygundur." },
];

function SectionCard({ id, title, icon: Icon, children }) {
  return (
    <section id={id} className="scroll-mt-6">
      <div className="rounded-xl border border-white/10 bg-white/2 p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 border border-indigo-400/20">
            <Icon className="h-5 w-5 text-indigo-400" strokeWidth={1.75} />
          </div>
          <h2 className="text-lg font-semibold text-neutral-100">{title}</h2>
        </div>
        <div className="space-y-3 text-sm text-neutral-300 leading-relaxed">
          {children}
        </div>
      </div>
    </section>
  );
}

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
    <ul className="space-y-1.5 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-neutral-500" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function SettingRow({ icon: Icon, name, description, color = "indigo" }) {
  const colors = {
    indigo: "bg-indigo-500/10 border-indigo-400/20 text-indigo-400",
    violet: "bg-violet-500/10 border-violet-400/20 text-violet-400",
  };

  return (
    <div className="flex gap-3 rounded-lg border border-white/5 bg-white/2 px-3 py-3">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md border ${colors[color]}`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-neutral-200">{name}</p>
        <p className="mt-0.5 text-xs text-neutral-400">{description}</p>
      </div>
    </div>
  );
}

export default function HowToUsePage() {
  const [activeSection, setActiveSection] = useState(sections[0].id);
  const scrollRef = useRef(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      let current = sections[0].id;

      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (el) {
          const offset = el.offsetTop - container.offsetTop - 32;
          if (scrollTop >= offset) current = section.id;
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
      <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.05 }}
        className="hidden lg:flex w-52 shrink-0 flex-col border-r border-white/6 px-4 py-5"
      >
        <p className="mb-3 px-2 text-[10px] font-semibold text-neutral-500 tracking-[0.15em] uppercase">İçindekiler</p>
        <div className="space-y-0.5">
          {sections.map((s, i) => (
            <button key={s.id} onClick={() => scrollToSection(s.id)}
              className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                activeSection === s.id ? "bg-indigo-500/10 text-indigo-300 font-medium" : "text-neutral-500 hover:text-neutral-300 hover:bg-white/4"}`}
            >
              <span className="text-[10px] text-neutral-600 w-4 text-right tabular-nums">{i + 1}</span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </motion.nav>

      <motion.div ref={scrollRef} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, delay: 0.1 }} className="flex-1 overflow-y-auto scrollbar">
        <div className="mx-auto max-w-3xl space-y-5 px-6 py-5 pb-16">

            <SectionCard id="form-olusturma" title="Form Oluşturma" icon={FilePlus}>
              <p>Yeni bir form oluşturmak için Formlar &gt; <strong className="text-neutral-100">Yeni Form</strong> seçeneğine tıklayın. Karşınıza çıkan alanda formunuza bir başlık verin ve düzenlemeye başlayın.</p>
              <BulletList items={[
                "Yan menüden Formlar > \"Yeni Form\" seçeneğine tıklayın.",
                "Form başlığını girin.",
                "Bileşen kütüphanesindeki onaylama butonuna tıklayarak formu oluşturun.",
                "Form oluşturulduktan sonra otomatik olarak düzenleme sayfasına yönlendirilirsiniz.",
              ]} />

            </SectionCard>

            <SectionCard id="form-duzenleme" title="Form Düzenleme" icon={GripVertical}>
              <p>Form düzenleme sayfasında sağ taraftaki bileşen kütüphanesinden soruları <strong className="text-neutral-100">sürükle-bırak</strong> ile form alanına ekleyebilirsiniz.</p>
              <BulletList items={[
                "Sağ paneldeki bileşen kütüphanesinden istediğiniz soru türünü form alanına sürükleyin.",
                "Eklenen soruları sürükleyerek sıralarını değiştirin.",
                "Bir soruyu silmek için sürükleyip çöp kutusu alanına bırakın.",
                "Bir soruya tıklayarak başlık, açıklama ve zorunluluk gibi ayarlarını düzenleyin.",
                "Mobilde bileşen paneli çekmece olarak sağ taraftan açılır.",
                "Değişikliklerinizi kaydetmek için sağ üstteki \"Onaylama\" butonuna tıklayın.",
              ]} />
              <Tip>Sağ üstte bulunan göz butonuna basarak formunuzun önizlemesini görebilirsiniz.</Tip>

            </SectionCard>

            <SectionCard id="bilesen-turleri" title="Bileşen Türleri" icon={ListChecks}>
              <p>Form düzenleyicisinde kullanabileceğiniz <strong className="text-neutral-100">11 farklı bileşen türü</strong> bulunmaktadır:</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {componentTypes.map((comp) => (
                  <div key={comp.name} className="flex gap-3 rounded-lg border border-white/5 bg-white/2 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-violet-500/10 border border-violet-400/20">
                      <comp.icon className="h-4 w-4 text-violet-400" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-neutral-200">{comp.name}</p>
                      <p className="mt-0.5 text-[11px] text-neutral-500 leading-relaxed">{comp.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard id="kosullama" title="Koşullama (Koşullu Sorular)" icon={GitBranch}>
              <p>Bir sorunun yalnızca belirli bir koşul sağlandığında görünmesini sağlayabilirsiniz. Örneğin, <em>&quot;Evet&quot;</em> yanıtı verildiğinde ek bir soru gösterilebilir.</p>

              <p className="font-medium text-neutral-200">Nasıl eklenir?</p>
              <BulletList items={[
                "Koşul eklemek istediğiniz soruyu seçin.",
                "\"Koşul Ekle\" butonuna tıklayın.",
                "Hangi sorunun cevabına bağlı olacağını seçin (yalnızca önceki sorular seçilebilir).",
                "Operatörü seçin (eşittir, içerir, büyüktür vb.).",
                "Beklenen değeri girin.",
              ]} />

              <p className="font-medium text-neutral-200">Soru türüne göre kullanılabilecek operatörler:</p>
              <div className="space-y-1.5">
                <div className="rounded-lg border border-white/5 bg-white/2 px-3 py-2">
                  <p className="text-xs"><span className="font-medium text-neutral-200">Metin:</span> <span className="text-neutral-400">Eşittir, Eşit Değildir, İçerir, Doldurulmuş mu</span></p>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/2 px-3 py-2">
                  <p className="text-xs"><span className="font-medium text-neutral-200">Sayı / Kaydırıcı:</span> <span className="text-neutral-400">Eşittir, Büyüktür, Küçüktür, Doldurulmuş mu</span></p>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/2 px-3 py-2">
                  <p className="text-xs"><span className="font-medium text-neutral-200">Tarih / Saat:</span> <span className="text-neutral-400">Eşittir, Önce, Sonra, Doldurulmuş mu</span></p>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/2 px-3 py-2">
                  <p className="text-xs"><span className="font-medium text-neutral-200">Açılır Liste / Çoklu Seçim:</span> <span className="text-neutral-400">Eşittir, Eşit Değildir, Doldurulmuş mu</span></p>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/2 px-3 py-2">
                  <p className="text-xs"><span className="font-medium text-neutral-200">Toggle:</span> <span className="text-neutral-400">Evet (True), Hayır (False)</span></p>
                </div>
                <div className="rounded-lg border border-white/5 bg-white/2 px-3 py-2">
                  <p className="text-xs"><span className="font-medium text-neutral-200">Dosya Yükleme / Matris:</span> <span className="text-neutral-400">Doldurulmuş mu, Boş mu</span></p>
                </div>
              </div>

              <Tip>İlk soruya koşul eklenemez çünkü bağımlı olacağı önceki bir soru yoktur.</Tip>

            </SectionCard>

            <SectionCard id="form-ayarlari" title="Form Ayarları" icon={Settings}>
              <p>Form düzenleyicisinin sağ panelindeki <strong className="text-neutral-100">Ayarlar</strong> sekmesinden formunuzun davranışını kontrol edebilirsiniz.</p>

              <div className="space-y-2">
                <SettingRow icon={Eye} name="Form Durumu (Yayında / Duraklatıldı)" color="violet"
                  description="Yayında: Form yanıt kabul eder. Duraklatıldı: Form görüntülenebilir ama yanıt gönderilemez."
                />
                <SettingRow icon={EyeOff} name="Anonim Yanıtlar" color="violet"
                  description="Açıldığında kullanıcılar giriş yapmadan form doldurabilir. Dikkat: Bu ayar açıldığında çoklu yanıtlar otomatik aktif olur, bağlı form kaldırılır ve manuel inceleme devre dışı kalır."
                />
                <SettingRow icon={Users} name="Çoklu Yanıtlar" color="violet"
                  description="Aynı kullanıcının birden fazla yanıt göndermesine izin verir. Anonim yanıtlar açıkken otomatik aktiftir."
                />
                <SettingRow icon={ShieldCheck} name="Manuel İnceleme" color="violet"
                  description="Gelen yanıtlar otomatik kabul edilmez; bir editör tarafından onaylanması veya reddedilmesi gerekir."
                />
              </div>

              <Warning>Anonim yanıtları açmak birden fazla ayarı etkiler. Bağlı formunuz varsa kaldırılır ve manuel inceleme devre dışı kalır.</Warning>

            </SectionCard>

            <SectionCard id="form-baglama" title="Form Bağlama" icon={ArrowRightLeft}>
              <p>Bir formu başka bir formla <strong className="text-neutral-100">zincirleyerek</strong> kullanıcıların ilk formu tamamladıktan sonra otomatik olarak ikinci forma yönlendirilmesini sağlayabilirsiniz.</p>

              <p className="font-medium text-neutral-200">Bağlama süreci (Formun sahibi iseniz):</p>
              <BulletList items={[
                "Ayarlar panelindeki \"Bağlı Form\" bölümüne gidin.",
                "Arama alanından hedef formu bulun ve seçin.",
                "Onay ekranında bağlantı detaylarını inceleyin.",
                "Onaylayarak bağlantıyı kurun.",
              ]} />

              <p className="font-medium text-neutral-200">Bağlantı sonrası ne olur?</p>
              <BulletList items={[
                "Ana formun ayarları ve editörleri bağlı forma senkronize edilir.",
                "Kullanıcı ana formu tamamlayıp yanıtı onaylandığında otomatik olarak bağlı forma yönlendirilir.",
                "Bağlı formun ayarları kilitlenir ve \"Ayarlar ana form tarafından yönetiliyor\" mesajı gösterilir.",
                "Bağlantı daha sonra değiştirilebilir veya kaldırılabilir.",
              ]} />

              <Warning>Bir formu başka forma bağlamak için iki formun da sahibi olmanız gerekir. Editörler bu zinciri bozamaz. Anonim yanıtlar açıkken form bağlama kullanılamaz.</Warning>

            </SectionCard>

            <SectionCard id="editor-isbirligi" title="Editör ve İşbirliği" icon={UserPlus}>
              <p>Formunuza başka kullanıcıları <strong className="text-neutral-100">editör</strong> veya <strong className="text-neutral-100">görüntüleyici</strong> olarak ekleyerek birlikte çalışabilirsiniz.</p>

              <p className="font-medium text-neutral-200">Roller ve yetkileri:</p>
              <div className="space-y-2">
                <SettingRow icon={ShieldCheck} name="Sahip (Owner)" color="violet"
                  description="Tam kontrol. Formu silebilir, tüm ayarları değiştirebilir. Her formun yalnızca bir sahibi vardır ve kaldırılamaz."
                />
                <SettingRow icon={Users} name="Editör (Editor)" color="violet"
                  description="Formu ve ayarlarını düzenleyebilir. Görüntüleyici ekleyip kaldırabilir. Formu silemez."
                />
                <SettingRow icon={Eye} name="Görüntüleyici (Viewer)" color="violet"
                  description="Formu ve yanıtları yalnızca görüntüleyebilir. Düzenleme yapamaz."
                />
              </div>

              <p className="font-medium text-neutral-200">Kullanıcı ekleme:</p>
              <BulletList items={[
                "Ayarlar panelindeki \"Editörler\" sekmesine gidin.",
                "En az 2 karakter yazarak kullanıcıları e-posta ile arayın.",
                "Kullanıcıyı seçip rolünü belirleyin.",
                "Eklenen kullanıcıların rollerini daha sonra değiştirebilirsiniz.",
              ]} />

            </SectionCard>

            <SectionCard id="yanitlari-goruntuleme" title="Yanıtları Görüntüleme" icon={MessageSquare}>
              <p>Form yanıtlarını görüntülemek için formun <strong className="text-neutral-100">Cevaplar</strong> sayfasına gidin. Sol panelde yanıt listesi, sağ panelde seçili yanıtın detayları gösterilir.</p>

              <BulletList items={[
                "Her yanıt için gönderim tarihi, form üzerinde harcanan süre ve yanıt durumu görüntülenir.",
                "Yanıtı gönderen kullanıcının adı, e-postası ve profil fotoğrafı gösterilir (anonim değilse).",
                "Bağlı formlar arasındaki yanıtlar arasında ok butonları ile geçiş yapabilirsiniz (ana yanıt ↔ bağlı yanıt).",
                "Mobilde yanıt detayları çekmece olarak sağ taraftan açılır.",
              ]} />

            </SectionCard>

            <SectionCard id="yanit-onaylama" title="Yanıt Onaylama / Reddetme" icon={CheckCircle}>
              <p><strong className="text-neutral-100">Manuel İnceleme</strong> ayarı açık olan formlarda gelen yanıtlar otomatik kabul edilmez; bir editör tarafından incelenmesi gerekir.</p>

              <p className="font-medium text-neutral-200">Yanıt durumları:</p>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                  <CircleDot className="h-4 w-4 text-amber-400" strokeWidth={1.75} />
                  <span className="text-xs text-amber-200">Bekliyor — Henüz incelenmemiş</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400" strokeWidth={1.75} />
                  <span className="text-xs text-emerald-200">Onaylandı — İnceleme sonucu kabul edildi</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
                  <XCircle className="h-4 w-4 text-red-400" strokeWidth={1.75} />
                  <span className="text-xs text-red-200">Reddedildi — İnceleme sonucu reddedildi</span>
                </div>
              </div>

              <p className="font-medium text-neutral-200">Onaylama süreci:</p>
              <BulletList items={[
                "Yanıt detaylarında \"Onayla\" (yeşil) veya \"Reddet\" (kırmızı) butonuna tıklayın.",
                "İsteğe bağlı olarak bir açıklama notu ekleyin.",
                "Kararınızı gönderin. İncelemeyi yapan kişi, tarih ve not kaydedilir.",
                "Kararı daha sonra düzenleyebilirsiniz (arşivlenmemiş yanıtlarda).",
              ]} />

              <Tip>Bağlı form varsa, onaylanan yanıtın kullanıcısı otomatik olarak bağlı forma yönlendirilir.</Tip>

            </SectionCard>

            <SectionCard id="arsivleme" title="Arşivleme" icon={Archive}>
              <p>Artık aktif olmayan yanıtları <strong className="text-neutral-100">arşivleyerek</strong> listeden gizleyebilirsiniz. Arşivleme kalıcı silme değildir; arşivlenen yanıtlar filtreleme ile tekrar görüntülenebilir.</p>

              <BulletList items={[
                "Yanıt detaylarındaki arşiv ikonuna tıklayarak yanıtı arşivleyin.",
                "Arşivleyen kişi ve tarih bilgisi kaydedilir.",
                "Arşivlenmiş yanıtlar varsayılan olarak listede gizlenir.",
                "Yanıt filtresindeki \"Arşivlenenleri Göster\" butonu ile arşivlenmiş yanıtları görüntüleyebilirsiniz.",
              ]} />
              <Tip>Birden fazla yanıt seçeneği açık ise bir cevabı arşivlemeniz o kullanıcının tekrar cevap verebilmesini sağlar.</Tip>

            </SectionCard>

            <SectionCard id="filtreleme" title="Formları Filtreleme" icon={Filter}>
              <p>Form listesinde çeşitli filtreler kullanarak aradığınız formu hızlıca bulabilirsiniz.</p>

              <p className="font-medium text-neutral-200">Kullanılabilir filtreler:</p>
              <BulletList items={[
                "Başlığa göre arama yapabilirsiniz.",
                "Tarih sıralaması: Yeniden eskiye veya eskiden yeniye.",
                "Rol filtresi: Tümü, Sahip, Editör veya Görüntüleyici.",
              ]} />

              <p className="font-medium text-neutral-200">Üç durumlu özellik filtreleri:</p>
              <p>Aşağıdaki filtreler üç durumlu çalışır: <span className="text-neutral-400">Hepsi (nötr)</span> → <span className="text-indigo-300">Sadece açık olanlar</span> → <span className="text-red-300">Sadece kapalı olanlar</span></p>
              <BulletList items={[
                "Anonim yanıtlar",
                "Çoklu yanıtlar",
                "Bağlı form",
                "Manuel inceleme",
              ]} />

              <p className="font-medium text-neutral-200">Yanıt filtreleri:</p>
              <BulletList items={[
                "Durum filtresi: Tümü, Bekliyor, Onaylanmış, Reddedilmiş.",
                "Yanıtlayan türü: Tümü, Anonim, Kayıtlı.",
                "Arşiv durumu: Arşivlenenleri dahil et veya etme.",
              ]} />
            </SectionCard>

          </div>
        </motion.div>
      </div>
  );
}