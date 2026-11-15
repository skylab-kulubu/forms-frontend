import { ME, SELIN, AHMET } from "../people";
import { IDS, ago } from "./seed";

const DELETED_USER = "00000000-0000-4000-8000-000000000000";

const person = (id, fullName, email) => ({ id, fullName, email, firstName: fullName.split(" ")[0], lastName: fullName.split(" ").slice(1).join(" "), profilePictureUrl: null });
const ZEYNEP = person("66666666-6666-4666-8666-666666666661", "ZEYNEP ARI", "zeynep.ari@example.com");
const KEREM = person("66666666-6666-4666-8666-666666666662", "KEREM YALIN", "kerem@example.com");
const TOPRAK = person("66666666-6666-4666-8666-666666666663", "DENİZ TOPRAK", "deniz.toprak@example.com");
const GONE = { id: DELETED_USER, fullName: null, email: null, firstName: null, lastName: null, profilePictureUrl: null };
const OWNERS = { ME, SELIN, AHMET, ZEYNEP, KEREM, TOPRAK, GONE };

const HACKATHON = { id: "8c1d2e3f-4a5b-4c6d-8e7f-9a0b1c2d3e4f", name: "Bahar Hackathonu" };
const MENTOR = { id: "9d2e3f4a-5b6c-4d7e-8f90-a1b2c3d4e5f6", name: "Mentorluk Programı" };

const LISTED = [
  ["Bahar Hackathonu Ön Kayıt", "AHMET", 2, 184, 31, 40, 900, { flow: HACKATHON, start: true }, { review: true }],
  ["Hackathon Takım Bildirimi", "AHMET", 2, 96, 12, 220, 1500, { flow: HACKATHON, start: false }, { review: true }],
  ["Mentorluk Programı Başvurusu", "ZEYNEP", 2, 72, 9, 95, 4100, { flow: MENTOR, start: true }, { review: true }],
  ["Mentor Eşleştirme Tercihleri", "ZEYNEP", 2, 41, 0, 300, 4300, { flow: MENTOR, start: false }, {}],
  ["Ekim Tanışma Toplantısı Geri Bildirimi", "ME", 1, 58, 0, 13000, 15000, null, { anonymous: true }],
  ["SKYSEC CTF Eğitimi Kaydı", "KEREM", 2, 127, 6, 180, 6000, null, { review: true }],
  ["GAMELAB Game Jam Kayıt", "TOPRAK", 2, 64, 14, 75, 2600, null, { review: true }],
  ["AIRLAB Drone Atölyesi", "GONE", 2, 37, 5, 2900, 21000, null, { review: true }],
  ["Kulüp Tişört Siparişi", "SELIN", 2, 212, 0, 25, 3300, null, { anonymous: true, multiple: true }],
  ["Yıl Sonu Etkinliği Anketi", "GONE", 1, 143, 0, 52000, 60000, null, { anonymous: true }],
  ["ALGOLAB Haftalık Problem Çözümü", "KEREM", 2, 318, 0, 12, 9000, null, { multiple: true }],
  ["Gönüllü Ekip Başvurusu", "AHMET", 2, 49, 11, 530, 7000, null, { review: true }],
  ["Sponsor İletişim Formu", "GONE", 2, 8, 2, 8800, 30000, null, { review: true }],
  ["Kariyer Günü Katılımcı Kaydı", "ZEYNEP", 2, 266, 0, 140, 5100, null, {}],
  ["Teknik Gezi Kayıt Formu", "TOPRAK", 1, 45, 0, 20000, 26000, null, { review: true }],
  ["Yeni Üye Bilgi Formu", "ME", 2, 391, 0, 33, 40000, null, {}],
  ["Bülten Aboneliği", "ME", 2, 506, 0, 8, 50000, null, { anonymous: true }],
  ["Etkinlik Fotoğraf İzni", "SELIN", 2, 88, 0, 700, 12000, null, {}],
  ["WEBLAB Proje Önerisi", "SELIN", 2, 23, 7, 1900, 8000, null, { review: true }],
  ["Seminer Konuşmacı Başvurusu", "ZEYNEP", 2, 14, 4, 3600, 10000, null, { review: true }],
  ["Robotik Yarışma Takım Kaydı", "TOPRAK", 2, 29, 3, 950, 4700, null, { review: true }],
  ["Kulüp Odası Rezervasyonu", "AHMET", 2, 402, 0, 18, 35000, null, { multiple: true }],
  ["Discord Rol Talebi", "GONE", 2, 167, 0, 4100, 33000, null, { anonymous: true, multiple: true }],
  ["Atölye Memnuniyet Anketi", "ME", 2, 77, 0, 2300, 3000, null, { anonymous: true }],
  ["Ders Notu Paylaşım Talebi", "KEREM", 0, 19, 0, 30000, 45000, null, {}],
  ["Eski Kayıt Formu (2025)", "GONE", 0, 233, 0, 200000, 260000, null, {}],
  ["Deneme formu", "ME", 0, 3, 0, 6000, 6100, null, {}],
];

const SAMPLE_NAMES = ["Ayşe Korkmaz", "İrem Toprak", "Kaan Polat", "Derya Uslu", "Mert Sayın", "Ece Karaca", "Bora Aksu", "Sıla Yener"];
const SAMPLE_DEPARTMENTS = ["Bilgisayar Mühendisliği", "Matematik", "Elektronik Mühendisliği", "Diğer"];

const guid = (index) => {
  const hex = (index + 1).toString(16).padStart(4, "0");
  return `e${hex}a1b2-c3d4-4e5f-8a6b-7c8d9e0f${hex}`;
};

const listedSchema = () => [
  { id: "q1", type: "short_text", props: { question: "Adınız ve soyadınız", description: "", required: true, inputType: "name" } },
  { id: "q2", type: "combobox", props: { question: "Bölümünüz", description: "", required: true, allowCustom: false, choices: ["Bilgisayar Mühendisliği", "Elektronik Mühendisliği", "Matematik", "Diğer"], preset: null } },
  { id: "q3", type: "long_text", props: { question: "Eklemek istedikleriniz", description: "", required: false } },
];

export function createDatabase({ forms, store, totals, metricsOf, membership }) {
  const counted = (formId) => (store.rows[formId] ?? []).map((id) => store.responses[id]).filter((detail) => detail && !detail.isArchived && ![4, 6].includes(detail.status));

  const addSamples = (form, owner, count, pending, lastMinutes, index) => {
    for (let i = 0; i < Math.min(6, count); i += 1) {
      const name = SAMPLE_NAMES[(index + i) % SAMPLE_NAMES.length];
      const id = guid(1000 + index * 10 + i);
      const status = !form.requiresManualReview ? 0 : i < pending ? 1 : i % 2 ? 3 : 2;
      const minutes = lastMinutes + i * 187;
      store.responses[id] = {
        id, formId: form.id, user: person(`${id.slice(0, 8)}-1111-4111-8111-000000000000`, name.toLocaleUpperCase("tr-TR"), `${name.split(" ")[0].toLocaleLowerCase("tr-TR")}@example.com`),
        reviewer: status >= 2 ? owner : null, archiver: null, timeSpent: 240 + i * 37, status, isArchived: false, workflow: null, reviewerNote: null,
        submittedAt: ago(minutes), reviewedAt: status >= 2 ? ago(Math.max(1, minutes - 120)) : null, archivedAt: null, sharedBy: null, attribution: null, attempt: null, task: null, guest: null, returnedQuestionIds: null,
        schema: [
          { id: "q1", type: "short_text", question: "Adınız ve soyadınız", answer: name },
          { id: "q2", type: "combobox", question: "Bölümünüz", answer: SAMPLE_DEPARTMENTS[i % SAMPLE_DEPARTMENTS.length] },
          { id: "q3", type: "long_text", question: "Eklemek istedikleriniz", answer: "" },
        ],
      };
      store.rows[form.id].push(id);
    }
  };

  const rows = [IDS.F1, IDS.F2, IDS.F3, IDS.F4].map((id) => {
    const form = forms[id];
    const stats = metricsOf(id);
    const live = counted(id);
    return {
      id, title: form.title, status: form.status, owner: id === IDS.F4 ? SELIN : ME,
      allowAnonymousResponses: form.allowAnonymousResponses, allowMultipleResponses: form.allowMultipleResponses, requiresManualReview: form.requiresManualReview,
      workflow: membership(id), createdAt: form.createdAt, updatedAt: form.updatedAt,
      responseCount: stats.totalResponses ?? live.length, pendingCount: (stats.pendingCount ?? 0) - (stats.flaggedCount ?? 0),
      lastResponseAt: live.map((detail) => detail.submittedAt).sort().pop() ?? null,
    };
  });

  LISTED.forEach(([title, ownerKey, status, count, pending, lastMinutes, createdMinutes, step, flags], index) => {
    const id = guid(index);
    const owner = OWNERS[ownerKey];
    const workflow = step ? { id: step.flow.id, name: step.flow.name, isStart: step.start, isPublished: true, allowMultipleRuns: false, intake: 0, requiresManualReview: Boolean(flags.review), lockedQuestions: [] } : null;
    const updatedMinutes = Math.min(lastMinutes + 40 + (index * 17) % 900, createdMinutes - 10);
    rows.push({
      id, title, status, owner,
      allowAnonymousResponses: Boolean(flags.anonymous), allowMultipleResponses: Boolean(flags.multiple), requiresManualReview: Boolean(flags.review),
      workflow, createdAt: ago(createdMinutes), updatedAt: ago(Math.max(5, updatedMinutes)),
      responseCount: count, pendingCount: pending, lastResponseAt: count ? ago(lastMinutes) : null,
    });
    forms[id] = {
      id, title, description: "", status, demo: { listOnly: true, pending, lastMinutes, createdMinutes },
      allowMultipleResponses: Boolean(flags.multiple), allowAnonymousResponses: Boolean(flags.anonymous), requiresManualReview: Boolean(flags.review),
      task: null, closesAt: null, timeLimitMinutes: null, collaborators: [{ user: owner.id === DELETED_USER ? { ...owner, fullName: "Silinmiş kullanıcı" } : owner, role: 3 }],
      userRole: ownerKey === "ME" ? 3 : 0, createdAt: ago(createdMinutes), updatedAt: ago(Math.max(5, updatedMinutes)), schema: listedSchema(),
    };
    store.rows[id] = [];
    totals[id] = count;
    addSamples(forms[id], owner, count, pending, lastMinutes, index);
  });

  const ownerContract = (owner) => (owner.id === DELETED_USER ? GONE : owner);

  const listOf = (params) => {
    const page = Math.max(1, Number(params.get("Page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(params.get("PageSize") ?? 20)));
    const search = String(params.get("Search") ?? "").trim().toLocaleLowerCase("tr-TR");
    const flag = (key) => (params.get(key) == null ? null : params.get(key) === "true");
    const statusFilter = params.get("Status");
    const ownerFilter = params.get("Owner");
    let items = rows.filter((row) => {
      if (statusFilter === "deleted") return row.status === 0;
      if (row.status === 0) return false;
      if (statusFilter === "open") return row.status === 2;
      if (statusFilter === "closed") return row.status === 1;
      return true;
    });
    if (search) items = items.filter((row) => row.title.toLocaleLowerCase("tr-TR").includes(search) || row.id.toLowerCase().startsWith(search));
    if (flag("AllowAnonymous") != null) items = items.filter((row) => row.allowAnonymousResponses === flag("AllowAnonymous"));
    if (flag("AllowMultiple") != null) items = items.filter((row) => row.allowMultipleResponses === flag("AllowMultiple"));
    if (flag("RequiresManualReview") != null) items = items.filter((row) => row.requiresManualReview === flag("RequiresManualReview"));
    if (ownerFilter === "orphaned") items = items.filter((row) => row.owner.id === DELETED_USER);
    else if (ownerFilter) items = items.filter((row) => row.owner.id === ownerFilter);

    const ascending = params.get("SortDirection") === "ascending";
    const keyOf = {
      updatedAt: (row) => new Date(row.updatedAt ?? row.createdAt).getTime(),
      responseCount: (row) => row.responseCount,
      pendingCount: (row) => row.pendingCount,
      lastResponseAt: (row) => (row.lastResponseAt ? new Date(row.lastResponseAt).getTime() : 0),
      status: (row) => row.status,
      title: (row) => row.title.toLocaleLowerCase("tr-TR"),
      owner: (row) => (row.owner.fullName ?? "~").toLocaleLowerCase("tr-TR"),
    }[params.get("SortBy") ?? "updatedAt"] ?? ((row) => new Date(row.updatedAt).getTime());
    items = [...items].sort((a, b) => {
      const left = keyOf(a);
      const right = keyOf(b);
      const order = typeof left === "string" ? left.localeCompare(right, "tr") : left - right;
      return ascending ? order : -order;
    });

    const visible = rows.filter((row) => row.status !== 0);
    return {
      items: items.slice((page - 1) * pageSize, page * pageSize).map((row) => ({
        id: row.id, title: row.title, status: row.status, createdBy: ownerContract(row.owner),
        allowAnonymousResponses: row.allowAnonymousResponses, allowMultipleResponses: row.allowMultipleResponses, requiresManualReview: row.requiresManualReview,
        workflow: row.workflow, createdAt: row.createdAt, updatedAt: row.updatedAt, responseCount: row.responseCount,
        pendingCount: row.pendingCount, lastResponseAt: row.lastResponseAt, isOrphaned: row.owner.id === DELETED_USER,
      })),
      totalCount: items.length, page, pageSize, totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
      summary: {
        total: visible.length,
        open: visible.filter((row) => row.status === 2).length,
        closed: visible.filter((row) => row.status === 1).length,
        deleted: rows.filter((row) => row.status === 0).length,
        orphaned: visible.filter((row) => row.owner.id === DELETED_USER).length,
        pending: visible.reduce((sum, row) => sum + row.pendingCount, 0),
      },
      owners: [ME, SELIN, AHMET, ZEYNEP, KEREM, TOPRAK].map((user) => ({ ...user, formCount: visible.filter((row) => row.owner.id === user.id).length })),
    };
  };

  return function route(method, pathname, params) {
    if (method === "GET" && pathname === "/api/admin/forms/all") return [200, { data: listOf(params) }];
    const restore = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/restore$/);
    if (restore && method === "POST") {
      const row = rows.find((item) => item.id === restore[1]);
      if (!row || row.status !== 0) return [404, { message: "Silinmiş form bulunamadı." }];
      row.status = 1;
      row.updatedAt = new Date().toISOString();
      if (forms[row.id]) forms[row.id].status = 1;
      return [200, { data: true }];
    }
    return null;
  };
}
