import { DEMO_HEADER } from "./protocol";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const SESSION_PATH = "/api/auth/session";
const EMPTY_BODY = new Set([101, 204, 205, 304]);

const refused = () => new TypeError("Tanıtım ekranları dışarıya istek göndermez.");

function memoryStorage(initial) {
  const items = new Map(Object.entries(initial ?? {}).map(([key, value]) => [String(key), String(value)]));
  return {
    get length() {
      return items.size;
    },
    key: (index) => [...items.keys()][index] ?? null,
    getItem: (key) => items.get(String(key)) ?? null,
    setItem: (key, value) => void items.set(String(key), String(value)),
    removeItem: (key) => void items.delete(String(key)),
    clear: () => items.clear(),
  };
}

class SilentChannel {
  constructor(name) {
    this.name = String(name);
    this.onmessage = null;
  }
  postMessage() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
}

export function installSandbox(frame) {
  const own = window.location.origin;
  const api = new URL(API_URL, own).origin;
  const nativeFetch = window.fetch.bind(window);
  const urlOf = (input) => new URL(input instanceof Request ? input.url : String(input), window.location.href);
  const isApi = (url) => url.origin === api && (api !== own || /^\/(api|hubs)\//.test(url.pathname));
  const sameOrigin = (value) => {
    try {
      const url = new URL(String(value), window.location.href);
      return url.host === window.location.host && /^(https?|wss?):$/.test(url.protocol);
    } catch {
      return false;
    }
  };

  const answer = async (input, init) => {
    if (!frame.binding) throw refused();
    const request = new Request(input, init);
    const body = request.method === "GET" || request.method === "HEAD" ? null : await request.text();
    const reply = await frame.binding.request({ method: request.method, url: request.url, body: body || null });
    const status = Number(reply.status);
    return new Response(EMPTY_BODY.has(status) || reply.body == null ? null : String(reply.body), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  };

  const tagged = (input, init) => {
    const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
    headers.set(DEMO_HEADER, "1");
    return nativeFetch(input, { ...init, headers });
  };

  window.fetch = async (input, init) => {
    const url = urlOf(input);
    if (url.origin === own && url.pathname === SESSION_PATH) return answer(input, init);
    if (url.origin === own && url.pathname.startsWith("/api/auth/")) throw refused();
    if (isApi(url)) return answer(input, init);
    if (url.origin === own) return tagged(input, init);
    throw refused();
  };

  const open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function guardedOpen(method, url, ...rest) {
    if (!sameOrigin(url) || isApi(urlOf(url))) throw refused();
    return open.call(this, method, url, ...rest);
  };

  ["WebSocket", "EventSource"].forEach((name) => {
    const Native = window[name];
    if (!Native) return;
    window[name] = new Proxy(Native, {
      construct(target, args) {
        if (!sameOrigin(args[0])) throw refused();
        return Reflect.construct(target, args);
      },
    });
  });

  if (navigator.sendBeacon) {
    const beacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = (url, data) => sameOrigin(url) && beacon(url, data);
  }

  window.open = () => null;
  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (link && (!sameOrigin(link.href) || (link.target && link.target !== "_self"))) event.preventDefault();
  }, true);

  ["localStorage", "sessionStorage"].forEach((name) => {
    Object.defineProperty(window, name, { configurable: true, value: memoryStorage(frame.binding?.storage?.[name]) });
  });
  window.BroadcastChannel = SilentChannel;
}
