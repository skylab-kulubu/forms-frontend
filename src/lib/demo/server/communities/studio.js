import { PEOPLE, TEAM } from "../people";
import { freshBuildForm, now } from "./seed";

const DOCUMENT_KEYS = ["title", "description", "schema", "status", "allowAnonymousResponses", "allowMultipleResponses", "requiresManualReview", "task", "closesAt", "timeLimitMinutes", "brand"];

const documentOf = (form) => Object.fromEntries(DOCUMENT_KEYS.map((key) => [key, form[key] ?? (key === "schema" ? [] : null)]));

export function createStudio({ forms, formContract }) {
  const sessions = new Map();
  let seq = 0;
  const newId = (prefix) => `${prefix}${String(++seq).padStart(7, "0")}-0000-4000-8000-${String(seq).padStart(12, "0")}`;

  const sessionOf = (formId) => {
    if (!sessions.has(formId)) sessions.set(formId, { version: 1, threads: [], reads: [] });
    return sessions.get(formId);
  };

  const snapshotOf = (form) => ({
    form: { ...formContract(form), collaborators: form.collaborators ?? TEAM, userRole: 3, publishedVersion: form.publishedVersion ?? 1 },
    working: { document: documentOf(form), version: sessionOf(form.id).version, dirty: false, updatedAt: form.updatedAt },
    published: Number(form.publishedVersion ?? 1) === 0 ? null : documentOf(form),
  });

  function comments(method, formId, rest, body, user) {
    const state = sessionOf(formId);
    const comment = (text) => ({ id: newId("c"), author: { id: user.id, fullName: user.fullName, email: user.email }, body: text, createdAt: now(), editedAt: null });
    const threadOf = (id) => state.threads.find((thread) => thread.id === id);
    const threadOfComment = (commentId) => state.threads.find((thread) => thread.comments.some((item) => item.id === commentId));

    if (rest.length === 0 && method === "GET") return [200, { data: state.threads }];
    if (rest.length === 0 && method === "POST") {
      const thread = { id: newId("t"), fieldId: body.fieldId, resolvedAt: null, resolvedBy: null, comments: [comment(body.body)] };
      state.threads.push(thread);
      return [200, { data: thread }];
    }
    if (rest[0] === "reads" && method === "GET") return [200, { data: state.reads }];
    if (rest[1] === "read" && method === "POST") return [200, { data: true }];
    if (rest[1] === "replies" && method === "POST") {
      const thread = threadOf(rest[0]);
      if (!thread) return [404, { message: "Yorum bulunamadı." }];
      thread.comments.push(comment(body.body));
      return [200, { data: thread }];
    }
    if ((rest[1] === "resolve" || rest[1] === "reopen") && method === "POST") {
      const thread = threadOf(rest[0]);
      if (!thread) return [404, { message: "Yorum bulunamadı." }];
      const resolved = rest[1] === "resolve";
      Object.assign(thread, { resolvedAt: resolved ? now() : null, resolvedBy: resolved ? { id: user.id, fullName: user.fullName } : null });
      return [200, { data: thread }];
    }
    if (rest.length === 1 && method === "PUT") {
      const thread = threadOfComment(rest[0]);
      if (!thread) return [404, { message: "Yorum bulunamadı." }];
      Object.assign(thread.comments.find((entry) => entry.id === rest[0]), { body: body.body, editedAt: now() });
      return [200, { data: thread }];
    }
    if (rest.length === 1 && method === "DELETE") {
      const thread = threadOfComment(rest[0]);
      if (!thread) return [404, { message: "Yorum bulunamadı." }];
      thread.comments = thread.comments.filter((entry) => entry.id !== rest[0]);
      if (thread.comments.length === 0) state.threads = state.threads.filter((item) => item !== thread);
      return [200, { data: thread }];
    }
    return null;
  }

  function route(method, pathname, body, user) {
    let match;
    if (method === "POST" && pathname === "/api/admin/forms/studio") {
      const id = newId("n");
      forms[id] = { ...freshBuildForm(id), ...(body?.document ?? {}), collaborators: [{ user, role: 3 }], createdAt: now(), updatedAt: now() };
      return [200, { data: snapshotOf(forms[id]) }];
    }
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/studio$/)) && method === "GET") {
      const form = forms[match[1]];
      return form ? [200, { data: snapshotOf(form) }] : [404, { message: "Form bulunamadı." }];
    }
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/studio\/publish$/)) && method === "POST") {
      const form = forms[match[1]];
      if (!form) return [404, { message: "Form bulunamadı." }];
      if (body?.document) Object.assign(form, body.document);
      form.publishedVersion = Number(form.publishedVersion ?? 0) + 1;
      form.updatedAt = now();
      return [200, { data: snapshotOf(form).form }];
    }
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/collaborators$/)) && method === "PUT") {
      const form = forms[match[1]];
      if (!form) return [404, { message: "Form bulunamadı." }];
      form.collaborators = (body?.collaborators ?? []).map((item) => ({ user: PEOPLE[item.userId] ?? { id: item.userId, fullName: "Editör", email: "" }, role: item.role }));
      return [200, { data: form.collaborators }];
    }
    if ((match = pathname.match(/^\/api\/admin\/forms\/([^/]+)\/comments(\/.*)?$/))) {
      return comments(method, match[1], (match[2] ?? "").split("/").filter(Boolean), body, user);
    }
    return null;
  }

  return {
    route,
    resetBuild(formId) {
      forms[formId] = freshBuildForm(formId);
      sessions.delete(formId);
    },
  };
}
