import { AHMET, ME, SELIN } from "../people";
import { IDS, TEAMS, ago, now } from "./seed";

const ahead = (minutes) => new Date(Date.now() + minutes * 60000).toISOString();

const NAMES = [
  "Mert Aydın", "Zeynep Kaya", "Can Demir", "Deniz Arslan", "Ayşe Çelik", "Burak Şahin", "Ece Doğan", "Kerem Polat", "Selin Kurt", "Ozan Yıldız",
  "İrem Aksoy", "Emre Koç", "Naz Öztürk", "Kaan Erdem", "Defne Tekin", "Arda Kılıç", "Yağmur Bulut", "Onur Şen", "Melis Karaca", "Berk Uçar",
  "Ceren Avcı", "Tolga Işık",
];

const REASONS = [
  "Geçen yıl kampa katılan arkadaşlarımdan çok şey duydum; ekip içinde gerçek bir proje çıkarmak istiyorum.",
  "Okulda öğrendiklerimi bir ekiple bir haftada ürüne dönüştürmeyi deneyimlemek istiyorum.",
  "React'te kendi kendime ilerledim ama ekipte kod incelemesi görmedim; kampta bunu öğrenmek istiyorum.",
  "CTF'lere yeni başladım, SKYSEC'teki deneyimli kişilerle çalışarak hızlanmak istiyorum.",
  "Oyun motorlarıyla ilk projemi bitirmek ve portfolyoma eklemek istiyorum.",
  "Drone yazılımı hep ilgimi çekti; AIRLAB'in kamptaki projesine katkı vermek istiyorum.",
  "Algoritma yarışmalarına hazırlanıyorum, kampta düzenli çalışma alışkanlığı kazanmak istiyorum.",
  "Yeni insanlarla tanışmak ve kulüpte aktif rol almak istiyorum.",
  "Staj başvurularından önce ekip içinde teslim tarihli bir iş çıkarmış olmak istiyorum.",
  "Tasarımdan koda kadar bir ürünün bütün aşamalarını görmek istiyorum.",
  "Bölümdeki derslerden farklı olarak uygulamalı bir şey yapmak istiyorum.",
  "Kış tatilini verimli geçirmek, yazılımda nerede olduğumu görmek istiyorum.",
];

const FIRST = ["Aslı", "Batu", "Cem", "Dilara", "Eren", "Funda", "Gökay", "Hande", "Işıl", "Kuzey", "Lara", "Mete", "Nil", "Oğuz", "Pınar", "Rüzgar", "Sarp", "Tuğçe", "Ufuk", "Yaren"];
const LAST = ["Akın", "Bayram", "Cansız", "Dal", "Ekinci", "Gürel", "Kara", "Özer", "Sezer", "Tan"];
const SOURCES = [
  { source: "instagram", medium: "social", campaign: "kis-kampi" }, { source: "instagram", medium: "social", campaign: "kis-kampi" },
  { source: "instagram", medium: "social", campaign: "hikaye-ekim" }, { source: "whatsapp", medium: "chat", campaign: "grup-duyurusu" },
  { source: "whatsapp", medium: "chat", campaign: null }, { source: "email", medium: "email", campaign: "bulten-ekim" },
  null, null, null, null,
];
const OLDER_DAYS = [[33, 6], [32, 11], [31, 7], [30, 4], [29, 3], [28, 2], [27, 1], [26, 1], [24, 1], [23, 2], [22, 1], [20, 3], [19, 6], [18, 4], [17, 2], [16, 1], [15, 1]];
const TEAM_BIAS = { SKYSEC: 0.7, ALGOLAB: 0.4, WEBLAB: 0.1, AIRLAB: -0.2, GAMELAB: -0.6 };
const SOURCE_BIAS = { email: 0.7, whatsapp: 0.3, instagram: -0.4 };

const ASCII = { ı: "i", ş: "s", ç: "c", ö: "o", ü: "u", ğ: "g" };

const userOf = (name, index) => ({
  id: `u${String(index).padStart(7, "0")}-1111-4111-8111-${String(index).padStart(12, "0")}`,
  email: `${name.split(" ")[0].toLocaleLowerCase("tr-TR").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[ışçöüğ]/g, (ch) => ASCII[ch])}@example.com`,
  fullName: name.toLocaleUpperCase("tr-TR"),
  profilePictureUrl: null,
});

const runRecord = (instanceId, stage, round = 1) => ({ instanceId, stage, steps: [], round, run: null });

export function createResponses(forms) {
  const { F1, F2, F3, F4 } = IDS;
  const responses = {};
  const attempts = {};
  const rows = { [F1]: [], [F2]: [], [F3]: [], [F4]: [] };
  const runs = {};
  let seq = 100;
  const uid = (prefix) => `${prefix}${String(++seq).padStart(4, "0")}-0000-4000-8000-${String(seq).padStart(12, "0")}`;

  const visible = (field, answers) => !field.condition?.fieldId || answers[field.condition.fieldId] === field.condition.value;
  const schemaOf = (formId, answers) => forms[formId].schema.filter((field) => field.type !== "separator" && visible(field, answers)).map((field) => ({
    id: field.id, type: field.type, question: field.props.question, answer: answers[field.id] ?? "",
  }));

  const f1Answers = (name, index, overrides = {}) => {
    const team = TEAMS[index % TEAMS.length];
    const handle = name.split(" ")[0].toLowerCase();
    return {
      f1: name, f2: `${handle}@example.com`, f3: String(18 + ((index * 7) % 8)), f4: REASONS[(index * 5) % REASONS.length], f5: team,
      f7: team === "WEBLAB" ? `https://github.com/${handle}` : "",
      f8: team === "SKYSEC" ? "picoCTF 2025, METUCTF" : "",
      f9: team === "GAMELAB" ? [["Unity", "Godot"], ["Unity"], ["Godot"], ["Unreal Engine", "Unity"], ["Hiçbiri"]][Math.floor(index / 5) % 5].join(", ") : "",
      f10: String(6 + ((index * 3) % 9)), f12: index % 3 === 0 ? "media-cv-1" : "", f13: index % 7 === 3 ? "Hayır" : "Evet",
      f14: JSON.stringify({ React: ["Yok", "Orta", "İyi"][index % 3], Go: ["Orta", "Yok", "İyi"][(index * 2) % 3] }),
      f15: String([6, 7, 8, 5, 7, 9, 6, 8, 4, 7, 8][(index * 3) % 11]),
      ...overrides,
    };
  };

  const runOf = (instanceId) => {
    if (!runs[instanceId]) runs[instanceId] = { status: 0, outcome: 0, allowMultipleRuns: false, intake: 0, canVoid: true, voidBlock: null, completedAt: null };
    return runs[instanceId];
  };

  const nextForm = (formId) => ({ [F1]: F2, [F2]: F3 })[formId] ?? null;

  const routeOf = (detail) => {
    if (!detail.workflow) return detail;
    const decided = [2, 3, 6].includes(Number(detail.status));
    const closed = decided || detail.status === 4;
    const next = nextForm(detail.formId);
    detail.workflow.onApprove = closed ? null : next ? { endsFlow: false, formId: next, formTitle: forms[next].title } : { endsFlow: true, formId: null, formTitle: null };
    detail.workflow.onDecline = closed ? null : { endsFlow: true, formId: null, formTitle: null };
    detail.workflow.canReturn = !closed && forms[detail.formId].timeLimitMinutes == null;
    return detail;
  };

  const rowOf = (detail) => ({
    id: detail.id, user: detail.user, guest: null, status: detail.status, isArchived: detail.isArchived, reviewedBy: detail.reviewer,
    submittedAt: detail.submittedAt, reviewedAt: detail.reviewedAt, timeSpent: detail.timeSpent,
    workflow: detail.workflow ? { stage: detail.workflow.stage, round: detail.workflow.round ?? 1 } : null,
    attempt: detail.attempt ? {
      id: detail.attempt.id, status: detail.attempt.status, openedAt: detail.attempt.openedAt, startedAt: detail.attempt.startedAt, deadlineAt: detail.attempt.deadlineAt,
      expiredAt: detail.attempt.expiredAt, extendedMinutes: detail.attempt.extendedMinutes, closedByTeam: detail.attempt.closedByTeam,
      canExtend: detail.attempt.canExtend, canRemind: detail.attempt.canRemind, taskSeconds: 2400,
    } : null,
  });

  const makeResponse = ({ id = uid("r"), formId, user, status, answers, minutes, reviewer = null, reviewedMinutes = null, note = null, workflow = null, returned = null, attempt = null, attribution = null }) => ({
    id, formId, user, reviewer, archiver: null, schema: schemaOf(formId, answers), timeSpent: 140 + (minutes % 300), status, isArchived: false,
    workflow, reviewerNote: note, submittedAt: ago(minutes), reviewedAt: reviewedMinutes == null ? null : ago(reviewedMinutes), archivedAt: null,
    sharedBy: null, attribution, attempt, task: null, guest: null, returnedQuestionIds: returned,
  });

  const add = (detail) => {
    responses[detail.id] = routeOf(detail);
    rows[detail.formId].push(detail.id);
    return detail;
  };

  const elif = userOf("Elif Yılmaz", 1);
  const elifRun = "inst-elif-0000-4000-8000-000000000001";
  const elif1 = "r0000001-0000-4000-8000-000000000001";
  const elif2 = "r0000002-0000-4000-8000-000000000002";
  add(makeResponse({
    id: elif1, formId: F1, user: elif, status: 6, minutes: 4200, reviewer: SELIN, reviewedMinutes: 2900,
    note: "GitHub bağlantısı açılmıyor. Haftalık ayırabileceğin süreyi de netleştirir misin?", returned: ["f7", "f10"],
    answers: f1Answers("Elif Yılmaz", 0, { f7: "https://github.com/elif-yilmaz-eski", f10: "4", f14: JSON.stringify({ React: "Orta", Go: "Yok" }) }),
    workflow: runRecord(elifRun, 1),
    attribution: { source: "instagram", medium: "social", campaign: "kis-kampi", term: null, content: null },
  }));
  add(makeResponse({
    id: elif2, formId: F1, user: elif, status: 1, minutes: 35,
    answers: f1Answers("Elif Yılmaz", 0, { f7: "https://github.com/elifyilmaz", f10: "12", f14: JSON.stringify({ React: "İyi", Go: "Yok" }) }),
    workflow: runRecord(elifRun, 1, 2),
    attribution: { source: "instagram", medium: "social", campaign: "kis-kampi", term: null, content: null },
  }));

  const mert = userOf("Mert Aydın", 2);
  const mertRun = "inst-mert-0000-4000-8000-000000000002";
  const mert1 = "r0000003-0000-4000-8000-000000000003";
  const mert2 = "r0000004-0000-4000-8000-000000000004";
  add(makeResponse({
    id: mert1, formId: F1, user: mert, status: 2, minutes: 5000, reviewer: ME, reviewedMinutes: 4000, note: "Güzel bir başvuru.",
    answers: f1Answers("Mert Aydın", 0), workflow: runRecord(mertRun, 1),
  }));
  add(makeResponse({
    id: mert2, formId: F2, user: mert, status: 1, minutes: 70,
    answers: { g1: "https://github.com/mertaydin/acik-veri", g2: "İBB'nin açık veri portalındaki otobüs hatlarını kullandım. En yoğun hattı bulan küçük bir Python betiği yazdım.\n\nSonuçları README'de grafikle anlattım." },
    workflow: runRecord(mertRun, 2),
    attempt: {
      id: "a0000004-0000-4000-8000-000000000004", status: 2, responseId: mert2, openedAt: ago(160), startedAt: ago(130), deadlineAt: ago(40), expiredAt: null, submittedAt: ago(70),
      timeLimitMinutes: 90, extendedMinutes: 0, closedByTeam: false, canExtend: false, canDecide: false, canRemind: false, reminderSentAt: null,
      acceptRequiresReview: true, onAccept: null, onClose: null,
      events: [{ id: "e1", type: 0, createdAt: ago(160) }, { id: "e2", type: 1, createdAt: ago(130), deadlineAt: ago(40) }, { id: "e3", type: 7, createdAt: ago(70) }],
    },
  }));

  NAMES.slice(2, 22).forEach((name, offset) => {
    const index = offset + 3;
    const status = [1, 1, 2, 3, 1, 5, 2, 1, 3, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3][offset];
    const decided = status === 2 || status === 3;
    add(makeResponse({
      formId: F1, user: userOf(name, index), status, minutes: 60 + offset * 960, reviewer: decided ? ME : null, reviewedMinutes: decided ? Math.max(10, offset * 960 - 140 - offset * 77) : null,
      answers: f1Answers(name, index), workflow: runRecord(`inst-${index}`, 1),
      attribution: offset % 4 === 0 ? { source: "whatsapp", medium: "qr", campaign: null, term: null, content: null } : null,
    }));
  });

  const older = OLDER_DAYS.flatMap(([day, count]) => Array(count).fill(day));
  const generated = [];
  for (let index = 0; index < 96; index += 1) {
    const name = `${FIRST[index % FIRST.length]} ${LAST[(index * 7 + Math.floor(index / FIRST.length)) % LAST.length]}`;
    const roll = (index * 37 + 11) % 100;
    const status = roll < 18 ? 1 : roll < 66 ? 2 : roll < 94 ? 3 : 5;
    const decided = status === 2 || status === 3;
    const recent = 25 + Math.round((((index * 53) % 97) / 97) * 13.8 * 1440);
    const minutes = decided && index % 5 && older.length ? older.shift() * 1440 - ((index * 211) % 1200) : recent;
    const tag = SOURCES[(index * 3) % SOURCES.length];
    const detail = add(makeResponse({
      formId: F1, user: userOf(name, 200 + index), status, minutes, reviewer: decided ? [ME, SELIN, AHMET, SELIN][index % 4] : null,
      reviewedMinutes: decided ? Math.max(4, minutes - (75 + ((index * 137) % 4200))) : null,
      answers: f1Answers(name, 200 + index), workflow: runRecord(`inst-b${index}`, 1),
      attribution: tag ? { ...tag, term: null, content: null } : null,
    }));
    detail.timeSpent = index % 23 === 5 ? 172800 + index * 60 : index % 31 === 7 ? 26000 : 260 + ((index * 41) % 520);
    if (index % 16 === 9) Object.assign(detail, { isArchived: true, archivedAt: ago(Math.max(2, minutes - 600)), archiver: ME });
    generated.push(detail);
  }

  const biased = generated.filter((detail) => !detail.isArchived && [2, 3].includes(detail.status));
  const approvedTotal = biased.filter((detail) => detail.status === 2).length;
  biased
    .map((detail, order) => ({ detail, score: (TEAM_BIAS[detail.schema.find((entry) => entry.id === "f5")?.answer] ?? 0) + (SOURCE_BIAS[detail.attribution?.source] ?? 0) + ((order * 61) % 100) / 40 }))
    .sort((a, b) => b.score - a.score)
    .forEach(({ detail }, rank) => {
      detail.status = rank < approvedTotal ? 2 : 3;
    });

  const zeynep = userOf("Zeynep Kaya", 30);
  const zeynepRun = "inst-zeyn-0000-4000-8000-000000000030";
  const zeynep1 = "r0000030-0000-4000-8000-000000000030";
  const zeynep2 = "r0000031-0000-4000-8000-000000000031";
  add(makeResponse({ id: zeynep1, formId: F1, user: zeynep, status: 2, minutes: 6000, reviewer: ME, reviewedMinutes: 5500, answers: f1Answers("Zeynep Kaya", 1), workflow: runRecord(zeynepRun, 1) }));
  add(makeResponse({
    id: zeynep2, formId: F2, user: zeynep, status: 4, minutes: 300,
    answers: { g1: "https://github.com/zeynepkaya/gorev", g2: "Veriyi indirdim, analiz yarım kal" },
    workflow: runRecord(zeynepRun, 2),
    attempt: {
      id: "a0000031-0000-4000-8000-000000000031", status: 3, responseId: zeynep2, openedAt: ago(420), startedAt: ago(390), deadlineAt: ago(300), expiredAt: ago(300), submittedAt: null,
      timeLimitMinutes: 90, extendedMinutes: 0, closedByTeam: false, canExtend: true, canDecide: true, canRemind: false, reminderSentAt: null,
      acceptRequiresReview: true, onAccept: null, onClose: { endsFlow: true, formId: null, formTitle: null },
      events: [{ id: "e1", type: 0, createdAt: ago(420) }, { id: "e2", type: 1, createdAt: ago(390), deadlineAt: ago(300) }, { id: "e3", type: 3, createdAt: ago(300) }],
    },
  }));

  [
    { name: "Can Demir", index: 40, status: 1, startedAt: ago(49), deadlineAt: ahead(41), canExtend: true, canRemind: false, extendedMinutes: 0 },
    { name: "Deniz Arslan", index: 41, status: 0, startedAt: null, deadlineAt: null, canExtend: false, canRemind: true, extendedMinutes: 0 },
    { name: "Ayşe Çelik", index: 42, status: 4, startedAt: ago(400), deadlineAt: ago(310), canExtend: true, canRemind: false, extendedMinutes: 30 },
  ].forEach((item) => {
    const id = `a00000${item.index}-0000-4000-8000-0000000000${item.index}`;
    const events = [{ id: "e1", type: 0, createdAt: ago(600) }];
    if (item.startedAt) events.push({ id: "e2", type: 1, createdAt: item.startedAt, deadlineAt: item.deadlineAt });
    if (item.extendedMinutes) events.push({ id: "e3", type: 2, createdAt: ago(380), minutes: 30, deadlineAt: item.deadlineAt, actor: ME, note: "Sınav haftası" });
    if (item.status === 4) events.push({ id: "e4", type: 8, createdAt: item.deadlineAt });
    attempts[id] = {
      id, formId: F2, user: userOf(item.name, item.index), task: forms[F2].task,
      workflow: { instanceId: `inst-${item.index}`, stage: 2, round: 1, steps: [
        { stage: 1, formTitle: forms[F1].title, responseId: null, status: 2, round: 1, submittedAt: ago(7000), reviewedAt: ago(6500) },
        { stage: 2, formTitle: forms[F2].title, responseId: null, status: null, round: 1, submittedAt: null, reviewedAt: null },
      ] },
      attempt: {
        id, status: item.status, responseId: null, openedAt: ago(600), startedAt: item.startedAt, deadlineAt: item.deadlineAt, expiredAt: item.status === 4 ? item.deadlineAt : null,
        submittedAt: null, timeLimitMinutes: 90, extendedMinutes: item.extendedMinutes, closedByTeam: false, canExtend: item.canExtend, canDecide: false,
        canRemind: item.canRemind, reminderSentAt: null, acceptRequiresReview: true, onAccept: null, onClose: null, events,
      },
    };
    rows[F2].push(id);
  });

  ["Kerem Polat", "Selin Kurt", "Ozan Yıldız"].forEach((name, offset) => {
    add(makeResponse({ formId: F3, user: userOf(name, 50 + offset), status: 0, minutes: 90 + offset * 400, answers: { k1: "Evet", k2: ["S", "M", "L"][offset] }, workflow: runRecord(`inst-f3-${offset}`, 3) }));
  });

  ["İrem Aksoy", "Emre Koç", "Naz Öztürk", "Kaan Erdem", "Defne Tekin"].forEach((name, offset) => {
    const status = [1, 2, 1, 3, 1][offset];
    add(makeResponse({
      formId: F4, user: userOf(name, 60 + offset), status, minutes: 40 + offset * 220, reviewer: status === 1 ? null : ME, reviewedMinutes: status === 1 ? null : 20 + offset * 100,
      note: status === 3 ? "Kontenjan doldu." : null, answers: { w1: name, w3: ["Hiç kullanmadım", "Biraz denedim", "Projede kullandım"][offset % 3] },
    }));
  });

  const stepOf = (id, stage, round = 1) => ({
    stage, formTitle: forms[responses[id]?.formId ?? F1].title, responseId: responses[id] ? id : null, status: responses[id]?.status ?? null, round,
    submittedAt: responses[id]?.submittedAt ?? null, reviewedAt: responses[id]?.reviewedAt ?? null,
  });
  const STORIES = {
    [elifRun]: () => [stepOf(elif1, 1), stepOf(elif2, 1, 2)],
    [mertRun]: () => [stepOf(mert1, 1), { ...stepOf(mert2, 2), formTitle: forms[F2].title }],
    [zeynepRun]: () => [stepOf(zeynep1, 1), { ...stepOf(zeynep2, 2), formTitle: forms[F2].title, submittedAt: null, reviewedAt: null }],
  };

  const stepsFor = (detail) => {
    const story = STORIES[detail.workflow.instanceId];
    if (story) return story();
    const stage = detail.workflow.stage;
    const own = { stage, formTitle: forms[detail.formId].title, responseId: detail.id, status: detail.status, round: detail.workflow.round, submittedAt: detail.submittedAt, reviewedAt: detail.reviewedAt };
    const earlier = Array.from({ length: stage - 1 }, (_, position) => ({ stage: position + 1, formTitle: forms[[F1, F2][position]].title, responseId: null, status: 2, round: 1, submittedAt: ago(9000), reviewedAt: ago(8800) }));
    return [...earlier, own, ...(detail.extraSteps ?? [])];
  };

  const detailContract = (detail) => ({
    ...detail,
    workflow: detail.workflow ? { ...detail.workflow, steps: stepsFor(detail), run: { ...runOf(detail.workflow.instanceId) } } : null,
  });

  const answerMatches = (item, params) => {
    const questionId = params?.get("AnswerQuestionId");
    if (!questionId) return true;
    const wanted = String(params.get("AnswerValue") ?? "").trim().toLocaleLowerCase("tr-TR");
    const answer = responses[item.id]?.schema?.find((entry) => entry.id === questionId)?.answer;
    if (answer == null || answer === "") return false;
    return String(answer).split(",").map((part) => part.trim().toLocaleLowerCase("tr-TR")).includes(wanted);
  };

  const counts = (formId, params = null) => {
    const all = rows[formId].map((id) => responses[id] ?? attempts[id]).filter((item) => item && !item.isArchived && answerMatches(item, params));
    const by = (status) => all.filter((item) => item.status === status).length;
    const byAttempt = (status) => all.filter((item) => item.status == null && item.attempt?.status === status).length;
    return { submitted: by(0), pending: by(1), approved: by(2), declined: by(3), provisional: by(4), flagged: by(5), returned: by(6), running: byAttempt(1), opened: byAttempt(0), noSubmission: byAttempt(4) };
  };

  const attemptRow = (id) => ({ id, user: attempts[id].user, guest: null, status: null, isArchived: false, reviewedBy: null, submittedAt: null, reviewedAt: null, timeSpent: null, attempt: { ...attempts[id].attempt, taskSeconds: null } });

  const filteredOf = (formId, params) => {
    const status = params.get("Status");
    const attemptStatus = params.get("AttemptStatus");
    const ascending = params.get("SortingDirection") === "ascending";
    let items = rows[formId].map((id) => (responses[id] ? rowOf(responses[id]) : attempts[id] ? attemptRow(id) : null)).filter(Boolean);
    if (params.get("ShowArchived") !== "true") items = items.filter((item) => !item.isArchived);
    if (status != null) items = items.filter((item) => String(item.status) === status);
    if (status == null && attemptStatus == null) items = items.filter((item) => item.status !== 6);
    if (attemptStatus != null) items = items.filter((item) => item.status == null && String(item.attempt?.status) === attemptStatus);
    if (params.get("Time") === "extended") items = items.filter((item) => item.attempt?.extendedMinutes > 0);
    if (params.get("ResponderType") === "2") items = [];
    items = items.filter((item) => answerMatches(item, params));
    const time = (item) => new Date(item.submittedAt ?? item.attempt?.openedAt ?? 0).getTime();
    return items.sort((a, b) => (ascending ? time(a) - time(b) : time(b) - time(a)));
  };

  const PAGE_SIZE = 20;
  const listOf = (formId, params) => {
    const page = Number(params.get("Page") ?? 1);
    const items = filteredOf(formId, params);
    return {
      paginationData: { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), page, pageSize: PAGE_SIZE, totalCount: items.length, totalPages: Math.max(1, Math.ceil(items.length / PAGE_SIZE)) },
      averageTimeSpent: 412, counts: counts(formId, params), averageTaskSeconds: forms[formId].timeLimitMinutes ? 3100 : null, hasTimeLimit: Boolean(forms[formId].timeLimitMinutes),
    };
  };

  const STORY_RUNS = new Set([elifRun, mertRun, zeynepRun]);
  const decide = (detail, body, reviewer) => {
    Object.assign(detail, { status: body.newStatus, reviewer, reviewedAt: now(), reviewerNote: body.note ?? null });
    if (body.newStatus === 6) detail.returnedQuestionIds = body.questionIds ?? [];
    if (detail.workflow && !STORY_RUNS.has(detail.workflow.instanceId)) {
      const next = nextForm(detail.formId);
      if (body.newStatus === 2 && next) {
        detail.extraSteps = [{ stage: detail.workflow.stage + 1, formTitle: forms[next].title, responseId: null, status: null, round: 1, submittedAt: null, reviewedAt: null }];
      }
      if (body.newStatus === 6) {
        detail.extraSteps = [{ stage: detail.workflow.stage, formTitle: forms[detail.formId].title, responseId: null, status: null, round: detail.workflow.round + 1, submittedAt: null, reviewedAt: null }];
      }
    }
    if (detail.workflow && body.newStatus === 3) Object.assign(runOf(detail.workflow.instanceId), { status: 1, outcome: 2, completedAt: now(), canVoid: true });
    routeOf(detail);
  };

  const textAnswers = (formId, questionId, params) => {
    const page = Math.max(1, Number(params.get("Page") ?? 1));
    const pageSize = Math.min(50, Math.max(1, Number(params.get("PageSize") ?? 8)));
    const search = String(params.get("Search") ?? "").trim().toLocaleLowerCase("tr-TR");
    const items = rows[formId]
      .map((id) => responses[id])
      .filter((detail) => detail && !detail.isArchived && ![4, 6].includes(detail.status))
      .map((detail) => ({ detail, answer: detail.schema.find((entry) => entry.id === questionId)?.answer ?? "" }))
      .filter(({ answer }) => String(answer).trim() !== "")
      .filter(({ detail, answer }) => !search || `${answer} ${detail.user?.fullName ?? ""}`.toLocaleLowerCase("tr-TR").includes(search))
      .sort((a, b) => new Date(b.detail.submittedAt) - new Date(a.detail.submittedAt))
      .map(({ detail, answer }) => ({ responseId: detail.id, user: detail.user, guest: null, submittedAt: detail.submittedAt, status: detail.status, answer }));
    return { items: items.slice((page - 1) * pageSize, page * pageSize), totalCount: items.length, page, pageSize, totalPages: Math.max(1, Math.ceil(items.length / pageSize)) };
  };

  const attemptAction = (id, action, body, actor) => {
    const view = attempts[id];
    const owner = Object.values(responses).find((item) => item.attempt?.id === id);
    const attempt = view?.attempt ?? owner?.attempt;
    if (!attempt) return [404, { message: "Kayıt bulunamadı." }];
    const log = (type, extra = {}) => attempt.events.push({ id: `e${attempt.events.length + 1}`, type, createdAt: now(), actor, ...extra });
    if (action === "remind") {
      attempt.reminderSentAt = now();
      log(6);
    }
    if (action === "extend") {
      const minutes = Number(body?.minutes ?? 60);
      const base = attempt.deadlineAt && new Date(attempt.deadlineAt) > new Date() ? new Date(attempt.deadlineAt).getTime() : Date.now();
      Object.assign(attempt, { status: 1, deadlineAt: new Date(base + minutes * 60000).toISOString(), extendedMinutes: attempt.extendedMinutes + minutes, expiredAt: null, canDecide: false, responseId: null });
      log(2, { minutes, deadlineAt: attempt.deadlineAt, note: body?.note ?? null });
      if (owner) {
        delete responses[owner.id];
        rows[owner.formId] = rows[owner.formId].map((item) => (item === owner.id ? id : item));
        attempts[id] = { id, formId: owner.formId, user: owner.user, task: forms[owner.formId].task, workflow: detailContract(owner).workflow, attempt };
      }
    }
    if (action === "accept" && owner) {
      Object.assign(attempt, { status: 2, canDecide: false, submittedAt: now() });
      owner.status = 1;
      log(4, { note: body?.note ?? null });
      routeOf(owner);
    }
    if (action === "close" && owner) {
      Object.assign(attempt, { status: 4, canDecide: false, closedByTeam: true });
      log(5, { note: body?.note ?? null });
    }
    return [200, { data: true }];
  };

  function route(method, pathname, params, body, user) {
    let match;
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/analytics\/questions\/([^/]+)\/answers$/)) && method === "GET") {
      return rows[match[1]] ? [200, { data: textAnswers(match[1], match[2], params) }] : [404, { message: "Form bulunamadı." }];
    }
    if (pathname.match(/^\/api\/admin\/forms\/([^/]+)\/responses\/export$/)) return [200, { data: "xlsx" }];
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/responses\/([^/]+)\/page$/)) && method === "GET") {
      if (!rows[match[1]]) return [404, { message: "Form bulunamadı." }];
      const position = filteredOf(match[1], params).findIndex((item) => item.id === match[2] && item.status != null);
      return position < 0 ? [404, { message: "Yanıt bu listede yok." }] : [200, { data: { page: Math.floor(position / PAGE_SIZE) + 1 } }];
    }
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/responses$/)) && method === "GET") {
      return rows[match[1]] ? [200, { data: listOf(match[1], params) }] : [404, { message: "Form bulunamadı." }];
    }
    if ((match = pathname.match(/^\/api\/admin\/forms\/responses\/([^/]+)$/)) && method === "GET") {
      const detail = responses[match[1]];
      return detail ? [200, { data: detailContract(detail) }] : [404, { message: "Cevap bulunamadı." }];
    }
    if ((match = pathname.match(/^\/api\/admin\/forms\/responses\/([^/]+)\/status$/)) && method === "PATCH") {
      const detail = responses[match[1]];
      if (!detail) return [404, { message: "Cevap bulunamadı." }];
      decide(detail, body, user);
      return [200, { data: true }];
    }
    if ((match = pathname.match(/^\/api\/admin\/forms\/responses\/([^/]+)\/archive$/)) && method === "POST") {
      const detail = responses[match[1]];
      if (!detail) return [404, { message: "Cevap bulunamadı." }];
      if (detail.status === 1 || detail.status === 5) detail.status = 3;
      Object.assign(detail, { isArchived: true, archivedAt: now(), archiver: user });
      return [200, { data: true }];
    }
    if (pathname.match(/^\/api\/admin\/forms\/responses\/([^/]+)\/share$/) && method === "POST") return [200, { data: { token: "tanitim-cevap", expiresAt: ahead(60) } }];
    if (pathname.match(/^\/api\/admin\/forms\/responses\/([^/]+)\/revoke-token$/) && method === "POST") return [200, { data: true }];
    if ((match = pathname.match(/^\/api\/admin\/forms\/attempts\/([^/]+)$/)) && method === "GET") {
      const view = attempts[match[1]];
      if (view) return [200, { data: view }];
      const owner = Object.values(responses).find((item) => item.attempt?.id === match[1]);
      return owner ? [200, { data: { id: match[1], formId: owner.formId, user: owner.user, attempt: owner.attempt, task: forms[owner.formId].task, workflow: detailContract(owner).workflow } }] : [404, { message: "Kayıt bulunamadı." }];
    }
    if ((match = pathname.match(/^\/api\/admin\/forms\/attempts\/([^/]+)\/(remind|extend|accept|close)$/)) && method === "POST") {
      return attemptAction(match[1], match[2], body, user);
    }
    if ((match = pathname.match(/^\/api\/admin\/workflows\/runs\/([^/]+)\/void$/)) && method === "POST") {
      Object.assign(runOf(match[1]), { status: 4, voidedAt: now(), voidedBy: user, voidNote: body?.note ?? null, canVoid: false });
      return [200, { data: true }];
    }
    return null;
  }

  return {
    route,
    responses,
    rows,
    detailsOf: (formId) => (rows[formId] ?? []).map((id) => responses[id]).filter(Boolean),
    add: (args) => add(makeResponse(args)),
    remove(id) {
      const detail = responses[id];
      if (!detail) return;
      delete responses[id];
      rows[detail.formId] = rows[detail.formId].filter((item) => item !== id);
    },
  };
}
