import { HubConnectionBuilder, HubConnectionState, LogLevel } from "@microsoft/signalr";
import { createStudioDoc } from "./doc-store.js";

const RECONNECT_DELAYS_MS = [0, 2000, 5000, 5000, 5000];
const RESTART_DELAY_MS = 5000;
const PRESENCE_INTERVAL_MS = 250;
const CURSOR_INTERVAL_MS = 50;
const CLOSE_GRACE_MS = 10 * 60 * 1000;
const RELEASE_GRACE_MS = 2000;

export const HUB_PATH = "/hubs/studio";

const offlineError = () => Object.assign(new Error("Bağlantı yok"), { offline: true });

const isUnauthorized = (error) => Number(error?.statusCode) === 401 || String(error?.message).includes("Status code '401'");

const NO_MEMBERS = [];

function createPresence() {
  const members = new Map();
  const listeners = new Set();

  return {
    get: (formId) => members.get(formId) ?? NO_MEMBERS,
    set(formId, list) {
      members.set(formId, Array.isArray(list) ? list : []);
      listeners.forEach((listener) => listener(formId));
    },
    clear(formId) {
      members.delete(formId);
      listeners.forEach((listener) => listener(formId));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

function createCursors() {
  const byForm = new Map();
  const listeners = new Set();
  const notify = (formId) => listeners.forEach((listener) => listener(formId));

  return {
    get: (formId) => byForm.get(formId) ?? new Map(),
    set(formId, cursor) {
      if (!cursor?.key) return;
      const cursors = byForm.get(formId) ?? new Map();
      byForm.set(formId, cursors);
      if (cursor.anchor) cursors.set(cursor.key, { anchor: cursor.anchor, x: Number(cursor.x) || 0, y: Number(cursor.y) || 0, userId: cursor.userId, at: Date.now() });
      else if (!cursors.delete(cursor.key)) return;
      notify(formId);
    },
    keep(formId, keys) {
      const cursors = byForm.get(formId);
      if (!cursors) return;
      const gone = [...cursors.keys()].filter((key) => !keys.has(key));
      gone.forEach((key) => cursors.delete(key));
      if (gone.length) notify(formId);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const NO_COMMENTS = { threads: [], unseen: false };

function createComments(userId) {
  const forms = new Map();
  const listeners = new Set();
  const read = (formId) => forms.get(formId) ?? NO_COMMENTS;
  const write = (formId, next) => {
    forms.set(formId, next);
    listeners.forEach((listener) => listener(formId));
  };

  return {
    get: read,
    load: (formId, threads) => write(formId, { ...read(formId), threads: Array.isArray(threads) ? threads : [] }),
    merge(formId, thread, fromHub = false) {
      const { threads, unseen } = read(formId);
      const lastOf = (item) => item?.comments?.[item.comments.length - 1] ?? null;
      const last = lastOf(thread);
      const isNews = fromHub && Boolean(last) && last.author?.id !== userId && lastOf(threads.find((item) => item.id === thread.id))?.id !== last.id;
      const rest = threads.filter((item) => item.id !== thread.id);
      write(formId, { threads: thread.comments?.length ? [...rest, thread] : rest, unseen: unseen || isNews });
    },
    seen(formId) {
      if (read(formId).unseen) write(formId, { ...read(formId), unseen: false });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function createStudioSession({ baseUrl, getToken, http, userId, onNotice = () => {}, onSessionExpired = () => {}, logLevel = LogLevel.Warning, transport }) {
  const docs = new Map();
  const loading = new Map();
  const presence = createPresence();
  const cursors = createCursors();
  const comments = createComments(userId);
  const statusListeners = new Set();
  const presenceQueue = new Map();
  const presenceStates = new Map();
  const cursorQueue = new Map();

  let status = "connecting";
  let stopped = false;
  let starting = null;
  let restartTimer = null;
  let presenceTimer = null;
  let cursorTimer = null;
  let releaseTimer = null;
  let holders = 0;
  let lastToken = null;
  let notify = onNotice;

  const connection = new HubConnectionBuilder()
    .withUrl(`${baseUrl}${HUB_PATH}`, {
      accessTokenFactory: async () => {
        lastToken = await getToken();
        return lastToken ?? "";
      },
      withCredentials: false,
      ...(transport ? { transport } : {}),
    })
    .withAutomaticReconnect(RECONNECT_DELAYS_MS)
    .configureLogging(logLevel)
    .build();

  function setStatus(next) {
    if (status === next) return;
    status = next;
    statusListeners.forEach((listener) => listener(next));
  }

  connection.on("Edits", (formId, edit) => {
    docs.get(formId)?.receive(edit);
  });
  connection.on("Published", (formId, published) => {
    docs.get(formId)?.onPublished(published);
  });
  connection.on("Team", (formId, team) => {
    docs.get(formId)?.onTeam(team);
  });
  connection.on("Presence", (formId, members) => {
    presence.set(formId, members);
    cursors.keep(formId, new Set((members ?? []).filter((member) => member.here).map((member) => member.key)));
  });
  connection.on("Cursor", (formId, cursor) => {
    cursors.set(formId, cursor);
  });
  connection.on("Comments", (formId, thread) => {
    if (thread) comments.merge(formId, thread, true);
  });

  connection.onreconnecting(() => {
    setStatus("reconnecting");
    docs.forEach((doc) => doc.setOnline(false));
  });

  connection.onreconnected(() => {
    setStatus("connected");
    docs.forEach((doc) => join(doc));
  });

  connection.onclose(() => {
    docs.forEach((doc) => doc.setOnline(false));
    if (stopped) return;
    setStatus("offline");
    clearTimeout(restartTimer);
    restartTimer = setTimeout(start, RESTART_DELAY_MS);
  });

  async function join(doc) {
    if (!doc.id || connection.state !== HubConnectionState.Connected) return null;
    try {
      const reply = await connection.invoke("Join", doc.id, doc.version);
      if (Number(reply?.status) === 200) {
        presence.set(doc.id, reply.data.members);
        http.comments?.(doc.id).then((threads) => comments.load(doc.id, threads), () => {});
        if (presenceStates.has(doc.id)) connection.send("Presence", doc.id, presenceStates.get(doc.id)).catch(() => {});
      }
      await doc.joined(reply);
      return reply;
    } catch {
      return null;
    }
  }

  async function start() {
    if (stopped || starting || connection.state !== HubConnectionState.Disconnected) return starting;
    setStatus("connecting");
    starting = connection.start()
      .then(() => {
        setStatus("connected");
        docs.forEach((doc) => join(doc));
      })
      .catch((error) => {
        setStatus("offline");
        if (isUnauthorized(error)) onSessionExpired(lastToken);
        clearTimeout(restartTimer);
        if (!stopped) restartTimer = setTimeout(start, RESTART_DELAY_MS);
      })
      .finally(() => { starting = null; });
    return starting;
  }

  const docTransport = {
    start: (document) => http.start(document),
    snapshot: (formId) => http.snapshot(formId),
    publish: (formId, workingVersion) => http.publish(formId, workingVersion),
    team: (formId, collaborators) => http.team(formId, collaborators),
    submit(formId, batch) {
      if (connection.state !== HubConnectionState.Connected) return Promise.reject(offlineError());
      return connection.invoke("Edit", formId, batch);
    },
    async join(formId) {
      const doc = docs.get(formId);
      if (!doc || connection.state !== HubConnectionState.Connected) throw offlineError();
      const reply = await connection.invoke("Join", formId, doc.version);
      if (Number(reply?.status) === 200) presence.set(formId, reply.data.members);
      return reply;
    },
  };

  function register(doc) {
    docs.set(doc.id, doc);
    join(doc);
    return doc;
  }

  function open(snapshot) {
    const formId = snapshot.form.id;
    const existing = docs.get(formId);
    if (existing) return existing;
    return register(createStudioDoc({ snapshot, userId, transport: docTransport, onNotice: (...args) => notify(...args) }));
  }

  function load(formId) {
    if (docs.has(formId)) return Promise.resolve(docs.get(formId));
    if (!loading.has(formId)) {
      const promise = http.snapshot(formId)
        .then((snapshot) => open(snapshot))
        .finally(() => loading.delete(formId));
      loading.set(formId, promise);
    }
    return loading.get(formId);
  }

  function create(initial, { onCreated } = {}) {
    return createStudioDoc({
      initial,
      userId,
      transport: docTransport,
      onNotice: (...args) => notify(...args),
      onCreated: (doc) => {
        register(doc);
        onCreated?.(doc);
      },
    });
  }

  function flushPresence() {
    presenceTimer = null;
    if (connection.state !== HubConnectionState.Connected) {
      presenceQueue.clear();
      return;
    }
    presenceQueue.forEach((state, formId) => {
      connection.send("Presence", formId, state).catch(() => {});
    });
    presenceQueue.clear();
  }

  function sendPresence(formId, state) {
    if (!formId) return;
    const next = { selection: state?.selection ?? [], editing: state?.editing ?? null, here: state?.here ?? true };
    presenceStates.set(formId, next);
    presenceQueue.set(formId, next);
    if (!presenceTimer) presenceTimer = setTimeout(flushPresence, PRESENCE_INTERVAL_MS);
  }

  const keepThread = (formId) => (thread) => {
    comments.merge(formId, thread);
    return thread;
  };

  const commentActions = {
    startThread: (formId, fieldId, body) => http.startThread(formId, fieldId, body).then(keepThread(formId)),
    replyThread: (formId, threadId, body) => http.replyThread(formId, threadId, body).then(keepThread(formId)),
    editComment: (formId, commentId, body) => http.editComment(formId, commentId, body).then(keepThread(formId)),
    deleteComment: (formId, commentId) => http.deleteComment(formId, commentId).then(keepThread(formId)),
    resolveThread: (formId, threadId, resolved) => http.resolveThread(formId, threadId, resolved).then(keepThread(formId)),
  };

  function flushCursors() {
    cursorTimer = null;
    if (connection.state === HubConnectionState.Connected) {
      cursorQueue.forEach((cursor, formId) => {
        connection.send("Cursor", formId, cursor).catch(() => {});
      });
    }
    cursorQueue.clear();
  }

  function sendCursor(formId, cursor) {
    if (!formId) return;
    cursorQueue.set(formId, cursor ?? { anchor: null, x: 0, y: 0 });
    if (!cursorTimer) cursorTimer = setTimeout(flushCursors, CURSOR_INTERVAL_MS);
  }

  async function close() {
    if (stopped) return;
    await Promise.all([...docs.values()].map((doc) => doc.whenSynced(CLOSE_GRACE_MS)));
    stopped = true;
    clearTimeout(restartTimer);
    clearTimeout(presenceTimer);
    clearTimeout(cursorTimer);
    docs.forEach((doc) => doc.dispose());
    docs.clear();
    await connection.stop().catch(() => {});
  }

  function restart() {
    if (stopped) return;
    clearTimeout(restartTimer);
    start();
  }

  function hold() {
    holders += 1;
    clearTimeout(releaseTimer);
    start();
  }

  function release() {
    holders = Math.max(0, holders - 1);
    if (holders > 0) return;
    clearTimeout(releaseTimer);
    releaseTimer = setTimeout(close, RELEASE_GRACE_MS);
  }

  return {
    open,
    load,
    create,
    get: (formId) => docs.get(formId) ?? null,
    docs: () => [...docs.values()],
    userId,
    presence,
    sendPresence,
    cursors,
    sendCursor,
    comments,
    ...commentActions,
    connectionId: () => connection.connectionId,
    status: () => status,
    onStatus(listener) {
      statusListeners.add(listener);
      return () => statusListeners.delete(listener);
    },
    restart,
    setNoticeHandler: (handler) => { notify = handler ?? onNotice; },
    hold,
    release,
    close,
  };
}
