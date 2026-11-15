import { EGE } from "../people";
import { IDS, now } from "./seed";

const ATTRIBUTION = { source: "instagram", medium: "social", campaign: "kis-kampi", term: null, content: null };
const TYPICAL_SECONDS = 212;

const displayContract = (form) => ({
  id: form.id, title: form.title, description: form.description, schema: form.schema, requiresManualReview: form.requiresManualReview, task: form.task,
  closesAt: form.closesAt, timeLimitMinutes: form.timeLimitMinutes, allowAnonymousResponses: form.allowAnonymousResponses, brand: form.brand ?? null,
});

export function createApplicant({ forms, workflow, responses }) {
  const { F1, F2 } = IDS;
  const records = new Map();

  const recordOf = (user) => {
    if (!user) return null;
    if (!records.has(user.id)) records.set(user.id, { responseId: null, instanceId: `inst-tanitim-${user.id.slice(0, 4)}` });
    return records.get(user.id);
  };
  const inFlow = (formId) => workflow.published.nodes.some((node) => node.formId === formId);
  const responseOf = (record) => (record?.responseId ? responses.responses[record.responseId] ?? null : null);

  function submitAs(user, form, answers, record, timeSpent = 0) {
    if (record?.responseId) responses.remove(record.responseId);
    const detail = responses.add({
      formId: form.id, user, status: form.requiresManualReview ? 1 : 0, minutes: 0, answers,
      workflow: inFlow(form.id) ? { instanceId: record?.instanceId ?? "inst-tanitim", stage: 1, steps: [], round: 1, run: null } : null,
      attribution: ATTRIBUTION,
    });
    detail.timeSpent = Number(timeSpent) > 20 ? Number(timeSpent) : TYPICAL_SECONDS;
    if (record) {
      record.responseId = detail.id;
      record.answers = answers;
    }
    return detail;
  }

  function journeyOf(formId, record) {
    const order = workflow.published.nodes;
    const detail = responseOf(record);
    const status = detail ? Number(detail.status) : null;
    const route = order.map((node, position) => {
      const base = { stage: position + 1, formTitle: forms[node.formId].title, certain: true, requiresManualReview: node.requiresManualReview, submittedAt: null, reviewedAt: null, reviewNote: null, revision: null };
      if (position === 0) {
        if (status === 2) return { ...base, status: "approved", submittedAt: detail.submittedAt, reviewedAt: detail.reviewedAt, reviewNote: detail.reviewerNote };
        if (status === 3) return { ...base, status: "declined", submittedAt: detail.submittedAt, reviewedAt: detail.reviewedAt, reviewNote: detail.reviewerNote };
        if (status === 1) return { ...base, status: "inReview", submittedAt: detail.submittedAt };
        return { ...base, status: "current" };
      }
      if (position === 1 && status === 2) return { ...base, status: "current" };
      return { ...base, status: "upcoming" };
    });
    return { title: workflow.name, route, maxSteps: order.length, index: order.findIndex((node) => node.formId === formId) };
  }

  function openForm(form, user) {
    const flow = inFlow(form.id);
    const record = recordOf(user);
    const detail = responseOf(record);
    const shared = { stage: flow ? 1 : 0, state: flow ? 1 : null, startFormId: flow ? F1 : null, workflow: flow ? journeyOf(form.id, record) : null, instanceId: flow ? record?.instanceId ?? null : null };

    if (detail && detail.formId === form.id && Number(detail.status) === 2 && flow) {
      const next = forms[F2];
      return [200, { status: 200, data: {
        ...shared, stage: 2, form: displayContract(next), serverNow: now(), closesAt: null, guestUploads: null, revision: null, lastRun: null,
        attempt: { state: "notStarted", timeLimitMinutes: next.timeLimitMinutes, deliverables: next.schema.map((field) => field.props?.question).filter(Boolean), startClosesAt: null },
      } }];
    }
    if (detail && detail.formId === form.id) {
      const status = Number(detail.status);
      const code = status === 2 ? 601 : status === 3 ? 602 : form.requiresManualReview ? 600 : 201;
      return [200, { status: code, data: { ...shared, state: status === 2 ? 3 : status === 3 ? 4 : 2, form: null, formTitle: form.title, submittedAt: detail.submittedAt, reviewNote: detail.reviewerNote, reviewedAt: detail.reviewedAt } }];
    }
    return [200, { status: 200, data: { ...shared, form: displayContract(form), attempt: null, serverNow: now(), closesAt: null, guestUploads: null, revision: null, lastRun: null } }];
  }

  function route(method, pathname, body, user) {
    let match;
    if ((match = pathname.match(/^\/api\/forms\/([^/]+)\/meta$/)) && method === "GET") {
      const form = forms[match[1]];
      return form ? [200, { status: 200, data: { title: form.title, description: form.description, brand: form.brand ?? null } }] : [404, { status: 404, message: "Form bulunamadı.", data: null }];
    }
    if (pathname === "/api/forms/responses" && method === "POST") {
      const form = forms[body?.formId];
      if (!form) return [404, { status: 404, message: "Form bulunamadı.", data: null }];
      if (!user && !form.allowAnonymousResponses) return [401, { status: 401, message: "Giriş yapmalısınız.", data: null }];
      const record = recordOf(user);
      const answers = Object.fromEntries((body.responses ?? []).map((entry) => [entry.id, entry.answer]));
      const detail = submitAs(user ?? EGE, form, answers, record, body.timeSpent);
      const flow = inFlow(form.id);
      return [200, { status: form.requiresManualReview ? 600 : 201, message: "Cevabınız kaydedildi.", data: {
        responseId: detail.id, stage: flow ? 1 : 0, state: flow ? 2 : null, workflow: flow ? journeyOf(form.id, record) : null, instanceId: record?.instanceId ?? null, startFormId: flow ? F1 : null,
      } }];
    }
    if (pathname.startsWith("/api/forms/responses/draft")) return [200, { status: 200, data: null }];
    if ((match = pathname.match(/^\/api\/forms\/([^/]+)$/)) && method === "GET") {
      const form = forms[match[1]];
      if (!form) return [404, { status: 404, message: "Form bulunamadı.", data: null }];
      if (!user && !form.allowAnonymousResponses) return [401, { status: 401, message: "Giriş yapmalısınız.", data: null }];
      return openForm(form, user);
    }
    if (pathname.startsWith("/api/forms/")) return [200, { status: 200, data: null }];
    return null;
  }

  const control = {
    state() {
      const record = records.get(EGE.id) ?? null;
      return { applicant: record, responseStatus: responseOf(record)?.status ?? null };
    },
    reset() {
      const record = records.get(EGE.id);
      if (record?.responseId) responses.remove(record.responseId);
      records.delete(EGE.id);
    },
    ensure(answers) {
      const record = recordOf(EGE);
      if (!responseOf(record)) submitAs(EGE, forms[F1], answers ?? {}, record);
      return { responseId: record.responseId, status: responseOf(record).status };
    },
    pending(answers) {
      const record = recordOf(EGE);
      const known = responseOf(record);
      if (known && Number(known.status) !== 1) submitAs(EGE, forms[F1], record.answers ?? answers ?? {}, record);
      return { responseId: record.responseId };
    },
  };

  return { route, control };
}
