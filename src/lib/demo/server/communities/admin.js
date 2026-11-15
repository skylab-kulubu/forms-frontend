import { ME } from "../people";
import { IDS, ago, now } from "./seed";
import { computeAnalytics, computeMetrics, kindOf, weeklyService } from "./analytics";

const NAMES = ["Elif Yılmaz", "Mert Aydın", "Zeynep Kaya", "Can Demir", "Deniz Arslan", "Ayşe Çelik", "Burak Şahin", "Ece Doğan", "Kaan Çelik", "Selin Koç", "Arda Polat", "Defne Erdem", "Emre Aksoy", "Nehir Güneş", "Ozan Kurt", "Melis Tunç", "Yiğit Ateş", "Ada Korkmaz", "Umut Bulut", "Sude Kılıç", "Sena Kaya", "Doruk Er", "Ilgın Aksu", "Tuna Bilgin", "Beren Şen", "Efe Tan", "Asya Yalçın", "Kerem Uslu", "Lina Avcı", "Bora Gündüz", "Duru Ersoy", "Alp Kaplan", "Naz Çınar", "Ege Arı", "Pelin Su", "Deren Ay", "İrem Koç", "Mira Tekin", "Baran Öz", "Ceren Uz"];

const PLAN = {
  basvuru: { active: { 3: 21, 2: 2 }, finished: { 5: 32, 7: 2 } },
  gorev: { active: { 3: 8, 0: 3, 1: 15, 2: 2 }, finished: { 5: 3, 6: 4 } },
  katilim: { active: { 0: 3 }, finished: { 4: 41 } },
};
const DEPTHS = { basvuru: 1, gorev: 2, katilim: 3 };
const STEP_TIMING = { basvuru: [93600, 98], gorev: [187200, 41], katilim: [18000, 41] };
const COMPUTED = new Set([IDS.F1, IDS.F4]);

export const responseTotals = () => ({ [IDS.F1]: 142, [IDS.F2]: 36, [IDS.F3]: 12, [IDS.F4]: 9 });
const AGGREGATE = { 3: true, 4: true, 5: true, 6: true };

function seeded(seed) {
  let x = 7;
  for (const ch of String(seed)) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 4294967296;
  };
}

function split(total, labels, rnd) {
  const weights = labels.map(() => 0.3 + rnd());
  const sum = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((weight) => Math.floor((weight / sum) * total));
  counts[0] += total - counts.reduce((a, b) => a + b, 0);
  return labels.map((value, index) => ({ value: String(value), count: counts[index] }));
}

const bucketsOf = (pairs, base) => pairs.filter((bucket) => bucket.count > 0).sort((a, b) => b.count - a.count).map((bucket) => ({ ...bucket, percentage: Math.round((bucket.count / Math.max(1, base)) * 1000) / 10 }));
const shares = (pairs, base) => pairs.map((bucket) => ({ ...bucket, percentage: Math.round((bucket.count / Math.max(1, base)) * 1000) / 10 }));

export function createAdmin({ forms, workflow, responses, totals }) {
  const { F1, F2, F3, W1 } = IDS;
  const extra = {};
  let created = 0;

  const membership = (formId) => {
    const version = workflow.draft ?? workflow.published;
    const node = version.nodes.find((item) => item.formId === formId);
    if (!node) {
      const other = Object.values(extra).find((item) => item.draft?.nodes.some((entry) => entry.formId === formId));
      if (!other) return null;
      const entry = other.draft.nodes.find((item) => item.formId === formId);
      return { id: other.id, name: other.name, isStart: entry.isStart, isPublished: false, allowMultipleRuns: false, intake: 0, requiresManualReview: entry.requiresManualReview, lockedQuestions: [] };
    }
    return {
      id: W1, name: workflow.name, isStart: node.isStart, isPublished: !workflow.draft || Boolean(workflow.published?.nodes.some((item) => item.formId === formId)),
      allowMultipleRuns: workflow.allowMultipleRuns, intake: workflow.intake, requiresManualReview: node.requiresManualReview, lockedQuestions: [{ id: "f5", values: ["WEBLAB"] }],
    };
  };

  const accessOf = (form) => {
    const role = Number(form.userRole ?? 3);
    return { canViewResponses: true, canHandleResponses: role >= 1, canEdit: role >= 2 };
  };

  const formContract = (form) => {
    const contract = { ...form, workflow: membership(form.id), access: accessOf(form) };
    delete contract.demo;
    return contract;
  };

  const versionContract = (version) => (version ? {
    ...version,
    nodes: version.nodes.map((node) => ({ ...node, formTitle: forms[node.formId]?.title ?? "(silinmiş form)", timeLimitMinutes: forms[node.formId]?.timeLimitMinutes ?? null })),
  } : null);

  const extraContract = (item) => ({ ...item, activeRunCount: 0, canEdit: true, draft: versionContract(item.draft), published: null, validation: { isValid: true, errors: [] } });

  const workflowContract = () => ({
    ...workflow, activeRunCount: 61, canEdit: true,
    draft: versionContract(workflow.draft), published: versionContract(workflow.published),
    validation: { isValid: true, errors: [] },
  });

  const runRows = [];
  let personIndex = 0;
  workflow.published.nodes.forEach((node) => {
    const plan = PLAN[node.nodeKey] ?? { active: {}, finished: {} };
    [["active", plan.active], ["finished", plan.finished]].forEach(([kind, groups]) => {
      Object.entries(groups).forEach(([stateText, total]) => {
        const state = Number(stateText);
        for (let i = 0; i < total; i += 1) {
          const name = NAMES[personIndex % NAMES.length];
          const serial = personIndex;
          personIndex += 1;
          const ownResponse = state === 3 || state === 2 || state >= 4;
          runRows.push({
            id: `run-${node.nodeKey}-${state}-${i}`,
            applicant: { id: `u-${serial}`, email: `${name.split(" ")[0].toLocaleLowerCase("tr-TR")}.${serial}@example.com`, fullName: name, profilePictureUrl: null },
            state, nodeKey: node.nodeKey, formId: node.formId, formTitle: forms[node.formId]?.title ?? "Form", sequence: DEPTHS[node.nodeKey] ?? 1, round: state === 2 ? 1 : (i % 7 === 3 ? 2 : 1),
            startedAt: ago(9000 - serial * 40), stepStartedAt: ago(5 + (serial * 37) % 4000),
            deadlineAt: state === 1 ? new Date(Date.now() + ((serial * 97) % 4000 + 30) * 60000).toISOString() : null,
            completedAt: kind === "finished" ? ago((serial * 53) % 8000 + 10) : null,
            latestResponse: ownResponse || node.nodeKey !== "basvuru" ? { id: `resp-${serial}`, formId: ownResponse ? node.formId : F1 } : null,
          });
        }
      });
    });
  });

  const firstPage = Object.fromEntries([F1, F2, F3, IDS.F4].map((formId) => {
    const [, payload] = responses.route("GET", `/api/admin/forms/${formId}/responses`, new URLSearchParams("Page=1"));
    return [formId, (payload?.data?.paginationData?.items ?? []).filter((row) => row.status != null).map((row) => row.id)];
  }));
  runRows.forEach((run, index) => {
    const ids = run.latestResponse ? firstPage[run.latestResponse.formId] : null;
    if (ids?.length) run.latestResponse = { ...run.latestResponse, id: ids[index % ids.length] };
  });

  function overviewOf() {
    const active = runRows.filter((run) => run.state <= 3);
    const ended = (key) => runRows.filter((run) => run.state >= 4 && run.nodeKey === key);
    const steps = workflow.published.nodes.map((node) => {
      const rows = active.filter((run) => run.nodeKey === node.nodeKey);
      const of = (state) => rows.filter((run) => run.state === state).length;
      const endedAs = (state) => ended(node.nodeKey).filter((run) => run.state === state).length;
      return {
        nodeKey: node.nodeKey, formId: node.formId, formTitle: forms[node.formId]?.title ?? "Form", isStart: node.isStart, requiresManualReview: node.requiresManualReview, depth: DEPTHS[node.nodeKey] ?? 1, isRemoved: false,
        count: rows.length, awaitingReview: of(3), awaitingApplicant: of(0), timerRunning: of(1), revisionRequested: of(2),
        finished: { completed: endedAs(4), declined: endedAs(5), timedOut: endedAs(6), voided: endedAs(7), stopped: endedAs(8) },
        ...(STEP_TIMING[node.nodeKey] ? { timing: { medianSeconds: STEP_TIMING[node.nodeKey][0], passed: STEP_TIMING[node.nodeKey][1] } } : {}),
      };
    });
    const { transitions } = workflow.published;
    const reached = (key) => runRows.filter((run) => run.nodeKey === key).length;
    const lastStep = workflow.published.nodes.find((node) => !transitions.some((transition) => transition.sourceNodeKey === node.nodeKey))?.nodeKey;
    const ahead = lastStep ? reached(lastStep) : 0;
    const passed = Math.round(ahead * 0.75);
    const feedsLast = (key) => transitions.some((next) => next.sourceNodeKey === key && next.targetNodeKey === lastStep);
    const routes = transitions.map((transition) => ({
      sourceNodeKey: transition.sourceNodeKey, trigger: transition.trigger, targetNodeKey: transition.targetNodeKey,
      count: !transition.targetNodeKey ? 0 : transition.targetNodeKey === lastStep ? ahead : reached(transition.targetNodeKey) + (feedsLast(transition.targetNodeKey) ? passed : 0),
    }));
    const finishedOf = (state) => runRows.filter((run) => run.state === state).length;
    return {
      activeRunCount: active.length, awaitingReviewCount: active.filter((run) => run.state === 3).length, steps,
      finished: { completed: finishedOf(4), declined: finishedOf(5), timedOut: finishedOf(6), voided: finishedOf(7), stopped: finishedOf(8) },
      routes,
    };
  }

  function runsPage(filter, nodeKey, page, pageSize, state = null) {
    let rows = filter === 2 ? runRows.filter((run) => run.state >= 4) : runRows.filter((run) => run.state <= 3);
    if (filter === 1) rows = rows.filter((run) => run.state === 3);
    if (nodeKey) rows = rows.filter((run) => run.nodeKey === nodeKey);
    if (state != null) rows = rows.filter((run) => run.state === state);
    rows = filter === 2
      ? [...rows].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      : [...rows].sort((a, b) => new Date(a.stepStartedAt) - new Date(b.stepStartedAt));
    const size = Math.min(100, Math.max(1, pageSize));
    return { items: rows.slice((page - 1) * size, page * size), totalCount: rows.length, page, pageSize: size, totalPages: Math.max(1, Math.ceil(rows.length / size)) };
  }

  const SUMMARY_RUNS = {
    activeRunCount: 61, awaitingReviewCount: 40,
    steps: [
      { nodeKey: "basvuru", formId: F1, formTitle: forms[F1].title, isStart: true, requiresManualReview: true, depth: 1, isRemoved: false, count: 37, awaitingReview: 37, awaitingApplicant: 0, timerRunning: 0, revisionRequested: 0 },
      { nodeKey: "gorev", formId: F2, formTitle: forms[F2].title, isStart: false, requiresManualReview: true, depth: 2, isRemoved: false, count: 12, awaitingReview: 3, awaitingApplicant: 6, timerRunning: 2, revisionRequested: 1 },
      { nodeKey: "katilim", formId: F3, formTitle: forms[F3].title, isStart: false, requiresManualReview: false, depth: 3, isRemoved: false, count: 12, awaitingReview: 0, awaitingApplicant: 12, timerRunning: 0, revisionRequested: 0 },
    ],
    finished: { completed: 18, declined: 96, timedOut: 7, voided: 3, stopped: 0 },
  };

  const summary = () => ({
    id: W1, name: workflow.name, status: workflow.status, allowMultipleRuns: false, intake: workflow.intake, startForm: { id: F1, title: forms[F1].title },
    nodeCount: 3, publishedVersion: 3, hasUnpublishedChanges: Boolean(workflow.draft), updatedAt: workflow.updatedAt, runs: SUMMARY_RUNS,
  });

  const available = () => Object.values(forms).map((form) => ({
    id: form.id, title: form.title, requiresManualReview: form.requiresManualReview, isEligible: !form.allowAnonymousResponses, reason: form.allowAnonymousResponses ? "formAnonymous" : null,
    isUsedInThisWorkflow: (workflow.draft ?? workflow.published).nodes.some((node) => node.formId === form.id), timeLimitMinutes: form.timeLimitMinutes,
  }));

  function syntheticAnalytics(form, total, seed, onlyQuestion = null, wanted = null) {
    const rnd = seeded(seed);
    const answers = {};
    const questions = form.schema.map((field) => {
      const kind = kindOf(field);
      const base = { questionId: field.id, question: field.props?.question ?? field.props?.title ?? field.id, type: field.type, kind, aggregatable: ![0, 1, 2, 10].includes(kind) };
      if (kind === 0) return { ...base, answeredCount: 0, skippedCount: 0 };
      let shown = total;
      const condition = field.condition;
      if (condition?.fieldId && answers[condition.fieldId]) shown = answers[condition.fieldId].find((bucket) => bucket.value === condition.value)?.count ?? 0;
      const answered = Math.round(shown * (field.props?.required ? 1 : 0.62 + rnd() * 0.3));
      const out = { ...base, answeredCount: answered, skippedCount: total - answered, askedCount: field.id === "f10" ? answered + 10 : shown };
      if (kind === 3) {
        const pairs = split(answered, field.props.choices ?? [], rnd);
        answers[field.id] = pairs;
        out.distribution = bucketsOf(pairs, answered);
      }
      if (kind === 4) {
        const pairs = (field.props.choices ?? []).map((value) => ({ value, count: Math.round(answered * (0.15 + rnd() * 0.55)) }));
        answers[field.id] = pairs;
        out.distribution = bucketsOf(pairs, answered);
      }
      if (kind === 5) {
        const pairs = split(answered, [field.props.trueLabel || "Evet", field.props.falseLabel || "Hayır"], rnd);
        answers[field.id] = pairs;
        out.distribution = bucketsOf(pairs, answered);
      }
      if (kind === 6) {
        const values = [];
        for (let value = Number(field.props.min ?? 0); value <= Number(field.props.max ?? 10); value += Number(field.props.step ?? 1)) values.push(value);
        const pairs = split(answered, values, rnd);
        out.distribution = bucketsOf(pairs, answered);
        const flat = pairs.flatMap((bucket) => Array(bucket.count).fill(Number(bucket.value))).sort((a, b) => a - b);
        out.numeric = { average: Math.round((flat.reduce((a, b) => a + b, 0) / Math.max(1, flat.length)) * 100) / 100, min: flat[0], max: flat[flat.length - 1], median: flat[Math.floor(flat.length / 2)], count: flat.length };
      }
      if (kind === 7) out.rows = (field.props.rows ?? []).map((row) => ({ row, answeredCount: answered, distribution: bucketsOf(split(answered, field.props.columns ?? [], rnd), answered) }));
      if (kind === 8) out.distribution = shares(split(answered, ["2026-11", "2026-12", "2027-01"], rnd), answered);
      if (kind === 9) out.distribution = shares(split(answered, ["09:00", "13:00", "18:00"], rnd), answered);
      if (field.id === onlyQuestion) Object.assign(out, { answeredCount: total, skippedCount: 0, distribution: [{ value: wanted, count: total, percentage: 100 }] });
      if (form.requiresManualReview && out.distribution && AGGREGATE[kind]) {
        out.distribution = out.distribution.map((bucket) => {
          const approvedCount = Math.round(bucket.count * (0.35 + rnd() * 0.35));
          return { ...bucket, approvedCount, declinedCount: Math.round((bucket.count - approvedCount) * (0.4 + rnd() * 0.4)) };
        });
      }
      return out;
    });
    const decided = questions.find((question) => question.distribution?.[0]?.approvedCount != null)?.distribution ?? [];
    return {
      formId: form.id, totalResponses: total, generatedAt: now(), questions,
      decisions: { approved: decided.reduce((sum, bucket) => sum + bucket.approvedCount, 0), declined: decided.reduce((sum, bucket) => sum + bucket.declinedCount, 0) },
    };
  }

  function analyticsOf(formId, params = null) {
    const answerQuestion = params?.get("AnswerQuestionId");
    if (COMPUTED.has(formId)) {
      return computeAnalytics(forms[formId], responses.detailsOf(formId), {
        status: params?.get("Status") ?? null,
        sinceDays: Number(params?.get("SinceDays")) || null,
        answer: answerQuestion ? { q: answerQuestion, v: params.get("AnswerValue") ?? "" } : null,
      });
    }
    const form = forms[formId];
    if (answerQuestion) {
      const wanted = params.get("AnswerValue") ?? "";
      const bucket = analyticsOf(formId).questions.find((question) => question.questionId === answerQuestion)?.distribution?.find((item) => String(item.value) === wanted);
      return syntheticAnalytics(form, bucket?.count ?? 0, `${formId}:${wanted}`, answerQuestion, wanted);
    }
    return syntheticAnalytics(form, totals[formId] ?? 0, formId);
  }

  function syntheticLifetime(form, total) {
    if (!total) return null;
    const dayMs = 86400000;
    const lastAgo = form.demo?.lastMinutes ?? 60;
    const firstAgo = Math.max(lastAgo + 1440, (form.demo?.createdMinutes ?? 9000) - 720);
    const dateOf = (minutes) => new Date(Date.now() - minutes * 60000).toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
    const first = dateOf(firstAgo);
    const today = dateOf(0);
    const span = Math.max(1, Math.round((new Date(`${dateOf(lastAgo)}T12:00:00Z`) - new Date(`${first}T12:00:00Z`)) / dayMs));
    const rnd = seeded(`life-${form.id}`);
    const weights = Array.from({ length: span + 1 }, (_, day) => 1 / (1 + day * 0.6) + (span - day < 2 ? 0.45 : 0) + rnd() * 0.12);
    const sum = weights.reduce((a, b) => a + b, 0);
    const counts = weights.map((weight) => Math.floor((weight / sum) * total));
    counts[0] += total - counts.reduce((a, b) => a + b, 0);
    counts[span] = Math.max(1, counts[span]);
    counts[0] -= counts.reduce((a, b) => a + b, 0) - total;
    const days = [];
    for (let cursor = new Date(`${first}T12:00:00Z`).getTime(), index = 0; ; cursor += dayMs, index += 1) {
      const date = new Date(cursor).toISOString().slice(0, 10);
      days.push({ date, count: counts[index] ?? 0 });
      if (date >= today) break;
    }
    return { closesAt: form.status === 1 && form.demo?.listOnly ? ago(form.demo.lastMinutes - 90) : null, days };
  }

  function metricsOf(formId) {
    const form = forms[formId];
    if (COMPUTED.has(formId)) return computeMetrics(form, responses.detailsOf(formId), { reviewed: form.requiresManualReview });
    const total = totals[formId] ?? 0;
    const reviewed = form.requiresManualReview;
    const pending = form.demo?.pending ?? (reviewed ? Math.round(total * 0.16) : 0);
    const approved = reviewed ? Math.round(total * 0.61) : 0;
    const days = Array.from({ length: 7 }, (_, index) => new Date(Date.now() - (6 - index) * 86400000).toLocaleDateString("tr-TR", { weekday: "short", timeZone: "Europe/Istanbul" }));
    const rnd = seeded(`m-${formId}`);
    const lifetime = syntheticLifetime(form, total);
    const tail = lifetime ? lifetime.days.slice(-7).map((day) => day.count) : [];
    const weekCounts = [...Array(7 - tail.length).fill(0), ...tail];
    const quiet = (form.demo?.lastMinutes ?? 0) > 2 * 1440;
    const metrics = {
      totalResponses: total, pendingCount: pending, approvedCount: approved, rejectedCount: reviewed ? total - pending - approved : 0,
      averageCompletionTime: 412, dailyTrendPercentage: (form.demo?.lastMinutes ?? 0) > 14 * 1440 ? 0 : 12.5, hourlyTrendPercentage: quiet ? 0 : -8.3,
      sourceBreakdown: { registered: total, anonymous: 0 },
      dailyTrend: days.map((label, index) => ({ key: `d${index}`, label, count: lifetime ? weekCounts[index] : Math.round(rnd() * total * 0.25) })),
      hourlyTrend: ["16", "18", "20", "22", "00", "02", "04", "06", "08", "10", "12", "14"].map((label, index) => ({ key: `h${index}`, label, count: quiet ? 0 : Math.round(rnd() * 6) })),
      channels: [],
      ...(lifetime ? { lifetime } : {}),
    };
    if (!metrics.totalResponses) return { ...metrics, averageCompletionTime: null, medianCompletionTime: null };
    return { ...metrics, medianCompletionTime: Math.round(metrics.averageCompletionTime * 0.92) };
  }

  function withFunnel(formId, metrics) {
    const day = 86400000;
    if (formId === F1) {
      return { ...metrics, funnel: { event: { id: "e-kamp", name: "Kış Kampı 2026", startsAt: new Date(Date.now() + 89 * day).toISOString() }, formCount: 1, tickets: metrics.approvedCount, checkedIn: 0, feedbackSent: 0, feedbackAnswered: 0 } };
    }
    if (forms[formId]?.title === "Teknik Gezi Kayıt Formu") {
      const checkedIn = Math.round(metrics.approvedCount * 0.78);
      return { ...metrics, funnel: { event: { id: "e-gezi", name: "Teknik Gezi", startsAt: new Date(Date.now() - 8 * day).toISOString() }, formCount: 1, tickets: metrics.approvedCount, checkedIn, feedbackSent: checkedIn, feedbackAnswered: Math.round(checkedIn * 0.57) } };
    }
    return metrics;
  }

  const ATTEMPTS = {
    timeLimitMinutes: 90, opened: 34, started: 31, submitted: 18, provisional: 1, running: 9, noSubmission: 5,
    durationMinutes: [12, 18, 25, 31, 34, 40, 44, 51, 55, 58, 61, 66, 70, 72, 79, 84, 86, 89], extendedPeople: 2, extendedMinutes: 30, extendedBy: [], stalledQuestion: null, expiredWithDraft: 1,
  };

  function workflowRoute(method, pathname, params, body) {
    let match;
    if (method === "GET" && pathname === "/api/admin/workflows") return [200, { data: { items: [summary()], totalCount: 1, page: 1, pageSize: 10 } }];
    if (method === "GET" && pathname === "/api/admin/workflows/available-forms") return [200, { data: available() }];
    if (method === "POST" && pathname === "/api/admin/workflows") {
      const id = `5e1f0a2b-0000-4000-8000-${String(++created).padStart(12, "0")}`;
      extra[id] = { id, name: body.name, description: body.description ?? "", status: 0, allowMultipleRuns: false, intake: 0, intakeClosesAt: null, owner: ME, createdAt: now(), updatedAt: now(), published: null, draft: { id: `d-${id}`, version: 1, status: 0, publishedAt: null, nodes: [], transitions: [] } };
      return [200, { data: extraContract(extra[id]) }];
    }
    if ((match = pathname.match(/^\/api\/admin\/workflows\/([^/]+)$/))) {
      const own = extra[match[1]];
      if (method === "GET" && own) return [200, { data: extraContract(own) }];
      if (method === "PUT" && own) {
        Object.assign(own, { name: body.name, description: body.description });
        return [200, { data: extraContract(own) }];
      }
      if (method === "GET") return match[1] === W1 ? [200, { data: workflowContract() }] : [404, { message: "Akış bulunamadı." }];
      if (method === "PUT") {
        Object.assign(workflow, { name: body.name, description: body.description, allowMultipleRuns: body.allowMultipleRuns, updatedAt: now() });
        return [200, { data: workflowContract() }];
      }
      if (method === "DELETE") return [200, { data: true }];
    }
    if ((match = pathname.match(/^\/api\/admin\/workflows\/([^/]+)\/definition$/)) && method === "PUT") {
      const draft = { version: 1, status: 0, publishedAt: null, nodes: body.nodes.map((node) => ({ ...node })), transitions: body.transitions.map((transition) => ({ ...transition })) };
      if (extra[match[1]]) {
        extra[match[1]].draft = { id: `d-${match[1]}`, ...draft };
        return [200, { data: extraContract(extra[match[1]]) }];
      }
      workflow.draft = { ...draft, id: "v2", version: 4 };
      return [200, { data: workflowContract() }];
    }
    if ((match = pathname.match(/^\/api\/admin\/workflows\/([^/]+)\/versions$/))) {
      return [200, { data: extra[match[1]] ? [] : [{ id: "v1", version: 3, status: 1, publishedAt: workflow.published.publishedAt, nodeCount: 3 }] }];
    }
    if (pathname.match(/^\/api\/admin\/workflows\/([^/]+)\/available-forms$/)) return [200, { data: available() }];
    if (pathname.match(/^\/api\/admin\/workflows\/([^/]+)\/runs\/overview$/)) return [200, { data: overviewOf() }];
    if (pathname.match(/^\/api\/admin\/workflows\/([^/]+)\/runs$/)) {
      const state = params.get("State");
      return [200, { data: runsPage(Number(params.get("Filter") ?? 0), params.get("NodeKey"), Number(params.get("Page") ?? 1), Number(params.get("PageSize") ?? 20), state == null ? null : Number(state)) }];
    }
    if (pathname.match(/^\/api\/admin\/workflows\/([^/]+)\/publish$/)) {
      workflow.published = { ...workflow.draft, status: 1, publishedAt: now() };
      workflow.draft = null;
      return [200, { data: { isValid: true, errors: [] } }];
    }
    if ((match = pathname.match(/^\/api\/admin\/workflows\/([^/]+)\/(intake|intake-schedule)$/))) {
      if (match[2] === "intake") workflow.intake = body.intake;
      else workflow.intakeClosesAt = body.closesAt;
      return [200, { data: workflowContract() }];
    }
    return null;
  }

  function formRoute(method, pathname, body) {
    let match;
    if (method === "GET" && pathname === "/api/admin/forms/metrics") return [200, { data: weeklyService() }];
    if (method === "GET" && pathname === "/api/admin/forms") {
      const items = Object.values(forms).filter((form) => Number(form.userRole ?? 3) >= 1 && !form.demo?.listOnly).map((form) => ({ id: form.id, title: form.title, status: form.status, userRole: form.userRole ?? 3, updatedAt: form.updatedAt, workflow: membership(form.id) }));
      return [200, { data: { items, totalCount: items.length, page: 1, pageSize: 50, totalPages: 1 } }];
    }
    if (method === "POST" && pathname === "/api/admin/forms") {
      const id = `00000000-0000-4000-8000-${String(++created).padStart(12, "0")}`;
      forms[id] = { id, title: body.Title, description: body.Description ?? "", status: body.Status, allowMultipleResponses: false, allowAnonymousResponses: false, requiresManualReview: Boolean(body.RequiresManualReview), task: null, closesAt: null, timeLimitMinutes: null, collaborators: [{ user: ME, role: 3 }], userRole: 3, createdAt: now(), updatedAt: now(), schema: body.Schema ?? [] };
      return [200, { data: formContract(forms[id]) }];
    }
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/metrics$/)) && method === "GET") {
      return forms[match[1]] ? [200, { data: withFunnel(match[1], metricsOf(match[1])) }] : [404, { message: "Form bulunamadı." }];
    }
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/attempts\/analytics$/)) && method === "GET") return [200, { data: ATTEMPTS }];
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/short-link$/)) && method === "GET") return [200, { data: match[1] === F1 ? { alias: "kis-kampi-26", formId: F1 } : null }];
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/info$/)) && method === "GET") {
      const form = forms[match[1]];
      return form ? [200, { data: { id: form.id, title: form.title, status: form.status, userRole: form.userRole ?? 3, workflow: membership(form.id), access: accessOf(form) } }] : [404, { message: "Form bulunamadı." }];
    }
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/draft$/))) return method === "GET" ? [404, { message: "Taslak yok." }] : [200, { data: true }];
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)$/))) {
      const form = forms[match[1]];
      if (method === "GET") return form ? [200, { data: formContract(form) }] : [404, { message: "Form bulunamadı." }];
      if (method === "PUT" && form) {
        Object.assign(form, {
          title: body.Title, description: body.Description, schema: body.Schema, status: body.Status, allowMultipleResponses: body.AllowMultipleResponses,
          allowAnonymousResponses: body.AllowAnonymousResponses, requiresManualReview: body.RequiresManualReview, task: body.Task, closesAt: body.ClosesAt,
          timeLimitMinutes: body.TimeLimitMinutes, updatedAt: now(),
        });
        return [200, { data: formContract(form) }];
      }
    }
    return null;
  }

  function analyticsRoute(method, pathname, params) {
    const match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/analytics$/);
    if (!match || method !== "GET") return null;
    return forms[match[1]] ? [200, { data: analyticsOf(match[1], params) }] : [404, { message: "Form bulunamadı." }];
  }

  return {
    membership,
    formContract,
    metricsOf,
    route(method, pathname, params, body) {
      return workflowRoute(method, pathname, params, body) ?? analyticsRoute(method, pathname, params) ?? formRoute(method, pathname, body);
    },
  };
}
