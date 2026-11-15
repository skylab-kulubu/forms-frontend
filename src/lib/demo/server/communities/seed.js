import { ME, SELIN, TEAM } from "../people";

export const IDS = {
  FB: "b1ld0000-0000-4000-8000-000000000001",
  F1: "3f6d2b8e-91c4-4a7e-b0d5-6e2a9c41f7b3",
  F2: "9a0c4e7d-2f61-4b8a-93de-5c17b0a6e284",
  F3: "c41e7a20-5b8d-4f3e-a9c6-1d2e8f7b0a35",
  F4: "d2e8a6c1-9f40-4a37-b5d2-7c1e9a03f6b8",
  F6: "a7c3e1d9-4b2f-4e8a-9c61-3f5d7e2b1a08",
  F7: "b8d4f2ea-5c30-4f9b-8d72-4a6e8f3c2b19",
  W1: "7b2e9c14-5a3d-4f81-b6e2-0c9d4a7f1e58",
};

export const TEAMS = ["WEBLAB", "SKYSEC", "GAMELAB", "AIRLAB", "ALGOLAB"];

export const now = () => new Date().toISOString();
export const ago = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

const owner = [{ user: ME, role: 3 }];

export function freshBuildForm(id = IDS.FB) {
  return {
    id, title: "", description: null, status: 1, brand: null,
    allowMultipleResponses: false, allowAnonymousResponses: false, requiresManualReview: true, task: null, closesAt: null, timeLimitMinutes: null,
    collaborators: TEAM, userRole: 3, createdAt: ago(3), updatedAt: ago(1), publishedVersion: 0, schema: [],
  };
}

export function seedForms() {
  const { F1, F2, F3, F4, F6, F7 } = IDS;
  return {
    [F1]: {
      id: F1, title: "Kış Kampı 2026 Başvurusu", description: "<p>SKY LAB ekiplerinin 2-6 Şubat'taki kış kampı için başvuru formu.</p>", status: 2,
      allowMultipleResponses: false, allowAnonymousResponses: false, requiresManualReview: true, task: null, closesAt: null, timeLimitMinutes: null,
      collaborators: TEAM, userRole: 3, createdAt: ago(36 * 1440), updatedAt: ago(60), demo: { closesAt: ago(-6 * 1440) },
      schema: [
        { id: "f1", type: "short_text", props: { question: "Adınız ve soyadınız", description: "", required: true, inputType: "name" } },
        { id: "f2", type: "short_text", props: { question: "E-posta adresiniz", description: "", required: true, inputType: "email" } },
        { id: "f3", type: "short_text", props: { question: "Yaşınız", description: "", required: true, inputType: "number" } },
        { id: "f4", type: "long_text", props: { question: "Neden bu kampa katılmak istiyorsunuz?", description: "", required: true } },
        { id: "f5", type: "combobox", props: { question: "Hangi ekibe başvuruyorsunuz?", description: "Her ekip kamp boyunca kendi projesini yürütür.", required: true, allowCustom: false, choices: TEAMS, preset: null } },
        { id: "f6", type: "separator", props: { title: "Ekibe özel sorular", description: "Seçtiğiniz ekibe göre değişir." } },
        { id: "f7", type: "short_text", props: { question: "GitHub profiliniz", description: "", required: true, inputType: "link", allowMultiple: false }, condition: { fieldId: "f5", operator: "equals", value: "WEBLAB" } },
        { id: "f8", type: "long_text", props: { question: "Katıldığınız CTF'ler", description: "", required: false }, condition: { fieldId: "f5", operator: "equals", value: "SKYSEC" } },
        { id: "f9", type: "multi_choice", props: { question: "Hangi oyun motorlarıyla çalıştınız?", description: "", required: false, choices: ["Unity", "Unreal Engine", "Godot", "Hiçbiri"] }, condition: { fieldId: "f5", operator: "equals", value: "GAMELAB" } },
        { id: "f10", type: "slider", props: { question: "Haftada kaç saat ayırabilirsiniz?", description: "", required: false, min: 2, max: 20, step: 1 } },
        { id: "f12", type: "file", props: { question: "Özgeçmişiniz", description: "", required: false, acceptedFiles: ".pdf", maxSize: 5 } },
        { id: "f13", type: "toggle", props: { question: "2-6 Şubat tarihlerinde kampa katılabilirim", description: "", required: true, trueLabel: "Evet", falseLabel: "Hayır" } },
        { id: "f14", type: "matrix", props: { question: "Teknolojilerdeki seviyeniz", description: "", required: false, rows: ["React", "Go"], columns: ["Yok", "Orta", "İyi"] } },
        { id: "f15", type: "slider", props: { question: "Kendinizi teknik olarak kaç puanla değerlendirirsiniz?", description: "", required: true, min: 1, max: 10, step: 1 } },
      ],
    },
    [F2]: {
      id: F2, title: "Kış Kampı Teknik Görev", description: "<p>Başvurunuz onaylandı. Bu adımda kısa bir görev çözeceksiniz.</p>", status: 2,
      allowMultipleResponses: false, allowAnonymousResponses: false, requiresManualReview: true,
      task: { content: "## Görev\n\nSeçtiğiniz bir açık veri setiyle küçük bir program yazın.\n\n1. Veriyi indirin.\n2. Bir soruyu yanıtlayın.", collapsible: true, downloadable: true },
      closesAt: null, timeLimitMinutes: 90, collaborators: TEAM, userRole: 3, createdAt: ago(8000), updatedAt: ago(200),
      schema: [
        { id: "g1", type: "short_text", props: { question: "Çözümünüzün bulunduğu depo", description: "", required: true, inputType: "link", allowMultiple: false } },
        { id: "g2", type: "long_text", props: { question: "Çözümünüzü kısaca anlatın", description: "", required: true } },
      ],
    },
    [F3]: {
      id: F3, title: "Kamp Katılım Onayı", description: "", status: 2, allowMultipleResponses: false, allowAnonymousResponses: false, requiresManualReview: false,
      task: null, closesAt: null, timeLimitMinutes: null, collaborators: TEAM, userRole: 3, createdAt: ago(7000), updatedAt: ago(300),
      schema: [
        { id: "k1", type: "toggle", props: { question: "Kampa katılımımı onaylıyorum", description: "", required: true, trueLabel: "Evet", falseLabel: "Hayır" } },
        { id: "k2", type: "combobox", props: { question: "Tişört bedeniniz", description: "", required: true, allowCustom: false, choices: ["XS", "S", "M", "L", "XL"], preset: null } },
      ],
    },
    [F4]: {
      id: F4, title: "WEBLAB Atölye Kaydı", description: "<p>12 Kasım Salı 18.00'de B-204'te.</p>", status: 2, allowMultipleResponses: false, allowAnonymousResponses: false, requiresManualReview: true,
      task: null, closesAt: null, timeLimitMinutes: null, collaborators: [{ user: SELIN, role: 3 }], userRole: 0, createdAt: ago(600), updatedAt: ago(30),
      schema: [
        { id: "w1", type: "short_text", props: { question: "Adınız ve soyadınız", description: "", required: true, inputType: "name" } },
        { id: "w3", type: "combobox", props: { question: "React deneyiminiz", description: "", required: true, allowCustom: false, choices: ["Hiç kullanmadım", "Biraz denedim", "Projede kullandım"], preset: null } },
      ],
    },
    [F6]: {
      id: F6, title: "Yaz Kampı Ön Kayıt", description: "<p>Takımınızı ve fikrinizi kısaca anlatın, değerlendirip size dönelim.</p>", status: 2,
      allowMultipleResponses: false, allowAnonymousResponses: false, requiresManualReview: true, task: null, closesAt: null, timeLimitMinutes: null,
      collaborators: owner, userRole: 3, createdAt: ago(3000), updatedAt: ago(90),
      schema: [
        { id: "h1", type: "short_text", props: { question: "Takımınızın adı", description: "", required: true } },
        { id: "h2", type: "short_text", props: { question: "Takım kaptanının e-postası", description: "", required: true, inputType: "email" } },
        { id: "h3", type: "long_text", props: { question: "Proje fikrinizi anlatın", description: "", required: true } },
      ],
    },
    [F7]: {
      id: F7, title: "Etkinlik Memnuniyet Anketi", description: "<p>Görüşleriniz anonim kalır.</p>", status: 2,
      allowMultipleResponses: true, allowAnonymousResponses: true, requiresManualReview: false, task: null, closesAt: null, timeLimitMinutes: null,
      collaborators: owner, userRole: 3, createdAt: ago(2000), updatedAt: ago(70),
      schema: [{ id: "m1", type: "long_text", props: { question: "Etkinlikte en çok neyi beğendiniz?", description: "", required: false } }],
    },
  };
}

export function seedWorkflow() {
  const { F1, F2, F3, W1 } = IDS;
  return {
    id: W1, name: "Kış Kampı 2026", description: "", status: 1, allowMultipleRuns: false, intake: 0, intakeClosesAt: null, owner: ME,
    createdAt: ago(9000), updatedAt: ago(45),
    published: {
      id: "v1", version: 3, status: 1, publishedAt: ago(14000),
      nodes: [
        { nodeKey: "basvuru", formId: F1, requiresManualReview: true, isStart: true, position: { x: 24, y: 172 } },
        { nodeKey: "gorev", formId: F2, requiresManualReview: true, isStart: false, position: { x: 354, y: 172 } },
        { nodeKey: "katilim", formId: F3, requiresManualReview: false, isStart: false, position: { x: 684, y: 172 } },
      ],
      transitions: [
        { sourceNodeKey: "basvuru", targetNodeKey: "gorev", trigger: 1, condition: null, priority: 0 },
        { sourceNodeKey: "gorev", targetNodeKey: "katilim", trigger: 1, condition: null, priority: 0 },
      ],
    },
    draft: null,
  };
}
