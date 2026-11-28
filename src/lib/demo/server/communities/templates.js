import { DEPARTMENTS } from "@/data/presets/departments";
import { SELIN } from "../people";
import { TEAMS } from "./seed";

export const TEMPLATE_IDS = {
  identity: "1f3a7c52-8e4d-4b19-a6c0-5d2e9f7b3a10",
  student: "6b2d9e14-3c7a-4f58-b1e6-8a4c0d7f2e93",
  team: "4e8a1c2d-7f3b-4a96-8d15-2b6e9f0c7a41",
  feedback: "a93f5e07-1d6c-4b82-9e3a-7c1f4d8b2a65",
  projects: "c7104d3e-9a2b-4e6f-8b71-3f5a6c9e0d28",
  shared: "e25c8b91-4f0a-4d37-a2c6-9b1e7d3f5c04",
};

export const SHARE_TOKEN = "paylasim-demo";

const BASE = "/api/admin/forms/component-groups";

const SEED = [
  {
    id: TEMPLATE_IDS.team, title: "Ekip başvurusu", description: "Kamp ve dönem başı başvurularında kullanılan ekip soruları.",
    schema: [
      { id: "t1", type: "combobox", props: { question: "Hangi ekibe başvuruyorsunuz?", description: "Her ekip kamp boyunca kendi projesini yürütür.", required: true, allowCustom: false, choices: TEAMS.slice(0, 3), preset: null } },
      { id: "t2", type: "separator", props: { title: "Ekibe özel sorular", description: "Seçtiğiniz ekibe göre değişir." } },
      { id: "t3", type: "short_text", props: { question: "GitHub profiliniz", description: "", required: true, inputType: "link", allowMultiple: false }, condition: { fieldId: "t1", operator: "equals", value: "WEBLAB" } },
      { id: "t4", type: "long_text", props: { question: "Katıldığınız CTF'ler", description: "", required: false }, condition: { fieldId: "t1", operator: "equals", value: "SKYSEC" } },
      { id: "t5", type: "multi_choice", props: { question: "Hangi oyun motorlarıyla çalıştınız?", description: "", required: false, choices: ["Unity", "Unreal Engine", "Godot", "Hiçbiri"] }, condition: { fieldId: "t1", operator: "equals", value: "GAMELAB" } },
      { id: "t7", type: "slider", props: { question: "Haftada kaç saat ayırabilirsiniz?", description: "", required: false, min: 2, max: 20, step: 1 } },
      { id: "t8", type: "matrix", props: { question: "Teknolojilerdeki seviyeniz", description: "", required: false, rows: ["React", "Go"], columns: ["Yok", "Orta", "İyi"] } },
    ],
  },
  {
    id: TEMPLATE_IDS.identity, title: "Kimlik bilgileri", description: "Çoğu formun başında kullanılan iletişim soruları.",
    schema: [
      { id: "i1", type: "short_text", props: { question: "Adınız ve soyadınız", description: "", required: true, inputType: "name" } },
      { id: "i2", type: "short_text", props: { question: "E-posta adresiniz", description: "", required: true, inputType: "email" } },
      { id: "i3", type: "short_text", props: { question: "Telefon numaranız", description: "", required: false, inputType: "phone" } },
    ],
  },
  {
    id: TEMPLATE_IDS.student, title: "Öğrenci bilgileri", description: "Bölüm, sınıf ve öğrenci numarası.",
    schema: [
      { id: "s1", type: "combobox", props: { question: "Bölümünüz", description: "", required: true, allowCustom: false, choices: DEPARTMENTS, preset: "departments" } },
      { id: "s2", type: "combobox", props: { question: "Sınıfınız", description: "", required: true, allowCustom: false, choices: ["Hazırlık", "1. sınıf", "2. sınıf", "3. sınıf", "4. sınıf", "Yüksek lisans", "Doktora"], preset: null } },
      { id: "s3", type: "short_text", props: { question: "Öğrenci numaranız", description: "", required: true, inputType: "number" } },
    ],
  },
  {
    id: TEMPLATE_IDS.feedback, title: "Etkinlik geri bildirimi", description: "Etkinlik sonrası kısa memnuniyet soruları.",
    schema: [
      { id: "f1", type: "slider", props: { question: "Etkinliği nasıl buldunuz?", description: "1 en düşük, 10 en yüksek puan.", required: true, min: 1, max: 10, step: 1 } },
      { id: "f2", type: "long_text", props: { question: "En çok neyi beğendiniz?", description: "", required: false } },
      { id: "f3", type: "long_text", props: { question: "Önerileriniz", description: "", required: false } },
    ],
  },
  {
    id: TEMPLATE_IDS.projects, title: "Önceki projeler", description: "",
    schema: [
      {
        id: "p1", type: "repeater", props: {
          question: "Üzerinde çalıştığınız projeler", description: "", required: false, addLabel: "Proje ekle",
          fields: [
            { id: "p1a", type: "short_text", props: { question: "Proje adı", description: "", required: true, inputType: "text" } },
            { id: "p1b", type: "short_text", props: { question: "Bağlantı", description: "", required: false, inputType: "link", allowMultiple: false } },
          ],
        },
      },
    ],
  },
];

const SELIN_SHARED = {
  id: TEMPLATE_IDS.shared, title: "Atölye yoklaması", description: "Atölye girişinde kullandığımız kısa form soruları.",
  schema: [
    { id: "a1", type: "short_text", props: { question: "Adınız ve soyadınız", description: "", required: true, inputType: "name" } },
    { id: "a2", type: "toggle", props: { question: "Bilgisayarınızı getirdiniz mi?", description: "", required: true, trueLabel: "Evet", falseLabel: "Hayır" } },
    { id: "a3", type: "combobox", props: { question: "Daha önce atölyemize katıldınız mı?", description: "", required: false, allowCustom: false, choices: ["Hayır, ilk kez", "Bir kez", "Birkaç kez"], preset: null } },
  ],
};

const contract = (group, sharedBy = null) => ({ id: group.id, title: group.title, description: group.description ?? "", schema: group.schema, sharedBy });

export function createTemplates() {
  const own = new Map(SEED.map((group) => [group.id, structuredClone(group)]));
  let created = 0;
  const newId = () => `5d0c4e1a-0000-4000-8000-${String(++created).padStart(12, "0")}`;

  function route(method, pathname, params, body) {
    if (!pathname.startsWith(BASE)) return null;
    const rest = pathname.slice(BASE.length).split("/").filter(Boolean);
    const [id, action] = rest;

    if (rest.length === 0 && method === "GET") {
      const search = (params.get("Search") ?? "").trim().toLocaleLowerCase("tr-TR");
      const items = [...own.values()].filter((group) => !search || group.title.toLocaleLowerCase("tr-TR").includes(search)).map((group) => contract(group));
      const pageSize = Number(params.get("PageSize") ?? 20);
      return [200, { data: { items: items.slice(0, pageSize), totalCount: items.length, page: 1, pageSize, totalPages: 1 } }];
    }
    if (rest.length === 0 && method === "POST") {
      if (!body?.Title?.trim()) return [406, { message: "Şablon adı boş olamaz." }];
      const group = { id: newId(), title: body.Title, description: body.Description ?? "", schema: body.Schema ?? [] };
      own.set(group.id, group);
      return [201, { data: contract(group) }];
    }

    if (id === SELIN_SHARED.id) {
      if (params.get("token") !== SHARE_TOKEN) return [403, { message: "Yetkiniz yok." }];
      if (method === "GET" && !action) return [200, { data: contract(SELIN_SHARED, SELIN) }];
      if (method === "POST" && action === "clone") {
        const group = { id: newId(), title: SELIN_SHARED.title, description: SELIN_SHARED.description, schema: structuredClone(SELIN_SHARED.schema) };
        own.set(group.id, group);
        return [201, { data: contract(group) }];
      }
    }

    const group = own.get(id);
    if (!group) return [404, { message: "Şablon bulunamadı." }];
    if (method === "GET" && !action) return [200, { data: contract(group) }];
    if (method === "PUT" && !action) {
      if (!body?.Title?.trim()) return [406, { message: "Şablon adı boş olamaz." }];
      Object.assign(group, { title: body.Title, description: body.Description ?? "", schema: body.Schema ?? [] });
      return [200, { data: contract(group) }];
    }
    if (method === "DELETE" && !action) {
      own.delete(id);
      return [200, { data: true, message: "Şablon silindi." }];
    }
    if (method === "POST" && action === "share") return [200, { data: { token: SHARE_TOKEN, expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString() } }];
    if (method === "POST" && action === "transfer") return [200, { data: true }];
    return [404, { message: "Bulunamadı." }];
  }

  return { route };
}
