import { serve } from "../serve";

export const IDS = {
  FA1: "4b1d9e60-7a2c-4f3e-9d15-0c6a8e2f1b01",
  FA2: "4b1d9e60-7a2c-4f3e-9d15-0c6a8e2f1b02",
  FA3: "4b1d9e60-7a2c-4f3e-9d15-0c6a8e2f1b03",
  RUN: "4b1d9e60-7a2c-4f3e-9d15-0c6a8e2f1b1a",
};

export const FLOW = "WEBLAB Frontend Seçmeleri";

export const NOTES = {
  fix: "GitHub bağlantın açılmıyor, adresi kontrol edip yeniden gönderir misin?",
  pass1: "Projelerini beğendik. Kod ödevinde 48 saatin var, rahat çalış.",
  pass2: "Ödevin temiz ve okunaklıydı. Görüşmede birlikte üstünden geçelim.",
};

export const PHASES = ["fresh", "sent1", "returned", "sent2", "approved1", "running", "sent3", "approved2", "sent4"];

const EVENTS = PHASES.slice(1);
const TASK_MINUTES = 48 * 60;

const TASK = [
  "## Kod ödevi",
  "",
  "Bir kulüp etkinliğinin kayıt sayfasını React ile kurun.",
  "",
  "1. Ad, e-posta ve bölüm soran bir form yapın.",
  "2. Gönderince kayıtları aynı sayfada bir listede gösterin.",
  "3. Sayfa telefonda da düzgün görünsün.",
  "",
  "Next.js ya da Vite kullanabilirsiniz. Kodu herkese açık bir GitHub deposuna koyun.",
].join("\n");

const FORMS = {
  [IDS.FA1]: {
    id: IDS.FA1, title: "Seçme başvurusu", description: "<p>WEBLAB'in frontend takımı için başvuru formu. Yaklaşık 5 dakika sürer.</p>", status: 2,
    allowMultipleResponses: false, allowAnonymousResponses: false, requiresManualReview: true, task: null, closesAt: null, timeLimitMinutes: null, brand: null,
    schema: [
      { id: "a1", type: "short_text", props: { question: "Adınız ve soyadınız", description: "", required: true, inputType: "name" } },
      { id: "a2", type: "short_text", props: { question: "E-posta adresiniz", description: "", required: true, inputType: "email" } },
      { id: "a3", type: "combobox", props: { question: "Hangi takıma başvuruyorsunuz?", description: "", required: true, allowCustom: false, choices: ["Frontend", "Backend", "DevOps"], preset: null } },
      { id: "a4", type: "toggle", props: { question: "Web geliştirme deneyiminiz var mı?", description: "", required: true, trueLabel: "Evet", falseLabel: "Hayır" } },
      { id: "a5", type: "long_text", props: { question: "Hangi projelerde yer aldınız?", description: "Kısaca ne yaptığınızı yazın.", required: true }, condition: { fieldId: "a4", operator: "is_true" } },
      { id: "a6", type: "short_text", props: { question: "GitHub profiliniz", description: "", required: true, inputType: "link", allowMultiple: false }, condition: { fieldId: "a4", operator: "is_true" } },
      { id: "a7", type: "multi_choice", props: { question: "Hangilerini kullandınız?", description: "", required: false, choices: ["React", "Next.js", "Vue", "TypeScript", "Tailwind CSS"] } },
    ],
  },
  [IDS.FA2]: {
    id: IDS.FA2, title: "Kod ödevi", description: "<p>Ödevi 48 saat içinde teslim edin. Süre siz başlattığınızda işlemeye başlar.</p>", status: 2,
    allowMultipleResponses: false, allowAnonymousResponses: false, requiresManualReview: true, closesAt: null, timeLimitMinutes: TASK_MINUTES, brand: null,
    task: { content: TASK, collapsible: true, downloadable: false },
    schema: [
      { id: "b1", type: "short_text", props: { question: "Ödevinizin bulunduğu depo", description: "", required: true, inputType: "link", allowMultiple: false } },
      { id: "b2", type: "long_text", props: { question: "Neler yaptığınızı kısaca anlatın", description: "", required: true } },
    ],
  },
  [IDS.FA3]: {
    id: IDS.FA3, title: "Görüşme", description: "<p>Görüşme yaklaşık 30 dakika sürer. Size uygun saatleri seçin, ekip birini onaylayıp e-postayla bildirir.</p>", status: 2,
    allowMultipleResponses: false, allowAnonymousResponses: false, requiresManualReview: true, task: null, closesAt: null, timeLimitMinutes: null, brand: null,
    schema: [
      { id: "c1", type: "multi_choice", props: { question: "Hangi saatler size uygun?", description: "", required: true, choices: ["Salı 18.00", "Çarşamba 17.30", "Perşembe 19.00", "Cuma 16.00"] } },
      { id: "c2", type: "combobox", props: { question: "Görüşme nasıl olsun?", description: "", required: true, allowCustom: false, choices: ["Yüz yüze, B-204", "Çevrim içi"], preset: null } },
    ],
  },
};

const STEPS = [IDS.FA1, IDS.FA2, IDS.FA3];

export function stampOf(event) {
  const at = (daysAgo, hour, minute) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(hour, minute, 0, 0);
    return date.getTime() > Date.now() ? Date.now() - 60000 : date.getTime();
  };
  const near = (minutes) => Date.now() - minutes * 60000;
  const time = { sent1: at(3, 14, 32), returned: at(2, 10, 15), sent2: at(2, 12, 40), approved1: at(1, 16, 5), running: near(3), sent3: near(2), approved2: near(1), sent4: near(0.2) }[event];
  return new Date(time).toISOString();
}

const now = () => new Date().toISOString();

const contract = (form) => ({
  id: form.id, title: form.title, description: form.description, schema: form.schema, requiresManualReview: form.requiresManualReview, task: form.task,
  closesAt: form.closesAt, timeLimitMinutes: form.timeLimitMinutes, allowAnonymousResponses: form.allowAnonymousResponses, brand: form.brand ?? null,
});

const textOf = (answers) => Object.entries(answers ?? {}).map(([id, answer]) => ({ id, answer: String(answer ?? "") }));

export function createApplicantsServer() {
  const store = { phase: "fresh", answers: {}, at: {} };
  const after = (phase) => PHASES.indexOf(store.phase) >= PHASES.indexOf(phase);

  function journey(focus) {
    const stepOf = (formId, index) => {
      const base = { stage: index + 1, formTitle: FORMS[formId].title, certain: true, requiresManualReview: true, submittedAt: null, reviewedAt: null, reviewNote: null, revision: null };
      const phase = store.phase;
      if (index === 0) {
        if (after("approved1")) return { ...base, status: "approved", submittedAt: store.at.sent2, reviewedAt: store.at.approved1, reviewNote: NOTES.pass1 };
        if (phase === "sent2") return { ...base, status: "inReview", submittedAt: store.at.sent2, revision: { round: 2 } };
        if (phase === "returned") return { ...base, status: "current", revision: { returnedAt: store.at.returned, questionIds: ["a6"], note: NOTES.fix } };
        if (phase === "sent1") return { ...base, status: "inReview", submittedAt: store.at.sent1 };
        return { ...base, status: "current" };
      }
      if (index === 1) {
        if (after("approved2")) return { ...base, status: "approved", submittedAt: store.at.sent3, reviewedAt: store.at.approved2, reviewNote: NOTES.pass2 };
        if (phase === "sent3") return { ...base, status: "inReview", submittedAt: store.at.sent3 };
        if (after("approved1")) return { ...base, status: "current" };
        return { ...base, status: "upcoming" };
      }
      if (phase === "sent4") return { ...base, status: "inReview", submittedAt: store.at.sent4 };
      if (after("approved2")) return { ...base, status: "current" };
      return { ...base, status: "upcoming" };
    };
    return { title: FLOW, route: STEPS.map(stepOf), maxSteps: STEPS.length, index: STEPS.indexOf(focus) };
  }

  const shared = (formId) => ({ stage: STEPS.indexOf(formId) + 1, state: 1, startFormId: IDS.FA1, workflow: journey(formId), instanceId: IDS.RUN });

  function attemptOf() {
    const deliverables = FORMS[IDS.FA2].schema.map((field) => field.props.question);
    if (store.phase === "approved1") return { state: "notStarted", timeLimitMinutes: TASK_MINUTES, deliverables, startClosesAt: null };
    if (store.phase !== "running") return null;
    const startedAt = store.at.running ?? (store.at.running = now());
    return {
      state: "running", timeLimitMinutes: TASK_MINUTES, deliverables, startedAt,
      deadlineAt: new Date(new Date(startedAt).getTime() + TASK_MINUTES * 60000).toISOString(), startClosesAt: null, lastExtension: null,
    };
  }

  const sentAt = { [IDS.FA1]: () => store.at.sent2 ?? store.at.sent1, [IDS.FA2]: () => store.at.sent3, [IDS.FA3]: () => store.at.sent4 };
  const waiting = (formId) => [200, { status: 600, data: { ...shared(formId), state: 2, form: null, formTitle: FORMS[formId].title, submittedAt: sentAt[formId]() ?? now() } }];
  const showForm = (formId, extra = {}) => [200, { status: 200, data: { ...shared(formId), form: contract(FORMS[formId]), attempt: null, serverNow: now(), closesAt: null, guestUploads: null, revision: null, lastRun: null, ...extra } }];
  const parentFirst = (formId) => [403, { status: 603, message: "Önceki adım gerekli.", data: { ...shared(formId), state: 6, form: null, formTitle: FORMS[formId].title } }];

  function displayStep(formId) {
    const phase = store.phase;
    if (formId === IDS.FA1) {
      if (phase === "fresh") return showForm(formId);
      if (phase === "returned") return showForm(formId, { revision: { round: 2, answers: textOf(store.answers.a), questionIds: ["a6"], note: NOTES.fix, returnedAt: store.at.returned } });
      if (phase === "sent1" || phase === "sent2") return waiting(formId);
      return displayStep(after("approved2") ? IDS.FA3 : IDS.FA2);
    }
    if (formId === IDS.FA2) {
      if (!after("approved1")) return parentFirst(formId);
      if (phase === "approved1" || phase === "running") return showForm(formId, { attempt: attemptOf() });
      if (phase === "sent3") return waiting(formId);
      return displayStep(IDS.FA3);
    }
    if (!after("approved2")) return parentFirst(formId);
    if (phase === "sent4") return waiting(formId);
    return showForm(formId);
  }

  function setPhase(phase, answers = null) {
    if (!PHASES.includes(phase)) return false;
    store.phase = phase;
    if (answers) store.answers = { ...store.answers, ...answers };
    const reached = EVENTS.slice(0, EVENTS.indexOf(phase) + 1);
    EVENTS.forEach((event) => {
      if (!reached.includes(event)) delete store.at[event];
      else if (!store.at[event]) store.at[event] = stampOf(event);
    });
    return true;
  }

  function submit(body) {
    const formId = body?.formId;
    const answers = Object.fromEntries((body?.responses ?? []).map((entry) => [entry.id, entry.answer]));
    if (formId === IDS.FA1 && (store.phase === "fresh" || store.phase === "returned")) setPhase(store.phase === "fresh" ? "sent1" : "sent2", { a: answers });
    else if (formId === IDS.FA2 && store.phase === "running") setPhase("sent3", { b: answers });
    else if (formId === IDS.FA3 && store.phase === "approved2") setPhase("sent4", { c: answers });
    else return [400, { status: 400, message: "Bu form şu anda yeni bir cevap kabul etmiyor.", data: null }];
    return [200, { status: 600, message: "Cevabınız kaydedildi.", data: { responseId: `r-${store.phase}`, ...shared(formId), state: 2 } }];
  }

  function route({ method, pathname, body }) {
    let match;
    if ((match = pathname.match(/^\/api\/forms\/([^/]+)\/meta$/)) && method === "GET") {
      const form = FORMS[match[1]];
      return form ? [200, { status: 200, data: { title: form.title, description: form.description, brand: null } }] : [404, { status: 404, message: "Form bulunamadı.", data: null }];
    }
    if (pathname === "/api/forms/responses" && method === "POST") return submit(body);
    if (pathname.startsWith("/api/forms/responses/draft")) return [200, { status: 200, data: null }];
    if ((match = pathname.match(/^\/api\/forms\/([^/]+)\/attempt$/)) && method === "POST") {
      if (match[1] !== IDS.FA2 || store.phase !== "approved1") return [410, { status: 410, message: "Görev artık başlatılamıyor.", data: { reason: "startClosed" } }];
      setPhase("running");
      store.at.running = now();
      return [200, { status: 200, data: attemptOf() }];
    }
    if ((match = pathname.match(/^\/api\/forms\/([^/]+)$/)) && method === "GET") {
      return STEPS.includes(match[1]) ? displayStep(match[1]) : [404, { status: 404, message: "Form bulunamadı.", data: null }];
    }
    if (pathname.startsWith("/api/forms/")) return [200, { status: 200, data: null }];
    return [200, { data: method === "GET" ? null : true }];
  }

  return {
    ...serve(route),
    control: {
      setPhase,
      state: () => ({ phase: store.phase, at: { ...store.at }, answers: { ...store.answers } }),
    },
  };
}
