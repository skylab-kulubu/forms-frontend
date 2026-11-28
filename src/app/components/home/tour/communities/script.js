import { AHMET as AHMET_USER, ME as ME_USER, SELIN as SELIN_USER } from "@/lib/demo/server/people";
import { TEAMS } from "@/lib/demo/server/communities/seed";
import { INTRO } from "./intro";

export { TEAMS };

export const T = {
  open: 0,
  build: 0.9,
  team: 3.9,
  talk: 5.3,
  theme: 6.4,
  live: 7.2,
  fill: 7.8,
  review: 9.5,
  stats: 10.8,
  flow: 12.0,
  end: 13.2,
  total: 13.9,
};

export const SPAN = {
  open: 0.9,
  build: 2.1,
  team: 0.95,
  talk: 0.75,
  theme: 0.55,
  live: 0.45,
  fill: 1.4,
  review: 1.15,
  stats: 1,
  flow: 1.2,
  end: 0.7,
};

const B = T.build;
const TM = T.team;
const K = T.talk;
const TH = T.theme;
const L = T.live;

export const BEAT = {
  title: [B + 0.26, B + 0.52],
  desc: [B + 0.56, B + 0.72],
  q1: { open: B + 0.86, pick: B + 1.0, type: [B + 1.03, B + 1.25], kind: B + 1.36, must: B + 1.46 },
  q2: { open: B + 1.6, pick: B + 1.72, type: [B + 1.75, B + 1.93], kind: B + 2.02, must: B + 2.1 },
  tpl: { open: B + 2.24, list: B + 2.36, pick: B + 2.5 },
  cond: B + 2.74,
  selin: TM + 0.06,
  ahmet: TM + 0.14,
  q3: { at: TM + 0.18, type: [TM + 0.2, TM + 0.4], kind: TM + 0.43, must: TM + 0.46, away: TM + 0.52 },
  q4: { at: TM + 0.34, type: [TM + 0.36, TM + 0.66], must: TM + 0.69, away: TM + 0.76 },
  q12: { at: TM + 0.72, type: [TM + 0.74, TM + 0.86], kind: TM + 0.89, away: TM + 0.96 },
  q13: { at: TM + 0.84, type: [TM + 0.86, TM + 1.1], must: TM + 1.13, away: TM + 1.2 },
  q15: { open: TM + 0.94, pick: TM + 1.04, type: [TM + 1.07, TM + 1.25], kind: TM + 1.28, must: TM + 1.31 },
  note: K + 0.16,
  board: K + 0.3,
  reply: [K + 0.34, K + 0.52],
  sent: K + 0.55,
  solved: K + 0.63,
  boardOff: K + 0.72,
  c4: { add: K + 0.88, type: [K + 0.9, K + 0.95] },
  c5: { add: K + 0.98, type: [K + 1.0, K + 1.05] },
  theme: { open: TH + 0.16, pick: TH + 0.28, reopen: TH + 0.54, back: TH + 0.64 },
  accept: L + 0.2,
  save: L + 0.34,
};

export const CAPTIONS = [
  {
    at: T.open, label: "SKY LAB Forms", ...INTRO,
  },
  {
    at: T.build, label: "Form editörü", title: "Formu kurun",
    text: "Soruları alttaki Ekle menüsünden eklersiniz, bir soruya tıklayınca ayarları sağdaki panelde açılır.",
    compactText: "Soruları alttaki Ekle menüsünden eklersiniz, bir soruya tıklayınca ayarları Ayarlar bölümünde açılır.",
    notes: [
      { at: BEAT.tpl.open, text: "Ekip başvurusu şablonundan yedi bileşen birden eklenir" },
      { at: BEAT.cond - 0.1, text: "GitHub sorusu yalnız WEBLAB seçilirse açılır" },
    ],
  },
  {
    at: T.team, label: "Birlikte düzenleme", title: "Ekipçe düzenleyin",
    text: "Selin ve Ahmet formu sizinle aynı anda düzenliyor. Yorumlar ilgili sorunun yanında durur, çözülünce kapanır.",
  },
  {
    at: T.theme, label: "Yayınlama", title: "Kaydedin, form yayında",
    text: "Form seçtiğiniz temayla açılır, topluluğunuz için de tema ekleyebiliriz. Kaydedince yayına girer.",
    notes: [
      { at: BEAT.theme.open, text: "Örnekte ARTLAB teması deneniyor" },
      { at: BEAT.accept - 0.04, text: "Cevap kabulü açılıp kaydedilir" },
    ],
  },
  {
    at: T.fill, label: "Form sayfası", title: "Başvuran doldurur",
    text: "Ege'nin adı ve e-postası hesabından gelir. Gönderince başvurusunun hangi adımda olduğunu görür.",
  },
  {
    at: T.review, label: "Cevaplar", title: "Cevabı değerlendirin",
    text: "Başvuru WEBLAB'in listesine düşer. Onaylayınca sıradaki adıma geçer ve Ege'ye e-posta gider.",
  },
  {
    at: T.stats, label: "Analitik", title: "Cevapları sayılarla okuyun",
    text: "Bir cevaba tıklarsanız diğer sorular yalnız o cevabı verenlere göre hesaplanır.",
  },
  {
    at: T.flow, label: "Akışlar", title: "Adımları birbirine bağlayın",
    text: "Onaylanan başvuru sıradaki forma geçer. Kimin hangi adımda beklediğini akış sayfasında görürsünüz.",
    fillText: "Kış kampı başvurusu üç adımdan oluşuyor. Haritada bir adıma tıklayınca formu açılır.",
  },
  {
    at: T.end, label: "SKY LAB Forms", title: "Kendi formunuzu kurun",
    text: "SKY LAB ekipleri panele kendi hesaplarıyla girer. Başka bir topluluk ya da kulüpseniz erişim isteyin, sizin için alan açalım.",
    actions: [{ label: "Giriş yapın", href: "/admin" }, { label: "Erişim isteyin", section: "access", quiet: true }],
  },
];

export const TITLE = "Kış Kampı 2026 Başvurusu";
export const DESCRIPTION = "SKY LAB ekiplerinin 2-6 Şubat'taki kış kampı için başvuru formu.";


export const Q = {
  f1: { id: "f1", type: "short_text", props: { question: "Adınız ve soyadınız", description: "", required: true, inputType: "name" } },
  f2: { id: "f2", type: "short_text", props: { question: "E-posta adresiniz", description: "", required: true, inputType: "email" } },
  f3: { id: "f3", type: "short_text", props: { question: "Yaşınız", description: "", required: true, inputType: "number" } },
  f4: { id: "f4", type: "long_text", props: { question: "Neden bu kampa katılmak istiyorsunuz?", description: "", required: true } },
  f5: { id: "f5", type: "combobox", props: { question: "Hangi ekibe başvuruyorsunuz?", description: "Her ekip kamp boyunca kendi projesini yürütür.", required: true, allowCustom: false, choices: TEAMS, preset: null } },
  f6: { id: "f6", type: "separator", props: { title: "Ekibe özel sorular", description: "Seçtiğiniz ekibe göre değişir." } },
  f7: { id: "f7", type: "short_text", props: { question: "GitHub profiliniz", description: "", required: true, inputType: "link", allowMultiple: false }, condition: { fieldId: "f5", operator: "equals", value: "WEBLAB" } },
  f8: { id: "f8", type: "long_text", props: { question: "Katıldığınız CTF'ler", description: "", required: false }, condition: { fieldId: "f5", operator: "equals", value: "SKYSEC" } },
  f9: { id: "f9", type: "multi_choice", props: { question: "Hangi oyun motorlarıyla çalıştınız?", description: "", required: false, choices: ["Unity", "Unreal Engine", "Godot", "Hiçbiri"] }, condition: { fieldId: "f5", operator: "equals", value: "GAMELAB" } },
  f10: { id: "f10", type: "slider", props: { question: "Haftada kaç saat ayırabilirsiniz?", description: "", required: false, min: 2, max: 20, step: 1 } },
  f12: { id: "f12", type: "file", props: { question: "Özgeçmişiniz", description: "", required: false, acceptedFiles: ".pdf", maxSize: 5 } },
  f13: { id: "f13", type: "toggle", props: { question: "2-6 Şubat tarihlerinde kampa katılabilirim", description: "", required: true, trueLabel: "Evet", falseLabel: "Hayır" } },
  f15: { id: "f15", type: "slider", props: { question: "Kendinizi teknik olarak kaç puanla değerlendirirsiniz?", description: "", required: true, min: 1, max: 10, step: 1 } },
  f14: { id: "f14", type: "matrix", props: { question: "Teknolojilerdeki seviyeniz", description: "", required: false, rows: ["React", "Go"], columns: ["Yok", "Orta", "İyi"] } },
};

export const TEMPLATE_IDS = ["f5", "f6", "f7", "f8", "f9", "f10", "f14"];

export const SELIN = { key: "k-selin", userId: SELIN_USER.id, name: SELIN_USER.fullName };
export const AHMET = { key: "k-ahmet", userId: AHMET_USER.id, name: AHMET_USER.fullName };
export const ME = { id: ME_USER.id, fullName: ME_USER.fullName };

export const COMMENT = "AIRLAB ve ALGOLAB da bu dönem başvuru alıyor. Listeye ekleyelim mi?";
export const REPLY = "Haklısın, ikisini de ekliyorum.";
