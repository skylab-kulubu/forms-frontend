import { applyAll, applyTracked, compact, isTrustedOp, normalizeDocument, normalizeOpValue } from "./doc-ops.js";
import { createHistory } from "./doc-history.js";
import { schemaOps } from "./schema-ops.js";

const TYPING_FLUSH_MS = 300;
const GAP_WAIT_MS = 400;
const RETRY_DELAYS_MS = [1000, 2000, 5000, 10000, 30000];
const MAX_OPS_PER_BATCH = 200;

export const EDIT_ROLE = 2;

const newBatchId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);

export function createStudioDoc({ snapshot = null, initial = null, userId = null, transport, onNotice = () => {}, onCreated = () => {} }) {
  const listeners = new Set();
  const waiters = new Set();
  const history = createHistory();
  const early = new Map();

  let form = snapshot?.form ?? null;
  let id = form?.id ?? null;
  let confirmed = snapshot ? snapshot.working.document : normalizeDocument(initial ?? {});
  let version = snapshot?.working.version ?? 0;
  let published = snapshot?.published ?? null;
  let dirty = snapshot ? Boolean(snapshot.working.dirty) : true;
  let team = form?.collaborators ?? [];
  let canEdit = form ? Number(form.userRole) >= EDIT_ROLE : true;
  let online = false;
  let inflight = null;
  let queue = [];
  let view = confirmed;
  let syncedAt = snapshot?.working.updatedAt ? new Date(snapshot.working.updatedAt) : null;
  let publishedAt = null;
  let failure = null;
  let creating = null;
  let catching = null;
  let flushTimer = null;
  let retryTimer = null;
  let gapTimer = null;
  let retries = 0;
  let cached = null;
  let disposed = false;
  let legacyAdopted = false;

  const pending = () => Boolean(inflight) || queue.length > 0 || Boolean(creating);

  function emit() {
    cached = null;
    listeners.forEach((listener) => listener());
    if (!pending()) {
      waiters.forEach((resolve) => resolve(true));
      waiters.clear();
    }
  }

  function getSnapshot() {
    if (!cached) {
      cached = {
        id, view, version, dirty, form, team, canEdit, online, syncedAt, publishedAt, failure,
        pending: pending(),
        canUndo: canEdit && history.canUndo(),
        canRedo: canEdit && history.canRedo(),
        neverPublished: !form || Number(form.publishedVersion ?? 1) === 0,
      };
    }
    return cached;
  }

  function rebuild() {
    view = applyAll(confirmed, [...(inflight?.ops ?? []), ...queue], published);
    emit();
  }

  function schedule(delay) {
    if (flushTimer && delay > 0) return;
    clearTimeout(flushTimer);
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flush();
    }, delay);
  }

  function flush() {
    if (disposed || inflight || queue.length === 0) return;
    if (!id) {
      create();
      return;
    }
    if (!online || !canEdit) return;

    const ops = compact(queue);
    inflight = { batchId: newBatchId(), ops: ops.slice(0, MAX_OPS_PER_BATCH) };
    queue = ops.slice(MAX_OPS_PER_BATCH);
    send(inflight);
  }

  function retryLater() {
    const delay = RETRY_DELAYS_MS[Math.min(retries, RETRY_DELAYS_MS.length - 1)];
    retries += 1;
    if (retries === 3) {
      failure = "Değişiklikler kaydedilemiyor; tekrar deneniyor.";
      emit();
    }
    clearTimeout(retryTimer);
    retryTimer = setTimeout(() => {
      if (inflight && online && !disposed) send(inflight);
    }, delay);
  }

  async function send(batch) {
    let result;
    try {
      result = await transport.submit(id, batch);
    } catch {
      if (inflight === batch) retryLater();
      return;
    }
    if (inflight !== batch || disposed) return;

    const status = Number(result?.status);
    if (status === 200) {
      retries = 0;
      failure = null;
      const outcome = result.data;
      if (outcome.skipped) onNotice("Düzenlediğiniz soru bu sırada silindi.", "neutral");
      if (outcome.version === null || outcome.version === undefined) {
        inflight = null;
        dirty = Boolean(outcome.dirty);
        rebuild();
        flush();
        return;
      }
      receive({ ...outcome, batchId: batch.batchId });
      return;
    }

    if (status === 400) {
      inflight = null;
      failure = result.message ?? "Değişiklik kaydedilemedi.";
      onNotice(failure, "red");
      rebuild();
      flush();
      return;
    }

    if (status === 403 || status === 404) {
      inflight = null;
      queue = [];
      canEdit = false;
      failure = result.message ?? "Bu formu düzenleme yetkiniz yok.";
      onNotice(failure, "red");
      rebuild();
      return;
    }

    retryLater();
  }

  function settle(batchId) {
    if (!inflight || inflight.batchId !== batchId) return;
    inflight = null;
    syncedAt = new Date();
    rebuild();
    flush();
  }

  function receive(edit) {
    if (!edit || typeof edit.version !== "number" || disposed) return;

    if (edit.version <= version) {
      settle(edit.batchId);
      return;
    }

    if (edit.version > version + 1) {
      early.set(edit.version, edit);
      clearTimeout(gapTimer);
      gapTimer = setTimeout(() => {
        if (early.size > 0) catchUp();
      }, GAP_WAIT_MS);
      return;
    }

    confirmed = applyAll(confirmed, (edit.ops ?? []).filter(isTrustedOp), published);
    version = edit.version;
    dirty = Boolean(edit.dirty);
    if (inflight?.batchId === edit.batchId) {
      inflight = null;
      syncedAt = new Date();
    }

    [...early.keys()].forEach((key) => { if (key <= version) early.delete(key); });
    const next = early.get(version + 1);
    if (next) {
      receive(next);
      return;
    }

    rebuild();
    flush();
  }

  async function joined(reply) {
    if (Number(reply?.status) !== 200) {
      if ([403, 404].includes(Number(reply?.status))) {
        canEdit = false;
        failure = reply.message ?? "Bu formu açma yetkiniz yok.";
        onNotice(failure, "red");
        emit();
      }
      return;
    }

    online = true;
    canEdit = Boolean(reply.data.canEdit);
    const resend = inflight;

    if (reply.data.snapshotRequired) await reload();
    else reply.data.edits.forEach(receive);

    if (resend && inflight === resend) send(resend);
    else flush();
    emit();
  }

  async function catchUp() {
    if (!id || !online) return null;
    if (!catching) {
      catching = transport.join(id, version).then(joined, () => null).finally(() => { catching = null; });
    }
    return catching;
  }

  async function reload() {
    if (!id) return;
    try {
      const next = await transport.snapshot(id);
      confirmed = next.working.document;
      version = next.working.version;
      dirty = Boolean(next.working.dirty);
      published = next.published ?? published;
      form = next.form ?? form;
      team = form?.collaborators ?? team;
      canEdit = Number(form?.userRole ?? 0) >= EDIT_ROLE;
      early.clear();
      rebuild();
    } catch {
      onNotice("Form yeniden yüklenemedi. Sayfayı yenileyin.", "red");
    }
  }

  async function create() {
    if (creating || !canEdit) return creating;
    const document = view;
    const included = queue.length;

    creating = transport.start(document)
      .then((created) => {
        form = created.form;
        id = form.id;
        team = form.collaborators ?? team;
        published = created.published ?? null;
        version = created.working.version;
        dirty = Boolean(created.working.dirty);
        confirmed = created.working.document;
        queue = queue.slice(included);
        syncedAt = new Date();
        creating = null;
        rebuild();
        onCreated(api);
      })
      .catch((error) => {
        creating = null;
        failure = error?.message ?? "Form oluşturulamadı.";
        onNotice(failure, "red");
        emit();
      });

    emit();
    return creating;
  }

  function edit(ops, { record = true, group = true } = {}) {
    if (disposed || !canEdit || !ops.length) return false;

    const result = applyTracked(view, ops, published);
    if (!result.applied.length) return false;

    if (record) history.record(result.inverse, result.applied, { group });
    queue.push(...result.applied);
    view = result.document;
    failure = null;
    emit();
    schedule(result.applied.every((op) => op.op === "set") ? TYPING_FLUSH_MS : 0);
    return true;
  }

  function travel(direction) {
    if (!canEdit) return;
    const result = direction < 0 ? history.undo(view, published) : history.redo(view, published);
    if (!result) return;

    if (result.ops.length) {
      queue.push(...result.ops);
      view = applyAll(view, result.ops, published);
      schedule(0);
    }
    if (result.skipped) onNotice("Bu değişikliği sonradan başkası değiştirdi; o kısım atlandı.", "neutral");
    emit();
  }

  function whenSynced(timeoutMs = 15000) {
    flush();
    if (!pending()) return Promise.resolve(true);
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        waiters.delete(done);
        resolve(false);
      }, timeoutMs);
      const done = (value) => {
        clearTimeout(timer);
        resolve(value);
      };
      waiters.add(done);
    });
  }

  async function syncedVersion() {
    if (!(await whenSynced()) || !id) throw new Error("Değişiklikler henüz gönderilemedi. Bağlantıyı kontrol edip tekrar deneyin.");
    return version;
  }

  function applySaved(saved, at) {
    form = { ...saved };
    team = saved.collaborators ?? team;
    publishedAt = new Date();
    if (version === at) dirty = false;
    emit();
    return saved;
  }

  async function publish() {
    const at = await syncedVersion();
    return applySaved(await transport.publish(id, at), at);
  }

  function onPublished(event) {
    if (!event) return;
    published = event.published ?? published;
    form = form ? { ...form, publishedVersion: event.publishedVersion } : form;
    if (event.workingVersion === version) dirty = Boolean(event.dirty);
    publishedAt = new Date();
    emit();
  }

  function applyTeam(collaborators) {
    team = collaborators ?? [];
    const mine = team.find((member) => member.user?.id === userId);
    const role = Number(mine?.role ?? 0);
    form = form ? { ...form, collaborators: team, userRole: role } : form;
    if (role < EDIT_ROLE && canEdit && form) {
      canEdit = false;
      queue = [];
      failure = role === 0 ? "Bu formun düzenleme ekibinden çıkarıldınız." : "Bu formu artık düzenleyemezsiniz.";
      onNotice(failure, "red");
      rebuild();
      return;
    }
    emit();
  }

  async function setTeam(collaborators) {
    if (!canEdit) return false;
    if (!id) {
      team = collaborators;
      emit();
      return true;
    }

    const previous = team;
    team = collaborators;
    emit();

    try {
      const saved = await transport.team(id, collaborators.map((member) => ({ userId: member.user.id, role: Number(member.role) })));
      applyTeam(saved);
      return true;
    } catch (error) {
      team = previous;
      onNotice(error?.message ?? "Düzenleme ekibi kaydedilemedi.", "red");
      emit();
      return false;
    }
  }

  function adoptLegacyDraft(draft) {
    if (legacyAdopted || !draft || !id) return false;
    legacyAdopted = true;
    if (version !== 0 || !canEdit) return false;
    return edit([{ op: "replace", document: normalizeDocument(draft) }], { record: false });
  }

  function seed(partial) {
    if (id) return;
    confirmed = normalizeDocument({ ...confirmed, ...partial });
    rebuild();
  }

  function setOnline(value) {
    if (online === value) return;
    online = value;
    if (!value) clearTimeout(retryTimer);
    emit();
  }

  function dispose() {
    disposed = true;
    [flushTimer, retryTimer, gapTimer].forEach(clearTimeout);
    listeners.clear();
  }

  const api = {
    get id() {
      return id;
    },
    get version() {
      return version;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot,
    getView: () => view,
    edit,
    set: (path, value) => edit([{ op: "set", path, value: normalizeOpValue(path, value) }]),
    setSchema: (next) => edit(schemaOps(view.schema, next)),
    discard: () => edit([{ op: "reset" }], { group: false }),
    replaceWith: (document, options) => edit([{ op: "replace", document: normalizeDocument(document) }], { group: false, ...options }),
    undo: () => travel(-1),
    redo: () => travel(1),
    seed,
    adoptLegacyDraft,
    setTeam,
    publish,
    syncedVersion,
    applySaved,
    whenSynced,
    ensureCreated: () => (id ? Promise.resolve(api) : create().then(() => api)),
    receive,
    joined,
    catchUp,
    reload,
    setOnline,
    onPublished,
    onTeam: (event) => applyTeam(event?.collaborators),
    hasPending: pending,
    dispose,
  };

  return api;
}
