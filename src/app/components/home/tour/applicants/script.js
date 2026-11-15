import { AYSE } from "@/lib/demo/server/people";
import { INTRO } from "./intro";

export const T = {
  open: 0,
  form: 0.9,
  send: 2.4,
  fix: 3.7,
  result: 5.1,
  task: 6.2,
  meet: 7.7,
  end: 9.1,
  total: 9.8,
};

const F = T.form;
const S = T.send;
const X = T.fix;
const R = T.result;
const K = T.task;
const G = T.meet;

export const BEAT = {
  team: F + 0.16,
  web: F + 0.28,
  projects: [F + 0.34, F + 0.62],
  github: [F + 0.66, F + 0.8],
  stack: [F + 0.86, F + 0.96],
  submit1: F + 1.2,
  mail1: { banner: S + 0.08, open: S + 0.3, read: [S + 0.42, S + 0.82], close: S + 0.96 },
  returned: X - 0.05,
  mail2: { banner: X + 0.04, open: X + 0.18, read: [X + 0.26, X + 0.34], cta: X + 0.42 },
  revise: X + 0.62,
  fixLink: [X + 0.72, X + 0.88],
  submit2: X + 1.1,
  approved1: R - 0.05,
  mail3: { banner: R + 0.04, open: R + 0.16, read: [R + 0.24, R + 0.34], cta: R + 0.48 },
  gate: K - 0.06,
  begin: K + 0.12,
  start: K + 0.24,
  repo: [K + 0.46, K + 0.6],
  summary: [K + 0.64, K + 0.9],
  submit3: K + 1.1,
  approved2: G - 0.05,
  mail4: { banner: G + 0.04, open: G + 0.16, read: [G + 0.24, G + 0.32], cta: G + 0.42 },
  slots: [G + 0.66, G + 0.78],
  place: G + 0.86,
  submit4: G + 1.05,
};

export const PERSON = { name: AYSE.fullName, email: AYSE.email, first: AYSE.firstName };

export const TEXT = {
  projects: "Kulübün etkinlik sitesinin arayüzünü React ile yaptım. Bir de ders notlarını paylaştığımız küçük bir Next.js uygulaması var.",
  githubWrong: "https://github.com/ayse-yilmaz",
  github: "https://github.com/ayseyilmaz",
  repo: "https://github.com/ayseyilmaz/etkinlik-kayit",
  summary: "Formu ve kayıt listesini Next.js ile kurdum. Listeyi tarayıcıda saklıyorum, telefonda tek sütuna iniyor.",
};

export const CAPTIONS = [
  {
    at: T.open, label: "Tur", ...INTRO,
  },
  {
    at: F, label: "Başvuru formu", title: "Formu doldurun",
    text: "Afişteki QR formu açar. E-Skylab hesabıyla girdiğiniz için adınız ve e-postanız hazır gelir. Ayşe web deneyimi olduğunu işaretleyince proje ve GitHub soruları açılıyor.",
    compactText: "Afişteki QR formu açar. E-Skylab hesabıyla girdiğiniz için adınız ve e-postanız hazır gelir.",
    notes: [
      { at: F + 0.02, text: "Ad ve e-posta hesaptan gelir" },
      { at: BEAT.web, text: "Cevaba göre yeni sorular açılır" },
      { at: BEAT.submit1 - 0.16, text: "Gönderince ne olacağı formun sonunda yazar" },
    ],
  },
  {
    at: S, label: "Gönderim", title: "Gönderin",
    text: "Gönderince sayfa başvurunun adımlarını gösterir. Cevaplarınızın bir kopyası da hemen e-postanıza gelir.",
    notes: [
      { at: S - 0.1, text: "Durum sayfasında sıradaki adımlar" },
      { at: BEAT.mail1.banner, text: "\"Cevabınızı aldık\" e-postası" },
    ],
  },
  {
    at: X, label: "Düzeltme", title: "Düzeltme istenirse",
    text: "Ekip bir cevabı eksik bulursa notuyla birlikte düzeltme isteyebilir. Ayşe'nin GitHub bağlantısı açılmıyor. E-postadaki bağlantı formu önceki cevaplarla açar, Ayşe yalnız işaretli soruyu değiştirip yeniden gönderir.",
    compactText: "Ekip bir cevabı eksik bulursa notuyla birlikte düzeltme isteyebilir. Form önceki cevaplarla açılır, yalnız işaretli soru değişir.",
    notes: [
      { at: BEAT.mail2.banner, text: "Ekibin notu e-postada" },
      { at: BEAT.revise, text: "İşaretli soru formda vurgulu" },
      { at: BEAT.submit2, text: "Yeniden gönderilir" },
    ],
  },
  {
    at: R, label: "Sonuç", title: "Sonuç e-postayla gelir",
    text: "Ekip onaylayınca notuyla birlikte bir e-posta gelir. \"Sonraki adıma geç\" bağlantısı kod ödevini açar.",
  },
  {
    at: K, label: "Kod ödevi", title: "Kod ödevini başlatın",
    text: "Ödev için 48 saat var. Süre Ayşe \"Görevi başlat\"a bastığı an işlemeye başlar ve sunucuda tutulur, sekmeyi kapatsa da devam eder. Görev metni ve teslim soruları da o zaman açılır.",
    compactText: "Ödev için 48 saat var. Süre \"Görevi başlat\"a basınca işlemeye başlar, görev metni de o zaman açılır.",
    notes: [
      { at: BEAT.begin, text: "Başlatmadan önce süre ve bitiş saati" },
      { at: BEAT.start + 0.04, text: "Kalan süre sayfanın üstünde" },
      { at: BEAT.submit3, text: "Teslim ekibe gider" },
    ],
  },
  {
    at: G, label: "Görüşme", title: "Görüşme adımı açılır",
    text: "Ödev onaylanınca son adım açılır. Ayşe görüşme için uygun saatlerini seçip gönderir, sonucu yine e-postayla öğrenecek.",
  },
  {
    at: T.end, label: "İlgi alanları", title: "Neyle ilgileniyorsunuz?",
    text: "Açılan pozisyonlardan haberdar edebilmemiz için aşağıdaki formu doldurabilirsiniz. İlginize göre başvuru açan ekip size e-postayla haber verecektir.",
    actions: [{ label: "Formu doldurun", section: "interest" }, { label: "Turu baştan izleyin", restart: true, quiet: true }],
  },
];
